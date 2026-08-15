import { z } from "zod";

import {
  requiredString
} from "./commonValidation";

export const unitSchema = z.object({

  name: requiredString,

  symbol: z.string()
    .optional()
    .default(""),

  description: z.string()
    .optional()
    .default(""),

  status: z.boolean()
    .optional()
    .default(true),

  tenant_ids: z
    .array(z.number().int().positive())
    .optional()

});