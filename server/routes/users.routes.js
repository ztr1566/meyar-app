import { validate } from '../validation.js';
import { idParamsSchema, listQuerySchema } from '../schemas/common.js';
import { userUpdateSchema } from '../schemas/user.js';
import {
  deleteUserController,
  getUserController,
  listUsersController,
  updateUserController
} from '../controllers/user.controller.js';

export async function userRoutes(app, { authenticate }) {
  app.get('/', {
    preHandler: validate({ query: listQuerySchema })
  }, listUsersController);
  app.get('/:id', {
    preHandler: validate({ params: idParamsSchema })
  }, getUserController);
  app.patch('/:id', {
    preHandler: [
      validate({ params: idParamsSchema, body: userUpdateSchema }),
      authenticate
    ]
  }, updateUserController);
  app.delete('/:id', {
    preHandler: [validate({ params: idParamsSchema }), authenticate]
  }, deleteUserController);
}
