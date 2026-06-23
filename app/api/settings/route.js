import { NextResponse } from "next/server";
import pool from "../../../lib/db";

import {
  verifyRequestToken,
  requireRole
} from "@/lib/auth";



// GET SETTINGS
// authenticated users

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


    const settings = {};


    result.rows.forEach(item => {

      settings[item.setting_key] = item.setting_value;

    });



    return NextResponse.json(settings);



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







// UPDATE SETTINGS
// admin + superAdmin only

export async function PUT(req){


try{


const user = verifyRequestToken(req);



requireRole(
 user,
 [
  "admin",
  "superAdmin"
 ]
);



const body = await req.json();



for(const key of Object.keys(body)){


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
updated_at=NOW()

`,

[
 key,
 String(body[key]),
 "general"
]

);


}



return NextResponse.json({

message:"Settings updated successfully"

});




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