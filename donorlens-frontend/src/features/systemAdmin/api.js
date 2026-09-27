// ============================================
// SYSTEM ADMIN API SERVICE
// ============================================
// All API calls for system admin features
// TODO: Integrate these functions with your Redux slices

import api from "../../lib/axios";

export const fetchPendingPaymentsAPI = async () => {
  const response = await api.get("/payment/pending");
  return response.data;
};

export const reviewPaymentAPI = async (paymentId, decision) => {
  const response = await api.patch(`/payment/${paymentId}/${decision}`);
  return response.data;
};

/**
 * Fetch dashboard statistics
 * @returns {Promise} Dashboard stats object
 */
export const fetchDashboardStatsAPI = async () => {
  try {
    const response = await api.get("/admin/dashboard/stats");
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    throw error;
  }
};

/**
 * Fetch SDG goals distribution
 * @returns {Promise} Array of SDG goals with counts
 */
export const fetchSDGDistributionAPI = async () => {
  try {
    const response = await api.get("/admin/dashboard/sdg-distribution");
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch SDG distribution:", error);
    throw error;
  }
};

/**
 * Fetch donation trends
 * @param {string} period - 'daily', 'monthly', 'yearly'
 * @returns {Promise} Array of donation trend data
 */
export const fetchDonationTrendsAPI = async (period = "monthly") => {
  try {
    const response = await api.get(`/admin/dashboard/trends?period=${period}`);
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch donation trends:", error);
    throw error;
  }
};

/**
 * Fetch recent activity logs
 * @param {number} limit - Number of activities to fetch
 * @returns {Promise} Array of recent activities
 */
export const fetchRecentActivityAPI = async (limit = 10) => {
  try {
    const response = await api.get(
      `/admin/dashboard/recent-activity?limit=${limit}`,
    );
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch recent activity:", error);
    throw error;
  }
};

/**
 * ==================================================
 * NGO REQUESTS APIs
 * ==================================================
 */

/**
 * Fetch all NGO registration requests
 * @returns {Promise} Array of NGO requests
 */
export const fetchAllNgoRequestsAPI = async () => {
  try {
    const response = await api.get("/admin/fetch-all-register-requests");
    console.log("Fetched NGO requests:", response.data.data);
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch NGO requests:", error);
    throw error;
  }
};

/**
 * Approve an NGO registration request
 * @param {string} requestId - NGO request ID
 * @param {string} note - Optional approval note
 * @returns {Promise} Updated request object
 */
export const approveNgoRequestAPI = async (requestId, note = "") => {
  try {
    const response = await api.put(`/admin/ngo-request/${requestId}/approve`, {
      note,
    });
    return response;
  } catch (error) {
    console.error("Failed to approve NGO request:", error);
    throw error;
  }
};

/**
 * Request resubmission for an NGO registration
 * @param {string} requestId - NGO request ID
 * @param {string} note - Resubmission reason/instructions
 * @returns {Promise} Success message
 */
export const requestNgoResubmitAPI = async (requestId, note) => {
  try {
    const response = await api.put(
      `/admin/ngo-request/${requestId}/resubmission-required`,
      { note },
    );
    return response.data;
  } catch (error) {
    console.error("Failed to request resubmission:", error);
    throw error;
  }
};

/**
 * Reject an NGO registration request
 * @param {string} requestId - NGO request ID
 * @param {string} note - Rejection reason
 * @returns {Promise} Success message
 */
