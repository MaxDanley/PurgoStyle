import NextAuth from "next-auth";
import { NextResponse } from "next/server";

// Edge-safe config inline (no @/ imports — Prisma/bcrypt would break Edge)
const edgeAuthConfig = {
  providers: [],
  session: { strategy: "jwt" as const },
  pages: { signIn: "/auth/signin", signOut: "/auth/signout", error: "/auth/error" },
  callbacks: {
    jwt({ token }: any) {
      return token;
    },
    session({ session, token }: any) {
      if (session?.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).phone = token.phone ?? null;
      }
      return session;
    },
  },
};

const { auth } = NextAuth(edgeAuthConfig as any);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isProtectedRoute = 
    pathname.startsWith('/account') || 
    pathname.startsWith('/admin');

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

