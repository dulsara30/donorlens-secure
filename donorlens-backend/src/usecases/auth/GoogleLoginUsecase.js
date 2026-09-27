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

class GoogleAccountDeactivatedError extends Error {
  constructor(message) {
    super(message);
    this.code = "ACCOUNT_DEACTIVATED";
  }
}

// Local (password) registration does not verify email ownership — anyone can
// register any address. If Google sign-in auto-linked by email match alone,
// an attacker could pre-register a victim's email locally, keep the
// password, and inherit the account once the victim later signs in with
// their real (Google-verified) account for that address. So we never link
// automatically here; an email that already exists on any account (local or
// Google, any role) is refused and pointed at password login instead.
// Linking an already-logged-in donor's own account to Google is a possible
// future "Connect Google" profile feature — safe because it would run while
// already authenticated, which is the actual proof of ownership this flow
// is missing.
class GoogleEmailAlreadyRegisteredError extends Error {
  constructor(message) {
    super(message);
    this.code = "EMAIL_ALREADY_REGISTERED";
  }
}

/**
 * Find-or-create a DonorLens user from a verified Google ID token payload,
 * then issue this app's normal access/refresh token pair.
 *
 * Linking rules (deliberately strict — most real-world OAuth bugs are here):
 *  - existing googleId match, role USER, active -> log in
 *  - existing googleId match but role is no longer USER -> refuse (defence in
 *    depth in case a future feature ever promotes a Google-linked donor)
 *  - existing googleId match but deactivated -> refuse with a distinct error
 *  - no googleId match, but ANY account already has this email -> refuse and
 *    tell them to use their password (never auto-link, see above)
 *  - no account at all -> create a new USER (donor)
 *
 * @param {Object} claims - Verified Google ID token payload (sub, email, name, email_verified)
 * @returns {Promise<{ user: Object, accessToken: string, refreshToken: string }>}
 */
export async function googleLogin(claims) {
  const { sub, email, name } = claims;

  let user = await User.findOne({ googleId: sub });

  if (user) {
    if (user.role !== "USER") {
      throw new GoogleAccountNotAllowedError(
        "Google sign-in is not available for this account. Please use your password.",
      );
    }
    if (!user.isActive) {
      throw new GoogleAccountDeactivatedError(
        "This account has been deactivated. Please contact support.",
      );
    }
  } else {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new GoogleEmailAlreadyRegisteredError(
        "An account with this email already exists. Please sign in with your password.",
      );
    }

    user = await User.create({
      fullName: name || email.split("@")[0],
      email: email.toLowerCase(),
      googleId: sub,
      authProvider: "google",
      role: "USER",
      isActive: true,
    });
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

export {
  GoogleAccountNotAllowedError,
  GoogleAccountDeactivatedError,
  GoogleEmailAlreadyRegisteredError,
};
