import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

import { categorySchema } from "../../../../lib/validations/categoryValidation";
import { validate } from "../../../../lib/validations/validate";

import { verifyRequestToken, requireRole } from "@/lib/auth";



// GET CATEGORY BY ID
// Any authenticated user

export async function GET(req,{params}) {

  try {


    verifyRequestToken(req);


    const { id } = await params;


    const result = await pool.query(

      `
      SELECT *
      FROM categories
      WHERE id=$1
      `,

      [id]

    );


    if(result.rows.length === 0){

      return NextResponse.json(
        {
          message:"Category not found"
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








// UPDATE CATEGORY
// admin + superAdmin + manager

export async function PUT(req,{params}) {

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
      UPDATE categories

      SET name=$1

      WHERE id=$2

      RETURNING *

      `,

      [
        name,
        id
      ]

    );



    if(result.rows.length === 0){

      return NextResponse.json(

        {
          message:"Category not found"
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








// DELETE CATEGORY
// admin + superAdmin only

export async function DELETE(req,{params}) {


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



    const result = await pool.query(

      `
      DELETE FROM categories

      WHERE id=$1

      RETURNING *

      `,

      [id]

    );



    if(result.rows.length === 0){

      return NextResponse.json(

        {
          message:"Category not found"
        },

        {
          status:404
        }

      );

    }



    return NextResponse.json({

      message:"Category deleted successfully"

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