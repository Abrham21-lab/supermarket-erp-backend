import { z } from "zod";

import {
  emailValidation,
  phoneValidation,
  requiredString
} from "./commonValidation";


export const settingsSchema = z.object({

  company_name: requiredString,

  company_email: emailValidation,

  company_phone: phoneValidation,

  company_address: z.string().optional(),

  currency: requiredString,

  timezone: requiredString,

  allow_negative_stock: z.boolean().optional()

});