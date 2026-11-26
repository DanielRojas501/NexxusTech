import type { Request, RequestHandler } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

const MINUTE = 60_000;

interface LimiterOptions {
  windowMs: number;
  limit: number;
  message: string;
  /** Clave de agrupación; por defecto, la IP (los IPv6 se agrupan por subred /56). */
  key?: (req: Request) => string;
  /** Solo cuentan las respuestas con error (p. ej. inicios de sesión fallidos). */
  failuresOnly?: boolean;
}

const clientIp = (req: Request) => ipKeyGenerator(req.ip ?? '0.0.0.0');
const bodyEmail = (req: Request) =>
  typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 254) : '';

function limiter(options: LimiterOptions): RequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: options.failuresOnly ?? false,
    keyGenerator: options.key ?? clientIp,
    handler: (_req, res) => {
      res.status(429).json({ error: options.message });
    },
  });
}

/**
 * Se crean dentro de una función (no a nivel de módulo) para que cada instancia
 * de la app —y cada prueba— tenga contadores propios.
 *
 * Nota sobre redes compartidas: en una escuela muchos alumnos salen por la misma
 * IP; por eso los topes por IP son holgados y el control fino va por cuenta.
 * Los contadores viven en memoria: con varias instancias usa un store externo
 * (p. ej. rate-limit-redis).
 */
export function createRateLimiters() {
  return {
    /** Red de seguridad para toda la API. */
    api: limiter({ windowMs: 15 * MINUTE, limit: 3000, message: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' }),

    // Inicio de sesión: tres capas, todas cuentan SOLO intentos fallidos.
    loginByIp: limiter({
      windowMs: 15 * MINUTE, limit: 100, failuresOnly: true,
      message: 'Demasiados intentos fallidos desde tu red. Intenta de nuevo en 15 minutos.',
    }),
    loginByIpAndEmail: limiter({
      windowMs: 15 * MINUTE, limit: 8, failuresOnly: true,
      key: (req) => `${clientIp(req)}|${bodyEmail(req)}`,
      message: 'Demasiados intentos fallidos para esta cuenta. Intenta de nuevo en 15 minutos o restablece tu contraseña.',
    }),
    loginByEmail: limiter({
      windowMs: 60 * MINUTE, limit: 30, failuresOnly: true,
      key: (req) => `acct|${bodyEmail(req)}`,
      message: 'Esta cuenta recibió demasiados intentos fallidos. Restablece tu contraseña o inténtalo más tarde.',
    }),

    register: limiter({ windowMs: 60 * MINUTE, limit: 30, message: 'Demasiados registros desde tu red. Intenta más tarde.' }),
    forgotByIp: limiter({ windowMs: 60 * MINUTE, limit: 30, message: 'Demasiadas solicitudes de restablecimiento. Intenta más tarde.' }),
    forgotByEmail: limiter({
      windowMs: 60 * MINUTE, limit: 3,
      key: (req) => `forgot|${bodyEmail(req)}`,
      message: 'Ya solicitaste varios enlaces para este correo. Revisa tu bandeja o intenta más tarde.',
    }),
    resetPassword: limiter({ windowMs: 15 * MINUTE, limit: 20, message: 'Demasiados intentos. Intenta de nuevo en unos minutos.' }),
    feedback: limiter({ windowMs: 60 * MINUTE, limit: 30, message: 'Has enviado demasiados comentarios. Intenta más tarde.' }),

    /** Por usuario autenticado (cuida el costo del proveedor de IA y la escritura en disco). */
    profeBot: limiter({
      windowMs: 10 * MINUTE, limit: 30,
      key: (req) => `bot|${req.userId ?? clientIp(req)}`,
      message: 'Has hecho muchas preguntas seguidas. Espera unos minutos.',
    }),
    writes: limiter({
      windowMs: 15 * MINUTE, limit: 600,
      key: (req) => `write|${req.userId ?? clientIp(req)}`,
      message: 'Demasiadas operaciones. Intenta de nuevo en unos minutos.',
    }),
    checkout: limiter({
      windowMs: 15 * MINUTE, limit: 30,
      key: (req) => `pay|${req.userId ?? clientIp(req)}`,
      message: 'Demasiados intentos de pago. Intenta de nuevo en unos minutos.',
    }),
  };
}

export type RateLimiters = ReturnType<typeof createRateLimiters>;
