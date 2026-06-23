import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

import { verifyRequestToken, requireRole } from "@/lib/auth";




// GET SINGLE SALE
// authenticated users can view


export async function GET(
    req,
    { params }
){

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



        const { id } = await params;




        const sale = await pool.query(

`
SELECT

s.*,

b.name AS branch_name,

pm.name AS payment_method

FROM sales s


LEFT JOIN branches b

ON s.branch_id = b.id


LEFT JOIN payment_methods pm

ON s.payment_method_id = pm.id


WHERE s.id=$1

`,

[id]

);





        if(sale.rows.length === 0){


            return NextResponse.json(

                {
                    message:"Sale not found"
                },

                {
                    status:404
                }

            );

        }





        const items = await pool.query(

`
SELECT

si.*,

p.name AS product_name


FROM sale_items si


LEFT JOIN products p

ON si.product_id = p.id


WHERE si.sale_id=$1

`,

[id]

);





        return NextResponse.json({

            sale:sale.rows[0],

            items:items.rows

        });




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