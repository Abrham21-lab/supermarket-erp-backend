import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import {
  verifyRequestToken,
  requireRole,
} from "@/lib/auth";

import {
  supplierSchema,
} from "../../../lib/validations/supplierValidation";

import {
  validate,
} from "../../../lib/validations/validate";



// ======================================
// GET ALL SUPPLIERS
// ======================================

export async function GET(req) {

  try {

    const currentUser =
      verifyRequestToken(req);

    let result;

    // ----------------------------------
    // System Admin
    // Can view suppliers from all tenants
    // ----------------------------------

    const {searchParams}=new URL(req.url);

const selectedTenant =
searchParams.get("tenant_id");


if(currentUser.isSystemAdmin){


if(selectedTenant){


result = await pool.query(

`
SELECT

s.*,
t.name AS tenant_name

FROM suppliers s

LEFT JOIN tenants t
ON s.tenant_id=t.id

WHERE s.tenant_id=$1

ORDER BY s.id ASC

`,
[selectedTenant]

);


}

else{


result = await pool.query(

`
SELECT

s.*,
t.name AS tenant_name

FROM suppliers s

LEFT JOIN tenants t
ON s.tenant_id=t.id

ORDER BY s.id ASC

`

);


}

}

    // ----------------------------------
    // Tenant Users
    // Only own tenant suppliers
    // ----------------------------------

    else {

      if (!currentUser.tenantId) {

        throw new Error(
          "Tenant not found in token"
        );

      }

      result = await pool.query(
        `
        SELECT

          s.id,
          s.name,
          s.contact_person,
          s.phone,
          s.email,
          s.address,
          s.status,
          s.tenant_id,
          t.name AS tenant_name,
          s.created_at

        FROM suppliers s

        LEFT JOIN tenants t
        ON s.tenant_id = t.id

        WHERE s.tenant_id = $1

        ORDER BY s.id ASC
        `,
        [
          currentUser.tenantId
        ]
      );

    }

    return NextResponse.json(
      result.rows
    );

  } catch (error) {

    console.error(
      "GET SUPPLIERS ERROR:",
      error
    );

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



// ======================================
// CREATE SUPPLIER
// ======================================

export async function POST(req) {

  try {

    const currentUser =
      verifyRequestToken(req);

    if (!currentUser.isSystemAdmin) {

      requireRole(
        currentUser,
        [
          "admin",
          "manager",
        ]
      );

    }

    const body =
      await req.json();

    const data =
      validate(
        supplierSchema,
        body
      );

    if (data instanceof Response) {

      return data;

    }

    const {

      tenant_id,
      name,
      contact_person,
      phone,
      email,
      address,
      status,

    } = data;

    let assignedTenant;
        // ----------------------------------
    // Determine Tenant
    // ----------------------------------

    if (currentUser.isSystemAdmin) {

      if (!tenant_id) {

        return NextResponse.json(
          {
            message: "Tenant is required"
          },
          {
            status: 400
          }
        );

      }

      assignedTenant = tenant_id;

    }

    else {

      assignedTenant = currentUser.tenantId;

      if (!assignedTenant) {

        throw new Error(
          "Tenant not found"
        );

      }

    }

    // ----------------------------------
    // Create Supplier
    // ----------------------------------

    const result = await pool.query(
      `
      INSERT INTO suppliers
      (
        tenant_id,
        name,
        contact_person,
        phone,
        email,
        address,
        status
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7
      )
      RETURNING
      *
      `,
      [
        assignedTenant,
        name,
        contact_person,
        phone,
        email,
        address,
        status ?? true,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        supplier: result.rows[0],
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.error(
      "CREATE SUPPLIER ERROR:",
      error
    );

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