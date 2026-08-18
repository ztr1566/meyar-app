import {
  createRecipe,
  deleteRecipe,
  getRecipe,
  listRecipes,
  updateRecipe
} from '../services/recipe.service.js';

export async function listRecipesController(request, reply) {
  return reply.send(await listRecipes(request.validated.query));
}

export async function getRecipeController(request, reply) {
  return reply.send(await getRecipe(request.validated.params.id));
}

export async function createRecipeController(request, reply) {
  const recipe = await createRecipe(request.user.id, request.validated.body);
  return reply.code(201).send(recipe);
}

export async function updateRecipeController(request, reply) {
  const { id } = request.validated.params;
  return reply.send(await updateRecipe(id, request.user.id, request.validated.body));
}

export async function deleteRecipeController(request, reply) {
  const { id } = request.validated.params;
  await deleteRecipe(id, request.user.id);
  return reply.code(204).send();
}
