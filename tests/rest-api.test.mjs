import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { buildApp } from '../server/app.js';
import { prisma } from '../server/db/client.js';

const TEST_SECRET = 'rest-api-test-secret';
const app = buildApp({ logger: false, authSecret: TEST_SECRET });
const createdUserIds = new Set();
const createdRecipeIds = new Set();
const createdCommentIds = new Set();
const createdSupplyItemIds = new Set();
const createdRfqIds = new Set();

test.before(async () => app.ready());
test.after(async () => {
  try {
    await prisma.comment.deleteMany({ where: { id: { in: [...createdCommentIds] } } });
    await prisma.recipe.deleteMany({ where: { id: { in: [...createdRecipeIds] } } });
    await prisma.supplyItem.deleteMany({ where: { id: { in: [...createdSupplyItemIds] } } });
    await prisma.rfq.deleteMany({ where: { id: { in: [...createdRfqIds] } } });
    await prisma.user.deleteMany({ where: { id: { in: [...createdUserIds] } } });
  } finally {
    await app.close();
  }
});

async function request(method, url, { body, token } = {}) {
  const response = await app.inject({
    method,
    url,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { payload: JSON.stringify(body) } : {})
  });
  return { response, body: response.body ? JSON.parse(response.body) : null };
}

async function register(role = 'USER') {
  const suffix = randomUUID();
  const result = await request('POST', '/api/auth/register', {
    body: {
      email: `${suffix}@example.test`,
      password: 'Secret123!',
      name: `API User ${suffix.slice(0, 8)}`,
      handle: `@api_${suffix.replaceAll('-', '').slice(0, 20)}`,
      role
    }
  });
  assert.equal(result.response.statusCode, 201);
  createdUserIds.add(result.body.user.id);
  return result.body;
}

test('register, login, me, and user profile CRUD use public user responses', async () => {
  const account = await register();
  assert.ok(account.token);
  assert.equal(account.user.passwordHash, undefined);

  const login = await request('POST', '/api/auth/login', {
    body: { email: account.user.email, password: 'Secret123!' }
  });
  assert.equal(login.response.statusCode, 200);
  assert.ok(login.body.token);

  const me = await request('GET', '/api/auth/me', { token: login.body.token });
  assert.equal(me.response.statusCode, 200);
  assert.equal(me.body.id, account.user.id);
  assert.equal(me.body.passwordHash, undefined);

  const updated = await request('PATCH', `/api/users/${account.user.id}`, {
    token: account.token,
    body: { name: 'Updated API User' }
  });
  assert.equal(updated.response.statusCode, 200);
  assert.equal(updated.body.name, 'Updated API User');

  const list = await request('GET', '/api/users?limit=10&offset=0');
  assert.equal(list.response.statusCode, 200);
  assert.ok(list.body.some(user => user.id === account.user.id));

  const deletable = await register();
  const deleted = await request('DELETE', `/api/users/${deletable.user.id}`, {
    token: deletable.token
  });
  assert.equal(deleted.response.statusCode, 204);
});

test('authentication, duplicate registration, and cross-owner updates fail safely', async () => {
  const first = await register();
  const second = await register();

  const badLogin = await request('POST', '/api/auth/login', {
    body: { email: first.user.email, password: 'wrong-password' }
  });
  assert.deepEqual(badLogin.body.error, {
    code: 'UNAUTHORIZED',
    message: 'Invalid email or password'
  });

  const duplicate = await request('POST', '/api/auth/register', {
    body: {
      email: first.user.email,
      password: 'Secret123!',
      name: 'Duplicate',
      handle: '@duplicate_handle',
      role: 'USER'
    }
  });
  assert.equal(duplicate.response.statusCode, 409);

  const forbidden = await request('PATCH', `/api/users/${first.user.id}`, {
    token: second.token,
    body: { name: 'Not Allowed' }
  });
  assert.equal(forbidden.response.statusCode, 403);
});
