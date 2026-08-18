import { validate } from '../validation.js';
import { loginSchema, registerSchema } from '../schemas/auth.js';
import { loginController, meController, registerController } from '../controllers/auth.controller.js';
import { createAuthenticate } from '../auth/guard.js';

export async function authRoutes(app, { secret }) {
  const authenticate = createAuthenticate({ secret });

  app.post('/register', {
    preHandler: validate({ body: registerSchema })
  }, (request, reply) => registerController(request, reply, { secret }));
  app.post('/login', {
    preHandler: validate({ body: loginSchema })
  }, (request, reply) => loginController(request, reply, { secret }));
  app.get('/me', { preHandler: authenticate }, meController);
}
