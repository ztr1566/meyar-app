import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../generated/prisma/client.ts';

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

export const prisma = new PrismaClient({ adapter });

let disconnectPromise;

export function disconnectDatabase() {
  disconnectPromise ??= (async () => {
    await prisma.$disconnect();
    await pool.end();
  })();
  return disconnectPromise;
}

export function registerDatabase(app) {
  app.addHook('onClose', async () => {
    await disconnectDatabase();
  });
}
