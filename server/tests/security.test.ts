/**
 * Pruebas de regresión de seguridad. Cada caso reproduce un ataque del diagnóstico
 * original y comprueba que el servidor lo rechaza.
 * Ejecutar con:  npm run test:server
 */
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import Stripe from 'stripe';

// El entorno se fija ANTES de importar cualquier módulo del servidor.
const JWT_SECRET = 'test-secret-'.padEnd(48, 'x');
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = join(mkdtempSync(join(tmpdir(), 'nexxus-')), 'db.json');
process.env.JWT_SECRET = JWT_SECRET;
process.env.APP_URL = 'https://app.example.com';
process.env.CORS_ORIGIN = 'https://extra.example.com';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
process.env.STRIPE_PRICE_MONTHLY = 'price_monthly_test';
process.env.STRIPE_PRICE_ANNUAL = 'price_annual_test';

const { createApp } = await import('../app.js');
const { setResetEmailTransport } = await import('../mailer.js');
const store = await import('../store.js');
const { createAccessToken } = await import('../auth.js');

let baseUrl = '';
let server: ReturnType<ReturnType<typeof createApp>['listen']>;
const sentEmails: Array<{ to: string; resetUrl: string }> = [];

before(() => {
  setResetEmailTransport(async (to, resetUrl) => {
    sentEmails.push({ to, resetUrl });
  });
  server = createApp().listen(0);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => server.close());

interface Reply { status: number; body: any; headers: Headers }
async function call(
  method: string,
  path: string,
  options: { token?: string; body?: unknown; headers?: Record<string, string>; raw?: string } = {},
): Promise<Reply> {
  const headers: Record<string, string> = { ...options.headers };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.body !== undefined || options.raw !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: options.raw ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
  });
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: response.status, body, headers: response.headers };
}

let counter = 0;
async function register(prefix = 'user') {
  const email = `${prefix}${++counter}@example.com`;
  const reply = await call('POST', '/api/auth/register', { body: { email, password: 'Sup3rSecret!' } });
  assert.equal(reply.status, 201, JSON.stringify(reply.body));
  return { email, token: reply.body.token as string, id: reply.body.user.id as string };
}

const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
function forgeToken(secret: string, claims: Record<string, unknown>, header: object = { alg: 'HS256', typ: 'JWT' }) {
  const unsigned = `${b64(header)}.${b64(claims)}`;
  return `${unsigned}.${createHmac('sha256', secret).update(unsigned).digest('base64url')}`;
}

// ---------------------------------------------------------------------------
describe('1. Asignación masiva en PATCH /api/auth/me', () => {
  it('rechaza campos privilegiados y no modifica nada', async () => {
    const { token, id } = await register();
    for (const payload of [
      { subscription_status: 'premium' },
      { xp_points: 999999 },
      { level: 99 },
      { is_tutor: true },
      { daily_3d_credits: -100 },
      { role: 'admin' },
      { full_name: 'Ok', subscription_status: 'premium' }, // mezclado con un campo válido
    ]) {
      const reply = await call('PATCH', '/api/auth/me', { token, body: payload });
      assert.equal(reply.status, 400, `debería rechazar ${JSON.stringify(payload)}`);
    }
    const me = await call('GET', '/api/auth/me', { token });
    assert.equal(me.body.subscription_status, 'free');
    assert.equal(me.body.xp_points, 0);
    assert.equal(me.body.is_tutor, false);
    assert.equal(me.body.role, 'user');
    assert.equal(store.findUserById(id)?.subscription_status, 'free');
  });

  it('permite editar el nombre y la respuesta no expone campos internos', async () => {
    const { token } = await register();
    const reply = await call('PATCH', '/api/auth/me', { token, body: { full_name: 'Daniel R.' } });
    assert.equal(reply.status, 200);
    assert.equal(reply.body.full_name, 'Daniel R.');
    for (const hidden of ['password_hash', 'token_version', 'stripe_customer_id', 'xp_today']) {
      assert.ok(!(hidden in reply.body), `${hidden} no debe salir al cliente`);
    }
  });
});

