# Phase 7: Verification Workflow Engine

## 🎯 1. Phase Objective & Overview
Phase 7 implements the core verification workflow at the heart of the AICTE specification:
1. **Auditable Review Queue**: Submitted academic records and documents automatically enter a centralized verification pipeline.
2. **Segregation of Duties (Separation of Powers)**:
   - A Faculty member or Institution Admin who submitted a record **cannot** act as the Verification Officer to approve it.
   - The officer must be an authorized, independent reviewer (`VERIFICATION_OFFICER` or `SUPER_ADMIN`).
3. **State Transition Machine**:
   - `PENDING` ➔ `UNDER_REVIEW` ➔ `VERIFIED` | `REJECTED` | `CORRECTION_REQUIRED`.
4. **Side-by-Side Evidence Inspection**: The officer UI provides a dual-pane screen displaying the submitted semester marks on the left and the scanned institutional marksheet on the right for swift comparison.
5. **Traceable Event Audit**: Every decision creates an immutable `VerificationEvent` recording officer ID, timestamp, decision, and mandatory remarks.

---

## 🏛️ 2. Mongoose Schemas

### 2.1 Verification Request Model (`src/models/VerificationRequest.ts`)
```typescript
import mongoose, { Schema, Document, Model } from "mongoose";

export type VerificationStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "CORRECTION_REQUIRED";

export type RecordTargetType = "ACADEMIC_RECORD" | "DOCUMENT";

export interface IVerificationRequest extends Document {
  requestId: string; // Formatted ID, e.g. "VR-2026-0001"
  studentId: mongoose.Types.ObjectId;
  institutionId: mongoose.Types.ObjectId;
  targetType: RecordTargetType;
  targetId: mongoose.Types.ObjectId;
  submittedBy: mongoose.Types.ObjectId;
  assignedOfficerId?: mongoose.Types.ObjectId;
  status: VerificationStatus;
  decisionRemarks?: string;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationRequestSchema = new Schema<IVerificationRequest>(
  {
    requestId: { type: String, required: true, unique: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    targetType: { type: String, enum: ["ACADEMIC_RECORD", "DOCUMENT"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedOfficerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    status: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED", "CORRECTION_REQUIRED"],
      default: "PENDING",
      index: true,
    },
    decisionRemarks: { type: String },
    decidedAt: { type: Date },
  },
  { timestamps: true }
);

export const VerificationRequest: Model<IVerificationRequest> =
  mongoose.models.VerificationRequest ||
  mongoose.model<IVerificationRequest>("VerificationRequest", VerificationRequestSchema);
```

### 2.2 Verification Event Trail (`src/models/VerificationEvent.ts`)
```typescript
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVerificationEvent extends Document {
  requestId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  action: "ASSIGNED" | "STATUS_CHANGE" | "REMARKS_ADDED";
  fromStatus: string;
  toStatus: string;
  remarks?: string;
  occurredAt: Date;
}

const VerificationEventSchema = new Schema<IVerificationEvent>({
  requestId: { type: Schema.Types.ObjectId, ref: "VerificationRequest", required: true, index: true },
  actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  fromStatus: { type: String, required: true },
  toStatus: { type: String, required: true },
  remarks: { type: String },
  occurredAt: { type: Date, default: Date.now, index: true },
});

export const VerificationEvent: Model<IVerificationEvent> =
  mongoose.models.VerificationEvent ||
  mongoose.model<IVerificationEvent>("VerificationEvent", VerificationEventSchema);
```

---

## ⚙️ 3. Verification Service Logic (`src/services/verification.service.ts`)

```typescript
import { VerificationRequest, VerificationStatus } from "@/models/VerificationRequest";
import { VerificationEvent } from "@/models/VerificationEvent";
import { AcademicRecord } from "@/models/AcademicRecord";
import { DocumentModel } from "@/models/Document";

export async function processVerificationDecision(params: {
  requestId: string;
  officerUserId: string;
  decision: "VERIFIED" | "REJECTED" | "CORRECTION_REQUIRED";
  remarks: string;
}) {
  const req = await VerificationRequest.findOne({ requestId: params.requestId });
  if (!req) throw new Error("Verification request not found");

  // Segregation of Duties Check
  if (req.submittedBy.toString() === params.officerUserId.toString()) {
    throw new Error("Conflict of Interest: You cannot review a record you submitted yourself.");
  }

  const previousStatus = req.status;
  req.status = params.decision;
  req.decisionRemarks = params.remarks;
  req.assignedOfficerId = params.officerUserId as any;
  req.decidedAt = new Date();
  await req.save();

  // Cascade to underlying target record
  if (req.targetType === "ACADEMIC_RECORD") {
    await AcademicRecord.findByIdAndUpdate(req.targetId, {
      status: params.decision,
      verifiedAt: params.decision === "VERIFIED" ? new Date() : undefined,
    });
  } else if (req.targetType === "DOCUMENT") {
    await DocumentModel.findByIdAndUpdate(req.targetId, {
      status: params.decision,
      verifiedBy: params.officerUserId,
      verificationRemarks: params.remarks,
    });
  }

  // Record Immutable Audit Event
  await VerificationEvent.create({
    requestId: req._id,
    actorId: params.officerUserId,
    action: "STATUS_CHANGE",
    fromStatus: previousStatus,
    toStatus: params.decision,
    remarks: params.remarks,
    occurredAt: new Date(),
  });

  return req;
}
```

---

## 📡 4. Route Handlers & API Contract

### 4.1 `GET /api/verifications`
- **Permissions**: `VERIFICATION_OFFICER` and `SUPER_ADMIN`.
- **Query Filters**: `?status=PENDING&institutionId=...&targetType=ACADEMIC_RECORD`
- **Output**: Populated list including Student Name, Register No, Masked APAAR, Submission Date, Request Age.

### 4.2 `POST /api/verifications/[id]/decision`
- **Permissions**: `VERIFICATION_OFFICER` or `SUPER_ADMIN`.
- **Request Body (Zod)**:
  ```typescript
  export const decisionSchema = z.object({
    decision: z.enum(["VERIFIED", "REJECTED", "CORRECTION_REQUIRED"]),
    remarks: z.string().min(8, "Mandatory remarks explaining decision (min 8 chars)"),
  });
  ```

---

## 🎨 5. UI: Verification Officer Inspection Desk

1. **Review Queue Table (`/verifications`)**:
   - Status Tabs: `All`, `Pending Review`, `Under Review`, `Completed`.
   - Age indicator: Flags submissions older than 48 hours.
   - Quick action: "Inspect Record".
2. **Side-by-Side Review Screen (`/verifications/[id]`)**:
   - **Left Column**: Student Profile Header + Subject Marks Grid (Grades, Marks, Credits, computed SGPA).
   - **Right Column**: Integrated PDF / Image document viewer displaying the scanned marksheet with zoom controls.
   - **Bottom Action Drawer**:
     - `Verify & Seal` button (Green #15803D).
     - `Request Correction` button (Amber #B45309).
     - `Reject Submission` button (Red #B42318).
     - Mandatory remarks textarea before confirmation modal activates.

---

## ✅ 6. Definition of Done
1. Self-approval attempts return `403 FORBIDDEN: Conflict of Interest`.
2. Approving a record cascades `status = VERIFIED` to both the request and the `AcademicRecord`.
3. Every decision persists an immutable entry in `VerificationEvent`.
4. Mandatory remarks enforced on all rejections and correction requests.
