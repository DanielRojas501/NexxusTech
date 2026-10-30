import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const tokenLifetimeSeconds = 60 * 60 * 24 * 7;

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Set JWT_SECRET to a random value of at least 32 characters.');
  }
  return 'local-development-secret-change-before-deployment';
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex || !/^[\da-f]+$/i.test(saltHex + hashHex)) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = (await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createAccessToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
    sub: userId,
    iat: now,
    exp: now + tokenLifetimeSeconds,
  })}`;
  const signature = createHmac('sha256', jwtSecret()).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

export function verifyAccessToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const unsigned = `${header}.${payload}`;
  const expected = createHmac('sha256', jwtSecret()).update(unsigned).digest();
  let received: Buffer;
  try {
    received = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const claims: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (
      typeof claims === 'object' &&
      claims !== null &&
      'sub' in claims &&
      typeof claims.sub === 'string' &&
      'exp' in claims &&
      typeof claims.exp === 'number' &&
      claims.exp > Date.now() / 1000
    ) {
      return claims.sub;
    }
  } catch {
    return null;
  }
  return null;
}

export function createPasswordResetToken(): string {
  return randomBytes(32).toString('base64url');
}
