import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyRequestToken } from "@/lib/auth";
import path from "path";
import fs from "fs";

// Ensure folder exists
const uploadDir = path.join(process.cwd(), "public/uploads/profiles");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ==========================
// UPLOAD PROFILE IMAGE
// ==========================
export async function POST(req) {
  try {
    const user = verifyRequestToken(req);

    const formData = await req.formData();
    const file = formData.get("image");

    if (!file) {
      return NextResponse.json(
        { message: "No image uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${user.id}_${Date.now()}_${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const publicPath = `/uploads/profiles/${fileName}`;

    await pool.query(
      `
      UPDATE users
      SET avatar = $1
      WHERE id = $2
      `,
      [publicPath, user.id]
    );

    return NextResponse.json({
      success: true,
      avatar: publicPath
    });

  } catch (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}