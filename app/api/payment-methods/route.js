import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { paymentSchema } from "../../../lib/validations/paymentMethodValidation";
import { validate } from "../../../lib/validations/validate";
import {
  verifyRequestToken,
  requireRole
} from "@/lib/auth";


// =========================================
// GET ALL PAYMENT METHODS
// =========================================

// =========================================
// GET ALL PAYMENT METHODS
// =========================================

export async function GET(req) {

  try {

    const currentUser = verifyRequestToken(req);

    const { searchParams } = new URL(req.url);

    const selectedTenant = searchParams.get("tenant_id");

    let result;

    // =====================================
    // SYSTEM ADMIN
    // =====================================

    if (currentUser.isSystemAdmin) {

      // Filter by tenant (used by SalesForm)
      if (selectedTenant) {

        result = await pool.query(
          `
          SELECT
            pm.id,
            pm.name,
            pm.description,
            pm.is_active,
            pm.created_at
          FROM payment_methods pm
          INNER JOIN tenant_payment_methods tpm
            ON pm.id = tpm.payment_method_id
          WHERE tpm.tenant_id = $1
          ORDER BY pm.id ASC
          `,
          [selectedTenant]
        );

      }

      // All payment methods
      else {

        result = await pool.query(
          `
          SELECT

            pm.id,
            pm.name,
            pm.description,
            pm.is_active,
            pm.created_at,

            COALESCE(
              STRING_AGG(
                t.name,
                ', '
                ORDER BY t.name
              ),
              ''
            ) AS tenants

          FROM payment_methods pm

          LEFT JOIN tenant_payment_methods tpm
            ON tpm.payment_method_id = pm.id

          LEFT JOIN tenants t
            ON t.id = tpm.tenant_id

          GROUP BY
            pm.id,
            pm.name,
            pm.description,
            pm.is_active,
            pm.created_at

          ORDER BY pm.id ASC
          `
        );

      }

    }

    // =====================================
    // TENANT USER
    // =====================================

    else {

      result = await pool.query(
        `
        SELECT

          pm.id,
          pm.name,
          pm.description,
          pm.is_active,
          pm.created_at

        FROM payment_methods pm

        INNER JOIN tenant_payment_methods tpm
          ON tpm.payment_method_id = pm.id

        WHERE tpm.tenant_id = $1

        ORDER BY pm.id ASC
        `,
        [
          currentUser.tenantId ||
          currentUser.tenant_id
        ]
      );

    }

    return NextResponse.json(result.rows);

  }

  catch (error) {

    console.error(
      "GET PAYMENT METHODS ERROR:",
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
// CREATE PAYMENT METHOD
// =========================================


export async function POST(req){


try{


const currentUser =
verifyRequestToken(req);



if(!currentUser.isSystemAdmin){

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
paymentSchema,
body
);


if(data instanceof Response){

return data;

}



const {

name,

description,

is_active,

tenant_ids

}=data;




const paymentResult =
await pool.query(`

INSERT INTO payment_methods

(
name,
description,
is_active
)

VALUES($1,$2,$3)

RETURNING *

`,
[
name,
description || "",
is_active ?? true
]
);



const payment =
paymentResult.rows[0];





// SYSTEM ADMIN ASSIGN TENANTS

if(currentUser.isSystemAdmin){


for(const tenantId of tenant_ids || []){


await pool.query(`

INSERT INTO tenant_payment_methods

(
tenant_id,
payment_method_id
)

VALUES($1,$2)

ON CONFLICT DO NOTHING

`,
[
tenantId,
payment.id
]
);


}



}


// TENANT ADMIN

else{


await pool.query(`

INSERT INTO tenant_payment_methods

(
tenant_id,
payment_method_id
)

VALUES($1,$2)

`,
[
currentUser.tenantId,
payment.id
]
);


}



return NextResponse.json(
{
success:true,
payment
},
{
status:201
}
);



}catch(error){

console.error(
"CREATE PAYMENT ERROR:",
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