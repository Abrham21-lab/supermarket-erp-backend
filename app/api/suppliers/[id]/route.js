import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

import {
  verifyRequestToken,
  requireRole,
} from "@/lib/auth";

import {
  supplierSchema,
} from "../../../../lib/validations/supplierValidation";

import {
  validate,
} from "../../../../lib/validations/validate";



// ======================================
// GET SINGLE SUPPLIER
// ======================================

export async function GET(
  req,
  { params }
) {

  try {

    const currentUser =
      verifyRequestToken(req);

    const { id } =
      await params;

    let result;

    // ----------------------------------
    // System Admin
    // ----------------------------------

    if (currentUser.isSystemAdmin) {

      result = await pool.query(
        `
        SELECT

          s.*,

          t.name AS tenant_name

        FROM suppliers s

        LEFT JOIN tenants t
        ON s.tenant_id=t.id

        WHERE s.id=$1
        `,
        [id]
      );

    }

    // ----------------------------------
    // Tenant Users
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

          s.*,

          t.name AS tenant_name

        FROM suppliers s

        LEFT JOIN tenants t
        ON s.tenant_id=t.id

        WHERE
          s.id=$1
        AND
          s.tenant_id=$2
        `,
        [
          id,
          currentUser.tenantId,
        ]
      );

    }

    if (result.rows.length === 0) {

      return NextResponse.json(
        {
          message: "Supplier not found"
        },
        {
          status: 404
        }
      );

    }

    return NextResponse.json(
      result.rows[0]
    );

  } catch (error) {

    console.error(
      "GET SUPPLIER ERROR:",
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
// UPDATE SUPPLIER
// ======================================

export async function PUT(
  req,
  { params }
) {

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

    const { id } =
      await params;

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
    // Update Supplier
    // ----------------------------------

    let result;

    if (currentUser.isSystemAdmin) {

      result = await pool.query(
        `
        UPDATE suppliers

        SET

          tenant_id=$1,
          name=$2,
          contact_person=$3,
          phone=$4,
          email=$5,
          address=$6,
          status=$7

        WHERE id=$8

        RETURNING *
        `,
        [
          assignedTenant,
          name,
          contact_person,
          phone,
          email,
          address,
          status,
          id,
        ]
      );

    }

    else {

      result = await pool.query(
        `
        UPDATE suppliers

        SET

          name=$1,
          contact_person=$2,
          phone=$3,
          email=$4,
          address=$5,
          status=$6

        WHERE

          id=$7

        AND

          tenant_id=$8

        RETURNING *
        `,
        [
          name,
          contact_person,
          phone,
          email,
          address,
          status,
          id,
          assignedTenant,
        ]
      );

    }

    if (result.rows.length === 0) {

      return NextResponse.json(
        {
          message: "Supplier not found"
        },
        {
          status: 404
        }
      );

    }

    return NextResponse.json({
      success: true,
      supplier: result.rows[0],
    });

  } catch (error) {

    console.error(
      "UPDATE SUPPLIER ERROR:",
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
// DELETE SUPPLIER
// ======================================

export async function DELETE(
  req,
  { params }
) {

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

    const { id } =
      await params;

    if (currentUser.isSystemAdmin) {

      await pool.query(
        `
        DELETE FROM suppliers
        WHERE id=$1
        `,
        [id]
      );

    }

    else {

      await pool.query(
        `
        DELETE FROM suppliers

        WHERE

          id=$1

        AND

          tenant_id=$2
        `,
        [
          id,
          currentUser.tenantId,
        ]
      );

    }

    return NextResponse.json({
      success: true,
      message: "Supplier deleted successfully",
    });

  } catch (error) {

    console.error(
      "DELETE SUPPLIER ERROR:",
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