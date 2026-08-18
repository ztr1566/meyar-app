import { z } from 'zod';

export const userUpdateSchema = z.strictObject({
  name: z.string().trim().min(1).max(120).optional(),
  handle: z.string().trim().min(3).max(30).regex(/^@?[A-Za-z0-9_]+$/).optional(),
  avatar: z.string().trim().max(500).nullable().optional(),
  bio: z.string().trim().max(5_000).nullable().optional(),
  location: z.string().trim().max(120).nullable().optional()
}).refine(value => Object.keys(value).length > 0, 'At least one profile field is required');
