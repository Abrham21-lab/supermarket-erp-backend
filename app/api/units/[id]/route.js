import { NextResponse } from "next/server";

import pool from "../../../../lib/db";

import {
  verifyRequestToken,
  requireRole,
} from "@/lib/auth";

import {
  unitSchema,
} from "../../../../lib/validations/unitValidation";

import {
  validate,
} from "../../../../lib/validations/validate";


// =========================================
// GET UNIT BY ID
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

            u.id,

            u.name,

            u.symbol,

            u.description,

            u.status,

            u.created_at,


            COALESCE(

              ARRAY_AGG(tu.tenant_id)

              FILTER

              (

                WHERE tu.tenant_id IS NOT NULL

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



          FROM units u



          LEFT JOIN tenant_units tu

            ON tu.unit_id = u.id



          LEFT JOIN tenants t

            ON t.id = tu.tenant_id



          WHERE u.id = $1



          GROUP BY

            u.id,

            u.name,

            u.symbol,

            u.description,

            u.status,

            u.created_at

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

            u.id = $1



          AND

            tu.tenant_id = $2

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

            "Unit not found"

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

      "GET UNIT ERROR:",

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
// UPDATE UNIT
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
    // TENANT USER
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

          FROM tenant_units

          WHERE

            unit_id = $1

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

              "Unit not found or access denied"

          },

          {

            status:404

          }

        );


      }



    }







    // =====================================
    // UPDATE UNIT
    // =====================================


    const result =
      await pool.query(

        `
        UPDATE units

        SET

          name = $1,

          symbol = $2,

          description = $3,

          status = $4


        WHERE id = $5


        RETURNING *

        `,

        [

          name,

          symbol || "",

          description || "",

          status ?? true,

          id

        ]

      );







    if (result.rows.length === 0) {


      return NextResponse.json(

        {

          message:

            "Unit not found"

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
        DELETE FROM tenant_units

        WHERE unit_id = $1

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

              id

            ]

          );



        }


      }



    }








    return NextResponse.json(

      {

        success:true,

        unit:

          result.rows[0]

      }

    );






  } catch(error) {



    console.error(

      "UPDATE UNIT ERROR:",

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
// DELETE UNIT
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
    // TENANT USER
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

          FROM tenant_units

          WHERE

            unit_id = $1

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

              "Unit not found or access denied"

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
      DELETE FROM tenant_units

      WHERE unit_id = $1

      `,

      [

        id

      ]

    );








    // =====================================
    // DELETE UNIT
    // =====================================

    const result =
      await pool.query(

        `
        DELETE FROM units

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

            "Unit not found"

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

          "Unit deleted successfully",


        unit:

          result.rows[0]

      }

    );







  } catch(error) {



    console.error(

      "DELETE UNIT ERROR:",

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