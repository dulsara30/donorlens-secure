// Friendly messages for the ?error= codes the Google OIDC callback can
// redirect back with. Keep this in sync with the error codes the backend
// actually sends — see donorlens-backend/src/routes/auth/googleAuth.route.js
// and the errors thrown from usecases/auth/GoogleLoginUsecase.js.
export const GOOGLE_ERROR_MESSAGES = {
  google_cancelled: "Google sign-in was cancelled.",
  invalid_state: "That Google sign-in link expired or was already used. Please try again.",
  invalid_nonce: "That Google sign-in link expired or was already used. Please try again.",
  email_not_verified: "Your Google account's email isn't verified yet. Please verify it with Google first.",
  account_not_allowed: "Google sign-in isn't available for NGO or admin accounts. Please use your password.",
  account_deactivated: "This account has been deactivated. Please contact support.",
  email_already_registered: "An account with this email already exists. Please sign in with your password.",
  google_failed: "Google sign-in didn't work. Please try again or use your password.",
};

/**
 * @param {string|null} code - the ?error= query value, if any
 * @returns {string} a friendly message, or "" if the code is missing/unrecognized
 */
export const getGoogleErrorMessage = (code) => GOOGLE_ERROR_MESSAGES[code] || "";
