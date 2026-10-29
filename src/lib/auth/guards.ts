import { getSession, type SessionPayload } from "./session";
import type { UserRole } from "@/models/User";

/**
 * Thrown when authentication or authorization fails.
 * Route handlers catch this and translate it into a structured API error.
 */
export class AuthError extends Error {
  status: number;
  code: string;
  constructor(
    message: string,
    code = "UNAUTHORIZED",
    status = 401
  ) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * Require an authenticated session. Throws AuthError(401) if no session.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new AuthError(
      "Authentication required to access this resource",
      "UNAUTHENTICATED",
      401
    );
  }
  return session;
}

/**
 * Require an authenticated session with one of the allowed roles.
 * Throws AuthError(403) if the role is not permitted.
 */
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new AuthError(
      `Access denied. Role ${session.role} is not permitted.`,
      "FORBIDDEN",
      403
    );
  }
  return session;
}

/**
 * Require that the authenticated user belongs to (or has access to)
 * the target institution. Super Admins bypass this check.
 * Throws AuthError(403) on cross-tenant access attempts.
 */
export async function requireInstitutionScope(
  targetInstitutionId: string
): Promise<SessionPayload> {
  const session = await requireAuth();

  // Super Admin has global bypass
  if (session.role === "SUPER_ADMIN") return session;

  if (
    !session.institutionId ||
    session.institutionId.toString() !== targetInstitutionId.toString()
  ) {
    throw new AuthError(
      "Access denied: You cannot access or modify records of another institution.",
      "CROSS_TENANT_FORBIDDEN",
      403
    );
  }

  return session;
}

/**
 * Translate an AuthError into a NextResponse via the api-error helper.
 * Re-throws unknown errors so the global error handler catches them.
 */
export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
    };
  }
  throw error;
}
