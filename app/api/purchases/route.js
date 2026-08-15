import { NextResponse } from "next/server";
import pool from "../../../lib/db";

import { verifyRequestToken, requireRole } from "@/lib/auth";

import { purchasesSchema } from "../../../lib/validations/purchasesValidation";
import { validate } from "../../../lib/validations/validate";


// GET ALL PURCHASES
// authenticated users

export async function GET(req){

    try{

        const user = verifyRequestToken(req);


        requireRole(
            user,
            [
                "admin",
                "superAdmin",
                "manager"
            ]
        );


        let purchaseQuery = `

SELECT

p.*,

t.name AS tenant_name,

s.name AS supplier_name,

b.name AS branch_name

FROM purchases p

LEFT JOIN tenants t
ON p.tenant_id = t.id

LEFT JOIN suppliers s
ON p.supplier_id = s.id

LEFT JOIN branches b
ON p.branch_id = b.id

`;



        const values = [];



        if(!user.isSystemAdmin){

            purchaseQuery += `

WHERE p.tenant_id = $1

`;

            values.push(
                user.tenantId
            );

        }



        purchaseQuery += `

ORDER BY p.id DESC

`;



        const result =
        await pool.query(
            purchaseQuery,
            values
        );



        return NextResponse.json(
            result.rows
        );



    }catch(error){


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


// CREATE PURCHASE
// admin + superAdmin + manager

export async function POST(req) {

  const client = await pool.connect();

  try {

    const user = verifyRequestToken(req);

    requireRole(
      user,
      [
        "admin",
        "superAdmin",
        "manager"
      ]
    );

    const body = await req.json();

    const data = validate(
      purchasesSchema,
      body
    );

    if (data instanceof Response) {
      return data;
    }

    const {
  tenant_id,
  supplier_id,
  branch_id,
  invoice_number,
  items
} = data;


// ===============================
// Determine tenant
// ===============================

let assignedTenant;

if (user.isSystemAdmin) {

  if (!tenant_id) {

    return NextResponse.json(
      {
        message: "Tenant is required."
      },
      {
        status: 400
      }
    );

  }

  assignedTenant = Number(tenant_id);

}
else {

  assignedTenant = user.tenantId;

}

    await client.query("BEGIN");

    let total_amount = 0;

    for (const item of items) {

      total_amount +=
        Number(item.quantity) *
        Number(item.purchase_price);

    }
const branchCheck =
await client.query(
`
SELECT id
FROM branches
WHERE id=$1
AND tenant_id=$2
`,
[
branch_id,
assignedTenant
]
);

if(branchCheck.rows.length===0){

throw new Error(
"Selected branch does not belong to the selected tenant."
);

}

const supplierCheck =
await client.query(
`
SELECT id
FROM suppliers
WHERE id=$1
AND tenant_id=$2
`,
[
supplier_id,
assignedTenant
]
);

if(supplierCheck.rows.length===0){

throw new Error(
"Selected supplier does not belong to the selected tenant."
);

}
    const purchaseResult =
      await client.query(
`
INSERT INTO purchases
(
tenant_id,
supplier_id,
branch_id,
invoice_number,
total_amount,
status
)

VALUES($1,$2,$3,$4,$5,'COMPLETED')
RETURNING *
`,
        [
  assignedTenant,
  supplier_id,
  branch_id,
  invoice_number,
  total_amount
]
      );

    const purchase =
      purchaseResult.rows[0];

    for (const item of items) {

      const subtotal =
        item.quantity *
        item.purchase_price;
const productCheck =
await client.query(
`
SELECT 1
FROM tenant_product
WHERE tenant_id=$1
AND product_id=$2
`,
[
assignedTenant,
item.product_id
]
);

if(productCheck.rows.length===0){

throw new Error(
`Product ${item.product_id} does not belong to the selected tenant.`
);

}
      await client.query(
`
INSERT INTO purchase_items
(
tenant_id,
purchase_id,
product_id,
quantity,
purchase_price,
subtotal
)
VALUES($1,$2,$3,$4,$5,$6)
`,
        [
          assignedTenant,
          purchase.id,
          item.product_id,
          item.quantity,
          item.purchase_price,
          subtotal
        ]
      );

      await client.query(
`
INSERT INTO product_stock
(
tenant_id,
product_id,
branch_id,
quantity
)
VALUES($1,$2,$3,$4)

ON CONFLICT(tenant_id,product_id,branch_id)

DO UPDATE SET

quantity =
product_stock.quantity +
EXCLUDED.quantity
`,
        [ 
          assignedTenant,
          item.product_id,
          branch_id,
          item.quantity
        ]
      );

      await client.query(
`
INSERT INTO inventory_transactions
(
tenant_id,
product_id,
branch_id,
transaction_type,
quantity,
reference
)
VALUES($1,$2,$3,'PURCHASE',$4,$5)

`,
        [ 
          assignedTenant,
          item.product_id,
          branch_id,
          item.quantity,
          invoice_number
        ]
      );

    }

    await client.query("COMMIT");

    return NextResponse.json(
      purchase,
      {
        status: 201
      }
    );

  } catch (error) {

    await client.query("ROLLBACK");

    return NextResponse.json(
      {
        message: error.message
      },
      {
        status: 500
      }
    );

  } finally {

    client.release();

  }

}