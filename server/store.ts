import { createHash } from 'node:crypto';
import { columns, db, type Query, type Row } from './db.js';
import {
  DAILY_XP_CAP,
  FREE_DAILY_3D_CREDITS,
  MAX_HOURLY_RATE_MXN,
  MIN_HOURLY_RATE_MXN,
  levelFromXp,
  priceBooking,
} from './pricing.js';
import { localDay, recordActivity, shiftDays, type StreakState } from '../src/lib/streakRules.js';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export interface RecordData {
  id: string;
  created_by_id?: string | null;
  created_by_name?: string | null;
  created_date?: string;
  updated_date?: string;
  [key: string]: unknown;
}

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  is_tutor: boolean;
  subscription_status: 'free' | 'premium';
  xp_points: number;
  level: number;
  streak_days: number;
  last_active_date: string | null;
  best_streak: number;
  streak_freezes: number;
  active_days: string[];
  frozen_days: string[];
  /** Último día (Saltillo) en que resolvió el reto diario. */
  daily_challenge_date: string | null;
  diagnostics_completed: boolean;
  diagnostic_result: unknown;
  daily_3d_credits: number;
  daily_reset_date: string | null;
  /** Contadores internos de reglas de negocio (no editables por el cliente). */
  xp_today: number;
  xp_today_date: string | null;
  xp_diagnostic_awarded: boolean;
  /** Versión de credenciales: al cambiar la contraseña se incrementa y revoca todos los JWT previos. */
  token_version: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_event_at: number | null;
  created_date: string;
  updated_date: string;
}

export function httpError(status: number, message: string): Error {
  return Object.assign(new Error(message), { status });
}

/** "Hoy" en Saltillo: XP diario, créditos 3D, racha y reto diario cambian a medianoche local. */
export const localToday = (): string => localDay();

// ---------------------------------------------------------------------------
// Persistencia (PostgreSQL; ver db.ts y schema.sql)
//   Las reglas que leen y luego escriben (XP, créditos, reservas, pagos) corren en
//   una transacción con SELECT … FOR UPDATE: dos peticiones simultáneas no se pisan.
// ---------------------------------------------------------------------------
const TABLES: Record<string, string> = {
  Booking: 'bookings',
  DiagnosticResult: 'diagnostic_results',
  ExamResult: 'exam_results',
  ProfInsight: 'prof_insights',
  SubjectEvalConfig: 'subject_eval_configs',
  TutorProfile: 'tutor_profiles',
  UserProgress: 'user_progress',
  GuestFeedback: 'guest_feedback',
};
const clientEntities = new Set(Object.keys(TABLES).filter((e) => e !== 'GuestFeedback'));
const publicReadEntities = new Set(['TutorProfile', 'ProfInsight']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function tableOf(entity: string, allowed: Set<string> = clientEntities): string {
  if (!allowed.has(entity)) throw httpError(404, 'Unknown entity');
  return TABLES[entity];
}
const columnType = (table: string, column: string) => columns.get(table)?.get(column);
/** jsonb se manda como texto: así `pg` no convierte un arreglo JSON en arreglo de Postgres. */
const encode = (table: string, column: string, value: unknown) =>
  columnType(table, column) === 'jsonb' && value != null ? JSON.stringify(value) : value;

/** UPDATE con solo las columnas indicadas; los nombres vienen de listas blancas, nunca del cliente. */
async function updateColumns(q: Query, table: string, id: string, fields: Record<string, unknown>): Promise<Row> {
  const keys = Object.keys(fields);
  const sets = keys.map((key, i) => `"${key}" = $${i + 2}`);
  const [row] = await q(
    `UPDATE ${table} SET ${[...sets, 'updated_date = now()'].join(', ')} WHERE id = $1 RETURNING *`,
    [id, ...keys.map((key) => encode(table, key, fields[key]))],
  );
  return row;
}

async function lockUser(q: Query, userId: string): Promise<UserRecord | undefined> {
  if (!UUID.test(userId)) return undefined;
  const [user] = await q('SELECT * FROM users WHERE id = $1 FOR UPDATE', [userId]);
  return user as UserRecord | undefined;
}

// ---------------------------------------------------------------------------
// Usuarios
// ---------------------------------------------------------------------------
export function publicUser(user: UserRecord) {
  const {
    password_hash: _passwordHash,
    xp_today: _xpToday,
    xp_today_date: _xpTodayDate,
    xp_diagnostic_awarded: _xpDiag,
    token_version: _tokenVersion,
    stripe_customer_id: _customer,
    stripe_subscription_id: _subscription,
    stripe_event_at: _eventAt,
    ...safeUser
  } = user;
  return safeUser;
}

const firstUser = async (sql: string, params: unknown[]) =>
  (await db.query(sql, params))[0] as UserRecord | undefined;

export const findUserByEmail = (email: string) => firstUser('SELECT * FROM users WHERE email = $1', [email]);
export const findUserById = async (id: string) =>
  UUID.test(id) ? firstUser('SELECT * FROM users WHERE id = $1', [id]) : undefined;
export const findUserByStripeCustomer = (customerId: string) =>
  firstUser('SELECT * FROM users WHERE stripe_customer_id = $1', [customerId]);

export async function createUser(email: string, passwordHash: string): Promise<UserRecord> {
  const user = await firstUser(
    `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING RETURNING *`,
    [email, passwordHash, email.split('@')[0]],
  );
  if (!user) throw httpError(409, 'Ya existe una cuenta con ese correo.');
  return user;
}

/** Único camino del cliente para editar su perfil: solo datos cosméticos. */
export const updateOwnProfile = (id: string, updates: { full_name: string }) =>
  UUID.test(id)
    ? firstUser('UPDATE users SET full_name = $2, updated_date = now() WHERE id = $1 RETURNING *', [id, updates.full_name])
    : Promise.resolve(undefined);

export async function updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
  // token_version + 1 revoca todas las sesiones emitidas antes del cambio.
  const user = await firstUser(
    'UPDATE users SET password_hash = $2, token_version = token_version + 1, updated_date = now() WHERE id = $1 RETURNING id',
    [userId, passwordHash],
  );
  if (!user) throw new Error('User not found');
}

