import { z } from "zod";

export const purchasesSchema = z.object({

tenant_id:
z.number().int().positive().optional(),

supplier_id:
z.number().int().positive(),

branch_id:
z.number().int().positive(),

invoice_number:
z.string().min(1),

items:
z.array(

z.object({

product_id:
z.number().int().positive(),

quantity:
z.number().positive(),

purchase_price:
z.number().positive()

})

).min(1)

});