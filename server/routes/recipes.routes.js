import { validate } from '../validation.js';
import { idParamsSchema, listQuerySchema } from '../schemas/common.js';
import { recipeCreateSchema, recipeUpdateSchema } from '../schemas/recipe.js';
import {
  createRecipeController,
  deleteRecipeController,
  getRecipeController,
  listRecipesController,
  updateRecipeController
} from '../controllers/recipe.controller.js';

export async function recipeRoutes(app, { authenticate }) {
  app.get('/', {
    preHandler: validate({ query: listQuerySchema })
  }, listRecipesController);
  app.get('/:id', {
    preHandler: validate({ params: idParamsSchema })
  }, getRecipeController);
  app.post('/', {
    preHandler: [validate({ body: recipeCreateSchema }), authenticate]
  }, createRecipeController);
  app.patch('/:id', {
    preHandler: [validate({ params: idParamsSchema, body: recipeUpdateSchema }), authenticate]
  }, updateRecipeController);
  app.delete('/:id', {
    preHandler: [validate({ params: idParamsSchema }), authenticate]
  }, deleteRecipeController);
}
