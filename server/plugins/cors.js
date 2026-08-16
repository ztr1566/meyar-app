import cors from '@fastify/cors';

export function corsPlugin(app) {
  app.register(cors, { origin: '*' });
}
