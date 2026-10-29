import { connectToDatabase } from "@/lib/db/mongoose";
import { apiSuccess, apiError } from "@/lib/api-response";

/**
 * GET /api/health
 * Returns server status, uptime, and MongoDB connection readiness.
 */
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
        host: connection.host,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown database connection error";

    return apiError(
      `Database connection failed: ${message}`,
      "DATABASE_UNAVAILABLE",
      503
    );
  }
}
