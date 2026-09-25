import { Router } from "express";
import {
  getAllPayments,
  getUserPaymentHistory,
  createPayment,
  createCheckoutController,
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

router.get("/", authenticateToken, authorizeRoles("ADMIN"), getAllPayments);

router.get("/my", authenticateToken, getUserPaymentHistory);

router.post("/checkout", authenticateToken, createCheckoutController);

router.post("/", authenticateToken, createPayment);

export default router;