import { z } from 'zod';

const supplyFields = {
  title: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100),
  price: z.number().finite().nonnegative(),
  unit: z.string().trim().min(1).max(40),
  stock: z.number().int().nonnegative().max(1_000_000),
  status: z.enum(['IN_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED'])
};

export const supplyItemCreateSchema = z.strictObject(supplyFields);
export const supplyItemUpdateSchema = z.strictObject(supplyFields).partial()
  .refine(value => Object.keys(value).length > 0, 'At least one supply field is required');
