import { z } from "zod";

export const inventorySchema = z.object({

  product_id: z
    .number({
      required_error: "Product is required"
    })
    .int()
    .positive(),

  branch_id: z
    .number({
      required_error: "Branch is required"
    })
    .int()
    .positive(),

  transaction_type: z.enum(
    [
      "STOCK_IN",
      "STOCK_OUT",
      "ADJUSTMENT"
    ],
    {
      errorMap: () => ({
        message:
          "transaction_type must be STOCK_IN, STOCK_OUT, or ADJUSTMENT"
      })
    }
  ),

  quantity: z
    .number({
      required_error: "Quantity is required"
    })
    .positive(),

  reference: z
    .string()
    .optional()

});