import jwt from "jsonwebtoken";


export function verifyRequestToken(req) {

  const authHeader = req.headers.get("authorization");


  if (!authHeader) {

    throw new Error("No token provided");

  }


  const parts = authHeader.split(" ");


  if (parts.length !== 2 || parts[0] !== "Bearer") {

    throw new Error("Invalid authorization format");

  }


  const token = parts[1];


  return jwt.verify(
    token,
    process.env.JWT_SECRET
  );

}



export function requireRole(user, roles) {

  if (!user || !user.role) {
    throw new Error("User role not found in token");
  }

  const userRole = user.role.toLowerCase();

  const allowedRoles = roles.map(
    role => role.toLowerCase()
  );

  if (!allowedRoles.includes(userRole)) {
    throw new Error("Forbidden");
  }

}