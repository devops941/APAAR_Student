import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { logAudit } from "@/services/audit.service";
import { DocumentModel } from "@/models/Document";
import { Student } from "@/models/Student";
import { saveFile, ALLOWED_MIME, MAX_FILE_SIZE } from "@/services/storage.service";
import { env } from "@/lib/env";

/**
 * GET /api/documents?studentId=
 * Returns documents scoped to student or institution.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    const filter: Record<string, unknown> = {};
    if (studentId) filter.studentId = studentId;

    // Tenant scoping
    if (session.role !== "SUPER_ADMIN" && session.institutionId) {
      filter.institutionId = session.institutionId;
    }

    const documents = await DocumentModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return apiSuccess({ documents });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/documents error:", error);
    return apiError("Failed to fetch documents", "INTERNAL_ERROR", 500);
  }
}

/**
 * POST /api/documents
 * Upload a document (multipart/form-data). Validates MIME type, size,
 * and computes SHA-256 hash before storing.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const studentId = formData.get("studentId") as string;
    const institutionId = formData.get("institutionId") as string;
    const documentType = formData.get("documentType") as string;
    const title = formData.get("title") as string;

    if (!file || !studentId || !documentType || !title) {
      return apiError("Missing required fields: file, studentId, documentType, title", "VALIDATION_ERROR", 400);
    }

    // Validate MIME type
    if (!ALLOWED_MIME.includes(file.type)) {
      return apiError(
        `File type "${file.type}" is not allowed. Permitted: PDF, PNG, JPEG.`,
        "INVALID_FILE_TYPE",
        400
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return apiError(
        `File exceeds maximum size of ${env.MAX_FILE_SIZE_MB}MB`,
        "FILE_TOO_LARGE",
        400
      );
    }

    // Verify student belongs to institution (tenant scoping)
    const student = await Student.findOne({ _id: studentId, institutionId }).lean();
    if (!student) {
      return apiError("Student not found in the specified institution", "NOT_FOUND", 404);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { storageKey, sha256Hash, provider } = await saveFile(buffer, file.name);

    const document = await DocumentModel.create({
      studentId,
      institutionId,
      documentType: documentType as never,
      title,
      originalFileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
      storageKey,
      storageProvider: provider,
      sha256Hash,
      status: "PENDING",
      uploadedBy: session.userId as never,
    });

    await logAudit({
      session,
      action: "DOCUMENT_UPLOADED",
      entityType: "Document",
      entityId: document._id.toString(),
      institutionId,
      summary: `Uploaded "${title}" (${file.name}, ${file.size} bytes, SHA-256: ${sha256Hash.substring(0, 16)}...)`,
      request,
    });

    return apiSuccess(
      {
        id: document._id,
        title: document.title,
        sha256Hash: document.sha256Hash,
        status: document.status,
        documentType: document.documentType,
      },
      undefined,
      201
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("POST /api/documents error:", error);
    return apiError("Failed to upload document", "INTERNAL_ERROR", 500);
  }
}
