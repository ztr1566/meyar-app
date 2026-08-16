import { z } from 'zod';

const recipeIngredient = z.strictObject({
  name: z.string().trim().min(1).max(200),
  amount: z.number().finite().positive(),
  unit: z.string().trim().min(1).max(40).optional()
});

const recipeStep = z.strictObject({
  instruction: z.string().trim().min(1).max(4000),
  durationMinutes: z.number().int().nonnegative().max(1440).optional()
});

export const recipeCreateSchema = z.strictObject({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(20).max(10_000),
  prepTime: z.number().int().nonnegative().max(1440),
  cookTime: z.number().int().nonnegative().max(1440),
  servings: z.number().int().min(1).max(100),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  ingredients: z.array(recipeIngredient).min(1).max(200),
  steps: z.array(recipeStep).min(1).max(100),
  tags: z.array(z.string().trim().min(1).max(50)).max(30)
});
