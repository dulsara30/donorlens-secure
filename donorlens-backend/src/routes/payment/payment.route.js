import { Router } from "express";
import {
  getAllPayments,
  getUserPaymentHistory,
  createCheckoutController,
  listPendingPayments,
  confirmPayment,
  rejectPayment,
} from "../../controllers/payment/payment.controller.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../../middleware/auth.middleware.js";

const router = Router();

// Health check
router.get("/health", (req, res) => {
  return res.json({ success: true, message: "Payment route is healthy" });
});

router.get(
  "/pending",
  authenticateToken,
  authorizeRoles("ADMIN"),
  listPendingPayments,
);

router.get("/", authenticateToken, authorizeRoles("ADMIN"), getAllPayments);

router.get("/my", authenticateToken, getUserPaymentHistory);

router.post("/checkout", authenticateToken, createCheckoutController);

router.patch(
  "/:id/confirm",
  authenticateToken,
  authorizeRoles("ADMIN"),
  confirmPayment,
);

router.patch(
  "/:id/reject",
  authenticateToken,
  authorizeRoles("ADMIN"),
  rejectPayment,
);

export default router;