import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import { verifyRequestToken, requireRole } from "@/lib/auth";
import { supplierSchema } from "../../../../lib/validations/supplierValidation";
import { validate } from "../../../../lib/validations/validate";





// GET SINGLE SUPPLIER
// authenticated users

export async function GET(
req,
{params}
){


try{


verifyRequestToken(req);



const { id } = await params;



const result = await pool.query(

`
SELECT *

FROM suppliers

WHERE id=$1

`,

[id]

);



if(result.rows.length === 0){

return NextResponse.json(

{
message:"Supplier not found"
},

{
status:404
}

);

}



return NextResponse.json(

result.rows[0]

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








// UPDATE SUPPLIER
// admin + superAdmin + manager

export async function PUT(
req,
{params}
){


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



const { id } = await params;



const body = await req.json();




// validation

const data = validate(

supplierSchema,

body

);



if(data instanceof Response){

return data;

}




const {

name,

contact_person,

phone,

email,

address,

status


}=data;





const result = await pool.query(

`
UPDATE suppliers

SET

name=$1,

contact_person=$2,

phone=$3,

email=$4,

address=$5,

status=$6

WHERE id=$7

RETURNING *

`,

[

name,

contact_person,

phone,

email,

address,

status,

id

]

);




return NextResponse.json(

result.rows[0]

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









// DELETE SUPPLIER
// admin + superAdmin + manager

export async function DELETE(
req,
{params}
){


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



const { id } = await params;




await pool.query(

"DELETE FROM suppliers WHERE id=$1",

[id]

);




return NextResponse.json(

{
message:"Supplier deleted successfully"
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