/**
 * Playwright global teardown (NF3): runs once after the whole suite
 * finishes, replacing the old per-spec afterAll calls to the now-deleted
 * /api/test/cleanup/* routes.
 *
 * Deliberately does NOT rethrow: cleanupTestData() refuses to run unless
 * MONGO_URI names a database with "test" in it, and a misconfigured CI
 * secret here should leave the actual test results alone rather than fail
 * the whole run over leftover data. If cleanup fails, it's logged as a
 * warning -- check for it in CI output, and fall back to running
 * `npm run cleanup` by hand.
 */
import { cleanupTestData } from "../scripts/cleanupTestData.js";

export default async function globalTeardown() {
  try {
    await cleanupTestData();
  } catch (error) {
    console.warn(
      `⚠️  global-teardown: test-data cleanup did not run: ${error.message}`,
    );
  }
}
