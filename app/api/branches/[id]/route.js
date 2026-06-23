import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import { verifyRequestToken, requireRole } from "@/lib/auth";
import { branchSchema } from "../../../../lib/validations/BranchValidation";
import { validate } from "../../../../lib/validations/validate";



// GET BRANCH BY ID
// authenticated users

export async function GET(req, { params }) {

  try {


    verifyRequestToken(req);



    const { id } = await params;



    const result = await pool.query(

      `
      SELECT

      b.id,

      b.name,

      b.address,

      b.phone,

      b.status,

      t.name AS tenant

      FROM branches b

      LEFT JOIN tenants t

      ON b.tenant_id = t.id

      WHERE b.id=$1
      `,

      [id]

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







// UPDATE BRANCH
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

      branchSchema,

      body

    );



    if(data instanceof Response){

      return data;

    }



    const {

      tenant_id,

      name,

      address,

      phone,

      status


    } = data;




    const result = await pool.query(

`
UPDATE branches

SET

tenant_id=$1,

name=$2,

address=$3,

phone=$4,

status=$5

WHERE id=$6

RETURNING *

`,

[

tenant_id,

name,

address,

phone,

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







// DELETE BRANCH
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

      "DELETE FROM branches WHERE id=$1",

      [id]

    );



    return NextResponse.json({

      message:"Branch deleted successfully"

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