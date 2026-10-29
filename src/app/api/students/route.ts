import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, requireInstitutionScope, AuthError } from "@/lib/auth/guards";
import { logAudit } from "@/services/audit.service";
import { Student } from "@/models/Student";
import { User } from "@/models/User";
import { maskApaarId, normalizeApaarId } from "@/lib/utils/apaar";
import { createStudentSchema } from "@/validators/student";
import { hashPassword } from "@/lib/auth/password";

/**
 * GET /api/students
 * Scoped to institution for admins/faculty. Super Admin sees all.
 * APAAR IDs are masked in the response.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");
    const departmentId = searchParams.get("departmentId");

    const filter: Record<string, unknown> = {};

    // Tenant scoping
    if (session.role !== "SUPER_ADMIN" && session.institutionId) {
      filter.institutionId = session.institutionId;
    }

    if (departmentId) filter.departmentId = departmentId;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { registerNumber: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate("departmentId", "name code")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter),
    ]);

    // Mask APAAR IDs in response
    const maskedStudents = students.map((s) => ({
      ...s,
      apaarId: s.apaarId ? maskApaarId(s.apaarId) : undefined,
    }));

    return apiSuccess(
      { students: maskedStudents },
      { page, limit, total, totalPages: Math.ceil(total / limit) }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/students error:", error);
    return apiError("Failed to fetch students", "INTERNAL_ERROR", 500);
  }
}

/**
 * POST /api/students
 * Create a single student with automatic duplicate collision handling.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const body = await request.json();
    const parsed = createStudentSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }

    const data = parsed.data;

    // Scope check
    if (session.role !== "SUPER_ADMIN") {
      await requireInstitutionScope(data.institutionId);
    }

    // Check duplicate register number in institution
    const existingReg = await Student.findOne({
      institutionId: data.institutionId,
      registerNumber: data.registerNumber,
    });
    if (existingReg) {
      return apiError(
        `Student with register number "${data.registerNumber}" already exists`,
        "CONFLICT",
        409
      );
    }

    // Check duplicate APAAR ID
    if (data.apaarId) {
      const normalized = normalizeApaarId(data.apaarId);
      if (normalized) {
        const existingApaar = await Student.findOne({ apaarId: normalized });
        if (existingApaar) {
          return apiError("APAAR ID already registered", "CONFLICT", 409);
        }
      }
    }

    // Create user account
    const passwordHash = await hashPassword("Demo@12345");
    const user = await User.create({
      name: data.fullName,
      email: data.email.toLowerCase(),
      passwordHash,
      role: "STUDENT",
      institutionId: data.institutionId,
      departmentId: data.departmentId,
      isActive: true,
    });

    // Create student record
    const student = await Student.create({
      userId: user._id,
      institutionId: data.institutionId,
      departmentId: data.departmentId,
      registerNumber: data.registerNumber,
      apaarId: data.apaarId ? normalizeApaarId(data.apaarId) : undefined,
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      admissionYear: data.admissionYear,
      currentSemester: data.currentSemester,
      academicStatus: data.academicStatus || "ACTIVE",
    });

    await logAudit({
      session,
      action: "STUDENT_CREATED",
      entityType: "Student",
      entityId: student._id.toString(),
      institutionId: data.institutionId,
      summary: `Created student "${student.fullName}" (${student.registerNumber})`,
      request,
    });

    return apiSuccess(
      { ...student.toObject(), apaarId: student.apaarId ? maskApaarId(student.apaarId) : undefined },
      undefined,
      201
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("POST /api/students error:", error);
    return apiError("Failed to create student", "INTERNAL_ERROR", 500);
  }
}
