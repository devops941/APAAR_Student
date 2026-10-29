# Phase 5: Catalog & Academic Records Management

## 🎯 1. Phase Objective & Overview
Phase 5 implements the Academic Catalog and Semester Grade Records Engine:
1. **Academic Catalog**: Hierarchical master data:
   `Institution` ➔ `Department` ➔ `Course / Program` ➔ `Subject / Coursework`.
2. **Semester Marksheet Structure**: Captures subject-wise marks, grades, credits, pass/fail status, and computed SGPA/CGPA.
3. **Immutable Versioning Rule**:
   - Once an academic record reaches `VERIFIED` status, it is locked.
   - Any approved modification creates a **new version** (`version: 2`), preserving the original verified record in historical audit state.
4. **Submission Workflow**:
   Faculty creates marksheet (`DRAFT`) ➔ Validates credits ➔ Submits for verification (`SUBMITTED`).

---

## 🏛️ 2. Mongoose Schemas

### 2.1 Catalog Models (`src/models/Catalog.ts`)
```typescript
import mongoose, { Schema, Document, Model } from "mongoose";

// Department
export interface IDepartment extends Document {
  institutionId: mongoose.Types.ObjectId;
  name: string;
  code: string; // e.g. "CSE", "ECE", "MECH"
  hodName?: string;
}
const DepartmentSchema = new Schema<IDepartment>({
  institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true, uppercase: true },
  hodName: { type: String },
});
DepartmentSchema.index({ institutionId: 1, code: 1 }, { unique: true });

// Course
export interface ICourse extends Document {
  institutionId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  title: string; // e.g. "B.Tech Computer Science & Engineering"
  code: string;  // e.g. "BTECH-CSE"
  durationYears: number;
  totalSemesters: number;
}
const CourseSchema = new Schema<ICourse>({
  institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
  title: { type: String, required: true },
  code: { type: String, required: true, uppercase: true },
  durationYears: { type: Number, default: 4 },
  totalSemesters: { type: Number, default: 8 },
});
CourseSchema.index({ institutionId: 1, code: 1 }, { unique: true });

// Subject
export interface ISubject extends Document {
  courseId: mongoose.Types.ObjectId;
  semester: number;
  code: string; // e.g. "CS8501"
  name: string; // e.g. "Theory of Computation"
  credits: number;
}
const SubjectSchema = new Schema<ISubject>({
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
  semester: { type: Number, required: true, min: 1, max: 16 },
  code: { type: String, required: true, uppercase: true },
  name: { type: String, required: true },
  credits: { type: Number, required: true, min: 1, max: 10 },
});
SubjectSchema.index({ courseId: 1, semester: 1, code: 1 }, { unique: true });

export const Department = mongoose.models.Department || mongoose.model<IDepartment>("Department", DepartmentSchema);
export const Course = mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);
export const Subject = mongoose.models.Subject || mongoose.model<ISubject>("Subject", SubjectSchema);
```

