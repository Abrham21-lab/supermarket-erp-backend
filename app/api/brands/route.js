import { NextResponse } from "next/server";
import pool from "../../../lib/db";

import {
  verifyRequestToken,
  requireRole,
} from "@/lib/auth";

import {
  brandSchema,
} from "../../../lib/validations/brandValidation";

import {
  validate,
} from "../../../lib/validations/validate";

// =========================================
// GET ALL BRANDS
// =========================================

export async function GET(req) {

  try {

    const currentUser =
      verifyRequestToken(req);

    let result;

    // =====================================
    // SYSTEM ADMIN
    // =====================================

    if (currentUser.isSystemAdmin) {

      result =
        await pool.query(

          `
          SELECT

            b.id,

            b.name,

            b.description,

            b.status,

            b.created_at,

            COALESCE(

              STRING_AGG(

                t.name,

                ', '

                ORDER BY t.name

              ),

              ''

            ) AS tenants

          FROM brands b

          LEFT JOIN tenant_brands tb

            ON tb.brand_id = b.id

          LEFT JOIN tenants t

            ON t.id = tb.tenant_id

          GROUP BY

            b.id,

            b.name,

            b.description,

            b.status,

            b.created_at

          ORDER BY b.id ASC
          `

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

            b.id,

            b.name,

            b.description,

            b.status,

            b.created_at

          FROM brands b

          INNER JOIN tenant_brands tb

            ON tb.brand_id = b.id

          WHERE tb.tenant_id = $1

          ORDER BY b.id ASC
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

      "GET BRANDS ERROR:",

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

// =========================================
// CREATE BRAND
// =========================================

export async function POST(req) {

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

    const body =
      await req.json();

    const data =
      validate(

        brandSchema,

        body

      );

    if (data instanceof Response) {

      return data;

    }

    const {

      name,

      description,

      status,

      tenant_ids,

    } = data;
        // =====================================
    // CREATE BRAND
    // =====================================

    const brandResult =
      await pool.query(

        `
        INSERT INTO brands
        (

          name,

          description,

          status

        )

        VALUES
        (

          $1,

          $2,

          $3

        )

        RETURNING *
        `,

        [

          name,

          description || "",

          status ?? true,

        ]

      );

    const brand =
      brandResult.rows[0];

    // =====================================
    // SYSTEM ADMIN
    // ASSIGN MULTIPLE TENANTS
    // =====================================

    if (currentUser.isSystemAdmin) {

      if (

        !tenant_ids ||

        tenant_ids.length === 0

      ) {

        return NextResponse.json(

          {

            message:
              "Please select at least one tenant."

          },

          {

            status: 400

          }

        );

      }

      for (const tenantId of tenant_ids) {

        await pool.query(

          `
          INSERT INTO tenant_brands
          (

            tenant_id,

            brand_id

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

            brand.id,

          ]

        );

      }

    }

    // =====================================
    // TENANT ADMIN
    // AUTO ASSIGN OWN TENANT
    // =====================================

    else {

      if (!currentUser.tenantId) {

        throw new Error(

          "Tenant not found in token"

        );

      }

      await pool.query(

        `
        INSERT INTO tenant_brands
        (

          tenant_id,

          brand_id

        )

        VALUES
        (

          $1,

          $2

        )
        `,

        [

          currentUser.tenantId,

          brand.id,

        ]

      );

    }

    return NextResponse.json(

      {

        success: true,

        brand,

      },

      {

        status: 201,

      }

    );

  } catch (error) {

    console.error(

      "CREATE BRAND ERROR:",

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