export const rejectNgoRequestAPI = async (requestId, note) => {
  try {
    const response = await api.put(`/admin/ngo-request/${requestId}/reject`, {
      note,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to reject NGO request:", error);
    throw error;
  }
};

/**
 * Resend password setup email to approved NGO
 * @param {string} requestId - NGO request ID
 * @returns {Promise} Success message
 */
export const resendPasswordEmailAPI = async (requestId) => {
  try {
    const response = await api.put(`/admin/pw-Request/${requestId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to resend password email:", error);
    throw error;
  }
};

/**
 * Resend resubmission email to NGO
 * @param {string} requestId - NGO request ID
 * @returns {Promise} Success message
 */
export const resendResubmissionEmailAPI = async (requestId) => {
  try {
    const response = await api.put(
      `/admin/ngo-request/${requestId}/resubmission-required`,
      { note: "" }, // Empty note means just resend email
    );
    return response.data;
  } catch (error) {
    console.error("Failed to resend resubmission email:", error);
    throw error;
  }
};

/**
 * Deactivate an approved NGO account
 * @param {string} ngoId - NGO user ID
 * @param {string} note - Deactivation reason
 * @returns {Promise} Success message
 */
export const deactivateNgoAPI = async (ngoId, note) => {
  try {
    const response = await api.put(`/admin/ngo-request/${ngoId}/deactivate`, {
      note,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to deactivate NGO:", error);
    throw error;
  }
};

/**
 * Delete a deactivated NGO permanently
 * @param {string} ngoId - NGO user ID
 * @returns {Promise} Success message
 */
export const deleteNgoAPI = async (ngoId) => {
  try {
    const response = await api.delete(`/admin/ngo-request/${ngoId}/delete`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete NGO:", error);
    throw error;
  }
};

/**
 * ==================================================
 * USERS APIs
 * ==================================================
 */

/**
 * Fetch all registered users
 * @param {Object} filters - Optional filters (role, status, etc.)
 * @returns {Promise} Array of users
 */
export const fetchAllUsersAPI = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(
      `/admin/users${queryParams ? "?" + queryParams : ""}`,
    );
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
};

/**
 * Fetch specific user details
 * @param {string} userId - User ID
 * @returns {Promise} User object
 */
export const fetchUserDetailsAPI = async (userId) => {
  try {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    throw error;
  }
};

/**
 * Toggle user account status (activate/deactivate)
 * @param {string} userId - User ID
 * @param {boolean} isActive - New active status
 * @returns {Promise} Updated user object
 */
export const toggleUserStatusAPI = async (userId, isActive) => {
  try {
    const response = await api.patch(`/admin/users/${userId}/status`, {
      isActive,
    });
    return response.data.data;
  } catch (error) {
    console.error("Failed to update user status:", error);
    throw error;
  }
};

/**
 * Fetch user's donation history
 * @param {string} userId - User ID
 * @returns {Promise} Array of donations
 */
export const fetchUserDonationsAPI = async (userId) => {
  try {
    const response = await api.get(`/admin/users/${userId}/donations`);
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch user donations:", error);
    throw error;
  }
};

/**
 * Send custom email to user
 * @param {string} userId - User ID
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 * @returns {Promise} Success response
 */
export const sendEmailToUserAPI = async (userId, subject, message) => {
  try {
    const response = await api.post(`/admin/users/${userId}/send-email`, {
      subject,
      message,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
};

/**
 * ==================================================
 * EXPORT/REPORTS APIs
 * ==================================================
 */

/**
 * Export users data to CSV
 * @returns {Promise} CSV file blob
 */
export const exportUsersCSVAPI = async () => {
  try {
    const response = await api.get("/admin/export/users", {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Failed to export users:", error);
    throw error;
  }
};

/**
 * Export NGO requests data to CSV
 * @returns {Promise} CSV file blob
 */
export const exportNgoRequestsCSVAPI = async () => {
  try {
    const response = await api.get("/admin/export/ngo-requests", {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Failed to export NGO requests:", error);
    throw error;
  }
};

/**
 * ==================================================
 * HELPER FUNCTIONS
 * ==================================================
 */

/**
 * Download a file blob
 * @param {Blob} blob - File blob
 * @param {string} filename - Desired filename
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Handle export users to CSV
 */
export const handleExportUsers = async () => {
  try {
    const blob = await exportUsersCSVAPI();
    const filename = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
    downloadFile(blob, filename);
  } catch (error) {
    console.error("Export failed:", error);
    alert("Failed to export users");
  }
};

/**
 * Handle export NGO requests to CSV
 */
export const handleExportNgoRequests = async () => {
  try {
    const blob = await exportNgoRequestsCSVAPI();
    const filename = `ngo-requests-export-${new Date().toISOString().split("T")[0]}.csv`;
    downloadFile(blob, filename);
  } catch (error) {
    console.error("Export failed:", error);
    alert("Failed to export NGO requests");
  }
};

/**
 * ==================================================
 * CAMPAIGN MANAGEMENT APIs
 * ==================================================
 */

/**
 * Fetch all campaigns
 * @returns {Promise} Array of campaigns with populated createdBy (NGO details)
 */
export const fetchAllCampaignsAPI = async () => {
  try {
    const response = await api.get("/campaigns/get-all-campaigns");
    return response?.data?.data || [];
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);
    throw error;
  }
};

/**
 * Toggle campaign status (activate/deactivate)
 * @param {string} campaignId - Campaign ID
 * @param {string} action - 'ACTIVATE' or 'DEACTIVATE'
 * @returns {Promise} Updated campaign object
 */
export const toggleCampaignStatusAPI = async (campaignId, action) => {
  try {
    // TODO: Backend endpoint to activate/deactivate campaign
    // Should send email notification to NGO
    const response = await api.patch(`/admin/campaigns/${campaignId}/status`, {
      action,
    });
    return response.data.data;
  } catch (error) {
    console.error(`Failed to ${action} campaign:`, error);
    throw error;
  }
};

/**
 * Send warning email to NGO about campaign
 * @param {string} campaignId - Campaign ID
 * @param {string} subject - Email subject
 * @param {string} message - Email message content
 * @returns {Promise} Success message
 */
export const sendCampaignWarningEmailAPI = async (
  campaignId,
  subject,
  message,
) => {
  try {
    // TODO: Backend endpoint to send warning email
    // Should include campaign details in email
    const response = await api.post(
      `/admin/campaigns/${campaignId}/send-warning`,
      {
        subject,
        message,
      },
    );
    return response.data;
  } catch (error) {
    console.error("Failed to send warning email:", error);
    throw error;
  }
};

/**
 * Delete/Remove campaign (optional - more severe than deactivate)
 * @param {string} campaignId - Campaign ID
 * @returns {Promise} Success message
 */
export const deleteCampaignAPI = async (campaignId) => {
  try {
    // TODO: Backend endpoint to permanently delete campaign
    const response = await api.delete(`/admin/campaigns/${campaignId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete campaign:", error);
    throw error;
  }
};

/**
 * Fetch execution updates for a specific campaign
 * @param {string} campaignId - Campaign ID
 * @returns {Promise} Execution payload with campaign, summary, executions
 */
export const fetchCampaignExecutionsAPI = async (campaignId) => {
  try {
    const response = await api.get(
      `/campaign-executions/${campaignId}/executions`,
    );
    return (
      response?.data?.data || { campaign: null, summary: null, executions: [] }
    );
  } catch (error) {
    console.error("Failed to fetch campaign executions:", error);
    throw error;
  }
};

// Export everything as default
export default {
  // Dashboard
  fetchDashboardStatsAPI,
  fetchSDGDistributionAPI,
  fetchDonationTrendsAPI,
  fetchRecentActivityAPI,

  // NGO Requests
  fetchAllNgoRequestsAPI,
  approveNgoRequestAPI,
  requestNgoResubmitAPI,
  rejectNgoRequestAPI,
  resendPasswordEmailAPI,
  deactivateNgoAPI,

  // Users
  fetchAllUsersAPI,
  fetchUserDetailsAPI,
  toggleUserStatusAPI,
  fetchUserDonationsAPI,
  sendEmailToUserAPI,

  // Campaigns
  fetchAllCampaignsAPI,
  fetchCampaignExecutionsAPI,
  toggleCampaignStatusAPI,
  sendCampaignWarningEmailAPI,
  deleteCampaignAPI,

  // Export
  exportUsersCSVAPI,
  exportNgoRequestsCSVAPI,
  handleExportUsers,
  handleExportNgoRequests,
};
