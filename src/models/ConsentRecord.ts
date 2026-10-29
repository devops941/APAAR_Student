import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IConsentRecord extends Document {
  studentId: mongoose.Types.ObjectId;
  requesterName: string;
  purpose: string;
  requestedFields: string[];
  state: "ACTIVE" | "REVOKED" | "EXPIRED";
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConsentRecordSchema = new Schema<IConsentRecord>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    requesterName: { type: String, required: true, trim: true },
    purpose: { type: String, required: true, trim: true },
    requestedFields: [{ type: String }],
    state: { type: String, enum: ["ACTIVE", "REVOKED", "EXPIRED"], default: "ACTIVE", index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const ConsentRecord: Model<IConsentRecord> =
  mongoose.models.ConsentRecord ||
  mongoose.model<IConsentRecord>("ConsentRecord", ConsentRecordSchema);

export default ConsentRecord;
