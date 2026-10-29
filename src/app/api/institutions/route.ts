import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, requireRole, AuthError } from "@/lib/auth/guards";
import { logAudit } from "@/services/audit.service";
import { Institution } from "@/models/Institution";
import { createInstitutionSchema } from "@/validators/institution";
import { User } from "@/models/User";
import type { InstitutionStatus } from "@/models/Institution";

/**
 * GET /api/institutions
 * - SUPER_ADMIN: All institutions with filters (?status=&state=&search=&page=&limit=)
 * - INSTITUTION_ADMIN: Only their own institution
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") as InstitutionStatus | null;
    const state = searchParams.get("state");
    const search = searchParams.get("search");

    const filter: Record<string, unknown> = {};

    // Tenant scoping
    if (session.role !== "SUPER_ADMIN") {
      if (!session.institutionId) {
        return apiSuccess({ institutions: [], meta: { total: 0 } });
      }
      filter._id = session.institutionId;
    }

    if (status) filter.status = status;
    if (state) filter["address.state"] = state;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [institutions, total] = await Promise.all([
      Institution.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Institution.countDocuments(filter),
    ]);

    return apiSuccess(
      { institutions },
      { page, limit, total, totalPages: Math.ceil(total / limit) }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/institutions error:", error);
    return apiError("Failed to fetch institutions", "INTERNAL_ERROR", 500);
  }
}

/**
 * POST /api/institutions
 * SUPER_ADMIN only — creates a new institution in DRAFT status.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(["SUPER_ADMIN"]);
    await connectToDatabase();

    const body = await request.json();
    const parsed = createInstitutionSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        parsed.error.flatten()
      );
    }

    // Check for duplicate code
    const existing = await Institution.findOne({ code: parsed.data.code.toUpperCase() });
    if (existing) {
      return apiError(
        `Institution with code "${parsed.data.code}" already exists`,
        "CONFLICT",
        409
      );
    }

    const institution = await Institution.create({
      ...parsed.data,
      code: parsed.data.code.toUpperCase(),
      status: "DRAFT",
    });

    await logAudit({
      session,
      action: "INSTITUTION_CREATED",
      entityType: "Institution",
      entityId: institution._id.toString(),
      institutionId: institution._id.toString(),
      summary: `Created institution "${institution.name}" (${institution.code})`,
      request,
    });

    return apiSuccess(institution, undefined, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("POST /api/institutions error:", error);
    return apiError("Failed to create institution", "INTERNAL_ERROR", 500);
  }
}
