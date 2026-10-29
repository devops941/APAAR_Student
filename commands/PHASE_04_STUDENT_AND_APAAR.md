# Phase 4: Student Registration & APAAR ID Management

## 🎯 1. Phase Objective & Overview
Phase 4 implements the Student Identity and APAAR Management Module:
1. **Student Master Profile**: Captures student demographic details, department, roll/register number, admission year, and sensitive **APAAR ID** (Automated Permanent Academic Account Registry).
2. **Privacy & Masking Guarantee**: APAAR ID is sensitive personal data. By default, it is masked everywhere as `XXXXXXXX1234` (revealing only the last 4 digits). It is never exposed in bulk exports, analytics, or public URLs.
3. **Dual Uniqueness Indexes**:
   - Unique Register Number **per institution**: `{ institutionId: 1, registerNumber: 1 }`.
   - Unique Partial Index on APAAR ID across the entire system: `{ apaarId: 1 }` (only when provided).
4. **CSV Batch Import Engine**: Allows Institution Admins to onboard hundreds of students at once with a two-step dry-run preview and safe partial commit.

---

## 🏛️ 2. Mongoose Schema: `Student` (`src/models/Student.ts`)

```typescript
import mongoose, { Schema, Document, Model } from "mongoose";

export type AcademicStatus = "ACTIVE" | "GRADUATED" | "TRANSFERRED" | "WITHDRAWN";

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  institutionId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  registerNumber: string; // Institution roll/registration number
  apaarId?: string;       // 12-digit sensitive numeric string
  fullName: string;
  dateOfBirth: Date;
  gender: "MALE" | "FEMALE" | "OTHER";
  admissionYear: number;
  currentSemester: number;
  academicStatus: AcademicStatus;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    registerNumber: { type: String, required: true, trim: true },
    apaarId: {
      type: String,
      trim: true,
      default: undefined,
    },
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"], required: true },
    admissionYear: { type: Number, required: true, min: 2000, max: 2100 },
    currentSemester: { type: Number, required: true, min: 1, max: 16 },
    academicStatus: {
      type: String,
      enum: ["ACTIVE", "GRADUATED", "TRANSFERRED", "WITHDRAWN"],
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true }
);

// 1. Partial Unique Index: APAAR ID must be globally unique only when provided
StudentSchema.index(
  { apaarId: 1 },
  {
    unique: true,
    partialFilterExpression: { apaarId: { $type: "string" } },
  }
);

// 2. Composite Unique Index: Register Number unique within the institution
StudentSchema.index(
  { institutionId: 1, registerNumber: 1 },
  { unique: true }
);

export const Student: Model<IStudent> =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);
```

---

## 🔒 3. APAAR Utilities: Normalization & Masking (`src/lib/utils/apaar.ts`)

```typescript
export function normalizeApaarId(input?: string): string | undefined {
  if (!input) return undefined;
  const cleaned = input.replace(/[\s-]/g, "").trim();
  if (!/^\d{12}$/.test(cleaned)) {
    throw new Error("Invalid APAAR ID format. Must be a 12-digit number.");
  }
  return cleaned;
}

export function maskApaarId(apaarId?: string): string {
  if (!apaarId || apaarId.length < 4) return "—";
  return `XXXXXXXX${apaarId.slice(-4)}`;
}
```

---

## 📥 4. Batch CSV Import Engine (`src/services/student-import.service.ts`)

### 4.1 Required CSV Columns:
`registerNumber`, `fullName`, `email`, `departmentCode`, `admissionYear`, `currentSemester`, `gender`, `dateOfBirth`, `apaarId`

### 4.2 Two-Stage Processing Workflow:
1. **Stage 1: Validation & Preview (`POST /api/students/import/preview`)**:
   - Parses CSV without writing to the database.
   - Validates each row with Zod schema.
   - Detects in-file duplicates (duplicate `registerNumber` or `apaarId` within the CSV).
   - Queries DB for existing conflicts under the same `institutionId`.
   - Returns a structured preview:
     ```json
     {
       "validRowCount": 48,
       "invalidRowCount": 2,
       "errors": [
         { "row": 14, "column": "apaarId", "error": "Duplicate APAAR ID already registered" },
         { "row": 27, "column": "currentSemester", "error": "Must be between 1 and 16" }
       ]
     }
     ```
2. **Stage 2: Safe Batch Commit (`POST /api/students/import/commit`)**:
   - Creates the associated `User` record for each student (default password with forced change flag).
   - Inserts `Student` documents inside a MongoDB session transaction where supported.

---

## 📡 5. Route Handlers & API Contract

### 5.1 `GET /api/students`
- **Scope**: Scoped to `session.institutionId` for Institution Admin & Faculty. Super Admin can view all.
- **Query Params**: `?page=1&limit=20&departmentId=...&search=...`
- **Response**: Returns list of students with `apaarId` **masked** as `XXXXXXXX1234`.

### 5.2 `POST /api/students`
- Creates a single student with validation and automatic duplicate collision handling.

### 5.3 `GET /api/students/search?apaarId=...`
- **Permissions**: `VERIFICATION_OFFICER` and authorized admins only.
- Returns verified educational history for the requested APAAR ID. Rate-limited to prevent automated scraping.

---

## 🎨 6. UI Implementation: Student Management

1. **Student Directory Page (`/students`)**:
   - Search box with instant filter by Register Number or Name.
   - Department filter pills.
   - Data Table showing Register No, Full Name, Department, Semester, Status, and **Masked APAAR ID**.
   - "Import CSV" and "Add Student" primary buttons.
2. **CSV Import Modal**:
   - Drag-and-drop CSV file dropzone.
   - Download sample CSV template link.
   - Live validation report with red highlighted error rows.
   - "Commit 48 Valid Students" confirmation CTA.

---

## ⚡ 7. Verification & Terminal Commands

```powershell
# 1. Install CSV parsing library
npm install papaparse
npm install -D @types/papaparse

# 2. Test APAAR validation with a sample script
# Registering a student with duplicate 12-digit APAAR returns 409 Conflict
```

---

## ✅ 8. Definition of Done
1. Duplicate APAAR ID returns a descriptive `409 CONFLICT` without leaking unmasked sensitive data.
2. Duplicate Register Number in the same institution is rejected; same Register Number in another institution is permitted.
3. CSV preview surfaces exact row-level syntax and conflict errors.
4. Student list view strictly renders masked `XXXXXXXX1234` APAAR IDs.
