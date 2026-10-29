import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { AcademicRecord } from "@/models/AcademicRecord";
import { Student } from "@/models/Student";

/**
 * GET /api/student/academic-records
 * Returns the logged-in student's semester records sorted by semester.
 * Hides internal reviewer notes.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    // Resolve studentId exclusively from session.userId
    const student = await Student.findOne({ userId: session.userId });
    if (!student) {
      return apiError("Student profile not found", "NOT_FOUND", 404);
    }

    const records = await AcademicRecord.find({ studentId: student._id })
      .sort({ semester: 1, version: -1 })
      .lean();

    return apiSuccess({ records });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/student/academic-records error:", error);
    return apiError("Failed to fetch academic records", "INTERNAL_ERROR", 500);
  }
}
