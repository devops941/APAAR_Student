import mongoose, { Schema, type Document, type Model } from "mongoose";

export type AcademicStatus = "ACTIVE" | "GRADUATED" | "TRANSFERRED" | "WITHDRAWN";

export const ACADEMIC_STATUSES: AcademicStatus[] = [
  "ACTIVE",
  "GRADUATED",
  "TRANSFERRED",
  "WITHDRAWN",
];

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId;
  institutionId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  registerNumber: string;
  apaarId?: string;
  fullName: string;
  dateOfBirth: Date;
  gender: "MALE" | "FEMALE" | "OTHER";
  admissionYear: number;
  currentSemester: number;
  academicStatus: AcademicStatus;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    registerNumber: { type: String, required: true, trim: true },
    apaarId: { type: String, trim: true, default: undefined },
    fullName: { type: String, required: true, trim: true, index: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"], required: true },
    admissionYear: { type: Number, required: true, min: 2000, max: 2100 },
    currentSemester: { type: Number, required: true, min: 1, max: 16 },
    academicStatus: {
      type: String,
      enum: ACADEMIC_STATUSES,
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true }
);

// Partial unique index: APAAR ID globally unique only when provided
StudentSchema.index(
  { apaarId: 1 },
  { unique: true, partialFilterExpression: { apaarId: { $type: "string" } } }
);

// Composite unique index: Register Number unique within institution
StudentSchema.index(
  { institutionId: 1, registerNumber: 1 },
  { unique: true }
);

export const Student: Model<IStudent> =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);

export default Student;
