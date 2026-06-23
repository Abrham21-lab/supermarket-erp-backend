import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { paymentSchema } from "../../../lib/validations/paymentMethodValidation";
import { validate } from "../../../lib/validations/validate";
import { verifyRequestToken, requireRole } from "@/lib/auth";




// GET ALL PAYMENT METHODS
// authenticated users

export async function GET(req){


    try{


        verifyRequestToken(req);



        const result = await pool.query(

`
SELECT *

FROM payment_methods

ORDER BY id ASC

`

        );



        return NextResponse.json(

            result.rows

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











// CREATE PAYMENT METHOD
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
INSERT INTO payment_methods

(

name,

is_active

)

VALUES($1,$2)

RETURNING *

`,

[

name,

is_active ?? true

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