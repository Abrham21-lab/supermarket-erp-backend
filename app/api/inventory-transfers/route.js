import { NextResponse } from "next/server";
import pool from "../../../lib/db";
import { verifyRequestToken, requireRole } from "@/lib/auth";

import { inventoryTransferSchema }
from "../../../lib/validations/inventoryTransferValidation";

import { validate }
from "../../../lib/validations/validate";

// GET ALL TRANSFERS

export async function GET(req){

try{

verifyRequestToken(req);
const result = await pool.query(

`
SELECT

it.id,

p.name AS product,

fb.name AS from_branch,

tb.name AS to_branch,

it.quantity,

it.reference,

it.created_at


FROM inventory_transfers it


JOIN products p

ON it.product_id=p.id


JOIN branches fb

ON it.from_branch_id=fb.id


JOIN branches tb

ON it.to_branch_id=tb.id


ORDER BY it.id DESC

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







// CREATE TRANSFER


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
  inventoryTransferSchema,
  body
);

if (data instanceof Response) {
  return data;
}

const {

  product_id,

  from_branch_id,

  to_branch_id,

  quantity,

  reference

} = data;




await pool.query("BEGIN");





// CHECK AVAILABLE STOCK


const stock = await pool.query(

`
SELECT quantity

FROM product_stock

WHERE product_id=$1

AND branch_id=$2

`,

[

product_id,

from_branch_id

]

);



if(
stock.rows.length === 0 ||
stock.rows[0].quantity < quantity
){


await pool.query("ROLLBACK");


return NextResponse.json(

{
message:"Not enough stock in source branch"
},

{
status:400
}

);


}







// REMOVE FROM SOURCE BRANCH


await pool.query(

`
UPDATE product_stock

SET quantity = quantity - $1

WHERE product_id=$2

AND branch_id=$3

`,

[

quantity,

product_id,

from_branch_id

]

);







// ADD TO DESTINATION BRANCH


await pool.query(

`
INSERT INTO product_stock

(
product_id,
branch_id,
quantity
)

VALUES($1,$2,$3)


ON CONFLICT(product_id,branch_id)

DO UPDATE SET

quantity =
product_stock.quantity + EXCLUDED.quantity

`,

[

product_id,

to_branch_id,

quantity

]

);







// SAVE TRANSFER HISTORY


const result = await pool.query(

`
INSERT INTO inventory_transfers

(
product_id,
from_branch_id,
to_branch_id,
quantity,
reference
)

VALUES($1,$2,$3,$4,$5)

RETURNING *

`,

[

product_id,

from_branch_id,

to_branch_id,

quantity,

reference

]

);






await pool.query("COMMIT");





return NextResponse.json(

result.rows[0],

{
status:201
}

);



}catch(error){



await pool.query("ROLLBACK");



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