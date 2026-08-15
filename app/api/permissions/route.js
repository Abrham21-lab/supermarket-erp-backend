import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { verifyRequestToken, requireRole } from "@/lib/auth";

// GET MASTER DICTIONARY LIST OF SYSTEM PERMISSIONS
export async function GET(req) {
    try {
        const user = verifyRequestToken(req);
        requireRole(user, ["admin"]);

        const result = await pool.query(
            "SELECT * FROM permissions ORDER BY key ASC"
        );

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("Fetch global permissions dictionary error:", error);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

// REGISTER NEW ATOMIC SYSTEM ACCESS KEY (For future development expansion)
export async function POST(req) {
    try {
        const user = verifyRequestToken(req);
        requireRole(user, ["admin"]);

        const { key, label, description } = await req.json();

        if (!key || !label || !description) {
            return NextResponse.json({ message: "Missing required permission fields" }, { status: 400 });
        }

        const result = await pool.query(`
            INSERT INTO permissions (key, label, description)
            VALUES ($1, $2, $3)
            RETURNING *
            `,
            [key.toLowerCase().trim(), label, description]
        );

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}