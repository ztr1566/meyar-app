import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../generated/prisma/client.ts';

function createDatabaseClient() {
  const databaseUrl = process.env.DATABASE_URL
    ?? 'postgresql://meyar_user:meyar_password@localhost:5432/meyar_db?schema=public';
  const configuredPoolMax = Number.parseInt(process.env.DB_POOL_MAX ?? '10', 10);
  const pool = new Pool({
    connectionString: databaseUrl,
    max: Number.isInteger(configuredPoolMax) && configuredPoolMax > 0 ? configuredPoolMax : 10,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 300_000
  });
  const adapter = new PrismaPg(pool);

  return { prisma: new PrismaClient({ adapter }), pool };
}

let active = createDatabaseClient();
export let prisma = active.prisma;
let closePromise;

function ensureActiveClient() {
  if (!closePromise) return;
  active = createDatabaseClient();
  prisma = active.prisma;
  closePromise = undefined;
}

async function closeActiveClient({ prisma: client, pool }) {
  try {
    await client.$disconnect();
  } finally {
    await pool.end();
  }
}

export function disconnectDatabase() {
  const client = active;
  closePromise ??= closeActiveClient(client);
  return closePromise;
}

export function registerDatabase(app) {
  ensureActiveClient();
  const client = active;
  app.addHook('onClose', async () => {
    closePromise ??= closeActiveClient(client);
    await closePromise;
  });
}
