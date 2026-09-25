import { Router } from "express";
import { getAllPaymentLogs } from "../../controllers/payment/payment.controller.js";
import { authenticateToken, authorizeRoles} from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticateToken, authorizeRoles("ADMIN"), getAllPaymentLogs);

export default router;
