import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import { verifyRequestToken, requireRole } from "@/lib/auth";

// MANAGE ATOMIC PERMISSION INDICES (Key behaves as unique slug ID)
export async function PUT(req, { params }) {
    try {
        const user = verifyRequestToken(req);
        requireRole(user, ["admin"]);

        const { id } = await params; // Captures permission 'key'
        const { label, description } = await req.json();

        const result = await pool.query(`
            UPDATE permissions
            SET label = $1, description = $2
            WHERE key = $3
            RETURNING *
            `,
            [label, description, id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ message: "Target system privilege index entry not found" }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const user = verifyRequestToken(req);
        requireRole(user, ["admin"]);

        const { id } = await params;

        await pool.query("DELETE FROM permissions WHERE key = $1", [id]);

        return NextResponse.json({ message: "System operational permission hook dropped successfully" });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}