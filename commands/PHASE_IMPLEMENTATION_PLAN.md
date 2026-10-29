# APAAR ID-Based Student Data Management & Verification Platform
## Comprehensive Phase-by-Phase Implementation Blueprint

> **Reference Specification**: AICTE Problem Statement — *Development of an APAAR ID-Based Student Data Management and Verification Platform for AICTE-Approved Institutions* (Version 1.0, October 2026).
> **Target Stack**: Next.js App Router (TypeScript) · Next.js Route Handlers · MongoDB + Mongoose · Zod · Tailwind CSS + Lucide Icons · Vitest.

---

## 📌 Executive Summary & Architectural Principles

1. **Role-Based Access Control (RBAC) + Resource Scoping**:
   - `SUPER_ADMIN`: Global governance, institution approval, audit logs.
   - `INSTITUTION_ADMIN`: Manages own institution's departments, faculty, students, academic records.
   - `FACULTY / DEPARTMENT_ADMIN`: Manages department-specific academic data and mark entry.
   - `STUDENT`: Self-service portal to view academic history, masked APAAR ID, upload documents, manage consent.
   - `VERIFICATION_OFFICER`: Reviews submitted records and documents, executes verification decisions (Approve / Reject / Correction Required).
2. **Security & Boundary Isolation**:
   - Zero direct MongoDB queries from client React components.
   - All mutations run through Route Handlers with session checks, Zod schema validation, and institution tenancy enforcement.
   - Passwords hashed with `Argon2id` or `bcrypt` (salt rounds 12).
   - Sessions managed via secure `HttpOnly`, `SameSite=Lax`, `Secure` cookies.
   - Sensitive APAAR ID masked by default (`XXXXXXXX1234`).
3. **No Fake Integrations Boundary**:
   - This platform is a demonstration & enterprise workflow system. It does **not** assert official DigiLocker / ABC / AICTE API connections without authorized live credentials. Synthetic demo data is used throughout.

---

## 🗺️ Master Phase Roadmap (Phases 0 — 10)

