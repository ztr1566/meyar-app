import Fastify from 'fastify';
import { corsPlugin } from './plugins/cors.js';
import { staticPlugin, PROJECT_ROOT } from './plugins/static.js';
import { healthRoutes } from './routes/health.routes.js';

function errorBody(code, message) {
  return { error: { code, message } };
}

function safeStatusCode(error) {
  return Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode < 500
    ? error.statusCode
    : 500;
}

export function buildApp({ logger = true, staticRoot = PROJECT_ROOT } = {}) {
  const app = Fastify({ logger });

  app.setErrorHandler((error, request, reply) => {
    const statusCode = safeStatusCode(error);
    const isServerError = statusCode >= 500;
    if (isServerError) request.log.error({ err: error }, 'Request failed');

    return reply.status(statusCode).send(errorBody(
      isServerError ? 'INTERNAL_SERVER_ERROR' : (error.code || 'REQUEST_ERROR'),
      isServerError ? 'Internal Server Error' : error.message
    ));
  });

  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send(errorBody('NOT_FOUND', 'Route not found'));
  });

  corsPlugin(app);
  app.register(staticPlugin, { root: staticRoot });
  app.register(healthRoutes, { prefix: '/api' });
  return app;
}
