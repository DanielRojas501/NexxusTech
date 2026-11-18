import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import type Stripe from 'stripe';
import type { z } from 'zod';
import {
  createAccessToken,
  createPasswordResetToken,
  hashPassword,
  verifyAccessToken,
  verifyPasswordOrDummy,
} from './auth.js';
import { config } from './config.js';
import { canSendMail, sendPasswordResetEmail } from './mailer.js';
import {
  MAX_HOURLY_RATE_MXN,
  MIN_HOURLY_RATE_MXN,
  XP_REWARDS,
  ALLOWED_BOOKING_HOURS,
} from './pricing.js';
import { createRateLimiters } from './rateLimits.js';
import { getStripe, handleStripeEvent, fulfillCheckoutSession } from './stripeService.js';
import {
  awardXp,
  consume3DCredit,
  consumePasswordResetToken,
  createBooking,
  createDiagnosticResult,
  createGuestFeedback,
  createRecord,
  createTutorProfile,
  createUser,
  findUserByEmail,
  findUserById,
  getEntity,
  httpError,
  listEntities,
  publicUser,
  removeRecord,
  savePasswordResetToken,
  toClientRecord,
  touchStreak,
  updateOwnProfile,
  updatePasswordHash,
  updateRecord,
  utcToday,
  type UserRecord,
} from './store.js';
import {
  awardXpSchema,
  checkoutSchema,
  entityRules,
  feedbackSchema,
  firstIssueMessage,
  forgotPasswordSchema,
  isEntityName,
  loginSchema,
  profileUpdateSchema,
  registerSchema,
  resetPasswordSchema,
  verifySessionSchema,
  type EntityName,
} from './validation.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const frontendDist = fileURLToPath(new URL('../dist/', import.meta.url));

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function asyncRoute(handler: (req: Request, res: Response) => Promise<unknown> | unknown) {
  return (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(handler(req, res)).catch(next);
}

function requestData(req: Request): Record<string, unknown> {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw httpError(400, 'Request body must be a JSON object.');
  }
  return req.body as Record<string, unknown>;
}

function parseBody<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) throw httpError(400, firstIssueMessage(result.error));
  return result.data;
}

function entityParam(req: Request): EntityName {
  const name = String(req.params.entity);
  if (!isEntityName(name)) throw httpError(404, 'Unknown entity');
  return name;
}

/** Devuelve el usuario solo si el token es válido Y su versión de credenciales sigue vigente. */
function authenticate(req: Request): UserRecord | null {
  const header = req.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const claims = verifyAccessToken(header.slice(7));
  if (!claims) return null;
  const user = findUserById(claims.userId);
  return user && user.token_version === claims.tokenVersion ? user : null;
}

function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  req.userId = authenticate(req)?.id;
  next();
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Inicia sesión para continuar.' });
  req.userId = user.id;
  return next();
}

function sendAuthResponse(res: Response, user: UserRecord) {
  return res.json({ token: createAccessToken(user.id, user.token_version), user: publicUser(user) });
}

/** Mismo origen (la app servida por este mismo Express) o uno de los orígenes permitidos. */
function isAllowedOrigin(req: Request, origin: string): boolean {
  if (config.corsOrigins.includes(origin)) return true;
  try {
    return new URL(origin).host === req.host;
  } catch {
    return false;
  }
}

const CHECKOUT_MIN_CENTS = MIN_HOURLY_RATE_MXN * Math.min(...ALLOWED_BOOKING_HOURS) * 100;
const CHECKOUT_MAX_CENTS = MAX_HOURLY_RATE_MXN * Math.max(...ALLOWED_BOOKING_HOURS) * 100;
const checkoutBucket = () => Math.floor(Date.now() / (10 * 60_000));

