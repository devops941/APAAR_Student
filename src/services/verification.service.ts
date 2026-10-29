import { VerificationRequest } from "@/models/VerificationRequest";
import { VerificationEvent } from "@/models/VerificationEvent";
import { AcademicRecord } from "@/models/AcademicRecord";
import { DocumentModel } from "@/models/Document";

/**
 * Process a verification decision with segregation of duties enforcement.
 *
 * The submitter (Faculty/Admin) cannot act as the verifier on their own
 * submission — this is the "anti-self-approval" rule.
 */
export async function processVerificationDecision(params: {
  requestId: string;
  officerUserId: string;
  decision: "VERIFIED" | "REJECTED" | "CORRECTION_REQUIRED";
  remarks: string;
}) {
  const req = await VerificationRequest.findOne({ requestId: params.requestId });
  if (!req) throw new Error("Verification request not found");

  // Segregation of Duties: submitter cannot approve their own submission
  if (req.submittedBy.toString() === params.officerUserId.toString()) {
    throw new Error("Conflict of Interest: You cannot review a record you submitted yourself.");
  }

  if (req.status === "VERIFIED") {
    throw new Error("This request has already been verified and is locked.");
  }

  const previousStatus = req.status;
  req.status = params.decision;
  req.decisionRemarks = params.remarks;
  req.assignedOfficerId = params.officerUserId as never;
  req.decidedAt = new Date();
  await req.save();

  // Cascade to the underlying target record
  if (req.targetType === "ACADEMIC_RECORD") {
    await AcademicRecord.findByIdAndUpdate(req.targetId, {
      status: params.decision,
      verifiedAt: params.decision === "VERIFIED" ? new Date() : undefined,
    });
  } else if (req.targetType === "DOCUMENT") {
    await DocumentModel.findByIdAndUpdate(req.targetId, {
      status: params.decision,
      verifiedBy: params.officerUserId,
      verificationRemarks: params.remarks,
    });
  }

  // Record immutable audit event
  await VerificationEvent.create({
    requestId: req._id,
    actorId: params.officerUserId as never,
    action: "STATUS_CHANGE",
    fromStatus: previousStatus,
    toStatus: params.decision,
    remarks: params.remarks,
    occurredAt: new Date(),
  });

  return req;
}
