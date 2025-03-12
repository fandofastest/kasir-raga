import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email", required: true },
        password: { label: "Password", type: "password", required: true },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(
            process.env.NEXT_PUBLIC_API_URL + "/auth/login",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(credentials),
            },
          );

          if (!res.ok) {
            throw new Error("Invalid email or password");
          }

          const data = await res.json();

          if (!data.token) {
            throw new Error("Token not received from API");
          }

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name, // Tambahkan name
            role: data.user.role,
            accessToken: data.token, // Simpan token
            permissions: data.user.permissions,
          };
        } catch (error) {
          console.error("Authorize error:", error);
          return null; // Jika return null, NextAuth akan memberi 401
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.permissions = user.permissions;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        role: token.role,
        permissions: token.permissions,
      };
      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
};

export const handler = NextAuth(authOptions);
export const auth = () =>
  import("next-auth").then(({ getServerSession }) =>
    getServerSession(authOptions),
  );
