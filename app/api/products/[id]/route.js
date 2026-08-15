import { NextResponse } from "next/server";

import pool from "../../../../lib/db";

import {
  verifyRequestToken,
  requireRole
} from "@/lib/auth";

import {
  productSchema
} from "../../../../lib/validations/ProductValidation";

import {
  validate
} from "../../../../lib/validations/validate";




// GET PRODUCT BY ID

export async function GET(req,{params}){

try{


const user =
verifyRequestToken(req);


const {id}=await params;


const isSystemAdmin =
user.is_system_admin === true ||
user.isSystemAdmin === true;



let result;



if(isSystemAdmin){


result = await pool.query(

`

SELECT

p.id,

p.name,

p.barcode,

p.purchase_price,

p.selling_price,

p.status,

p.tax_id,


c.name AS category,

s.name AS supplier,

u.name AS unit,

t.name AS tax,

t.rate AS tax_rate,


COALESCE(

JSON_AGG(

tp.tenant_id

) FILTER (

WHERE tp.tenant_id IS NOT NULL

),

'[]'

) AS tenant_ids



FROM products p



LEFT JOIN categories c

ON p.category_id=c.id



LEFT JOIN suppliers s

ON p.supplier_id=s.id



LEFT JOIN units u

ON p.unit_id=u.id



LEFT JOIN taxes t

ON p.tax_id=t.id



LEFT JOIN tenant_product tp

ON p.id=tp.product_id



WHERE p.id=$1



GROUP BY

p.id,

c.name,

s.name,

u.name,

t.name,

t.rate


`

,

[
id
]

);



}
else{


result = await pool.query(

`

SELECT

p.id,

p.name,

p.barcode,

p.purchase_price,

p.selling_price,

p.status,

p.tax_id,


c.name AS category,

s.name AS supplier,

u.name AS unit,

t.name AS tax,

t.rate AS tax_rate,


COALESCE(

JSON_AGG(

tp.tenant_id

) FILTER (

WHERE tp.tenant_id IS NOT NULL

),

'[]'

) AS tenant_ids



FROM products p



INNER JOIN tenant_product tp

ON p.id=tp.product_id



LEFT JOIN categories c

ON p.category_id=c.id



LEFT JOIN suppliers s

ON p.supplier_id=s.id



LEFT JOIN units u

ON p.unit_id=u.id



LEFT JOIN taxes t

ON p.tax_id=t.id



WHERE p.id=$1

AND tp.tenant_id=$2



GROUP BY

p.id,

c.name,

s.name,

u.name,

t.name,

t.rate


`

,

[
id,
user.tenantId
]

);



}



if(result.rows.length===0){


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



}
catch(error){


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
// UPDATE PRODUCT

export async function PUT(req,{params}){

try{

const user =
verifyRequestToken(req);

const isSystemAdmin =
user.is_system_admin === true ||
user.isSystemAdmin === true;

requireRole(

user,

[
"admin",
"superAdmin"
]

);

const {id}=await params;

const body =
await req.json();

const data =
validate(

productSchema,

body

);

if(data instanceof Response){

return data;

}

const client =
await pool.connect();

try{

await client.query("BEGIN");



// Tenant admin can update only products belonging to their tenant

if(!isSystemAdmin){

const checkProduct =
await client.query(

`

SELECT 1

FROM tenant_product

WHERE product_id=$1

AND tenant_id=$2

`

,

[
id,
user.tenantId
]

);

if(checkProduct.rows.length===0){

await client.query("ROLLBACK");

return NextResponse.json(

{
message:"Product not found in your tenant"
},

{
status:404
}

);

}

}



const result =
await client.query(

`

UPDATE products

SET

name=$1,

barcode=$2,

category_id=$3,

supplier_id=$4,

unit_id=$5,

purchase_price=$6,

selling_price=$7,

tax_id=$8,

status=$9

WHERE id=$10

RETURNING *

`

,

[

data.name,

data.barcode,

data.category_id,

data.supplier_id,

data.unit_id,

data.purchase_price,

data.selling_price,

data.tax_id,

data.status ?? true,

id

]

);



if(result.rows.length===0){

await client.query("ROLLBACK");

return NextResponse.json(

{
message:"Product not found"
},

{
status:404
}

);

}



// Only System Admin can change tenant assignments

if(isSystemAdmin && body.tenant_ids){

await client.query(

`

DELETE FROM tenant_product

WHERE product_id=$1

`

,

[
id
]

);

for(const tenantId of body.tenant_ids){

await client.query(

`

INSERT INTO tenant_product

(

tenant_id,

product_id

)

VALUES

($1,$2)

ON CONFLICT DO NOTHING

`

,

[
tenantId,
id
]

);

}

}



await client.query("COMMIT");

return NextResponse.json(

result.rows[0]

);

}
catch(error){

await client.query("ROLLBACK");

throw error;

}
finally{

client.release();

}

}
catch(error){

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

export async function DELETE(req,{params}){

try{

const user =
verifyRequestToken(req);

const isSystemAdmin =
user.is_system_admin === true ||
user.isSystemAdmin === true;

requireRole(

user,

[
"admin",
"superAdmin"
]

);

const {id}=await params;

const client =
await pool.connect();

try{

await client.query("BEGIN");



// Tenant admin can delete only products that belong to their tenant

if(!isSystemAdmin){

const checkProduct =
await client.query(

`

SELECT 1

FROM tenant_product

WHERE product_id=$1

AND tenant_id=$2

`

,

[
id,
user.tenantId
]

);

if(checkProduct.rows.length===0){

await client.query("ROLLBACK");

return NextResponse.json(

{
message:"Product not found in your tenant"
},

{
status:404
}

);

}

}



// Remove tenant mapping

await client.query(

`

DELETE FROM tenant_product

WHERE product_id=$1

`

,

[
id
]

);



// Delete the product

const result =
await client.query(

`

DELETE FROM products

WHERE id=$1

RETURNING *

`

,

[
id
]

);

if(result.rows.length===0){

await client.query("ROLLBACK");

return NextResponse.json(

{
message:"Product not found"
},

{
status:404
}

);

}



await client.query("COMMIT");

return NextResponse.json(

{

message:"Product deleted successfully",

data:result.rows[0]

}

);

}
catch(error){

await client.query("ROLLBACK");

throw error;

}
finally{

client.release();

}

}
catch(error){

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