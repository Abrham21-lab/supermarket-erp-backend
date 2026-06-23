import { z } from "zod";


export const phoneValidation = z
.string()
.regex(
 /^(\+251|0)?9[0-9]{8}$/,
 "Invalid Ethiopian phone number"
);


export const emailValidation = z
.string()
.email("Invalid email address");


export const requiredString = z
.string()
.min(2,"Field must contain at least 2 characters");


