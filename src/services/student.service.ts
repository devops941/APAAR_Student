import Papa from "papaparse";
import { z } from "zod";
import { Student } from "@/models/Student";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import { normalizeApaarId, maskApaarId } from "@/lib/utils/apaar";
import { csvImportRowSchema, type CsvImportRow } from "@/validators/student";
import { connectToDatabase } from "@/lib/db/mongoose";

export interface ImportPreviewResult {
  validRowCount: number;
  invalidRowCount: number;
  errors: { row: number; column: string; error: string }[];
  validRows: (CsvImportRow & { maskedApaarId?: string })[];
}

/**
 * Parse and validate a CSV string for student import.
 * Does NOT write to the database — returns a preview with row-level errors.
 */
export async function previewCsvImport(
  csvContent: string,
  institutionId: string
): Promise<ImportPreviewResult> {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  const errors: ImportPreviewResult["errors"] = [];
  const validRows: ImportPreviewResult["validRows"] = [];

  const seenRegisterNumbers = new Set<string>();
  const seenApaarIds = new Set<string>();

  // Fetch existing register numbers and APAAR IDs for conflict detection
  const existingStudents = await Student.find({ institutionId })
    .select("registerNumber apaarId")
    .lean();
  const existingRegs = new Set(existingStudents.map((s) => s.registerNumber));
  const existingApaar = new Set(
    existingStudents.filter((s) => s.apaarId).map((s) => s.apaarId!)
  );

  parsed.data.forEach((row, index) => {
    const rowNum = index + 2; // +2 for header row + 1-indexed

    const result = csvImportRowSchema.safeParse(row);
    if (!result.success) {
      const firstError = result.error.issues[0];
      errors.push({
        row: rowNum,
        column: firstError.path[0]?.toString() || "unknown",
        error: firstError.message,
      });
      return;
    }

    const data = result.data;

    // In-file duplicate check
    if (seenRegisterNumbers.has(data.registerNumber)) {
      errors.push({
        row: rowNum,
        column: "registerNumber",
        error: `Duplicate register number "${data.registerNumber}" within CSV`,
      });
      return;
    }
    seenRegisterNumbers.add(data.registerNumber);

    if (data.apaarId) {
      if (seenApaarIds.has(data.apaarId)) {
        errors.push({
          row: rowNum,
          column: "apaarId",
          error: `Duplicate APAAR ID within CSV`,
        });
        return;
      }
      seenApaarIds.add(data.apaarId);
    }

    // DB conflict check
    if (existingRegs.has(data.registerNumber)) {
      errors.push({
        row: rowNum,
        column: "registerNumber",
        error: `Register number "${data.registerNumber}" already exists in institution`,
      });
      return;
    }

    if (data.apaarId && existingApaar.has(data.apaarId)) {
      errors.push({
        row: rowNum,
        column: "apaarId",
        error: "APAAR ID already registered in the system",
      });
      return;
    }

    validRows.push({
      ...data,
      maskedApaarId: data.apaarId ? maskApaarId(data.apaarId) : undefined,
    });
  });

  return {
    validRowCount: validRows.length,
    invalidRowCount: errors.length,
    errors,
    validRows,
  };
}

/**
 * Commit validated CSV rows to the database.
 * Creates User records (with default password) and Student documents.
 */
export async function commitCsvImport(
  rows: CsvImportRow[],
  institutionId: string,
  departmentIdMap: Record<string, string>
): Promise<{ created: number; failed: number }> {
  const defaultPasswordHash = await hashPassword("Demo@12345");
  let created = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const departmentId = departmentIdMap[row.departmentCode];
      if (!departmentId) {
        failed++;
        continue;
      }

      // Create user account
      const user = await User.create({
        name: row.fullName,
        email: row.email.toLowerCase(),
        passwordHash: defaultPasswordHash,
        role: "STUDENT",
        institutionId,
        departmentId,
        isActive: true,
      });

      // Create student record
      await Student.create({
        userId: user._id,
        institutionId,
        departmentId,
        registerNumber: row.registerNumber,
        apaarId: row.apaarId ? normalizeApaarId(row.apaarId) : undefined,
        fullName: row.fullName,
        dateOfBirth: new Date(row.dateOfBirth),
        gender: row.gender,
        admissionYear: row.admissionYear,
        currentSemester: row.currentSemester,
        academicStatus: "ACTIVE",
      });

      created++;
    } catch (err) {
      console.error(`Failed to import row ${row.registerNumber}:`, err);
      failed++;
    }
  }

  return { created, failed };
}
