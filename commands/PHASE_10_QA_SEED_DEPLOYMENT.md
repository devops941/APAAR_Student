# Phase 10: QA, Synthetic Seeding & Production Deployment

## 🎯 1. Phase Objective & Overview
Phase 10 is the final capstone phase ensuring high stability, full compliance, and immediate evaluation readiness:
1. **Automated Testing Suite**: Implements unit, integration, and end-to-end acceptance tests based on Section 13 of the AICTE Specification.
2. **Synthetic Demo Data Seeder**: Generates realistic, fully linked mock records across 3 institutions, 5 personas, 50+ students, 120+ semester records, and 30+ verification events.
3. **Production Containerization**: Multi-stage `Dockerfile` and `docker-compose.yml` allowing one-command deployment anywhere.
4. **Documentation & Presentation Readiness**: Clear developer and judge walkthrough instructions.

---

## 🧪 2. Testing Suite Strategy & Specs

```powershell
# Install test dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

### 2.1 Critical Unit Tests (`tests/unit/`)
1. **`apaar.test.ts`**:
   - Validates that 12-digit string parses successfully.
   - Rejects 11-digit or non-numeric inputs.
   - Verifies `maskApaarId("123456789012")` strictly outputs `"XXXXXXXX9012"`.
2. **`grading.test.ts`**:
   - Confirms grade point allocation (91+ is O, 81+ is A+, etc.).
   - Computes weighted SGPA accurately for multiple subjects.
3. **`permissions.test.ts`**:
   - Asserts role hierarchy and cross-tenant block.

### 2.2 Critical Integration Tests (`tests/integration/`)
1. **`auth.test.ts`**: Login with invalid credentials returns `401`; valid login sets `HttpOnly` cookie.
2. **`tenant-isolation.test.ts`**: Institution Admin of College A attempting to query a student of College B receives `403 FORBIDDEN`.
3. **`verification-workflow.test.ts`**:
   - Faculty submits record ➔ Status becomes `SUBMITTED`.
   - Submitter attempts to self-verify ➔ Throws `Conflict of Interest` error.
   - Verification Officer reviews and marks `VERIFIED` ➔ Record is locked.

---

## 🌱 3. Synthetic Seed Script (`src/scripts/seed.ts`)

Populates rich demo data so that review presentations and screenshots are fully functional out of the box.

```typescript
// Run via: npx tsx src/scripts/seed.ts
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Institution } from "../models/Institution";
import { Department, Course, Subject } from "../models/Catalog";
import { Student } from "../models/Student";
import { AcademicRecord } from "../models/AcademicRecord";
import { VerificationRequest } from "../models/VerificationRequest";

export async function runSeeder() {
  console.log("🌱 Starting APAAR Platform Synthetic Seeder...");

  // 1. Create Institutions
  // - Chennai Institute of Technology (CIT-TN-01)
  // - Coimbatore Engineering College (CEC-TN-02)
  // - Madurai Institute of Science (MIS-TN-03)

  // 2. Create Users across all 5 roles
  const passwordHash = await bcrypt.hash("Demo@12345", 10);

  // 3. Create Departments (CSE, ECE, MECH, IT) & Courses & Subjects

  // 4. Create Arun Kumar (Register: 22CSE101, fictional APAAR: 987654321098)
  // + 50 Synthetic Students

  // 5. Create Semester 1 to 6 Marksheets

  // 6. Generate Verification Requests (20 Verified, 8 Pending, 4 Correction Requested)

  console.log("✅ Seeding completed successfully!");
}
```

### Pre-Configured Demo Accounts for Presentation:
| Role | Email | Password | Scope |
|---|---|---|---|
| **Super Admin** | `superadmin@aicte.gov.in` | `Demo@12345` | Global Platform Overview |
| **Institution Admin** | `admin@citchennai.edu.in` | `Demo@12345` | Chennai Inst. of Technology |
| **Faculty (CSE)** | `faculty.cse@citchennai.edu.in` | `Demo@12345` | Department Mark Entry |
| **Verification Officer** | `officer1@aicte.gov.in` | `Demo@12345` | Verification Queue Review |
| **Student** | `arun.kumar@citchennai.edu.in` | `Demo@12345` | Student Self-Service Portal |

---

## 🐳 4. Dockerization & Deployment

### 4.1 Multi-Stage `Dockerfile`
```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### 4.2 `docker-compose.yml`
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: apaar-mongo
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  web:
    build: .
    container_name: apaar-web
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/apaar_platform
      - AUTH_SECRET=production_long_secure_secret_key_987654321
    depends_on:
      - mongodb

volumes:
  mongo_data:
```

---

## ⚡ 5. Execution Commands

```powershell
# 1. Run all automated tests
npx vitest run

# 2. Run TypeScript check
npx tsc --noEmit

# 3. Seed demo data
npx tsx src/scripts/seed.ts

# 4. Production build check
npm run build
```

---

## ✅ 6. Definition of Done
1. All unit and integration test suites pass with 0 errors.
2. `npx tsx src/scripts/seed.ts` populates MongoDB with complete sample data.
3. Every test fixture uses clearly labeled fictional synthetic identities.
4. Next.js production build (`npm run build`) completes cleanly.
5. Platform is demo-ready with working logins for all 5 stakeholder personas.
