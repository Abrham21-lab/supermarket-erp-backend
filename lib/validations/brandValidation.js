import { z } from "zod";
import {
  requiredString
} from "./commonValidation";


export const brandSchema = z.object({

    name: requiredString

});