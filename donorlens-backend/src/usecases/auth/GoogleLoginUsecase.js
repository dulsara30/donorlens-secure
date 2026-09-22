// Business logic for "Sign in with Google" (OIDC, Authorization Code + PKCE).
// Called from routes/auth/googleAuth.route.js after the ID token has already
// been verified (signature, iss, aud, exp, nonce, email_verified) by the caller.

import User from "../../models/user/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/jwt.util.js";

class GoogleAccountNotAllowedError extends Error {
  constructor(message) {
    super(message);
    this.code = "ACCOUNT_NOT_ALLOWED";
  }
}

/**
 * Find-or-create a DonorLens user from a verified Google ID token payload,
 * then issue this app's normal access/refresh token pair.
 *
 * Linking rules (deliberately strict — most real-world OAuth bugs are here):
 *  - existing googleId match -> log in
 *  - no googleId match, but a USER account has this verified email -> link it
 *  - the matching account is NGO_ADMIN/ADMIN -> refuse (no auto-upgrade of a
 *    higher-privilege account to a new login method)
 *  - no account at all -> create a new USER (donor)
 *  - deactivated account -> refuse
 *
 * @param {Object} claims - Verified Google ID token payload (sub, email, name, email_verified)
 * @returns {Promise<{ user: Object, accessToken: string, refreshToken: string }>}
 */
export async function googleLogin(claims) {
  const { sub, email, name } = claims;

  let user = await User.findOne({ googleId: sub });

  if (!user) {
    const existing = await User.findOne({ email: email.toLowerCase() });

    if (existing) {
      if (existing.role !== "USER") {
        throw new GoogleAccountNotAllowedError(
          "Google sign-in is not available for this account. Please use your password.",
        );
      }
      existing.googleId = sub;
      existing.authProvider = "google";
      user = await existing.save();
    } else {
      user = await User.create({
        fullName: name || email.split("@")[0],
        email: email.toLowerCase(),
        googleId: sub,
        authProvider: "google",
        role: "USER",
        isActive: true,
      });
    }
  }

  if (!user.isActive) {
    throw new GoogleAccountNotAllowedError("Account is deactivated. Please contact support.");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user._id.toString(),
  });

  return { user: user.toSafeObject(), accessToken, refreshToken };
}

export { GoogleAccountNotAllowedError };
