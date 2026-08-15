import { z } from "zod";

import {
  requiredString,
  emailValidation
} from "./commonValidation";


// =====================================
// CREATE USER VALIDATION
// =====================================
export const createUserSchema = z.object({

  full_name: requiredString,

  email: emailValidation,

  password: requiredString,


  // User can have multiple roles
  role_ids: z.array(
    z.coerce.number()
      .int()
      .positive()
  )
  .min(1, "At least one role is required"),


  // Required only for system admin
  // API decides this
  tenant_id: z.coerce
    .number()
    .int()
    .positive()
    .optional()

});




// =====================================
// UPDATE USER VALIDATION
// =====================================
export const updateUserSchema = z.object({

  full_name: requiredString,

  email: emailValidation,


  // Optional because user may update profile info only
  role_ids: z.array(
    z.coerce.number()
      .int()
      .positive()
  )
  .optional()
  .default([]),



  // System admin can move user to another tenant
  tenant_id: z.coerce
    .number()
    .int()
    .positive()
    .optional(),



  is_active: z.boolean()
    .optional()

});