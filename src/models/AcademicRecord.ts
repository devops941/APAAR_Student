import mongoose, { Schema, type Document, type Model } from "mongoose";

export type RecordStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "CORRECTION_REQUIRED";

export const RECORD_STATUSES: RecordStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
  "CORRECTION_REQUIRED",
];

export interface ISubjectResult {
  subjectId: mongoose.Types.ObjectId;
  subjectCode: string;
  subjectName: string;
  credits: number;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  gradePoint: number;
  result: "PASS" | "FAIL";
}

export interface IAcademicRecord extends Document {
  studentId: mongoose.Types.ObjectId;
  institutionId: mongoose.Types.ObjectId;
  academicYear: string;
  semester: number;
  subjects: ISubjectResult[];
  totalCredits: number;
  sgpa: number;
  status: RecordStatus;
  version: number;
  submittedBy?: mongoose.Types.ObjectId;
  submittedAt?: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AcademicRecordSchema = new Schema<IAcademicRecord>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    academicYear: { type: String, required: true },
    semester: { type: Number, required: true, min: 1, max: 16 },
    subjects: [
      {
        subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
        subjectCode: { type: String, required: true },
        subjectName: { type: String, required: true },
        credits: { type: Number, required: true },
        marksObtained: { type: Number, required: true },
        maxMarks: { type: Number, default: 100 },
        grade: { type: String, required: true },
        gradePoint: { type: Number, required: true },
        result: { type: String, enum: ["PASS", "FAIL"], required: true },
      },
    ],
    totalCredits: { type: Number, required: true },
    sgpa: { type: Number, required: true },
    status: {
      type: String,
      enum: RECORD_STATUSES,
      default: "DRAFT",
      index: true,
    },
    version: { type: Number, default: 1 },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User" },
    submittedAt: { type: Date },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

// Track version history per semester
AcademicRecordSchema.index(
  { studentId: 1, academicYear: 1, semester: 1, version: 1 },
  { unique: true }
);

export const AcademicRecord: Model<IAcademicRecord> =
  mongoose.models.AcademicRecord ||
  mongoose.model<IAcademicRecord>("AcademicRecord", AcademicRecordSchema);

export default AcademicRecord;
