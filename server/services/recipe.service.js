import { prisma } from '../db/client.js';
import { assertOwner, notFound } from '../errors.js';
import { PUBLIC_AUTHOR_SELECT, PUBLIC_COMMENT_SELECT } from './selects.js';

const RECIPE_INCLUDE = {
  author: { select: PUBLIC_AUTHOR_SELECT }
};

const RECIPE_DETAIL_INCLUDE = {
  ...RECIPE_INCLUDE,
  comments: {
    select: PUBLIC_COMMENT_SELECT,
    orderBy: { createdAt: 'desc' }
  }
};

export function listRecipes({ limit, offset }) {
  return prisma.recipe.findMany({
    include: RECIPE_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  });
}

export async function getRecipe(id) {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: RECIPE_DETAIL_INCLUDE
  });
  if (!recipe) throw notFound();
  return recipe;
}

export function createRecipe(actorId, recipeData) {
  return prisma.recipe.create({
    data: { ...recipeData, authorId: actorId },
    include: RECIPE_INCLUDE
  });
}

export async function updateRecipe(id, actorId, recipeData) {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: { authorId: true }
  });
  if (!recipe) throw notFound('Recipe not found');
  assertOwner(actorId, recipe.authorId);

  return prisma.recipe.update({
    where: { id },
    data: recipeData,
    include: RECIPE_INCLUDE
  });
}

export async function deleteRecipe(id, actorId) {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: { authorId: true }
  });
  if (!recipe) throw notFound('Recipe not found');
  assertOwner(actorId, recipe.authorId);

  return prisma.recipe.delete({
    where: { id },
    include: RECIPE_INCLUDE
  });
}
