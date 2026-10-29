# Phase 9: Dashboards, Analytics & Compliance Audit Trail

## 🎯 1. Phase Objective & Overview
Phase 9 delivers the executive reporting and security compliance infrastructure:
1. **Role-Scoped Dashboard Metrics**:
   - `SUPER_ADMIN`: Macro metrics across all institutions, system-wide APAAR adoption rate, verification bottlenecks, pending institution reviews.
   - `INSTITUTION_ADMIN`: College-level metrics, department breakdown, pending submissions, rejected records requiring action.
   - `FACULTY`: Departmental student progress and marks submission status.
2. **Precise Labeling Guarantee**:
   - Metrics must strictly be labeled **"APAAR ID Recorded"** rather than "Officially Authenticated", preserving ethical project boundaries.
3. **Interactive Visualizations**: High-performance charts using `recharts` (Status Distribution, Monthly Submissions, Department Comparison).
4. **Comprehensive Immutable Audit Trail**: Every sensitive mutation (logins, record submissions, verifications, APAAR reveals, CSV imports) is permanently logged in `AuditLog`.

---

## 🏛️ 2. Mongoose Schema: `AuditLog` (`src/models/AuditLog.ts`)

```typescript
import mongoose, { Schema, Document, Model } from "mongoose";

export type AuditAction =
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "INSTITUTION_CREATED"
  | "INSTITUTION_VERIFIED"
  | "STUDENT_CREATED"
  | "STUDENT_IMPORTED"
  | "APAAR_REVEALED"
  | "ACADEMIC_RECORD_SUBMITTED"
  | "ACADEMIC_RECORD_VERIFIED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_DOWNLOADED";

export interface IAuditLog extends Document {
  actorId: mongoose.Types.ObjectId;
  actorEmail: string;
  actorRole: string;
  action: AuditAction;
  entityType: string;       // e.g. "Student", "AcademicRecord", "Institution"
  entityId?: mongoose.Types.ObjectId;
  institutionId?: mongoose.Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  safeChangesSummary?: string; // Summary of what changed (no passwords or tokens)
  occurredAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorEmail: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId },
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    safeChangesSummary: { type: String },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

AuditLogSchema.index({ institutionId: 1, occurredAt: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
```

---

## 📊 3. Dashboard Aggregation Route (`/api/reports/dashboard`)

```typescript
import { requireAuth } from "@/lib/auth/guards";
import { Student } from "@/models/Student";
import { Institution } from "@/models/Institution";
import { VerificationRequest } from "@/models/VerificationRequest";
import { apiSuccess } from "@/lib/api-response";

export async function GET() {
  const session = await requireAuth();

  const filter: any = {};
  if (session.role !== "SUPER_ADMIN" && session.institutionId) {
    filter.institutionId = session.institutionId;
  }

  // Parallel aggregations for low latency
  const [totalStudents, apaarRecorded, pendingReviews, verifiedRecords] = await Promise.all([
    Student.countDocuments(filter),
    Student.countDocuments({ ...filter, apaarId: { $exists: true, $ne: null } }),
    VerificationRequest.countDocuments({ ...filter, status: "PENDING" }),
    VerificationRequest.countDocuments({ ...filter, status: "VERIFIED" }),
  ]);

  const apaarCoveragePct = totalStudents > 0 ? Number(((apaarRecorded / totalStudents) * 100).toFixed(1)) : 0;

  return apiSuccess({
    kpis: {
      totalStudents,
      apaarRecorded,
      apaarCoveragePct,
      pendingReviews,
      verifiedRecords,
    },
    // Chart aggregates...
  });
}
```

---

## 🎨 4. UI: Dashboard & Audit Trail Screens

### 4.1 Executive Dashboard (`/dashboard`)
1. **KPI Stat Cards**:
   - Total Enrolled Students (with % change).
   - **APAAR ID Recorded** (Coverage percentage progress bar).
   - Pending Verifications (with urgent alert badge).
   - Verified Credentials (successful seals count).
2. **Interactive Visual Charts (via Recharts)**:
   - Verification Status Breakdown (Donut chart: Verified, Pending, Correction, Rejected).
   - Monthly Verification Throughput (Area chart showing weekly submission trends).
   - Department-wise APAAR adoption (Bar chart).
3. **Recent Activity Feed**:
   - Quick table showing last 5 verified submissions and recent system events.

### 4.2 Audit Log Explorer (`/audit-logs`)
- Filter bar: Action dropdown, Actor search, Date range picker.
- Data table: Timestamp, Actor (Email & Role), Action Badge, Target Entity, Safe Details.
- "Export Audit Log (CSV)" button with role restriction.

---

## ⚡ 5. Terminal Commands & Dependencies

```powershell
# 1. Install Recharts for dashboard analytics
npm install recharts

# 2. Verify dashboard build passes
npm run build
```

---

## ✅ 6. Definition of Done
1. Dashboard KPIs reflect tenant scoping accurately (College Admin sees only their college stats).
2. Charts render smoothly with responsive containers on mobile and desktop.
3. Every sensitive action generates a corresponding record in `AuditLog`.
4. Audit logs strictly exclude passwords, session tokens, or raw document file contents.
