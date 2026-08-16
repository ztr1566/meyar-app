import test from 'node:test';
import assert from 'node:assert/strict';
import {
  commentCreateSchema,
  loginSchema,
  recipeCreateSchema,
  registerSchema,
  rfqCreateSchema
} from '../server/schemas/index.js';

test('auth schemas accept valid register and login payloads', () => {
  assert.equal(registerSchema.safeParse({
    email: 'chef@example.com',
    password: 'Secret123!',
    name: 'Chef Example',
    handle: '@chef_example',
    role: 'CHEF'
  }).success, true);
  assert.equal(loginSchema.safeParse({
    email: 'chef@example.com',
    password: 'Secret123!'
  }).success, true);
});

test('strict schemas reject unknown keys and invalid boundaries', () => {
  assert.equal(registerSchema.safeParse({
    email: 'chef@example.com',
    password: 'Secret123!',
    name: 'Chef Example',
    handle: '@chef_example',
    isAdmin: true
  }).success, false);
  assert.equal(recipeCreateSchema.safeParse({
    title: 'Too short',
    description: 'A recipe description long enough for the request.',
    prepTime: -1,
    cookTime: 10,
    servings: 2,
    difficulty: 'Hard',
    ingredients: [{ name: 'Salt' }],
    steps: [{ instruction: 'Season.' }],
    tags: ['savory']
  }).success, false);
  assert.equal(commentCreateSchema.safeParse({
    content: '',
    authorId: 'chef-1',
    recipeId: 'recipe-1'
  }).success, false);
  assert.equal(rfqCreateSchema.safeParse({
    title: 'Mixer',
    description: 'Need a commercial mixer.',
    budget: 0,
    deadline: '2026-09-01',
    requesterId: 'chef-1'
  }).success, false);
});
