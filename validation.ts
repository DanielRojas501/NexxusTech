import { z } from 'zod';
import {
  ALLOWED_BOOKING_HOURS,
  MAX_HOURLY_RATE_MXN,
  MIN_HOURLY_RATE_MXN,
} from './pricing.js';

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const emailSchema = z
  .string({ required_error: 'Email is required.' })
  .trim()
  .toLowerCase()
  .max(254)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Ingresa un correo electrónico válido.');

// Se conserva el trim() previo para no bloquear a usuarios ya registrados.
export const passwordSchema = z
  .string({ required_error: 'Password is required.' })
  .trim()
  .min(8, 'La contraseña debe tener entre 8 y 128 caracteres.')
  .max(128, 'La contraseña debe tener entre 8 y 128 caracteres.');

export const registerSchema = z.object({ email: emailSchema, password: passwordSchema });
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().trim().min(1).max(128),
});
export const forgotPasswordSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({
  token: z.string().trim().min(20).max(200),
  password: passwordSchema,
});

/**
 * PATCH /api/auth/me — LISTA BLANCA ESTRICTA.
 * Solo datos de perfil. XP, nivel, racha, créditos, suscripción, rol y is_tutor
 * son atributos del servidor y se modifican únicamente mediante reglas de negocio
 * (ver /functions/awardXp, /touchStreak, /consume3DCredit, Stripe, TutorProfile).
 */
export const profileUpdateSchema = z
  .object({ full_name: z.string().trim().min(1).max(80) })
  .strict();

// ---------------------------------------------------------------------------
// Pagos: el cliente solo indica QUÉ quiere comprar; precios y montos los fija el servidor.
// ---------------------------------------------------------------------------
export const checkoutSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('premium'), interval: z.enum(['monthly', 'annual']).default('monthly') }),
  z.object({ kind: z.literal('booking'), booking_id: z.string().trim().min(1).max(64) }),
]);
export const verifySessionSchema = z.object({
  session_id: z.string().trim().min(1).max(200).regex(/^cs_[A-Za-z0-9_]+$/, 'Sesión de pago inválida.'),
});

// ---------------------------------------------------------------------------
// Funciones de progresión
// ---------------------------------------------------------------------------
export const awardXpSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('exercise') }),
  z.object({ kind: z.literal('diagnostic') }),
  z.object({
    kind: z.literal('exam'),
    correct: z.number().int().min(0).max(200),
    total: z.number().int().min(1).max(200),
  }),
]);

// ---------------------------------------------------------------------------
// Entidades: cada esquema es una LISTA BLANCA. Todo campo no declarado
// (status, total_amount, verified, created_by_id, …) se descarta (.strip()).
// ---------------------------------------------------------------------------
const shortId = z.string().trim().min(1).max(64);
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD).')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'Fecha inválida.');

const MAX_JSON_BYTES = 16_000;
const boundedJson = z
  .record(z.unknown())
  .refine((value) => JSON.stringify(value).length <= MAX_JSON_BYTES, 'El objeto es demasiado grande.');
const percent = z.number().min(0).max(100);

const hoursSchema = z
  .number()
  .refine((value) => (ALLOWED_BOOKING_HOURS as readonly number[]).includes(value), 'Duración no permitida.');

export const bookingCreateSchema = z.object({
  tutor_id: shortId,
  subject: z.string().trim().max(64).optional(),
  date: isoDate,
  hours: hoursSchema.default(1),
});
export const bookingUpdateSchema = z.object({ date: isoDate }).partial();

const tutorFields = {
  full_name: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(1000).default(''),
  credential: z.string().trim().max(200).optional(),
  subjects_offered: z.array(shortId).min(1).max(20),
  hourly_rate: z.number().min(MIN_HOURLY_RATE_MXN).max(MAX_HOURLY_RATE_MXN),
  photo_url: z
    .string()
    .trim()
    .max(500)
    .url()
    .refine((value) => /^https?:\/\//i.test(value), 'La foto debe ser una URL http(s).')
    .optional(),
};
export const tutorCreateSchema = z.object(tutorFields);
export const tutorUpdateSchema = z.object(tutorFields).partial();

const insightFields = {
  subject_id: shortId,
  kind: z.enum(['tip', 'plantilla']),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(4000),
  professor: z.string().trim().max(100).default(''),
};
export const insightCreateSchema = z.object(insightFields);
export const insightUpdateSchema = z.object(insightFields).partial();

export const evalConfigCreateSchema = z.object({
  subject_id: shortId,
  mode: z.enum(['examen', 'proyectos', 'tradicional']),
});
export const evalConfigUpdateSchema = z.object({ mode: z.enum(['examen', 'proyectos', 'tradicional']) });

const progressFields = {
  subject_id: shortId,
  topic_id: shortId,
  exercises_completed: z.number().int().min(0).max(1000).default(0),
  mastery_percentage: percent.default(0),
  unlocked: z.boolean().default(true),
};
export const progressCreateSchema = z.object(progressFields);
export const progressUpdateSchema = z.object(progressFields).partial();

const examFields = {
  score_pct: percent,
  correct: z.number().int().min(0).max(500),
  total: z.number().int().min(1).max(500),
  duration_sec: z.number().min(0).max(86_400).optional(),
  detail: boundedJson.optional(),
};
export const examCreateSchema = z.object(examFields).refine((v) => v.correct <= v.total, 'correct no puede exceder total.');
export const examUpdateSchema = z.object(examFields).partial();

const diagnosticFields = {
  score_algebra: percent,
  score_trig: percent,
  score_geometry: percent,
  score_calculus: percent,
  score_physics: percent,
  detected_gaps: boundedJson,
  recommended_roadmap: boundedJson,
  correct: z.number().int().min(0).max(200),
  total: z.number().int().min(1).max(200),
};
export const diagnosticCreateSchema = z.object(diagnosticFields);
export const diagnosticUpdateSchema = z.object(diagnosticFields).partial();

export const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(1000),
  screen_name: z.string().trim().max(120).default(''),
});

export type EntityName =
  | 'Booking'
  | 'DiagnosticResult'
  | 'ExamResult'
  | 'ProfInsight'
  | 'SubjectEvalConfig'
  | 'TutorProfile'
  | 'UserProgress';

export const entityRules: Record<EntityName, { create: z.ZodTypeAny; update: z.ZodTypeAny }> = {
  Booking: { create: bookingCreateSchema, update: bookingUpdateSchema },
  DiagnosticResult: { create: diagnosticCreateSchema, update: diagnosticUpdateSchema },
  ExamResult: { create: examCreateSchema, update: examUpdateSchema },
  ProfInsight: { create: insightCreateSchema, update: insightUpdateSchema },
  SubjectEvalConfig: { create: evalConfigCreateSchema, update: evalConfigUpdateSchema },
  TutorProfile: { create: tutorCreateSchema, update: tutorUpdateSchema },
  UserProgress: { create: progressCreateSchema, update: progressUpdateSchema },
};

export const isEntityName = (value: string): value is EntityName =>
  Object.prototype.hasOwnProperty.call(entityRules, value);

/** Mensaje legible a partir de un ZodError (primer problema). */
export function firstIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Solicitud inválida.';
  if (issue.code === 'unrecognized_keys') {
    return `Campos no permitidos: ${issue.keys.join(', ')}.`;
  }
  const where = issue.path.length ? `${issue.path.join('.')}: ` : '';
  return `${where}${issue.message}`;
}
