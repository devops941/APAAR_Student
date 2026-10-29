import { AuditLog, type AuditAction } from "@/models/AuditLog";
import type { SessionPayload } from "@/lib/auth/session";

/**
 * Create an immutable audit log entry.
 * Never logs passwords, tokens, or raw document contents.
 */
export async function logAudit(params: {
  session: SessionPayload;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  institutionId?: string;
  summary?: string;
  request?: Request;
}) {
  const { session, action, entityType, entityId, institutionId, summary, request } =
    params;

  await AuditLog.create({
    actorId: session.userId,
    actorEmail: session.email,
    actorRole: session.role,
    action,
    entityType,
    entityId: entityId,
    institutionId: institutionId ?? session.institutionId,
    ipAddress: request?.headers.get("x-forwarded-for") || undefined,
    userAgent: request?.headers.get("user-agent") || undefined,
    safeChangesSummary: summary,
    occurredAt: new Date(),
  });
}
