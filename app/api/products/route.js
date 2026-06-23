import { NextResponse } from "next/server";
import pool from "@/lib/db";

import { verifyRequestToken, requireRole } from "@/lib/auth";

import { logger } from "../../../lib/logger";

import { productSchema } from "../../../lib/validations/ProductValidation";

import { validate } from "../../../lib/validations/validate";





// GET ALL PRODUCTS
// authenticated users

export async function GET(req) {


  try {



    verifyRequestToken(req);




    const result = await pool.query(

`
SELECT

p.id,

p.name,

p.barcode,

p.purchase_price,

p.selling_price,


c.name AS category,


s.name AS supplier,


u.name AS unit


FROM products p


LEFT JOIN categories c

ON p.category_id = c.id



LEFT JOIN suppliers s

ON p.supplier_id = s.id



LEFT JOIN units u

ON p.unit_id = u.id



ORDER BY p.id DESC

`

    );




    logger.info("Products retrieved");



    return NextResponse.json(

      result.rows

    );




  } catch(error) {



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












// CREATE PRODUCT
// admin + superAdmin only


export async function POST(req) {


  try {



    const user = verifyRequestToken(req);



    console.log("JWT USER:", user);



    requireRole(

      user,

      [
        "admin",
        "superAdmin"
      ]

    );





    const body = await req.json();




    const data = validate(

      productSchema,

      body

    );




    if(data instanceof Response){

      return data;

    }







    const {


      name,

      barcode,

      category_id,

      supplier_id,

      unit_id,

      purchase_price,

      selling_price


    } = data;








    const result = await pool.query(

`

INSERT INTO products

(

name,

barcode,

category_id,

supplier_id,

unit_id,

purchase_price,

selling_price

)


VALUES

($1,$2,$3,$4,$5,$6,$7)


RETURNING *

`

,

[


name,

barcode,

category_id,

supplier_id,

unit_id,

purchase_price,

selling_price


]

);






    return NextResponse.json(

      result.rows[0],

      {
        status:201
      }

    );





  } catch(error) {



    logger.error(error.message);



    return NextResponse.json(

      {
        message:error.message
      },

      {
        status:403
      }

    );


  }


}