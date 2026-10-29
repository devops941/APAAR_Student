import mongoose, { Schema, type Document, type Model } from "mongoose";

export type AuditAction =
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "INSTITUTION_CREATED"
  | "INSTITUTION_VERIFIED"
  | "INSTITUTION_REJECTED"
  | "STUDENT_CREATED"
  | "STUDENT_IMPORTED"
  | "APAAR_REVEALED"
  | "ACADEMIC_RECORD_SUBMITTED"
  | "ACADEMIC_RECORD_VERIFIED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_DOWNLOADED";

export const AUDIT_ACTIONS: AuditAction[] = [
  "USER_LOGIN",
  "USER_LOGOUT",
  "INSTITUTION_CREATED",
  "INSTITUTION_VERIFIED",
  "INSTITUTION_REJECTED",
  "STUDENT_CREATED",
  "STUDENT_IMPORTED",
  "APAAR_REVEALED",
  "ACADEMIC_RECORD_SUBMITTED",
  "ACADEMIC_RECORD_VERIFIED",
  "DOCUMENT_UPLOADED",
  "DOCUMENT_DOWNLOADED",
];

export interface IAuditLog extends Document {
  actorId: mongoose.Types.ObjectId;
  actorEmail: string;
  actorRole: string;
  action: AuditAction;
  entityType: string;
  entityId?: mongoose.Types.ObjectId;
  institutionId?: mongoose.Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  safeChangesSummary?: string;
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

export default AuditLog;
