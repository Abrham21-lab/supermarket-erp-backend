import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import bcrypt from "bcryptjs";
import { generateToken } from "../../../../lib/jwt";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const result = await pool.query(
`
SELECT
u.id,
u.full_name,
u.email,
u.password_hash,
r.name AS role

FROM users u

JOIN roles r
ON u.role_id = r.id

WHERE u.email=$1
`,
[email]
);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = generateToken({

  id:user.id,

  email:user.email,

  role:user.role

});

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login Error:", error);

    return NextResponse.json(
      { message: "An internal server error occurred" },
      { status: 500 }
    );
  }
}