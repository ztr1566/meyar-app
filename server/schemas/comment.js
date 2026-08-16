import { z } from 'zod';

const id = z.string().trim().min(1).max(128);

export const commentCreateSchema = z.strictObject({
  content: z.string().trim().min(1).max(2_000),
  authorId: id,
  recipeId: id
});
