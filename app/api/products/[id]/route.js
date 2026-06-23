import { NextResponse } from "next/server";

import pool from "../../../../lib/db";

import { verifyRequestToken, requireRole } from "@/lib/auth";

import { productSchema } from "../../../../lib/validations/ProductValidation";

import { validate } from "../../../../lib/validations/validate";



export async function GET(req, { params }) {

  try {

    verifyRequestToken(req);

    const { id } = await params;

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

WHERE p.id = $1
`,

      [id]

    );

    if (result.rows.length === 0) {

      return NextResponse.json(
        {
          message: "Product not found"
        },
        {
          status: 404
        }
      );

    }

    return NextResponse.json(
      result.rows[0]
    );

  } catch (error) {

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
// UPDATE PRODUCT
// admin + superAdmin only


export async function PUT(req, { params }) {


  try {


    const user = verifyRequestToken(req);



    requireRole(

      user,

      [
        "admin",
        "superAdmin"
      ]

    );



    const { id } = await params;




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

UPDATE products

SET

name=$1,

barcode=$2,

category_id=$3,

supplier_id=$4,

unit_id=$5,

purchase_price=$6,

selling_price=$7

WHERE id=$8

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

selling_price,

id


]

);





    if(result.rows.length === 0){

      return NextResponse.json(

        {
          message:"Product not found"
        },

        {
          status:404
        }

      );

    }





    return NextResponse.json(

      result.rows[0]

    );





  } catch(error){



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









// DELETE PRODUCT
// admin + superAdmin only


export async function DELETE(req, { params }) {


  try {



    const user = verifyRequestToken(req);



    requireRole(

      user,

      [
        "admin",
        "superAdmin"
      ]

    );




    const { id } = await params;





    const result = await pool.query(

`
DELETE FROM products

WHERE id=$1

RETURNING *

`,

[id]

);





    if(result.rows.length === 0){


      return NextResponse.json(

        {
          message:"Product not found"
        },

        {
          status:404
        }

      );


    }





    return NextResponse.json(

      {
        message:"Product deleted successfully",

        data:result.rows[0]

      }

    );





  } catch(error){



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