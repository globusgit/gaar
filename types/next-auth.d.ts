// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    role: string;
    designation: string;
    employeeName: string;
    orgId: string;
    isFirstLogin?: boolean;
    modules?: string[];
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: string;
      designation: string;
      employeeName: string;
      orgId: string;
      isFirstLogin?: boolean;
      modules?: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: string;
    designation: string;
    employeeName: string;
    orgId: string;
    isFirstLogin?: boolean;
    modules?: string[];
  }
}
