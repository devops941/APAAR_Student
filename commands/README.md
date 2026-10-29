# APAAR Platform — Implementation Phases & Command Index

This folder contains the complete, dedicated phase-by-phase specifications and developer execution commands for building the **APAAR ID-Based Student Data Management & Verification Platform** (AICTE Problem Statement).

---

## 📑 Phase-by-Phase Detailed Specifications

Click any phase below for its complete architectural specs, Mongoose schemas, API route contracts, security rules, and CLI commands:

| Phase | Dedicated Specification File | Key Focus Area |
|---|---|---|
| **Phase 0** | [PHASE_00_REPO_AND_PLAN.md](file:///d:/gokul/collage%20project/APAAR%20Student/commands/PHASE_00_REPO_AND_PLAN.md) | Next.js App Router, TypeScript strict mode, Tailwind CSS Teal tokens, Zod env validation |
| **Phase 1** | [PHASE_01_FOUNDATION_DB.md](file:///d:/gokul/collage%20project/APAAR%20Student/commands/PHASE_01_FOUNDATION_DB.md) | Cached Mongoose connection, standardized API response envelopes, `/api/health` |
| **Phase 2** | [PHASE_02_AUTH_AND_RBAC.md](file:///d:/gokul/collage%20project/APAAR%20Student/commands/PHASE_02_AUTH_AND_RBAC.md) | Secure HttpOnly cookies, 5 personas RBAC matrix, Bcrypt hashing, `/api/auth/login`, `/api/me` |
| **Phase 3** | [PHASE_03_INSTITUTION_MODULE.md](file:///d:/gokul/collage%20project/APAAR%20Student/commands/PHASE_03_INSTITUTION_MODULE.md) | Institution onboarding, approval state machine (`DRAFT` ➔ `VERIFIED`), Super Admin review |
| **Phase 4** | [PHASE_04_STUDENT_AND_APAAR.md](file:///d:/gokul/collage%20project/APAAR%20Student/commands/PHASE_04_STUDENT_AND_APAAR.md) | Student schema, APAAR masking (`XXXXXXXX1234`), unique partial indexes, batch CSV import engine |
| **Phase 5** | [PHASE_05_ACADEMIC_RECORDS.md](file:///d:/gokul/collage%20project/APAAR%20Student/commands/PHASE_05_ACADEMIC_RECORDS.md) | Department/Course/Subject catalog, semester marksheets, immutable record versioning, SGPA engine |
| **Phase 6** | [PHASE_06_DOCUMENT_MANAGEMENT.md](file:///d:/gokul/collage%20project/APAAR%20Student/commands/PHASE_06_DOCUMENT_MANAGEMENT.md) | Secure private storage, SHA-256 cryptographic hash calculation, access-controlled streaming |
| **Phase 7** | [PHASE_07_VERIFICATION_WORKFLOW.md](file:///d:/gokul/collage%20project/APAAR%20Student/commands/PHASE_07_VERIFICATION_WORKFLOW.md) | Officer review queue, side-by-side evidence inspection, anti-self-approval rule, immutable events |
| **Phase 8** | [PHASE_08_STUDENT_PORTAL.md](file:///d:/gokul/collage%20project/APAAR%20Student/commands/PHASE_08_STUDENT_PORTAL.md) | Student self-service, interactive APAAR reveal with audit, semester timeline, consent log |
| **Phase 9** | [PHASE_09_ANALYTICS_AND_AUDIT.md](file:///d:/gokul/collage%20project/APAAR%20Student/commands/PHASE_09_ANALYTICS_AND_AUDIT.md) | Executive Recharts dashboards, role-scoped KPIs, queryable compliance audit log explorer |
| **Phase 10** | [PHASE_10_QA_SEED_DEPLOYMENT.md](file:///d:/gokul/collage%20project/APAAR%20Student/commands/PHASE_10_QA_SEED_DEPLOYMENT.md) | Vitest automated test suite, synthetic demo data seeder (3 institutions, 50+ students), Docker |

---

## 🛠️ General Reference Guides

- [SETUP_COMMANDS.md](file:///d:/gokul/collage%20project/APAAR%20Student/commands/SETUP_COMMANDS.md) — Quick terminal copy-paste cheatsheet for setup, dev server, test runs, and database seeding.
- [PHASE_IMPLEMENTATION_PLAN.md](file:///d:/gokul/collage%20project/APAAR%20Student/commands/PHASE_IMPLEMENTATION_PLAN.md) — High-level summary of all phases combined into a single document.
