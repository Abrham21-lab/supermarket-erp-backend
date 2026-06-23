import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyRequestToken } from "@/lib/auth";

export async function GET(req) {
  try {

    verifyRequestToken(req);

    const result = await pool.query(
      `
      SELECT
      p.name,
      SUM(si.quantity) AS total_sold
      FROM sale_items si
      JOIN products p
      ON si.product_id = p.id
      GROUP BY p.name
      ORDER BY total_sold DESC
      LIMIT 10
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