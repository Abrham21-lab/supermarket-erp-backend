import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

import { verifyRequestToken } from "@/lib/auth";



// GET PURCHASE BY ID
// authenticated users

export async function GET(
  req,
  { params }
) {

  try {

    verifyRequestToken(req);

    const { id } = await params;


    // ======================================
    // GET PURCHASE
    // ======================================

    const purchaseResult =
      await pool.query(
        `
        SELECT

          p.*,

          s.name AS supplier_name,

          b.name AS branch_name,

          t.name AS tenant_name

        FROM purchases p

        LEFT JOIN suppliers s
          ON p.supplier_id = s.id

        LEFT JOIN branches b
          ON p.branch_id = b.id

        LEFT JOIN tenants t
          ON p.tenant_id = t.id

        WHERE p.id = $1
        `,
        [id]
      );


    // ======================================
    // PURCHASE NOT FOUND
    // ======================================

    if (purchaseResult.rows.length === 0) {

      return NextResponse.json(
        {
          success: false,
          message: "Purchase not found"
        },
        {
          status: 404
        }
      );

    }


    // ======================================
    // GET PURCHASE ITEMS
    // ======================================

    const itemsResult =
      await pool.query(
        `
        SELECT

          pi.*,

          pr.name AS product_name

        FROM purchase_items pi

        LEFT JOIN products pr
          ON pi.product_id = pr.id

        WHERE pi.purchase_id = $1

        ORDER BY pi.id ASC
        `,
        [id]
      );


    // ======================================
    // RETURN PURCHASE + ITEMS
    // ======================================

    return NextResponse.json({

      success: true,

      purchase: purchaseResult.rows[0],

      items: itemsResult.rows

    });


  } catch (error) {

    console.error(
      "GET PURCHASE BY ID ERROR:",
      error
    );


    return NextResponse.json(
      {
        success: false,
        message: error.message
      },
      {
        status: 500
      }
    );

  }

}