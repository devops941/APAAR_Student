import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Edge proxy for route protection (Next.js 16 successor to middleware).
 *
 * - Public routes (login, API auth endpoints) are always allowed.
 * - Protected portal routes require a valid session JWT cookie.
 * - Unauthenticated browser requests redirect to /login.
 * - Unauthenticated API requests return 401 JSON.
 */

const PUBLIC_ROUTES = ["/login", "/api/auth/login", "/api/auth/logout", "/api/health"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname);
}

async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "fallback_secret"
  );
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("apaar_session_token")?.value;
  const isValid = await verifySession(token);

  if (!isValid) {
    // API routes return 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHENTICATED",
            message: "Authentication required to access this resource",
          },
          requestId: `mw_${Date.now()}`,
        },
        { status: 401 }
      );
    }
    // Browser requests redirect to login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
