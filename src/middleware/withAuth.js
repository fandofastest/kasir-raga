// File: middleware/withAuth.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function withAuth(
  handler,
  { requiredRole = null, requiredPermissions = [] } = {},
) {
  return async (req) => {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Jika requiredRole diberikan, cek role (superadmin bypass role check)
      if (requiredRole && decoded.role !== requiredRole) {
        if (decoded.role !== "superadmin") {
          return NextResponse.json(
            { error: "Forbidden: Insufficient privileges" },
            { status: 403 },
          );
        }
      }

      // Jika requiredPermissions ada, cek apakah user memiliki semua permission yang diperlukan.
      // Superadmin memiliki akses penuh.
      if (requiredPermissions.length > 0 && decoded.role !== "superadmin") {
        if (!decoded.permissions || !Array.isArray(decoded.permissions)) {
          return NextResponse.json(
            { error: "Forbidden: Permissions not set" },
            { status: 403 },
          );
        }
        const hasPermissions = requiredPermissions.every((perm) =>
          decoded.permissions.includes(perm),
        );
        if (!hasPermissions) {
          return NextResponse.json(
            { error: "Forbidden: Insufficient permissions" },
            { status: 403 },
          );
        }
      }

      req.user = decoded;
      return handler(req);
    } catch (error) {
      return NextResponse.json({ error: "Invalid Token" }, { status: 403 });
    }
  };
}
