import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        await connectDB();

        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const user = await User.findOne({
          username: credentials.username,
        }).lean();

        if (!user) throw new Error("User not found");

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isValid) throw new Error("Invalid password");

        return {
          id: user._id.toString(),
          username: user.username,
          employeeName: user.employeeName,
          role: user.role,
          orgId: user.orgId,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.employeeName = user.employeeName;
        token.orgId = user.orgId;
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
      }
      return session;
    },
  },

  pages: {
    signIn: "/",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
