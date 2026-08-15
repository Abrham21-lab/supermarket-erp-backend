import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import { verifyRequestToken,  } from "@/lib/auth";
import { tenantSchema } from "../../../../lib/validations/tenantValidation";
import { validate } from "../../../../lib/validations/validate";

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";



// =========================
// GET TENANT BY ID
// =========================

export async function GET(req, { params }) {

  try {

    const user = verifyRequestToken(req);


if(!isSystemAdmin(user)){

  return NextResponse.json(
    {
      message:"Forbidden"
    },
    {
      status:403
    }
  );

}

    const { id } = await params;

    const result = await pool.query(

`
SELECT *
FROM tenants
WHERE id=$1
`,

[id]

    );

    if(result.rows.length===0){

      return NextResponse.json(

        {
          message:"Tenant not found"
        },

        {
          status:404
        }

      );

    }

    return NextResponse.json(
      result.rows[0]
    );

  } catch(error){

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



// =========================
// UPDATE TENANT
// =========================

export async function PUT(req,{params}){

  try{

    const user=verifyRequestToken(req);

    if(!isSystemAdmin(user)){

 return NextResponse.json(
  {
    message:"Only system administrators can update tenants."
  },
  {
    status:403
  }
 );

}
    const { id } = await params;

    const formData = await req.formData();

    const logo=formData.get("logo");

    const tenantData={

      name:formData.get("name"),

      contact_email:formData.get("contact_email"),

      phone:formData.get("phone"),

      address:formData.get("address") || "",

      status:formData.get("status") || "Active",

      logo:""

    };



    const data=validate(

      tenantSchema,

      tenantData

    );

    if(data instanceof Response){

      return data;

    }



    const currentTenant=await pool.query(

      "SELECT * FROM tenants WHERE id=$1",

      [id]

    );



    if(currentTenant.rows.length===0){

      return NextResponse.json(

        {

          message:"Tenant not found"

        },

        {

          status:404

        }

      );

    }



    let logoPath=currentTenant.rows[0].logo;
        // Upload new logo if provided

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
            status:400
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
            status:400
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



      await fs.mkdir(
        uploadDirectory,
        {
          recursive:true
        }
      );



      const filePath = path.join(
        uploadDirectory,
        fileName
      );



      await fs.writeFile(
        filePath,
        buffer
      );



      // Delete old logo if it exists

      if (currentTenant.rows[0].logo) {

        try {

          const oldFile = path.join(
            process.cwd(),
            "public",
            currentTenant.rows[0].logo.replace(/^\//, "")
          );

          await fs.unlink(oldFile);

        } catch {

          // Ignore if old file doesn't exist

        }

      }



      logoPath =
        `/uploads/tenants/${fileName}`;

    }



    const result = await pool.query(

`
UPDATE tenants

SET

name=$1,
logo=$2,
contact_email=$3,
phone=$4,
address=$5,
status=$6

WHERE id=$7

RETURNING *

`,

[
data.name,
logoPath,
data.contact_email,
data.phone,
data.address,
data.status,
id
]

    );



    return NextResponse.json(
      result.rows[0]
    );



  } catch(error){

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



// =========================
// DELETE TENANT
// =========================

export async function DELETE(req,{params}){

  try{

    const user=verifyRequestToken(req);

    if(!isSystemAdmin(user)){

 return NextResponse.json(
  {
    message:"Only system administrators can delete tenants."
  },
  {
    status:403
  }
 );

}

    const { id } = await params;



    const tenant = await pool.query(

      "SELECT logo FROM tenants WHERE id=$1",

      [id]

    );



    if(tenant.rows.length>0 && tenant.rows[0].logo){

      try{

        const filePath = path.join(

          process.cwd(),

          "public",

          tenant.rows[0].logo.replace(/^\//,"")

        );



        await fs.unlink(filePath);

      }catch{

        // Ignore missing file

      }

    }



    await pool.query(

      "DELETE FROM tenants WHERE id=$1",

      [id]

    );



    return NextResponse.json({

      message:"Tenant deleted successfully"

    });

  }catch(error){

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