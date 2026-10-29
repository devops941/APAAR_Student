# APAAR Platform — Developer Commands Reference Cheat Sheet

This document contains all CLI commands required to set up, develop, test, seed, and build the **APAAR ID-Based Student Data Management & Verification Platform**.

---

## 🚀 1. Initial Setup & Dependencies (Phase 0)

Run these commands inside your project root (`d:\gokul\collage project\APAAR Student`):

```powershell
# 1. Initialize Next.js with App Router, TypeScript, Tailwind CSS, ESLint
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm

# 2. Install core runtime packages (MongoDB, Zod, Forms, Icons, Security)
npm install mongoose zod react-hook-form @hookform/resolvers lucide-react bcryptjs clsx tailwind-merge recharts

# 3. Install developer types and utilities
npm install -D @types/bcryptjs @types/node

# 4. Install Vitest and React Testing Library
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

---

## ⚙️ 2. Environment Configuration (`.env.local`)

Create `.env.local` in the project root:

```env
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_NAME="APAAR Student Academic Platform"
APP_URL=http://localhost:3000

# Database (Local MongoDB or Atlas URI)
MONGODB_URI=mongodb://127.0.0.1:27017/apaar_platform

# Session & Authentication Secret (Generate with: openssl rand -base64 32)
AUTH_SECRET=super_secret_apaar_jwt_key_2026_dev_mode_only

# Optional Private File Storage
STORAGE_LOCAL_PATH=./uploads
MAX_FILE_SIZE_MB=5
```

---

## 🏃 3. Development Server Execution

```powershell
# Start local Next.js development server
npm run dev

# Starts on http://localhost:3000
```

---

## 🧪 4. Testing & Code Quality Commands

```powershell
# Run TypeScript compilation check
npx tsc --noEmit

# Run ESLint check
npm run lint

# Run Vitest unit & integration test suite
npx vitest run

# Run Vitest in watch mode (during active development)
npx vitest
```

---

## 📦 5. Database Seeding (Phase 10)

Populates 3 institutions, 50+ students, 120 academic records, and 5 roles for demonstration:

```powershell
# Run seed script using tsx or node
npx tsx src/scripts/seed.ts
```

### Default Demo Credentials Created by Seeder:
| Role | Email | Password |
|---|---|---|
| **Super Admin** | `superadmin@apaar.edu.in` | `Admin@12345` |
| **Institution Admin** | `admin.chennai@nit.edu.in` | `NitAdmin@123` |
| **Faculty (CSE)** | `faculty.cse@nit.edu.in` | `Faculty@123` |
| **Verification Officer** | `officer1@aicte.gov.in` | `Officer@123` |
| **Student** | `student.arun@nit.edu.in` | `Student@123` |

---

## 🏗️ 6. Production Build & Validation

```powershell
# Build production bundle
npm run build

# Start production server
npm run start
```

---

## 🐳 7. Docker Quickstart (Optional)

```powershell
# Build and run Next.js app and MongoDB together
docker-compose up -d --build

# View container logs
docker-compose logs -f
```
