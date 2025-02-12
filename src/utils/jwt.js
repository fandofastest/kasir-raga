// File: utils/jwt.js
import jwt from "jsonwebtoken";
const SECRET_KEY = process.env.JWT_SECRET;

export function generateToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null;
  }
}
