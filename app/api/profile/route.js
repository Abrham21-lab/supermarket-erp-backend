import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyRequestToken } from "@/lib/auth";

import fs from "fs";
import path from "path";

export async function PUT(req) {
  try {
    // Verify logged-in user
    const decoded = verifyRequestToken(req);

    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = decoded.id;

    const formData = await req.formData();

    const full_name = formData.get("full_name");
    const email = formData.get("email");
    const avatar = formData.get("avatar");

    let avatarPath = null;

    // Upload image if one was selected
    if (
      avatar &&
      typeof avatar === "object" &&
      avatar.name &&
      avatar.size > 0
    ) {
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads"
      );

      // Create uploads folder if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, {
          recursive: true,
        });
      }

      const extension = path.extname(avatar.name);

      const fileName =
        Date.now() +
        "_" +
        Math.random().toString(36).substring(2, 8) +
        extension;

      const filePath = path.join(uploadDir, fileName);

      const bytes = await avatar.arrayBuffer();

      await fs.promises.writeFile(
        filePath,
        Buffer.from(bytes)
      );

      avatarPath = `/uploads/${fileName}`;
    }

    // Update user
    // Update user
await pool.query(
  `
  UPDATE users
  SET
    full_name = $1,
    email = $2,
    avatar = COALESCE($3, avatar)
  WHERE id = $4
  `,
  [
    full_name,
    email,
    avatarPath,
    userId,
  ]
);

// Fetch updated user together with role
const result = await pool.query(
  `
  SELECT
    u.id,
    u.full_name,
    u.email,
    u.avatar,

    COALESCE(
      (
        SELECT r.name
        FROM user_roles ur
        JOIN roles r
          ON r.id = ur.role_id
        WHERE ur.user_id = u.id
        LIMIT 1
      ),
      ''
    ) AS role

  FROM users u

  WHERE u.id = $1
  `,
  [userId]
);

if (result.rows.length === 0) {
  return NextResponse.json(
    { message: "User not found" },
    { status: 404 }
  );
}

const updatedUser = result.rows[0];

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);

    return NextResponse.json(
      {
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}