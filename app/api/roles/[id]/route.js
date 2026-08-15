import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import { verifyRequestToken, requireRole } from "@/lib/auth";
import { roleSchema } from "../../../../lib/validations/rolesValidation";
import { validate } from "../../../../lib/validations/validate";

// GET SINGLE ROLE BY ID WITH PERMISSIONS
export async function GET(req, { params }) {
  try {
    const user = verifyRequestToken(req);
    requireRole(user, ["admin"]);

    const { id } = await params;

    const result = await pool.query(`
        SELECT 
            r.id, 
            r.name, 
            r.description,
            r.created_at,
            COALESCE(
                json_agg(rp.permission_key) FILTER (WHERE rp.permission_key IS NOT NULL), 
                '[]'
            ) AS permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        WHERE r.id = $1
        GROUP BY r.id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// UPDATE ROLE AND ITS ASSIGNED PERMISSIONS GRID MAPPINGS
export async function PUT(req, { params }) {
  const client = await pool.connect();
  try {
    const user = verifyRequestToken(req);
    requireRole(user, ["admin"]);

    const { id } = await params;
    const body = await req.json();

    const validatedData = validate(roleSchema, body);
    if (validatedData instanceof Response) {
      return validatedData;
    }

    const { name, description, permissions = [] } = body;

    await client.query("BEGIN");

    // 1. Update Core Metadata Columns
    const roleResult = await client.query(`
        UPDATE roles
        SET name = $1, description = $2
        WHERE id = $3
        RETURNING *
      `,
      [name, description, id]
    );

    if (roleResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ message: "Role metadata entry missing" }, { status: 404 });
    }

    // 2. Wipe Previous Mapping Schemes
    await client.query("DELETE FROM role_permissions WHERE role_id = $1", [id]);

    // 3. Populate New Configuration Token Schemes
    if (permissions.length > 0) {
      const insertPermissionQuery = `
          INSERT INTO role_permissions (role_id, permission_key)
          VALUES ($1, $2)
        `;
      for (const permissionKey of permissions) {
        await client.query(insertPermissionQuery, [id, permissionKey]);
      }
    }

    await client.query("COMMIT");

    const updatedRole = roleResult.rows[0];
    updatedRole.permissions = permissions;

    return NextResponse.json(updatedRole);
  } catch (error) {
    await client.query("ROLLBACK");
    return NextResponse.json({ message: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE ROLE (Cleans up junction table automatically via ON DELETE CASCADE setup)
export async function DELETE(req, { params }) {
  try {
    const user = verifyRequestToken(req);
    requireRole(user, ["admin"]);

    const { id } = await params;

    await pool.query("DELETE FROM roles WHERE id = $1", [id]);

    return NextResponse.json({ message: "Role deleted successfully" });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}