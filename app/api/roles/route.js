import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { roleSchema } from "../../../lib/validations/rolesValidation";
import { validate } from "../../../lib/validations/validate";

// GET ALL ROLES WITH ASSIGNED PERMISSIONS
export async function GET() {
    try {
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
            GROUP BY r.id
            ORDER BY r.id ASC
        `);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("Fetch roles error:", error);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

// CREATE ROLE WITH PERMISSIONS MAPPING
export async function POST(req) {
    const client = await pool.connect();
    try {
        const body = await req.json();
        
        const validatedData = validate(roleSchema, body);
        if (validatedData instanceof Response) {
            return validatedData;
        }

        const { name, description, permissions = [] } = body;

        // Start isolated database transaction
        await client.query("BEGIN");

        // 1. Insert role metadata profile
        const roleResult = await client.query(`
            INSERT INTO roles (name, description)
            VALUES ($1, $2)
            RETURNING *
            `,
            [name, description]
        );

        const newRole = roleResult.rows[0];

        // 2. Insert linked relational permission keys inside the transaction if provided
        if (permissions.length > 0) {
            const insertPermissionQuery = `
                INSERT INTO role_permissions (role_id, permission_key)
                VALUES ($1, $2)
            `;
            for (const permissionKey of permissions) {
                await client.query(insertPermissionQuery, [newRole.id, permissionKey]);
            }
        }

        // Commit transaction changes to disk
        await client.query("COMMIT");

        // Append explicit permissions response schema structure for the UI components
        newRole.permissions = permissions;

        return NextResponse.json(newRole, { status: 201 });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Create role error:", error);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}