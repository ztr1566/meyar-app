import { pathToFileURL } from 'node:url';
import { buildApp } from './app.js';

const defaultPort = Number.parseInt(process.env.PORT ?? '3000', 10);
const defaultHost = process.env.HOST ?? '0.0.0.0';

export async function startServer({ port = defaultPort, host = defaultHost } = {}) {
  const app = buildApp({ logger: true });
  let closePromise;

  const shutdown = async (signal) => {
    closePromise ??= app.close();
    app.log.info({ signal }, 'Server shut down');
    await closePromise;
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);

  try {
    await app.listen({ port, host });
    return app;
  } catch (error) {
    await app.close();
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
