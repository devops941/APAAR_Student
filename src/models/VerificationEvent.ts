import mongoose, { Schema, type Document, type Model } from "mongoose";

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

export default VerificationEvent;
