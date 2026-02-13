import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config for middleware (no Prisma, no bcrypt).
 * Used by middleware.ts. Full config with adapter and providers is in lib/auth.ts.
 */
export const authConfig = {
  providers: [], // required by type; real providers are in lib/auth.ts
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  callbacks: {
    jwt({ token }) {
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).phone = (token as any).phone ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
