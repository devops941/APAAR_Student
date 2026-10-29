import { SuperAdmin } from "@/models/SuperAdmin";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth/password";

let isSeeding = false;
let isSeeded = false;

/**
 * Automatically seeds the Super Admin in the dedicated 'super_admins' collection
 * if it doesn't already exist.
 *
 * Credentials:
 * Email: admin@gmail.com
 * Password: Admin@123
 */
export async function ensureSuperAdminSeeded(): Promise<void> {
  if (isSeeded || isSeeding) return;
  isSeeding = true;

  try {
    const email = "admin@gmail.com";
    const plaintextPassword = "Admin@123";
    const passwordHash = await hashPassword(plaintextPassword);

    // 1. Ensure dedicated super_admins collection record exists
    let superAdmin = await SuperAdmin.findOne({ email });
    if (!superAdmin) {
      superAdmin = await SuperAdmin.create({
        name: "Super Administrator",
        email,
        passwordHash,
        role: "SUPER_ADMIN",
        isActive: true,
      });
      console.log("✅ [Auto-Seed] Super Admin created in super_admins table: admin@gmail.com");
    }

    // 2. Ensure User collection also has matching record with identical _id
    // for seamless backward compatibility across relations and foreign keys
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      await User.create({
        _id: superAdmin._id,
        name: "Super Administrator",
        email,
        passwordHash,
        role: "SUPER_ADMIN",
        isActive: true,
      });
      console.log("✅ [Auto-Seed] Super Admin synced in users table: admin@gmail.com");
    }

    isSeeded = true;
  } catch (error) {
    console.error("❌ [Auto-Seed] Failed to seed Super Admin:", error);
  } finally {
    isSeeding = false;
  }
}
