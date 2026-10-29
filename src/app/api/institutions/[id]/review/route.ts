import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireRole, AuthError } from "@/lib/auth/guards";
import { logAudit } from "@/services/audit.service";
import { Institution, type InstitutionStatus } from "@/models/Institution";
import { reviewInstitutionSchema } from "@/validators/institution";
import { isValidInstitutionTransition } from "@/services/institution.service";

/**
 * POST /api/institutions/[id]/review
 * SUPER_ADMIN only — transitions institution status via the state machine.
 * Records reviewer ID, remarks, and timestamp. Emits an audit log entry.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireRole(["SUPER_ADMIN"]);
    await connectToDatabase();

    const body = await request.json();
    const parsed = reviewInstitutionSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        parsed.error.flatten()
      );
    }

    const institution = await Institution.findById(id);
    if (!institution) {
      return apiError("Institution not found", "NOT_FOUND", 404);
    }

    // The review action implies the institution is currently UNDER_REVIEW
    const currentStatus: InstitutionStatus = institution.status;
    if (currentStatus !== "UNDER_REVIEW") {
      return apiError(
        `Institution must be UNDER_REVIEW to review (current: ${currentStatus})`,
        "INVALID_STATE",
        400
      );
    }

    if (!isValidInstitutionTransition(currentStatus, parsed.data.status)) {
      return apiError(
        `Invalid transition from ${currentStatus} to ${parsed.data.status}`,
        "INVALID_TRANSITION",
        400
      );
    }

    institution.status = parsed.data.status;
    institution.reviewerId = session.userId as never;
    institution.reviewRemarks = parsed.data.remarks;
    institution.reviewedAt = new Date();
    await institution.save();

    await logAudit({
      session,
      action:
        parsed.data.status === "VERIFIED"
          ? "INSTITUTION_VERIFIED"
          : "INSTITUTION_REJECTED",
      entityType: "Institution",
      entityId: institution._id.toString(),
      institutionId: institution._id.toString(),
      summary: `Institution "${institution.name}" marked as ${parsed.data.status}: ${parsed.data.remarks}`,
      request,
    });

    return apiSuccess({ institution });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("POST /api/institutions/[id]/review error:", error);
    return apiError("Failed to review institution", "INTERNAL_ERROR", 500);
  }
}