| Phase | Title | Scope & Core Deliverables | Exit Criteria (Definition of Done) |
|---|---|---|---|
| **Phase 0** | **Repository & Environment Setup** | Next.js App Router initialization, TypeScript config, Tailwind design system, base folder structure, environment validation schema. | Clean build, strict TypeScript pass, dev server boots on `:3000`. |
| **Phase 1** | **Foundation & Database Layer** | Cached MongoDB Mongoose connection, standardized API response envelopes (`{success, data, error, meta}`), global error handlers, health check endpoint. | `/api/health` returns `200 OK` with DB connection status; error middleware verified. |
| **Phase 2** | **Authentication, Session & RBAC** | Custom secure cookie session / Auth.js, user schema, password hashing, role guard middlewares, login/logout, `/api/me`. | Protected route blocks unauthenticated requests; role matrix tests pass. |
| **Phase 3** | **Institution Management** | Institution schema, state machine (`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `VERIFIED`/`REJECTED`), Super Admin approval queue UI. | Institution lifecycle transitions work; tenant isolation verified. |
| **Phase 4** | **Student & APAAR Management** | Student schema with unique partial index on APAAR ID, Register Number index, Student CRUD, CSV preview & batch import engine with error reporting. | Duplicate APAAR rejected safely; CSV import parses valid & rejects invalid rows. |
| **Phase 5** | **Course Catalog & Academic Records** | Department, Course, Subject catalog, Semester records schema, SGPA calculation helper, submission workflow (`DRAFT` → `SUBMITTED`). | Grade submissions persist with immutable versioning; no silent overwrites of verified records. |
| **Phase 6** | **Document Management** | Secure file upload handler, SHA-256 integrity hash calculation, metadata store, authenticated download route with permission checks. | Direct public file access blocked; file tampering detected via hash mismatch. |
| **Phase 7** | **Verification Workflow** | Review queue for Verification Officers, side-by-side evidence inspection panel, state transition engine (`VERIFIED`, `REJECTED`, `CORRECTION_REQUIRED`). | Segregation of duties enforced (submitter cannot approve own record); transition history audited. |
| **Phase 8** | **Student Portal** | Self-service student dashboard, masked APAAR ID with interactive reveal, semester grade sheets, document status, sharing consent toggle. | Student can view ONLY their own data; consent audit events emitted. |
| **Phase 9** | **Dashboards, Analytics & Audit Logs** | Role-scoped KPI cards, Recharts visualizations (verification stats, institution coverage), queryable audit trail table. | No sensitive PII exposed in dashboard aggregates; full mutation audit log viewable by admins. |
| **Phase 10** | **QA, Synthetic Seeding & Deployment** | End-to-end user journeys test suite (Vitest + Playwright), synthetic seed script (3 institutions, 50+ students, 100+ records), Dockerfile & setup guide. | Automated tests pass 100%; seed script populates demo data cleanly. |

---

## 🔬 Detailed Phase Specifications

### 🔹 Phase 0: Repository & Environment Setup
- **Goal**: Scaffold Next.js project with App Router, TypeScript, Tailwind CSS, Lucide Icons, and strict configs.
- **Tasks**:
  1. Initialize Next.js project inside workspace root.
  2. Configure `tailwind.config.ts` with brand tokens:
     - Primary: Deep Teal (`#0F766E`, hover `#115E59`)
     - Canvas: Light Neutral (`#F7F9FC`)
     - Ink/Typography: Dark Slate (`#14263D`, `#334155`)
     - Status tokens: Success (`#15803D`), Warning (`#B45309`), Danger (`#B42318`).
  3. Create environment variable validation schema using `zod` (`src/lib/env.ts`).
  4. Setup recommended folder structure (`src/app`, `src/components`, `src/lib`, `src/models`, `src/services`, `src/types`).
- **Commands**:
  ```bash
  # Initialize Next.js app in current directory
  npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm

  # Core runtime dependencies
  npm install mongoose zod react-hook-form @hookform/resolvers lucide-react bcryptjs clsx tailwind-merge
  npm install -D @types/bcryptjs

  # Testing framework
  npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
  ```

---

### 🔹 Phase 1: Foundation & Database Layer
- **Goal**: Establish rock-solid database connectivity, consistent error handling, and API envelope contracts.
- **Key Files**:
  - `src/lib/db/mongoose.ts`: Global cached MongoDB connection helper (prevents duplicate connections during hot reload).
  - `src/lib/api-response.ts`: Typed standard responses:
    - Success: `{ success: true, data: T, meta?: Record<string, unknown> }`
    - Error: `{ success: false, error: { code: string, message: string, details?: unknown }, requestId: string }`
  - `src/app/api/health/route.ts`: Database health check returning ping status, uptime, and database name.
- **Verification**: Run `curl http://localhost:3000/api/health` and verify DB status is `connected`.

---

### 🔹 Phase 2: Authentication, Session & RBAC
- **Goal**: Implement secure credential-based login, role-based session handling, and server-side authorization guards.
- **Key Deliverables**:
  - `src/models/User.ts`:
    - Fields: `name`, `email` (unique, lowercase), `passwordHash`, `role` (`SUPER_ADMIN`, `INSTITUTION_ADMIN`, `FACULTY`, `STUDENT`, `VERIFICATION_OFFICER`), `institutionId` (ref), `departmentId` (ref), `isActive`.
  - `src/lib/auth/session.ts`: JWT / sealed cookie session handler utilizing `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
  - `src/lib/auth/guards.ts`: `requireAuth()`, `requireRole([...])`, `requireInstitutionScope(targetInstitutionId)`.
  - API Routes:
    - `POST /api/auth/login`: Authenticates user, checks `isActive`, sets session cookie.
    - `POST /api/auth/logout`: Clears session cookie.
    - `GET /api/me`: Returns sanitized current user profile with roles and institution context.
  - UI: Modern split-screen login page with accessible form inputs and validation feedback.

---

### 🔹 Phase 3: Institution Management Module
- **Goal**: Onboarding, profile management, and approval workflow for educational institutions.
- **Key Deliverables**:
  - `src/models/Institution.ts`:
    - Fields: `name`, `code` (unique uppercase, e.g. `AICTE-TN-042`), `category` (`ENGINEERING`, `POLYTECHNIC`, `MANAGEMENT`, `ARTS_SCIENCE`), `address`, `state`, `district`, `contactEmail`, `contactPhone`, `principalName`, `approvalReference`, `status` (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`), `reviewerId`, `reviewRemarks`.
  - API Endpoints:
    - `GET /api/institutions`: Filtered by status and search terms (Super Admin sees all; Institution Admin sees own).
    - `POST /api/institutions`: Creates draft institution profile.
    - `GET/PATCH /api/institutions/[id]`: Retrieve/update institution details.
    - `POST /api/institutions/[id]/review`: Super Admin review action (transitions state to `VERIFIED` or `REJECTED`).
  - UI: Institution directory table, status badges, and review modal.

