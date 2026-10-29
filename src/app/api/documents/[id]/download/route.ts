import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { logAudit } from "@/services/audit.service";
import { DocumentModel } from "@/models/Document";
import { Student } from "@/models/Student";
import { getFileBuffer } from "@/services/storage.service";

/**
 * GET /api/documents/[id]/download
 * Streams the file with proper Content-Type and Content-Disposition.
 * Strict RBAC: owner student, institution admin, verification officer, or super admin.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();
    await connectToDatabase();

    const document = await DocumentModel.findById(id);
    if (!document) {
      return apiError("Document not found", "NOT_FOUND", 404);
    }

    // RBAC check
    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const isVerificationOfficer = session.role === "VERIFICATION_OFFICER";
    const isInstitutionAdmin =
      session.role === "INSTITUTION_ADMIN" &&
      session.institutionId === document.institutionId.toString();
    const isFaculty =
      session.role === "FACULTY" &&
      session.institutionId === document.institutionId.toString();

    // For students, verify they own the document
    let isOwner = false;
    if (session.role === "STUDENT") {
      const student = await Student.findOne({
        userId: session.userId,
        _id: document.studentId,
      });
      isOwner = !!student;
    }

    if (!isSuperAdmin && !isVerificationOfficer && !isInstitutionAdmin && !isFaculty && !isOwner) {
      return apiError("You do not have permission to download this document", "FORBIDDEN", 403);
    }

    const buffer = await getFileBuffer(document.storageKey, document.storageProvider);

    await logAudit({
      session,
      action: "DOCUMENT_DOWNLOADED",
      entityType: "Document",
      entityId: document._id.toString(),
      institutionId: document.institutionId.toString(),
      summary: `Downloaded "${document.title}"`,
      request,
    });

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(document.originalFileName)}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/documents/[id]/download error:", error);
    return apiError("Failed to download document", "INTERNAL_ERROR", 500);
  }
}
