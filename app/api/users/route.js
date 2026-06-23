import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import bcrypt from "bcryptjs";
import { verifyRequestToken, requireRole } from "@/lib/auth";
import { userSchema } from "../../../lib/validations/userValidation";
import { validate } from "../../../lib/validations/validate";

// GET ALL USERS
export async function GET(){

    try{

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
ORDER BY u.id ASC
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




// CREATE USER

export async function POST(req){

    try{

        const body = await req.json();
        const user = verifyRequestToken(req);

requireRole(user, ["admin", "superAdmin"]);
         const data = validate(userSchema, body);
          if (data instanceof Response) {
            return data;
          }


        const {
            full_name,
            email,
            password,
            role_id
        } = data;



        const existing =
        await pool.query(
            "SELECT * FROM users WHERE email=$1",
            [email]
        );


        if(existing.rows.length > 0){

            return NextResponse.json(
                {
                    message:"User already exists"
                },
                {
                    status:400
                }
            );
        }



        const hashedPassword =
        await bcrypt.hash(
            password,
            10
        );



        const result =
        await pool.query(
`
INSERT INTO users
(
full_name,
email,
password_hash,
role_id,
is_active
)
VALUES($1,$2,$3,$4,true)

RETURNING id,full_name,email,role_id
`,
[
full_name,
email,
hashedPassword,
role_id
]

);



return NextResponse.json(
{
success:true,
user:result.rows[0]
},
{
status:201
}
);



    }catch(error){

        console.log(error);


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