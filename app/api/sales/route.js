import { NextResponse } from "next/server";

import pool from "../../../lib/db";

import { verifyRequestToken, requireRole } from "@/lib/auth";

import { salesSchema } from "../../../lib/validations/SalesValidation";

import { validate } from "../../../lib/validations/validate";

import { createNotification } from "@/lib/createNotification";

import { getUsersByRoles } from "@/lib/getUsersByRoles";



// =========================================
// GET ALL SALES
// =========================================

export async function GET(req) {

    try {

        const user = verifyRequestToken(req);

        let query = `

SELECT

    s.id,

    s.total_amount,

    s.created_at,

    s.branch_id,

    s.payment_method_id,

    s.tenant_id,

    t.name AS tenant_name,

    b.name AS branch_name,

    pm.name AS payment_method,

    COUNT(si.id) AS total_items,

    COALESCE(SUM(si.quantity),0) AS total_quantity

FROM sales s

LEFT JOIN tenants t
ON s.tenant_id = t.id

LEFT JOIN branches b
ON s.branch_id = b.id

LEFT JOIN payment_methods pm
ON s.payment_method_id = pm.id

LEFT JOIN sale_items si
ON s.id = si.sale_id

`;

        const params = [];

        const isSystemAdmin =
    user.isSystemAdmin === true ||
    user.is_system_admin === true;


if (!isSystemAdmin) {
            query += `

WHERE s.tenant_id = $1

`;

            params.push(user.tenantId);

        }

        query += `

GROUP BY

    s.id,

    s.total_amount,

    s.created_at,

    s.branch_id,

    s.payment_method_id,

    s.tenant_id,

    t.name,

    b.name,

    pm.name

ORDER BY s.id DESC

`;

        const result = await pool.query(
            query,
            params
        );

        return NextResponse.json(result.rows);

    } catch (error) {

        console.error(error);

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
// CREATE SALE
// =========================================

export async function POST(req){

    const client = await pool.connect();

    try{

        const user = verifyRequestToken(req);

        requireRole(
            user,
            [
                "admin",
                "superAdmin",
                "manager",
                "cashier"
            ]
        );

        const body = await req.json();

        const data = validate(
            salesSchema,
            body
        );

        if(data instanceof Response){

            return data;

        }

        const {

            branch_id,

            payment_method_id,

            items,

            tenant_id

        } = data;
        // =========================================
// DETERMINE TENANT
// =========================================

let saleTenantId;

if (user.isSystemAdmin) {

    if (!tenant_id) {

        throw new Error(
            "Tenant is required."
        );

    }

    saleTenantId = Number(tenant_id);

} else {

    saleTenantId = user.tenantId;

}

await client.query("BEGIN");

let total_amount = 0;

// =========================================
// CHECK STOCK
// =========================================

for (const item of items) {

    const stockResult = await client.query(

`
SELECT

    quantity

FROM product_stock

WHERE tenant_id = $1
AND product_id = $2
AND branch_id = $3
`,

[
    saleTenantId,
    item.product_id,
    branch_id
]

    );

    if (stockResult.rows.length === 0) {

        throw new Error(
            `No stock found for product ${item.product_id}`
        );

    }

    const available =
    Number(
        stockResult.rows[0].quantity
    );

    if (available < item.quantity) {

        throw new Error(
            `Insufficient stock for product ${item.product_id}`
        );

    }

    total_amount +=

        Number(item.quantity) *

        Number(item.unit_price);

}



// =========================================
// CREATE SALE
// =========================================

const saleResult = await client.query(

`
INSERT INTO sales
(
tenant_id,
total_amount,
branch_id,
payment_method_id
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
    saleTenantId,
    total_amount,
    branch_id,
    payment_method_id
]

);

const sale = saleResult.rows[0];



// =========================================
// CREATE SALE ITEMS
// UPDATE STOCK
// =========================================


for (const item of items) {

    // =========================================
    // INSERT SALE ITEM
    // =========================================

    await client.query(

`
INSERT INTO sale_items
(
sale_id,
product_id,
quantity,
unit_price,
subtotal
)
VALUES
(
$1,
$2,
$3,
$4,
$5
)
`,

[
    sale.id,
    item.product_id,
    item.quantity,
    item.unit_price,
    Number(item.quantity) *
    Number(item.unit_price)
]

    );



    // =========================================
    // REDUCE STOCK
    // =========================================

    await client.query(

`
UPDATE product_stock

SET quantity = quantity - $1

WHERE tenant_id = $2
AND product_id = $3
AND branch_id = $4
`,

[
    item.quantity,
    saleTenantId,
    item.product_id,
    branch_id
]

    );



    // =========================================
    // CREATE INVENTORY TRANSACTION
    // =========================================

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

VALUES
(
$1,
$2,
$3,
$4,
$5,
$6
)

`,

[
    saleTenantId,
    item.product_id,
    branch_id,
    "STOCK_OUT",
    item.quantity,
    `Sale #${sale.id}`
]

    );

}


// =========================================
// COMMIT TRANSACTION
// =========================================

await client.query("COMMIT");



// =========================================
// RETURN SUCCESS RESPONSE
// =========================================

return NextResponse.json(

{
    success: true,

    message: "Sale created successfully.",

    sale

},

{
    status: 201
}

);



} catch (error) {


    // =========================================
    // ROLLBACK TRANSACTION
    // =========================================

    if (client) {

        await client.query("ROLLBACK");

    }



    console.error(
        "CREATE SALE ERROR:",
        error
    );


    return NextResponse.json(

    {
        success: false,

        message:
        error.message ||
        "Failed to create sale."

    },

    {
        status: 500
    }

    );



} finally {


    // =========================================
    // RELEASE DATABASE CONNECTION
    // =========================================

    if (client) {

        client.release();

    }

}


}