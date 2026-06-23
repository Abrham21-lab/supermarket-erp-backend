import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import { verifyRequestToken, requireRole } from "@/lib/auth";
import { userSchema } from "../../../../lib/validations/userValidation";
import { validate } from "../../../../lib/validations/validate";



// GET USER BY ID
// authenticated users

export async function GET(req, { params }) {

  try {


    verifyRequestToken(req);



    const { id } = await params;



    const result = await pool.query(

`
SELECT

u.id,

u.full_name,

u.email,

u.is_active,

u.created_at,

r.id AS role_id,

r.name AS role

FROM users u

LEFT JOIN roles r

ON u.role_id = r.id

WHERE u.id=$1

`,

[id]

);



    if(result.rows.length === 0){

      return NextResponse.json(

        {
          message:"User not found"
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







// UPDATE USER
// admin + superAdmin only

export async function PUT(req, { params }) {


  try {


    const user = verifyRequestToken(req);



    requireRole(

      user,

      [
        "admin",
        "superAdmin"
      ]

    );



    const { id } = await params;



    const body = await req.json();



    // validation

    const data = validate(

      userSchema,

      body

    );



    if(data instanceof Response){

      return data;

    }



    const {

      full_name,

      email,

      role_id,

      is_active


    } = data;




    const result = await pool.query(

`
UPDATE users

SET

full_name=$1,

email=$2,

role_id=$3,

is_active=$4

WHERE id=$5

RETURNING *

`,

[

full_name,

email,

role_id,

is_active,

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







// DELETE USER
// admin + superAdmin only

export async function DELETE(req, { params }) {


  try {


    const user = verifyRequestToken(req);



    requireRole(

      user,

      [
        "admin",
        "superAdmin"
      ]

    );



    const { id } = await params;



    await pool.query(

      "DELETE FROM users WHERE id=$1",

      [id]

    );



    return NextResponse.json({

      message:"User deleted successfully"

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