// ---------------------------------------------------------------------------
describe('2. Restablecimiento de contraseña', () => {
  it('nunca devuelve el enlace/token en la respuesta y es idéntica exista o no la cuenta', async () => {
    const { email } = await register('reset');
    const real = await call('POST', '/api/auth/forgot-password', { body: { email } });
    const ghost = await call('POST', '/api/auth/forgot-password', { body: { email: 'nadie-existe@example.com' } });
    assert.equal(real.status, 200);
    assert.deepEqual(real.body, { ok: true });
    assert.deepEqual(ghost.body, { ok: true });
    assert.ok(!JSON.stringify(real.body).includes('token'));
    assert.ok(!JSON.stringify(real.body).includes('resetUrl'));
    await new Promise((resolve) => setImmediate(resolve));
    assert.ok(sentEmails.some((m) => m.to === email), 'el enlace debe viajar por correo');
    assert.ok(!sentEmails.some((m) => m.to === 'nadie-existe@example.com'));
  });

  it('el token es de un solo uso, vence las sesiones previas y el enlace usa APP_URL', async () => {
    const { email, token: oldSession } = await register('flow');
    await call('POST', '/api/auth/forgot-password', { body: { email } });
    await new Promise((resolve) => setImmediate(resolve));
    const mail = sentEmails.filter((m) => m.to === email).at(-1)!;
    assert.ok(mail.resetUrl.startsWith('https://app.example.com/reset-password?token='));
    const resetToken = new URL(mail.resetUrl).searchParams.get('token')!;

    const done = await call('POST', '/api/auth/reset-password', { body: { token: resetToken, password: 'NuevaClave#2026' } });
    assert.equal(done.status, 200);
    const reuse = await call('POST', '/api/auth/reset-password', { body: { token: resetToken, password: 'OtraClave#2026' } });
    assert.equal(reuse.status, 400, 'el token no puede reutilizarse');

    const stale = await call('GET', '/api/auth/me', { token: oldSession });
    assert.equal(stale.status, 401, 'la sesión anterior al cambio de contraseña queda revocada');
    const login = await call('POST', '/api/auth/login', { body: { email, password: 'NuevaClave#2026' } });
    assert.equal(login.status, 200);
  });
});

// ---------------------------------------------------------------------------
describe('3. Validación del JWT', () => {
  it('rechaza tokens forjados con el antiguo secreto estático', async () => {
    const { id } = await register();
    const now = Math.floor(Date.now() / 1000);
    const claims = { sub: id, iat: now, exp: now + 3600, iss: 'nexxustech', aud: 'nexxustech-web', pwv: 0 };
    const forged = forgeToken('local-development-secret-change-before-deployment', claims);
    assert.equal((await call('GET', '/api/auth/me', { token: forged })).status, 401);
  });

  it('rechaza alg=none, claims faltantes, expirados y firmas alteradas', async () => {
    const { id, token } = await register();
    const now = Math.floor(Date.now() / 1000);
    const good = { sub: id, iat: now, exp: now + 3600, iss: 'nexxustech', aud: 'nexxustech-web', pwv: 0 };
    const cases: Record<string, string> = {
      'alg none': `${b64({ alg: 'none', typ: 'JWT' })}.${b64(good)}.`,
      'alg HS512 declarado': forgeToken(JWT_SECRET, good, { alg: 'HS512', typ: 'JWT' }),
      'sin aud/iss/pwv (formato antiguo)': forgeToken(JWT_SECRET, { sub: id, iat: now, exp: now + 3600 }),
      'expirado': forgeToken(JWT_SECRET, { ...good, exp: now - 10 }),
      'iat en el futuro': forgeToken(JWT_SECRET, { ...good, iat: now + 99999 }),
      'audiencia ajena': forgeToken(JWT_SECRET, { ...good, aud: 'otra-app' }),
      'payload alterado': `${token.split('.')[0]}.${b64({ ...good, sub: 'otro-usuario' })}.${token.split('.')[2]}`,
    };
    for (const [name, candidate] of Object.entries(cases)) {
      assert.equal((await call('GET', '/api/auth/me', { token: candidate })).status, 401, name);
    }
    assert.equal((await call('GET', '/api/auth/me', { token: forgeToken(JWT_SECRET, good) })).status, 200, 'control: el token legítimo sí pasa');
  });

  it('el servidor se niega a arrancar sin JWT_SECRET válido (sin respaldo estático)', () => {
    const run = (env: Record<string, string>) =>
      spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', "await import('./server/config.ts')"], {
        cwd: join(import.meta.dirname, '..', '..'),
        env: { PATH: process.env.PATH ?? '', ...env },
        encoding: 'utf8',
      });
    const base = { APP_URL: 'https://app.example.com', DATABASE_PATH: '/tmp/x.json' };
    const missing = run({ ...base }); // NODE_ENV sin definir → producción por defecto
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /JWT_SECRET/);
    const placeholder = run({ ...base, JWT_SECRET: 'replace_with_a_random_secret_at_least_32_characters' });
    assert.notEqual(placeholder.status, 0);
    const short = run({ ...base, JWT_SECRET: 'corto' });
    assert.notEqual(short.status, 0);
    const ok = run({ ...base, JWT_SECRET: 'a'.repeat(48) });
    assert.equal(ok.status, 0, ok.stderr);
  });
});

