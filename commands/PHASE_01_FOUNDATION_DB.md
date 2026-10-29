# Phase 1: Foundation & Database Layer

## 🎯 1. Phase Objective & Overview
Phase 1 builds the infrastructural core of the platform:
1. **Cached Mongoose Connection**: Implements a persistent, singleton database connection helper to prevent exhausted MongoDB sockets during Next.js App Router hot reloading.
2. **Standard API Response Envelopes**: Establishes predictable, typed JSON responses across all future Route Handlers.
3. **Health Check Endpoint**: `/api/health` to confirm server status and MongoDB readiness.
4. **Base Layout Shell**: Implements the responsive desktop/mobile navigation sidebar (248px desktop width) adhering to the Deep Teal design tokens.

---

## 🛠️ 2. Technical Stack & Dependencies

```powershell
npm install mongoose
npm install -D @types/node
```

---

## 💻 3. Implementation Code Specifications

### 3.1 Cached Mongoose Helper (`src/lib/db/mongoose.ts`)
```typescript
import mongoose from "mongoose";
import { env } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<mongoose.Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(env.MONGODB_URI, opts).then((m) => m.connection);
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}
```

### 3.2 Standard API Response Envelopes (`src/lib/api-response.ts`)
All Route Handlers must wrap responses using these helpers:
```typescript
import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
}

export function apiSuccess<T>(data: T, meta?: ApiSuccessResponse<T>["meta"], status = 200) {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
  return NextResponse.json(body, { status });
}

export function apiError(
  message: string,
  code = "BAD_REQUEST",
  status = 400,
  details?: unknown
) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const body: ApiErrorResponse = {
    success: false,
    error: { code, message, details },
    requestId,
  };
  return NextResponse.json(body, { status });
}
```

### 3.3 Health Check Route Handler (`src/app/api/health/route.ts`)
```typescript
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const connection = await connectToDatabase();
    const isDbConnected = connection.readyState === 1;

    return apiSuccess({
      status: "HEALTHY",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        connected: isDbConnected,
        name: connection.name,
      },
    });
  } catch (error: any) {
    return apiError(
      `Database connection failed: ${error.message}`,
      "DATABASE_UNAVAILABLE",
      503
    );
  }
}
```

### 3.4 Shared Portal Layout Structure (`src/app/(portal)/layout.tsx`)
```tsx
import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-ink-light flex">
      {/* 248px Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

## ⚡ 4. Verification & Testing Commands

```powershell
# 1. Run local MongoDB instance if not already running
# mongod --dbpath C:\data\db

# 2. Start Next.js dev server
npm run dev

# 3. Test health check endpoint using curl or Invoke-RestMethod in PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET
```

**Expected JSON Response:**
```json
{
  "success": true,
  "data": {
    "status": "HEALTHY",
    "uptime": 12.45,
    "timestamp": "2026-10-28T12:00:00.000Z",
    "database": {
      "connected": true,
      "name": "apaar_platform"
    }
  }
}
```

---

## ✅ 5. Definition of Done (Exit Criteria)
1. `/api/health` returns `200 OK` with `{ success: true }` when MongoDB is running.
2. If MongoDB is stopped, `/api/health` returns a structured `503 Service Unavailable` JSON with `requestId`.
3. Mongoose connection is cached globally; subsequent requests do not spawn redundant connections.
4. Next.js App Router renders `(portal)` shell with responsive sidebar.
