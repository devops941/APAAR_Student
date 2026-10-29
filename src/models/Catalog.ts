import mongoose, { Schema, type Document, type Model } from "mongoose";

/* ── Department ── */
export interface IDepartment extends Document {
  institutionId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  hodName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    hodName: { type: String, trim: true },
  },
  { timestamps: true }
);
DepartmentSchema.index({ institutionId: 1, code: 1 }, { unique: true });

/* ── Course / Program ── */
export interface ICourse extends Document {
  institutionId: mongoose.Types.ObjectId;
  departmentId: mongoose.Types.ObjectId;
  title: string;
  code: string;
  durationYears: number;
  totalSemesters: number;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    durationYears: { type: Number, default: 4 },
    totalSemesters: { type: Number, default: 8 },
  },
  { timestamps: true }
);
CourseSchema.index({ institutionId: 1, code: 1 }, { unique: true });

/* ── Subject / Coursework ── */
export interface ISubject extends Document {
  courseId: mongoose.Types.ObjectId;
  semester: number;
  code: string;
  name: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    semester: { type: Number, required: true, min: 1, max: 16 },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    credits: { type: Number, required: true, min: 1, max: 10 },
  },
  { timestamps: true }
);
SubjectSchema.index({ courseId: 1, semester: 1, code: 1 }, { unique: true });

export const Department: Model<IDepartment> =
  mongoose.models.Department || mongoose.model<IDepartment>("Department", DepartmentSchema);

export const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);

export const Subject: Model<ISubject> =
  mongoose.models.Subject || mongoose.model<ISubject>("Subject", SubjectSchema);
