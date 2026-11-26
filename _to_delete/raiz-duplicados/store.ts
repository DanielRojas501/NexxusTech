import { createHash, randomUUID } from 'node:crypto';
import {
  accessSync,
  closeSync,
  constants,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { config } from './config.js';
import {
  DAILY_XP_CAP,
  FREE_DAILY_3D_CREDITS,
  MAX_HOURLY_RATE_MXN,
  MIN_HOURLY_RATE_MXN,
  levelFromXp,
  priceBooking,
} from './pricing.js';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export interface RecordData {
  id: string;
  created_by_id?: string;
  created_by?: string;
  created_by_name?: string;
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
  diagnostics_completed: boolean;
  diagnostic_result?: unknown;
  daily_3d_credits: number;
  daily_reset_date: string | null;
  /** Contadores internos de reglas de negocio (no editables por el cliente). */
  xp_today: number;
  xp_today_date: string | null;
  xp_diagnostic_awarded: boolean;
  /** Versión de credenciales: al cambiar la contraseña se incrementa y revoca todos los JWT previos. */
  token_version: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_event_at?: number;
  created_date: string;
  updated_date: string;
  [key: string]: unknown;
}

interface Database {
  users: UserRecord[];
  entities: Record<string, RecordData[]>;
  passwordResetTokens: Record<string, { userId: string; expiresAt: number }>;
  processedStripeEvents: string[];
}

export function httpError(status: number, message: string): Error {
  return Object.assign(new Error(message), { status });
}

export const utcToday = (): string => new Date().toISOString().slice(0, 10);
const shiftDays = (day: string, delta: number): string =>
  new Date(Date.parse(`${day}T00:00:00Z`) + delta * 864e5).toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Persistencia (archivo JSON)
//   - Escritura atómica: archivo temporal + fsync + rename.
//   - En producción exige directorio escribible (volumen persistente).
//   - Para más de una instancia o carga real, reemplazar por una base SQL
//     manteniendo estas mismas funciones exportadas.
// ---------------------------------------------------------------------------
const databasePath = resolve(config.databasePath);
const MAX_STRIPE_EVENTS = 1000;
const clientEntities = new Set([
  'Booking',
  'DiagnosticResult',
  'ExamResult',
  'ProfInsight',
  'SubjectEvalConfig',
  'TutorProfile',
  'UserProgress',
]);
const internalEntities = new Set([...clientEntities, 'GuestFeedback']);
const publicReadEntities = new Set(['TutorProfile', 'ProfInsight']);

function normalizeUser(raw: Record<string, unknown>): UserRecord {
  const num = (value: unknown, fallback: number) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);
  const user = { ...raw } as UserRecord;
  user.token_version = num(raw.token_version, 0);
  user.xp_today = num(raw.xp_today, 0);
  user.xp_today_date = typeof raw.xp_today_date === 'string' ? raw.xp_today_date : null;
  // Quien ya completó el diagnóstico no vuelve a cobrar el bono de 50 XP.
  user.xp_diagnostic_awarded = Boolean(raw.xp_diagnostic_awarded ?? raw.diagnostics_completed);
  return user;
}

function ensureWritableDirectory(directory: string): void {
  mkdirSync(directory, { recursive: true });
  try {
    accessSync(directory, constants.W_OK);
  } catch {
    throw new Error(`El directorio de la base de datos no es escribible: ${directory}`);
  }
}

function loadDatabase(): Database {
  ensureWritableDirectory(dirname(databasePath));
  if (config.isProduction && databasePath.startsWith(process.cwd())) {
    console.warn(
      `[store] DATABASE_PATH (${databasePath}) está dentro del directorio de la app. ` +
        'En plataformas con disco efímero (Railway, Render…) se pierde en cada deploy: monta un volumen y apunta DATABASE_PATH a él.',
    );
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(databasePath, 'utf8'));
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'users' in parsed &&
      Array.isArray(parsed.users) &&
      'entities' in parsed &&
      typeof parsed.entities === 'object' &&
      parsed.entities !== null
    ) {
      const value = parsed as Partial<Database> & Pick<Database, 'entities'>;
      return {
        users: (value.users as Array<Record<string, unknown>>).map(normalizeUser),
        entities: value.entities,
        passwordResetTokens: value.passwordResetTokens ?? {},
        processedStripeEvents: value.processedStripeEvents ?? [],
      };
    }
    throw new Error('Database file has an invalid structure');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return { users: [], entities: {}, passwordResetTokens: {}, processedStripeEvents: [] };
    }
    throw error; // un archivo corrupto detiene el arranque en vez de sobrescribirse
  }
}

