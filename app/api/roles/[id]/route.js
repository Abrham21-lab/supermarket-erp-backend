import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import { verifyRequestToken, requireRole } from "@/lib/auth";
import { roleSchema } from "../../../../lib/validations/RoleValidation";
import { validate } from "../../../../lib/validations/validate";




// GET SINGLE ROLE
// superAdmin only

export async function GET(
  req,
  { params }
) {


  try {


    const user = verifyRequestToken(req);



    requireRole(

      user,

      [
        "superAdmin"
      ]

    );



    const { id } = await params;



    const result = await pool.query(

      "SELECT * FROM roles WHERE id=$1",

      [id]

    );



    if(result.rows.length === 0){

      return NextResponse.json(

        {
          message:"Role not found"
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








// UPDATE ROLE
// superAdmin only

export async function PUT(
  req,
  { params }
) {


  try {


    const user = verifyRequestToken(req);



    requireRole(

      user,

      [
        "superAdmin"
      ]

    );



    const { id } = await params;



    const body = await req.json();



    // validation

    const data = validate(

      roleSchema,

      body

    );



    if(data instanceof Response){

      return data;

    }



    const {

      name,

      description


    } = data;




    const result = await pool.query(

`
UPDATE roles

SET

name=$1,

description=$2

WHERE id=$3

RETURNING *

`,

[

name,

description,

id

]

);



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








// DELETE ROLE
// superAdmin only

export async function DELETE(
  req,
  { params }
) {


  try {


    const user = verifyRequestToken(req);



    requireRole(

      user,

      [
        "superAdmin"
      ]

    );



    const { id } = await params;



    await pool.query(

      "DELETE FROM roles WHERE id=$1",

      [id]

    );



    return NextResponse.json({

      message:"Role deleted successfully"

    });



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