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
      ps.quantity
      FROM product_stock ps
      JOIN products p
      ON ps.product_id = p.id
      WHERE ps.quantity <= 10
      ORDER BY ps.quantity ASC
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