// ---- Reglas de negocio que el servidor posee (XP, racha, créditos 3D) ------
/**
 * Otorga XP y registra el día de estudio en la racha. Es el único lugar donde se
 * mueve la racha: abrir la app no cuenta, resolver algo sí (aunque ya se llegó al tope de XP).
 */
export function awardXp(
  userId: string,
  amount: number,
  today: string,
  once?: 'diagnostic' | 'daily',
): Promise<{ xp_points: number; level: number; awarded: number; streak_days: number } | null> {
  return db.tx(async (q) => {
    const user = await lockUser(q, userId);
    if (!user) return null;

    // Solo los campos de racha: recordActivity puede devolver el mismo objeto que recibe.
    const { streak_days, best_streak, streak_freezes, last_active_date, active_days, frozen_days } =
      recordActivity(user as StreakState, today);
    const streak = { streak_days, best_streak, streak_freezes, last_active_date, active_days, frozen_days };
    const alreadyClaimed =
      (once === 'diagnostic' && user.xp_diagnostic_awarded) || (once === 'daily' && user.daily_challenge_date === today);
    const xpToday = user.xp_today_date === today ? user.xp_today : 0;
    const awarded = alreadyClaimed ? 0 : Math.max(0, Math.min(Math.floor(amount), DAILY_XP_CAP - xpToday));
    const xp = user.xp_points + awarded;
    const saved = await updateColumns(q, 'users', user.id, {
      ...streak,
      xp_today: xpToday + awarded,
      xp_today_date: today,
      xp_points: xp,
      level: levelFromXp(xp),
      ...(once === 'diagnostic' && { xp_diagnostic_awarded: true }),
      ...(once === 'daily' && { daily_challenge_date: today }),
    });
    return { xp_points: saved.xp_points, level: saved.level, awarded, streak_days: saved.streak_days };
  });
}

export function consume3DCredit(
  userId: string,
  today: string,
): Promise<{ allowed: boolean; used: number; remaining: number; premium: boolean } | null> {
  return db.tx(async (q) => {
    const user = await lockUser(q, userId);
    if (!user) return null;
    if (user.subscription_status === 'premium') {
      return { allowed: true, used: 0, remaining: FREE_DAILY_3D_CREDITS, premium: true };
    }
    const used = user.daily_reset_date === today ? user.daily_3d_credits : 0;
    if (used >= FREE_DAILY_3D_CREDITS) return { allowed: false, used, remaining: 0, premium: false };
    await updateColumns(q, 'users', user.id, { daily_3d_credits: used + 1, daily_reset_date: today });
    return { allowed: true, used: used + 1, remaining: FREE_DAILY_3D_CREDITS - used - 1, premium: false };
  });
}

