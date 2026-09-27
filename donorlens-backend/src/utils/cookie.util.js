// Cookie configuration utilities for secure token storage

/**
 * Get cookie options for refresh token
 * HttpOnly ensures the cookie cannot be accessed by JavaScript (XSS protection)
 * Secure ensures the cookie is only sent over HTTPS in production
 * SameSite prevents CSRF attacks
 * 
 * @returns {Object} Cookie configuration options
 */
export const getRefreshTokenCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const maxAge = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

  return {
    httpOnly: true, // Prevents client-side JavaScript access (XSS protection)
    secure: isProduction, // HTTPS only in production
    // The deployed frontend (Vercel) and backend (Railway) are on different
    // domains — a genuinely cross-site setup. SameSite=Strict (or Lax) would
    // stop the browser attaching this cookie to the frontend's cross-origin
    // /auth/me and /auth/refresh calls, and to the Google OAuth callback
    // redirect, so every login would look unauthenticated in production.
    // SameSite=None requires Secure, which is already true in production.
    sameSite: isProduction ? "none" : "lax",
    maxAge, // Cookie expiry time
    path: "/", // Cookie available across entire domain
  };
};

/**
 * Clear refresh token cookie
 * @returns {Object} Cookie options to clear the token
 */
export const clearRefreshTokenCookie = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax", // must match getRefreshTokenCookieOptions above
    maxAge: 0, // Expire immediately
    path: "/",
  };
};
