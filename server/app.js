import Fastify from 'fastify';
import { corsPlugin } from './plugins/cors.js';
import { staticPlugin, PROJECT_ROOT } from './plugins/static.js';
import { healthRoutes } from './routes/health.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { userRoutes } from './routes/users.routes.js';
import { registerDatabase } from './db/client.js';
import { createAuthenticate } from './auth/guard.js';
import { mapError } from './errors.js';

function errorBody(code, message) {
  return { error: { code, message } };
}

function safeStatusCode(error) {
  return Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode < 500
    ? error.statusCode
    : 500;
}

export function buildApp({
  logger = true,
  staticRoot = PROJECT_ROOT,
  authSecret = process.env.AUTH_SECRET ?? 'meyar-local-development-secret'
} = {}) {
  const app = Fastify({ logger });

  registerDatabase(app);

  app.setErrorHandler((error, request, reply) => {
    const publicError = mapError(error);
    const statusCode = safeStatusCode(publicError ?? error);
    const isServerError = statusCode >= 500;
    if (isServerError) request.log.error({ err: error }, 'Request failed');

    return reply.status(statusCode).send(errorBody(
      isServerError ? 'INTERNAL_SERVER_ERROR' : (publicError?.code || error.code || 'REQUEST_ERROR'),
      isServerError ? 'Internal Server Error' : (publicError?.message || error.message)
    ));
  });

  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send(errorBody('NOT_FOUND', 'Route not found'));
  });

  // ponytail: root scope is intentional because nested registration encapsulates CORS.
  corsPlugin(app);
  app.register(staticPlugin, { root: staticRoot });
  app.register(healthRoutes, { prefix: '/api' });
  const authenticate = createAuthenticate({ secret: authSecret });
  app.register(authRoutes, { prefix: '/api/auth', secret: authSecret });
  app.register(userRoutes, { prefix: '/api/users', authenticate });
  return app;
}
