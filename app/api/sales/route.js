import { NextResponse } from "next/server";

import pool from "../../../lib/db";

import { verifyRequestToken, requireRole } from "@/lib/auth";

import { salesSchema } from "../../../lib/validations/SalesValidation";

import { validate } from "../../../lib/validations/validate";





// GET ALL SALES
// authenticated users


export async function GET(req) {


    try {


        verifyRequestToken(req);



        const result = await pool.query(`

            SELECT

                s.*,

                b.name AS branch_name,

                pm.name AS payment_method


            FROM sales s


            LEFT JOIN branches b

            ON s.branch_id = b.id


            LEFT JOIN payment_methods pm

            ON s.payment_method_id = pm.id


            ORDER BY s.id DESC

        `);



        return NextResponse.json(

            result.rows

        );



    } catch(error){


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









// CREATE SALE
// admin + superAdmin + manager + cashier


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

if (data instanceof Response) {
  return data;
}

const {
  branch_id,
  payment_method_id,
  items
} = data;

        await client.query("BEGIN");





        let total_amount = 0;





        // CHECK STOCK


        for(const item of items){



            const stockResult = await client.query(

`
SELECT quantity

FROM product_stock

WHERE product_id=$1

AND branch_id=$2

`,

[

item.product_id,

branch_id

]

);





            if(stockResult.rows.length === 0){


                throw new Error(

                    `No stock found for product ${item.product_id}`

                );

            }





            const available =

            Number(stockResult.rows[0].quantity);





            if(available < item.quantity){


                throw new Error(

                    `Insufficient stock for product ${item.product_id}`

                );

            }





            total_amount +=

            item.quantity *

            item.unit_price;


        }







        // CREATE SALE


        const saleResult = await client.query(

`
INSERT INTO sales

(

total_amount,

branch_id,

payment_method_id

)

VALUES($1,$2,$3)

RETURNING *

`,

[

total_amount,

branch_id,

payment_method_id

]

);




        const sale = saleResult.rows[0];








        // CREATE SALE ITEMS + UPDATE STOCK


        for(const item of items){



            await client.query(

`
INSERT INTO sale_items

(

sale_id,

product_id,

quantity,

unit_price

)

VALUES($1,$2,$3,$4)

`,

[

sale.id,

item.product_id,

item.quantity,

item.unit_price

]

);







            await client.query(

`
UPDATE product_stock

SET quantity = quantity - $1

WHERE product_id=$2

AND branch_id=$3

`,

[

item.quantity,

item.product_id,

branch_id

]

);








            // INVENTORY HISTORY


            await client.query(

`
INSERT INTO inventory_transactions

(

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

'SALE',

$3,

$4

)

`,

[

item.product_id,

branch_id,

item.quantity,

`SALE-${sale.id}`

]

);



        }





        await client.query("COMMIT");





        return NextResponse.json(

            sale,

            {
                status:201
            }

        );





    }catch(error){



        await client.query("ROLLBACK");



        return NextResponse.json(

            {
                message:error.message
            },

            {
                status:500
            }

        );



    }finally{


        client.release();

    }


}