import { NextResponse } from "next/server";

import pool from "@/lib/db";

import {
  verifyRequestToken,
  requireRole
} from "@/lib/auth";

import {
  logger
} from "../../../lib/logger";

import {
  productSchema
} from "../../../lib/validations/ProductValidation";

import {
  validate
} from "../../../lib/validations/validate";




// GET ALL PRODUCTS

// ======================================
// GET ALL PRODUCTS
// ======================================

export async function GET(req) {

  try {

    const user = verifyRequestToken(req);

    const isSystemAdmin =
      user.is_system_admin === true ||
      user.isSystemAdmin === true;

    const tenantId =
      user.tenantId ||
      user.tenant_id;

    const { searchParams } = new URL(req.url);

    const selectedTenant =
      searchParams.get("tenant_id");

    let result;

    // ======================================
    // SYSTEM ADMIN
    // ======================================

    if (isSystemAdmin) {

      if (selectedTenant) {

        result = await pool.query(
          `
          SELECT

            p.id,
            p.name,
            p.barcode,
            p.purchase_price,
            p.selling_price,
            p.status,
            p.tax_id,

            c.name AS category,
            s.name AS supplier,
            u.name AS unit,
            t.name AS tax,
            t.rate AS tax_rate,

            COALESCE(
              JSON_AGG(ten.name)
              FILTER (WHERE ten.id IS NOT NULL),
              '[]'
            ) AS tenants

          FROM products p

          INNER JOIN tenant_product tp
            ON p.id = tp.product_id

          LEFT JOIN categories c
            ON p.category_id = c.id

          LEFT JOIN suppliers s
            ON p.supplier_id = s.id

          LEFT JOIN units u
            ON p.unit_id = u.id

          LEFT JOIN taxes t
            ON p.tax_id = t.id

          LEFT JOIN tenants ten
            ON tp.tenant_id = ten.id

          WHERE tp.tenant_id = $1

          GROUP BY
            p.id,
            c.name,
            s.name,
            u.name,
            t.name,
            t.rate

          ORDER BY p.id DESC
          `,
          [selectedTenant]
        );

      } else {

        result = await pool.query(
          `
          SELECT

            p.id,
            p.name,
            p.barcode,
            p.purchase_price,
            p.selling_price,
            p.status,
            p.tax_id,

            c.name AS category,
            s.name AS supplier,
            u.name AS unit,
            t.name AS tax,
            t.rate AS tax_rate,

            COALESCE(
              JSON_AGG(ten.name)
              FILTER (WHERE ten.id IS NOT NULL),
              '[]'
            ) AS tenants

          FROM products p

          LEFT JOIN categories c
            ON p.category_id = c.id

          LEFT JOIN suppliers s
            ON p.supplier_id = s.id

          LEFT JOIN units u
            ON p.unit_id = u.id

          LEFT JOIN taxes t
            ON p.tax_id = t.id

          LEFT JOIN tenant_product tp
            ON p.id = tp.product_id

          LEFT JOIN tenants ten
            ON tp.tenant_id = ten.id

          GROUP BY
            p.id,
            c.name,
            s.name,
            u.name,
            t.name,
            t.rate

          ORDER BY p.id DESC
          `
        );

      }

    }

    // ======================================
    // TENANT USER
    // ======================================

    else {

      if (!tenantId) {

        return NextResponse.json(
          {
            message: "Tenant not found in token"
          },
          {
            status: 403
          }
        );

      }

      result = await pool.query(
        `
        SELECT

          p.id,
          p.name,
          p.barcode,
          p.purchase_price,
          p.selling_price,
          p.status,
          p.tax_id,

          c.name AS category,
          s.name AS supplier,
          u.name AS unit,
          t.name AS tax,
          t.rate AS tax_rate,

          COALESCE(
            JSON_AGG(ten.name)
            FILTER (WHERE ten.id IS NOT NULL),
            '[]'
          ) AS tenants

        FROM products p

        INNER JOIN tenant_product tp
          ON p.id = tp.product_id

        LEFT JOIN categories c
          ON p.category_id = c.id

        LEFT JOIN suppliers s
          ON p.supplier_id = s.id

        LEFT JOIN units u
          ON p.unit_id = u.id

        LEFT JOIN taxes t
          ON p.tax_id = t.id

        LEFT JOIN tenants ten
          ON tp.tenant_id = ten.id

        WHERE tp.tenant_id = $1

        GROUP BY
          p.id,
          c.name,
          s.name,
          u.name,
          t.name,
          t.rate

        ORDER BY p.id DESC
        `,
        [tenantId]
      );

    }

    return NextResponse.json(result.rows);

  } catch (error) {

    logger.error(error.message);

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





// CREATE PRODUCT

export async function POST(req){


try{


const user =
verifyRequestToken(req);



const isSystemAdmin = user.isSystemAdmin;
requireRole(

user,

[
"admin",
"system_admin"
]

);



const body =
await req.json();



const data =
validate(

productSchema,

body

);



if(data instanceof Response){

return data;

}
const client =
await pool.connect();



try{


await client.query("BEGIN");





const productResult =
await client.query(

`

INSERT INTO products

(

name,

barcode,

category_id,

supplier_id,

unit_id,

purchase_price,

selling_price,

tax_id,

status

)

VALUES

($1,$2,$3,$4,$5,$6,$7,$8,$9)

RETURNING *

`

,

[

data.name,

data.barcode,

data.category_id,

data.supplier_id,

data.unit_id,

data.purchase_price,

data.selling_price,

data.tax_id,

data.status ?? true

]

);



const product =
productResult.rows[0];


let tenantIds = [];

// System Admin selects tenants manually
if (isSystemAdmin) {

  tenantIds = body.tenant_ids || [];

  if (tenantIds.length === 0) {

    throw new Error(
      "Please select at least one tenant."
    );

  }

}
// Tenant Admin automatically assigned to own tenant

else{


if(!user.tenantId){


throw new Error(
"Tenant not found in token"
);


}



tenantIds = [

user.tenantId

];


}







for (const tenantId of tenantIds) {

  const tenantExists =
    await client.query(
      `
      SELECT id
      FROM tenants
      WHERE id = $1
      `,
      [tenantId]
    );

  if (tenantExists.rows.length === 0) {

    throw new Error(
      `Tenant ${tenantId} does not exist.`
    );

  }

  await client.query(
    `
    INSERT INTO tenant_product
    (
      tenant_id,
      product_id
    )
    VALUES
    ($1,$2)
    ON CONFLICT DO NOTHING
    `,
    [
      tenantId,
      product.id
    ]
  );

}




await client.query("COMMIT");




return NextResponse.json(

product,

{
status:201
}

);



}
catch(error){


await client.query("ROLLBACK");


throw error;


}
finally{


client.release();


}



}
catch(error){


logger.error(error.message);



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