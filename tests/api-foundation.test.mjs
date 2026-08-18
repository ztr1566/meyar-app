import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../server/auth/tokens.js';
import { AppError } from '../server/errors.js';
import { validate } from '../server/validation.js';
import { z } from 'zod';

test('password hashes verify without storing the clear text', async () => {
  const password = 'Secret123!';
  const encoded = await hashPassword(password);

  assert.notEqual(encoded, password);
  assert.equal(await verifyPassword(password, encoded), true);
  assert.equal(await verifyPassword('wrong-password', encoded), false);
});

test('signed tokens round-trip and reject tampering or expiry', () => {
  const now = 1_700_000_000_000;
  const token = signToken('user-1', { secret: 'test-secret', now });

  assert.equal(verifyToken(token, { secret: 'test-secret', now }), 'user-1');
  assert.throws(() => verifyToken(`${token}x`, { secret: 'test-secret', now }), AppError);
  assert.throws(() => verifyToken(token, { secret: 'test-secret', now: now + 86_400_001 }), AppError);
});

test('request validation stores parsed values and rejects unknown keys', async () => {
  const preHandler = validate({
    body: z.strictObject({ name: z.string().trim().min(1) })
  });
  const request = { body: { name: ' Chef ' } };

  await preHandler(request);
  assert.deepEqual(request.validated.body, { name: 'Chef' });

  await assert.rejects(
    () => preHandler({ body: { name: 'Chef', admin: true } }),
    (error) => error instanceof AppError && error.code === 'VALIDATION_ERROR'
  );
});
