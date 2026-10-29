import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireRole, AuthError } from "@/lib/auth/guards";
import { AuditLog } from "@/models/AuditLog";

/**
 * GET /api/audit-logs?action=&page=&limit=
 * SUPER_ADMIN and INSTITUTION_ADMIN only.
 * Returns queryable audit trail with pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["SUPER_ADMIN", "INSTITUTION_ADMIN"]);
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const action = searchParams.get("action");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filter: Record<string, unknown> = {};

    // Tenant scoping
    if (session.role !== "SUPER_ADMIN" && session.institutionId) {
      filter.institutionId = session.institutionId;
    }

    if (action) filter.action = action;
    if (startDate || endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      filter.occurredAt = dateFilter;
    }

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ occurredAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    return apiSuccess({ logs }, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/audit-logs error:", error);
    return apiError("Failed to fetch audit logs", "INTERNAL_ERROR", 500);
  }
}
