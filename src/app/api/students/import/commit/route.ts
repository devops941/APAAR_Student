import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { logAudit } from "@/services/audit.service";
import { commitCsvImport } from "@/services/student.service";
import { Department } from "@/models/Catalog";
import type { CsvImportRow } from "@/validators/student";

/**
 * POST /api/students/import/commit
 * Commits validated CSV rows to the database. Creates User + Student records.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const body = await request.json();
    const { rows, institutionId } = body as { rows: CsvImportRow[]; institutionId: string };

    if (!rows?.length || !institutionId) {
      return apiError("Valid rows and institution ID are required", "VALIDATION_ERROR", 400);
    }

    // Build department code → ID map
    const departments = await Department.find({ institutionId }).select("code _id").lean();
    const deptMap: Record<string, string> = {};
    departments.forEach((d) => { deptMap[d.code] = d._id.toString(); });

    const result = await commitCsvImport(rows, institutionId, deptMap);

    await logAudit({
      session,
      action: "STUDENT_IMPORTED",
      entityType: "Student",
      institutionId,
      summary: `CSV import: ${result.created} students created, ${result.failed} failed`,
      request,
    });

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("POST /api/students/import/commit error:", error);
    return apiError("Failed to commit CSV import", "INTERNAL_ERROR", 500);
  }
}