// ---------------------------------------------------------------------------
describe('4. Manipulación de reservas (Bookings)', () => {
  async function tutorWithRate(rate: number) {
    const tutor = await register('tutor');
    const profile = await call('POST', '/api/entities/TutorProfile', {
      token: tutor.token,
      body: {
        full_name: 'Ing. Prueba', bio: 'b', subjects_offered: ['calculo', 'estatica'], hourly_rate: rate,
        verified: true, sponsored: true, rating: 5, total_sessions: 999, // intento de autoascenso
      },
    });
    assert.equal(profile.status, 201, JSON.stringify(profile.body));
    return { tutor, profile: profile.body };
  }
  const futureDate = () => new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);

  it('el precio, la comisión y el estado los fija el servidor, no el cliente', async () => {
    const { profile } = await tutorWithRate(400);
    const student = await register('student');
    const reply = await call('POST', '/api/entities/Booking', {
      token: student.token,
      body: {
        tutor_id: profile.id, subject: 'calculo', date: futureDate(), hours: 1.5,
        status: 'confirmed', total_amount: 50, platform_commission: 0, stripe_session_id: 'cs_fake', tutor_name: 'Otro',
      },
    });
    assert.equal(reply.status, 201, JSON.stringify(reply.body));
    assert.equal(reply.body.status, 'pending');
    assert.equal(reply.body.total_amount, 600); // 400 MXN/h × 1.5 h
    assert.equal(reply.body.platform_commission, 90); // 15 %
    assert.equal(reply.body.tutor_name, 'Ing. Prueba');
    assert.equal(reply.body.stripe_session_id, undefined);
  });

  it('PATCH no puede bajar el precio ni cambiar estado/asesor', async () => {
    const { profile } = await tutorWithRate(300);
    const student = await register('student');
    const booking = (await call('POST', '/api/entities/Booking', {
      token: student.token, body: { tutor_id: profile.id, date: futureDate(), hours: 1 },
    })).body;
    const patched = await call('PATCH', `/api/entities/Booking/${booking.id}`, {
      token: student.token,
      body: { total_amount: 1, platform_commission: 0, status: 'confirmed', tutor_id: 'otro', hours: 2 },
    });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.total_amount, 300);
    assert.equal(patched.body.status, 'pending');
    assert.equal(patched.body.tutor_id, profile.id);
    assert.equal(patched.body.hours, 1);
  });

  it('valida duración, fecha, materia, auto-reserva y un perfil por asesor', async () => {
    const { tutor, profile } = await tutorWithRate(200);
    const student = await register('student');
    const book = (body: object, token = student.token) => call('POST', '/api/entities/Booking', { token, body });
    assert.equal((await book({ tutor_id: profile.id, date: futureDate(), hours: 0.01 })).status, 400);
    assert.equal((await book({ tutor_id: profile.id, date: '2001-01-01', hours: 1 })).status, 400);
    assert.equal((await book({ tutor_id: profile.id, date: futureDate(), hours: 1, subject: 'quimica' })).status, 400);
    assert.equal((await book({ tutor_id: 'no-existe', date: futureDate(), hours: 1 })).status, 404);
    assert.equal((await book({ tutor_id: profile.id, date: futureDate(), hours: 1 }, tutor.token)).status, 400, 'no puede reservarse a sí mismo');
    const dup = await call('POST', '/api/entities/TutorProfile', {
      token: tutor.token, body: { full_name: 'Duplicado', subjects_offered: ['x'], hourly_rate: 100 },
    });
    assert.equal(dup.status, 409);
  });

  it('el perfil de asesor no puede autoverificarse y marca is_tutor en el servidor', async () => {
    const { tutor, profile } = await tutorWithRate(250);
    assert.equal(profile.verified, false);
    assert.equal(profile.sponsored, false);
    assert.equal(profile.rating, 0);
    assert.equal(profile.total_sessions, 0);
    assert.equal((await call('GET', '/api/auth/me', { token: tutor.token })).body.is_tutor, true);
    const upd = await call('PATCH', `/api/entities/TutorProfile/${profile.id}`, {
      token: tutor.token, body: { verified: true, rating: 5, bio: 'nueva bio' },
    });
    assert.equal(upd.body.verified, false);
    assert.equal(upd.body.bio, 'nueva bio');
  });

  it('una reserva pagada no se puede borrar ni editar', async () => {
    const { profile } = await tutorWithRate(500);
    const student = await register('student');
    const booking = (await call('POST', '/api/entities/Booking', {
      token: student.token, body: { tutor_id: profile.id, date: futureDate(), hours: 1 },
    })).body;
    assert.equal(store.confirmBookingPayment(booking.id, student.id, 'cs_ok', 49_999), 'amount_mismatch', 'monto distinto no confirma');
    assert.equal(store.confirmBookingPayment(booking.id, student.id, 'cs_ok', 50_000), 'confirmed');
    assert.equal((await call('DELETE', `/api/entities/Booking/${booking.id}`, { token: student.token })).status, 409);
    assert.equal((await call('PATCH', `/api/entities/Booking/${booking.id}`, { token: student.token, body: { date: futureDate() } })).status, 409);
  });
});

