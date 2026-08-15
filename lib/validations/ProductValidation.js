import { z } from "zod";
import { requiredString } from "./commonValidation";

export const productSchema = z.object({

name: requiredString,

barcode: z.string()
.min(8,"Barcode must contain at least 8 characters")
.max(20,"Barcode cannot exceed 20 characters"),

selling_price: z.number().positive(),

purchase_price:z.number().positive(),

category_id:z.number()
.int()
.positive(),

supplier_id:z.number()
.int()
.positive(),

unit_id:z.number()
.int()
.positive(),

tax_id:z.number()
.int()
.positive(),

status:z.boolean()
.optional(),

tenant_ids:z.array(
z.number().int().positive()
)
.optional()

})
.refine(
(data)=>
data.selling_price > data.purchase_price,
{
message:"Selling price must be greater than purchase price",
path:["selling_price"]
}
);