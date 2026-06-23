import { z } from "zod";

import {
  phoneValidation,
  emailValidation,
  requiredString
} from "./commonValidation";


export const customerSchema = z.object({

  full_name: requiredString,

  phone: phoneValidation,

  email: emailValidation.optional(),

  address: z.string().optional()

});