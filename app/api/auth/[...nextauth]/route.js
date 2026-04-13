import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        usename: {},
        password: {},
      },

      async authorize(credentials) {
        await connectDB();

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
        token.role = user.role;
        token.employeeName = user.employeeName;
        token.orgId = user.orgId;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.sub;
      session.user.role = token.role;
      session.user.employeeName = token.employeeName;
      session.user.orgId = token.orgId;
      return session;
    },
  },

  pages: {
    signIn: "/",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
