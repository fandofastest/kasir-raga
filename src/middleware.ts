// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse, NextRequest } from "next/server";

export default withAuth(
  // 1) FUNGSI MIDDLEWARE KUSTOM
  function middleware(req: NextRequest) {
    // Tangani preflight request (OPTIONS) agar tidak terblokir oleh CORS
    if (req.method === "OPTIONS") {
      const headers = new Headers({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      });
      return new Response(null, { status: 200, headers });
    }

    // Untuk request lain, buat NextResponse dan set header CORS
    const res = NextResponse.next();
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    return res;
  },

  // 2) KONFIGURASI NEXT-AUTH
  {
    pages: {
      signIn: "/auth/signin",
      signOut: "/auth/signout",
    },
    callbacks: {
      authorized: ({ req, token }) => {
        // Endpoint API bebas akses tanpa login
        if (req.nextUrl.pathname.startsWith("/api")) {
          return true;
        }
        // Halaman invoice dapat diakses publik
        if (req.nextUrl.pathname.startsWith("/invoice")) {
          return true;
        }
        // Endpoint lainnya memerlukan token
        return !!token;
      },
    },
  },
);

// 3) MATCHER UNTUK ROUTE YANG DIPROTEKSI & BUTUH CORS
export const config = {
  matcher: ["/:path*"],
};
