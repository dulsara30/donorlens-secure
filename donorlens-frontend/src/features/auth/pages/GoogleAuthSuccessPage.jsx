// Landing page after the backend's Google OIDC callback redirects back here.
// No tokens ever appear in this URL: the backend already set our normal
// HttpOnly refresh-token cookie, so AuthProvider's usual restoreSession()
// (triggered automatically on app load) picks the session up the same way
// it does after any page refresh — this page just waits for that and routes
// the donor on based on their role.

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../state/useAuth";

const getRedirectPath = (role) => {
  if (role === "ADMIN") return "/sys-admin";
  if (role === "NGO_ADMIN") return "/admin/dashboard";
  return "/";
};

const GoogleAuthSuccessPage = () => {
  const { loading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return; // session restore still in progress

    if (isAuthenticated && user) {
      navigate(getRedirectPath(user.role), { replace: true });
    } else {
      navigate("/login?error=google_failed", { replace: true });
    }
  }, [loading, isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-600">Finishing Google sign-in...</p>
      </div>
    </div>
  );
};

export default GoogleAuthSuccessPage;
