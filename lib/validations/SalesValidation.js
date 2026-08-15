import { z } from "zod";

export const salesSchema = z.object({

  branch_id: z
    .number({
      required_error: "Branch is required"
    })
    .int()
    .positive(),

  payment_method_id: z
    .number({
      required_error: "Payment method is required"
    })
    .int()
    .positive(),

  items: z
    .array(
      z.object({

        product_id: z
          .number({
            required_error: "Product is required"
          })
          .int()
          .positive(),

        quantity: z
          .number({
            required_error: "Quantity is required"
          })
          .positive(),

        unit_price: z
          .number({
            required_error: "Unit price is required"
          })
          .nonnegative()

      })
    )
    .min(1, "At least one item is required")

});