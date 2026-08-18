import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual
} from 'node:crypto';
import { promisify } from 'node:util';
import { unauthorized } from '../errors.js';

const scrypt = promisify(scryptCallback);
const SCRYPT_OPTIONS = { N: 16_384, r: 8, p: 1 };
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_BYTES = 64;
const TOKEN_TTL = 86_400_000;

export async function hashPassword(password) {
  const salt = randomBytes(PASSWORD_SALT_BYTES);
  const derivedKey = await scrypt(password, salt, PASSWORD_KEY_BYTES, SCRYPT_OPTIONS);
  return `${salt.toString('base64url')}.${derivedKey.toString('base64url')}`;
}

export async function verifyPassword(password, encodedHash) {
  if (typeof encodedHash !== 'string') return false;
  const parts = encodedHash.split('.');
  if (parts.length !== 2) return false;

  const salt = Buffer.from(parts[0], 'base64url');
  const expectedKey = Buffer.from(parts[1], 'base64url');
  if (salt.length !== PASSWORD_SALT_BYTES || expectedKey.length !== PASSWORD_KEY_BYTES) return false;

  const derivedKey = await scrypt(password, salt, PASSWORD_KEY_BYTES, SCRYPT_OPTIONS);
  return timingSafeEqual(derivedKey, expectedKey);
}

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function tokenSignature(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function signToken(userId, { secret, now = Date.now() }) {
  const payload = encodePayload({ sub: userId, exp: now + TOKEN_TTL });
  return `${payload}.${tokenSignature(payload, secret)}`;
}

export function verifyToken(token, { secret, now = Date.now() }) {
  try {
    const [payloadPart, signaturePart] = token.split('.');
    if (!payloadPart || !signaturePart || token.split('.').length !== 2) throw new Error('Malformed token');

    const expectedSignature = Buffer.from(tokenSignature(payloadPart, secret), 'base64url');
    const providedSignature = Buffer.from(signaturePart, 'base64url');
    if (expectedSignature.length !== providedSignature.length
      || !timingSafeEqual(expectedSignature, providedSignature)) {
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString());
    if (typeof payload.sub !== 'string' || !Number.isFinite(payload.exp) || payload.exp <= now) {
      throw new Error('Expired token');
    }
    return payload.sub;
  } catch {
    throw unauthorized('Invalid token');
  }
}
