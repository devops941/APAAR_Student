import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { Student } from "@/models/Student";
import { Institution } from "@/models/Institution";
import { maskApaarId } from "@/lib/utils/apaar";

/**
 * GET /api/student/profile
 * Resolves student from session.userId (never from URL params).
 * Returns sanitized profile with masked APAAR ID.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const student = await Student.findOne({ userId: session.userId })
      .populate("institutionId", "name code")
      .populate("departmentId", "name code")
      .lean();

    if (!student) {
      return apiError("Student profile not found", "NOT_FOUND", 404);
    }

    return apiSuccess({
      ...student,
      apaarId: student.apaarId ? maskApaarId(student.apaarId) : undefined,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/student/profile error:", error);
    return apiError("Failed to fetch student profile", "INTERNAL_ERROR", 500);
  }
}
