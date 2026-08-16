import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js'
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://meyar_user:meyar_password@localhost:5432/meyar_db?schema=public'
  }
});
