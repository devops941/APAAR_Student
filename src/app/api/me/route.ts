import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { SuperAdmin } from "@/models/SuperAdmin";
import { Institution } from "@/models/Institution";

/**
 * GET /api/me
 * Returns the sanitized profile of the currently authenticated user
 * (password hash excluded). Includes institution name if applicable.
 */
export async function GET() {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    let user = null;
    if (session.role === "SUPER_ADMIN") {
      user = await SuperAdmin.findById(session.userId).select("-passwordHash");
    }
    if (!user) {
      user = await User.findById(session.userId).select("-passwordHash");
    }

    if (!user) {
      return apiError("User not found", "NOT_FOUND", 404);
    }

    // Resolve institution name for context display
    let institutionName: string | undefined;
    if (user.institutionId) {
      const institution = await Institution.findById(user.institutionId).select("name");
      institutionName = institution?.name;
    }

    return apiSuccess({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
      institutionName,
      departmentId: user.departmentId,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/me error:", error);
    return apiError("Failed to fetch user profile", "INTERNAL_ERROR", 500);
  }
}
