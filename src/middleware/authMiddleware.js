// File: middleware/authMiddleware.js
import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/jwt";

export function authMiddleware(req) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }
  req.user = decoded;
  return NextResponse.next();
}
