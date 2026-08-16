import { z } from 'zod';

const id = z.string().trim().min(1).max(128);

export const rfqCreateSchema = z.strictObject({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(10_000),
  budget: z.number().finite().positive(),
  deadline: z.iso.date(),
  requesterId: id
});
