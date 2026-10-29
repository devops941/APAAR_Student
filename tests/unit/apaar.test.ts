import { describe, it, expect } from "vitest";
import { normalizeApaarId, maskApaarId, formatApaarId } from "@/lib/utils/apaar";

describe("APAAR ID Utilities", () => {
  describe("normalizeApaarId", () => {
    it("accepts a valid 12-digit string", () => {
      expect(normalizeApaarId("123456789012")).toBe("123456789012");
    });

    it("removes spaces and dashes", () => {
      expect(normalizeApaarId("1234-5678-9012")).toBe("123456789012");
      expect(normalizeApaarId("1234 5678 9012")).toBe("123456789012");
    });

    it("returns undefined for empty input", () => {
      expect(normalizeApaarId(undefined)).toBeUndefined();
      expect(normalizeApaarId("")).toBeUndefined();
    });

    it("throws for 11-digit input", () => {
      expect(() => normalizeApaarId("12345678901")).toThrow("Invalid APAAR ID format");
    });

    it("throws for non-numeric input", () => {
      expect(() => normalizeApaarId("ABCDEFGHIJKL")).toThrow("Invalid APAAR ID format");
    });

    it("throws for 13-digit input", () => {
      expect(() => normalizeApaarId("1234567890123")).toThrow("Invalid APAAR ID format");
    });
  });

  describe("maskApaarId", () => {
    it("masks a 12-digit APAAR ID showing only last 4 digits", () => {
      expect(maskApaarId("123456789012")).toBe("XXXXXXXX9012");
    });

    it("masks another valid APAAR ID", () => {
      expect(maskApaarId("987654321098")).toBe("XXXXXXXX1098");
    });

    it("returns dash for empty or short input", () => {
      expect(maskApaarId(undefined)).toBe("—");
      expect(maskApaarId("123")).toBe("—");
    });
  });

  describe("formatApaarId", () => {
    it("formats with spaces every 4 digits", () => {
      expect(formatApaarId("123456789012")).toBe("1234 5678 9012");
    });

    it("returns dash for empty input", () => {
      expect(formatApaarId(undefined)).toBe("—");
    });
  });
});
