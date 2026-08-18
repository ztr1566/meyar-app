import { prisma } from '../db/client.js';
import { assertOwner, badRequest, notFound } from '../errors.js';
import { PUBLIC_COMMENT_SELECT } from './selects.js';

export async function listComments(recipeId, { limit, offset }) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true }
  });
  if (!recipe) throw notFound('Recipe not found');

  return prisma.comment.findMany({
    where: { recipeId },
    select: PUBLIC_COMMENT_SELECT,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  });
}

export async function getComment(id) {
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: PUBLIC_COMMENT_SELECT
  });
  if (!comment) throw notFound('Comment not found');
  return comment;
}

export async function createComment(actorId, recipeId, commentData) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true }
  });
  if (!recipe) throw notFound('Recipe not found');
  if (commentData.authorId !== actorId) throw badRequest('Comment author must match authenticated user');
  if (commentData.recipeId !== recipeId) throw badRequest('Comment recipe must match route parameter');

  return prisma.comment.create({
    data: { content: commentData.content, authorId: actorId, recipeId },
    select: PUBLIC_COMMENT_SELECT
  });
}

export async function updateComment(id, actorId, commentData) {
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true }
  });
  if (!comment) throw notFound('Comment not found');
  assertOwner(actorId, comment.authorId);

  return prisma.comment.update({
    where: { id },
    data: { content: commentData.content },
    select: PUBLIC_COMMENT_SELECT
  });
}

export async function deleteComment(id, actorId) {
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true }
  });
  if (!comment) throw notFound('Comment not found');
  assertOwner(actorId, comment.authorId);

  return prisma.comment.delete({
    where: { id },
    select: PUBLIC_COMMENT_SELECT
  });
}
