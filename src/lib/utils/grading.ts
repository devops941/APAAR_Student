/**
 * Grade point calculation and SGPA computation utilities.
 * Follows the standard Indian grading scale (O, A+, A, B+, B, RA).
 */

export interface SubjectGradeInput {
  credits: number;
  marksObtained: number;
  maxMarks?: number;
}

export function calculateGradePoint(percentage: number): {
  grade: string;
  gradePoint: number;
  result: "PASS" | "FAIL";
} {
  if (percentage >= 91) return { grade: "O", gradePoint: 10, result: "PASS" };
  if (percentage >= 81) return { grade: "A+", gradePoint: 9, result: "PASS" };
  if (percentage >= 71) return { grade: "A", gradePoint: 8, result: "PASS" };
  if (percentage >= 61) return { grade: "B+", gradePoint: 7, result: "PASS" };
  if (percentage >= 50) return { grade: "B", gradePoint: 6, result: "PASS" };
  return { grade: "RA", gradePoint: 0, result: "FAIL" };
}

export function computeSgpa(subjects: { credits: number; gradePoint: number }[]): {
  totalCredits: number;
  sgpa: number;
} {
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
  if (totalCredits === 0) return { totalCredits: 0, sgpa: 0 };

  const totalPoints = subjects.reduce((sum, s) => sum + s.credits * s.gradePoint, 0);
  const sgpa = Number((totalPoints / totalCredits).toFixed(2));

  return { totalCredits, sgpa };
}

/**
 * Compute CGPA across multiple semester records.
 */
export function computeCgpa(records: { sgpa: number; totalCredits: number }[]): number {
  const totalCredits = records.reduce((sum, r) => sum + r.totalCredits, 0);
  if (totalCredits === 0) return 0;
  const totalPoints = records.reduce((sum, r) => sum + r.sgpa * r.totalCredits, 0);
  return Number((totalPoints / totalCredits).toFixed(2));
}