---

### 🔹 Phase 4: Student Registration & APAAR ID Management
- **Goal**: Maintain student master profiles with APAAR ID handling, duplicate prevention, and batch CSV onboarding.
- **Key Deliverables**:
  - `src/models/Student.ts`:
    - Fields: `userId` (ref), `institutionId` (ref), `departmentId` (ref), `registerNumber` (string), `apaarId` (12-digit string, optional initially), `fullName`, `dateOfBirth`, `gender`, `admissionYear`, `currentSemester`, `academicStatus` (`ACTIVE`, `GRADUATED`, `TRANSFERRED`, `WITHDRAWN`).
    - Indexes:
      - `{ apaarId: 1 }` with `unique: true, partialFilterExpression: { apaarId: { $type: "string" } }`
      - `{ institutionId: 1, registerNumber: 1 }` unique composite index.
  - Utilities:
    - `src/lib/utils/apaar.ts`: Normalization, regex check (`^[0-9]{12}$`), masking function (`maskApaarId("123456789012")` -> `XXXXXXXX9012`).
  - Batch Import Engine:
    - `POST /api/students/import`: Accepts CSV payload, performs row-level Zod validation, checks duplicate register numbers / APAAR IDs, returns preview with errors highlighted, and commits valid rows.
  - UI: Student table with search, department filters, single student registration modal, and CSV upload wizard.

---

### 🔹 Phase 5: Course Catalog & Academic Records
- **Goal**: Manage academic structures (Departments, Courses, Subjects) and semester marks with version control.
- **Key Deliverables**:
  - Schemas:
    - `Department` (`name`, `code`, `institutionId`)
    - `Course` (`title`, `code`, `durationYears`, `totalSemesters`, `departmentId`)
    - `Subject` (`code`, `name`, `credits`, `semester`, `courseId`)
    - `AcademicRecord` (`studentId`, `institutionId`, `academicYear`, `semester`, `subjects: [{ subjectId, marks, grade, credits, result }]`, `sgpa`, `cgpa`, `status`: `DRAFT` | `SUBMITTED` | `UNDER_REVIEW` | `VERIFIED` | `CORRECTION_REQUIRED`, `version`: number).
  - Business Rules:
    - If a record is marked `VERIFIED`, it is locked. Any correction creates a new incremented version.
  - API Routes:
    - `GET /api/academic-records`: List records scoped to institution/student.
    - `POST /api/academic-records`: Create/update semester marksheet draft.
    - `POST /api/academic-records/[id]/submit`: Submit draft record into verification queue.
  - UI: Clean grid interface for marks entry, auto-calculating total credits and SGPA.

---

### 🔹 Phase 6: Document Management System
- **Goal**: Secure storage, integrity hashing, and authorized access to student academic documents.
- **Key Deliverables**:
  - `src/models/Document.ts`:
    - Fields: `studentId`, `institutionId`, `documentType` (`ADMISSION_PROOF`, `SEMESTER_MARKSHEET`, `DEGREE_CERTIFICATE`, `TRANSFER_CERTIFICATE`, `BONAFIDE`), `originalFileName`, `mimeType`, `fileSize`, `storageKey`, `sha256Hash`, `status` (`PENDING`, `VERIFIED`, `REJECTED`), `uploadedBy`.
  - Security Rules:
    - Reject executable extensions; only permit `application/pdf`, `image/png`, `image/jpeg` (max 5MB).
    - Compute SHA-256 hash server-side upon upload to detect document tampering.
    - File downloads route `/api/documents/[id]/download` checks ownership and role before streaming. No direct public S3/disk URLs exposed.
  - UI: Document upload dropzone, hash display badge, and secure inline preview modal.

