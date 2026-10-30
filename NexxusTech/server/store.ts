import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export interface RecordData {
  id: string;
  created_by_id?: string;
  created_date?: string;
  updated_date?: string;
  [key: string]: unknown;
}

interface Database {
  users: Array<RecordData & { email: string; password_hash: string }>;
  entities: Record<string, RecordData[]>;
  passwordResetTokens: Record<string, { userId: string; expiresAt: number }>;
}

const databasePath = resolve(process.env.DATABASE_PATH || './data/database.json');
const allowedEntities = new Set([
  'Booking',
  'DiagnosticResult',
  'ExamResult',
  'GuestFeedback',
  'ProfInsight',
  'SubjectEvalConfig',
  'TutorProfile',
  'UserProgress',
]);

function loadDatabase(): Database {
  mkdirSync(dirname(databasePath), { recursive: true });
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
      const value = parsed as Database;
      return { ...value, passwordResetTokens: value.passwordResetTokens || {} };
    }
    throw new Error('Database file has an invalid structure');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return { users: [], entities: {}, passwordResetTokens: {} };
    }
    throw error;
  }
}

let database = loadDatabase();

function persist(): void {
  const tempPath = `${databasePath}.${process.pid}.tmp`;
  writeFileSync(tempPath, JSON.stringify(database, null, 2), { mode: 0o600 });
  renameSync(tempPath, databasePath);
}

export function publicUser<T extends { password_hash?: string }>(user: T) {
  const { password_hash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export function findUserByEmail(email: string) {
  return database.users.find((user) => user.email === email);
}

export function findUserById(id: string) {
  return database.users.find((user) => user.id === id);
}

export function createUser(email: string, passwordHash: string) {
  if (findUserByEmail(email)) {
    const error = new Error('Ya existe una cuenta con ese correo.');
    Object.assign(error, { status: 409 });
    throw error;
  }
  const now = new Date().toISOString();
  const user = {
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
    created_date: now,
    updated_date: now,
  };
  database.users.push(user);
  persist();
  return user;
}

export function updateUser(id: string, updates: Record<string, unknown>) {
  const user = findUserById(id);
  if (!user) return null;
  const allowedFields = [
    'full_name',
    'is_tutor',
    'subscription_status',
    'xp_points',
    'level',
    'streak_days',
    'last_active_date',
    'diagnostics_completed',
    'diagnostic_result',
    'daily_3d_credits',
    'daily_reset_date',
  ];
  for (const field of allowedFields) {
    if (field in updates) user[field] = updates[field];
  }
  user.updated_date = new Date().toISOString();
  persist();
  return user;
}

export function savePasswordResetToken(token: string, userId: string, expiresAt: number) {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  database.passwordResetTokens[tokenHash] = { userId, expiresAt };
  persist();
}

export function consumePasswordResetToken(token: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const record = database.passwordResetTokens[tokenHash];
  delete database.passwordResetTokens[tokenHash];
  if (record) persist();
  if (!record || record.expiresAt < Date.now()) return null;
  return findUserById(record.userId) || null;
}

export function updatePasswordHash(userId: string, passwordHash: string): void {
  const user = findUserById(userId);
  if (!user) throw new Error('User not found');
  user.password_hash = passwordHash;
  user.updated_date = new Date().toISOString();
  persist();
}

function entityRecords(entity: string): RecordData[] {
  if (!allowedEntities.has(entity)) {
    const error = new Error('Unknown entity');
    Object.assign(error, { status: 404 });
    throw error;
  }
  database.entities[entity] ||= [];
  return database.entities[entity];
}

export function listEntities(
  entity: string,
  userId: string | null,
  query: Record<string, unknown>,
  sort: string | undefined,
  limit: number,
  skip: number,
): RecordData[] {
  let records = entityRecords(entity).filter((record) => {
    if (!['TutorProfile', 'ProfInsight'].includes(entity)) {
      if (!userId || record.created_by_id !== userId) return false;
    }
    return Object.entries(query).every(([key, value]) => {
      const actual = record[key];
      return Array.isArray(actual) ? actual.includes(value) : actual === value;
    });
  });
  if (sort) {
    const descending = sort.startsWith('-');
    const field = descending ? sort.slice(1) : sort;
    records = [...records].sort((a, b) => {
      const left = a[field];
      const right = b[field];
      const comparison = String(left ?? '').localeCompare(String(right ?? ''), undefined, {
        numeric: true,
      });
      return descending ? -comparison : comparison;
    });
  }
  return records.slice(skip, skip + limit);
}

export function getEntity(entity: string, id: string, userId: string | null) {
  const record = entityRecords(entity).find((item) => item.id === id);
  if (!record) return null;
  if (!['TutorProfile', 'ProfInsight'].includes(entity)
    && record.created_by_id !== userId) return null;
  return record;
}

export function createEntity(
  entity: string,
  userId: string | null,
  data: Record<string, unknown>,
): RecordData {
  if (!userId && entity !== 'GuestFeedback') {
    const error = new Error('Authentication required');
    Object.assign(error, { status: 401 });
    throw error;
  }
  const now = new Date().toISOString();
  const safeData = entity === 'TutorProfile'
    ? { ...data, verified: false, sponsored: false, total_sessions: 0, rating: 0 }
    : data;
  const record: RecordData = {
    ...safeData,
    id: randomUUID(),
    ...(userId ? { created_by_id: userId, created_by: findUserById(userId)?.email } : {}),
    created_date: now,
    updated_date: now,
  };
  entityRecords(entity).push(record);
  persist();
  return record;
}

export function updateEntity(
  entity: string,
  id: string,
  userId: string,
  data: Record<string, unknown>,
) {
  const record = entityRecords(entity).find(
    (item) => item.id === id && item.created_by_id === userId,
  );
  if (!record) return null;
  const protectedFields = new Set([
    'id',
    'created_by_id',
    'created_by',
    'created_date',
    'updated_date',
    'status',
    'stripe_session_id',
    'verified',
    'sponsored',
    'rating',
    'total_sessions',
  ]);
  const updates = Object.fromEntries(
    Object.entries(data).filter(([field]) => !protectedFields.has(field)),
  );
  Object.assign(record, updates, { updated_date: new Date().toISOString() });
  persist();
  return record;
}

export function confirmBookingPayment(id: string, userId: string, stripeSessionId: string) {
  const record = entityRecords('Booking').find(
    (item) => item.id === id && item.created_by_id === userId,
  );
  if (!record) return null;
  Object.assign(record, {
    status: 'confirmed',
    stripe_session_id: stripeSessionId,
    updated_date: new Date().toISOString(),
  });
  persist();
  return record;
}

export function removeEntity(entity: string, id: string, userId: string) {
  const records = entityRecords(entity);
  const index = records.findIndex(
    (item) => item.id === id && item.created_by_id === userId,
  );
  if (index < 0) return false;
  records.splice(index, 1);
  persist();
  return true;
}
