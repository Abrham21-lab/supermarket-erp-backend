import { NextResponse } from "next/server";

import pool from "../../../../lib/db";

import {
  verifyRequestToken,
  requireRole
} from "@/lib/auth";




// GET SINGLE SALE

export async function GET(req, { params }) {


  try {


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





    // ============================
    // GET SALE HEADER
    // ============================


    let saleQuery = `

SELECT

    s.*,

    t.name AS tenant_name,

    b.name AS branch_name,

    pm.name AS payment_method


FROM sales s



LEFT JOIN tenants t

ON s.tenant_id = t.id



LEFT JOIN branches b

ON s.branch_id = b.id



LEFT JOIN payment_methods pm

ON s.payment_method_id = pm.id



WHERE s.id = $1

`;



    const saleValues = [id];



    if(!user.isSystemAdmin){

  saleQuery += `
AND s.tenant_id = $2
`;

  saleValues.push(user.tenantId);

}


    






    const saleResult =
    await pool.query(
      saleQuery,
      saleValues
    );







    if(
      saleResult.rows.length === 0
    ){


      return NextResponse.json(

        {
          success:false,
          message:"Sale not found"
        },

        {
          status:404
        }

      );


    }







    const sale =
    saleResult.rows[0];








    // ============================
    // GET SALE ITEMS
    // ============================
const itemsResult =
await pool.query(

`
SELECT

si.*,

p.name AS product_name,

u.name AS unit_name,

u.symbol AS unit_symbol

FROM sale_items si


LEFT JOIN products p
ON si.product_id = p.id


LEFT JOIN units u
ON p.unit_id = u.id


WHERE si.sale_id=$1

`,
[id]

);








    return NextResponse.json({

      success:true,

      sale,

      items:
      itemsResult.rows

    });








  }

  catch(error){



    return NextResponse.json(

      {
        success:false,
        message:error.message
      },

      {
        status:500
      }

    );


  }


}