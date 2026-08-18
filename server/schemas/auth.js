import { z } from 'zod';

const handle = z.string().trim().min(3).max(30).regex(/^@?[A-Za-z0-9_]+$/);
const role = z.enum(['CHEF', 'SUPPLIER', 'USER']);

export const registerSchema = z.strictObject({
  email: z.email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120),
  handle,
  role: role.optional().default('USER')
});

export const loginSchema = z.strictObject({
  email: z.email(),
  password: z.string().min(1).max(128)
});

export const authorizationSchema = z.string().regex(/^Bearer\s+\S+$/i);
