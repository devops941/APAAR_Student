import mongoose, { Schema, type Document, type Model } from "mongoose";

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

export const INSTITUTION_STATUSES: InstitutionStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
  "CORRECTION_REQUIRED",
];

export const INSTITUTION_CATEGORIES: InstitutionCategory[] = [
  "ENGINEERING",
  "POLYTECHNIC",
  "MANAGEMENT",
  "PHARMACY",
  "ARTS_SCIENCE",
];

export interface IInstitution extends Document {
  name: string;
  code: string;
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
  approvalReference: string;
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
      enum: INSTITUTION_CATEGORIES,
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
      enum: INSTITUTION_STATUSES,
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

export default Institution;
