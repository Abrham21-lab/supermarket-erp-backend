import { z } from "zod";


export const roleSchema = z.object({

name:z.string()
.min(2,"Role name is required"),


description:z.string()
.optional()

});