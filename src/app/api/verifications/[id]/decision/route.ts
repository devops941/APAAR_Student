import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireRole, AuthError } from "@/lib/auth/guards";
import { logAudit } from "@/services/audit.service";
import { processVerificationDecision } from "@/services/verification.service";
import { z } from "zod";

const decisionSchema = z.object({
  decision: z.enum(["VERIFIED", "REJECTED", "CORRECTION_REQUIRED"]),
  remarks: z.string().min(8, "Mandatory remarks explaining decision (min 8 characters)"),
});

/**
 * POST /api/verifications/[id]/decision
 * VERIFICATION_OFFICER or SUPER_ADMIN only.
 * Enforces segregation of duties (submitter cannot self-approve).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireRole(["VERIFICATION_OFFICER", "SUPER_ADMIN"]);
    await connectToDatabase();

    const body = await request.json();
    const parsed = decisionSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }

    const req = await processVerificationDecision({
      requestId: id,
      officerUserId: session.userId,
      decision: parsed.data.decision,
      remarks: parsed.data.remarks,
    });

    await logAudit({
      session,
      action: "ACADEMIC_RECORD_VERIFIED",
      entityType: "VerificationRequest",
      entityId: req._id.toString(),
      institutionId: req.institutionId.toString(),
      summary: `Verification decision: ${parsed.data.decision} — ${parsed.data.remarks.substring(0, 80)}`,
      request,
    });

    return apiSuccess({ request: req });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    if (error instanceof Error) {
      // Check for segregation-of-duties conflict
      if (error.message.includes("Conflict of Interest")) {
        return apiError(error.message, "FORBIDDEN", 403);
      }
      return apiError(error.message, "BAD_REQUEST", 400);
    }
    console.error("POST /api/verifications/[id]/decision error:", error);
    return apiError("Failed to process verification decision", "INTERNAL_ERROR", 500);
  }
}
