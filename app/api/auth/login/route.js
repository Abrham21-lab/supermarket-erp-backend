import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import bcrypt from "bcryptjs";
import { generateToken } from "../../../../lib/jwt";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // 1. Query the user with aggregated roles
    const userResult = await pool.query(
      `
      SELECT 
        u.id, 
        u.full_name, 
        u.email, 
        u.password_hash, 
        u.tenant_id, 
        u.is_active,
        u.avatar,
        u.is_system_admin,
        COALESCE(
          json_agg(r.name) FILTER (WHERE r.name IS NOT NULL), 
          '[]'
        ) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
      GROUP BY u.id;
      `,
      [email]
    );

    // 2. Safely check if the user exists BEFORE assigning the user object
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    // 3. Verify user is active
    if (!user.is_active) {
      return NextResponse.json(
        { message: "Your account is deactivated" },
        { status: 403 }
      );
    }

    // 4. Compare Password
    const match = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!match) {
      return NextResponse.json(
        { message: "Wrong password" },
        { status: 401 }
      );
    }

    // 5. Generate JWT including the new roles array
    // If they are a system admin and have no roles, give them a virtual "system_admin" role
    const finalRoles = user.roles.length > 0 
      ? user.roles 
      : (user.is_system_admin ? ["system_admin"] : []);

    const token = generateToken({
      id: user.id,
      email: user.email,
      isSystemAdmin: user.is_system_admin,
      tenantId: user.tenant_id,
      roles: finalRoles, 
    });

    // 6. Return response to frontend
    return NextResponse.json({
      token,
      user: {
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  avatar: user.avatar,
  roles: finalRoles,
  tenant_id: user.tenant_id,
  tenantId: user.tenant_id,
  isSystemAdmin: user.is_system_admin,
},
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}