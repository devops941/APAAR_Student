# Phase 8: Student Self-Service Portal

## 🎯 1. Phase Objective & Overview
Phase 8 delivers the student-facing experience:
1. **Student Privacy & Isolation**: A logged-in student can **only** query and view their own personal records (`student.userId === session.userId`). Cross-student access is strictly blocked at the API layer.
2. **Interactive APAAR ID Card**:
   - Masked by default (`XXXXXXXX1234`).
   - Includes a secure "Click to Reveal" action that unlocks full 12 digits for a temporary duration (e.g. 10 seconds) and creates an audit entry.
3. **Academic Results Timeline**: Displays chronological semester progression, showing verified credits, grades, SGPA, and cumulative CGPA.
4. **Document Vault**: Provides access to institutional verified certificates, marksheets, and bonafide letters.
5. **Data Sharing & Consent**: Shows an auditable log of any external third-party or prospective employer verification requests.

---

## 🏛️ 2. Consent Record Mongoose Schema (`src/models/ConsentRecord.ts`)

```typescript
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConsentRecord extends Document {
  studentId: mongoose.Types.ObjectId;
  requesterName: string; // e.g. "TCS Campus Hiring Verification Team"
  purpose: string;       // e.g. "Pre-employment academic credential check"
  requestedFields: string[]; // e.g. ["DEGREE", "FINAL_CGPA"]
  state: "ACTIVE" | "REVOKED" | "EXPIRED";
  expiresAt: Date;
  createdAt: Date;
}

const ConsentRecordSchema = new Schema<IConsentRecord>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    requesterName: { type: String, required: true },
    purpose: { type: String, required: true },
    requestedFields: [{ type: String }],
    state: { type: String, enum: ["ACTIVE", "REVOKED", "EXPIRED"], default: "ACTIVE" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const ConsentRecord: Model<IConsentRecord> =
  mongoose.models.ConsentRecord ||
  mongoose.model<IConsentRecord>("ConsentRecord", ConsentRecordSchema);
```

---

## 📡 3. Route Handlers & Security Scoping

All endpoints in this module must resolve `studentId` exclusively from `session.userId`, never from URL parameters.

### 3.1 `GET /api/student/profile`
- Resolves student document linked to `session.userId`.
- Returns sanitized profile, institution details, and **masked APAAR ID**.

### 3.2 `POST /api/student/reveal-apaar`
- Verifies active student session.
- Emits an `APAAR_REVEALED` event in the audit trail.
- Returns unmasked 12-digit APAAR ID exclusively for transient client rendering.

### 3.3 `GET /api/student/academic-records`
- Returns array of semester records sorted by `semester: 1`.
- Hides administrative/internal reviewer notes; displays student-permitted remarks only.

### 3.4 `GET /api/student/documents`
- Returns verified and pending documents with secure streaming download links.

---

## 🎨 4. UI: Student Portal Screen Specification

1. **Digital Student Identity Card**:
   - Deep Teal gradient card surface with AICTE and Institution insignia.
   - Student Full Name, Register Number, Department, and Admission Year.
   - **APAAR ID Section**:
     - Default: `•••• •••• 9012` with lock icon.
     - "Reveal" toggle button. Upon click, displays `1234 5678 9012` with a 10-second countdown bar before automatically returning to masked state.
2. **Semester Progression Timeline**:
   - Stepper: `Sem 1 (8.4 SGPA)` ➔ `Sem 2 (8.6 SGPA)` ➔ `Sem 3 (8.9 SGPA)`.
   - Expandable semester cards showing subject breakdown table (Code, Title, Grade, Credits).
   - Verification status pill: `Verified` (Green), `In Review` (Amber), `Correction Requested` (Blue).
3. **Document Vault**:
   - Grid cards for available verified downloads: Marksheets, Bonafide, Provisional Degree.
4. **Third-Party Consent History**:
   - Table showing who queried the record, purpose, date, and revocation toggle.

---

## ⚡ 5. Verification & Security Rules

```powershell
# 1. Test student route with student session
# Verify 200 OK with masked APAAR

# 2. Attempting to query another student's ID directly:
# GET /api/students/[other_student_id] -> Must return 403 FORBIDDEN
```

---

## ✅ 6. Definition of Done
1. Student cannot access any other student's profile or academic data under any circumstance.
2. APAAR ID is masked on initial page load.
3. Revealing APAAR ID logs a permanent audit entry with timestamp and IP address.
4. Portal is responsive across mobile, tablet, and desktop viewports.
