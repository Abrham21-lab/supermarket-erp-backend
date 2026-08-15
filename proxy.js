import { NextResponse } from "next/server";
import { verifyToken } from "./lib/jwt";


export function proxy(req) {


  const authHeader = req.headers.get("authorization");


  if (!authHeader) {

    return NextResponse.json(
      {
        message: "Unauthorized - token missing"
      },
      {
        status: 401
      }
    );

  }


  const token = authHeader.split(" ")[1];


  if (!token) {

    return NextResponse.json(
      {
        message:"Invalid authorization format"
      },
      {
        status:401
      }
    );

  }



  try {


    verifyToken(token);


    return NextResponse.next();



  } catch(error){


    return NextResponse.json(
      {
        message:"Invalid token"
      },
      {
        status:401
      }
    );


  }

}



export const config = {

 matcher:[

  "/api/users/:path*",
  "/api/roles/:path*",
  "/api/tenants/:path*",
  "/api/branches/:path*",
  "/api/suppliers/:path*",
  "/api/units/:path*",
  "/api/payment-methods/:path*",
  "/api/products/:path*",
  "/api/inventory/:path*",
  "/api/product-stock/:path*",
  "/api/inventory-transfers/:path*"

 ]

};