import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import { verifyRequestToken, requireRole } from "@/lib/auth";
import { tenantSchema } from "../../../../lib/validations/tenantValidation";
import { validate } from "../../../../lib/validations/validate";




// GET TENANT BY ID
// Any authenticated user

export async function GET(req, { params }) {


  try {


    verifyRequestToken(req);



    const { id } = await params;



    const result = await pool.query(

      `
      SELECT *

      FROM tenants

      WHERE id=$1

      `,

      [id]

    );



    if(result.rows.length === 0){

      return NextResponse.json(

        {
          message:"Tenant not found"
        },

        {
          status:404
        }

      );

    }



    return NextResponse.json(

      result.rows[0]

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








// UPDATE TENANT
// admin + superAdmin only

export async function PUT(req, { params }) {


  try {


    const user = verifyRequestToken(req);



    requireRole(

      user,

      [
        "superAdmin",
        "admin"
      ]

    );



    const { id } = await params;



    const body = await req.json();




    // validation

    const data = validate(

      tenantSchema,

      body

    );



    if(data instanceof Response){

      return data;

    }




    const {

      name,

      logo,

      contact_email,

      phone,

      address,

      status


    } = data;




    const result = await pool.query(

`
UPDATE tenants

SET

name=$1,

logo=$2,

contact_email=$3,

phone=$4,

address=$5,

status=$6

WHERE id=$7

RETURNING *

`,

[

name,

logo,

contact_email,

phone,

address,

status,

id

]

);



    return NextResponse.json(

      result.rows[0]

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








// DELETE TENANT
// admin + superAdmin only

export async function DELETE(req, { params }) {


  try {


    const user = verifyRequestToken(req);



    requireRole(

      user,

      [
        "superAdmin",
        "admin"
      ]

    );



    const { id } = await params;



    await pool.query(

      "DELETE FROM tenants WHERE id=$1",

      [id]

    );



    return NextResponse.json({

      message:"Tenant deleted successfully"

    });



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