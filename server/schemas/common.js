import { z } from 'zod';

const id = z.string().trim().min(1).max(128);

export const idParamsSchema = z.strictObject({ id });
export const recipeIdParamsSchema = z.strictObject({ recipeId: id });
export const listQuerySchema = z.strictObject({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).max(10_000).default(0)
});
