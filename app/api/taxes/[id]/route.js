import { NextResponse } from "next/server";

import pool from "../../../../lib/db";

import {
  verifyRequestToken
}
from "@/lib/auth";

import {
  taxSchema
}
from "../../../../lib/validations/taxValidation";

import {
  validate
}
from "../../../../lib/validations/validate";




// ===============================
// GET TAX BY ID
// ===============================

export async function GET(req,{params}){

try{


const user =
verifyRequestToken(req);


const {id} =
await params;


let result;


const isSystemAdmin =
user.is_system_admin === true ||
user.isSystemAdmin === true;



if(isSystemAdmin){


result = await pool.query(

`
SELECT

t.*,

COALESCE(
JSON_AGG(tt.tenant_id)
FILTER (WHERE tt.tenant_id IS NOT NULL),
'[]'
) AS tenant_ids


FROM taxes t


LEFT JOIN tenant_tax tt

ON t.id = tt.tax_id


WHERE t.id=$1


GROUP BY t.id

`,
[
id
]

);


}
else{


result = await pool.query(

`
SELECT

t.*,

COALESCE(
JSON_AGG(tt.tenant_id)
FILTER (WHERE tt.tenant_id IS NOT NULL),
'[]'
) AS tenant_ids


FROM taxes t


INNER JOIN tenant_tax tt

ON t.id = tt.tax_id


WHERE t.id=$1

AND tt.tenant_id=$2


GROUP BY t.id

`,
[
id,
user.tenantId
]

);


}




if(result.rows.length===0){


return NextResponse.json(

{
message:"Tax not found"
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







// ===============================
// UPDATE TAX
// ===============================

export async function PUT(req,{params}){


try{


const user =
verifyRequestToken(req);



const isSystemAdmin =
user.is_system_admin === true ||
user.isSystemAdmin === true;



const {id} =
await params;



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



let result;



// ===============================
// SYSTEM ADMIN UPDATE
// ===============================

if(isSystemAdmin){


result = await client.query(

`
UPDATE taxes

SET

name=$1,

rate=$2,

is_active=$3


WHERE id=$4


RETURNING *

`,

[

data.name,

data.rate,

data.is_active ?? true,

id

]

);


}

// ===============================
// TENANT ADMIN UPDATE
// ===============================

else{


// verify tax belongs to this tenant first

const check =
await client.query(

`
SELECT id

FROM tenant_tax

WHERE tax_id=$1

AND tenant_id=$2

`,

[
id,
user.tenantId
]

);



if(check.rows.length===0){


await client.query("ROLLBACK");


return NextResponse.json(

{
message:"Tax not found or forbidden"
},

{
status:403
}

);


}




result = await client.query(

`
UPDATE taxes

SET

name=$1,

rate=$2,

is_active=$3


WHERE id=$4


RETURNING *

`,

[

data.name,

data.rate,

data.is_active ?? true,

id

]

);



}





if(result.rows.length===0){


await client.query("ROLLBACK");


return NextResponse.json(

{
message:"Tax not found"
},

{
status:404
}

);


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
status:500
}

);


}

}









// ===============================
// DELETE TAX
// ===============================

export async function DELETE(req,{params}){


try{


const user =
verifyRequestToken(req);



const isSystemAdmin =
user.is_system_admin === true ||
user.isSystemAdmin === true;



const {id} =
await params;



let result;



if(isSystemAdmin){



result =
await pool.query(

`
DELETE FROM taxes

WHERE id=$1

RETURNING *

`,

[
id
]

);



}

else{



// Tenant admin can delete only own tenant tax relation


const check =
await pool.query(

`
SELECT id

FROM tenant_tax

WHERE tax_id=$1

AND tenant_id=$2

`,

[
id,
user.tenantId
]

);



if(check.rows.length===0){


return NextResponse.json(

{
message:"Tax not found or forbidden"
},

{
status:403
}

);

}



// remove tenant assignment

await pool.query(

`
DELETE FROM tenant_tax

WHERE tax_id=$1

AND tenant_id=$2

`,

[
id,
user.tenantId
]

);




// check if any other tenant uses this tax

const remaining =
await pool.query(

`
SELECT id

FROM tenant_tax

WHERE tax_id=$1

`,

[
id
]

);




// if no tenant uses it anymore,
// delete the tax itself

if(remaining.rows.length===0){


result =
await pool.query(

`
DELETE FROM taxes

WHERE id=$1

RETURNING *

`,

[
id
]

);


}
else{


result={
rows:[
{
id:id
}
]
};


}



}




if(result.rows.length===0){


return NextResponse.json(

{
message:"Tax not found"
},

{
status:404
}

);


}




return NextResponse.json(

{
message:"Tax deleted successfully"
}

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