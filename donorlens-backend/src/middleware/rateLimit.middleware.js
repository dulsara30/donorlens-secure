// Rate limiters for authentication endpoints.
// F6 — unlimited login/verification attempts allowed brute-force and
// credential-stuffing attacks, and unlimited guessing on the NGO
// verify-identity check (CWE-307, OWASP A07:2025 Authentication Failures).
// See docs/SECURITY_ANALYSIS.md finding F6.
//
// Requires app.set("trust proxy", 1) (set in app.js) so requests behind
// Render's proxy are counted per real client IP, not per proxy.

import rateLimit from "express-rate-limit";

const message = { message: "Too many attempts. Please try again in 15 minutes." };

// Login: only failed attempts count against the limit, so a user who gets
// it right on the 2nd try isn't punished for the 1st typo.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message,
});

// NGO identity-verification / password-setup token checks — same window,
// no skipSuccessfulRequests since a "success" here just means the token
// happened to be valid, not that guessing should be free until then.
export const sensitiveAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message,
});

// Registration: looser, since real sign-ups can legitimately retry a typo'd
// field a few times, but still bounded against automated account creation.
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message,
});
