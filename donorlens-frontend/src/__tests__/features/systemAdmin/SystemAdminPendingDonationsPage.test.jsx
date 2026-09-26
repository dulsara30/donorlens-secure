import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SystemAdminPendingDonationsPage from "../../../features/systemAdmin/pages/SystemAdminPendingDonationsPage";
import {
  fetchPendingPaymentsAPI,
  reviewPaymentAPI,
} from "../../../features/systemAdmin/api";

vi.mock("../../../features/systemAdmin/layout/SystemAdminLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../../features/systemAdmin/api", () => ({
  fetchPendingPaymentsAPI: vi.fn(),
  reviewPaymentAPI: vi.fn(),
}));

describe("SystemAdminPendingDonationsPage", () => {
  const pendingPayment = {
    _id: "payment-1",
    orderId: "DL-order-123",
    amount: 2500,
    currency: "LKR",
    createdAt: "2026-09-26T10:00:00.000Z",
    donor: { fullName: "Test Donor", email: "donor@example.com" },
    campaign: { title: "Clean Water" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn().mockReturnValue(true);
    window.alert = vi.fn();
    fetchPendingPaymentsAPI.mockResolvedValue({ data: [pendingPayment] });
    reviewPaymentAPI.mockResolvedValue({ success: true });
  });

  it("shows donor, campaign, amount, and PayHere order ID", async () => {
    render(<SystemAdminPendingDonationsPage />);

    expect(await screen.findByText("DL-order-123")).toBeTruthy();
    expect(screen.getByText("Test Donor")).toBeTruthy();
    expect(screen.getByText("donor@example.com")).toBeTruthy();
    expect(screen.getByText("Clean Water")).toBeTruthy();
    expect(screen.getByText("LKR 2,500")).toBeTruthy();
  });

  it("confirms only after the admin confirmation prompt", async () => {
    render(<SystemAdminPendingDonationsPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));

    expect(window.confirm).toHaveBeenCalledWith(
      "Confirm order DL-order-123 after verifying its order ID, amount, and currency in PayHere's merchant portal?",
    );
    await waitFor(() => {
      expect(reviewPaymentAPI).toHaveBeenCalledWith("payment-1", "confirm");
      expect(window.alert).toHaveBeenCalledWith("Payment confirmed successfully.");
      expect(screen.queryByText("DL-order-123")).toBeNull();
    });
  });

  it("rejects only after the admin confirmation prompt", async () => {
    render(<SystemAdminPendingDonationsPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Reject" }));

    expect(window.confirm).toHaveBeenCalledWith("Reject order DL-order-123?");
    await waitFor(() => {
      expect(reviewPaymentAPI).toHaveBeenCalledWith("payment-1", "reject");
      expect(window.alert).toHaveBeenCalledWith("Payment rejected successfully.");
      expect(screen.queryByText("DL-order-123")).toBeNull();
    });
  });
});