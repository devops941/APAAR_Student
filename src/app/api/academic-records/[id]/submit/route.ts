import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, requireInstitutionScope, AuthError } from "@/lib/auth/guards";
import { logAudit } from "@/services/audit.service";
import { AcademicRecord } from "@/models/AcademicRecord";
import { VerificationRequest } from "@/models/VerificationRequest";

/**
 * POST /api/academic-records/[id]/submit
 * Transitions record from DRAFT to SUBMITTED and spawns a VerificationRequest.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();
    await connectToDatabase();

    const record = await AcademicRecord.findById(id);
    if (!record) {
      return apiError("Academic record not found", "NOT_FOUND", 404);
    }

    // Scope check
    if (session.role !== "SUPER_ADMIN") {
      await requireInstitutionScope(record.institutionId.toString());
    }

    if (record.status !== "DRAFT") {
      return apiError(
        `Cannot submit record in ${record.status} status (must be DRAFT)`,
        "INVALID_STATE",
        400
      );
    }

    record.status = "SUBMITTED";
    record.submittedBy = session.userId as never;
    record.submittedAt = new Date();
    await record.save();

    // Generate sequential request ID
    const count = await VerificationRequest.countDocuments();
    const requestId = `VR-2026-${String(count + 1).padStart(4, "0")}`;

    // Create verification request
    await VerificationRequest.create({
      requestId,
      studentId: record.studentId,
      institutionId: record.institutionId,
      targetType: "ACADEMIC_RECORD",
      targetId: record._id,
      submittedBy: session.userId,
      status: "PENDING",
    });

    await logAudit({
      session,
      action: "ACADEMIC_RECORD_SUBMITTED",
      entityType: "AcademicRecord",
      entityId: record._id.toString(),
      institutionId: record.institutionId.toString(),
      summary: `Submitted semester ${record.semester} record for verification (VR: ${requestId})`,
      request,
    });

    return apiSuccess({ record, verificationRequestId: requestId });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("POST /api/academic-records/[id]/submit error:", error);
    return apiError("Failed to submit academic record", "INTERNAL_ERROR", 500);
  }
}
