// Professional login card with full authentication integration

import { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../state/useAuth";
import { login as loginApi } from "../../features/auth/api";
import { setAccessToken as setAxiosAccessToken } from "../../lib/axios";

// Friendly messages for ?error= codes the Google OIDC callback can redirect
// back with (see donorlens-backend/src/routes/auth/googleAuth.route.js)
const GOOGLE_ERROR_MESSAGES = {
  google_cancelled: "Google sign-in was cancelled.",
  invalid_state: "That Google sign-in link expired or was already used. Please try again.",
  invalid_nonce: "That Google sign-in link expired or was already used. Please try again.",
  email_not_verified: "Your Google account's email isn't verified yet. Please verify it with Google first.",
  account_not_allowed: "Google sign-in isn't available for NGO or admin accounts. Please use your password.",
  google_failed: "Google sign-in didn't work. Please try again or use your password.",
};

const LoginCard = () => {

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // UI state
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(
    () => GOOGLE_ERROR_MESSAGES[searchParams.get("error")] || "",
  );

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Get redirect path from location state (if user was redirected to login)
  const from = location.state?.from?.pathname || null;

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  // Determine redirect path based on user role
  const getRedirectPath = (role) => {
    // If user was trying to access a protected page, redirect back there
    if (from && from !== "/login") {
      return from;
    }
    
    // Otherwise, redirect based on role
    if (role === "ADMIN"){
      return "/sys-admin";
    } else if (role === "NGO_ADMIN") {
      return "/admin/dashboard";
    } else if (role === "USER") {
      return "/"; // Users stay on homepage/website (no separate dashboard)
    }
    
    // Fallback
    return "/";
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError("");

    // Basic validation
    if (!formData.email.trim() || !formData.password) {
      setError("Email and password are required");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Set loading state
    setIsLoading(true);

    try {
      // Call login API
      const response = await loginApi({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      // Login successful
      if (response.success) {
        const { user, accessToken } = response.data;
        
        // Set access token in axios instance
        setAxiosAccessToken(accessToken);
        
        // Update auth context
        login(user, accessToken);
        
        // Redirect based on user role
        const redirectPath = getRedirectPath(user.role);
        navigate(redirectPath, { replace: true });
      }
    } catch (err) {
      // Handle API errors
      console.error("Login error:", err);
      
      // Display user-friendly error message
      if (err.message) {
        setError(err.message);
      } else if (err.status === 401) {
        setError("Invalid email or password");
      } else if (err.status === 403) {
        setError("Account is deactivated. Please contact support");
      } else {
        setError("Login failed. Please try again later");
      }
      
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Card Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          Welcome back
        </h1>
        <p className="text-base text-slate-600">
          Sign in to your account to continue
        </p>
      </div>

      {/* Success Message from Registration */}
      {location.state?.message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-800">{location.state.message}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        {/* Email Input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-semibold text-slate-700">
            Email address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3.5 border border-slate-300 rounded-lg text-base transition-all duration-200 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/20 disabled:bg-slate-50 disabled:cursor-not-allowed"
            placeholder="you@example.com"
            disabled={isLoading}
            required
          />
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700">
              Password
            </label>
            <Link 
              to="/forgot-password" 
              className="text-sm text-slate-600 no-underline font-medium transition-colors duration-200 hover:text-slate-900"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3.5 border border-slate-300 rounded-lg text-base transition-all duration-200 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/20 disabled:bg-slate-50 disabled:cursor-not-allowed"
            placeholder="Enter your password"
            disabled={isLoading}
            required
          />
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="remember"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 border-slate-300 rounded text-slate-900 focus:ring-2 focus:ring-slate-900/20 cursor-pointer disabled:cursor-not-allowed"
            disabled={isLoading}
          />
          <label htmlFor="remember" className="text-sm text-slate-700 cursor-pointer select-none">
            Remember me for 30 days
          </label>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          className="w-full px-6 py-3.5 bg-slate-900 text-white border-none rounded-lg font-semibold text-base cursor-pointer transition-all duration-200 hover:bg-slate-800 hover:shadow-lg disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-8">
        <span className="flex-1 h-px bg-slate-200"></span>
        <span className="text-sm text-slate-500 font-medium">or</span>
        <span className="flex-1 h-px bg-slate-200"></span>
      </div>

      {/* Continue with Google (OIDC, Authorization Code + PKCE) */}
      <button
        type="button"
        disabled={isLoading}
        onClick={() => {
          // Plain navigation, not an axios call — the backend needs to set
          // a cookie and redirect the browser to Google.
          window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
        }}
        className="w-full px-6 py-3.5 bg-white text-slate-700 border border-slate-300 rounded-lg font-semibold text-base cursor-pointer transition-all duration-200 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.6 10.23c0-.68-.06-1.33-.17-1.96H10v3.71h5.38a4.6 4.6 0 01-2 3.02v2.5h3.23c1.9-1.75 2.99-4.32 2.99-7.27z" fill="#4285F4"/>
          <path d="M10 20c2.7 0 4.96-.89 6.62-2.42l-3.23-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H1.08v2.59A10 10 0 0010 20z" fill="#34A853"/>
          <path d="M4.41 11.92A5.99 5.99 0 014.09 10c0-.67.11-1.32.32-1.92V5.49H1.08A10 10 0 000 10c0 1.61.39 3.14 1.08 4.51l3.33-2.59z" fill="#FBBC05"/>
          <path d="M10 3.96c1.47 0 2.79.5 3.82 1.5l2.87-2.87C14.95.99 12.7 0 10 0 6.09 0 2.72 2.24 1.08 5.49l3.33 2.59C5.2 5.72 7.4 3.96 10 3.96z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      {/* Registration Links */}
      {!isLoading && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 text-center mb-4">
            Don't have an account? Create one now
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Link 
              to="/register/user" 
              className="px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg font-semibold text-sm no-underline text-center transition-all duration-200 hover:bg-slate-50 hover:border-slate-400"
            >
              As Donor
            </Link>
            <Link 
              to="/register/ngo" 
              className="px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg font-semibold text-sm no-underline text-center transition-all duration-200 hover:bg-slate-50 hover:border-slate-400"
            >
              As NGO
            </Link>
          </div>
        </div>
      )}

      {/* Security Badge */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs font-medium">Secured with 256-bit encryption</span>
        </div>
      </div>
    </div>
  );
};

export default LoginCard;
