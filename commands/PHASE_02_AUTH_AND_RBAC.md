# Phase 2: Authentication, Session Management & RBAC

## 🎯 1. Phase Objective & Overview
Phase 2 implements the security foundation of the platform:
1. **User Identity & Role Model**: Supports 5 strict personas: `SUPER_ADMIN`, `INSTITUTION_ADMIN`, `FACULTY`, `STUDENT`, `VERIFICATION_OFFICER`.
2. **Secure Password Hashing**: Passwords stored as irreversible hashes using `bcryptjs` (salt rounds: 12). Plaintext passwords are never stored or logged.
3. **Session & Cookie Security**: Zero storage of access tokens in `localStorage`. Uses encrypted / signed `HttpOnly`, `SameSite=Lax`, `Secure` cookies.
4. **Server-Side Authorization (RBAC + Tenancy Scoping)**:
   - Role determines *what action* is allowed.
   - Institution/Department scope determines *which record* is accessible.
   - URL parameters (`/api/students/[id]`) are **never** treated as authorization.
5. **Anti-Enumeration Login**: Generic error messages to prevent email harvesting.

---

## 🛠️ 2. Dependencies

```powershell
npm install bcryptjs jose react-hook-form @hookform/resolvers
npm install -D @types/bcryptjs
```

---

## 🏛️ 3. Mongoose Schema: `User` (`src/models/User.ts`)

```typescript
import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole =
  | "SUPER_ADMIN"
  | "INSTITUTION_ADMIN"
  | "FACULTY"
  | "STUDENT"
  | "VERIFICATION_OFFICER";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  institutionId?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "FACULTY", "STUDENT", "VERIFICATION_OFFICER"],
      required: true,
      index: true,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: "Institution",
      required: function (this: IUser) {
        return this.role !== "SUPER_ADMIN";
      },
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      index: true,
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
```

---

## 🔒 4. Server-Side Session & Guard Infrastructure

### 4.1 Session Token Engine (`src/lib/auth/session.ts`)
```typescript
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { UserRole } from "@/models/User";

const SECRET_KEY = new TextEncoder().encode(env.AUTH_SECRET);
const COOKIE_NAME = "apaar_session_token";

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  institutionId?: string;
  departmentId?: string;
}

export async function createSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
```

### 4.2 Permission & Scoping Guards (`src/lib/auth/guards.ts`)
```typescript
import { getSession, SessionPayload } from "./session";
import { UserRole } from "@/models/User";

export class AuthError extends Error {
  status: number;
  code: string;
  constructor(message: string, code = "UNAUTHORIZED", status = 401) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Authentication required to access this resource", "UNAUTHENTICATED", 401);
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new AuthError(
      `Access denied. Role ${session.role} is not permitted.`,
      "FORBIDDEN",
      403
    );
  }
  return session;
}

export async function requireInstitutionScope(
  targetInstitutionId: string
): Promise<SessionPayload> {
  const session = await requireAuth();

  // Super Admin has global bypass
  if (session.role === "SUPER_ADMIN") return session;

  if (!session.institutionId || session.institutionId.toString() !== targetInstitutionId.toString()) {
    throw new AuthError(
      "Access denied: You cannot access or modify records of another institution.",
      "CROSS_TENANT_FORBIDDEN",
      403
    );
  }

  return session;
}
```

---

## 📡 5. API Routes

### 5.1 `POST /api/auth/login`
- **Request Body (Zod)**:
  ```typescript
  export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });
  ```
- **Security Rule**: If email not found OR password mismatch, return generic `"Invalid email or password"` with status `401`. Do not reveal whether user exists.
- **Success**: Sets `apaar_session_token` cookie, returns `{ success: true, data: { name, email, role } }`.

### 5.2 `POST /api/auth/logout`
- Clears session cookie, returns `{ success: true, message: "Logged out successfully" }`.

### 5.3 `GET /api/me`
- Returns sanitized profile of authenticated user (excluding password hash).

---

## 🎨 6. UI Implementation: Split-Screen Login Page (`src/app/(public)/login/page.tsx`)
- **Left Side**: Deep Teal brand canvas with AICTE problem statement quote and official academic badge.
- **Right Side**: Clean white form card:
  - Institutional Email input
  - Password input with Show/Hide toggle
  - Sign In button with loading spinner state
  - Error alert for invalid credentials
  - Accessible label association and `aria-invalid` tags.

---

## ⚡ 7. Commands & Verification

```powershell
# 1. Start server
npm run dev

# 2. Test login endpoint with PowerShell
$body = @{ email = "test@aicte.edu.in"; password = "Password123" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

---

## ✅ 8. Definition of Done
1. Password hashing verified: passwords never appear in plaintext in MongoDB.
2. `HttpOnly` cookie set upon successful login; blocked on invalid credentials.
3. Unauthorized access to `/api/me` returns `401 UNAUTHENTICATED`.
4. Role guard blocks a `STUDENT` role from accessing admin routes with `403 FORBIDDEN`.
5. Login screen provides accessible error states and keyboard navigation.
