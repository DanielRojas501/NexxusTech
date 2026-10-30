import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import Stripe from 'stripe';
import {
  createAccessToken,
  createPasswordResetToken,
  hashPassword,
  verifyAccessToken,
  verifyPassword,
} from './auth.js';
import {
  consumePasswordResetToken,
  confirmBookingPayment,
  createEntity,
  createUser,
  findUserByEmail,
  findUserById,
  getEntity,
  listEntities,
  publicUser,
  removeEntity,
  savePasswordResetToken,
  updateEntity,
  updatePasswordHash,
  updateUser,
} from './store.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendDist = fileURLToPath(new URL('../dist/', import.meta.url));
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin) {
    if (!allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: 'Origin is not allowed.' });
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});

app.use(express.json({ limit: '64kb' }));

function asyncRoute(
  handler: (req: Request, res: Response) => Promise<unknown> | unknown,
) {
  return (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(handler(req, res)).catch(next);
}

function requestData(req: Request): Record<string, unknown> {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    const error = new Error('Request body must be a JSON object.');
    Object.assign(error, { status: 400 });
    throw error;
  }
  return req.body as Record<string, unknown>;
}

function requireString(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    const error = new Error(`${name} is required.`);
    Object.assign(error, { status: 400 });
    throw error;
  }
  return value.trim();
}

function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authorization = req.get('authorization');
  if (authorization?.startsWith('Bearer ')) {
    req.userId = verifyAccessToken(authorization.slice(7)) || undefined;
  }
  return next();
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  optionalAuth(req, res, () => {
    if (!req.userId || !findUserById(req.userId)) {
      return res.status(401).json({ error: 'Inicia sesión para continuar.' });
    }
    return next();
  });
}

function sendAuthResponse(
  res: Response,
  user: { id: string; email: string; password_hash: string },
) {
  return res.json({ token: createAccessToken(user.id), user: publicUser(user) });
}

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const body = requestData(req);
  const email = requireString(body.email, 'Email').toLowerCase();
  const password = requireString(body.password, 'Password');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'La contraseña debe tener entre 8 y 128 caracteres.' });
  }
  const user = createUser(email, await hashPassword(password));
  return sendAuthResponse(res.status(201), user);
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const body = requestData(req);
  const email = requireString(body.email, 'Email').toLowerCase();
  const password = requireString(body.password, 'Password');
  const user = findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  }
  return sendAuthResponse(res, user);
}));

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = findUserById(req.userId!);
  return user ? res.json(publicUser(user)) : res.status(401).json({ error: 'Sesión no válida.' });
});

app.patch('/api/auth/me', requireAuth, (req, res) => {
  const user = updateUser(req.userId!, requestData(req));
  return user ? res.json(publicUser(user)) : res.status(401).json({ error: 'Sesión no válida.' });
});

app.post('/api/auth/forgot-password', asyncRoute(async (req, res) => {
  const email = requireString(requestData(req).email, 'Email').toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
  }
  if (process.env.NODE_ENV === 'production') {
    return res.status(501).json({ error: 'Configura un proveedor de correo para restablecer contraseñas.' });
  }
  const user = findUserByEmail(email);
  if (!user) return res.json({ ok: true });

  const token = createPasswordResetToken();
  savePasswordResetToken(token, user.id, Date.now() + 30 * 60 * 1000);
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  return res.json({ ok: true, resetUrl: `${appUrl}/reset-password?token=${encodeURIComponent(token)}` });
}));

app.post('/api/auth/reset-password', asyncRoute(async (req, res) => {
  const body = requestData(req);
  const token = requireString(body.token, 'Token');
  const password = requireString(body.password, 'Password');
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'La contraseña debe tener entre 8 y 128 caracteres.' });
  }
  const user = consumePasswordResetToken(token);
  if (!user) return res.status(400).json({ error: 'El enlace venció o ya fue utilizado.' });
  updatePasswordHash(user.id, await hashPassword(password));
  return res.json({ ok: true });
}));

