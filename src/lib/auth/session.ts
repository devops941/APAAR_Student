import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { UserRole } from "@/models/User";

const SECRET_KEY = new TextEncoder().encode(env.AUTH_SECRET);
const COOKIE_NAME = "apaar_session_token";

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  institutionId?: string;
  departmentId?: string;
}

/**
 * Create and set a signed JWT session cookie.
 * The cookie is HttpOnly (no JS access), SameSite=Lax, and Secure in production.
 */
export async function createSessionCookie(
  payload: SessionPayload
): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Read and verify the session cookie, returning the decoded payload or null.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Clear the session cookie (logout).
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME };
