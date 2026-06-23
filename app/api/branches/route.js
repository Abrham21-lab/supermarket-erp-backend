import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { branchSchema } from "../../../lib/validations/BranchValidation";
import { validate } from "../../../lib/validations/validate";
import { verifyRequestToken, requireRole } from "@/lib/auth";



// GET ALL BRANCHES
// authenticated users

export async function GET(req) {

    try {


        verifyRequestToken(req);


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

ORDER BY b.id ASC

`

        );


        return NextResponse.json(
            result.rows
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






// CREATE BRANCH
// only admin + superAdmin

export async function POST(req){


    try{


        const user = verifyRequestToken(req);


        requireRole(
            user,
            [
                "admin",
                "superAdmin"
            ]
        );



        const body = await req.json();



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
INSERT INTO branches

(

tenant_id,

name,

address,

phone,

status

)

VALUES

($1,$2,$3,$4,$5)

RETURNING *

`

,

[

tenant_id,

name,

address,

phone,

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