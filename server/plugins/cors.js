import cors from '@fastify/cors';

export async function corsPlugin(app) {
  await app.register(cors, { origin: '*' });
}
