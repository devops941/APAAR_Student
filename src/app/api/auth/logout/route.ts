import { apiSuccess } from "@/lib/api-response";
import { clearSessionCookie } from "@/lib/auth/session";

/**
 * POST /api/auth/logout
 * Clears the session cookie and returns a success message.
 */
export async function POST() {
  try {
    await clearSessionCookie();
    return apiSuccess(
      { message: "Logged out successfully" },
      undefined,
      200
    );
  } catch (error) {
    console.error("Logout error:", error);
    return apiSuccess(
      { message: "Logged out successfully" },
      undefined,
      200
    );
  }
}
