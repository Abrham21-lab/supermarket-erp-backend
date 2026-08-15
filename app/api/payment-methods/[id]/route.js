import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import { paymentSchema } from "../../../../lib/validations/paymentMethodValidation";
import { validate } from "../../../../lib/validations/validate";
import {
  verifyRequestToken,
  requireRole,
} from "@/lib/auth";

// =========================================
// GET PAYMENT METHOD BY ID
// =========================================
export async function GET(req, { params }) {
  try {
    const currentUser = verifyRequestToken(req);

    const { id } = await params;

    let result;

    // =====================================
    // SYSTEM ADMIN
    // =====================================

    if (currentUser.isSystemAdmin) {
      result = await pool.query(
        `
        SELECT
            p.id,
            p.name,
            p.is_active,
            p.description,

            COALESCE(
                ARRAY_AGG(tp.tenant_id)
                FILTER (WHERE tp.tenant_id IS NOT NULL),
                '{}'
            ) AS tenant_ids,

            COALESCE(
                ARRAY_AGG(t.name)
                FILTER (WHERE t.name IS NOT NULL),
                '{}'
            ) AS tenant_names

        FROM payment_methods p

        LEFT JOIN tenant_payment_methods tp
            ON tp.payment_method_id = p.id

        LEFT JOIN tenants t
            ON t.id = tp.tenant_id

        WHERE p.id=$1

        GROUP BY
            p.id,
            p.name,
            p.is_active
        `,
        [id]
      );
    }

    // =====================================
    // TENANT USER
    // =====================================

    else {
      result = await pool.query(
        `
        SELECT
            p.id,
            p.name,
            p.is_active,
            p.description,

        FROM payment_methods p

        INNER JOIN tenant_payment_methods tp
            ON tp.payment_method_id=p.id

        WHERE
            p.id=$1
        AND
            tp.tenant_id=$2
        `,
        [id, currentUser.tenantId]
      );
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "Payment method not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
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
// UPDATE PAYMENT METHOD
// =========================================
export async function PUT(req, { params }) {
  try {
    const currentUser = verifyRequestToken(req);

    if (!currentUser.isSystemAdmin) {
      requireRole(currentUser, ["admin", "manager"]);
    }

    const { id } = await params;

    const body = await req.json();

    const data = validate(paymentSchema, body);

    if (data instanceof Response) {
      return data;
    }

    const {
  name,
  description,
  is_active,
  tenant_ids,
} = data;

    // =====================================
    // TENANT ACCESS CHECK
    // =====================================

    if (!currentUser.isSystemAdmin) {
      const access = await pool.query(
        `
        SELECT 1

        FROM tenant_payment_methods

        WHERE
            payment_method_id=$1
        AND
            tenant_id=$2
        `,
        [id, currentUser.tenantId]
      );

      if (access.rows.length === 0) {
        return NextResponse.json(
          {
            message:
              "Payment method not found or access denied",
          },
          {
            status: 404,
          }
        );
      }
    }

    // =====================================
    // UPDATE PAYMENT METHOD
    // =====================================

   const result =
await pool.query(`

UPDATE payment_methods

SET

name=$1,

description=$2,

is_active=$3


WHERE id=$4


RETURNING *

`,
[
name,
description || "",
is_active ?? true,
id
]
);



if(result.rows.length===0){

return NextResponse.json(
{
message:"Payment method not found"
},
{
status:404
}
);

}





// SYSTEM ADMIN UPDATE TENANTS

if(currentUser.isSystemAdmin){


await pool.query(`

DELETE FROM tenant_payment_methods

WHERE payment_method_id=$1

`,
[
id
]
);



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
id
]
);


}

}

    return NextResponse.json({
      success: true,
      payment_method: result.rows[0],
    });
  } catch (error) {
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
// DELETE PAYMENT METHOD
// =========================================
export async function DELETE(req, { params }) {
  try {
    const currentUser = verifyRequestToken(req);

    if (!currentUser.isSystemAdmin) {
      requireRole(currentUser, ["admin"]);
    }

    const { id } = await params;

    // =====================================
    // TENANT ACCESS CHECK
    // =====================================

    if (!currentUser.isSystemAdmin) {
      const access = await pool.query(
        `
        SELECT 1

        FROM tenant_payment_methods

        WHERE
            payment_method_id=$1
        AND
            tenant_id=$2
        `,
        [id, currentUser.tenantId]
      );

      if (access.rows.length === 0) {
        return NextResponse.json(
          {
            message:
              "Payment method not found or access denied",
          },
          {
            status: 404,
          }
        );
      }
    }

    // Remove mappings

    await pool.query(
      `
      DELETE FROM tenant_payment_methods

      WHERE payment_method_id=$1
      `,
      [id]
    );

    // Delete payment method

    const result = await pool.query(
      `
      DELETE FROM payment_methods

      WHERE id=$1

      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "Payment method not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment method deleted successfully",
    });
  } catch (error) {
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