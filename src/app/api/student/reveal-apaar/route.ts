import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { logAudit } from "@/services/audit.service";
import { Student } from "@/models/Student";
import { normalizeApaarId } from "@/lib/utils/apaar";

/**
 * POST /api/student/reveal-apaar
 * Verifies active student session, emits an APAAR_REVEALED audit event,
 * and returns the unmasked 12-digit APAAR ID for transient display.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const student = await Student.findOne({ userId: session.userId });
    if (!student) {
      return apiError("Student profile not found", "NOT_FOUND", 404);
    }

    if (!student.apaarId) {
      return apiError("No APAAR ID assigned to this student", "NOT_FOUND", 404);
    }

    const unmasked = normalizeApaarId(student.apaarId) || "";

    await logAudit({
      session,
      action: "APAAR_REVEALED",
      entityType: "Student",
      entityId: student._id.toString(),
      institutionId: student.institutionId.toString(),
      summary: "APAAR ID revealed by student",
      request,
    });

    return apiSuccess({ apaarId: unmasked });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("POST /api/student/reveal-apaar error:", error);
    return apiError("Failed to reveal APAAR ID", "INTERNAL_ERROR", 500);
  }
}
