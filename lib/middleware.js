import { verifyToken } from "./jwt";


export function authenticate(req){

    const authHeader =
    req.headers.get("authorization");


    if(!authHeader){

        throw new Error("Unauthorized");

    }


    const token =
    authHeader.split(" ")[1];


    if(!token){

        throw new Error("Token missing");

    }


    return verifyToken(token);

}