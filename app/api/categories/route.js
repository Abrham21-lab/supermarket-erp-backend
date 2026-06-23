import { NextResponse } from "next/server";
import pool from "../../../lib/db";

import { categorySchema } from "../../../lib/validations/categoryValidation";
import { validate } from "../../../lib/validations/validate";
import { verifyRequestToken, requireRole } from "@/lib/auth";




// GET ALL CATEGORIES
// authenticated users

export async function GET(req) {


  try {


    verifyRequestToken(req);



    const result = await pool.query(

      "SELECT * FROM categories ORDER BY id ASC"

    );



    return NextResponse.json(

      result.rows

    );



  } catch(error){

return NextResponse.json(
{
message:error.message
},
{
status: error.message.includes("token") ? 401 : 500
}
);

}

}









// CREATE CATEGORY
// admin + superAdmin + manager

export async function POST(req){


  try {



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

      categorySchema,

      body

    );




    if(data instanceof Response){

      return data;

    }




    const {

      name

    } = data;





    const result = await pool.query(

`
INSERT INTO categories

(name)

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



  } catch(error){



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