import { useCallback, useEffect, useState } from "react";
import SystemAdminLayout from "../layout/SystemAdminLayout";
import { fetchPendingPaymentsAPI, reviewPaymentAPI } from "../api";

export default function SystemAdminPendingDonationsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyPaymentId, setBusyPaymentId] = useState(null);
  const [error, setError] = useState("");

  const loadPayments = useCallback(async () => {
    setError("");
    try {
      const response = await fetchPendingPaymentsAPI();
      setPayments(response.data || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load pending donations. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const reviewPayment = async (payment, decision) => {
    const action = decision === "confirm" ? "confirm" : "reject";
    const prompt =
      decision === "confirm"
        ? `Confirm order ${payment.orderId} after verifying its order ID, amount, and currency in PayHere's merchant portal?`
        : `Reject order ${payment.orderId}?`;

    if (!window.confirm(prompt)) return;

    setBusyPaymentId(payment._id);
    setError("");
    try {
      await reviewPaymentAPI(payment._id, action);
      setPayments((currentPayments) =>
        currentPayments.filter((item) => item._id !== payment._id),
      );
      window.alert(
        action === "confirm"
          ? "Payment confirmed successfully."
          : "Payment rejected successfully.",
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          `Unable to ${action} this donation. Refresh the list and try again.`,
      );
    } finally {
      setBusyPaymentId(null);
    }
  };

  return (
    <SystemAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Pending Donations
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Compare the order ID, amount, and currency with PayHere before confirming.
            </p>
          </div>
          <button
            type="button"
            onClick={loadPayments}
            disabled={loading}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div role="alert" className="border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {loading ? (
            <p className="px-6 py-12 text-center text-sm text-slate-500">
              Loading pending donations...
            </p>
          ) : payments.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-slate-500">
              No pending donations to review.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-235 text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Date</th>
                    <th scope="col" className="px-4 py-3">Donor</th>
                    <th scope="col" className="px-4 py-3">Campaign</th>
                    <th scope="col" className="px-4 py-3">Amount</th>
                    <th scope="col" className="px-4 py-3">PayHere order ID</th>
                    <th scope="col" className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((payment) => (
                    <tr key={payment._id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {new Date(payment.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900">
                          {payment.donor?.fullName || "Unknown donor"}
                        </p>
                        <p className="text-slate-500">{payment.donor?.email || ""}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {payment.campaign?.title || "Campaign unavailable"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">
                        {payment.currency} {Number(payment.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <span className="break-all font-mono text-xs font-semibold text-slate-800">
                          {payment.orderId}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => reviewPayment(payment, "confirm")}
                            disabled={busyPaymentId === payment._id}
                            className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => reviewPayment(payment, "reject")}
                            disabled={busyPaymentId === payment._id}
                            className="rounded-md border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SystemAdminLayout>
  );
}