### 2.2 Academic Record Model (`src/models/AcademicRecord.ts`)
```typescript
import mongoose, { Schema, Document, Model } from "mongoose";

export type RecordStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "CORRECTION_REQUIRED";

export interface ISubjectResult {
  subjectId: mongoose.Types.ObjectId;
  subjectCode: string;
  subjectName: string;
  credits: number;
  marksObtained: number;
  maxMarks: number;
  grade: string;   // e.g., "O", "A+", "A", "B+", "B", "RA"
  gradePoint: number;
  result: "PASS" | "FAIL";
}

export interface IAcademicRecord extends Document {
  studentId: mongoose.Types.ObjectId;
  institutionId: mongoose.Types.ObjectId;
  academicYear: string; // e.g. "2025-2026"
  semester: number;     // e.g. 6
  subjects: ISubjectResult[];
  totalCredits: number;
  sgpa: number;
  status: RecordStatus;
  version: number;
  submittedBy?: mongoose.Types.ObjectId;
  submittedAt?: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AcademicRecordSchema = new Schema<IAcademicRecord>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    academicYear: { type: String, required: true },
    semester: { type: Number, required: true, min: 1, max: 16 },
    subjects: [
      {
        subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
        subjectCode: { type: String, required: true },
        subjectName: { type: String, required: true },
        credits: { type: Number, required: true },
        marksObtained: { type: Number, required: true },
        maxMarks: { type: Number, default: 100 },
        grade: { type: String, required: true },
        gradePoint: { type: Number, required: true },
        result: { type: String, enum: ["PASS", "FAIL"], required: true },
      },
    ],
    totalCredits: { type: Number, required: true },
    sgpa: { type: Number, required: true },
    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "VERIFIED", "REJECTED", "CORRECTION_REQUIRED"],
      default: "DRAFT",
      index: true,
    },
    version: { type: Number, default: 1 },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User" },
    submittedAt: { type: Date },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

// Index to track version history cleanly per semester
AcademicRecordSchema.index(
  { studentId: 1, academicYear: 1, semester: 1, version: 1 },
  { unique: true }
);

export const AcademicRecord: Model<IAcademicRecord> =
  mongoose.models.AcademicRecord ||
  mongoose.model<IAcademicRecord>("AcademicRecord", AcademicRecordSchema);
```

---

## 🧮 3. Grade & SGPA Calculation Utility (`src/lib/utils/grading.ts`)

```typescript
export interface SubjectGradeInput {
  credits: number;
  marksObtained: number;
  maxMarks?: number;
}

export function calculateGradePoint(percentage: number): { grade: string; gradePoint: number; result: "PASS" | "FAIL" } {
  if (percentage >= 91) return { grade: "O", gradePoint: 10, result: "PASS" };
  if (percentage >= 81) return { grade: "A+", gradePoint: 9, result: "PASS" };
  if (percentage >= 71) return { grade: "A", gradePoint: 8, result: "PASS" };
  if (percentage >= 61) return { grade: "B+", gradePoint: 7, result: "PASS" };
  if (percentage >= 50) return { grade: "B", gradePoint: 6, result: "PASS" };
  return { grade: "RA", gradePoint: 0, result: "FAIL" };
}

export function computeSgpa(subjects: { credits: number; gradePoint: number }[]): { totalCredits: number; sgpa: number } {
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
  if (totalCredits === 0) return { totalCredits: 0, sgpa: 0 };

  const totalPoints = subjects.reduce((sum, s) => sum + s.credits * s.gradePoint, 0);
  const sgpa = Number((totalPoints / totalCredits).toFixed(2));

  return { totalCredits, sgpa };
}
```

---

## 📡 4. Route Handlers

### 4.1 `GET /api/academic-records`
- Returns records scoped to student or institution.
- Query filters: `?studentId=...&semester=...`

### 4.2 `POST /api/academic-records`
- Creates draft marksheet. Auto-computes grade points and SGPA server-side.

### 4.3 `POST /api/academic-records/[id]/submit`
- Transitions record from `DRAFT` to `SUBMITTED`.
- Spawns a corresponding `VerificationRequest` record (covered in Phase 7).

---

## 🎨 5. UI: Marksheet Editor Screen (`/academic-records/new`)
- Header: Student Info Card (Register No, Name, Program, Semester).
- Dynamic Subject Table:
  - Subject Code & Name
  - Credits (auto-filled from catalog)
  - Marks Obtained (0-100)
  - Auto-calculated Grade badge & Points
- Summary Footer: Total Credits Registered, Computed SGPA badge.
- Action Buttons: "Save as Draft", "Submit for Verification" (with modal warning).

---

## ✅ 6. Definition of Done
1. SGPA and total credits calculate reliably using weighted credit formula.
2. Verified records reject direct mutation with `403 FORBIDDEN: Record is locked`.
3. Correction requests create `version + 1` record without overwriting past history.
4. Submitting a marksheet changes status to `SUBMITTED` and links the submitter's user ID.
