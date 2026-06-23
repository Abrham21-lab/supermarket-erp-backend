import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

import { verifyRequestToken, requireRole } from "@/lib/auth";

import { stockUpdateSchema } from "../../../../lib/validations/stockValidation";
import { validate } from "../../../../lib/validations/validate";


// GET STOCK BY ID
// authenticated users

export async function GET(req, { params }) {
  try {

    verifyRequestToken(req);

    const { id } = await params;

    const result = await pool.query(
`
SELECT
ps.id,
p.name AS product,
b.name AS branch,
ps.quantity
FROM product_stock ps

JOIN products p
ON ps.product_id = p.id

JOIN branches b
ON ps.branch_id = b.id

WHERE ps.id=$1
`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "Stock not found"
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


// UPDATE STOCK
// admin + superAdmin + manager

export async function PUT(req, { params }) {

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
      stockUpdateSchema,
      body
    );

    if (data instanceof Response) {
      return data;
    }

    const { quantity } = data;

    const result = await pool.query(
`
UPDATE product_stock
SET quantity=$1
WHERE id=$2
RETURNING *
`,
      [
        quantity,
        id
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "Stock not found"
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


// DELETE STOCK
// admin + superAdmin + manager

export async function DELETE(req, { params }) {

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

    const result = await pool.query(
`
DELETE FROM product_stock
WHERE id=$1
RETURNING *
`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "Stock not found"
        },
        {
          status: 404
        }
      );
    }

    return NextResponse.json(
      {
        message: "Stock deleted successfully",
        data: result.rows[0]
      }
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