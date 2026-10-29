import { NextResponse } from "next/server";

/* ───────────────────────────────────────────────
   Standardized API Response Envelopes
   All Route Handlers must wrap responses using these helpers
   to maintain a consistent contract across the platform.
   ─────────────────────────────────────────────── */

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
}

/**
 * Build a success response envelope.
 *
 * @example
 *   return apiSuccess({ name: "Arun" });
 *   return apiSuccess(users, { page: 1, limit: 20, total: 48 }, 200);
 */
export function apiSuccess<T>(
  data: T,
  meta?: ApiSuccessResponse<T>["meta"],
  status = 200
) {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
  return NextResponse.json(body, { status });
}

/**
 * Build an error response envelope with a unique requestId for tracing.
 *
 * @example
 *   return apiError("Invalid email or password", "UNAUTHENTICATED", 401);
 */
export function apiError(
  message: string,
  code = "BAD_REQUEST",
  status = 400,
  details?: unknown
) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const body: ApiErrorResponse = {
    success: false,
    error: { code, message, details },
    requestId,
  };
  return NextResponse.json(body, { status });
}

/**
 * Convenience wrappers for common HTTP status codes.
 */
export function apiBadRequest(message: string, details?: unknown) {
  return apiError(message, "BAD_REQUEST", 400, details);
}

export function apiUnauthorized(message = "Authentication required") {
  return apiError(message, "UNAUTHENTICATED", 401);
}

export function apiForbidden(message = "Access denied") {
  return apiError(message, "FORBIDDEN", 403);
}

export function apiNotFound(message = "Resource not found") {
  return apiError(message, "NOT_FOUND", 404);
}

export function apiConflict(message: string, details?: unknown) {
  return apiError(message, "CONFLICT", 409, details);
}
