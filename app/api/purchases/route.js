import { NextResponse } from "next/server";
import pool from "../../../lib/db";

import { verifyRequestToken, requireRole } from "@/lib/auth";

import { purchasesSchema } from "../../../lib/validations/purchasesValidation";
import { validate } from "../../../lib/validations/validate";


// GET ALL PURCHASES
// authenticated users

export async function GET(req) {

  try {

    verifyRequestToken(req);

    const result = await pool.query(
`
SELECT
    p.*,
    s.name AS supplier_name,
    b.name AS branch_name
FROM purchases p

LEFT JOIN suppliers s
ON p.supplier_id = s.id

LEFT JOIN branches b
ON p.branch_id = b.id

ORDER BY p.id DESC
`
    );

    return NextResponse.json(
      result.rows
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


// CREATE PURCHASE
// admin + superAdmin + manager

export async function POST(req) {

  const client = await pool.connect();

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

    const body = await req.json();

    const data = validate(
      purchasesSchema,
      body
    );

    if (data instanceof Response) {
      return data;
    }

    const {
      supplier_id,
      branch_id,
      invoice_number,
      items
    } = data;

    await client.query("BEGIN");

    let total_amount = 0;

    for (const item of items) {

      total_amount +=
        Number(item.quantity) *
        Number(item.purchase_price);

    }

    const purchaseResult =
      await client.query(
`
INSERT INTO purchases
(
supplier_id,
branch_id,
invoice_number,
total_amount,
status
)
VALUES($1,$2,$3,$4,'COMPLETED')
RETURNING *
`,
        [
          supplier_id,
          branch_id,
          invoice_number,
          total_amount
        ]
      );

    const purchase =
      purchaseResult.rows[0];

    for (const item of items) {

      const subtotal =
        item.quantity *
        item.purchase_price;

      await client.query(
`
INSERT INTO purchase_items
(
purchase_id,
product_id,
quantity,
purchase_price,
subtotal
)
VALUES($1,$2,$3,$4,$5)
`,
        [
          purchase.id,
          item.product_id,
          item.quantity,
          item.purchase_price,
          subtotal
        ]
      );

      await client.query(
`
INSERT INTO product_stock
(
product_id,
branch_id,
quantity
)
VALUES($1,$2,$3)

ON CONFLICT(product_id,branch_id)

DO UPDATE SET

quantity =
product_stock.quantity +
EXCLUDED.quantity
`,
        [
          item.product_id,
          branch_id,
          item.quantity
        ]
      );

      await client.query(
`
INSERT INTO inventory_transactions
(
product_id,
branch_id,
transaction_type,
quantity,
reference
)
VALUES($1,$2,'PURCHASE',$3,$4)
`,
        [
          item.product_id,
          branch_id,
          item.quantity,
          invoice_number
        ]
      );

    }

    await client.query("COMMIT");

    return NextResponse.json(
      purchase,
      {
        status: 201
      }
    );

  } catch (error) {

    await client.query("ROLLBACK");

    return NextResponse.json(
      {
        message: error.message
      },
      {
        status: 500
      }
    );

  } finally {

    client.release();

  }

}