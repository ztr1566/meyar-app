import { validate } from '../validation.js';
import { idParamsSchema, listQuerySchema, recipeIdParamsSchema } from '../schemas/common.js';
import { commentCreateSchema, commentUpdateSchema } from '../schemas/comment.js';
import {
  createCommentController,
  deleteCommentController,
  getCommentController,
  listCommentsController,
  updateCommentController
} from '../controllers/comment.controller.js';

export async function commentRoutes(app, { authenticate }) {
  app.get('/recipes/:recipeId/comments', {
    preHandler: validate({ params: recipeIdParamsSchema, query: listQuerySchema })
  }, listCommentsController);
  app.post('/recipes/:recipeId/comments', {
    preHandler: [validate({ params: recipeIdParamsSchema, body: commentCreateSchema }), authenticate]
  }, createCommentController);
  app.get('/comments/:id', {
    preHandler: validate({ params: idParamsSchema })
  }, getCommentController);
  app.patch('/comments/:id', {
    preHandler: [validate({ params: idParamsSchema, body: commentUpdateSchema }), authenticate]
  }, updateCommentController);
  app.delete('/comments/:id', {
    preHandler: [validate({ params: idParamsSchema }), authenticate]
  }, deleteCommentController);
}
