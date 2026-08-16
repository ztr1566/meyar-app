import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { disconnectDatabase, prisma } from '../server/db/client.js';

test.after(async () => {
  await disconnectDatabase();
});

test('Prisma connects to PostgreSQL', async () => {
  await prisma.$connect();
  const rows = await prisma.$queryRaw`SELECT 1 AS ok`;
  assert.equal(rows[0].ok, 1);
});

test('CRUD works and deleting a recipe cascades to comments', async () => {
  const suffix = randomUUID();
  const userId = `test-user-${suffix}`;
  const recipeId = `test-recipe-${suffix}`;
  const commentId = `test-comment-${suffix}`;
  try {
    await prisma.user.create({
      data: {
        id: userId,
        email: `${suffix}@example.test`,
        passwordHash: 'test-only',
        name: 'Database Test User',
        handle: `@db_test_${suffix.replaceAll('-', '').slice(0, 16)}`,
        role: 'USER'
      }
    });
    await prisma.recipe.create({
      data: {
        id: recipeId,
        title: 'Database Test Recipe',
        description: 'Recipe used by the database integration test.',
        prepTime: 10,
        cookTime: 20,
        servings: 2,
        difficulty: 'Medium',
        ingredients: [{ name: 'Salt', amount: 1 }],
        steps: [{ instruction: 'Season.' }],
        tags: ['test'],
        authorId: userId
      }
    });
    await prisma.comment.create({
      data: { id: commentId, content: 'Useful recipe.', authorId: userId, recipeId }
    });
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: 'Updated recipe comment.' }
    });
    assert.equal(updated.content, 'Updated recipe comment.');
    await prisma.recipe.delete({ where: { id: recipeId } });
    assert.equal(await prisma.comment.findUnique({ where: { id: commentId } }), null);
  } finally {
    await prisma.comment.deleteMany({ where: { id: commentId } });
    await prisma.recipe.deleteMany({ where: { id: recipeId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  }
});

test('the comment recipe and creation-time index exists', async () => {
  const rows = await prisma.$queryRaw`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'comments'
  `;
  assert.ok(rows.some(({ indexname }) => indexname === 'comment_recipe_created_at_idx'));
});
