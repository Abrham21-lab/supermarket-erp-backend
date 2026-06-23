import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { tenantSchema } from "../../../lib/validations/tenantValidation";
import { validate } from "../../../lib/validations/validate";
import { verifyRequestToken, requireRole } from "@/lib/auth";


// GET ALL TENANTS
// only authenticated users can view

export async function GET(req) {

  try {

     verifyRequestToken(req);


    const result = await pool.query(`
      SELECT *
      FROM tenants
      ORDER BY id ASC
    `);


    return NextResponse.json(result.rows);


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



// CREATE TENANT
// only superAdmin/admin

export async function POST(req){


  try {


    const user = verifyRequestToken(req);


    requireRole(
      user,
      [
        "superAdmin",
        "admin"
      ]
    );


    const body = await req.json();



    const data =
      validate(
        tenantSchema,
        body
      );



    if(data instanceof Response){

      return data;

    }



    const result = await pool.query(

`
INSERT INTO tenants

(
name,
contact_email,
phone
)

VALUES

($1,$2,$3)

RETURNING *

`,

[
data.name,
data.contact_email,
data.phone
]

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