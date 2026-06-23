import { z } from "zod";
import { requiredString } from "./commonValidation";

export const roleSchema = z.object({
  name: requiredString,

  description: z
    .string()
    .max(255, "Description cannot exceed 255 characters")
    .optional()
});