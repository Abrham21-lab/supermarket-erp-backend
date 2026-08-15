import jwt from "jsonwebtoken";


/**
 * Verify JWT from request header
 * and normalize user object
 */
export function verifyRequestToken(req) {

  const authHeader =
    req.headers.get("authorization");


  if (!authHeader) {

    throw new Error(
      "No token provided"
    );

  }



  const parts =
    authHeader.split(" ");



  if (
    parts.length !== 2 ||
    parts[0] !== "Bearer"
  ) {

    throw new Error(
      "Invalid authorization format"
    );

  }



  const token = parts[1];



  const decoded =
    jwt.verify(
      token,
      process.env.JWT_SECRET
    );



  return {

    id:
    decoded.id,


    email:
    decoded.email,



    roles:
    decoded.roles || [],



    role:
    decoded.role ||
    decoded.roles?.[0] ||
    null,



    tenantId:
    decoded.tenantId ??
    decoded.tenant_id ??
    null,



    isSystemAdmin:
    decoded.isSystemAdmin === true ||
    decoded.is_system_admin === true

  };


}






/**
 * Role authorization
 */
export function requireRole(
  user,
  allowedRoles
){

  if(!user){

    throw new Error(
      "User context not found"
    );

  }

if(user.isSystemAdmin){
    return;
  }

  const normalizedAllowedRoles =
    allowedRoles.map(
      role =>
      role.toLowerCase()
    );



  let userRoles=[];



  if(
    Array.isArray(user.roles)
  ){

    userRoles =
      user.roles.map(
        role =>
        typeof role === "string"
        ?
        role.toLowerCase()
        :
        role.name?.toLowerCase()
      )
      .filter(Boolean);


  }
  else if(user.role){


    userRoles=[
      user.role.toLowerCase()
    ];


  }




  if(userRoles.length===0){

    throw new Error(
      "User role not found in token"
    );

  }




  const allowed =
    userRoles.some(
      role =>
      normalizedAllowedRoles.includes(role)
    );



  if(!allowed){

    throw new Error(
      "Forbidden"
    );

  }


}







/**
 * Tenant helper
 */
export function requireTenant(user){


  if(!user){

    throw new Error(
      "Unauthorized"
    );

  }



  if(user.isSystemAdmin){

    return null;

  }



  if(!user.tenantId){

    throw new Error(
      "Tenant not found in token"
    );

  }



  return user.tenantId;


}







export function isSystemAdmin(user){

  return (
    user?.isSystemAdmin === true
  );

}