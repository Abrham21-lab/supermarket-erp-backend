import { z } from "zod";
import {
  emailValidation,
  requiredString
} from "./commonValidation";

export const userSchema = z.object({
  full_name: requiredString,

  email: emailValidation,

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),

  role_id: z.coerce
    .number()
    .int()
    .positive("Role ID is required")
});