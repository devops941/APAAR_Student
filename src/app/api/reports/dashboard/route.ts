import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, AuthError } from "@/lib/auth/guards";
import { Student } from "@/models/Student";
import { Institution } from "@/models/Institution";
import { VerificationRequest } from "@/models/VerificationRequest";
import { AcademicRecord } from "@/models/AcademicRecord";

/**
 * GET /api/reports/dashboard
 * Returns role-scoped KPIs and chart aggregates.
 * SUPER_ADMIN sees global metrics; others see their institution's data.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    await connectToDatabase();

    const filter: Record<string, unknown> = {};
    if (session.role !== "SUPER_ADMIN" && session.institutionId) {
      filter.institutionId = session.institutionId;
    }

    const [totalStudents, apaarRecorded, pendingReviews, verifiedRecords, totalInstitutions, rejectedRecords, correctionRecords, underReviewRecords] =
      await Promise.all([
        Student.countDocuments(filter),
        Student.countDocuments({ ...filter, apaarId: { $exists: true, $ne: null, $nin: [""] } }),
        VerificationRequest.countDocuments({ ...filter, status: "PENDING" }),
        VerificationRequest.countDocuments({ ...filter, status: "VERIFIED" }),
        session.role === "SUPER_ADMIN" ? Institution.countDocuments({}) : 0,
        VerificationRequest.countDocuments({ ...filter, status: "REJECTED" }),
        VerificationRequest.countDocuments({ ...filter, status: "CORRECTION_REQUIRED" }),
        VerificationRequest.countDocuments({ ...filter, status: "UNDER_REVIEW" }),
      ]);

    const apaarCoveragePct =
      totalStudents > 0 ? Number(((apaarRecorded / totalStudents) * 100).toFixed(1)) : 0;

    // Verification status distribution for donut chart
    const verificationBreakdown = [
      { name: "Verified", value: verifiedRecords, color: "#15803d" },
      { name: "Pending", value: pendingReviews, color: "#64748b" },
      { name: "Under Review", value: underReviewRecords, color: "#b45309" },
      { name: "Correction Required", value: correctionRecords, color: "#2563eb" },
      { name: "Rejected", value: rejectedRecords, color: "#b42318" },
    ].filter((d) => d.value > 0);

    // Department-wise APAAR adoption for bar chart
    const departmentStats = await Student.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$departmentId",
          total: { $sum: 1 },
          withApaar: { $sum: { $cond: [{ $ifNull: ["$apaarId", false] }, 1, 0] } },
        },
      },
      { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "dept" } },
      { $unwind: { path: "$dept", preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ["$dept.name", "Unassigned"] }, total: 1, withApaar: 1 } },
    ]);

    return apiSuccess({
      kpis: {
        totalStudents,
        apaarRecorded,
        apaarCoveragePct,
        pendingReviews,
        verifiedRecords,
        totalInstitutions,
        rejectedRecords,
      },
      charts: {
        verificationBreakdown,
        departmentStats,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.status);
    }
    console.error("GET /api/reports/dashboard error:", error);
    return apiError("Failed to fetch dashboard data", "INTERNAL_ERROR", 500);
  }
}
