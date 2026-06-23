import { z } from "zod";
import {
  requiredString,
  phoneValidation,
  emailValidation
} from "./commonValidation";

export const supplierSchema = z.object({
  name: requiredString,

  contact_person: requiredString,

  phone: phoneValidation,

  email: emailValidation,

  address: requiredString,

  status: z.boolean().optional()
});