import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { env } from "@/lib/env";

/**
 * Storage service supporting both Cloudinary and local filesystem.
 * Provider is selected via DOCUMENT_STORAGE_PROVIDER env variable.
 */

const ALLOWED_MIME = ["application/pdf", "image/png", "image/jpeg"];
const MAX_FILE_SIZE = env.MAX_FILE_SIZE_MB * 1024 * 1024;

export { ALLOWED_MIME, MAX_FILE_SIZE };

/** Compute SHA-256 hex hash of a buffer. */
export function computeSha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// ── Cloudinary ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cloudinary: any = null;

async function getCloudinary() {
  if (!cloudinary) {
    const c = await import("cloudinary");
    cloudinary = c.v2;
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
  }
  return cloudinary;
}

// ── Local storage helpers ──
const UPLOAD_DIR = path.resolve(process.cwd(), env.STORAGE_LOCAL_PATH || "./uploads");

async function ensureUploadDirExists() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

/**
 * Save a file to the configured storage provider.
 * Returns storage key and SHA-256 hash.
 */
export async function saveFile(
  buffer: Buffer,
  originalName: string
): Promise<{ storageKey: string; sha256Hash: string; provider: "cloudinary" | "local" }> {
  const sha256Hash = computeSha256(buffer);
  const ext = path.extname(originalName).toLowerCase();

  if (env.DOCUMENT_STORAGE_PROVIDER === "cloudinary" && env.CLOUDINARY_CLOUD_NAME) {
    const cloud = await getCloudinary();

    return new Promise((resolve, reject) => {
      const uploadStream = cloud.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: env.DOCUMENT_STORAGE_BUCKET || "apaar-documents",
          public_id: `${uuidv4()}`,
        },
        (error: Error | null, result: { public_id?: string } | undefined) => {
          if (error) return reject(error);
          resolve({
            storageKey: result?.public_id ?? "",
            sha256Hash,
            provider: "cloudinary",
          });
        }
      );
      uploadStream.end(buffer);
    });
  }

  // Local storage fallback
  await ensureUploadDirExists();
  const storageKey = `${uuidv4()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, storageKey);
  await fs.writeFile(filePath, buffer);

  return { storageKey, sha256Hash, provider: "local" };
}

/**
 * Retrieve a file buffer from storage.
 */
export async function getFileBuffer(
  storageKey: string,
  provider: "cloudinary" | "local"
): Promise<Buffer> {
  if (provider === "cloudinary" && env.CLOUDINARY_CLOUD_NAME) {
    const cloud = await getCloudinary();
    const url = cloud.url(storageKey, { resource_type: "auto" });
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch file from Cloudinary");
    return Buffer.from(await response.arrayBuffer());
  }

  // Local storage
  const filePath = path.join(UPLOAD_DIR, storageKey);
  return await fs.readFile(filePath);
}
