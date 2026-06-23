import { NextResponse } from "next/server";
import pool from "../../../lib/db";

import { brandSchema } from "../../../lib/validations/brandValidation";
import { validate } from "../../../lib/validations/validate";

import { verifyRequestToken, requireRole } from "@/lib/auth";




// GET ALL BRANDS
// Any authenticated user

export async function GET(req){

try{


verifyRequestToken(req);



const result = await pool.query(

"SELECT * FROM brands ORDER BY id ASC"

);



return NextResponse.json(

result.rows

);



}catch(error){


return NextResponse.json(

{
message:error.message
},

{
status:500
}

);


}

}









// CREATE BRAND
// admin + superAdmin + manager

export async function POST(req){

try{


const user = verifyRequestToken(req);



requireRole(

user,

[
"admin",
"superAdmin",
"manager"
]

);




const body = await req.json();




const data = validate(

brandSchema,

body

);




if(data instanceof Response){

return data;

}





const {

name

}=data;





const result = await pool.query(

`
INSERT INTO brands(name)

VALUES($1)

RETURNING *

`,

[name]

);





return NextResponse.json(

result.rows[0],

{
status:201
}

);




}catch(error){


return NextResponse.json(

{
message:error.message
},

{
status:500
}

);


}


}