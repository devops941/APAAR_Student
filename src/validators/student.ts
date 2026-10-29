import { z } from "zod";

export const createStudentSchema = z.object({
  institutionId: z.string(),
  departmentId: z.string(),
  registerNumber: z.string().min(1, "Register number is required"),
  apaarId: z.string().regex(/^\d{12}$/, "APAAR ID must be 12 digits").optional(),
  fullName: z.string().min(1, "Full name is required"),
  dateOfBirth: z.string().transform((v) => new Date(v)),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  admissionYear: z.number().int().min(2000).max(2100),
  currentSemester: z.number().int().min(1).max(16),
  email: z.string().email("Valid email is required"),
  academicStatus: z.enum(["ACTIVE", "GRADUATED", "TRANSFERRED", "WITHDRAWN"]).optional(),
});

export const csvImportRowSchema = z.object({
  registerNumber: z.string().min(1, "Register number is required"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  departmentCode: z.string().min(1, "Department code is required"),
  admissionYear: z.coerce.number().int().min(2000).max(2100),
  currentSemester: z.coerce.number().int().min(1).max(16),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  apaarId: z.string().regex(/^\d{12}$/).optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type CsvImportRow = z.infer<typeof csvImportRowSchema>;
