import { NextResponse } from "next/server";
import pool from "../../../../lib/db";
import { verifyRequestToken, requireRole } from "@/lib/auth";
import { unitSchema } from "../../../../lib/validations/unitValidation";
import { validate } from "../../../../lib/validations/validate";






// GET SINGLE UNIT
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

FROM units

WHERE id=$1

`,

[id]

);



if(result.rows.length === 0){

return NextResponse.json(

{
message:"Unit not found"
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









// UPDATE UNIT
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




const data = validate(

unitSchema,

body

);



if(data instanceof Response){

return data;

}





const {

name,

symbol

}=data;






const result = await pool.query(

`
UPDATE units

SET

name=$1,

symbol=$2

WHERE id=$3

RETURNING *

`,

[

name,

symbol,

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











// DELETE UNIT
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

"DELETE FROM units WHERE id=$1",

[id]

);




return NextResponse.json(

{
message:"Unit deleted successfully"
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