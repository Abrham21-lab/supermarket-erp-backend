import { z } from "zod";
import {
  requiredString
} from "./commonValidation";

export const unitSchema = z.object({
  name: requiredString,

  symbol: requiredString,

  status: z.boolean().optional()
});