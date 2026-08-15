import { NextResponse } from "next/server";

import pool from "../../../lib/db";

import {
verifyRequestToken,
requireRole
}
from "@/lib/auth";





// GET ALL SETTINGS

export async function GET(req){


try{


verifyRequestToken(req);



const result = await pool.query(

`
SELECT

setting_key,

setting_value,

category

FROM settings

ORDER BY id ASC

`

);





const settings={};



result.rows.forEach(item=>{


if(!settings[item.category]){


settings[item.category]={};


}



settings[item.category][item.setting_key]
=
item.setting_value;



});





return NextResponse.json(settings);



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











// UPDATE SETTINGS

export async function PUT(req){



try{



const user =
verifyRequestToken(req);



requireRole(

user,

[

"admin",

"superAdmin"

]

);





const contentType =
req.headers.get("content-type");


let body;



if(contentType.includes("multipart/form-data")){


const formData =
await req.formData();


body={};



for(const [key,value] of formData.entries()){


body[key]=value;


}



}else{


body =
await req.json();


}





const {

category,

settings

}=body;





for(const key of Object.keys(settings)){



await pool.query(

`

INSERT INTO settings

(

setting_key,

setting_value,

category

)

VALUES($1,$2,$3)



ON CONFLICT(setting_key)

DO UPDATE SET


setting_value=$2,

category=$3,

updated_at=NOW()


`,

[

key,

String(settings[key]),

category

]


);



}





return NextResponse.json({

message:"Settings updated successfully"

});






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