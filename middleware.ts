import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware is Edge-only; NextAuth uses __dirname and fails on Edge.
 * Route protection for /account and /admin is done in those pages via useSession().
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
