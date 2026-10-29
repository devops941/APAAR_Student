import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { Department } from "@/models/Catalog";

/**
 * GET /api/departments?institutionId=
 * Returns departments for the institution (or all for super admin).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get("institutionId") || session.institutionId;

    const filter: Record<string, unknown> = {};
    if (institutionId) filter.institutionId = institutionId;

    const departments = await Department.find(filter).sort({ code: 1 }).lean();

    return apiSuccess({ departments });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/departments error:", error);
    return apiError("Failed to fetch departments", "INTERNAL_ERROR", 500);
  }
}
