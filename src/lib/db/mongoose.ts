import mongoose, { type Connection } from "mongoose";
import { env } from "@/lib/env";

/**
 * Global cached Mongoose connection.
 *
 * Next.js App Router hot-reloads route modules on every save during
 * development. Without caching, each reload spawns a new connection
 * and quickly exhausts the MongoDB connection pool. We store the
 * connection (and the in-flight promise) on `globalThis` so it survives
 * hot reloads.
 */

type MongooseCache = {
  conn: Connection | null;
  promise: Promise<Connection> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connect to MongoDB using a cached singleton pattern.
 * Subsequent calls return the existing connection without reconnecting.
 */
export async function connectToDatabase(): Promise<Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(env.MONGODB_URI, opts)
      .then((m) => m.connection);
  }

  try {
    cached.conn = await cached.promise;
    // Auto-seed super admin if not already present
    import("@/services/super-admin-seed.service")
      .then((m) => m.ensureSuperAdminSeeded())
      .catch((err) => console.error("Error running auto-seed:", err));

    return cached.conn;
  } catch (error) {
    // Reset the promise so the next call can retry
    cached.promise = null;
    throw error;
  }
}

export default connectToDatabase;
