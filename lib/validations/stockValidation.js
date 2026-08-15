import { z } from "zod";

export const stockSchema = z.object({
  product_id: z.number().int().positive({
    message: "Product is required"
  }),

  branch_id: z.number().int().positive({
    message: "Branch is required"
  }),

  quantity: z.number().int().min(0, {
    message: "Quantity cannot be negative"
  })
});

export const stockUpdateSchema = z.object({
  quantity: z.number().int().min(0, {
    message: "Quantity cannot be negative"
  })
});