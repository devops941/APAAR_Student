import type { InstitutionStatus } from "@/models/Institution";

/**
 * Allowed state transitions for the institution approval state machine.
 * Prevents illegal jumps (e.g. DRAFT directly to VERIFIED).
 */
const ALLOWED_TRANSITIONS: Record<InstitutionStatus, InstitutionStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW", "DRAFT"],
  UNDER_REVIEW: ["VERIFIED", "REJECTED", "CORRECTION_REQUIRED"],
  CORRECTION_REQUIRED: ["SUBMITTED"],
  REJECTED: ["DRAFT"],
  VERIFIED: ["UNDER_REVIEW"], // Re-audit flow only
};

export function isValidInstitutionTransition(
  current: InstitutionStatus,
  target: InstitutionStatus
): boolean {
  return ALLOWED_TRANSITIONS[current]?.includes(target) ?? false;
}

export { ALLOWED_TRANSITIONS };
