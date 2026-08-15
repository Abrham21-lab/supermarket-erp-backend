import { NextResponse } from "next/server";

import pool from "../../../lib/db";

import {
  verifyRequestToken,
  requireRole,
} from "@/lib/auth";

import {
  unitSchema,
} from "../../../lib/validations/unitValidation";

import {
  validate,
} from "../../../lib/validations/validate";

// =========================================
// GET ALL UNITS
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

            u.id,

            u.name,

            u.symbol,

            u.description,

            u.status,

            u.created_at,

            COALESCE(

              STRING_AGG(

                t.name,

                ', '

                ORDER BY t.name

              ),

              ''

            ) AS tenants

          FROM units u

          LEFT JOIN tenant_units tu

            ON tu.unit_id = u.id

          LEFT JOIN tenants t

            ON t.id = tu.tenant_id

          GROUP BY

            u.id,

            u.name,

            u.symbol,

            u.description,

            u.status,

            u.created_at

          ORDER BY u.id ASC
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

            u.id,

            u.name,

            u.symbol,

            u.description,

            u.status,

            u.created_at

          FROM units u

          INNER JOIN tenant_units tu

            ON tu.unit_id = u.id

          WHERE

            tu.tenant_id = $1

          ORDER BY u.id ASC
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

      "GET UNITS ERROR:",

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
// CREATE UNIT
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

        unitSchema,

        body

      );

    if (data instanceof Response) {

      return data;

    }

    const {

      name,

      symbol,

      description,

      status,

      tenant_ids,

    } = data;
    
    // =====================================
    // CREATE UNIT
    // =====================================

    const unitResult =
      await pool.query(

        `
        INSERT INTO units

        (

          name,

          symbol,

          description,

          status

        )

        VALUES

        (

          $1,

          $2,

          $3,

          $4

        )

        RETURNING *

        `,

        [

          name,

          symbol || "",

          description || "",

          status ?? true

        ]

      );



    const unit =
      unitResult.rows[0];





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

            status:400

          }

        );


      }





      for (const tenantId of tenant_ids) {


        await pool.query(

          `
          INSERT INTO tenant_units

          (

            tenant_id,

            unit_id

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

            unit.id

          ]

        );


      }



    }





    // =====================================
    // TENANT ADMIN
    // ASSIGN OWN TENANT
    // =====================================

    else {


      if (!currentUser.tenantId) {


        throw new Error(

          "Tenant not found in token"

        );


      }




      await pool.query(

        `
        INSERT INTO tenant_units

        (

          tenant_id,

          unit_id

        )

        VALUES

        (

          $1,

          $2

        )

        `,

        [

          currentUser.tenantId,

          unit.id

        ]

      );


    }





    return NextResponse.json(

      {

        success:true,

        unit

      },

      {

        status:201

      }

    );



  } catch(error) {


    console.error(

      "CREATE UNIT ERROR:",

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
