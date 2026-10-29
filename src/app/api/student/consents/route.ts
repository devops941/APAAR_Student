import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { ConsentRecord } from "@/models/ConsentRecord";
import { Student } from "@/models/Student";

/**
 * GET /api/student/consents
 * Returns consent/sharing history for the logged-in student.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const student = await Student.findOne({ userId: session.userId });
    if (!student) {
      return apiError("Student profile not found", "NOT_FOUND", 404);
    }

    const consents = await ConsentRecord.find({ studentId: student._id })
      .sort({ createdAt: -1 })
      .lean();

    return apiSuccess({ consents });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/student/consents error:", error);
    return apiError("Failed to fetch consent records", "INTERNAL_ERROR", 500);
  }
}

/**
 * POST /api/student/consents/revoke
 * Revoke an active consent record.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const body = await request.json();
    const { consentId } = body;

    const student = await Student.findOne({ userId: session.userId });
    if (!student) {
      return apiError("Student profile not found", "NOT_FOUND", 404);
    }

    const consent = await ConsentRecord.findOne({ _id: consentId, studentId: student._id });
    if (!consent) {
      return apiError("Consent record not found", "NOT_FOUND", 404);
    }

    consent.state = "REVOKED";
    await consent.save();

    return apiSuccess({ consent });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("POST /api/student/consents error:", error);
    return apiError("Failed to revoke consent", "INTERNAL_ERROR", 500);
  }
}
