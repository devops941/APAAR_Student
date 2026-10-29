import mongoose, { Schema, type Document as MongoDoc, type Model } from "mongoose";

export type DocumentType =
  | "ADMISSION_PROOF"
  | "SEMESTER_MARKSHEET"
  | "DEGREE_CERTIFICATE"
  | "TRANSFER_CERTIFICATE"
  | "BONAFIDE"
  | "OTHER";

export const DOCUMENT_TYPES: DocumentType[] = [
  "ADMISSION_PROOF",
  "SEMESTER_MARKSHEET",
  "DEGREE_CERTIFICATE",
  "TRANSFER_CERTIFICATE",
  "BONAFIDE",
  "OTHER",
];

export type DocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface IDocument extends MongoDoc {
  studentId: mongoose.Types.ObjectId;
  institutionId: mongoose.Types.ObjectId;
  documentType: DocumentType;
  title: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  storageKey: string;
  storageProvider: "cloudinary" | "local";
  sha256Hash: string;
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
      enum: DOCUMENT_TYPES,
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    storageKey: { type: String, required: true, unique: true },
    storageProvider: { type: String, enum: ["cloudinary", "local"], default: "local" },
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

export default DocumentModel;
