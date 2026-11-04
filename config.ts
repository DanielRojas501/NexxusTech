import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';

/**
 * Seguro por defecto: cualquier valor de NODE_ENV que NO sea explícitamente
 * "development" o "test" se trata como producción. Así, aunque el script de
 * arranque olvide definir NODE_ENV, el servidor no cae en modos permisivos.
 */
const nodeEnv = process.env.NODE_ENV ?? '';
export const isTest = nodeEnv === 'test';
export const isDevelopment = nodeEnv === 'development' || isTest;
export const isProduction = !isDevelopment;

const PLACEHOLDER_SECRETS = new Set([
  'replace_with_a_random_secret_at_least_32_characters',
  'local-development-secret-change-before-deployment',
]);

const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(blankToUndefined, schema.optional());

const envSchema = z.object({
  PORT: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(65535).default(3000)),
  APP_URL: optional(z.string().url()),
  CORS_ORIGIN: optional(z.string()),
  JWT_SECRET: optional(z.string()),
  DATABASE_PATH: optional(z.string()),
  TRUST_PROXY: optional(z.string()),
  STRIPE_SECRET_KEY: optional(z.string()),
  STRIPE_WEBHOOK_SECRET: optional(z.string()),
  STRIPE_PRICE_MONTHLY: optional(z.string()),
  STRIPE_PRICE_ANNUAL: optional(z.string()),
  RESEND_API_KEY: optional(z.string()),
  MAIL_FROM: optional(z.string()),
  AI_API_URL: optional(z.string().url()),
  AI_API_KEY: optional(z.string()),
  AI_MODEL: optional(z.string()),
});

function buildConfig() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Configuración de entorno inválida → ${detail}`);
  }
  const env = parsed.data;
  const problems: string[] = [];
  const warnings: string[] = [];

  // --- JWT ---------------------------------------------------------------
  let jwtSecret = env.JWT_SECRET;
  if (jwtSecret !== undefined && (jwtSecret.length < 32 || PLACEHOLDER_SECRETS.has(jwtSecret))) {
    problems.push('JWT_SECRET debe tener al menos 32 caracteres y no puede ser el valor de ejemplo.');
    jwtSecret = undefined;
  }
  if (jwtSecret === undefined && !problems.length) {
    if (isProduction) {
      problems.push('JWT_SECRET es obligatorio (mínimo 32 caracteres aleatorios). Genera uno con: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
    } else {
      // Solo desarrollo/test: secreto efímero y aleatorio (jamás uno fijo en el repositorio).
      jwtSecret = randomBytes(48).toString('hex');
      warnings.push('JWT_SECRET no está definido: se usa un secreto aleatorio temporal; las sesiones se invalidan al reiniciar.');
    }
  }

  // --- URLs / CORS -------------------------------------------------------
  const toOrigin = (value: string, label: string): string | null => {
    try {
      return new URL(value).origin;
    } catch {
      problems.push(`${label} no es una URL válida: ${value}`);
      return null;
    }
  };

  let appUrl = env.APP_URL;
  if (!appUrl) {
    if (isProduction) problems.push('APP_URL es obligatorio en producción (p. ej. https://tudominio.com).');
    else appUrl = 'http://localhost:5173';
  }
  const appOrigin = appUrl ? toOrigin(appUrl, 'APP_URL') : null;
  if (isProduction && appOrigin && !appOrigin.startsWith('https://')) {
    warnings.push('APP_URL no usa https; los enlaces de pago y de restablecimiento deberían ser https en producción.');
  }

  const corsOrigins = new Set<string>();
  if (appOrigin) corsOrigins.add(appOrigin);
  for (const raw of (env.CORS_ORIGIN ?? '').split(',').map((s) => s.trim()).filter(Boolean)) {
    const origin = toOrigin(raw, 'CORS_ORIGIN');
    if (origin) corsOrigins.add(origin);
  }
  if (isDevelopment) {
    corsOrigins.add('http://localhost:5173');
    corsOrigins.add('http://127.0.0.1:5173');
  }

  // --- Proxy (Railway, Render, Fly…) -------------------------------------
  let trustProxy: boolean | number | string = isProduction ? 1 : false;
  if (env.TRUST_PROXY !== undefined) {
    if (/^\d+$/.test(env.TRUST_PROXY)) trustProxy = Number(env.TRUST_PROXY);
    else if (env.TRUST_PROXY === 'false') trustProxy = false;
    else if (env.TRUST_PROXY === 'true') {
      problems.push('TRUST_PROXY=true confía en cualquier X-Forwarded-For (permite falsificar IP y evadir el rate limit). Usa un número de saltos (p. ej. 1).');
    } else trustProxy = env.TRUST_PROXY;
  }

  // --- Base de datos -----------------------------------------------------
  if (isProduction && !env.DATABASE_PATH) {
    problems.push('DATABASE_PATH es obligatorio en producción y debe apuntar a un volumen persistente (p. ej. /data/database.json en Railway).');
  }

  // --- Stripe ------------------------------------------------------------
  if (env.STRIPE_SECRET_KEY) {
    if (isProduction) {
      if (!env.STRIPE_WEBHOOK_SECRET) problems.push('STRIPE_WEBHOOK_SECRET es obligatorio cuando Stripe está activo (sin webhook las suscripciones canceladas siguen siendo Premium).');
      if (!env.STRIPE_PRICE_MONTHLY || !env.STRIPE_PRICE_ANNUAL) problems.push('STRIPE_PRICE_MONTHLY y STRIPE_PRICE_ANNUAL son obligatorios cuando Stripe está activo.');
      if (env.STRIPE_SECRET_KEY.startsWith('sk_test_')) warnings.push('STRIPE_SECRET_KEY es una llave de prueba (sk_test_) en producción.');
    } else if (!env.STRIPE_WEBHOOK_SECRET) {
      warnings.push('STRIPE_WEBHOOK_SECRET no está definido: usa "stripe listen --forward-to localhost:3000/api/stripe/webhook" para probar el webhook.');
    }
  }

  // --- Correo ------------------------------------------------------------
  if (Boolean(env.RESEND_API_KEY) !== Boolean(env.MAIL_FROM)) {
    problems.push('RESEND_API_KEY y MAIL_FROM deben definirse juntos.');
  }
  if (isProduction && !env.RESEND_API_KEY) {
    warnings.push('Sin proveedor de correo: el restablecimiento de contraseña responderá 503 hasta configurar RESEND_API_KEY y MAIL_FROM.');
  }

  if (problems.length) {
    throw new Error(`Configuración insegura o incompleta:\n - ${problems.join('\n - ')}`);
  }
  if (!isTest) for (const warning of warnings) console.warn(`[config] ${warning}`);

  return Object.freeze({
    isProduction,
    isDevelopment,
    isTest,
    port: env.PORT,
    appUrl: appOrigin as string,
    corsOrigins: [...corsOrigins],
    trustProxy,
    jwtSecret: jwtSecret as string,
    databasePath: env.DATABASE_PATH ?? './data/database.json',
    stripe: {
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
      priceMonthly: env.STRIPE_PRICE_MONTHLY,
      priceAnnual: env.STRIPE_PRICE_ANNUAL,
    },
    mail: { apiKey: env.RESEND_API_KEY, from: env.MAIL_FROM },
    ai: { url: env.AI_API_URL ?? 'https://api.openai.com/v1/chat/completions', key: env.AI_API_KEY, model: env.AI_MODEL ?? 'gpt-4o-mini' },
  });
}

export const config = buildConfig();
