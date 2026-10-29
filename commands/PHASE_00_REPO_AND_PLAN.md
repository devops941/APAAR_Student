# Phase 0: Repository, Environment & Base Setup

## 🎯 1. Phase Objective & Overview
Phase 0 establishes the engineering bedrock for the **APAAR ID-Based Student Data Management & Verification Platform** (AICTE Problem Statement). It sets up Next.js 14+ (App Router), TypeScript in strict mode, Tailwind CSS styling tokens, unified directory structure, and runtime environment variable validation using Zod.

No feature logic or database queries exist in Phase 0. The goal is a clean, bootable development shell where code conventions and design tokens are strictly configured.

---

## 🛠️ 2. Technical Stack & Architecture Configuration

### 2.1 Project Specification
- **Framework**: Next.js App Router (`src/` directory pattern)
- **Language**: TypeScript (`strict: true`, no implicit `any`)
- **Styling**: Tailwind CSS with CSS Variables & semantic brand palette
- **Icons**: `lucide-react`
- **Validation**: `zod` for type-safe environment variables and future DTOs
- **Package Manager**: `npm`

### 2.2 Color Palette & Design Tokens
Based on Section 9 of the Specification:
- **Canvas / Background**: `#F7F9FC`
- **Surface / Card**: `#FFFFFF`
- **Border / Divider**: `#E2E8F0`
- **Primary Brand (Action)**: `#0F766E` (Deep Teal)
- **Primary Hover**: `#115E59`
- **Ink / Headings**: `#14263D`
- **Body Text**: `#334155`
- **Muted Text**: `#64748B`
- **Success Token**: `#15803D`
- **Warning Token**: `#B45309`
- **Danger Token**: `#B42318`
- **Info Token**: `#2563EB`

---

## 📂 3. Target Directory Structure
```
apaar-platform/
├── commands/                     # Phase documentation and command scripts
├── public/                       # Static public assets, icons
├── src/
│   ├── app/
│   │   ├── (public)/             # Login, Forgot Password, Landing
│   │   ├── (portal)/             # Authenticated Dashboard, Institutions, Students
│   │   ├── api/                  # Route Handlers (/api/auth, /api/health, etc.)
│   │   ├── globals.css           # Custom CSS variables & base typography
│   │   ├── layout.tsx            # Root HTML & Inter font provider
│   │   ├── error.tsx             # Global error boundary
│   │   ├── not-found.tsx         # Custom 404
│   │   └── loading.tsx           # Initial loading skeleton
│   ├── components/
│   │   ├── ui/                   # Reusable button, input, dialog, card, badge
│   │   ├── layout/               # Sidebar, Header, Breadcrumbs, TenantSelector
│   │   ├── forms/                # Form field wrappers, error messages
│   │   └── data-table/           # TanStack Table pagination, sorting, search
│   ├── features/                 # Domain-specific UI components
│   │   ├── auth/
│   │   ├── institutions/
│   │   ├── students/
│   │   ├── academic-records/
│   │   ├── documents/
│   │   ├── verification/
│   │   └── analytics/
│   ├── lib/
│   │   ├── env.ts                # Zod environment variable parser
│   │   ├── db/
│   │   │   └── mongoose.ts       # Global cached Mongoose connection
│   │   ├── auth/                 # Session & cookie helpers
│   │   ├── permissions.ts        # RBAC & tenant scoping matrix
│   │   ├── api-response.ts       # Standardized JSON response envelopes
│   │   └── logger.ts             # Server-side audit & debug logger
│   ├── models/                   # Mongoose schemas (User, Student, Institution...)
│   ├── types/                    # Shared TypeScript interfaces & DTOs
│   └── validators/               # Zod validation schemas for requests
├── .env.example                  # Safe template environment variables
├── .env.local                    # Local development secrets (git-ignored)
├── next.config.ts                # Next.js compiler settings
├── tailwind.config.ts            # Custom colors & typography
├── tsconfig.json                 # Strict TypeScript configuration
└── package.json
```

---

## 💻 4. Code Specifications & Implementation Files

### 4.1 Environment Validation (`src/lib/env.ts`)
```typescript
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_NAME: z.string().default("APAAR Student Academic Platform"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters long"),
  STORAGE_LOCAL_PATH: z.string().default("./uploads"),
  MAX_FILE_SIZE_MB: z.coerce.number().default(5),
});

export const env = envSchema.parse(process.env);
```

### 4.2 Tailwind Theme Configuration (`tailwind.config.ts`)
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F9FC",
        surface: "#FFFFFF",
        border: "#E2E8F0",
        ink: {
          DEFAULT: "#14263D",
          light: "#334155",
          muted: "#64748B",
        },
        primary: {
          DEFAULT: "#0F766E",
          hover: "#115E59",
          light: "#F0FDFA",
        },
        status: {
          success: "#15803D",
          warning: "#B45309",
          danger: "#B42318",
          info: "#2563EB",
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## ⚡ 5. Step-by-Step Terminal Commands

Run in workspace root:
```powershell
# 1. Initialize Next.js project
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm

# 2. Install base dependencies
npm install zod lucide-react clsx tailwind-merge

# 3. Create .env.example
@"
NODE_ENV=development
NEXT_PUBLIC_APP_NAME="APAAR Student Academic Platform"
APP_URL=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017/apaar_platform
AUTH_SECRET=development_secret_key_minimum_32_characters_long_12345
STORAGE_LOCAL_PATH=./uploads
MAX_FILE_SIZE_MB=5
"@ | Out-File -FilePath .env.example -Encoding utf8

# 4. Copy to .env.local
Copy-Item .env.example .env.local

# 5. Verify Next.js dev server boots
npm run dev
```

---

## ✅ 6. Definition of Done (Exit Criteria)
1. Next.js app builds cleanly with `npm run build` without TypeScript errors.
2. `npm run dev` boots server on `http://localhost:3000`.
3. `env.ts` throws descriptive error if mandatory variables (`MONGODB_URI`, `AUTH_SECRET`) are missing.
4. Tailwind custom palette classes (e.g. `bg-canvas`, `text-primary`, `border-border`) apply correctly.
5. No business logic or database dependencies exist yet.
