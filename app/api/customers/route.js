import { NextResponse } from "next/server";

import pool from "../../../lib/db";

import { verifyRequestToken, requireRole } from "@/lib/auth";

import { customerSchema } from "../../../lib/validations/customerValidation";

import { validate } from "../../../lib/validations/validate";




// GET ALL CUSTOMERS
// authenticated users

export async function GET(req) {


  try {


    verifyRequestToken(req);



    const result = await pool.query(

      "SELECT * FROM customers ORDER BY id DESC"

    );



    return NextResponse.json(

      result.rows

    );



  } catch(error) {


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







// CREATE CUSTOMER
// admin + superAdmin + manager


export async function POST(req) {


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

      customerSchema,

      body

    );




    if(data instanceof Response){

      return data;

    }




    const {

      full_name,

      phone,

      email,

      address

    } = data;




    const result = await pool.query(

`
INSERT INTO customers

(
full_name,
phone,
email,
address
)

VALUES($1,$2,$3,$4)

RETURNING *

`,

[

full_name,

phone,

email,

address

]

);





    return NextResponse.json(

      result.rows[0],

      {
        status:201
      }

    );



  } catch(error) {



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