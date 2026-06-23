import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { unitSchema } from "../../../lib/validations/unitValidation";
import { validate } from "../../../lib/validations/validate";
import { verifyRequestToken, requireRole } from "@/lib/auth";




// GET ALL UNITS
// authenticated users

export async function GET(req) {


  try {


    verifyRequestToken(req);



    const result = await pool.query(

      "SELECT * FROM units ORDER BY id ASC"

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








// CREATE UNIT
// admin + superAdmin + manager

export async function POST(req){


    try{


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

          unitSchema,

          body

        );



        if(data instanceof Response){

            return data;

        }





        const {

            name,

            symbol


        } = data;





        const result = await pool.query(

`
INSERT INTO units

(
name,
symbol
)

VALUES($1,$2)

RETURNING *

`,

[

name,

symbol

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