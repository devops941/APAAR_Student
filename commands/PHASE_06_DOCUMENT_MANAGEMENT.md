# Phase 6: Document Management & Integrity System

## 🎯 1. Phase Objective & Overview
Phase 6 implements the Private Document Storage and Cryptographic Integrity System:
1. **Academic Evidence Storage**: Manages proofs such as Semester Marksheets, Degree Certificates, Admission Letters, and Transfer Certificates.
2. **Strict MIME & Size Enforcement**: Only `application/pdf`, `image/jpeg`, and `image/png` up to 5MB are permitted. Executable or script files are strictly blocked.
3. **Cryptographic Integrity Hash (SHA-256)**: Every uploaded file is hashed server-side upon reception. The hash is saved in MongoDB. If a file is altered on disk, the system detects tampering immediately.
4. **Zero Public File URLs**: Files are stored in a private directory (`./uploads`) or private S3 bucket. All downloads stream through an authenticated route handler (`/api/documents/[id]/download`) with strict RBAC access checks.

---

## 🏛️ 2. Mongoose Schema: `Document` (`src/models/Document.ts`)

```typescript
import mongoose, { Schema, Document as MongoDoc, Model } from "mongoose";

export type DocumentType =
  | "ADMISSION_PROOF"
  | "SEMESTER_MARKSHEET"
  | "DEGREE_CERTIFICATE"
  | "TRANSFER_CERTIFICATE"
  | "BONAFIDE"
  | "OTHER";

export type DocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface IDocument extends MongoDoc {
  studentId: mongoose.Types.ObjectId;
  institutionId: mongoose.Types.ObjectId;
  documentType: DocumentType;
  title: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  storageKey: string;     // Unique UUID/random key on disk/storage
  sha256Hash: string;     // Hex-encoded SHA-256 integrity hash
  status: DocumentStatus;
  version: number;
  relatedAcademicRecordId?: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  verifiedBy?: mongoose.Types.ObjectId;
  verificationRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    documentType: {
      type: String,
      enum: ["ADMISSION_PROOF", "SEMESTER_MARKSHEET", "DEGREE_CERTIFICATE", "TRANSFER_CERTIFICATE", "BONAFIDE", "OTHER"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    storageKey: { type: String, required: true, unique: true },
    sha256Hash: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    version: { type: Number, default: 1 },
    relatedAcademicRecordId: { type: Schema.Types.ObjectId, ref: "AcademicRecord" },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verificationRemarks: { type: String },
  },
  { timestamps: true }
);

DocumentSchema.index({ studentId: 1, documentType: 1, createdAt: -1 });

export const DocumentModel: Model<IDocument> =
  mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema);
```

---

## 🔒 3. Storage Service & SHA-256 Hashing (`src/services/storage.service.ts`)

```typescript
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

export async function ensureUploadDirExists() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export function computeSha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function saveFileLocally(
  buffer: Buffer,
  originalName: string
): Promise<{ storageKey: string; sha256Hash: string }> {
  await ensureUploadDirExists();

  const ext = path.extname(originalName).toLowerCase();
  const storageKey = `${uuidv4()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, storageKey);

  const sha256Hash = computeSha256(buffer);
  await fs.writeFile(filePath, buffer);

  return { storageKey, sha256Hash };
}

export async function getFileBuffer(storageKey: string): Promise<Buffer> {
  const filePath = path.join(UPLOAD_DIR, storageKey);
  return await fs.readFile(filePath);
}
```

---

## 📡 4. Route Handlers

### 4.1 `POST /api/documents` (Upload)
- **Permissions**: `STUDENT` (for own profile) or `INSTITUTION_ADMIN` / `FACULTY` (scoped to institution).
- **Validation**:
  - Content-Type: `multipart/form-data`.
  - Max Size: 5MB (`5 * 1024 * 1024` bytes).
  - Allowed MIME: `["application/pdf", "image/png", "image/jpeg"]`.
- **Response**: `{ success: true, data: { id, title, sha256Hash, status: "PENDING" } }`.

### 4.2 `GET /api/documents/[id]/download` (Streamed Download)
- **Permissions**:
  - Owner student (`session.userId === student.userId`), OR
  - Institution Admin of the same college, OR
  - Verification Officer / Super Admin.
- **Headers**:
  - `Content-Type`: Set to original file's MIME type.
  - `Content-Disposition`: `inline; filename="marksheet.pdf"` (or `attachment`).
  - `X-Content-Type-Options`: `nosniff`.

---

## 🎨 5. UI: Document Center & Preview Drawer

1. **Upload Dropzone**:
   - Drag-and-drop zone with visual feedback.
   - Document type selector (Semester Marksheet, Degree, etc.).
   - Client-side size check (warns if file > 5MB before upload).
2. **Document Grid / Table**:
   - Columns: Document Title, Type, Uploaded Date, Status Badge, **SHA-256 Hash badge** (with one-click "Copy Hash" tooltip).
   - "Preview" button (opens inline PDF / image modal).
   - "Download" button triggering secure route.

---

## ⚡ 6. Terminal Commands & Verification

```powershell
# 1. Install uuid library
npm install uuid
npm install -D @types/uuid

# 2. Verify uploads folder is in .gitignore
Add-Content -Path .gitignore -Value "`nuploads/"
```

---

## ✅ 7. Definition of Done
1. Malicious or non-permitted extensions (e.g. `.exe`, `.html`, `.js`) are strictly rejected.
2. SHA-256 checksum is calculated and persisted in MongoDB.
3. Unauthenticated requests to download URLs receive `401 UNAUTHENTICATED`.
4. A student cannot download another student's document (returns `403 FORBIDDEN`).
