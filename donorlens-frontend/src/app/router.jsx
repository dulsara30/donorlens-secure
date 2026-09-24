import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "../components/guards/ProtectedRoute";
import UserRoute from "../components/guards/UserRoute";
import NGOAdminRoute from "../components/guards/NGOAdminRoute";
import { ROLES } from "../lib/constants";

import LoginPage from "../features/auth/pages/LoginPage";
import LogoutPage from "../features/auth/pages/LogoutPage";
import GoogleAuthSuccessPage from "../features/auth/pages/GoogleAuthSuccessPage";
import PasswordSetupPage from "../features/auth/pages/PasswordSetupPage";
import Unauthorized from "../pages/Unauthorized";
import NotFound from "../pages/NotFound";
import HomePage from "../pages/HomePage";
import RegisterUserPage from "../pages/RegisterUserPage";
import NgoRequestPage from "../pages/NgoRequestPage";
import TermsPage from "../pages/TermsPage";
import TransparencyPage from "../pages/TransparencyPage";
import CampaignsPage from "../pages/CampaignsPage";
import PublicCampaignDetailsPage from "../pages/PublicCampainDetailsPage";

import CampaignListPage from "../features/campaigns/pages/CampaignListPage";
import CampaignDetailsPage from "../features/campaigns/pages/CampaignDetailsPage";
import DonatePage from "../features/payments/pages/DonatePage";
import PaymentSuccessPage from "../features/payments/pages/PaymentSuccessPage";
import PaymentCancelPage from "../features/payments/pages/PaymentCancelPage";

import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage";
import AdminCreateCampaignPage from "../features/campaigns/pages/AdminCreateCampaignPage";
import UpdateCampaignPage from "../features/campaigns/pages/UpdateCampaignPage";
import AdminExpenseTrackerPage from "../features/tracking/pages/AdminExpenseTrackerPage";
import AdminFinalReportPage from "../features/impact/pages/AdminFinalReportPage";

import ProfilePage from "../features/profile/pages/ProfilePage";
import AdminRoute from "../components/guards/AdminRoute";
import SystemAdminLayout from "../features/systemAdmin/layout/SystemAdminLayout";
import SystemAdminOverviewPage from "../features/systemAdmin/pages/SystemAdminOverviewPage";
import SystemAdminUsersPage from "../features/systemAdmin/pages/SystemAdminUsersPage";
import SystemAdminNgoRequestsPage from "../features/systemAdmin/pages/SystemAdminNgoRequestsPage";
import SystemAdminCampaignsPage from "../features/systemAdmin/pages/SystemAdminCampaignsPage";
import ExecutionUpdatesPage from "../features/impact/pages/ExecutionUpatesPage";
import ExecutionDashboardPage from "../features/impact/pages/ExecutionDashboardPage";
import ExecutionDetailPage from "../features/impact/pages/ExecutionDetailPage";
import ExecutionCreatePage from "../features/impact/pages/ExecutionCreatePage";

export const router = createBrowserRouter([
  // AUTH ROUTES (Public)
  { path: "/login", element: <LoginPage /> },
  { path: "/logout", element: <LogoutPage /> },
  { path: "/auth/google/success", element: <GoogleAuthSuccessPage /> },
  { path: "/password-setup", element: <PasswordSetupPage /> },
  { path: "/register", element: <RegisterUserPage /> },
  { path: "/register/user", element: <RegisterUserPage /> },
  { path: "/register/ngo", element: <NgoRequestPage /> },
  // { path: "/ngo-request", element: <NgoRequestPage /> },
  { path: "/terms-privacy", element: <TermsPage /> },

  // PUBLIC ROUTES
  { path: "/", element: <HomePage /> },
  { path: "/campaigns", element: <CampaignsPage /> },
  { path: "/campaigns/:id", element: <PublicCampaignDetailsPage /> },
  { path: "/campaigns/:id/donate", element: <DonatePage /> },
  { path: "/transparency", element: <TransparencyPage /> },
  { path: "/payment/return", element: <PaymentSuccessPage /> },
  { path: "/payment/cancel", element: <PaymentCancelPage /> },
  // { path: "/admin/campaigns/new", element: <AdminCreateCampaignPage /> },

  // USER ONLY ROUTES (Donors)
  {
    element: <UserRoute />,
    children: [
      { path: "/profile", element: <ProfilePage /> },
      // Add more USER-only routes here (donations history, etc.)
    ],
  },

  // ADMIN ONLY ROUTES (NGO_ADMIN)
  {
    element: <NGOAdminRoute />,
    children: [
      { path: "/admin", element: <AdminDashboardPage /> }, // Base layout for admin routes
      { path: "/admin/dashboard", element: <AdminDashboardPage /> },
      { path: "/admin/campaigns/new", element: <AdminCreateCampaignPage /> },
      { path: "/admin/campaigns", element: <CampaignListPage /> },
      { path: "/admin/campaigns/:id", element: <CampaignDetailsPage /> },
      { path: "/admin/campaigns/:id/edit", element: <UpdateCampaignPage /> },
      { path: "/admin/tracking/:id", element: <AdminExpenseTrackerPage /> },
      { path: "/admin/impact/:id", element: <AdminFinalReportPage /> },
      {
        path: "/admin/campaign-executions",
        element: <ExecutionDashboardPage />,
      },
      {
        path: "/admin/campaign-executions/:campaignId",
        element: <ExecutionUpdatesPage />,
      },
      {
        path: "/admin/campaign-executions/:campaignId/create",
        element: <ExecutionCreatePage />,
      },
      {
        path: "/admin/campaign-executions/:campaignId/:executionId",
        element: <ExecutionDetailPage />,
      },
      { path: "/admin/executions", element: <ExecutionUpdatesPage /> },
    ],
  },

  // ADMIN ONLY ROUTES (NGO_ADMIN)
  {
    element: <AdminRoute />,
    children: [
      { path: "/sys-admin", element: <SystemAdminOverviewPage /> },
      { path: "/sys-admin/dashboard", element: <SystemAdminOverviewPage /> },
      { path: "/sys-admin/users", element: <SystemAdminUsersPage /> },
      {
        path: "/sys-admin/ngo-requests",
        element: <SystemAdminNgoRequestsPage />,
      },
      {
        path: "/sys-admin/campaigns",
        element: <SystemAdminCampaignsPage />,
      },
    ],
  },

  { path: "/unauthorized", element: <Unauthorized /> },
  // 404 Catch-all Route (MUST be last)
  { path: "*", element: <NotFound /> },
]);
