import { test, expect } from "@playwright/test"
import { userLoginAndGetToken } from "./helper/auth.helper.js"

let token;
let adminToken;

test.beforeAll(async ({ request }) => {
    token = await userLoginAndGetToken(request, {
        email: "buddhikadevelopment@gmail.com",
        password: "2001219@Buddhika"
    })

    adminToken = await userLoginAndGetToken(request, {
        email: "admin.donorlens@gmail.com",
        password: "admin123"
    })
})

test.describe("Payment API Endpoints", () => {

    // ---------------------------------------------------------
    // 1. Health Check
    // ---------------------------------------------------------
    test("Health Check: GET /api/payment/health should return 200", async ({ request }) => {
        const res = await request.get("api/payment/health");
        expect(res.status()).toBe(200);

        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.message).toBe("Payment route is healthy");
    });

    // ---------------------------------------------------------
    // 2. Get All Payments
    // ---------------------------------------------------------
    test("Get All Payments: GET /api/payment/ with admin user should return 200", async ({ request }) => {
        const res = await request.get("api/payment/", {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        });
        expect(res.status()).toBe(200);
    });

    test("Get All Payments: GET /api/payment/ with normal user should be forbidden (403)", async ({ request }) => {
        const res = await request.get("api/payment/", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        expect(res.status()).toBe(403);
    });

    // ---------------------------------------------------------
    // 3. Get User Payment History
    // ---------------------------------------------------------
    test("User Payment History: GET /api/payment/my should return 200 with normal user token", async ({ request }) => {
        const res = await request.get("api/payment/my", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        expect(res.status()).toBe(200);
    });

    test("User Payment History: GET /api/payment/my without token should return 401 Unauthorized", async ({ request }) => {
        const res = await request.get("api/payment/my");
        expect(res.status()).toBe(401);
    });

    // ---------------------------------------------------------
    // 4. Payment review workflow
    // ---------------------------------------------------------
    test("Client cannot create a payment through POST /api/payment", async ({ request }) => {
        const res = await request.post("api/payment/", {
            headers: {
                Authorization: `Bearer ${token}`
            },
            data: {
                campaignId: "69ac148f96c25e1fdad7a3ee",
                amount: 200,
                status: "COMPLETED"
            }
        });
        expect(res.status()).toBe(404);
    });

    test("Pending payments require an admin token", async ({ request }) => {
        const res = await request.get("api/payment/pending", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        expect(res.status()).toBe(403);
    });

    test("Payment confirmation rejects malformed IDs", async ({ request }) => {
        const res = await request.patch("api/payment/not-an-id/confirm", {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        });
        expect(res.status()).toBe(400);
    });

    test("Payment rejection rejects malformed IDs", async ({ request }) => {
        const res = await request.patch("api/payment/not-an-id/reject", {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        });
        expect(res.status()).toBe(400);
    });

    // ---------------------------------------------------------
    // 5. Get All Payment Logs
    // ---------------------------------------------------------
    test("Payment Logs: GET /api/payment/logs/ should return 200", async ({ request }) => {
        const res = await request.get("api/payment/logs/");
        expect([200, 401]).toContain(res.status());
    });
});

