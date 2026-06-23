import { z } from "zod";
import { requiredString } from "./commonValidation";

export const productSchema = z.object({
  name: requiredString,
  barcode: requiredString,
  selling_price: z.number().positive(),
  category_id: z.number().int().positive()
});

export const categorySchema =z.object({
  name: requiredString
  
  
});