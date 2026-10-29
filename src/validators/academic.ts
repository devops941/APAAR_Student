import { z } from "zod";

export const createAcademicRecordSchema = z.object({
  studentId: z.string(),
  institutionId: z.string(),
  academicYear: z.string().min(1, "Academic year is required"),
  semester: z.number().int().min(1).max(16),
  subjects: z.array(
    z.object({
      subjectId: z.string(),
      subjectCode: z.string(),
      subjectName: z.string(),
      credits: z.number().min(1).max(10),
      marksObtained: z.number().min(0).max(100),
      maxMarks: z.number().default(100),
    })
  ).min(1, "At least one subject is required"),
});

export type CreateAcademicRecordInput = z.infer<typeof createAcademicRecordSchema>;
