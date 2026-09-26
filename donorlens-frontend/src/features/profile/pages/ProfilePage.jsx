// src/features/profile/pages/ProfilePage.jsx
// User profile page for donors

import { useEffect, useState } from "react";
import { useAuth } from "../../../state/useAuth";
import { getUserDonations } from "../api";

const donationStatusLabels = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  FAILED: "Failed",
};

const donationStatusStyles = {
  PENDING: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  FAILED: "bg-slate-100 text-slate-700",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setIsLoading(true);
        const response = await getUserDonations();
        if (response.success) {
          setDonations(response.data);
        } else {
          setError(response.message || "Failed to load donations.");
        }
      } catch (err) {
        console.error("Error fetching donations:", err);
        setError("Unable to load donation history. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonations();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Profile</h1>
          <p className="text-slate-600">Manage your account information</p>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Personal Information
          </h2>
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-500 mb-1">
                Full Name
              </label>
              <p className="text-base text-slate-900">{user?.name || "N/A"}</p>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-500 mb-1">
                Email Address
              </label>
              <p className="text-base text-slate-900">{user?.email || "N/A"}</p>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-500 mb-1">
                Account Type
              </label>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full w-fit">
                Donor
              </span>
            </div>
          </div>
        </div>

        {/* Donation History */}
        <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Donation History
          </h2>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600 bg-red-50 rounded-lg">
              <p>{error}</p>
            </div>
          ) : donations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                  <tr>
                    <th scope="col" className="px-6 py-3">Date</th>
                    <th scope="col" className="px-6 py-3">Campaign</th>
                    <th scope="col" className="px-6 py-3">Amount</th>
                    <th scope="col" className="px-6 py-3">Method</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation) => (
                    <tr key={donation._id} className="bg-white border-b border-gray-200 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(donation.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 line-clamp-2">
                        {donation.campaign?.title || 'Unknown Campaign'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-teal-primary whitespace-nowrap">
                        {donation.currency} {donation.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                        {donation.paymentMethod || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${donationStatusStyles[donation.status] || "bg-slate-100 text-slate-700"}`}>
                          {donationStatusLabels[donation.status] || "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-slate-300 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-slate-600 text-base mb-2">No donations yet</p>
              <p className="text-slate-500 text-sm mb-4">
                Your donation history will appear here
              </p>
              <a
                href="/campaigns"
                className="inline-block px-6 py-2 bg-teal-primary text-white text-sm font-semibold rounded-lg hover:bg-teal-secondary transition-colors no-underline"
              >
                Browse Campaigns
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