// ---------------------------------------------------------------------------
describe('5. Fuerza bruta en el login', () => {
  it('bloquea con 429 tras demasiados intentos fallidos de una misma cuenta', async () => {
    const { email } = await register('brute');
    const statuses: number[] = [];
    for (let i = 0; i < 12; i += 1) {
      statuses.push((await call('POST', '/api/auth/login', { body: { email, password: `mala-${i}-clave` } })).status);
    }
    assert.deepEqual(statuses.slice(0, 8), Array(8).fill(401));
    assert.ok(statuses.slice(8).every((s) => s === 429), `esperaba 429 tras 8 fallos: ${statuses}`);
    // Aun con la contraseña correcta, mientras dure el bloqueo no entra.
    assert.equal((await call('POST', '/api/auth/login', { body: { email, password: 'Sup3rSecret!' } })).status, 429);
  });

  it('un login correcto no consume el cupo de fallos', async () => {
    const { email } = await register('okay');
    for (let i = 0; i < 12; i += 1) {
      assert.equal((await call('POST', '/api/auth/login', { body: { email, password: 'Sup3rSecret!' } })).status, 200);
    }
  });
});

// ---------------------------------------------------------------------------
describe('6. CORS y errores', () => {
  it('permite mismo origen y orígenes configurados; bloquea el resto', async () => {
    const own = new URL(baseUrl).origin;
    assert.equal((await call('GET', '/api/health', { headers: { Origin: own } })).status, 200, 'mismo origen (app servida por Express)');
    const extra = await call('GET', '/api/health', { headers: { Origin: 'https://extra.example.com' } });
    assert.equal(extra.status, 200);
    assert.equal(extra.headers.get('access-control-allow-origin'), 'https://extra.example.com');
    assert.equal((await call('GET', '/api/health', { headers: { Origin: 'https://evil.example.net' } })).status, 403);
    const preflight = await call('OPTIONS', '/api/auth/login', { headers: { Origin: 'https://app.example.com' } });
    assert.equal(preflight.status, 204);
  });

  it('JSON inválido → 400 genérico; nunca filtra internos', async () => {
    const reply = await call('POST', '/api/auth/login', { raw: '{"email": ' });
    assert.equal(reply.status, 400);
    assert.deepEqual(Object.keys(reply.body), ['error']);
    const filter = await call('GET', `/api/entities/ProfInsight?query=${encodeURIComponent('{oops')}`);
    assert.equal(filter.status, 400);
  });

  it('no permite filtrar por correo del autor ni expone created_by', async () => {
    const author = await register('author');
    await call('POST', '/api/entities/ProfInsight', {
      token: author.token, body: { subject_id: 'calculo', kind: 'tip', title: 'Tip', body: 'Contenido' },
    });
    const probe = await call('GET', `/api/entities/ProfInsight?query=${encodeURIComponent(JSON.stringify({ created_by: author.email }))}`);
    assert.equal(probe.status, 400);
    const list = await call('GET', '/api/entities/ProfInsight');
    assert.ok(list.body.length >= 1);
    for (const item of list.body) {
      assert.ok(!('created_by' in item), 'el correo del autor no debe salir');
      assert.ok(!JSON.stringify(item).includes('@example.com'));
    }
    assert.equal(list.headers.get('x-powered-by'), null);
  });

  it('GuestFeedback no es accesible por el CRUD genérico', async () => {
    const { token } = await register();
    assert.equal((await call('POST', '/api/entities/GuestFeedback', { token, body: { rating: 5, comment: 'hola' } })).status, 404);
    assert.equal((await call('POST', '/api/functions/submitGuestFeedback', { body: { rating: 5, comment: 'Excelente' } })).status, 200);
  });
});

