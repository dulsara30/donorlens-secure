/**
 * ⚠️  TEST-DATA CLEANUP SCRIPT (NF3)
 * Deletes test NGO + mock normal users left behind by the Playwright suite.
 * Moved here from the deleted, unauthenticated /api/test/cleanup/* routes
 * (see security-evidence/NF3) -- this connects to the database directly
 * instead. Refuses to run unless MONGO_URI names a database with "test" in
 * it, so a misconfigured env can't wipe real user data.
 *
 * Targets:
 * 1) NGO registration test email patterns (ngo-registration.spec.js)
 * 2) Auth/Campaign test users (auth.spec.js, campaigns.spec.js)
 *
 * Usage:
 *   node scripts/cleanupTestData.js   (or: npm run cleanup)
 * Also imported directly by tests/global-teardown.js so Playwright can run
 * it automatically after the suite finishes, without going through a
 * network route.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

// User model
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model("User", userSchema, "users");

// Exact patterns the test suite actually generates (see
// tests/ngo-registration.spec.js, tests/auth.spec.js, tests/campaigns.spec.js),
// anchored to the full email so this can't match a real user's email that
// merely contains one of these words as a substring (e.g. "duplicate").
const TEST_EMAIL_REGEX =
  /^(testngo|completengo|nocert|duplicate|edgecase|pwsetup|testuser|campaign\.user\.)\d+@example\.com$/i;

/**
 * Runs the cleanup. Throws instead of calling process.exit(), so it's safe
 * to import and call from a long-lived process (e.g. Playwright's
 * globalTeardown) as well as from the CLI.
 */
export const cleanupTestData = async () => {
  // Refuse to run against anything that isn't clearly a test database. This
  // is the only thing standing between this script and permanently deleting
  // real users, so it fails closed: no MONGO_URI, or a URI whose database
  // name doesn't contain "test", stops before connecting to anything.
  const dbName = (process.env.MONGO_URI || "").split("/")[3]?.split("?")[0] ?? "";
  if (!/test/i.test(dbName)) {
    throw new Error(
      `Refusing to run: MONGO_URI's database name ("${dbName || "(none)"}") ` +
        `does not contain "test". Point MONGO_URI at a database such as ` +
        `.../donorlens_test before running this script.`,
    );
  }

  console.log(`🔄 Connecting to MongoDB (database: ${dbName})...`);
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  try {
    // Mock user full names used in automated tests
    const testFullNames = ["Test User", "Campaign User"];

    console.log("🗑️  Finding test users matching:", TEST_EMAIL_REGEX);

    const cleanupFilter = {
      $or: [{ email: TEST_EMAIL_REGEX }, { fullName: { $in: testFullNames } }],
    };

    const testUsers = await User.find({ ...cleanupFilter });

    console.log(`📊 Found ${testUsers.length} test users to delete`);

    if (testUsers.length === 0) {
      console.log("✅ No test users to delete!");
      return;
    }

    // Show sample of test users
    console.log("\n📋 Sample of test users to delete:");
    testUsers.slice(0, 10).forEach((user) => {
      console.log(`  - ${user.email} (Role: ${user.role})`);
    });
    if (testUsers.length > 10) {
      console.log(`  ... and ${testUsers.length - 10} more`);
    }

    // Delete test users
    console.log("\n🗑️  Deleting all test users...");
    const result = await User.deleteMany(cleanupFilter);

    console.log(
      `✅ Successfully deleted ${result.deletedCount} test users from database!`,
    );

    // Verify deletion
    const remaining = await User.countDocuments(cleanupFilter);
    console.log(`\n✔️  Verification: ${remaining} test users remaining`);
  } finally {
    await mongoose.connection.close();
  }
};

// Only run automatically (and exit the process) when this file is executed
// directly as a script -- not when it's imported, e.g. by
// tests/global-teardown.js, where calling process.exit() would kill the
// Playwright runner before it can print its summary.
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  cleanupTestData()
    .then(() => {
      console.log("✅ Cleanup completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Cleanup failed:", error.message);
      process.exit(1);
    });
}
