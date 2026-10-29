/**
 * Next.js server lifecycle hook.
 * Runs once when the backend server process starts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { connectToDatabase } = await import("@/lib/db/mongoose");
      const { ensureSuperAdminSeeded } = await import(
        "@/services/super-admin-seed.service"
      );
      await connectToDatabase();
      await ensureSuperAdminSeeded();
    } catch (err) {
      console.error("❌ Failed to auto-seed on startup:", err);
    }
  }
}
