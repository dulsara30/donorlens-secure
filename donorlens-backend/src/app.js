import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRouter from "./routes/auth/auth.route.js";
import googleAuthRouter from "./routes/auth/googleAuth.route.js";
import errorHandler from "./middleware/errorHandler.middleware.js";
import { NotFoundError } from "./utils/errors.js";
import campaignRoutes from "./routes/campaigns/campaign.routes.js";
import executionUpdateRoutes from "./routes/campaigns/executions/executions.routes.js";
import ngoAdminRouter from "./routes/ngoAdmin/ngoRegister.route.js";
import adminRoutes from "./routes/admin/systemAdmin.route.js";
import paymentRoutes from "./routes/payment/payment.route.js";
import campaignCommentRoutes from "./routes/campaigns/campaignComment.routes.js";
import paymentLogRoutes from "./routes/payment/paymentLogs.route.js";
import testRoutes from "./routes/test/test.route.js";

const createApp = () => {
  dotenv.config();
  const app = express();

  // Trust one hop of reverse proxy (e.g. Render's) so req.ip / rate limiting
  // see the real client IP instead of the proxy's. "1", not true — true would
  // let a client spoof its own IP via X-Forwarded-For and dodge rate limits.
  app.set("trust proxy", 1);

  // Security middleware
  app.use(helmet());

  // Body parser middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Cookie parser middleware — signed so the OAuth state/nonce/PKCE cookie
  // (see routes/auth/googleAuth.route.js) can't be edited in transit.
  app.use(cookieParser(process.env.COOKIE_SECRET));

  // CORS configuration - allow credentials for HttpOnly cookies
  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true, // Important: allows cookies to be sent
    }),
  );

  // Connect to MongoDB
  connectDB();

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "DonorLens API is running",
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  //Auth routes (login, register, refresh token, logout, get current user)
  app.use("/api/auth", authRouter);
  // Google OIDC sign-in (Authorization Code + PKCE) — GET /api/auth/google, /callback
  app.use("/api/auth/google", googleAuthRouter);

  //app.use("/api/ngo/campaigns", campaignRoutes);

  app.use("/api/campaigns", campaignRoutes);
  app.use("/api/campaign", campaignCommentRoutes);
  app.use("/api/campaign-executions", executionUpdateRoutes);

  //app.use("/api/campaigns", campaignRoutes);
  //NGO Admin routes (NGO registration)
  app.use("/api/ngo/auth", ngoAdminRouter);
  app.use("/api/ngo/campaigns", campaignRoutes);

  //System Admin routes (to be added later)
  app.use("/api/admin", adminRoutes);

  //Payment routes
  app.use("/api/payment", paymentRoutes);
  app.use("/api/payment/logs", paymentLogRoutes);

  // Test cleanup routes (⚠️ DEVELOPMENT/TESTING ONLY - disable in production!)
  if (process.env.NODE_ENV !== "production") {
    app.use("/api/test", testRoutes);
  }

  // 404 handler for undefined routes (must be before error handler)
  app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.originalUrl}`));
  });

  // Global error handler (MUST BE LAST!)
  app.use(errorHandler);

  return app;
};

export default createApp;
