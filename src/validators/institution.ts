import { z } from "zod";

export const createInstitutionSchema = z.object({
  name: z.string().min(2, "Institution name is required"),
  code: z
    .string()
    .min(3, "Institution code is required")
    .regex(/^[A-Z0-9-]+$/, "Code must be uppercase letters, numbers, and dashes"),
  category: z.enum(["ENGINEERING", "POLYTECHNIC", "MANAGEMENT", "PHARMACY", "ARTS_SCIENCE"]),
  address: z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    district: z.string().min(1, "District is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().min(1, "Pincode is required"),
  }),
  contactEmail: z.string().email("Valid contact email is required"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  principalName: z.string().min(1, "Principal name is required"),
  approvalReference: z.string().min(1, "AICTE approval reference is required"),
});

export const updateInstitutionSchema = z.object({
  name: z.string().min(2).optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      district: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
    })
    .optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  principalName: z.string().optional(),
  approvalReference: z.string().optional(),
});

export const reviewInstitutionSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED", "CORRECTION_REQUIRED"]),
  remarks: z.string().min(5, "Review remarks are required (min 5 characters)"),
});

export type CreateInstitutionInput = z.infer<typeof createInstitutionSchema>;
export type UpdateInstitutionInput = z.infer<typeof updateInstitutionSchema>;
export type ReviewInstitutionInput = z.infer<typeof reviewInstitutionSchema>;
