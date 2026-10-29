import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISuperAdmin extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "SUPER_ADMIN";
  institutionId?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SuperAdminSchema = new Schema<ISuperAdmin>(
  {
    name: { type: String, required: true, default: "Super Administrator", trim: true },
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
      default: "SUPER_ADMIN",
      immutable: true,
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    collection: "super_admins", // Dedicated separate collection/table
  }
);

export const SuperAdmin: Model<ISuperAdmin> =
  mongoose.models.SuperAdmin ||
  mongoose.model<ISuperAdmin>("SuperAdmin", SuperAdminSchema);

export default SuperAdmin;
