import { z } from "zod";

export const stockSchema = z.object({
  product_id: z.number().int().positive(),
  branch_id: z.number().int().positive(),
  quantity: z.number().int().min(0)
});

export const stockUpdateSchema = z.object({
  quantity: z.number().int().min(0)
});