import { NextResponse } from "next/server";

import pool from "../../../../../lib/db";

import { verifyRequestToken } from "@/lib/auth";

// MARK NOTIFICATION AS READ

export async function PATCH(req, { params }) {
  try {
    const user = verifyRequestToken(req);

    const { id } = await params;

    const result = await pool.query(
      `
      UPDATE notifications
      SET is_read=true
      WHERE id=$1
      AND user_id=$2
      RETURNING *
      `,
      [id, user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "Notification not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      notification: result.rows[0],
    });
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