import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { audit, AUDIT_ACTIONS } from "@/lib/audit";

// ---------------------------------------------------------------------------
// Auth.js (NextAuth v4) credentials provider + bcrypt (PRD §7/§45).
// Identity is ALWAYS derived from the session on the server — clients never
// supply userId/role (PRD §67).
// ---------------------------------------------------------------------------

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24h
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        if (user.verificationStatus === "SUSPENDED") {
          throw new Error("Your account has been suspended. Contact an administrator.");
        }

        await audit(
          prisma,
          AUDIT_ACTIONS.USER_LOGIN,
          "User",
          user.id,
          user.id,
          { role: user.role }
        );

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          verificationStatus: user.verificationStatus,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: string }).role;
        token.verificationStatus = (
          user as { verificationStatus: string }
        ).verificationStatus;
      }
      // Refresh verification status on demand (e.g. after admin verification).
      if (trigger === "update" && session?.verificationStatus) {
        token.verificationStatus = session.verificationStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.verificationStatus = token.verificationStatus as string;
      }
      return session;
    },
  },
};
