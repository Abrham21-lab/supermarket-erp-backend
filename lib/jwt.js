import jwt from "jsonwebtoken";


export function generateToken(payload) {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );
}


export function verifyToken(token) {
    try {
        return jwt.verify(
            token,
            process.env.JWT_SECRET
        );
    } catch (error) {
        return null;
    }
}