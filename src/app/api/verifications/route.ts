import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireRole, AuthError } from "@/lib/auth/guards";
import { VerificationRequest } from "@/models/VerificationRequest";
import { Student } from "@/models/Student";
import { maskApaarId } from "@/lib/utils/apaar";

/**
 * GET /api/verifications?status=&targetType=
 * VERIFICATION_OFFICER and SUPER_ADMIN only.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["VERIFICATION_OFFICER", "SUPER_ADMIN"]);
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const targetType = searchParams.get("targetType");
    const institutionId = searchParams.get("institutionId");

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (targetType) filter.targetType = targetType;
    if (institutionId) filter.institutionId = institutionId;

    const requests = await VerificationRequest.find(filter)
      .populate("studentId", "fullName registerNumber apaarId")
      .sort({ createdAt: -1 })
      .lean();

    // Mask APAAR IDs
    const maskedRequests = requests.map((r) => ({
      ...r,
      studentId: r.studentId
        ? {
            ...(r.studentId as unknown as Record<string, unknown>),
            apaarId: (r.studentId as unknown as { apaarId?: string }).apaarId
              ? maskApaarId((r.studentId as unknown as { apaarId?: string }).apaarId)
              : undefined,
          }
        : r.studentId,
    }));

    return apiSuccess({ requests: maskedRequests });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/verifications error:", error);
    return apiError("Failed to fetch verification requests", "INTERNAL_ERROR", 500);
  }
}
