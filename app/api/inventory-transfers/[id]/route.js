import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

import {
  verifyRequestToken
} from "@/lib/auth";



// GET SINGLE TRANSFER
// authenticated users

export async function GET(
  req,
  { params }
) {

  try {

    verifyRequestToken(req);

    const { id } = await params;

    const result = await pool.query(

`
SELECT

it.id,

p.name AS product,

fb.name AS from_branch,

tb.name AS to_branch,

it.quantity,

it.reference,

it.created_at

FROM inventory_transfers it

JOIN products p
ON it.product_id = p.id

JOIN branches fb
ON it.from_branch_id = fb.id

JOIN branches tb
ON it.to_branch_id = tb.id

WHERE it.id = $1
`,

      [id]

    );



    if (result.rows.length === 0) {

      return NextResponse.json(

        {
          message: "Transfer not found"
        },

        {
          status: 404
        }

      );

    }



    return NextResponse.json(
      result.rows[0]
    );

  } catch (error) {

    return NextResponse.json(

      {
        message: error.message
      },

      {
        status: 500
      }

    );

  }

}