app.post('/api/functions/submitGuestFeedback', asyncRoute((req, res) => {
  const body = requestData(req);
  const rating = Number(body.rating);
  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
  const screenName = typeof body.screen_name === 'string' ? body.screen_name.trim().slice(0, 120) : '';
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'La calificación debe ser un entero entre 1 y 5.' });
  }
  if (comment.length < 3 || comment.length > 1000) {
    return res.status(400).json({ error: 'El comentario debe tener entre 3 y 1000 caracteres.' });
  }
  createEntity('GuestFeedback', null, { rating, comment, screen_name: screenName });
  return res.json({ ok: true });
}));

app.post('/api/functions/profeBot', requireAuth, asyncRoute(async (req, res) => {
  const body = requestData(req);
  const question = typeof body.question === 'string' ? body.question.trim().slice(0, 400) : '';
  const context = typeof body.context === 'string' ? body.context.slice(0, 300) : '';
  const history = Array.isArray(body.history)
    ? body.history.slice(-6).map((item) => String(item).slice(0, 300))
    : [];
  if (question.length < 3) {
    return res.status(400).json({ error: 'La pregunta debe tener al menos 3 caracteres.' });
  }
  if (!process.env.AI_API_KEY) {
    return res.status(503).json({ error: 'Configura AI_API_KEY para habilitar Profe Bot.' });
  }

  const prompt = [
    'Eres "Profe Bot", un tutor socrático de matemáticas, física e ingeniería para estudiantes de primer año de universidad.',
    'Jamás des la solución final ni un resultado numérico; tampoco confirmes si un resultado del alumno es correcto.',
    'Responde con una o dos preguntas orientadoras cortas o una micro-pista conceptual de una línea.',
    'Responde en español, tono cercano y motivador, máximo 40 palabras.',
    context ? `CONTEXTO: ${context}` : '',
    history.length ? `CONVERSACIÓN RECIENTE: ${history.join(' | ')}` : '',
    `DUDA DEL ALUMNO: ${question}`,
  ].filter(Boolean).join('\n');
  const aiUrl = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
  const response = await fetch(aiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 120,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    console.error('AI provider returned status', response.status);
    return res.status(502).json({ error: 'El servicio de tutoría no está disponible.' });
  }
  const result = await response.json() as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const reply = result.choices?.[0]?.message?.content;
  if (typeof reply !== 'string') {
    return res.status(502).json({ error: 'El servicio de tutoría devolvió una respuesta no válida.' });
  }
  return res.json({ reply });
}));

app.use('/api/entities/:entity', optionalAuth);
app.get('/api/entities/:entity', (req, res, next) => {
  try {
    const entity = requireString(req.params.entity, 'Entity');
    const rawQuery = req.query.query;
    const query = typeof rawQuery === 'string' ? JSON.parse(rawQuery) : {};
    if (!query || typeof query !== 'object' || Array.isArray(query)) {
      return res.status(400).json({ error: 'Entity query must be an object.' });
    }
    const sort = typeof req.query.sort === 'string' ? req.query.sort : undefined;
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const skip = Math.max(Number(req.query.skip) || 0, 0);
    return res.json(listEntities(entity, req.userId || null, query, sort, limit, skip));
  } catch (error) {
    return next(error);
  }
});

