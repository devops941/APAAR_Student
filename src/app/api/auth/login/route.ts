import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";
import { createSessionCookie, type SessionPayload } from "@/lib/auth/session";
import { loginSchema } from "@/validators/auth";
import { verifyPassword } from "@/lib/auth/password";
import { User } from "@/models/User";
import { SuperAdmin } from "@/models/SuperAdmin";

/**
 * POST /api/auth/login
 * Authenticates a user by email + password, sets an HttpOnly session cookie,
 * and returns sanitized profile data.
 *
 * Security: Returns a generic "Invalid email or password" for both
 * unknown emails and wrong passwords to prevent email enumeration.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "Please check your email and password and try again.",
        "VALIDATION_ERROR",
        400
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    await connectToDatabase();

    // 1. Check dedicated SuperAdmin table first
    const superAdmin = await SuperAdmin.findOne({ email: normalizedEmail });
    if (superAdmin) {
      if (!superAdmin.isActive) {
        return apiError("Invalid email or password.", "UNAUTHENTICATED", 401);
      }
      const isPasswordValid = await verifyPassword(password, superAdmin.passwordHash);
      if (!isPasswordValid) {
        return apiError("Invalid email or password.", "UNAUTHENTICATED", 401);
      }

      const sessionPayload: SessionPayload = {
        userId: superAdmin._id.toString(),
        email: superAdmin.email,
        role: "SUPER_ADMIN",
      };

      await createSessionCookie(sessionPayload);
      await SuperAdmin.findByIdAndUpdate(superAdmin._id, { lastLoginAt: new Date() });

      return apiSuccess({
        name: superAdmin.name,
        email: superAdmin.email,
        role: "SUPER_ADMIN",
      });
    }

    // 2. Fall back to standard User table
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+passwordHash"
    );

    // Generic error for both "user not found" and "wrong password"
    if (!user || !user.isActive) {
      return apiError("Invalid email or password.", "UNAUTHENTICATED", 401);
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return apiError("Invalid email or password.", "UNAUTHENTICATED", 401);
    }

    // Build session payload
    const sessionPayload: SessionPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      institutionId: user.institutionId?.toString(),
      departmentId: user.departmentId?.toString(),
    };

    await createSessionCookie(sessionPayload);

    // Update last login timestamp
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    return apiSuccess({
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Login error:", error);
    return apiError(
      "An unexpected error occurred during login.",
      "INTERNAL_ERROR",
      500
    );
  }
}
