import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = "http://localhost:5000/api";

test.describe("NGO Registration API Tests", () => {
  let testFiles = {};
  let createdEmails = [];

  test.beforeAll(() => {
    console.log("Setting up test fixtures...");

    const fakePDF = fs.readFileSync(
      path.join(__dirname, "fixtures", "test-cert.pdf"),
    );

    const fakePNG = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );

    const fakeJPEG = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    testFiles = {
      pdf: fakePDF,
      png: fakePNG,
      jpeg: fakeJPEG,
    };

    console.log("Test fixtures ready!");
  });

  test.afterAll(() => {
    // NF3: the unauthenticated /api/test/cleanup/* routes this used to call
    // have been removed. Cleanup now happens once for the whole suite via
    // globalTeardown (tests/global-teardown.js -> scripts/cleanupTestData.js),
    // matching these NGOs by email pattern rather than by this per-test list.
    console.log(
      `Registered ${createdEmails.length} NGO(s) in this run: ${createdEmails.join(", ") || "(none)"}`,
    );
  });

  test("POSITIVE TEST 1: Register NGO with minimum required fields and certificate", async ({
    request,
  }) => {
    const email = `testngo${Date.now()}@example.com`;
    createdEmails.push(email);

    const response = await request.post(`${API_URL}/ngo/auth/register-ngo`, {
      multipart: {
        ngoName: "Test NGO Organization",
        officialEmail: email,
        registrationNumber: `REG${Date.now()}`,
        address: "123 Test Street, Test City, Test State 12345",
        description:
          "This is a test NGO organization for automated testing purposes",
        primaryPhone: "1234567890",

        registrationCertificate: {
          name: "certificate.pdf",
          mimeType: "application/pdf",
          buffer: testFiles.pdf,
        },
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain("successfully");
    expect(body.data).toHaveProperty("user");
    expect(body.data.user).toHaveProperty("email");
    expect(body.data.user.ngoDetails).toHaveProperty("ngoName");
    expect(body.data.user.role).toBe("NGO_ADMIN");

    console.log(`NGO registered successfully: ${email}`);
  });

  test("POSITIVE TEST 2: Register NGO with all optional fields and multiple documents", async ({
    request,
  }) => {
    const email = `completengo${Date.now()}@example.com`;
    createdEmails.push(email);

    const response = await request.post(`${API_URL}/ngo/auth/register-ngo`, {
      multipart: {
        ngoName: "Complete NGO With All Docs",
        officialEmail: email,
        registrationNumber: `COMP${Date.now()}`,
        address: "456 Complete Avenue, Full City, Full State 54321",
        description:
          "NGO with complete documentation including all optional fields and documents",
        primaryPhone: "9876543210",
        secondaryPhone: "1112223334", // Optional
        website: "https://completengo.org", // Optional

        registrationCertificate: {
          name: "registration-cert.pdf",
          mimeType: "application/pdf",
          buffer: testFiles.pdf,
        },
        additionalDoc1: {
          name: "additional-doc1.pdf",
          mimeType: "application/pdf",
          buffer: testFiles.pdf,
        },
        additionalDoc2: {
          name: "proof-doc2.pdf",
          mimeType: "application/pdf",
          buffer: testFiles.pdf,
        },
        additionalDoc3: {
          name: "verification-doc3.pdf",
          mimeType: "application/pdf",
          buffer: testFiles.pdf,
        },
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBeTruthy();
    expect(body.data.user.ngoDetails.ngoName).toBe(
      "Complete NGO With All Docs",
    );
    expect(body.data.user.ngoDetails).toHaveProperty("documents");
    expect(body.data.user.ngoDetails.documents).toHaveProperty(
      "registrationCertificate",
    );
    expect(
      body.data.user.ngoDetails.documents.additionalDocuments,
    ).toHaveLength(3);
    expect(body.data.user.ngoDetails.secondaryPhone).toBeDefined();
    expect(body.data.user.ngoDetails.website).toBeDefined();

    console.log(`Complete NGO registered with all documents: ${email}`);
  });

  test("NEGATIVE TEST 1: Should fail when no certificate file is uploaded", async ({
    request,
  }) => {
    const response = await request.post(`${API_URL}/ngo/auth/register-ngo`, {
      multipart: {
        ngoName: "No Certificate NGO",
        officialEmail: `nocert${Date.now()}@example.com`,
        registrationNumber: `NOCERT${Date.now()}`,
        address: "No Certificate Street, Test City, State 12345",
        description:
          "Testing registration without registration certificate file",
        primaryPhone: "1234567890",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toContain("file");

    console.log(
      `Test passed: Registration failed without certificate (as expected)`,
    );
  });

  test("NEGATIVE TEST 2: Should fail with duplicate email address", async ({
    request,
  }) => {
    const duplicateEmail = `duplicate${Date.now()}@example.com`;

    const firstResponse = await request.post(
      `${API_URL}/ngo/auth/register-ngo`,
      {
        multipart: {
          ngoName: "First NGO",
          officialEmail: duplicateEmail,
          registrationNumber: `FIRST${Date.now()}`,
          address: "First Registration Street, City, State",
          description: "First registration with unique email address",
          primaryPhone: "1234567890",
          registrationCertificate: {
            name: "cert.pdf",
            mimeType: "application/pdf",
            buffer: testFiles.pdf,
          },
        },
      },
    );
    expect(firstResponse.status()).toBe(201);
    createdEmails.push(duplicateEmail);

    const secondResponse = await request.post(
      `${API_URL}/ngo/auth/register-ngo`,
      {
        multipart: {
          ngoName: "Duplicate Email NGO",
          officialEmail: duplicateEmail, // duplicate email
          registrationNumber: `DUP${Date.now()}`,
          address: "Duplicate Email Street, City, State",
          description: "Attempting to register with already used email",
          primaryPhone: "9876543210",
          registrationCertificate: {
            name: "cert2.pdf",
            mimeType: "application/pdf",
            buffer: testFiles.pdf,
          },
        },
      },
    );

    expect(secondResponse.status()).toBe(409);
    const body = await secondResponse.json();
    expect(body.success).toBe(false);
    expect(body.message).toContain("Email");

    console.log(`Test passed: Duplicate email rejected (as expected)`);
  });

  test("EDGE CASE: Register without optional fields (secondaryPhone, website)", async ({
    request,
  }) => {
    const email = `edgecase${Date.now()}@example.com`;
    createdEmails.push(email);

    const response = await request.post(`${API_URL}/ngo/auth/register-ngo`, {
      multipart: {
        ngoName: "Edge Case NGO Without Optionals",
        officialEmail: email,
        registrationNumber: `EDGE${Date.now()}`,
        address: "Edge Case Street Testing Boundaries Here",
        description:
          "Testing registration without any optional fields to verify minimum requirements",
        primaryPhone: "5554443333",

        registrationCertificate: {
          name: "cert.pdf",
          mimeType: "application/pdf",
          buffer: testFiles.pdf,
        },
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.user.ngoDetails.secondaryPhone).toBeUndefined();
    expect(body.data.user.ngoDetails.website).toBeUndefined();

    console.log(`Edge case passed: NGO registered without optional fields`);
  });

  test("GET /auth/Login - admin login", async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: "admin.donorlens@gmail.com",
        password: "admin123",
      },
    });

    expect(response.status()).toBe(200);
  });

  // test("MOCKING: Mock password setup email endpoint and verify response", async ({
  //   page,
  // }) => {
  //   const email = `pwsetup${Date.now()}@example.com`;
  //   const mockNgoId = "507f1f77bcf86cd799439011";
  //   const mockToken = `mock-token-${Date.now()}`;
  //   const setupUrl = `${process.env.CLIENT_URL}/password-setup?token=${mockToken}`;
  //   //const accessToken = ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTk3Y2UxZGE3YjdkYjBiM2NkOTQ3NGYiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NzI5NjcxMDYsImV4cCI6MTc3MzA1MzUwNn0.i9eaMdGZ5jQSMDtGoA9gMx4bt1Af-EQDgaMACTtqMU8"); // Use the token obtained from admin login

  //   createdEmails.push(email);

  //   await page.route(`**/admin/pw-Request/${mockNgoId}`, (route) => {
  //     console.log(
  //       "Password setup email endpoint intercepted - returning mocked response",
  //     );

  //     const mockResponse = {
  //       success: true,
  //       message: "Password setup email sent successfully",
  //       data: {
  //         ngoId: mockNgoId,
  //         email: email,
  //         ngoName: "Test NGO for Password Setup",
  //         registrationNumber: `REG${Date.now()}`,
  //         setupUrl: setupUrl,
  //         expiryHours: 24,
  //       },
  //     };

  //     route.fulfill({
  //       status: 200,
  //       contentType: "application/json",
  //       body: JSON.stringify(mockResponse),
  //     });
  //   });

  //   const response = await page.request.put(
  //     `${API_URL}/admin/pw-Request/${mockNgoId}`,
  //     {
  //       headers: {
  //         Authorization: "Bearer mock-admin-token", // Use the token obtained from admin login
  //         "Content-Type": "application/json",
  //       },
  //     },
  //   );

  //   expect(response.status()).toBe(200);
  //   const body = await response.json();

  //   expect(body.success).toBe(true);
  //   expect(body.message).toBe("Password setup email sent successfully");
  //   console.log(
  //     `Password setup email mocking test passed: Verified response structure matches real implementation`,
  //   );
  // });

  test("MOCKING: Mock password setup email service using a fake endpoint", async ({
    page,
  }) => {
    const email = `pwsetup${Date.now()}@example.com`;
    const mockNgoId = "507f1f77bcf86cd799439011";
    const mockToken = `mock-token-${Date.now()}`;

    const setupUrl = `${process.env.CLIENT_URL}/password-setup?token=${mockToken}`;

    await page.route("**/api/mock/send-password-email", async (route) => {
      console.log("Mock email API intercepted by Playwright");

      const mockResponse = {
        success: true,
        message: "Password setup email sent successfully (MOCKED)",
        data: {
          ngoId: mockNgoId,
          email: email,
          ngoName: "Mock NGO",
          registrationNumber: `REG${Date.now()}`,
          setupUrl: setupUrl,
          expiryHours: 24,
        },
      };

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockResponse),
      });
    });

    const response = await page.evaluate(async () => {
      const res = await fetch(
        "http://localhost:5000/api/mock/send-password-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      return {
        status: res.status,
        body: await res.json(),
      };
    });

    expect(response.status).toBe(200);

    const body = response.body;

    expect(body.success).toBe(true);
    expect(body.message).toContain("MOCKED");

    expect(body.data).toBeDefined();
    expect(body.data).toHaveProperty("ngoId");
    expect(body.data).toHaveProperty("email");
    expect(body.data).toHaveProperty("ngoName");
    expect(body.data).toHaveProperty("registrationNumber");
    expect(body.data).toHaveProperty("setupUrl");
    expect(body.data).toHaveProperty("expiryHours");

    console.log("Mocking test passed successfully");
  });
});