let database = loadDatabase();

function persist(): void {
  const tempPath = `${databasePath}.${process.pid}.tmp`;
  const fd = openSync(tempPath, 'w', 0o600);
  try {
    writeFileSync(fd, JSON.stringify(database));
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(tempPath, databasePath);
}

/** Solo pruebas: reinicia la base en memoria y en disco. */
export function __resetDatabaseForTests(): void {
  database = { users: [], entities: {}, passwordResetTokens: {}, processedStripeEvents: [] };
  persist();
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

export const findUserByEmail = (email: string) => database.users.find((u) => u.email === email);
export const findUserById = (id: string) => database.users.find((u) => u.id === id);
export const findUserByStripeCustomer = (customerId: string) =>
  database.users.find((u) => u.stripe_customer_id === customerId);

export function createUser(email: string, passwordHash: string): UserRecord {
  if (findUserByEmail(email)) throw httpError(409, 'Ya existe una cuenta con ese correo.');
  const now = new Date().toISOString();
  const user: UserRecord = {
    id: randomUUID(),
    email,
    full_name: email.split('@')[0],
    password_hash: passwordHash,
    role: 'user',
    is_tutor: false,
    subscription_status: 'free',
    xp_points: 0,
    level: 1,
    streak_days: 0,
    last_active_date: null,
    diagnostics_completed: false,
    daily_3d_credits: 0,
    daily_reset_date: null,
    xp_today: 0,
    xp_today_date: null,
    xp_diagnostic_awarded: false,
    token_version: 0,
    created_date: now,
    updated_date: now,
  };
  database.users.push(user);
  persist();
  return user;
}

/** Único camino del cliente para editar su perfil: solo datos cosméticos. */
export function updateOwnProfile(id: string, updates: { full_name: string }): UserRecord | null {
  const user = findUserById(id);
  if (!user) return null;
  user.full_name = updates.full_name;
  user.updated_date = new Date().toISOString();
  persist();
  return user;
}

export function updatePasswordHash(userId: string, passwordHash: string): void {
  const user = findUserById(userId);
  if (!user) throw new Error('User not found');
  user.password_hash = passwordHash;
  user.token_version += 1; // revoca todas las sesiones emitidas antes del cambio
  user.updated_date = new Date().toISOString();
  persist();
}

// ---- Reglas de negocio que el servidor posee (XP, racha, créditos 3D) ------
export function awardXp(
  userId: string,
  amount: number,
  today: string,
  once?: 'diagnostic',
): { xp_points: number; level: number; awarded: number } | null {
  const user = findUserById(userId);
  if (!user) return null;
  if (once === 'diagnostic' && user.xp_diagnostic_awarded) {
    return { xp_points: user.xp_points, level: user.level, awarded: 0 };
  }
  if (user.xp_today_date !== today) {
    user.xp_today = 0;
    user.xp_today_date = today;
  }
  const awarded = Math.max(0, Math.min(Math.floor(amount), DAILY_XP_CAP - user.xp_today));
  user.xp_today += awarded;
  user.xp_points += awarded;
  user.level = levelFromXp(user.xp_points);
  if (once === 'diagnostic') user.xp_diagnostic_awarded = true;
  user.updated_date = new Date().toISOString();
  persist();
  return { xp_points: user.xp_points, level: user.level, awarded };
}

export function touchStreak(userId: string, today: string): number | null {
  const user = findUserById(userId);
  if (!user) return null;
  if (user.last_active_date === today) return user.streak_days;
  user.streak_days = user.last_active_date === shiftDays(today, -1) ? user.streak_days + 1 : 1;
  user.last_active_date = today;
  user.updated_date = new Date().toISOString();
  persist();
  return user.streak_days;
}

export function consume3DCredit(
  userId: string,
  today: string,
): { allowed: boolean; used: number; remaining: number; premium: boolean } | null {
  const user = findUserById(userId);
  if (!user) return null;
  if (user.subscription_status === 'premium') {
    return { allowed: true, used: 0, remaining: FREE_DAILY_3D_CREDITS, premium: true };
  }
  if (user.daily_reset_date !== today) {
    user.daily_3d_credits = 0;
    user.daily_reset_date = today;
  }
  if (user.daily_3d_credits >= FREE_DAILY_3D_CREDITS) {
    return { allowed: false, used: user.daily_3d_credits, remaining: 0, premium: false };
  }
  user.daily_3d_credits += 1;
  user.updated_date = new Date().toISOString();
  persist();
  return {
    allowed: true,
    used: user.daily_3d_credits,
    remaining: FREE_DAILY_3D_CREDITS - user.daily_3d_credits,
    premium: false,
  };
}

// ---- Suscripciones (alimentado por el webhook de Stripe) -------------------
export function applySubscriptionState(
  userId: string,
  state: { entitled: boolean; customerId?: string; subscriptionId?: string; eventAt: number },
): 'applied' | 'stale' | 'ignored' | 'no_user' {
  const user = findUserById(userId);
  if (!user) return 'no_user';
  // Eventos fuera de orden: ignora los más antiguos que el último aplicado.
  if (user.stripe_event_at !== undefined && state.eventAt < user.stripe_event_at) return 'stale';
  // Un evento de cancelación de una suscripción antigua no debe quitar la vigente.
  if (
    !state.entitled &&
    state.subscriptionId &&
    user.stripe_subscription_id &&
    user.stripe_subscription_id !== state.subscriptionId
  ) {
    return 'ignored';
  }
  user.subscription_status = state.entitled ? 'premium' : 'free';
  if (state.customerId) user.stripe_customer_id = state.customerId;
  if (state.subscriptionId && (state.entitled || !user.stripe_subscription_id)) {
    user.stripe_subscription_id = state.subscriptionId;
  }
  user.stripe_event_at = state.eventAt;
  user.updated_date = new Date().toISOString();
  persist();
  return 'applied';
}

export const hasProcessedStripeEvent = (eventId: string) => database.processedStripeEvents.includes(eventId);
export function markStripeEventProcessed(eventId: string): void {
  database.processedStripeEvents.push(eventId);
  if (database.processedStripeEvents.length > MAX_STRIPE_EVENTS) {
    database.processedStripeEvents.splice(0, database.processedStripeEvents.length - MAX_STRIPE_EVENTS);
  }
  persist();
}

// ---- Tokens de restablecimiento -------------------------------------------
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export function savePasswordResetToken(token: string, userId: string, expiresAt: number): void {
  const now = Date.now();
  for (const [key, record] of Object.entries(database.passwordResetTokens)) {
    if (record.userId === userId || record.expiresAt < now) delete database.passwordResetTokens[key];
  }
  database.passwordResetTokens[hashToken(token)] = { userId, expiresAt };
  persist();
}

export function consumePasswordResetToken(token: string): UserRecord | null {
  const key = hashToken(token);
  const record = database.passwordResetTokens[key];
  if (!record) return null;
  delete database.passwordResetTokens[key];
  persist();
  if (record.expiresAt < Date.now()) return null;
  return findUserById(record.userId) ?? null;
}

// ---------------------------------------------------------------------------
// Entidades genéricas
// ---------------------------------------------------------------------------
function entityRecords(entity: string): RecordData[] {
  if (!internalEntities.has(entity)) throw httpError(404, 'Unknown entity');
  database.entities[entity] ||= [];
  return database.entities[entity];
}

/** Nunca devolvemos el correo del autor (`created_by`); sí un nombre visible. */
export function toClientRecord(record: RecordData) {
  const { created_by: _email, ...rest } = record;
  return rest;
}

const BLOCKED_FILTER_KEYS = new Set(['created_by', '__proto__', 'constructor', 'prototype']);
const SORT_FIELD = /^-?[a-z][a-z0-9_]{0,39}$/;

export function listEntities(
  entity: string,
  userId: string | null,
  query: Record<string, unknown>,
  sort: string | undefined,
  limit: number,
  skip: number,
): RecordData[] {
  if (!clientEntities.has(entity)) throw httpError(404, 'Unknown entity');
  const filters = Object.entries(query);
  for (const [key, value] of filters) {
    if (BLOCKED_FILTER_KEYS.has(key) || !['string', 'number', 'boolean'].includes(typeof value)) {
      throw httpError(400, 'Filtro de consulta no permitido.');
    }
  }
  if (sort && (!SORT_FIELD.test(sort) || sort.replace(/^-/, '') === 'created_by')) {
    throw httpError(400, 'Orden no permitido.');
  }
  let records = entityRecords(entity).filter((record) => {
    if (!publicReadEntities.has(entity) && (!userId || record.created_by_id !== userId)) return false;
    return filters.every(([key, value]) => {
      const actual = record[key];
      return Array.isArray(actual) ? actual.includes(value) : actual === value;
    });
  });
  if (sort) {
    const descending = sort.startsWith('-');
    const field = descending ? sort.slice(1) : sort;
    records = [...records].sort((a, b) => {
      const comparison = String(a[field] ?? '').localeCompare(String(b[field] ?? ''), undefined, { numeric: true });
      return descending ? -comparison : comparison;
    });
  }
  return records.slice(skip, skip + limit);
}

export function getEntity(entity: string, id: string, userId: string | null): RecordData | null {
  if (!internalEntities.has(entity)) throw httpError(404, 'Unknown entity');
  const record = entityRecords(entity).find((item) => item.id === id);
  if (!record) return null;
  if (!publicReadEntities.has(entity) && record.created_by_id !== userId) return null;
  return record;
}

function insertRecord(entity: string, userId: string | null, data: Record<string, unknown>): RecordData {
  const now = new Date().toISOString();
  const owner = userId ? findUserById(userId) : undefined;
  const record: RecordData = {
    ...data,
    id: randomUUID(),
    ...(userId ? { created_by_id: userId, created_by: owner?.email, created_by_name: owner?.full_name } : {}),
    created_date: now,
    updated_date: now,
  };
  entityRecords(entity).push(record);
  return record;
}

/** Alta genérica. `data` YA pasó por la lista blanca de zod (ver validation.ts). */
export function createRecord(entity: string, userId: string, data: Record<string, unknown>): RecordData {
  if (!clientEntities.has(entity)) throw httpError(404, 'Unknown entity');
  const record = insertRecord(entity, userId, data);
  persist();
  return record;
}

export function createGuestFeedback(data: Record<string, unknown>): RecordData {
  const record = insertRecord('GuestFeedback', null, data);
  persist();
  return record;
}

export function createTutorProfile(userId: string, data: Record<string, unknown>): RecordData {
  const user = findUserById(userId);
  if (!user) throw httpError(401, 'Sesión no válida.');
  if (entityRecords('TutorProfile').some((t) => t.created_by_id === userId)) {
    throw httpError(409, 'Ya tienes un perfil de asesor.');
  }
  // Distintivos y métricas los fija SIEMPRE el servidor.
  const record = insertRecord('TutorProfile', userId, {
    ...data,
    verified: false,
    sponsored: false,
    total_sessions: 0,
    rating: 0,
  });
  user.is_tutor = true;
  user.updated_date = new Date().toISOString();
  persist();
  return record;
}

export function createDiagnosticResult(userId: string, data: Record<string, unknown>): RecordData {
  const user = findUserById(userId);
  if (!user) throw httpError(401, 'Sesión no válida.');
  const record = insertRecord('DiagnosticResult', userId, data);
  const gaps = data.detected_gaps as { critical?: unknown } | undefined;
  user.diagnostics_completed = true;
  user.diagnostic_result = {
    correct: data.correct,
    total: data.total,
    critical: Array.isArray(gaps?.critical) ? gaps.critical.filter((s) => typeof s === 'string') : [],
  };
  user.updated_date = new Date().toISOString();
  persist();
  return record;
}

/** Reserva: el precio, la comisión y el estado los calcula el servidor. */
export function createBooking(
  userId: string,
  input: { tutor_id: string; subject?: string; date: string; hours: number },
): RecordData {
  const tutor = entityRecords('TutorProfile').find((t) => t.id === input.tutor_id);
  if (!tutor) throw httpError(404, 'El asesor no existe.');
  if (tutor.created_by_id === userId) throw httpError(400, 'No puedes agendar una asesoría contigo mismo.');

  const offered = Array.isArray(tutor.subjects_offered)
    ? tutor.subjects_offered.filter((s): s is string => typeof s === 'string')
    : [];
  const subject = input.subject || offered[0] || '';
  if (offered.length && !offered.includes(subject)) throw httpError(400, 'El asesor no ofrece esa materia.');

  const rate = Number(tutor.hourly_rate);
  if (!Number.isFinite(rate) || rate < MIN_HOURLY_RATE_MXN || rate > MAX_HOURLY_RATE_MXN) {
    throw httpError(409, 'La tarifa del asesor no es válida.');
  }

  // Tolerancia de un día por la diferencia horaria con UTC (México está en UTC-6).
  const today = utcToday();
  if (input.date < shiftDays(today, -1) || input.date > shiftDays(today, 365)) {
    throw httpError(400, 'La fecha debe estar dentro del próximo año y no puede estar en el pasado.');
  }
  const pending = entityRecords('Booking').filter((b) => b.created_by_id === userId && b.status === 'pending').length;
  if (pending >= 10) throw httpError(429, 'Tienes demasiadas reservas pendientes. Págalas o elimínalas primero.');

  const price = priceBooking(rate, input.hours);
  const record = insertRecord('Booking', userId, {
    tutor_id: input.tutor_id,
    tutor_name: String(tutor.full_name ?? 'Asesor'),
    subject,
    date: input.date,
    hours: input.hours,
    total_amount: price.totalAmount,
    platform_commission: price.platformCommission,
    status: 'pending',
  });
  persist();
  return record;
}

const PROTECTED_FIELDS = new Set([
  'id', 'created_by_id', 'created_by', 'created_by_name', 'created_date', 'updated_date',
  'status', 'stripe_session_id', 'verified', 'sponsored', 'rating', 'total_sessions',
  'total_amount', 'platform_commission', 'tutor_id', 'tutor_name',
]);

export function updateRecord(
  entity: string,
  id: string,
  userId: string,
  data: Record<string, unknown>,
): RecordData | null {
  if (!clientEntities.has(entity)) throw httpError(404, 'Unknown entity');
  const record = entityRecords(entity).find((item) => item.id === id && item.created_by_id === userId);
  if (!record) return null;
  if (entity === 'Booking' && record.status !== 'pending') {
    throw httpError(409, 'Solo puedes modificar reservas pendientes.');
  }
  const safe = Object.fromEntries(Object.entries(data).filter(([field]) => !PROTECTED_FIELDS.has(field)));
  Object.assign(record, safe, { updated_date: new Date().toISOString() });
  persist();
  return record;
}

export type BookingPaymentResult = 'confirmed' | 'already_confirmed' | 'not_found' | 'amount_mismatch';

export function confirmBookingPayment(
  id: string,
  userId: string,
  stripeSessionId: string,
  paidCents: number,
): BookingPaymentResult {
  const record = entityRecords('Booking').find((item) => item.id === id && item.created_by_id === userId);
  if (!record) return 'not_found';
  if (record.status !== 'pending') {
    return record.stripe_session_id === stripeSessionId ? 'already_confirmed' : 'not_found';
  }
  if (paidCents !== Math.round(Number(record.total_amount) * 100)) return 'amount_mismatch';
  Object.assign(record, {
    status: 'confirmed',
    stripe_session_id: stripeSessionId,
    updated_date: new Date().toISOString(),
  });
  persist();
  return 'confirmed';
}

export function removeRecord(entity: string, id: string, userId: string): boolean {
  if (!clientEntities.has(entity)) throw httpError(404, 'Unknown entity');
  const records = entityRecords(entity);
  const index = records.findIndex((item) => item.id === id && item.created_by_id === userId);
  if (index < 0) return false;
  // Una reserva pagada es un registro contable: no se puede borrar.
  if (entity === 'Booking' && records[index].status !== 'pending') {
    throw httpError(409, 'Solo puedes eliminar reservas pendientes.');
  }
  records.splice(index, 1);
  if (entity === 'TutorProfile' && !records.some((t) => t.created_by_id === userId)) {
    const user = findUserById(userId);
    if (user) user.is_tutor = false;
  }
  persist();
  return true;
}
