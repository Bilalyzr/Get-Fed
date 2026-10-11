import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Protected routes (PRD §7): role-based access control at the edge.
// /provider/** → PROVIDER; /recipient/** → RECIPIENT; /admin/** → ADMIN.
// ---------------------------------------------------------------------------

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role as string | undefined;
    const path = req.nextUrl.pathname;

    const home =
      role === "PROVIDER"
        ? "/provider/dashboard"
        : role === "ADMIN"
        ? "/admin"
        : "/recipient/dashboard";

    // If authenticated and visiting login or register, redirect to dashboard
    if (token && (path === "/login" || path === "/register")) {
      return NextResponse.redirect(new URL(home, req.url));
    }

    if (!role) return NextResponse.next();

    const mismatch =
      (path.startsWith("/provider") && role !== "PROVIDER" && role !== "ADMIN") ||
      (path.startsWith("/recipient") && role !== "RECIPIENT" && role !== "ADMIN") ||
      (path.startsWith("/admin") && role !== "ADMIN");

    if (mismatch) {
      return NextResponse.redirect(new URL(home, req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path === "/login" || path === "/register") {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/provider/:path*",
    "/recipient/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};