// ---------------------------------------------------------------------------
describe('7. Reglas de progresión controladas por el servidor', () => {
  it('XP por tipo de acción, con tope diario y bono de diagnóstico de una sola vez', async () => {
    const { token } = await register();
    const award = (body: object) => call('POST', '/api/functions/awardXp', { token, body });
    assert.equal((await award({ kind: 'exercise' })).body.xp_points, 15);
    assert.equal((await award({ kind: 'diagnostic' })).status, 409, 'sin diagnóstico completado no hay bono');
    assert.equal((await award({ xp: 99999 })).status, 400, 'el cliente no puede fijar la cantidad');
    const exam = await award({ kind: 'exam', correct: 5, total: 10 });
    assert.equal(exam.body.awarded, 50);
    assert.equal((await award({ kind: 'exam', correct: 11, total: 10 })).status, 400);
    for (let i = 0; i < 60; i += 1) await award({ kind: 'exercise' });
    const capped = (await call('GET', '/api/auth/me', { token })).body;
    assert.equal(capped.xp_points, 600, 'tope diario de 600 XP');
    assert.equal(capped.level, 7);
  });

  it('el diagnóstico se registra en el servidor y el bono se entrega una sola vez', async () => {
    const { token } = await register();
    const diag = await call('POST', '/api/entities/DiagnosticResult', {
      token,
      body: {
        score_algebra: 80, score_trig: 70, score_geometry: 60, score_calculus: 50, score_physics: 40,
        detected_gaps: { critical: ['physics'], reinforce: [], detail: [] }, recommended_roadmap: { subjects: ['fisica'] },
        correct: 12, total: 20,
      },
    });
    assert.equal(diag.status, 201, JSON.stringify(diag.body));
    const me = (await call('GET', '/api/auth/me', { token })).body;
    assert.equal(me.diagnostics_completed, true);
    assert.deepEqual(me.diagnostic_result, { correct: 12, total: 20, critical: ['physics'] });
    assert.equal((await call('POST', '/api/functions/awardXp', { token, body: { kind: 'diagnostic' } })).body.awarded, 50);
    assert.equal((await call('POST', '/api/functions/awardXp', { token, body: { kind: 'diagnostic' } })).body.awarded, 0);
  });

  it('créditos 3D: 3 por día en Free, ilimitados en Premium, no se pueden restablecer desde el cliente', async () => {
    const { token, id } = await register();
    const use = () => call('POST', '/api/functions/consume3DCredit', { token });
    assert.deepEqual((await use()).body.allowed, true);
    assert.deepEqual((await use()).body.allowed, true);
    assert.deepEqual((await use()).body.allowed, true);
    assert.equal((await use()).body.allowed, false);
    assert.equal((await call('PATCH', '/api/auth/me', { token, body: { daily_3d_credits: 0 } })).status, 400);
    assert.equal((await use()).body.allowed, false);
    store.applySubscriptionState(id, { entitled: true, eventAt: 1 });
    assert.equal((await use()).body.allowed, true, 'Premium no consume cupo');
  });

  it('la racha la calcula el servidor', async () => {
    const { token } = await register();
    const first = await call('POST', '/api/functions/touchStreak', { token });
    assert.equal(first.body.streak_days, 1);
    assert.equal((await call('POST', '/api/functions/touchStreak', { token })).body.streak_days, 1, 'mismo día no suma');
  });
});

