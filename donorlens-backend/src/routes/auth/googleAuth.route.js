// "Sign in with Google" — OpenID Connect on top of OAuth 2.0 Authorization Code + PKCE.
//
// Flow:
//   1. GET  /api/auth/google           -> redirect the browser to Google
//   2. GET  /api/auth/google/callback  -> Google redirects back here with ?code&state
//
// Security controls implemented here (see docs/SECURITY_ANALYSIS.md section 14):
//   - state:        random value, stored server-side, checked on callback (login CSRF)
//   - PKCE (S256):  code_verifier/code_challenge so a stolen code can't be redeemed alone
//   - nonce:        random value that must reappear inside the ID token (replay protection)
//   - full ID-token validation: signature, iss, aud, exp (via google-auth-library)
//   - email_verified required before linking/creating an account
//   - users are identified by Google's `sub`, never by email alone
//   - client secret stays in the backend .env — never sent to the frontend
//   - no tokens are ever placed in a URL; the browser only gets our own HttpOnly
//     refresh cookie, exactly like password login

import express from "express";
import crypto from "crypto";
import { OAuth2Client, CodeChallengeMethod } from "google-auth-library";
import {
  googleLogin,
  GoogleAccountNotAllowedError,
} from "../../usecases/auth/GoogleLoginUsecase.js";
import { getRefreshTokenCookieOptions } from "../../utils/cookie.util.js";

const router = express.Router();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

const OAUTH_COOKIE = "g_oauth";

const oauthCookieOptions = {
  httpOnly: true,
  signed: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax", // must be "lax": Google's redirect back is a cross-site top-level GET
  maxAge: 10 * 60 * 1000, // 10 minutes — the whole round trip through Google should be fast
  path: "/api/auth/google",
};

// 1) Start: send the donor to Google
router.get("/", async (req, res, next) => {
  try {
    const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
    const state = crypto.randomBytes(32).toString("hex");
    const nonce = crypto.randomBytes(32).toString("hex");

    res.cookie(
      OAUTH_COOKIE,
      JSON.stringify({ state, nonce, codeVerifier }),
      oauthCookieOptions,
    );

    const url = client.generateAuthUrl({
      scope: ["openid", "email", "profile"],
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
      prompt: "select_account",
    });

    res.redirect(url);
  } catch (error) {
    next(error);
  }
});

// 2) Callback: Google sends the donor back here
router.get("/callback", async (req, res) => {
  const fail = (reason) => {
    res.clearCookie(OAUTH_COOKIE, { path: oauthCookieOptions.path });
    return res.redirect(`${process.env.CLIENT_URL}/login?error=${reason}`);
  };

  try {
    const saved = req.signedCookies?.[OAUTH_COOKIE]
      ? JSON.parse(req.signedCookies[OAUTH_COOKIE])
      : null;
    res.clearCookie(OAUTH_COOKIE, { path: oauthCookieOptions.path }); // one-time use

    if (req.query.error) return fail("google_cancelled");
    if (!saved || !req.query.state || req.query.state !== saved.state) {
      return fail("invalid_state");
    }

    const { tokens } = await client.getToken({
      code: req.query.code,
      codeVerifier: saved.codeVerifier,
    });

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID, // checks signature, iss, aud, exp
    });
    const claims = ticket.getPayload();

    if (claims.nonce !== saved.nonce) return fail("invalid_nonce");
    if (!claims.email_verified) return fail("email_not_verified");

    const { refreshToken } = await googleLogin(claims);

    res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());
    return res.redirect(`${process.env.CLIENT_URL}/auth/google/success`);
  } catch (error) {
    console.error("Google login failed:", error.message);
    if (error instanceof GoogleAccountNotAllowedError) {
      return fail("account_not_allowed");
    }
    return fail("google_failed");
  }
});

export default router;
