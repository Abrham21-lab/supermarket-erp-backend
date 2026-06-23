import { NextResponse } from "next/server";
import pool from "../../../lib/db";

import { stockSchema } from "../../../lib/validations/stockValidation";
import { validate } from "../../../lib/validations/validate";

import { verifyRequestToken, requireRole } from "@/lib/auth";



// GET ALL STOCK
// authenticated users

export async function GET(req){


try{


verifyRequestToken(req);



const result = await pool.query(

`
SELECT

ps.id,

p.name AS product,

b.name AS branch,

ps.quantity

FROM product_stock ps


JOIN products p

ON ps.product_id = p.id


JOIN branches b

ON ps.branch_id = b.id


ORDER BY ps.id ASC

`

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









// CREATE / UPDATE STOCK
// admin + superAdmin + manager


export async function POST(req){


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




const body = await req.json();



const data = validate(

stockSchema,

body

);



if(data instanceof Response){

return data;

}




const {


product_id,

branch_id,

quantity


}=data;






// check existing stock


const existing = await pool.query(

`
SELECT *

FROM product_stock

WHERE product_id=$1

AND branch_id=$2

`,

[
product_id,
branch_id
]

);






let result;





if(existing.rows.length > 0){



// UPDATE STOCK


result = await pool.query(

`
UPDATE product_stock

SET quantity = quantity + $1

WHERE product_id=$2

AND branch_id=$3

RETURNING *

`,

[

quantity,

product_id,

branch_id

]

);



}else{



// CREATE STOCK


result = await pool.query(

`
INSERT INTO product_stock

(
product_id,
branch_id,
quantity
)

VALUES($1,$2,$3)

RETURNING *

`,

[

product_id,

branch_id,

quantity

]

);



}




return NextResponse.json(

result.rows[0],

{
status:201
}

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