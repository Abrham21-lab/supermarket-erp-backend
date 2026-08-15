import { NextResponse } from "next/server";

import pool from "../../../../lib/db";

import {
  verifyRequestToken,
  requireRole,
} from "@/lib/auth";

import {
  categorySchema,
} from "../../../../lib/validations/categoryValidation";

import {
  validate,
} from "../../../../lib/validations/validate";

// =========================================
// GET CATEGORY BY ID
// =========================================

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

    // =====================================
    // SYSTEM ADMIN
    // =====================================

    if (currentUser.isSystemAdmin) {

      result =
        await pool.query(

          `
          SELECT

            c.id,

            c.name,

            c.description,

            c.status,

            c.created_at,

            COALESCE(

              ARRAY_AGG(tc.tenant_id)

              FILTER

              (

                WHERE tc.tenant_id IS NOT NULL

              ),

              '{}'

            ) AS tenant_ids,

            COALESCE(

              ARRAY_AGG(t.name)

              FILTER

              (

                WHERE t.name IS NOT NULL

              ),

              '{}'

            ) AS tenant_names

          FROM categories c

          LEFT JOIN tenant_categories tc

          ON tc.category_id = c.id

          LEFT JOIN tenants t

          ON t.id = tc.tenant_id

          WHERE c.id = $1

          GROUP BY

            c.id,

            c.name,

            c.description,

            c.status,

            c.created_at

          `,

          [
            id
          ]

        );

    }

    // =====================================
    // TENANT USER
    // =====================================

    else {

      if (!currentUser.tenantId) {

        throw new Error(
          "Tenant not found in token"
        );

      }

      result =
        await pool.query(

          `
          SELECT

            c.id,

            c.name,

            c.description,

            c.status,

            c.created_at

          FROM categories c

          INNER JOIN tenant_categories tc

          ON tc.category_id = c.id

          WHERE

            c.id = $1

          AND

            tc.tenant_id = $2

          `,

          [

            id,

            currentUser.tenantId

          ]

        );

    }

    if (result.rows.length === 0) {

      return NextResponse.json(

        {

          message:
            "Category not found"

        },

        {

          status:404

        }

      );

    }

    return NextResponse.json(

      result.rows[0]

    );

  } catch(error) {

    console.error(

      "GET CATEGORY ERROR:",

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

// =========================================
// UPDATE CATEGORY
// =========================================
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
          "manager"
        ]
      );

    }

    const { id } =
      await params;

    const body =
      await req.json();

    const data =
      validate(
        categorySchema,
        body
      );

    if (data instanceof Response) {

      return data;

    }

    const {

      name,

      description,

      status,

      tenant_ids

    } = data;

    // =====================================
    // TENANT ADMIN
    // Ensure category belongs to own tenant
    // =====================================

    if (!currentUser.isSystemAdmin) {

      if (!currentUser.tenantId) {

        throw new Error(
          "Tenant not found in token"
        );

      }

      const access =
        await pool.query(

          `
          SELECT 1

          FROM tenant_categories

          WHERE

            category_id=$1

          AND

            tenant_id=$2
          `,

          [
            id,
            currentUser.tenantId
          ]

        );

      if (access.rows.length === 0) {

        return NextResponse.json(

          {
            message:
              "Category not found or access denied"
          },

          {
            status:404
          }

        );

      }

    }

    // =====================================
    // UPDATE CATEGORY
    // =====================================

    const result =
      await pool.query(

        `
        UPDATE categories

        SET

          name=$1,

          description=$2,

          status=$3

        WHERE id=$4

        RETURNING *

        `,

        [

          name,

          description || "",

          status ?? true,

          id

        ]

      );

    if (result.rows.length === 0) {

      return NextResponse.json(

        {
          message:
            "Category not found"
        },

        {
          status:404
        }

      );

    }

    // =====================================
    // SUPER ADMIN
    // Update tenant assignments
    // =====================================

    if (currentUser.isSystemAdmin) {

      await pool.query(

        `
        DELETE FROM tenant_categories

        WHERE category_id=$1
        `,

        [
          id
        ]

      );

      if (

        tenant_ids &&

        tenant_ids.length > 0

      ) {

        for (const tenantId of tenant_ids) {

          await pool.query(

            `
            INSERT INTO tenant_categories

            (

              tenant_id,

              category_id

            )

            VALUES

            (

              $1,

              $2

            )

            ON CONFLICT

            DO NOTHING
            `,

            [

              tenantId,

              id

            ]

          );

        }

      }

    }

    return NextResponse.json(

      {

        success:true,

        category:
          result.rows[0]

      }

    );

  } catch(error) {

    console.error(

      "UPDATE CATEGORY ERROR:",

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

// =========================================
// DELETE CATEGORY
// =========================================

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
          "admin"
        ]
      );

    }

    const { id } =
      await params;

    // =====================================
    // TENANT ADMIN
    // Verify ownership
    // =====================================

    if (!currentUser.isSystemAdmin) {

      if (!currentUser.tenantId) {

        throw new Error(
          "Tenant not found in token"
        );

      }

      const access =
        await pool.query(

          `
          SELECT 1

          FROM tenant_categories

          WHERE

            category_id=$1

          AND

            tenant_id=$2
          `,

          [
            id,
            currentUser.tenantId
          ]

        );

      if (access.rows.length === 0) {

        return NextResponse.json(

          {
            message:
              "Category not found or access denied"
          },

          {
            status:404
          }

        );

      }

    }

    // =====================================
    // DELETE TENANT MAPPINGS
    // =====================================

    await pool.query(

      `
      DELETE FROM tenant_categories

      WHERE category_id=$1
      `,

      [
        id
      ]

    );

    // =====================================
    // DELETE CATEGORY
    // =====================================

    const result =
      await pool.query(

        `
        DELETE FROM categories

        WHERE id=$1

        RETURNING *
        `,

        [
          id
        ]

      );

    if (result.rows.length === 0) {

      return NextResponse.json(

        {
          message:
            "Category not found"
        },

        {
          status:404
        }

      );

    }

    return NextResponse.json(

      {

        success:true,

        message:
          "Category deleted successfully",

        category:
          result.rows[0]

      }

    );

  } catch(error) {

    console.error(

      "DELETE CATEGORY ERROR:",

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