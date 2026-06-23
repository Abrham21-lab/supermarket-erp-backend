import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import { paymentSchema } from "../../../../lib/validations/paymentMethodValidation";
import { validate } from "../../../../lib/validations/validate";
import { verifyRequestToken, requireRole } from "@/lib/auth";




// GET SINGLE PAYMENT METHOD
// authenticated users

export async function GET(
  req,
  { params }
) {


  try {


    verifyRequestToken(req);



    const { id } = await params;



    const result = await pool.query(

`
SELECT *

FROM payment_methods

WHERE id=$1

`,

      [id]

    );



    if(result.rows.length === 0){

      return NextResponse.json(

        {
          message:"Payment method not found"
        },

        {
          status:404
        }

      );

    }



    return NextResponse.json(

      result.rows[0]

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









// UPDATE PAYMENT METHOD
// admin + superAdmin + manager

export async function PUT(
  req,
  { params }
) {


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




    const { id } = await params;



    const body = await req.json();




    const data = validate(

      paymentSchema,

      body

    );



    if(data instanceof Response){

      return data;

    }




    const {

      name,

      is_active

    } = data;





    const result = await pool.query(

`
UPDATE payment_methods

SET

name=$1,

is_active=$2

WHERE id=$3

RETURNING *

`,

      [

        name,

        is_active,

        id

      ]

    );




    if(result.rows.length === 0){

      return NextResponse.json(

        {
          message:"Payment method not found"
        },

        {
          status:404
        }

      );

    }





    return NextResponse.json(

      result.rows[0]

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









// DELETE PAYMENT METHOD
// admin + superAdmin + manager

export async function DELETE(
  req,
  { params }
) {


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




    const { id } = await params;




    const result = await pool.query(

`
DELETE FROM payment_methods

WHERE id=$1

RETURNING *

`,

      [id]

    );




    if(result.rows.length === 0){

      return NextResponse.json(

        {
          message:"Payment method not found"
        },

        {
          status:404
        }

      );

    }





    return NextResponse.json(

      {
        message:"Payment method deleted successfully"
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