// ---- Suscripciones (alimentado por el webhook de Stripe) -------------------
export function applySubscriptionState(
  userId: string,
  state: { entitled: boolean; customerId?: string; subscriptionId?: string; eventAt: number },
): Promise<'applied' | 'stale' | 'ignored' | 'no_user'> {
  return db.tx(async (q) => {
    const user = await lockUser(q, userId);
    if (!user) return 'no_user';
    // Eventos fuera de orden: ignora los más antiguos que el último aplicado.
    if (user.stripe_event_at != null && state.eventAt < user.stripe_event_at) return 'stale';
    // Un evento de cancelación de una suscripción antigua no debe quitar la vigente.
    if (
      !state.entitled &&
      state.subscriptionId &&
      user.stripe_subscription_id &&
      user.stripe_subscription_id !== state.subscriptionId
    ) {
      return 'ignored';
    }
    await updateColumns(q, 'users', user.id, {
      subscription_status: state.entitled ? 'premium' : 'free',
      stripe_event_at: state.eventAt,
      ...(state.customerId && { stripe_customer_id: state.customerId }),
      ...(state.subscriptionId &&
        (state.entitled || !user.stripe_subscription_id) && { stripe_subscription_id: state.subscriptionId }),
    });
    return 'applied';
  });
}

export const hasProcessedStripeEvent = async (eventId: string) =>
  (await db.query('SELECT 1 FROM stripe_events WHERE event_id = $1', [eventId])).length > 0;
export async function markStripeEventProcessed(eventId: string): Promise<void> {
  await db.query('INSERT INTO stripe_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING', [eventId]);
}

// ---- Tokens de restablecimiento -------------------------------------------
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export function savePasswordResetToken(token: string, userId: string, expiresAt: number): Promise<void> {
  return db.tx(async (q) => {
    await q('DELETE FROM password_reset_tokens WHERE user_id = $1 OR expires_at < now()', [userId]);
    await q('INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [
      hashToken(token),
      userId,
      new Date(expiresAt).toISOString(),
    ]);
  });
}

export async function consumePasswordResetToken(token: string): Promise<UserRecord | null> {
  const [record] = await db.query('DELETE FROM password_reset_tokens WHERE token_hash = $1 RETURNING *', [
    hashToken(token),
  ]);
  if (!record || Date.parse(record.expires_at) < Date.now()) return null;
  return (await findUserById(record.user_id)) ?? null;
}

// ---------------------------------------------------------------------------
// Entidades genéricas
// ---------------------------------------------------------------------------
/** Columnas vacías (NULL) se omiten, como en el JSON anterior; el correo del autor ni se guarda. */
export function toClientRecord(record: RecordData) {
  const { created_by: _email, ...rest } = record;
  return Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== null));
}

const BLOCKED_FILTER_KEYS = new Set(['created_by', '__proto__', 'constructor', 'prototype']);
const SORT_FIELD = /^-?[a-z][a-z0-9_]{0,39}$/;
const NUMERIC_TYPES = new Set(['integer', 'numeric', 'double precision', 'bigint']);

