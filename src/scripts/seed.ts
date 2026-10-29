/**
 * APAAR Platform — Synthetic Data Seeder
 *
 * Populates MongoDB with realistic demo data:
 * - 3 Institutions (Chennai, Coimbatore, Madurai)
 * - 1 Super Admin, 3 Institution Admins, 5 Faculty, 1 Verification Officer, 50 Students
 * - Departments, Courses, Subjects
 * - 120+ Academic Records
 * - Verification Requests (verified + pending)
 *
 * Run: npx tsx src/scripts/seed.ts
 *
 * Default password for all demo accounts: Demo@12345
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { SuperAdmin } from "../models/SuperAdmin";
import { Institution } from "../models/Institution";
import { Department, Course, Subject } from "../models/Catalog";
import { Student } from "../models/Student";
import { AcademicRecord } from "../models/AcademicRecord";
import { VerificationRequest } from "../models/VerificationRequest";
import { calculateGradePoint, computeSgpa } from "../lib/utils/grading";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in .env.local");
  process.exit(1);
}

const MONGODB_URI_VALID: string = MONGODB_URI;

async function runSeeder() {
  console.log("🌱 Starting APAAR Platform Synthetic Seeder...\n");

  await mongoose.connect(MONGODB_URI_VALID);
  console.log("✅ Connected to MongoDB\n");

  // ── Clear existing data ──
  console.log("🧹 Clearing existing data...");
  await Promise.all([
    SuperAdmin.deleteMany({}),
    User.deleteMany({}),
    Institution.deleteMany({}),
    Department.deleteMany({}),
    Course.deleteMany({}),
    Subject.deleteMany({}),
    Student.deleteMany({}),
    AcademicRecord.deleteMany({}),
    VerificationRequest.deleteMany({}),
  ]);
  console.log("✅ Cleared\n");

  const passwordHash = await bcrypt.hash("Demo@12345", 12);

  // ── 1. Create Institutions ──
  console.log("🏛️ Creating institutions...");
  const institutions = await Institution.create([
    {
      name: "Chennai Institute of Technology",
      code: "CIT-TN-01",
      category: "ENGINEERING",
      address: { street: "Sarathy Nagar, Kundrathur", city: "Chennai", district: "Chennai", state: "Tamil Nadu", pincode: "600069" },
      contactEmail: "admin@citchennai.edu.in",
      contactPhone: "+91 44 7111 9111",
      principalName: "Dr. A. Ramesh",
      approvalReference: "AICTE/SR/1-2026/001",
      status: "VERIFIED",
    },
    {
      name: "Coimbatore Engineering College",
      code: "CEC-TN-02",
      category: "ENGINEERING",
      address: { street: "Bharathiar Road", city: "Coimbatore", district: "Coimbatore", state: "Tamil Nadu", pincode: "641046" },
      contactEmail: "admin@cec.edu.in",
      contactPhone: "+91 422 5555 100",
      principalName: "Dr. S. Lakshmi",
      approvalReference: "AICTE/SR/1-2026/002",
      status: "VERIFIED",
    },
    {
      name: "Madurai Institute of Science",
      code: "MIS-TN-03",
      category: "POLYTECHNIC",
      address: { street: "Ring Road", city: "Madurai", district: "Madurai", state: "Tamil Nadu", pincode: "625020" },
      contactEmail: "admin@mis.edu.in",
      contactPhone: "+91 452 6666 200",
      principalName: "Dr. P. Venkatesan",
      approvalReference: "AICTE/SR/1-2026/003",
      status: "UNDER_REVIEW",
    },
  ]);
  console.log(`✅ Created ${institutions.length} institutions\n`);

  // ── 2. Create Super Admin in dedicated table ──
  console.log("👤 Creating super admin in separate table (super_admins)...");
  const superAdminPasswordHash = await bcrypt.hash("Admin@123", 12);
  const superAdminDoc = await SuperAdmin.create({
    name: "Super Administrator",
    email: "admin@gmail.com",
    passwordHash: superAdminPasswordHash,
    role: "SUPER_ADMIN",
    isActive: true,
  });

  // Also sync to User for relation compatibility
  await User.create({
    _id: superAdminDoc._id,
    name: "Super Administrator",
    email: "admin@gmail.com",
    passwordHash: superAdminPasswordHash,
    role: "SUPER_ADMIN",
    isActive: true,
  });

  // ── 3. Create Verification Officer ──
  const officer = await User.create({
    name: "Verification Officer",
    email: "officer1@aicte.gov.in",
    passwordHash,
    role: "VERIFICATION_OFFICER",
    isActive: true,
  });
  console.log("✅ Super Admin + Verification Officer created\n");

  // ── 4. Create Institution Admins & Faculty ──
  console.log("👥 Creating institution admins and faculty...");
  const deptCodes = [
    { code: "CSE", name: "Computer Science & Engineering", faculty: "faculty.cse" },
    { code: "ECE", name: "Electronics & Communication", faculty: "faculty.ece" },
    { code: "MECH", name: "Mechanical Engineering", faculty: "faculty.mech" },
    { code: "IT", name: "Information Technology", faculty: "faculty.it" },
  ];

  const allDepartments: { _id: mongoose.Types.ObjectId; code: string; name: string; institutionId: mongoose.Types.ObjectId }[] = [];
  const allCourses: { _id: mongoose.Types.ObjectId; institutionId: mongoose.Types.ObjectId; departmentId: mongoose.Types.ObjectId; totalSemesters: number }[] = [];

  for (const inst of institutions) {
    // Institution Admin
    const instAdmin = await User.create({
      name: `Admin - ${inst.name.split(" ")[0]}`,
      email: `admin.${inst.name.split(" ")[0].toLowerCase()}@edu.in`,
      passwordHash,
      role: "INSTITUTION_ADMIN",
      institutionId: inst._id,
      isActive: true,
    });

    // Create departments for this institution
    for (const dept of deptCodes) {
      const department = await Department.create({
        institutionId: inst._id,
        name: dept.name,
        code: dept.code,
        hodName: `Dr. HOD ${dept.code}`,
      });
      allDepartments.push({ _id: department._id, code: dept.code, name: dept.name, institutionId: inst._id });

      // Create a course
      const course = await Course.create({
        institutionId: inst._id,
        departmentId: department._id,
        title: `B.Tech ${dept.name}`,
        code: `BTECH-${dept.code}`,
        durationYears: 4,
        totalSemesters: 8,
      });
      allCourses.push({ _id: course._id, institutionId: inst._id, departmentId: department._id, totalSemesters: 8 });

      // Create subjects for semesters 1-6
      for (let sem = 1; sem <= 6; sem++) {
        const subjects = [
          { code: `${dept.code}${sem}01`, name: `${dept.code} Subject ${sem}-1`, credits: 4 },
          { code: `${dept.code}${sem}02`, name: `${dept.code} Subject ${sem}-2`, credits: 3 },
          { code: `${dept.code}${sem}03`, name: `${dept.code} Subject ${sem}-3`, credits: 3 },
        ];
        for (const subj of subjects) {
          await Subject.create({
            courseId: course._id,
            semester: sem,
            code: subj.code,
            name: subj.name,
            credits: subj.credits,
          });
        }
      }

      // Create faculty (first institution gets all 4, others get 1)
      const numFaculty = inst === institutions[0] ? 1 : (inst === institutions[1] ? 1 : 0);
      for (let f = 0; f < numFaculty; f++) {
        await User.create({
          name: `Faculty ${dept.code} - ${inst.name.split(" ")[0]}`,
          email: `${dept.faculty}@${inst.name.split(" ")[0].toLowerCase()}.edu.in`,
          passwordHash,
          role: "FACULTY",
          institutionId: inst._id,
          departmentId: department._id,
          isActive: true,
        });
      }
    }
  }
  console.log(`✅ Created institution admins, faculty, ${allDepartments.length} departments, courses, and subjects\n`);

  // ── 5. Create Students ──
  console.log("🎓 Creating students...");
  const firstNames = ["Arun", "Priya", "Karthik", "Divya", "Vignesh", "Sneha", "Rahul", "Anitha", "Deepak", "Meena",
    "Suresh", "Kavya", "Mohan", "Lakshmi", "Raj", "Bhavani", "Vijay", "Saranya", "Kumar", "Pooja"];
  const lastNames = ["Kumar", "Sharma", "Reddy", "Nair", "Iyer", "Pillai", "Menon", "Das", "Nair", "Rao"];

  const allStudents: { _id: mongoose.Types.ObjectId; userId: mongoose.Types.ObjectId; institutionId: mongoose.Types.ObjectId; departmentId: mongoose.Types.ObjectId }[] = [];
  let studentCount = 0;

  for (const inst of institutions) {
    const instDepts = allDepartments.filter((d) => d.institutionId.equals(inst._id));
    const numStudents = inst === institutions[0] ? 25 : (inst === institutions[1] ? 18 : 10);

    for (let i = 0; i < numStudents; i++) {
      const dept = instDepts[i % instDepts.length];
      const fullName = `${firstNames[i % firstNames.length]} ${lastNames[(i + 3) % lastNames.length]}`;
      const registerNumber = `${20}${dept.code}${String(i + 1).padStart(3, "0")}`;
      const email =
        i === 0 && inst === institutions[0]
          ? "arun.kumar@chennai.edu.in"
          : `${fullName.toLowerCase().replace(/\s+/g, ".")}${studentCount + 1}@${inst.name.split(" ")[0].toLowerCase()}.edu.in`;

      // ~80% of students have APAAR IDs
      const hasApaar = Math.random() > 0.2;
      const apaarId = hasApaar
        ? String(980000000000 + studentCount * 137 + studentCount).substring(0, 12)
        : undefined;

      const user = await User.create({
        name: fullName,
        email,
        passwordHash,
        role: "STUDENT",
        institutionId: inst._id,
        departmentId: dept._id,
        isActive: true,
      });

      const student = await Student.create({
        userId: user._id,
        institutionId: inst._id,
        departmentId: dept._id,
        registerNumber,
        apaarId,
        fullName,
        dateOfBirth: new Date(2003 + (i % 4), i % 12, (i % 28) + 1),
        gender: i % 3 === 0 ? "MALE" : i % 3 === 1 ? "FEMALE" : "OTHER",
        admissionYear: 2022 + (i % 3),
        currentSemester: (i % 6) + 1,
        academicStatus: "ACTIVE",
      });

      allStudents.push({ _id: student._id, userId: user._id, institutionId: inst._id, departmentId: dept._id });
      studentCount++;
    }
  }
  console.log(`✅ Created ${studentCount} students (${allStudents.filter(() => true).length} total)\n`);

  // ── 6. Create Academic Records ──
  console.log("📚 Creating academic records...");
  let recordCount = 0;

  for (const student of allStudents) {
    // Each student gets 2-4 semester records
    const numSemesters = 2 + (recordCount % 3);
    for (let sem = 1; sem <= numSemesters; sem++) {
      const subjects = await Subject.find({ courseId: allCourses.find((c) => c.institutionId.equals(student.institutionId))!._id, semester: sem }).lean();

      if (subjects.length === 0) continue;

      const subjectResults = subjects.map((subj) => {
        const marks = 50 + Math.floor(Math.random() * 50);
        const percentage = (marks / 100) * 100;
        const { grade, gradePoint, result } = calculateGradePoint(percentage);
        return {
          subjectId: subj._id,
          subjectCode: subj.code,
          subjectName: subj.name,
          credits: subj.credits,
          marksObtained: marks,
          maxMarks: 100,
          grade,
          gradePoint,
          result,
        };
      });

      const { totalCredits, sgpa } = computeSgpa(subjectResults);

      // 60% verified, 20% submitted, 20% draft
      const rand = Math.random();
      const status = rand < 0.6 ? "VERIFIED" : rand < 0.8 ? "SUBMITTED" : "DRAFT";

      await AcademicRecord.create({
        studentId: student._id,
        institutionId: student.institutionId,
        academicYear: `202${sem - 1}-202${sem}`,
        semester: sem,
        subjects: subjectResults,
        totalCredits,
        sgpa,
        status,
        version: 1,
        submittedBy: student.userId,
        submittedAt: status !== "DRAFT" ? new Date() : undefined,
        verifiedAt: status === "VERIFIED" ? new Date() : undefined,
      });
      recordCount++;
    }
  }
  console.log(`✅ Created ${recordCount} academic records\n`);

  // ── 7. Create Verification Requests ──
  console.log("🔍 Creating verification requests...");
  const submittedRecords = await AcademicRecord.find({ status: { $in: ["SUBMITTED", "VERIFIED"] } }).lean();
  let vrCount = 0;

  for (const record of submittedRecords) {
    const status = record.status === "VERIFIED" ? "VERIFIED" : "PENDING";
    const vr = await VerificationRequest.create({
      requestId: `VR-2026-${String(vrCount + 1).padStart(4, "0")}`,
      studentId: record.studentId,
      institutionId: record.institutionId,
      targetType: "ACADEMIC_RECORD",
      targetId: record._id,
      submittedBy: record.submittedBy || record.studentId,
      status,
      decisionRemarks: status === "VERIFIED" ? "All marks verified and consistent with uploaded documents." : undefined,
      decidedAt: status === "VERIFIED" ? new Date() : undefined,
      assignedOfficerId: status === "VERIFIED" ? officer._id : undefined,
    });
    vrCount++;
  }
  console.log(`✅ Created ${vrCount} verification requests\n`);

  // ── Summary ──
  console.log("\n═══════════════════════════════════════════════════");
  console.log("✅ Seeding completed successfully!\n");
  console.log("📊 Summary:");
  console.log(`   Institutions:       ${institutions.length}`);
  console.log(`   Users (all roles):  ${await User.countDocuments()}`);
  console.log(`   Departments:         ${allDepartments.length}`);
  console.log(`   Students:            ${studentCount}`);
  console.log(`   Academic Records:    ${recordCount}`);
  console.log(`   Verification Reqs:   ${vrCount}`);
  console.log("\n📋 Demo Login Credentials:");
  console.log("   Super Admin:         admin@gmail.com (Password: Admin@123) [Table: super_admins]");
  console.log("   Verification Officer: officer1@aicte.gov.in (Password: Demo@12345)");
  console.log(`   Inst Admin (CIT):  admin.chennai@edu.in`);
  console.log(`   Faculty (CSE):     faculty.cse@chennai.edu.in`);
  console.log("   Student:           arun.kumar@chennai.edu.in");
  console.log("═══════════════════════════════════════════════════\n");

  await mongoose.disconnect();
}

runSeeder().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
