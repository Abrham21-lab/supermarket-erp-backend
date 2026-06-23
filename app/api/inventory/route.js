import { NextResponse } from "next/server";
import pool from "../../../lib/db";

import { inventorySchema }
from "../../../lib/validations/inventoryValidation";

import { validate }
from "../../../lib/validations/validate";

import {
  verifyRequestToken,
  requireRole
} from "@/lib/auth";
// GET ALL INVENTORY TRANSACTIONS


export async function GET(req){

try{

verifyRequestToken(req);
const result = await pool.query(

`
SELECT

it.id,

p.name AS product,

b.name AS branch,

it.transaction_type,

it.quantity,

it.reference,

it.created_at


FROM inventory_transactions it


JOIN products p

ON it.product_id=p.id


JOIN branches b

ON it.branch_id=b.id


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









// CREATE INVENTORY TRANSACTION


export async function POST(req){


try{

const body = await req.json();

const user = verifyRequestToken(req);

requireRole(
  user,
  [
    "admin",
    "superAdmin",
    "manager"
  ]
);

const data = validate(
  inventorySchema,
  body
);

if (data instanceof Response) {
  return data;
}

const {

  product_id,

  branch_id,

  transaction_type,

  quantity,

  reference

} = data;



// START TRANSACTION

await pool.query("BEGIN");




// INSERT TRANSACTION HISTORY


const transaction = await pool.query(

`
INSERT INTO inventory_transactions

(
product_id,
branch_id,
transaction_type,
quantity,
reference
)

VALUES($1,$2,$3,$4,$5)

RETURNING *

`,

[

product_id,

branch_id,

transaction_type,

quantity,

reference

]

);







// UPDATE STOCK


if(transaction_type === "STOCK_IN"){



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

quantity = product_stock.quantity + EXCLUDED.quantity

`,

[

product_id,

branch_id,

quantity

]

);



}





if(transaction_type === "STOCK_OUT"){



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

branch_id

]

);



}





if(transaction_type === "ADJUSTMENT"){



await pool.query(

`
UPDATE product_stock

SET quantity=$1

WHERE product_id=$2

AND branch_id=$3

`,

[

quantity,

product_id,

branch_id

]

);



}






await pool.query("COMMIT");





return NextResponse.json(

transaction.rows[0],

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