import { z } from "zod";
import { requiredString } from "./commonValidation";

export const paymentSchema = z.object({

  name: requiredString,

  description: z
    .string()
    .optional()
    .default(""),

  is_active: z
    .boolean()
    .optional()
    .default(true),

  tenant_ids: z
    .array(
      z.number().int().positive()
    )
    .optional()
    .default([])

});