export async function listEntities(
  entity: string,
  userId: string | null,
  query: Record<string, unknown>,
  sort: string | undefined,
  limit: number,
  skip: number,
): Promise<RecordData[]> {
  const table = tableOf(entity);
  const filters = Object.entries(query);
  for (const [key, value] of filters) {
    if (BLOCKED_FILTER_KEYS.has(key) || !['string', 'number', 'boolean'].includes(typeof value)) {
      throw httpError(400, 'Filtro de consulta no permitido.');
    }
  }
  if (sort && (!SORT_FIELD.test(sort) || sort.replace(/^-/, '') === 'created_by')) {
    throw httpError(400, 'Orden no permitido.');
  }

  const where: string[] = [];
  const params: unknown[] = [];
  if (!publicReadEntities.has(entity)) {
    if (!userId) return [];
    params.push(userId);
    where.push(`created_by_id = $${params.length}`);
  }
  for (const [key, value] of filters) {
    const type = columnType(table, key);
    // Campo inexistente o de otro tipo: no coincide nada (igual que antes con el JSON).
    if (!type || (NUMERIC_TYPES.has(type) && typeof value !== 'number') || (type === 'boolean' && typeof value !== 'boolean')) {
      return [];
    }
    if (type === 'ARRAY') {
      params.push(String(value));
      where.push(`$${params.length} = ANY("${key}")`);
    } else if (NUMERIC_TYPES.has(type) || type === 'boolean') {
      params.push(value);
      where.push(`"${key}" = $${params.length}`);
    } else {
      params.push(String(value));
      where.push(`"${key}"::text = $${params.length}`);
    }
  }

  const field = sort?.replace(/^-/, '');
  const order = field && columnType(table, field) ? `"${field}" ${sort!.startsWith('-') ? 'DESC' : 'ASC'} NULLS LAST, ` : '';
  params.push(limit, skip);
  return (await db.query(
    `SELECT * FROM ${table} ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY ${order}created_date, id LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  )) as RecordData[];
}

export async function getEntity(entity: string, id: string, userId: string | null): Promise<RecordData | null> {
  const table = tableOf(entity);
  if (!UUID.test(id)) return null;
  const [record] = await db.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
  if (!record) return null;
  if (!publicReadEntities.has(entity) && record.created_by_id !== userId) return null;
  return record as RecordData;
}

/** Inserta solo columnas que existen en la tabla; `data` YA pasó por la lista blanca de zod. */
async function insertRecord(q: Query, entity: string, userId: string | null, data: Record<string, unknown>) {
  const table = TABLES[entity];
  const owner = userId ? (await q('SELECT full_name FROM users WHERE id = $1', [userId]))[0] : undefined;
  const fields: Record<string, unknown> = {
    ...data,
    ...(userId ? { created_by_id: userId, created_by_name: owner?.full_name ?? null } : {}),
  };
  const keys = Object.keys(fields).filter((key) => columnType(table, key) && fields[key] !== undefined);
  const [record] = await q(
    `INSERT INTO ${table} (${keys.map((k) => `"${k}"`).join(', ')})
     VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
    keys.map((key) => encode(table, key, fields[key])),
  );
  return record as RecordData;
}

export function createRecord(entity: string, userId: string, data: Record<string, unknown>): Promise<RecordData> {
  tableOf(entity);
  return insertRecord(db.query, entity, userId, data);
}

export const createGuestFeedback = (data: Record<string, unknown>) => insertRecord(db.query, 'GuestFeedback', null, data);

export function createTutorProfile(userId: string, data: Record<string, unknown>): Promise<RecordData> {
  return db.tx(async (q) => {
    if (!(await lockUser(q, userId))) throw httpError(401, 'Sesión no válida.');
    if ((await q('SELECT 1 FROM tutor_profiles WHERE created_by_id = $1', [userId])).length) {
      throw httpError(409, 'Ya tienes un perfil de asesor.');
    }
    // Distintivos y métricas los fija SIEMPRE el servidor.
    const record = await insertRecord(q, 'TutorProfile', userId, {
      ...data,
      verified: false,
      sponsored: false,
      total_sessions: 0,
      rating: 0,
    });
    await updateColumns(q, 'users', userId, { is_tutor: true });
    return record;
  });
}

export function createDiagnosticResult(userId: string, data: Record<string, unknown>): Promise<RecordData> {
  return db.tx(async (q) => {
    if (!(await lockUser(q, userId))) throw httpError(401, 'Sesión no válida.');
    const record = await insertRecord(q, 'DiagnosticResult', userId, data);
    const gaps = data.detected_gaps as { critical?: unknown } | undefined;
    await updateColumns(q, 'users', userId, {
      diagnostics_completed: true,
      diagnostic_result: {
        correct: data.correct,
        total: data.total,
        critical: Array.isArray(gaps?.critical) ? gaps.critical.filter((s) => typeof s === 'string') : [],
      },
    });
    return record;
  });
}

/** Reserva: el precio, la comisión y el estado los calcula el servidor. */
export function createBooking(
  userId: string,
  input: { tutor_id: string; subject?: string; date: string; hours: number },
): Promise<RecordData> {
  return db.tx(async (q) => {
    // El bloqueo del alumno serializa sus reservas: el tope de pendientes no se puede rebasar en paralelo.
    if (!(await lockUser(q, userId))) throw httpError(401, 'Sesión no válida.');
    const [tutor] = UUID.test(input.tutor_id)
      ? await q('SELECT * FROM tutor_profiles WHERE id = $1', [input.tutor_id])
      : [];
    if (!tutor) throw httpError(404, 'El asesor no existe.');
    if (tutor.created_by_id === userId) throw httpError(400, 'No puedes agendar una asesoría contigo mismo.');

    const offered: string[] = Array.isArray(tutor.subjects_offered) ? tutor.subjects_offered : [];
    const subject = input.subject || offered[0] || '';
    if (offered.length && !offered.includes(subject)) throw httpError(400, 'El asesor no ofrece esa materia.');

    const rate = Number(tutor.hourly_rate);
    if (!Number.isFinite(rate) || rate < MIN_HOURLY_RATE_MXN || rate > MAX_HOURLY_RATE_MXN) {
      throw httpError(409, 'La tarifa del asesor no es válida.');
    }

    // Tolerancia de un día por la diferencia horaria con UTC (México está en UTC-6).
    const today = localToday();
    if (input.date < shiftDays(today, -1) || input.date > shiftDays(today, 365)) {
      throw httpError(400, 'La fecha debe estar dentro del próximo año y no puede estar en el pasado.');
    }
    const [{ pending }] = await q(
      "SELECT count(*)::int AS pending FROM bookings WHERE created_by_id = $1 AND status = 'pending'",
      [userId],
    );
    if (pending >= 10) throw httpError(429, 'Tienes demasiadas reservas pendientes. Págalas o elimínalas primero.');

    const price = priceBooking(rate, input.hours);
    return insertRecord(q, 'Booking', userId, {
      tutor_id: input.tutor_id,
      tutor_name: String(tutor.full_name ?? 'Asesor'),
      subject,
      date: input.date,
      hours: input.hours,
      total_amount: price.totalAmount,
      platform_commission: price.platformCommission,
      status: 'pending',
    });
  });
}

const PROTECTED_FIELDS = new Set([
  'id', 'created_by_id', 'created_by', 'created_by_name', 'created_date', 'updated_date',
  'status', 'stripe_session_id', 'verified', 'sponsored', 'rating', 'total_sessions',
  'total_amount', 'platform_commission', 'tutor_id', 'tutor_name',
]);

async function lockOwned(q: Query, table: string, id: string, userId: string) {
  if (!UUID.test(id)) return undefined;
  const [record] = await q(`SELECT * FROM ${table} WHERE id = $1 AND created_by_id = $2 FOR UPDATE`, [id, userId]);
  return record;
}

export function updateRecord(
  entity: string,
  id: string,
  userId: string,
  data: Record<string, unknown>,
): Promise<RecordData | null> {
  const table = tableOf(entity);
  return db.tx(async (q) => {
    const record = await lockOwned(q, table, id, userId);
    if (!record) return null;
    if (entity === 'Booking' && record.status !== 'pending') {
      throw httpError(409, 'Solo puedes modificar reservas pendientes.');
    }
    const safe = Object.fromEntries(
      Object.entries(data).filter(([field, value]) => !PROTECTED_FIELDS.has(field) && columnType(table, field) && value !== undefined),
    );
    return (await updateColumns(q, table, id, safe)) as RecordData;
  });
}

export type BookingPaymentResult = 'confirmed' | 'already_confirmed' | 'not_found' | 'amount_mismatch';

export function confirmBookingPayment(
  id: string,
  userId: string,
  stripeSessionId: string,
  paidCents: number,
): Promise<BookingPaymentResult> {
  return db.tx(async (q) => {
    const record = await lockOwned(q, 'bookings', id, userId);
    if (!record) return 'not_found';
    if (record.status !== 'pending') {
      return record.stripe_session_id === stripeSessionId ? 'already_confirmed' : 'not_found';
    }
    if (paidCents !== Math.round(Number(record.total_amount) * 100)) return 'amount_mismatch';
    await updateColumns(q, 'bookings', id, { status: 'confirmed', stripe_session_id: stripeSessionId });
    return 'confirmed';
  });
}

export function removeRecord(entity: string, id: string, userId: string): Promise<boolean> {
  const table = tableOf(entity);
  return db.tx(async (q) => {
    const record = await lockOwned(q, table, id, userId);
    if (!record) return false;
    // Una reserva pagada es un registro contable: no se puede borrar.
    if (entity === 'Booking' && record.status !== 'pending') {
      throw httpError(409, 'Solo puedes eliminar reservas pendientes.');
    }
    await q(`DELETE FROM ${table} WHERE id = $1`, [id]);
    if (entity === 'TutorProfile') await updateColumns(q, 'users', userId, { is_tutor: false });
    return true;
  });
}
