import { z } from "zod";
import {
  phoneValidation,
  emailValidation,
  requiredString
} from "./commonValidation";

export const tenantSchema = z.object({
  name: requiredString,

  contact_email: emailValidation,

  phone: phoneValidation,

  address: z.string().optional()
});