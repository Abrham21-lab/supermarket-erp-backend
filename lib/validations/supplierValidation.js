import { z } from "zod";

import {
  requiredString,
  phoneValidation,
  emailValidation,
} from "./commonValidation";

export const supplierSchema = z.object({
  // Optional here.
  // The API decides whether it is required based on isSystemAdmin.
  tenant_id: z.coerce
    .number()
    .int()
    .positive()
    .optional(),

  name: requiredString,

  contact_person: requiredString,

  phone: phoneValidation,

  email: emailValidation,

  address: requiredString,

  status: z.boolean().optional(),
});