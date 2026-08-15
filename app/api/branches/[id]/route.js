import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

import {
  verifyRequestToken,
  requireRole,
} from "@/lib/auth";

import {
  branchSchema,
} from "../../../../lib/validations/BranchValidation";

import {
  validate,
} from "../../../../lib/validations/validate";

// =====================================
// GET BRANCH BY ID
// =====================================

export async function GET(req, { params }) {
  try {
    const currentUser = verifyRequestToken(req);

    const isSystemAdmin =
      currentUser.is_system_admin === true ||
      currentUser.isSystemAdmin === true;

    const { id } = await params;

    let result;

    if (isSystemAdmin) {
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
ON b.tenant_id = t.id
WHERE b.id = $1
`,
        [id]
      );
    } else {
      if (!currentUser.tenant_id) {
        return NextResponse.json(
          {
            message: "Tenant not found in token",
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
ON b.tenant_id = t.id
WHERE b.id = $1
AND b.tenant_id = $2
`,
        [
          id,
          currentUser.tenant_id,
        ]
      );
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "Branch not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);

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

// =====================================
// UPDATE BRANCH
// =====================================

export async function PUT(req, { params }) {
  try {
    const currentUser = verifyRequestToken(req);

    const isSystemAdmin =
      currentUser.is_system_admin === true ||
      currentUser.isSystemAdmin === true;

    if (!isSystemAdmin) {
      requireRole(currentUser, [
        "Admin",
      ]);
    }

    const { id } = await params;

    const body = await req.json();

    const data = validate(
      branchSchema,
      body
    );

    if (data instanceof Response) {
      return data;
    }

    const {
      tenant_id,
      name,
      address,
      phone,
      status,
    } = data;
        let result;

    // ===============================
    // SYSTEM ADMIN UPDATE
    // ===============================

    if (isSystemAdmin) {

      if (!tenant_id) {
        return NextResponse.json(
          {
            message: "Tenant is required",
          },
          {
            status: 400,
          }
        );
      }


      const tenantCheck =
        await pool.query(
          `
SELECT id
FROM tenants
WHERE id=$1
`,
          [
            tenant_id,
          ]
        );


      if (tenantCheck.rows.length === 0) {

        return NextResponse.json(
          {
            message: "Invalid tenant",
          },
          {
            status:400,
          }
        );

      }



      result =
        await pool.query(
          `
UPDATE branches

SET

tenant_id=$1,

name=$2,

address=$3,

phone=$4,

status=$5


WHERE id=$6


RETURNING *

`,
          [

            tenant_id,

            name,

            address,

            phone,

            status,

            id,

          ]
        );


    }



    // ===============================
    // TENANT ADMIN UPDATE
    // ===============================

    else {


      result =
        await pool.query(
          `
UPDATE branches

SET

name=$1,

address=$2,

phone=$3,

status=$4


WHERE id=$5

AND tenant_id=$6


RETURNING *

`,
          [

            name,

            address,

            phone,

            status,

            id,

            currentUser.tenant_id,

          ]
        );


    }





    if(result.rows.length===0){

      return NextResponse.json(
        {
          message:
          "Branch not found or forbidden",
        },
        {
          status:404,
        }
      );

    }





    return NextResponse.json(
      result.rows[0]
    );



  } catch(error){


    console.error(error);


    return NextResponse.json(
      {
        message:error.message,
      },
      {
        status:500,
      }
    );


  }

}







// =====================================
// DELETE BRANCH
// =====================================


export async function DELETE(req,{params}){


  try{


    const currentUser =
      verifyRequestToken(req);



    const isSystemAdmin =
      currentUser.is_system_admin === true ||
      currentUser.isSystemAdmin === true;




    if(!isSystemAdmin){

      requireRole(
        currentUser,
        [
          "Admin",
        ]
      );

    }





    const {id}=await params;



    let result;




    // ===============================
    // SYSTEM ADMIN DELETE
    // ===============================

    if(isSystemAdmin){


      result =
        await pool.query(
          `
DELETE FROM branches

WHERE id=$1

RETURNING id

`,
          [
            id,
          ]
        );


    }






    // ===============================
    // TENANT ADMIN DELETE
    // ===============================

    else{


      result =
        await pool.query(
          `
DELETE FROM branches

WHERE id=$1

AND tenant_id=$2

RETURNING id

`,
          [

            id,

            currentUser.tenant_id,

          ]
        );


    }





    if(result.rows.length===0){


      return NextResponse.json(
        {
          message:
          "Branch not found or forbidden",
        },
        {
          status:404,
        }
      );


    }





    return NextResponse.json(
      {
        message:
        "Branch deleted successfully",
      }
    );




  }catch(error){


    console.error(error);


    return NextResponse.json(
      {
        message:error.message,
      },
      {
        status:500,
      }
    );


  }


}