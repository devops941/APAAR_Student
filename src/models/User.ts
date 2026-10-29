import mongoose, { Schema, type Document, type Model } from "mongoose";

export type UserRole =
  | "SUPER_ADMIN"
  | "INSTITUTION_ADMIN"
  | "FACULTY"
  | "STUDENT"
  | "VERIFICATION_OFFICER";

export const USER_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "INSTITUTION_ADMIN",
  "FACULTY",
  "STUDENT",
  "VERIFICATION_OFFICER",
];

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  institutionId?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      index: true,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: "Institution",
      required: function (this: IUser) {
        return this.role !== "SUPER_ADMIN" && this.role !== "VERIFICATION_OFFICER";
      },
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      index: true,
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
