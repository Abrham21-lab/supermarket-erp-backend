import { z } from "zod";

import {
  phoneValidation,
  emailValidation,
  requiredString
} from "./commonValidation";


export const tenantSchema = z.object({

  name: requiredString,


  contact_email: emailValidation,


  phone: phoneValidation,


  address: z.string().optional(),


  status: z
    .preprocess(
      (value)=>{

        if(value === "true")
          return true;


        if(value === "false")
          return false;


        return value;

      },

      z.boolean()

    )
    .optional()

});