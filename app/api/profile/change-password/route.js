import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { verifyRequestToken } from "@/lib/auth";

export async function PUT(req) {
  try {
    const decoded = verifyRequestToken(req);

    if (!decoded?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    const body = await req.json();

    const {
      oldPassword,
      newPassword
    } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { message: "Missing fields" },
        { status: 400 }
      );
    }

    // Get user password
    const result = await pool.query(
      `SELECT password_hash FROM users WHERE id=$1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // Check old password
    const isMatch = await bcrypt.compare(
      oldPassword,
      user.password_hash
    );

    if (!isMatch) {
      return NextResponse.json(
        { message: "Old password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    // Update password
    await pool.query(
      `UPDATE users SET password_hash=$1 WHERE id=$2`,
      [hashedPassword, userId]
    );

    return NextResponse.json({
      message: "Password updated successfully"
    });

  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);

    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}