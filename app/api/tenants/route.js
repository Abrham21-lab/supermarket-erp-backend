import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { tenantSchema } from "../../../lib/validations/tenantValidation";
import { validate } from "../../../lib/validations/validate";
import { verifyRequestToken,isSystemAdmin  } from "@/lib/auth";

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";



// =========================
// GET ALL TENANTS
// =========================

export async function GET(req) {

  try {

    const user = verifyRequestToken(req);

if (!isSystemAdmin(user)) {
  return NextResponse.json(
    {
      message: "Forbidden. Only system administrators can view tenants."
    },
    {
      status:403
    }
  );
}


const result = await pool.query(`
  SELECT *
  FROM tenants
  ORDER BY id ASC
`);

    return NextResponse.json(result.rows);

  } catch (error) {

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



// =========================
// CREATE TENANT
// =========================

export async function POST(req) {

  try {

    const user = verifyRequestToken(req);

    if (!isSystemAdmin(user)) {

  return NextResponse.json(
    {
      message:"Only system administrators can create tenants."
    },
    {
      status:403
    }
  );

}



    // Read multipart/form-data

    const formData = await req.formData();



    const logo = formData.get("logo");



    const tenantData = {

      name: formData.get("name"),

      contact_email: formData.get("contact_email"),

      phone: formData.get("phone"),

      address: formData.get("address") || "",

      status: formData.get("status") || "Active",

      logo: ""

    };



    // Validate text fields

    const data = validate(
      tenantSchema,
      tenantData
    );

    if (data instanceof Response) {
      return data;
    }



    let logoPath = "";



    // Upload logo if provided

    if (
      logo &&
      typeof logo === "object" &&
      logo.size > 0
    ) {

      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp"
      ];

      if (!allowedTypes.includes(logo.type)) {

        return NextResponse.json(
          {
            message:
              "Only PNG, JPG, JPEG and WEBP images are allowed."
          },
          {
            status: 400
          }
        );

      }



      if (logo.size > 2 * 1024 * 1024) {

        return NextResponse.json(
          {
            message:
              "Logo size must be less than 2MB."
          },
          {
            status: 400
          }
        );

      }



      const bytes = await logo.arrayBuffer();

      const buffer = Buffer.from(bytes);



      const extension =
        logo.name.split(".").pop();



      const fileName =
        crypto.randomUUID() +
        "." +
        extension;



      const uploadDirectory = path.join(
        process.cwd(),
        "public",
        "uploads",
        "tenants"
      );



      // Create folder automatically if it doesn't exist

      await fs.mkdir(
        uploadDirectory,
        {
          recursive: true
        }
      );



      const filePath = path.join(
        uploadDirectory,
        fileName
      );
            // Save image

      await fs.writeFile(
        filePath,
        buffer
      );



      // Store relative path in database

      logoPath =
        `/uploads/tenants/${fileName}`;

    }



    // Insert tenant into PostgreSQL

    const result = await pool.query(

`
INSERT INTO tenants
(
name,
logo,
contact_email,
phone,
address,
status
)

VALUES
($1,$2,$3,$4,$5,$6)

RETURNING *

`,

[
data.name,
logoPath,
data.contact_email,
data.phone,
data.address,
data.status
]

    );



    return NextResponse.json(

      result.rows[0],

      {
        status:201
      }

    );



  } catch(error) {

    console.error(error);

    return NextResponse.json(

      {
        message:error.message
      },

      {
        status:500
      }

    );

  }

}