app.get('/api/entities/:entity/:id', (req, res, next) => {
  try {
    const entity = requireString(req.params.entity, 'Entity');
    const id = requireString(req.params.id, 'Id');
    const record = getEntity(entity, id, req.userId || null);
    return record ? res.json(record) : res.status(404).json({ error: 'Record not found.' });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/entities/:entity', requireAuth, (req, res, next) => {
  try {
    const entity = requireString(req.params.entity, 'Entity');
    return res.status(201).json(createEntity(entity, req.userId!, requestData(req)));
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/entities/:entity/:id', requireAuth, (req, res, next) => {
  try {
    const entity = requireString(req.params.entity, 'Entity');
    const id = requireString(req.params.id, 'Id');
    const record = updateEntity(entity, id, req.userId!, requestData(req));
    return record ? res.json(record) : res.status(404).json({ error: 'Record not found.' });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/entities/:entity/:id', requireAuth, (req, res, next) => {
  try {
    const entity = requireString(req.params.entity, 'Entity');
    const id = requireString(req.params.id, 'Id');
    return removeEntity(entity, id, req.userId!)
      ? res.sendStatus(204)
      : res.status(404).json({ error: 'Record not found.' });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/functions/createCheckoutSession', requireAuth, asyncRoute(async (req, res) => {
  const body = requestData(req);
  const kind = body.kind;
  if (kind !== 'premium' && kind !== 'booking') {
    return res.status(400).json({ error: 'Invalid checkout kind.' });
  }
  const appUrl = process.env.APP_URL;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!appUrl || !secretKey) {
    return res.status(503).json({ error: 'Configura APP_URL y STRIPE_SECRET_KEY.' });
  }
  const stripe = new Stripe(secretKey);
  const user = findUserById(req.userId!)!;
  const metadata = { kind, user_id: user.id };
  const idempotencyKey = randomUUID();
  let session: Stripe.Checkout.Session;

  if (kind === 'premium') {
    const prices = {
      monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_1UQXx8Q1lPN6mQuim3jutsuq',
      annual: process.env.STRIPE_PRICE_ANNUAL || 'price_1UQXx9Q1lPN6mQuiwDmDGUFP',
    };
    session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: body.interval === 'annual' ? prices.annual : prices.monthly, quantity: 1 }],
      customer_email: user.email,
      metadata,
      subscription_data: { metadata },
      success_url: `${new URL('/', appUrl)}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: new URL('/', appUrl).toString(),
    }, { idempotencyKey });
  } else {
    const bookingId = requireString(body.booking_id, 'booking_id');
    const booking = getEntity('Booking', bookingId, user.id);
    if (!booking || booking.status !== 'pending') {
      return res.status(404).json({ error: 'Booking is unavailable.' });
    }
    const amount = Number(booking.total_amount);
    if (!Number.isFinite(amount) || amount < 50 || amount > 100000) {
      return res.status(400).json({ error: 'Booking amount is invalid.' });
    }
    const successUrl = new URL('/asesores', appUrl);
    successUrl.searchParams.set('checkout', 'success');
    successUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'mxn',
          unit_amount: Math.round(amount * 100),
          product_data: { name: `Asesoría de ingeniería · ${String(booking.tutor_name || 'Asesor').slice(0, 80)}` },
        },
      }],
      customer_email: user.email,
      metadata: { ...metadata, booking_id: bookingId },
      success_url: successUrl.toString(),
      cancel_url: new URL('/asesores', appUrl).toString(),
    }, { idempotencyKey });
  }
  return res.json({ url: session.url, id: session.id });
}));

app.post('/api/functions/verifyStripeSession', requireAuth, asyncRoute(async (req, res) => {
  const sessionId = requireString(requestData(req).session_id, 'session_id');
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Configura STRIPE_SECRET_KEY.' });
  }
  const session = await new Stripe(process.env.STRIPE_SECRET_KEY)
    .checkout.sessions.retrieve(sessionId);
  const metadata = session.metadata;
  if (!metadata || metadata.user_id !== req.userId) {
    return res.status(403).json({ error: 'La sesión no pertenece a este usuario.' });
  }
  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    return res.json({ ok: false, status: session.payment_status });
  }
  if (metadata.kind === 'premium') {
    updateUser(req.userId!, { subscription_status: 'premium' });
    return res.json({ ok: true, kind: 'premium' });
  }
  if (metadata.kind === 'booking' && metadata.booking_id) {
    const booking = confirmBookingPayment(metadata.booking_id, req.userId!, session.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    return res.json({ ok: true, kind: 'booking' });
  }
  return res.status(400).json({ error: 'Unknown checkout kind.' });
}));

app.use(express.static(frontendDist));
app.get(/^(?!\/api(?:\/|$)).*/, (_req, res, next) => {
  res.sendFile(join(frontendDist, 'index.html'), (error) => {
    if (error) next(error);
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status = typeof error === 'object' && error !== null && 'status' in error
    ? Number(error.status)
    : 500;
  if (status >= 500) console.error('API request failed:', error);
  return res.status(status >= 400 && status <= 599 ? status : 500).json({
    error: error instanceof Error ? error.message : 'Internal server error.',
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API server listening on port ${port}`);
});
