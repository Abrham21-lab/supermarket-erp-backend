import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { supplierSchema } from "../../../lib/validations/supplierValidation";
import { validate } from "../../../lib/validations/validate";
import { verifyRequestToken, requireRole } from "@/lib/auth";




// GET ALL SUPPLIERS
// authenticated users

export async function GET(req){


    try{


        verifyRequestToken(req);



        const result = await pool.query(

`
SELECT *

FROM suppliers

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








// CREATE SUPPLIER
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

            supplierSchema,

            body

        );



        if(data instanceof Response){

            return data;

        }





        const {

            name,

            contact_person,

            phone,

            email,

            address,

            status


        } = data;




        const result = await pool.query(

`
INSERT INTO suppliers

(

name,

contact_person,

phone,

email,

address,

status

)

VALUES($1,$2,$3,$4,$5,$6)

RETURNING *

`,

[

name,

contact_person,

phone,

email,

address,

status ?? true

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