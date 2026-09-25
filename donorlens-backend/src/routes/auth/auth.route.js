// src/routes/auth/auth.route.js
// Authentication routes

import { Router } from "express";
import { loginController } from "../../controllers/auth/LoginController.js";
import { registerUserController } from "../../controllers/auth/RegisterUserController.js";
import { refreshTokenController } from "../../controllers/auth/RefreshTokenController.js";
import { getCurrentUserController } from "../../controllers/auth/GetCurrentUserController.js";
import { logoutController } from "../../controllers/auth/LogoutController.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import {
  loginLimiter,
  sensitiveAuthLimiter,
  registerLimiter,
} from "../../middleware/rateLimit.middleware.js";
import PasswordSetupTokenVerificationController from "../../controllers/admin/PasswordSetupTokenVerificationController.js";
import VerifyIdentityController from "../../controllers/admin/VerifyIdentityController.js";
import SetPasswordController from "../../controllers/admin/SetPasswordController.js";
import ResubmissionTokenVerificationController from "../../controllers/auth/ResubmissionTokenVerificationController.js";

const authRouter = Router();

authRouter.post("/register/user", registerLimiter, registerUserController);

authRouter.post("/login", loginLimiter, loginController);

authRouter.post("/refresh", refreshTokenController);

authRouter.post("/logout", logoutController);

authRouter.get("/me", authenticateToken, getCurrentUserController);

authRouter.get(
  "/verify-password-setup-token",
  PasswordSetupTokenVerificationController,
);

authRouter.get(
  "/verify-resubmission-token",
  ResubmissionTokenVerificationController,
);

authRouter.post("/verify-identity", sensitiveAuthLimiter, VerifyIdentityController);

authRouter.post("/set-password", sensitiveAuthLimiter, SetPasswordController);

export default authRouter;
