import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { roleSchema } from "../../../lib/validations/rolesValidation";
import { validate } from "../../../lib/validations/validate";

// GET ALL ROLES

export async function GET() {

    try {

        const result = await pool.query(
            "SELECT * FROM roles ORDER BY id ASC"
        );


        return NextResponse.json(
            result.rows
        );


    } catch(error){

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



// CREATE ROLE
export async function POST(req){

    try{

        const body = await req.json();
        const data = validate(roleSchema, body);
          if (data instanceof Response) {
            return data;
          }

        const {
            name,
            description
        } = body;



        const result = await pool.query(
            `
            INSERT INTO roles
            (
                name,
                description
            )
            VALUES($1,$2)
            RETURNING *
            `,
            [
                name,
                description
            ]
        );


        return NextResponse.json(
            result.rows[0],
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