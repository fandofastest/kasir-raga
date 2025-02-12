// File: middleware/withAuth.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function withAuth(handler, requiredRole = null) {
  return async (req) => {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (requiredRole && decoded.role !== requiredRole) {
        return NextResponse.json(
          { error: "Forbidden: Insufficient privileges" },
          { status: 403 },
        );
      }

      req.user = decoded;
      return handler(req);
    } catch (error) {
      return NextResponse.json({ error: "Invalid Token" }, { status: 403 });
    }
  };
}
