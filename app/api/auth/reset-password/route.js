import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { token, newPassword } = await req.json();

    const [rows] = await pool.query(
      "SELECT * FROM password_resets WHERE token = ? AND used = FALSE",
      [token]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });
    }

    const reset = rows[0];

    if (new Date(reset.expires_at) < new Date()) {
      return NextResponse.json({ message: "Token expired" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hashed,
      reset.user_id,
    ]);

    await pool.query("UPDATE password_resets SET used = TRUE WHERE id = ?", [
      reset.id,
    ]);

    return NextResponse.json({ message: "Password updated successfully" });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}