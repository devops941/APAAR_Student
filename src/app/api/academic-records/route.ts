import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, requireInstitutionScope, AuthError } from "@/lib/auth/guards";
import { logAudit } from "@/services/audit.service";
import { AcademicRecord } from "@/models/AcademicRecord";
import { createAcademicRecordSchema } from "@/validators/academic";
import { calculateGradePoint, computeSgpa } from "@/lib/utils/grading";

/**
 * GET /api/academic-records?studentId=&semester=
 * Returns records scoped to student or institution.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const semester = searchParams.get("semester");

    const filter: Record<string, unknown> = {};
    if (studentId) filter.studentId = studentId;
    if (semester) filter.semester = parseInt(semester);

    // Tenant scoping for non-super-admins
    if (session.role !== "SUPER_ADMIN" && session.institutionId) {
      filter.institutionId = session.institutionId;
    }

    const records = await AcademicRecord.find(filter)
      .sort({ semester: 1, version: -1 })
      .lean();

    return apiSuccess({ records });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/academic-records error:", error);
    return apiError("Failed to fetch academic records", "INTERNAL_ERROR", 500);
  }
}

/**
 * POST /api/academic-records
 * Creates a draft marksheet. Auto-computes grade points and SGPA server-side.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const body = await request.json();
    const parsed = createAcademicRecordSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }

    const data = parsed.data;

    // Scope check
    if (session.role !== "SUPER_ADMIN") {
      await requireInstitutionScope(data.institutionId);
    }

    // Compute grades and SGPA server-side (never trust client calculations)
    const subjectsWithGrades = data.subjects.map((s) => {
      const percentage = (s.marksObtained / s.maxMarks) * 100;
      const { grade, gradePoint, result } = calculateGradePoint(percentage);
      return {
        subjectId: new mongoose.Types.ObjectId(s.subjectId),
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        credits: s.credits,
        marksObtained: s.marksObtained,
        maxMarks: s.maxMarks,
        grade,
        gradePoint,
        result,
      };
    });

    const { totalCredits, sgpa } = computeSgpa(subjectsWithGrades);

    // Check for existing draft for this semester
    const existing = await AcademicRecord.findOne({
      studentId: data.studentId,
      semester: data.semester,
      status: "DRAFT",
    });

    if (existing) {
      // Update existing draft
      existing.subjects = subjectsWithGrades;
      existing.totalCredits = totalCredits;
      existing.sgpa = sgpa;
      existing.academicYear = data.academicYear;
      await existing.save();

      await logAudit({
        session,
        action: "ACADEMIC_RECORD_SUBMITTED",
        entityType: "AcademicRecord",
        entityId: existing._id.toString(),
        institutionId: data.institutionId,
        summary: `Updated draft record for semester ${data.semester} (SGPA: ${sgpa})`,
        request,
      });

      return apiSuccess({ record: existing });
    }

    // Create new draft
    const record = await AcademicRecord.create({
      studentId: data.studentId,
      institutionId: data.institutionId,
      academicYear: data.academicYear,
      semester: data.semester,
      subjects: subjectsWithGrades,
      totalCredits,
      sgpa,
      status: "DRAFT",
      version: 1,
    });

    await logAudit({
      session,
      action: "ACADEMIC_RECORD_SUBMITTED",
      entityType: "AcademicRecord",
      entityId: record._id.toString(),
      institutionId: data.institutionId,
      summary: `Created draft record for semester ${data.semester} (SGPA: ${sgpa})`,
      request,
    });

    return apiSuccess({ record }, undefined, 201);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("POST /api/academic-records error:", error);
    return apiError("Failed to create academic record", "INTERNAL_ERROR", 500);
  }
}
