import { NextResponse } from "next/server";

import pool from "../../../lib/db";


// GET ALL STOCK ADJUSTMENTS

export async function GET(){

try{


const result =
await pool.query(
`
SELECT 
sa.id,
sa.product_id,
sa.branch_id,
sa.adjustment_type,
sa.quantity,
sa.reason,
sa.created_at

FROM stock_adjustments sa

ORDER BY sa.id DESC
`
);


return NextResponse.json(
result.rows
);


}

catch(error){

console.log(error);


return NextResponse.json(
{
message:"Failed to fetch stock adjustments"
},
{
status:500
}
);

}


}



// CREATE STOCK ADJUSTMENT

export async function POST(req){


try{


const body =
await req.json();


const {

product_id,

branch_id,

adjustment_type,

quantity,

reason

}=body;



const result =

await pool.query(

`

INSERT INTO stock_adjustments

(
product_id,
branch_id,
adjustment_type,
quantity,
reason
)

VALUES($1,$2,$3,$4,$5)

RETURNING *

`

,

[

product_id,

branch_id,

adjustment_type,

quantity,

reason

]


);



return NextResponse.json(

result.rows[0],

{
status:201
}

);



}

catch(error){


console.log(error);


return NextResponse.json(

{
message:"Failed to create adjustment"
},

{
status:500
}

);


}


}