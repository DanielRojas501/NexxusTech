import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { config } from './config.js';

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const TOKEN_LIFETIME_SECONDS = 60 * 60 * 24 * 7;
const CLOCK_SKEW_SECONDS = 60;
const MAX_TOKEN_LENGTH = 2048;
const ISSUER = 'nexxustech';
const AUDIENCE = 'nexxustech-web';
const BASE64URL = /^[A-Za-z0-9_-]+$/;

// ---------------------------------------------------------------------------
// Contraseñas (scrypt). Formato "saltHex:hashHex" — compatible con hashes previos.
// ---------------------------------------------------------------------------
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex || !/^[\da-f]+$/i.test(saltHex + hashHex)) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

let dummyHash: Promise<string> | undefined;

/**
 * Verifica la contraseña; si el usuario no existe ejecuta igualmente un scrypt
 * contra un hash señuelo, para que el tiempo de respuesta no revele qué correos
 * están registrados.
 */
export async function verifyPasswordOrDummy(
  password: string,
  storedHash: string | undefined,
): Promise<boolean> {
  if (storedHash) return verifyPassword(password, storedHash);
  dummyHash ??= hashPassword(randomBytes(16).toString('hex'));
  await verifyPassword(password, await dummyHash);
  return false;
}

// ---------------------------------------------------------------------------
// JWT HS256. El secreto viene de config (validado al arrancar; nunca hay un
// respaldo estático). `pwv` = versión de credenciales del usuario: al cambiar la
// contraseña se incrementa y todos los tokens anteriores quedan revocados.
// ---------------------------------------------------------------------------
export interface AccessClaims {
  userId: string;
  tokenVersion: number;
}

const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

function sign(unsigned: string): Buffer {
  return createHmac('sha256', config.jwtSecret).update(unsigned).digest();
}

export function createAccessToken(userId: string, tokenVersion: number): string {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
    sub: userId,
    iat: now,
    exp: now + TOKEN_LIFETIME_SECONDS,
    iss: ISSUER,
    aud: AUDIENCE,
    pwv: tokenVersion,
  })}`;
  return `${unsigned}.${sign(unsigned).toString('base64url')}`;
}

export function verifyAccessToken(token: string): AccessClaims | null {
  if (token.length > MAX_TOKEN_LENGTH) return null;
  const parts = token.split('.');
  if (parts.length !== 3 || !parts.every((part) => BASE64URL.test(part))) return null;
  const [header, payload, signature] = parts;

  // 1) Firma (comparación en tiempo constante) antes de interpretar nada.
  const expected = sign(`${header}.${payload}`);
  const received = Buffer.from(signature, 'base64url');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

  try {
    // 2) Cabecera: solo HS256 (defensa en profundidad contra confusión de algoritmo).
    const head: unknown = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'));
    if (typeof head !== 'object' || head === null || (head as { alg?: unknown }).alg !== 'HS256') {
      return null;
    }
    // 3) Claims.
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>;
    const now = Date.now() / 1000;
    if (
      typeof claims.sub !== 'string' ||
      typeof claims.exp !== 'number' ||
      typeof claims.iat !== 'number' ||
      typeof claims.pwv !== 'number' ||
      !Number.isInteger(claims.pwv) ||
      claims.iss !== ISSUER ||
      claims.aud !== AUDIENCE ||
      claims.exp <= now ||
      claims.iat > now + CLOCK_SKEW_SECONDS
    ) {
      return null;
    }
    return { userId: claims.sub, tokenVersion: claims.pwv };
  } catch {
    return null;
  }
}

export function createPasswordResetToken(): string {
  return randomBytes(32).toString('base64url');
}
