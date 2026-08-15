import { z } from "zod";
import { requiredString } from "./commonValidation";

export const taxSchema = z.object({

  name: requiredString,

  rate: z
    .number({
      required_error: "Tax rate is required",
      invalid_type_error: "Tax rate must be a number"
    })
    .min(0, "Tax rate cannot be negative")
    .max(100, "Tax rate cannot exceed 100"),

  is_active: z.boolean().optional(),

  tenant_ids: z
    .array(
      z.number({
        invalid_type_error: "Tenant id must be a number"
      })
    )
    .optional()

});