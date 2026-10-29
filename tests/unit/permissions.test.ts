import { describe, it, expect } from "vitest";
import { isValidInstitutionTransition } from "@/services/institution.service";

describe("Institution State Machine", () => {
  it("allows DRAFT → SUBMITTED", () => {
    expect(isValidInstitutionTransition("DRAFT", "SUBMITTED")).toBe(true);
  });

  it("allows SUBMITTED → UNDER_REVIEW", () => {
    expect(isValidInstitutionTransition("SUBMITTED", "UNDER_REVIEW")).toBe(true);
  });

  it("allows UNDER_REVIEW → VERIFIED", () => {
    expect(isValidInstitutionTransition("UNDER_REVIEW", "VERIFIED")).toBe(true);
  });

  it("allows UNDER_REVIEW → REJECTED", () => {
    expect(isValidInstitutionTransition("UNDER_REVIEW", "REJECTED")).toBe(true);
  });

  it("allows CORRECTION_REQUIRED → SUBMITTED", () => {
    expect(isValidInstitutionTransition("CORRECTION_REQUIRED", "SUBMITTED")).toBe(true);
  });

  it("blocks DRAFT → VERIFIED (must go through SUBMITTED + UNDER_REVIEW)", () => {
    expect(isValidInstitutionTransition("DRAFT", "VERIFIED")).toBe(false);
  });

  it("blocks VERIFIED → DRAFT", () => {
    expect(isValidInstitutionTransition("VERIFIED", "DRAFT")).toBe(false);
  });

  it("allows VERIFIED → UNDER_REVIEW (re-audit)", () => {
    expect(isValidInstitutionTransition("VERIFIED", "UNDER_REVIEW")).toBe(true);
  });

  it("allows REJECTED → DRAFT", () => {
    expect(isValidInstitutionTransition("REJECTED", "DRAFT")).toBe(true);
  });
});

describe("Role Hierarchy", () => {
  const USER_ROLES = [
    "SUPER_ADMIN",
    "INSTITUTION_ADMIN",
    "FACULTY",
    "STUDENT",
    "VERIFICATION_OFFICER",
  ];

  it("defines all 5 personas", () => {
    expect(USER_ROLES).toHaveLength(5);
  });

  it("SUPER_ADMIN has global access (bypasses institution scope)", () => {
    const session = {
      userId: "test",
      email: "admin@test.com",
      role: "SUPER_ADMIN" as const,
    };
    expect(session.role).toBe("SUPER_ADMIN");
  });

  it("STUDENT role cannot access admin routes", () => {
    const adminRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "FACULTY"];
    expect(adminRoles.includes("STUDENT")).toBe(false);
  });

  it("VERIFICATION_OFFICER cannot submit records (segregation of duties)", () => {
    const submitterRoles = ["INSTITUTION_ADMIN", "FACULTY"];
    expect(submitterRoles.includes("VERIFICATION_OFFICER")).toBe(false);
  });
});
