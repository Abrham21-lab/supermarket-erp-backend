import { z } from "zod";
import {
  requiredString
} from "./commonValidation";

export const paymentSchema = z.object({
  name: requiredString,
  status: z.boolean().optional()
});