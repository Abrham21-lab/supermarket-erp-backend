import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyRequestToken } from "@/lib/auth";

export async function GET(req) {
  try {

    verifyRequestToken(req);

    const result = await pool.query(
      `
      SELECT
      DATE(created_at) AS date,
      SUM(total_amount) AS total_sales
      FROM sales
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
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