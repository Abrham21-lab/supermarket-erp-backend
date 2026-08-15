import { NextResponse } from "next/server";
import pool from "../../../lib/db";

import {
  verifyRequestToken,
  requireRole,
} from "@/lib/auth";

import {
  branchSchema,
} from "../../../lib/validations/BranchValidation";

import {
  validate,
} from "../../../lib/validations/validate";



// ===============================
// GET ALL BRANCHES
// ===============================

// ===============================
// GET ALL BRANCHES
// ===============================

export async function GET(req) {
  try {
    const currentUser = verifyRequestToken(req);

    const { searchParams } = new URL(req.url);

    const selectedTenant = searchParams.get("tenant_id");

    let result;

    // ===============================
    // SYSTEM ADMIN
    // ===============================
    if (currentUser.isSystemAdmin === true) {

      if (selectedTenant) {

        result = await pool.query(
          `
          SELECT
            b.id,
            b.name,
            b.address,
            b.phone,
            b.status,
            b.tenant_id,
            t.name AS tenant_name,
            b.created_at
          FROM branches b
          LEFT JOIN tenants t
          ON b.tenant_id=t.id
          WHERE b.tenant_id=$1
          ORDER BY b.id DESC
          `,
          [selectedTenant]
        );

      } else {

        result = await pool.query(
          `
          SELECT
            b.id,
            b.name,
            b.address,
            b.phone,
            b.status,
            b.tenant_id,
            t.name AS tenant_name,
            b.created_at
          FROM branches b
          LEFT JOIN tenants t
          ON b.tenant_id=t.id
          ORDER BY b.id DESC
          `
        );

      }

    }

    // ===============================
    // TENANT USER
    // ===============================
    else {

      const tenantId =
        currentUser.tenantId ||
        currentUser.tenant_id;

      if (!tenantId) {
        return NextResponse.json(
          {
            message: "Tenant information missing from token",
          },
          {
            status: 403,
          }
        );
      }

      result = await pool.query(
        `
        SELECT
          b.id,
          b.name,
          b.address,
          b.phone,
          b.status,
          b.tenant_id,
          t.name AS tenant_name,
          b.created_at
        FROM branches b
        LEFT JOIN tenants t
        ON b.tenant_id=t.id
        WHERE b.tenant_id=$1
        ORDER BY b.id DESC
        `,
        [tenantId]
      );

    }

    return NextResponse.json(result.rows);

  } catch (error) {

    console.error("GET BRANCHES ERROR:", error);

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






// ===============================
// CREATE BRANCH
// ===============================

export async function POST(req){


  try {


    const currentUser =
      verifyRequestToken(req);



    requireRole(
      currentUser,
      [
        "admin",
        "superAdmin"
      ]
    );



    const body =
      await req.json();



    const data =
      validate(
        branchSchema,
        body
      );



    if(data instanceof Response){

      return data;

    }



    const {
      tenant_id,
      name,
      address,
      phone,
      status
    } = data;



    let assignedTenant;

    if (currentUser.isSystemAdmin) {

  assignedTenant = Number(tenant_id);

}


    else {


      assignedTenant =
        currentUser.tenantId ||
        currentUser.tenant_id;


    }



    if(!assignedTenant){


      return NextResponse.json(
        {
          message:
          "Tenant information missing"
        },
        {
          status:403
        }
      );


    }



    const result =
      await pool.query(
        `
        INSERT INTO branches
        (
          tenant_id,
          name,
          address,
          phone,
          status
        )

        VALUES
        ($1,$2,$3,$4,$5)

        RETURNING *
        `,
        [
          assignedTenant,
          name,
          address,
          phone,
          status ?? true
        ]
      );



    return NextResponse.json(
      result.rows[0],
      {
        status:201
      }
    );



  }catch(error){


    console.error(
      "CREATE BRANCH ERROR:",
      error
    );


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