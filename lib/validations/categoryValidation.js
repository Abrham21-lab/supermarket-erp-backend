import { z } from "zod";
import { requiredString } from "./commonValidation";

export const categorySchema = z.object({

  // Used only by Super Admin.
  // Tenant Admin gets tenant from the JWT token.
  tenant_ids: z
    .array(
      z.coerce
        .number()
        .int()
        .positive()
    )
    .optional(),

  name: requiredString,

  description: z.string().optional(),

  status: z.boolean().optional()

});