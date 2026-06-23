import { z } from "zod";
import {
  phoneValidation,
  requiredString
} from "./commonValidation";

export const branchSchema = z.object({
  tenant_id: z.coerce
    .number()
    .int()
    .positive("Tenant ID is required"),

  name: requiredString,

  address: requiredString,

  phone: phoneValidation,

  status: z.boolean().optional()
});