// ---------------------------------------------------------------------------
describe('8. Stripe: webhook y suscripciones fantasma', () => {
  const stripe = new Stripe('sk_test_dummy');
  const secret = 'whsec_test_secret';
  async function send(event: object, signed = true) {
    const payload = JSON.stringify(event);
    const header = signed ? stripe.webhooks.generateTestHeaderString({ payload, secret }) : 't=1,v1=deadbeef';
    const response = await fetch(`${baseUrl}/api/stripe/webhook`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Stripe-Signature': header }, body: payload,
    });
    return response.status;
  }
  const subscriptionEvent = (id: string, type: string, status: string, userId: string, created: number) => ({
    id, object: 'event', type, created,
    data: { object: { id: 'sub_123', object: 'subscription', status, customer: 'cus_123', metadata: { user_id: userId } } },
  });

  it('rechaza firmas inválidas o ausentes', async () => {
    assert.equal(await send({ id: 'evt_x', type: 'ping' }, false), 400);
    const response = await fetch(`${baseUrl}/api/stripe/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(response.status, 400);
  });

  it('revoca Premium al cancelarse la suscripción y la reactiva si sigue activa', async () => {
    const { token, id } = await register();
    const now = Math.floor(Date.now() / 1000);
    assert.equal(await send(subscriptionEvent('evt_1', 'customer.subscription.created', 'active', id, now), true), 200);
    assert.equal((await call('GET', '/api/auth/me', { token })).body.subscription_status, 'premium');

    assert.equal(await send(subscriptionEvent('evt_2', 'customer.subscription.deleted', 'canceled', id, now + 10)), 200);
    assert.equal((await call('GET', '/api/auth/me', { token })).body.subscription_status, 'free', 'cancelación ⇒ Premium revocado');

    // Un evento viejo que llega tarde no debe revivir Premium.
    assert.equal(await send(subscriptionEvent('evt_3', 'customer.subscription.updated', 'active', id, now + 5)), 200);
    assert.equal((await call('GET', '/api/auth/me', { token })).body.subscription_status, 'free', 'evento fuera de orden ignorado');
  });

  it('es idempotente por event.id y conserva Premium en past_due (periodo de gracia)', async () => {
    const { token, id } = await register();
    const now = Math.floor(Date.now() / 1000);
    await send(subscriptionEvent('evt_10', 'customer.subscription.updated', 'past_due', id, now));
    assert.equal((await call('GET', '/api/auth/me', { token })).body.subscription_status, 'premium');
    await send(subscriptionEvent('evt_11', 'customer.subscription.updated', 'unpaid', id, now + 1));
    assert.equal((await call('GET', '/api/auth/me', { token })).body.subscription_status, 'free');
    // Reenvío exacto del evento 10 (reintento de Stripe) no cambia nada.
    await send(subscriptionEvent('evt_10', 'customer.subscription.updated', 'past_due', id, now));
    assert.equal((await call('GET', '/api/auth/me', { token })).body.subscription_status, 'free');
  });

  it('el checkout de reserva usa el monto del servidor y exige configuración', async () => {
    const student = await register('payer');
    const missing = await call('POST', '/api/functions/createCheckoutSession', { token: student.token, body: { kind: 'booking' } });
    assert.equal(missing.status, 400);
    const ghost = await call('POST', '/api/functions/createCheckoutSession', { token: student.token, body: { kind: 'booking', booking_id: 'nope', amount: 1 } });
    assert.equal(ghost.status, 404);
    const unknown = await call('POST', '/api/functions/createCheckoutSession', { token: student.token, body: { kind: 'otra-cosa' } });
    assert.equal(unknown.status, 400);
  });
});