// ---------------------------------------------------------------------------
// Aplicación
// ---------------------------------------------------------------------------
export function createApp() {
  const app = express();
  const limits = createRateLimiters();

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  // CSP desactivada por ahora: la SPA usa estilos en línea, Stripe y mapas. Activarla con
  // una política a medida es una tarea de la fase 2 (ver plan).
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

  // --- Webhook de Stripe: DEBE ir antes de express.json() (necesita el cuerpo crudo) ---
  app.post(
    '/api/stripe/webhook',
    express.raw({ type: 'application/json', limit: '1mb' }),
    asyncRoute(async (req, res) => {
      const stripe = getStripe();
      const secret = config.stripe.webhookSecret;
      if (!stripe || !secret) return res.status(503).json({ error: 'Webhook de Stripe no configurado.' });
      const signature = req.get('stripe-signature');
      if (!signature || !Buffer.isBuffer(req.body)) return res.status(400).json({ error: 'Firma ausente.' });
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, signature, secret);
      } catch {
        return res.status(400).json({ error: 'Firma inválida.' });
      }
      await handleStripeEvent(event); // si lanza, responde 500 y Stripe reintenta
      return res.json({ received: true });
    }),
  );

  // --- CORS (solo /api) -------------------------------------------------------
  app.use('/api', (req, res, next) => {
    const origin = req.get('origin');
    if (origin) {
      if (!isAllowedOrigin(req, origin)) return res.status(403).json({ error: 'Origin is not allowed.' });
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.setHeader('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  });

  // Healthcheck para la plataforma (Railway/Render); va tras CORS y antes del rate limit.
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api', express.json({ limit: '64kb' }));
  app.use('/api', limits.api);

  // ===========================================================================
  // Autenticación
  // ===========================================================================
  app.post('/api/auth/register', limits.register, asyncRoute(async (req, res) => {
    const { email, password } = parseBody(registerSchema, requestData(req));
    const user = createUser(email, await hashPassword(password));
    return sendAuthResponse(res.status(201), user);
  }));

  app.post(
    '/api/auth/login',
    limits.loginByIp,
    limits.loginByIpAndEmail,
    limits.loginByEmail,
    asyncRoute(async (req, res) => {
      const { email, password } = parseBody(loginSchema, requestData(req));
      const user = findUserByEmail(email);
      // Se ejecuta scrypt aunque la cuenta no exista (tiempo de respuesta uniforme).
      const valid = await verifyPasswordOrDummy(password, user?.password_hash);
      if (!user || !valid) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
      return sendAuthResponse(res, user);
    }),
  );

  app.get('/api/auth/me', requireAuth, (req, res) => {
    const user = findUserById(req.userId!);
    return user ? res.json(publicUser(user)) : res.status(401).json({ error: 'Sesión no válida.' });
  });

  /**
   * PATCH /api/auth/me — solo datos de perfil (lista blanca estricta).
   * Intentar enviar xp_points, level, subscription_status, is_tutor, role… devuelve 400.
   */
  app.patch('/api/auth/me', requireAuth, limits.writes, (req, res) => {
    const updates = parseBody(profileUpdateSchema, requestData(req));
    const user = updateOwnProfile(req.userId!, updates);
    return user ? res.json(publicUser(user)) : res.status(401).json({ error: 'Sesión no válida.' });
  });

  /**
   * POST /api/auth/forgot-password
   * - JAMÁS devuelve el enlace ni el token: solo se envía por correo.
   * - Respuesta idéntica exista o no la cuenta (sin enumeración de usuarios).
   * - Sin proveedor de correo responde 503 para TODAS las solicitudes por igual.
   */
  app.post('/api/auth/forgot-password', limits.forgotByIp, limits.forgotByEmail, asyncRoute(async (req, res) => {
    const { email } = parseBody(forgotPasswordSchema, requestData(req));
    if (!canSendMail()) {
      return res.status(503).json({ error: 'El restablecimiento por correo no está disponible por ahora.' });
    }
    const user = findUserByEmail(email);
    if (user) {
      const token = createPasswordResetToken();
      savePasswordResetToken(token, user.id, Date.now() + 30 * 60 * 1000);
      // El enlace se arma con APP_URL (config), nunca con cabeceras de la petición (anti Host-header injection).
      const resetUrl = `${config.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
      void sendPasswordResetEmail(user.email, resetUrl).catch((error: unknown) => {
        console.error('[auth] No se pudo enviar el correo de restablecimiento:', error instanceof Error ? error.message : error);
      });
    }
    return res.json({ ok: true });
  }));

  app.post('/api/auth/reset-password', limits.resetPassword, asyncRoute(async (req, res) => {
    const { token, password } = parseBody(resetPasswordSchema, requestData(req));
    const user = consumePasswordResetToken(token);
    if (!user) return res.status(400).json({ error: 'El enlace venció o ya fue utilizado.' });
    updatePasswordHash(user.id, await hashPassword(password)); // además revoca las sesiones activas
    return res.json({ ok: true });
  }));

  // ===========================================================================
  // Reglas de negocio que posee el servidor (antes eran PATCH /me del cliente)
  // ===========================================================================
  app.post('/api/functions/awardXp', requireAuth, limits.writes, (req, res) => {
    const input = parseBody(awardXpSchema, requestData(req));
    const user = findUserById(req.userId!)!;
    let amount: number;
    let once: 'diagnostic' | undefined;
    if (input.kind === 'exercise') {
      amount = XP_REWARDS.exercise;
    } else if (input.kind === 'diagnostic') {
      if (!user.diagnostics_completed) {
        return res.status(409).json({ error: 'Completa el diagnóstico antes de reclamar su recompensa.' });
      }
      amount = XP_REWARDS.diagnostic;
      once = 'diagnostic';
    } else {
      if (input.correct > input.total) return res.status(400).json({ error: 'correct no puede exceder total.' });
      amount = input.correct * XP_REWARDS.examPerCorrectAnswer;
    }
    return res.json(awardXp(user.id, amount, utcToday(), once));
  });

  app.post('/api/functions/touchStreak', requireAuth, limits.writes, (req, res) =>
    res.json({ streak_days: touchStreak(req.userId!, utcToday()) }));

  app.post('/api/functions/consume3DCredit', requireAuth, limits.writes, (req, res) =>
    res.json(consume3DCredit(req.userId!, utcToday())));

  // ===========================================================================
  // Funciones públicas / IA
  // ===========================================================================
  app.post('/api/functions/submitGuestFeedback', limits.feedback, (req, res) => {
    createGuestFeedback(parseBody(feedbackSchema, requestData(req)));
    return res.json({ ok: true });
  });

  app.post('/api/functions/profeBot', requireAuth, limits.profeBot, asyncRoute(async (req, res) => {
    const body = requestData(req);
    const question = typeof body.question === 'string' ? body.question.trim().slice(0, 400) : '';
    const context = typeof body.context === 'string' ? body.context.slice(0, 300) : '';
    const history = Array.isArray(body.history)
      ? body.history.slice(-6).map((item) => String(item).slice(0, 300))
      : [];
    if (question.length < 3) return res.status(400).json({ error: 'La pregunta debe tener al menos 3 caracteres.' });
    if (!config.ai.key) return res.status(503).json({ error: 'Configura AI_API_KEY para habilitar Profe Bot.' });

    const prompt = [
      'Eres "Profe Bot", un tutor socrático de matemáticas, física e ingeniería para estudiantes de primer año de universidad.',
      'Jamás des la solución final ni un resultado numérico; tampoco confirmes si un resultado del alumno es correcto.',
      'Responde con una o dos preguntas orientadoras cortas o una micro-pista conceptual de una línea.',
      'Responde en español, tono cercano y motivador, máximo 40 palabras.',
      context ? `CONTEXTO: ${context}` : '',
      history.length ? `CONVERSACIÓN RECIENTE: ${history.join(' | ')}` : '',
      `DUDA DEL ALUMNO: ${question}`,
    ].filter(Boolean).join('\n');
    const response = await fetch(config.ai.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.ai.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: config.ai.model, messages: [{ role: 'user', content: prompt }], max_tokens: 120 }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      console.error('AI provider returned status', response.status);
      return res.status(502).json({ error: 'El servicio de tutoría no está disponible.' });
    }
    const result = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
    const reply = result.choices?.[0]?.message?.content;
    if (typeof reply !== 'string') {
      return res.status(502).json({ error: 'El servicio de tutoría devolvió una respuesta no válida.' });
    }
    return res.json({ reply });
  }));

  // ===========================================================================
  // Entidades (CRUD genérico con lista blanca por entidad)
  // ===========================================================================
  app.use('/api/entities/:entity', optionalAuth);

  app.get('/api/entities/:entity', (req, res) => {
    const entity = entityParam(req);
    let query: unknown = {};
    if (typeof req.query.query === 'string') {
      try {
        query = JSON.parse(req.query.query);
      } catch {
        throw httpError(400, 'El parámetro query no es JSON válido.');
      }
    }
    if (!query || typeof query !== 'object' || Array.isArray(query)) {
      throw httpError(400, 'Entity query must be an object.');
    }
    const sort = typeof req.query.sort === 'string' ? req.query.sort : undefined;
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const skip = Math.max(Number(req.query.skip) || 0, 0);
    const records = listEntities(entity, req.userId ?? null, query as Record<string, unknown>, sort, limit, skip);
    return res.json(records.map(toClientRecord));
  });

  app.get('/api/entities/:entity/:id', (req, res) => {
    const entity = entityParam(req);
    const record = getEntity(entity, String(req.params.id), req.userId ?? null);
    return record ? res.json(toClientRecord(record)) : res.status(404).json({ error: 'Record not found.' });
  });

  app.post('/api/entities/:entity', requireAuth, limits.writes, (req, res) => {
    const entity = entityParam(req);
    const userId = req.userId!;
    const data = parseBody(entityRules[entity].create, requestData(req)) as Record<string, unknown>;
    let record;
    if (entity === 'Booking') {
      // Precio, comisión y estado SIEMPRE los calcula el servidor a partir de la tarifa del asesor.
      record = createBooking(userId, data as { tutor_id: string; subject?: string; date: string; hours: number });
    } else if (entity === 'TutorProfile') {
      record = createTutorProfile(userId, data);
    } else if (entity === 'DiagnosticResult') {
      record = createDiagnosticResult(userId, data);
    } else {
      record = createRecord(entity, userId, data);
    }
    return res.status(201).json(toClientRecord(record));
  });

  app.patch('/api/entities/:entity/:id', requireAuth, limits.writes, (req, res) => {
    const entity = entityParam(req);
    const data = parseBody(entityRules[entity].update, requestData(req)) as Record<string, unknown>;
    const record = updateRecord(entity, String(req.params.id), req.userId!, data);
    return record ? res.json(toClientRecord(record)) : res.status(404).json({ error: 'Record not found.' });
  });

  app.delete('/api/entities/:entity/:id', requireAuth, limits.writes, (req, res) => {
    const entity = entityParam(req);
    return removeRecord(entity, String(req.params.id), req.userId!)
      ? res.sendStatus(204)
      : res.status(404).json({ error: 'Record not found.' });
  });

  // ===========================================================================
  // Pagos (Stripe)
  // ===========================================================================
  app.post('/api/functions/createCheckoutSession', requireAuth, limits.checkout, asyncRoute(async (req, res) => {
    const body = parseBody(checkoutSchema, requestData(req));
    const stripe = getStripe();
    if (!stripe) return res.status(503).json({ error: 'Los pagos no están configurados.' });
    const user = findUserById(req.userId!)!;
    const metadata = { kind: body.kind, user_id: user.id };
    let session: Stripe.Checkout.Session;

    if (body.kind === 'premium') {
      if (user.subscription_status === 'premium') {
        return res.status(409).json({ error: 'Ya tienes Premium activo.' });
      }
      const price = body.interval === 'annual' ? config.stripe.priceAnnual : config.stripe.priceMonthly;
      if (!price) return res.status(503).json({ error: 'Los precios de Premium no están configurados.' });
      session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price, quantity: 1 }],
        ...(user.stripe_customer_id ? { customer: user.stripe_customer_id } : { customer_email: user.email }),
        client_reference_id: user.id,
        metadata,
        subscription_data: { metadata },
        // El marcador {CHECKOUT_SESSION_ID} va literal: URLSearchParams lo codificaría y Stripe no lo sustituiría.
        success_url: `${config.appUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.appUrl}/`,
      }, { idempotencyKey: `premium:${user.id}:${body.interval}:${checkoutBucket()}` });
    } else {
      const booking = getEntity('Booking', body.booking_id, user.id);
      if (!booking || booking.status !== 'pending') return res.status(404).json({ error: 'Booking is unavailable.' });
      // El monto sale del registro calculado por el servidor, no de lo que mande el cliente.
      const cents = Math.round(Number(booking.total_amount) * 100);
      if (!Number.isInteger(cents) || cents < CHECKOUT_MIN_CENTS || cents > CHECKOUT_MAX_CENTS) {
        return res.status(400).json({ error: 'Booking amount is invalid.' });
      }
      session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
          quantity: 1,
          price_data: {
            currency: 'mxn',
            unit_amount: cents,
            product_data: { name: `Asesoría de ingeniería · ${String(booking.tutor_name || 'Asesor').slice(0, 80)}` },
          },
        }],
        customer_email: user.email,
        client_reference_id: user.id,
        metadata: { ...metadata, booking_id: booking.id },
        success_url: `${config.appUrl}/asesores?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.appUrl}/asesores`,
      }, { idempotencyKey: `booking:${booking.id}:${cents}:${checkoutBucket()}` });
    }
    return res.json({ url: session.url, id: session.id });
  }));

  /** Confirmación inmediata al volver de Stripe. El webhook sigue siendo la fuente de verdad. */
  app.post('/api/functions/verifyStripeSession', requireAuth, limits.checkout, asyncRoute(async (req, res) => {
    const { session_id: sessionId } = parseBody(verifySessionSchema, requestData(req));
    const stripe = getStripe();
    if (!stripe) return res.status(503).json({ error: 'Los pagos no están configurados.' });
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch {
      return res.status(404).json({ error: 'Sesión de pago no encontrada.' });
    }
    if (session.metadata?.user_id !== req.userId) {
      return res.status(403).json({ error: 'La sesión no pertenece a este usuario.' });
    }
    const result = await fulfillCheckoutSession(session, Math.floor(Date.now() / 1000));
    return result.ok
      ? res.json({ ok: true, kind: result.kind })
      : res.json({ ok: false, status: session.payment_status });
  }));

  // ===========================================================================
  // Frontend estático + manejo de errores
  // ===========================================================================
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res, next) => {
    res.sendFile(join(frontendDist, 'index.html'), (error) => {
      if (error) next(error);
    });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const raw = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : 500;
    const status = raw >= 400 && raw <= 599 ? raw : 500;
    if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'El cuerpo no es JSON válido.' });
    }
    if (status >= 500) {
      console.error('API request failed:', error);
      // Nunca filtramos mensajes internos (rutas, SDKs, stack) al cliente.
      return res.status(status).json({ error: 'Error interno del servidor.' });
    }
    return res.status(status).json({ error: error instanceof Error ? error.message : 'Solicitud inválida.' });
  });

  return app;
}
