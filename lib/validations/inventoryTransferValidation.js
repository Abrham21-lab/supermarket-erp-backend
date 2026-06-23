import { z } from "zod";

export const inventoryTransferSchema = z.object({

  product_id: z
    .number()
    .int()
    .positive(),

  from_branch_id: z
    .number()
    .int()
    .positive(),

  to_branch_id: z
    .number()
    .int()
    .positive(),

  quantity: z
    .number()
    .positive(),

  reference: z
    .string()
    .optional()

}).refine(

  (data) =>
    data.from_branch_id !== data.to_branch_id,

  {
    message:
      "Source and destination branches cannot be the same",
    path: ["to_branch_id"]
  }

);