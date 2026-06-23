import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyRequestToken } from "@/lib/auth";

export async function GET(req) {
  try {

    verifyRequestToken(req);

    const result = await pool.query(
      `
      SELECT
      b.name AS branch,
      SUM(
        ps.quantity * p.purchase_price
      ) AS inventory_value
      FROM product_stock ps
      JOIN products p
      ON ps.product_id = p.id
      JOIN branches b
      ON ps.branch_id = b.id
      GROUP BY b.name
      ORDER BY inventory_value DESC
      `
    );

    return NextResponse.json(
      result.rows
    );

  } catch(error) {

    return NextResponse.json(
      { message:error.message },
      { status:500 }
    );

  }
}