import { NextResponse } from "next/server";

import pool from "../../../lib/db";

import {
  verifyRequestToken
} from "@/lib/auth";

import {
  taxSchema
} from "../../../lib/validations/taxValidation";

import {
  validate
} from "../../../lib/validations/validate";




// ===============================
// GET ALL TAXES
// ===============================

export async function GET(req){

try{


const user =
verifyRequestToken(req);


let result;


const isSystemAdmin =
user.is_system_admin === true ||
user.isSystemAdmin === true;



if(isSystemAdmin){


result = await pool.query(

`
SELECT

t.id,

t.name,

t.rate,

t.is_active,


COALESCE(

ARRAY_AGG(ten.name)
FILTER (WHERE ten.name IS NOT NULL),

ARRAY[]::text[]

) AS tenants


FROM taxes t


LEFT JOIN tenant_tax tt

ON t.id = tt.tax_id


LEFT JOIN tenants ten

ON tt.tenant_id = ten.id


GROUP BY

t.id


ORDER BY t.id ASC

`

);


}

else{


if(!user.tenantId){

return NextResponse.json(
{
message:"Tenant not found in token"
},
{
status:403
}
);

}



result = await pool.query(

`

SELECT

t.id,

t.name,

t.rate,

t.is_active,


COALESCE(

ARRAY_AGG(ten.name)
FILTER (WHERE ten.name IS NOT NULL),

ARRAY[]::text[]

) AS tenants


FROM taxes t


INNER JOIN tenant_tax tt

ON t.id = tt.tax_id


INNER JOIN tenants ten

ON tt.tenant_id = ten.id


WHERE tt.tenant_id=$1


GROUP BY

t.id


ORDER BY t.id ASC

`

,

[
user.tenantId
]

);


}



return NextResponse.json(
result.rows
);



}
catch(error){


console.error(
"GET TAXES ERROR:",
error
);


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







// ===============================
// CREATE TAX
// ===============================

export async function POST(req){


try{


const user =
verifyRequestToken(req);



const isSystemAdmin =
user.is_system_admin === true ||
user.isSystemAdmin === true;



if(!isSystemAdmin && !user.tenantId){


return NextResponse.json(

{
message:"Tenant not found in token"
},

{
status:403
}

);

}



const body =
await req.json();



const data =
validate(
taxSchema,
body
);



if(data instanceof Response){

return data;

}



const client =
await pool.connect();



try{


await client.query("BEGIN");



const taxResult =
await client.query(

`

INSERT INTO taxes

(

name,

rate,

is_active

)


VALUES

(

$1,

$2,

$3

)


RETURNING *

`

,

[

data.name,

data.rate,

data.is_active ?? true

]

);



const tax =
taxResult.rows[0];



let tenantIds=[];



if(isSystemAdmin){


tenantIds =
body.tenant_ids || [];


}
else{


tenantIds =
[
user.tenantId
];


}



for(const tenantId of tenantIds){


await client.query(

`

INSERT INTO tenant_tax

(

tenant_id,

tax_id

)


VALUES

(

$1,

$2

)


ON CONFLICT DO NOTHING

`

,

[

tenantId,

tax.id

]

);


}
await client.query("COMMIT");



return NextResponse.json(

tax,

{
status:201
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


console.error(
"CREATE TAX ERROR:",
error
);


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