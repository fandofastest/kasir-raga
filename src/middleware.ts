import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signin",
  },
  callbacks: {
    authorized: ({ req, token }) => {
      // Izinkan akses ke /api/upload tanpa login
      if (req.nextUrl.pathname.startsWith("/api")) {
        return true;
      }
      return !!token; // Auth untuk endpoint lain
    },
  },
});

// Proteksi halaman tertentu
export const config = {
  matcher: ["/:path*"],
};
