import { NextResponse } from "next/server";

import pool from "../../../../lib/db";


export async function GET(req){


const {searchParams}=new URL(req.url);


const product_id =
searchParams.get("product_id");


const branch_id =
searchParams.get("branch_id");




const result = await pool.query(

`

SELECT quantity

FROM product_stock

WHERE product_id=$1

AND branch_id=$2

`

,

[

product_id,

branch_id

]

);



return NextResponse.json({

quantity:

result.rows.length

?

result.rows[0].quantity

:

0


});


}