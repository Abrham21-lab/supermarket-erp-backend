import { z } from "zod";
import { requiredString } from "./commonValidation";

export const brandSchema = z.object({

  name: requiredString,

  description: z.string().optional(),

  status: z.boolean().optional(),

  tenant_ids: z
    .array(
      z.coerce.number().int().positive()
    )
    .optional()

});