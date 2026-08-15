import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

import {
  verifyRequestToken,
  
} from "@/lib/auth";

import {
  updateUserSchema,
} from "../../../../lib/validations/userValidation";

import {
  validate,
} from "../../../../lib/validations/validate";

// ===============================
// GET USER BY ID
// ===============================
export async function GET(req, { params }) {

  try {

    const { id } = await params;

    

    const currentUser = verifyRequestToken(req);

    

    let result;

    // ===============================
    // SYSTEM ADMIN
    // ===============================
    if (currentUser.isSystemAdmin) {

    

      result = await pool.query(
        `
        SELECT
          u.id,
          u.full_name,
          u.email,
          u.is_active,
          u.created_at,
          u.tenant_id,
          u.is_system_admin,
          t.name AS tenant_name,
          COALESCE(
            json_agg(
              json_build_object(
                'id', r.id,
                'name', r.name
              )
            )
            FILTER (WHERE r.id IS NOT NULL),
            '[]'
          ) AS roles,
          COALESCE(
            json_agg(r.id)
            FILTER (WHERE r.id IS NOT NULL),
            '[]'
          ) AS role_ids
        FROM users u
        LEFT JOIN user_roles ur
          ON u.id = ur.user_id
        LEFT JOIN roles r
          ON ur.role_id = r.id
        LEFT JOIN tenants t
          ON u.tenant_id = t.id
        WHERE u.id = $1
        GROUP BY u.id, t.name
        `,
        [id]
      );

    }

    // ===============================
    // TENANT USER
    // ===============================
    else {

    

      result = await pool.query(
        `
        SELECT
          u.id,
          u.full_name,
          u.email,
          u.is_active,
          u.created_at,
          u.tenant_id,
          u.is_system_admin,
          t.name AS tenant_name,
          COALESCE(
            json_agg(
              json_build_object(
                'id', r.id,
                'name', r.name
              )
            )
            FILTER (WHERE r.id IS NOT NULL),
            '[]'
          ) AS roles,
          COALESCE(
            json_agg(r.id)
            FILTER (WHERE r.id IS NOT NULL),
            '[]'
          ) AS role_ids
        FROM users u
        LEFT JOIN user_roles ur
          ON u.id = ur.user_id
        LEFT JOIN roles r
          ON ur.role_id = r.id
        LEFT JOIN tenants t
          ON u.tenant_id = t.id
        WHERE
          u.id = $1
          AND u.tenant_id = $2
        GROUP BY u.id, t.name
        `,
        [
          id,
          currentUser.tenantId
        ]
      );

    }

    

    if (result.rows.length === 0) {

      return NextResponse.json(
        {
          message: "User not found"
        },
        {
          status: 404
        }
      );

    }

    return NextResponse.json(
      result.rows[0]
    );

  }
  catch(error){

    

    return NextResponse.json(
      {
        message: error.message
      },
      {
        status: 500
      }
    );

  }

}

// ===============================
// UPDATE USER (with Transaction)
// ===============================
export async function PUT(req, { params }) {
  const client = await pool.connect();

  try {
    const currentUser = verifyRequestToken(req);

    // Only users with Admin role OR System Admin flag
    const isAdmin =
  currentUser.isSystemAdmin ||
  currentUser.roles?.some(
    role =>
      role.toLowerCase() === "admin"
  );

if (!isAdmin) {
  throw new Error("Forbidden");
}

    const { id } = await params;
    const body = await req.json();
    const data = validate(updateUserSchema, body);

    if (data instanceof Response) {
      return data;
    }

    // Map fields using the new role_ids array parameter
    const {
 full_name,
 email,
 role_ids,
 is_active,
 tenant_id
} = data;


const uniqueRoles = [
 ...new Set(role_ids || [])
];

    // START TRANSACTION
    await client.query("BEGIN");

    let result;

    // System admin updates
    if (currentUser.isSystemAdmin) {
      result = await client.query(
        `
        UPDATE users
        SET
          full_name = $1,
          email = $2,
          is_active = $3,
          tenant_id = $4
        WHERE id = $5
        RETURNING *
        `,
        [full_name, email, is_active, tenant_id, id]
      );
    } else {
      result = await client.query(
        `
        UPDATE users
        SET
          full_name = $1,
          email = $2,
          is_active = $3
        WHERE id = $4 AND tenant_id = $5
        RETURNING *
        `,
        [full_name, email, is_active, id, currentUser.tenantId]
      );
    }

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { message: "User not found or forbidden" },
        { status: 404 }
      );
    }

    // Role Junction sync logic: Clear existing, then assign new
    await client.query(`DELETE FROM user_roles WHERE user_id = $1`, [id]);

    if (uniqueRoles.length > 0) {
      const valuePlaceholders = uniqueRoles.map((_, index) => `($1, $${index + 2})`).join(", ");
      const roleQuery = `
        INSERT INTO user_roles (user_id, role_id)
        VALUES ${valuePlaceholders}
      `;
      await client.query(roleQuery, [id, ...uniqueRoles]);
    }

    // COMMIT TRANSACTION
    await client.query("COMMIT");

    return NextResponse.json({
      ...result.rows[0],
      role_ids: uniqueRoles
    });

  } catch (error) {

    try{
      await client.query("ROLLBACK");
    }catch{}
    return NextResponse.json(
      { message: error.message },
      { status: error.message === "Forbidden" ? 403 : 500 }
    );
  } finally {
    client.release();
  }
}

// ===============================
// DELETE USER
// ===============================
export async function DELETE(req, { params }) {
  try {
    const currentUser = verifyRequestToken(req);

    console.log("DELETE CURRENT USER:", currentUser);

    const isAdmin =
      currentUser.isSystemAdmin ||
      currentUser.roles?.some(
        role =>
          role.toLowerCase() === "admin"
      );

    if (!isAdmin) {
      throw new Error("Forbidden");
    }


    const { id } = await params;

    let result;


    if (currentUser.isSystemAdmin) {

      result = await pool.query(
        `
        DELETE FROM users
        WHERE id = $1
        RETURNING id
        `,
        [id]
      );

    } 
    else {

      result = await pool.query(
        `
        DELETE FROM users
        WHERE id = $1
        AND tenant_id = $2
        RETURNING id
        `,
        [
          id,
          currentUser.tenantId
        ]
      );

    }



    if (result.rows.length === 0) {

      return NextResponse.json(
        {
          message:
          "User not found or forbidden"
        },
        {
          status:404
        }
      );

    }


    return NextResponse.json(
      {
        message:
        "User deleted successfully"
      }
    );


  }
  catch(error){

    console.error(
      "DELETE USER ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:error.message
      },
      {
        status:
        error.message === "Forbidden"
        ? 403
        : 500
      }
    );

  }
}