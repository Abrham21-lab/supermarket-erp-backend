import {NextResponse} from "next/server";
import fs from "fs";


export async function POST(req){


const formData =
await req.formData();


const file =
formData.get("file");


const bytes =
await file.arrayBuffer();


const buffer =
Buffer.from(bytes);



const path =
`public/uploads/${file.name}`;



fs.writeFileSync(
path,
buffer
);



return NextResponse.json({

url:`/uploads/${file.name}`

});


}