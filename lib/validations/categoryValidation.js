import { z } from "zod";
import {
  requiredString
} from "./commonValidation";

export const categorySchema = z.object({

  name: requiredString,

});