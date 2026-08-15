import { NextResponse } from "next/server";

import pool from "../../../../lib/db";

import {
  verifyRequestToken,
  requireRole,
} from "@/lib/auth";

import {
  brandSchema,
} from "../../../../lib/validations/brandValidation";

import {
  validate,
} from "../../../../lib/validations/validate";

// =========================================
// GET BRAND BY ID
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

            b.id,

            b.name,

            b.description,

            b.status,

            b.created_at,

            COALESCE(

              ARRAY_AGG(tb.tenant_id)

              FILTER

              (

                WHERE tb.tenant_id IS NOT NULL

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

          FROM brands b

          LEFT JOIN tenant_brands tb

            ON tb.brand_id = b.id

          LEFT JOIN tenants t

            ON t.id = tb.tenant_id

          WHERE b.id = $1

          GROUP BY

            b.id,

            b.name,

            b.description,

            b.status,

            b.created_at
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

            b.id,

            b.name,

            b.description,

            b.status,

            b.created_at

          FROM brands b

          INNER JOIN tenant_brands tb

            ON tb.brand_id = b.id

          WHERE

            b.id = $1

          AND

            tb.tenant_id = $2
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
            "Brand not found"

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

      "GET BRAND ERROR:",

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
// UPDATE BRAND
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
    // TENANT ADMIN
    // VERIFY BRAND ACCESS
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

          FROM tenant_brands

          WHERE

            brand_id = $1

          AND

            tenant_id = $2
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
              "Brand not found or access denied"

          },

          {

            status: 404

          }

        );

      }

    }



    // =====================================
    // UPDATE BRAND
    // =====================================

    const result =
      await pool.query(

        `
        UPDATE brands

        SET

          name = $1,

          description = $2,

          status = $3

        WHERE id = $4

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
            "Brand not found"

        },

        {

          status:404

        }

      );

    }





    // =====================================
    // SYSTEM ADMIN
    // UPDATE TENANT ASSIGNMENTS
    // =====================================

    if (currentUser.isSystemAdmin) {


      await pool.query(

        `
        DELETE FROM tenant_brands

        WHERE brand_id = $1
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

              id

            ]

          );


        }


      }


    }




    return NextResponse.json(

      {

        success:true,

        brand:
          result.rows[0]

      }

    );



  } catch(error) {


    console.error(

      "UPDATE BRAND ERROR:",

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
// DELETE BRAND
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
    // VERIFY OWNERSHIP
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

          FROM tenant_brands

          WHERE

            brand_id = $1

          AND

            tenant_id = $2
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
              "Brand not found or access denied"

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
      DELETE FROM tenant_brands

      WHERE brand_id = $1
      `,

      [

        id

      ]

    );





    // =====================================
    // DELETE BRAND
    // =====================================

    const result =
      await pool.query(

        `
        DELETE FROM brands

        WHERE id = $1

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
            "Brand not found"

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
          "Brand deleted successfully",

        brand:
          result.rows[0]

      }

    );




  } catch(error) {


    console.error(

      "DELETE BRAND ERROR:",

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