---

### 🔹 Phase 7: Verification Workflow Engine
- **Goal**: Auditable review pipeline for Verification Officers to inspect records and take actions.
- **Key Deliverables**:
  - `src/models/VerificationRequest.ts`:
    - Fields: `requestId` (e.g. `VR-2026-0001`), `studentId`, `recordType` (`ACADEMIC_RECORD`, `DOCUMENT`), `recordId`, `institutionId`, `submittedBy`, `assignedOfficerId`, `status` (`PENDING`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, `CORRECTION_REQUIRED`), `decisionRemarks`, `decisionDate`.
  - `src/models/VerificationEvent.ts`:
    - Immutable audit entry per status transition (`requestId`, `actorId`, `previousStatus`, `newStatus`, `remarks`, `timestamp`).
  - Separation of Duties:
    - Submitter (Faculty/Admin) cannot approve their own submitted request.
  - UI: Officer review queue with priority filters, side-by-side comparison screen (submitted record vs uploaded marksheet), and action confirmation dialogs.

---

### 🔹 Phase 8: Student Self-Service Portal
- **Goal**: Privacy-first portal allowing students to view their verified credentials, academic timeline, and consent logs.
- **Key Deliverables**:
  - Student Dashboard:
    - APAAR ID card widget: Displays `XXXXXXXX1234` with an interactive "Click to Reveal" button requiring re-confirmation.
    - Academic timeline: Visual stepper showing semester results (`Semester 1: Verified`, `Semester 2: In Review`).
    - Document vault: Download verified certificates.
  - Consent & Sharing:
    - View logged external verification inquiries or institution transfer requests.
  - Guardrails:
    - Scoped strictly to the logged-in student's `studentId`. Any attempt to tamper query params triggers an instant `403 Forbidden`.

---

### 🔹 Phase 9: Dashboards, Analytics & Audit Logging
- **Goal**: Executive reporting for Super Admins / Institution Admins and complete compliance auditing.
- **Key Deliverables**:
  - Analytics Engine (`/api/reports/dashboard`):
    - Metrics: Total Students, APAAR ID Adoption Rate, Verified vs Pending Records, Rejection Distribution.
    - Chart widgets via Recharts: Monthly verification throughput, department performance breakdown.
  - `src/models/AuditLog.ts`:
    - Captures: `actorId`, `role`, `action` (`USER_LOGIN`, `STUDENT_CREATED`, `RECORD_SUBMITTED`, `RECORD_VERIFIED`, etc.), `entityType`, `entityId`, `institutionId`, `ipAddress`, `safeChangesSummary`, `occurredAt`.
  - UI: Interactive audit log explorer with time-range filtering and export to CSV.

---

### 🔹 Phase 10: Testing, QA, Seed Data & Deployment
- **Goal**: Comprehensive testing, demo environment population, and production build readiness.
- **Key Deliverables**:
  - Automated Tests:
    - Unit tests: APAAR ID regex & masking, SGPA calculations, RBAC permission checker.
    - Integration tests: Auth flow, cross-tenant isolation, verification state transitions.
  - Synthetic Seed Script (`src/scripts/seed.ts`):
    - 3 Institutions (e.g., *National Institute of Technology Chennai*, *Coimbatore Institute of Engineering*, *Madurai Polytechnic College*).
    - 1 Super Admin, 3 Institution Admins, 5 Faculty, 50 Students with mock APAAR IDs, 120 Academic Records, 40 Verification requests.
    - Pre-configured demo logins with clearly documented credentials.
  - Build & Dockerization:
    - Multi-stage `Dockerfile` and `docker-compose.yml` (Next.js app + MongoDB).

---

## 🔒 Security & Compliance Checklist

- [x] Passwords hashed with `bcryptjs` (salt rounds >= 10).
- [x] APAAR ID masked in all list views and public DTOs.
- [x] Zero direct database queries from client components.
- [x] Tenant scoping checked on every write/read (`where: { institutionId }`).
- [x] File uploads verified by MIME type, size limit, and SHA-256 hashed.
- [x] Segregation of duties enforced: Reviewers cannot self-approve records they submitted.
- [x] Synthetic demo data strictly segregated from any live production environments.
