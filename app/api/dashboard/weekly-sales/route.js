import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyRequestToken } from "@/lib/auth";

export async function GET(req) {
  try {

    verifyRequestToken(req);

    const result = await pool.query(
      `
      SELECT
      DATE_TRUNC('week', created_at) AS week,
      SUM(total_amount) AS total_sales
      FROM sales
      GROUP BY week
      ORDER BY week
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