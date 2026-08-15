import { NextResponse } from "next/server";
import db from "@/lib/db";


export async function GET(){

try{


// get current month target

const targetResult = await db.query(
`
SELECT *
FROM revenue_targets

WHERE month = $1
AND year = $2

LIMIT 1
`,
[
new Date().getMonth()+1,
new Date().getFullYear()
]
);



if(targetResult.rows.length === 0){

return NextResponse.json(
{
message:"No active target found"
},
{
status:404
}
);

}



const target = targetResult.rows[0];



// calculate achieved revenue

const salesResult = await db.query(
`
SELECT 
COALESCE(SUM(total_amount),0) AS achieved

FROM sales

WHERE EXTRACT(MONTH FROM created_at) = $1

AND EXTRACT(YEAR FROM created_at) = $2
`,
[
target.month,
target.year
]
);



const achieved = Number(
salesResult.rows[0].achieved
);



const percentage =
target.target_amount > 0
?
Math.round(
(achieved / Number(target.target_amount)) * 100
)
:
0;



return NextResponse.json(
{

target:
Number(target.target_amount),

achieved,

percentage

}
);



}catch(error){


console.log(
"Revenue Target Current Error:",
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