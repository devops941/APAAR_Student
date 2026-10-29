import { describe, it, expect } from "vitest";
import { calculateGradePoint, computeSgpa, computeCgpa } from "@/lib/utils/grading";

describe("Grading Utilities", () => {
  describe("calculateGradePoint", () => {
    it("returns O grade (10 points) for 91+ percentage", () => {
      const result = calculateGradePoint(91);
      expect(result.grade).toBe("O");
      expect(result.gradePoint).toBe(10);
      expect(result.result).toBe("PASS");
    });

    it("returns A+ grade (9 points) for 81-90 percentage", () => {
      const result = calculateGradePoint(85);
      expect(result.grade).toBe("A+");
      expect(result.gradePoint).toBe(9);
      expect(result.result).toBe("PASS");
    });

    it("returns A grade (8 points) for 71-80 percentage", () => {
      const result = calculateGradePoint(75);
      expect(result.grade).toBe("A");
      expect(result.gradePoint).toBe(8);
      expect(result.result).toBe("PASS");
    });

    it("returns B+ grade (7 points) for 61-70 percentage", () => {
      const result = calculateGradePoint(65);
      expect(result.grade).toBe("B+");
      expect(result.gradePoint).toBe(7);
      expect(result.result).toBe("PASS");
    });

    it("returns B grade (6 points) for 50-60 percentage", () => {
      const result = calculateGradePoint(55);
      expect(result.grade).toBe("B");
      expect(result.gradePoint).toBe(6);
      expect(result.result).toBe("PASS");
    });

    it("returns RA (Fail, 0 points) for below 50", () => {
      const result = calculateGradePoint(45);
      expect(result.grade).toBe("RA");
      expect(result.gradePoint).toBe(0);
      expect(result.result).toBe("FAIL");
    });
  });

  describe("computeSgpa", () => {
    it("computes weighted SGPA correctly for multiple subjects", () => {
      const subjects = [
        { credits: 4, gradePoint: 10 },
        { credits: 3, gradePoint: 9 },
        { credits: 3, gradePoint: 8 },
      ];
      const { totalCredits, sgpa } = computeSgpa(subjects);
      expect(totalCredits).toBe(10);
      // (4*10 + 3*9 + 3*8) / 10 = (40+27+24)/10 = 91/10 = 9.1
      expect(sgpa).toBe(9.1);
    });

    it("returns 0 SGPA for zero credits", () => {
      const { totalCredits, sgpa } = computeSgpa([]);
      expect(totalCredits).toBe(0);
      expect(sgpa).toBe(0);
    });

    it("handles single subject", () => {
      const { totalCredits, sgpa } = computeSgpa([{ credits: 4, gradePoint: 8 }]);
      expect(totalCredits).toBe(4);
      expect(sgpa).toBe(8);
    });
  });

  describe("computeCgpa", () => {
    it("computes CGPA across multiple semesters", () => {
      const records = [
        { sgpa: 8.5, totalCredits: 20 },
        { sgpa: 9.0, totalCredits: 24 },
      ];
      // (8.5*20 + 9.0*24) / (20+24) = (170 + 216) / 44 = 386/44 = 8.77...
      const cgpa = computeCgpa(records);
      expect(cgpa).toBe(8.77);
    });

    it("returns 0 for empty records", () => {
      expect(computeCgpa([])).toBe(0);
    });
  });
});
