import { NextResponse } from "next/server";
import pool from "../../../lib/db";

import {
  verifyRequestToken,
  requireRole,
} from "@/lib/auth";

import {
  categorySchema,
} from "../../../lib/validations/categoryValidation";

import {
  validate,
} from "../../../lib/validations/validate";

// =========================================
// GET ALL CATEGORIES
// =========================================

export async function GET(req) {
  try {
    const currentUser = verifyRequestToken(req);

    let result;

    // =====================================
    // SUPER ADMIN
    // =====================================

    if (currentUser.isSystemAdmin) {
      result = await pool.query(`
        SELECT

          c.id,
          c.name,
          c.description,
          c.status,
          c.created_at,

          COALESCE(
            STRING_AGG(
              t.name,
              ', '
              ORDER BY t.name
            ),
            ''
          ) AS tenants

        FROM categories c

        LEFT JOIN tenant_categories tc
          ON tc.category_id = c.id

        LEFT JOIN tenants t
          ON t.id = tc.tenant_id

        GROUP BY
          c.id,
          c.name,
          c.description,
          c.status,
          c.created_at

        ORDER BY c.id ASC
      `);
    }

    // =====================================
    // TENANT USER
    // =====================================

    else {
      if (!currentUser.tenantId) {
        throw new Error("Tenant not found in token");
      }

      result = await pool.query(
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

        WHERE tc.tenant_id = $1

        ORDER BY c.id ASC
        `,
        [currentUser.tenantId]
      );
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("GET CATEGORIES ERROR:", error);

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

// =========================================
// CREATE CATEGORY
// =========================================

// =========================================
// CREATE CATEGORY
// =========================================

export async function POST(req) {

  const client = await pool.connect();

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

      tenant_ids,

    } = data;





    await client.query("BEGIN");




    // =====================================
    // CREATE CATEGORY
    // =====================================

    const categoryResult =
      await client.query(

        `
        INSERT INTO categories
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



    const category =
      categoryResult.rows[0];







    // =====================================
    // SYSTEM ADMIN
    // MULTIPLE TENANT ASSIGNMENT
    // =====================================

    if(currentUser.isSystemAdmin) {



      if(
        !tenant_ids ||
        tenant_ids.length === 0
      ) {


        await client.query(
          "ROLLBACK"
        );


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





      for(
        const tenantId of tenant_ids
      ) {


        await client.query(

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

            category.id

          ]

        );


      }



    }





    // =====================================
    // TENANT ADMIN
    // AUTO ASSIGN OWN TENANT
    // =====================================

    else {



      if(!currentUser.tenantId) {


        await client.query(
          "ROLLBACK"
        );


        throw new Error(
          "Tenant not found in token"
        );


      }





      await client.query(

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
        `,

        [

          currentUser.tenantId,

          category.id

        ]

      );



    }




    await client.query(
      "COMMIT"
    );




    return NextResponse.json(

      {

        success:true,

        category,

      },

      {

        status:201

      }

    );




  } catch(error) {



    await client.query(
      "ROLLBACK"
    );



    console.error(

      "CREATE CATEGORY ERROR:",

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



  } finally {


    client.release();


  }

}