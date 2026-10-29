import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { previewCsvImport } from "@/services/student.service";

/**
 * POST /api/students/import/preview
 * Parses CSV without writing to the database. Returns row-level validation
 * errors and a preview of valid rows.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const body = await request.json();
    const { csvContent, institutionId } = body as { csvContent: string; institutionId: string };

    if (!csvContent || !institutionId) {
      return apiError("CSV content and institution ID are required", "VALIDATION_ERROR", 400);
    }

    const result = await previewCsvImport(csvContent, institutionId);

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("POST /api/students/import/preview error:", error);
    return apiError("Failed to preview CSV import", "INTERNAL_ERROR", 500);
  }
}
