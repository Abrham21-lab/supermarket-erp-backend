import { NextResponse } from "next/server";
import pool from "../../../lib/db";

import { verifyRequestToken } from "@/lib/auth";

// GET CURRENT USER NOTIFICATIONS

export async function GET(req) {
  try {
    const user = verifyRequestToken(req);

    const result = await pool.query(
      `
      SELECT
          id,
          user_id,
          type,
          title,
          message,
          reference_id,
          is_read,
          created_at
      FROM notifications
      WHERE user_id=$1
      ORDER BY created_at DESC
      `,
      [user.id]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json(
      {
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}