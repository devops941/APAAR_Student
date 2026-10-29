import mongoose, { Schema, type Document, type Model } from "mongoose";

export type VerificationStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "CORRECTION_REQUIRED";

export const VERIFICATION_STATUSES: VerificationStatus[] = [
  "PENDING",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
  "CORRECTION_REQUIRED",
];

export type RecordTargetType = "ACADEMIC_RECORD" | "DOCUMENT";

export interface IVerificationRequest extends Document {
  requestId: string;
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
      enum: VERIFICATION_STATUSES,
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

export default VerificationRequest;
