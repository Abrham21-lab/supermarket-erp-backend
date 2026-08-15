import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";



export async function POST(req){


try{


const formData = await req.formData();


const file =
formData.get("file");



if(!file){


return NextResponse.json(

{
message:"No file selected"
},

{
status:400
}

);


}





const bytes =
await file.arrayBuffer();


const buffer =
Buffer.from(bytes);





const uploadDir =
path.join(

process.cwd(),

"public/uploads/company"

);





if(!fs.existsSync(uploadDir)){


fs.mkdirSync(

uploadDir,

{
recursive:true
}

);


}





const fileName =

Date.now()

+

"-"

+

file.name;



const filePath =

path.join(

uploadDir,

fileName

);





fs.writeFileSync(

filePath,

buffer

);





return NextResponse.json({

url:

`/uploads/company/${fileName}`


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