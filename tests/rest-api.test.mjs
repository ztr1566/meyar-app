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
  assert.equal(result.response.statusCode, 201, result.response.body);
  assert.ok(result.body?.user?.id, 'registration response must include a user id');
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

test('recipe and comment CRUD validates input and enforces ownership', async () => {
  const owner = await register('CHEF');
  const other = await register('USER');
  const recipeInput = {
    title: 'API Test Recipe',
    description: 'A recipe description long enough for the API integration test.',
    prepTime: 10,
    cookTime: 20,
    servings: 2,
    difficulty: 'Medium',
    ingredients: [{ name: 'Salt', amount: 1, unit: 'tsp' }],
    steps: [{ instruction: 'Season and serve.' }],
    tags: ['test']
  };

  const invalid = await request('POST', '/api/recipes', {
    token: owner.token,
    body: { ...recipeInput, unexpected: true }
  });
  assert.equal(invalid.response.statusCode, 400);
  assert.equal(invalid.body.error.code, 'VALIDATION_ERROR');

  const created = await request('POST', '/api/recipes', {
    token: owner.token,
    body: recipeInput
  });
  assert.equal(created.response.statusCode, 201);
  const recipeId = created.body.id;
  createdRecipeIds.add(recipeId);

  const listed = await request('GET', '/api/recipes?limit=10&offset=0');
  assert.equal(listed.response.statusCode, 200);
  assert.ok(listed.body.some(recipe => recipe.id === recipeId));

  const comment = await request('POST', `/api/recipes/${recipeId}/comments`, {
    token: owner.token,
    body: { content: 'Useful API comment.', authorId: owner.user.id, recipeId }
  });
  assert.equal(comment.response.statusCode, 201);
  createdCommentIds.add(comment.body.id);

  const comments = await request('GET', `/api/recipes/${recipeId}/comments`);
  assert.equal(comments.response.statusCode, 200);
  assert.equal(comments.body[0].content, 'Useful API comment.');

  const commentId = comment.body.id;
  const forbidden = await request('PATCH', `/api/comments/${commentId}`, {
    token: other.token,
    body: { content: 'Cross-owner edit' }
  });
  assert.equal(forbidden.response.statusCode, 403);

  const updatedComment = await request('PATCH', `/api/comments/${commentId}`, {
    token: owner.token,
    body: { content: 'Updated API comment.' }
  });
  assert.equal(updatedComment.response.statusCode, 200);

  const updatedRecipe = await request('PATCH', `/api/recipes/${recipeId}`, {
    token: owner.token,
    body: { title: 'Updated API Recipe' }
  });
  assert.equal(updatedRecipe.response.statusCode, 200);
  assert.equal(updatedRecipe.body.title, 'Updated API Recipe');

  const deleted = await request('DELETE', `/api/recipes/${recipeId}`, { token: owner.token });
  assert.equal(deleted.response.statusCode, 204);
  const missing = await request('GET', `/api/recipes/${recipeId}`);
  assert.equal(missing.response.statusCode, 404);
});

test('supplier items and RFQs support CRUD with role and ownership rules', async () => {
  const supplier = await register('SUPPLIER');
  const other = await register('USER');
  const item = await request('POST', '/api/supply-items', {
    token: supplier.token,
    body: {
      title: 'API Test Mixer',
      category: 'Equipment',
      price: 1250,
      unit: 'piece',
      stock: 4,
      status: 'IN_STOCK'
    }
  });
  assert.equal(item.response.statusCode, 201);

  const itemId = item.body.id;
  createdSupplyItemIds.add(itemId);
  const itemUpdate = await request('PATCH', `/api/supply-items/${itemId}`, {
    token: supplier.token,
    body: { stock: 3 }
  });
  assert.equal(itemUpdate.response.statusCode, 200);
  assert.equal(itemUpdate.body.stock, 3);

  const itemForbidden = await request('DELETE', `/api/supply-items/${itemId}`, {
    token: other.token
  });
  assert.equal(itemForbidden.response.statusCode, 403);

  const rfq = await request('POST', '/api/rfqs', {
    token: other.token,
    body: {
      title: 'API Test Ingredient',
      description: 'Need a commercial quantity for the integration test.',
      budget: 500,
      deadline: '2026-09-01',
      requesterId: other.user.id
    }
  });
  assert.equal(rfq.response.statusCode, 201);

  const rfqId = rfq.body.id;
  createdRfqIds.add(rfqId);
  const rfqForbidden = await request('PATCH', `/api/rfqs/${rfqId}`, {
    token: supplier.token,
    body: { status: 'CLOSED' }
  });
  assert.equal(rfqForbidden.response.statusCode, 403);

  const rfqUpdate = await request('PATCH', `/api/rfqs/${rfqId}`, {
    token: other.token,
    body: { status: 'CLOSED' }
  });
  assert.equal(rfqUpdate.response.statusCode, 200);
  assert.equal(rfqUpdate.body.status, 'CLOSED');

  const listedItems = await request('GET', '/api/supply-items?limit=10&offset=0');
  const listedRfqs = await request('GET', '/api/rfqs?limit=10&offset=0');
  assert.ok(listedItems.body.some(value => value.id === itemId));
  assert.ok(listedRfqs.body.some(value => value.id === rfqId));

  assert.equal((await request('DELETE', `/api/supply-items/${itemId}`, { token: supplier.token })).response.statusCode, 204);
  assert.equal((await request('DELETE', `/api/rfqs/${rfqId}`, { token: other.token })).response.statusCode, 204);
});
