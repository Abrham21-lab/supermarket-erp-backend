import { NextResponse } from "next/server";
import db from "@/lib/db";


// GET all revenue targets
export async function GET(){

try{


const result = await db.query(
`
SELECT *
FROM revenue_targets
ORDER BY year DESC, month DESC
`
);


return NextResponse.json(
{
data: result.rows
},
{
status:200
}
);


}catch(error){

console.log(error);


return NextResponse.json(
{
message:"Server error"
},
{
status:500
}
);


}

}



// CREATE / UPDATE revenue target

export async function POST(request){


try{


const body = await request.json();


const {
month,
year,
target_amount
}=body;



const existing = await db.query(
`
SELECT id
FROM revenue_targets
WHERE month=$1
AND year=$2
`,
[
month,
year
]
);



let result;



if(existing.rows.length > 0){


// update existing target

result = await db.query(
`
UPDATE revenue_targets
SET target_amount=$1,
updated_at=NOW()

WHERE month=$2
AND year=$3

RETURNING *
`,
[
target_amount,
month,
year
]
);



}else{


// create new target

result = await db.query(
`
INSERT INTO revenue_targets
(
month,
year,
target_amount
)

VALUES
($1,$2,$3)

RETURNING *
`,
[
month,
year,
target_amount
]
);


}



return NextResponse.json(
{
message:"Revenue target saved successfully",
data:result.rows[0]
},
{
status:201
}
);



}catch(error){


console.log(error);


return NextResponse.json(
{
message:"Failed to save revenue target"
},
{
status:500
}
);


}

}