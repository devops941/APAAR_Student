import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireInstitutionScope, requireAuth, AuthError } from "@/lib/auth/guards";
import { Institution } from "@/models/Institution";
import { isValidInstitutionTransition } from "@/services/institution.service";

/**
 * POST /api/institutions/[id]/submit
 * Institution Admin transitions their institution from DRAFT → SUBMITTED
 * (or CORRECTION_REQUIRED → SUBMITTED).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    // Only the institution's own admin (or super admin) can submit
    if (session.role !== "SUPER_ADMIN") {
      await requireInstitutionScope(id);
    }

    await connectToDatabase();
    const institution = await Institution.findById(id);

    if (!institution) {
      return apiError("Institution not found", "NOT_FOUND", 404);
    }

    if (!isValidInstitutionTransition(institution.status, "SUBMITTED")) {
      return apiError(
        `Cannot submit institution in ${institution.status} status`,
        "INVALID_STATE",
        400
      );
    }

    institution.status = "SUBMITTED";
    await institution.save();

    return apiSuccess({ institution });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("POST /api/institutions/[id]/submit error:", error);
    return apiError("Failed to submit institution", "INTERNAL_ERROR", 500);
  }
}
