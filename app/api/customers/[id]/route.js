import { NextResponse } from "next/server";

import pool from "../../../../lib/db";

import { verifyRequestToken, requireRole } from "@/lib/auth";

import { customerSchema } from "../../../../lib/validations/customerValidation";

import { validate } from "../../../../lib/validations/validate";





// GET CUSTOMER BY ID
// authenticated users


export async function GET(req,{params}) {


  try {


    verifyRequestToken(req);



    const { id } = await params;



    const result = await pool.query(

      "SELECT * FROM customers WHERE id=$1",

      [id]

    );



    if(result.rows.length === 0){


      return NextResponse.json(

        {
          message:"Customer not found"
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









// UPDATE CUSTOMER
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
UPDATE customers

SET

full_name=$1,

phone=$2,

email=$3,

address=$4

WHERE id=$5

RETURNING *

`,

[

full_name,

phone,

email,

address,

id

]

);





    if(result.rows.length === 0){


      return NextResponse.json(

        {
          message:"Customer not found"
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











// DELETE CUSTOMER
// admin + superAdmin


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
DELETE FROM customers

WHERE id=$1

RETURNING *

`,

[id]

);




    if(result.rows.length === 0){


      return NextResponse.json(

        {
          message:"Customer not found"
        },

        {
          status:404
        }

      );

    }





    return NextResponse.json({

      message:"Customer deleted successfully",

      data:result.rows[0]

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