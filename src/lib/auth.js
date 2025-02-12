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
        token.name = user.name; // Tambahkan name ke token
        token.email = user.email;
        token.role = user.role;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.name = token.name; // Tambahkan name ke session
      session.user.email = token.email;
      session.user.role = token.role;
      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/login",
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
