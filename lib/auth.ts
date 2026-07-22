import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { rateLimit, rateLimitKey } from "@/lib/rateLimit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        await connectDB();

        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!username || !password) {
          return null;
        }

        const rl = rateLimit(rateLimitKey(username, "login"), 10, 60_000);
        if (!rl.allowed) {
          return null;
        }

        const user = await User.findOne({ username }).select("+password");

        if (!user) {
          return null;
        }

        if (user.status !== "Active") {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.employeeName ?? user.username,
          username: user.username,
          employeeName: user.employeeName,
          role: user.role,
          orgId: user.orgId?.toString(),
          modules: Array.isArray(user.modules)
            ? (user.modules as unknown as string[]).map((m: string) => String(m))
            : [],
          isFirstLogin: user.isFirstLogin,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.employeeName = user.employeeName;
        token.orgId = user.orgId;
        token.modules = Array.isArray(user.modules)
          ? (user.modules as unknown as string[]).map((m: string) => String(m))
          : [];
        token.isFirstLogin = user.isFirstLogin;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.employeeName = token.employeeName as string;
        session.user.orgId = token.orgId as string;
        session.user.modules = token.modules || [];
        session.user.isFirstLogin = token.isFirstLogin;
      }
      return session;
    },
  },

  pages: {
    signIn: "/",
  },

  secret: process.env.AUTH_SECRET,
});
