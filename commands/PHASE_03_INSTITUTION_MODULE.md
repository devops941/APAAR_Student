# Phase 3: Institution Management Module

## 🎯 1. Phase Objective & Overview
Phase 3 builds the Multi-Institution Onboarding & Governance system:
1. **Institution Profile**: Captures institutional identity (Code, Name, AICTE Category, Address, State, District, Principal/Authorized Contact, AICTE Approval Reference).
2. **State Transition Machine**: Enforces valid status transitions:
   `DRAFT` ➔ `SUBMITTED` ➔ `UNDER_REVIEW` ➔ `VERIFIED` or `REJECTED` / `CORRECTION_REQUIRED`.
3. **Tenant Scoping**:
   - `SUPER_ADMIN`: Can view all institutions, inspect submitted evidence, and execute review decisions.
   - `INSTITUTION_ADMIN`: Can only view and edit their own assigned institution. Cannot access other colleges' profiles.

---

## 🏛️ 2. Mongoose Schema: `Institution` (`src/models/Institution.ts`)

```typescript
import mongoose, { Schema, Document, Model } from "mongoose";

export type InstitutionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "CORRECTION_REQUIRED";

export type InstitutionCategory =
  | "ENGINEERING"
  | "POLYTECHNIC"
  | "MANAGEMENT"
  | "PHARMACY"
  | "ARTS_SCIENCE";

export interface IInstitution extends Document {
  name: string;
  code: string; // Unique, e.g. "AICTE-TN-042"
  category: InstitutionCategory;
  address: {
    street: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
  };
  contactEmail: string;
  contactPhone: string;
  principalName: string;
  approvalReference: string; // e.g. "F.No. Southern/1-1234567/2026/EOA"
  status: InstitutionStatus;
  reviewerId?: mongoose.Types.ObjectId;
  reviewRemarks?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InstitutionSchema = new Schema<IInstitution>(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["ENGINEERING", "POLYTECHNIC", "MANAGEMENT", "PHARMACY", "ARTS_SCIENCE"],
      required: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, required: true, index: true },
      state: { type: String, required: true, index: true },
      pincode: { type: String, required: true },
    },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    principalName: { type: String, required: true, trim: true },
    approvalReference: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "VERIFIED", "REJECTED", "CORRECTION_REQUIRED"],
      default: "DRAFT",
      index: true,
    },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User" },
    reviewRemarks: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const Institution: Model<IInstitution> =
  mongoose.models.Institution ||
  mongoose.model<IInstitution>("Institution", InstitutionSchema);
```

---

## ⚙️ 3. State Transition Service (`src/services/institution.service.ts`)

Prevent illegal transitions (e.g. an institution cannot go directly from `DRAFT` to `VERIFIED` without `SUBMITTED` & `UNDER_REVIEW`).

```typescript
import { InstitutionStatus } from "@/models/Institution";

const ALLOWED_TRANSITIONS: Record<InstitutionStatus, InstitutionStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW", "DRAFT"],
  UNDER_REVIEW: ["VERIFIED", "REJECTED", "CORRECTION_REQUIRED"],
  CORRECTION_REQUIRED: ["SUBMITTED"],
  REJECTED: ["DRAFT"],
  VERIFIED: ["UNDER_REVIEW"], // Re-audit flow only
};

export function isValidInstitutionTransition(
  current: InstitutionStatus,
  target: InstitutionStatus
): boolean {
  return ALLOWED_TRANSITIONS[current]?.includes(target) ?? false;
}
```

---

## 📡 4. Route Handlers & API Contract

### 4.1 `GET /api/institutions`
- **Permissions**:
  - `SUPER_ADMIN`: Returns all institutions, supports query params `?status=...&state=...&search=...` with pagination.
  - `INSTITUTION_ADMIN`: Returns only their own institution record.

### 4.2 `POST /api/institutions`
- **Permissions**: `SUPER_ADMIN` only.
- **Request Body (Zod)**: Validates required name, uppercase code, address, email, approval reference.
- **Result**: Creates new institution in `DRAFT` status.

### 4.3 `GET /api/institutions/[id]`
- **Permissions**: `SUPER_ADMIN` or `INSTITUTION_ADMIN` (scoped to `session.institutionId === id`).

### 4.4 `PATCH /api/institutions/[id]`
- **Permissions**: Scoped Institution Admin can update address, contacts, principal details if status is `DRAFT` or `CORRECTION_REQUIRED`.

### 4.5 `POST /api/institutions/[id]/review`
- **Permissions**: `SUPER_ADMIN` only.
- **Request Body**:
  ```typescript
  export const reviewSchema = z.object({
    status: z.enum(["VERIFIED", "REJECTED", "CORRECTION_REQUIRED"]),
    remarks: z.string().min(5, "Review remarks are required"),
  });
  ```
- **Audit**: Writes audit log containing reviewer ID, decision, and remarks.

---

## 🎨 5. UI Components & Screen Specifications

1. **Institutions Directory Screen (`/institutions`)**:
   - Filter bar: Status pills (`All`, `Pending Verification`, `Verified`, `Rejected`), state dropdown, search by name/code.
   - Data Table: Institution Code, Name, District, State, Category, Status Badge, Quick Actions.
2. **Institution Detail & Review Drawer (`/institutions/[id]`)**:
   - Institutional metadata card.
   - Approval reference checker box.
   - Review Action Panel (for Super Admin): Approve, Reject, or Request Correction buttons with mandatory remarks textarea.

---

## ⚡ 6. Terminal Commands & API Verification

```powershell
# 1. Create a draft institution (As Super Admin)
$inst = @{
  name = "Chennai Institute of Technology";
  code = "CIT-TN-01";
  category = "ENGINEERING";
  address = @{
    street = "Sarathy Nagar, Kundrathur";
    city = "Chennai";
    district = "Chennai";
    state = "Tamil Nadu";
    pincode = "600069";
  };
  contactEmail = "admin@citchennai.net";
  contactPhone = "+91 44 7111 9111";
  principalName = "Dr. A. Ramesh";
  approvalReference = "AICTE/SR/1-2026/001";
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:3000/api/institutions" -Method POST -Body $inst -ContentType "application/json"
```

---

## ✅ 7. Definition of Done
1. Unique index on `code` prevents duplicate institution codes.
2. Invalid state transitions (e.g., `DRAFT` to `VERIFIED`) return `400 BAD_REQUEST`.
3. Tenant boundary enforced: An Institution Admin cannot read or modify another college's ID.
4. Review decisions log reviewer ID, timestamp, and remarks cleanly.
