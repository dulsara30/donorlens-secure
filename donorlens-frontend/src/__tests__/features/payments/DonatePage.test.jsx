import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DonatePage from "../../../features/payments/pages/DonatePage";
import { getSingleCampaignApi } from "../../../features/campaigns/api";

// Mock the API call
vi.mock("../../../features/campaigns/api", () => ({
  getSingleCampaignApi: vi.fn(),
}));

vi.mock("../../../lib/axios", () => ({
  default: { post: vi.fn() },
}));

// Mock the hidden form component to avoid form submission issues in test environment
vi.mock("../../../features/payments/components/PaymentForm", () => ({
  PayHereHiddenForm: ({ amount, firstName }) => (
    <div data-testid="hidden-form">
      Hidden Form - {amount} - {firstName}
    </div>
  ),
}));

// Mock the Auth Context used in the Header
vi.mock("../../../state/useAuth", () => ({
  useAuth: vi.fn(),
}));

// Import useAuth after it has been mocked
import { useAuth } from "../../../state/useAuth";
import api from "../../../lib/axios";

describe("DonatePage", () => {
  const mockCampaign = {
    _id: "test-campaign-123",
    title: "Test Campaign for Clean Water",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getSingleCampaignApi.mockResolvedValue({ data: mockCampaign });
    api.post.mockResolvedValue({ data: { order_id: "DL-test" } });

    // Provide default mock implementation for useAuth
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      logout: vi.fn()
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={["/donate/test-campaign-123"]}>
        <Routes>
          <Route path="/donate/:id" element={<DonatePage />} />
        </Routes>
      </MemoryRouter>
    );
  };


  // ============================================
  // RENDERING TESTS
  // ============================================
  describe("Rendering", () => {
    it("should render without crashing", async () => {
      renderComponent();
      expect(screen.getByText(/Make a Difference/i)).toBeTruthy();
    });

    it("should fetch and display campaign title", async () => {
      renderComponent();
      await waitFor(() => {
        expect(getSingleCampaignApi).toHaveBeenCalledWith("test-campaign-123");
        expect(screen.getByText("Test Campaign for Clean Water")).toBeTruthy();
      });
    });

    it("should default to Step 1", () => {
      renderComponent();
      expect(screen.getByRole("button", { name: /Continue/i })).toBeTruthy();
    });
  });

  // ============================================
  // USER INTERACTION TESTS
  // ============================================
  describe("User Interactions & Step Navigation", () => {
    it("should display validation errors when submitting Step 1 with amount < 50", async () => {
      const user = userEvent.setup();
      renderComponent();

      // Select Custom Amount
      const customAmountRadio = screen.getByLabelText(/Custom Amount/i);
      await user.click(customAmountRadio);

      // Enter an amount less than 50
      const input = screen.getByPlaceholderText(/Enter custom amount/i);
      await user.clear(input);
      await user.type(input, "10");

      // Attempt to proceed
      const continueBtn = screen.getByRole("button", { name: /Continue/i });
      await user.click(continueBtn);

      // Verify error
      expect(screen.getByText(/Minimum donation amount is LKR 50/i)).toBeTruthy();
    });

    it("should proceed to Step 2 if amount is valid", async () => {
      const user = userEvent.setup();
      renderComponent();

      // Proceed to next step with default amount (1000)
      const continueBtn = screen.getByRole("button", { name: /Continue/i });
      await user.click(continueBtn);

      // Since Step 2 requires donor info, we should now see input fields
      expect(screen.getByLabelText(/First Name/i)).toBeTruthy();
      expect(screen.getByLabelText(/Last Name/i)).toBeTruthy();
    });

    it("should show validation errors in Step 2 if fields are missing", async () => {
      const user = userEvent.setup();
      renderComponent();

      // Skip to Step 2
      await user.click(screen.getByRole("button", { name: /Continue/i }));

      // Try submitting empty details
      await user.click(screen.getByRole("button", { name: /Continue/i }));

      // Expect specific validation errors
      expect(screen.getByText(/First name is required/i)).toBeTruthy();
      expect(screen.getByText(/Email is required/i)).toBeTruthy();
    });

    it("should proceed to Step 3 if Step 2 is valid", async () => {
      const user = userEvent.setup();
      renderComponent();

      // To Step 2
      await user.click(screen.getByRole("button", { name: /Continue/i }));

      // Fill valid info
      await user.type(screen.getByLabelText(/First Name/i), "John");
      await user.type(screen.getByLabelText(/Last Name/i), "Doe");
      await user.type(screen.getByLabelText(/Email Address/i), "john@example.com");
      await user.type(screen.getByLabelText(/Phone Number/i), "1234567890");
      await user.type(screen.getByLabelText(/^Address/i), "123 Test St");
      await user.type(screen.getByLabelText(/City/i), "Test City");

      // Go to Step 3
      await user.click(screen.getByRole("button", { name: /Continue/i }));

      // Verify we reached Step 3
      expect(screen.getByRole("button", { name: /Proceed to Payment/i })).toBeTruthy();
    });

    it("should allow navigating back from Step 2 to Step 1", async () => {
      const user = userEvent.setup();
      renderComponent();

      // Step 2
      await user.click(screen.getByRole("button", { name: /Continue/i }));

      // Step 1
      await user.click(screen.getByRole("button", { name: /Back/i }));

      // Verify we are back
      expect(screen.queryByLabelText(/First Name/i)).toBeNull();
    });
  });

  // ============================================
  // FINAL SUBMISSION TESTS
  // ============================================
  describe("Submission", () => {
    it("should trigger programmatic form submission on final step", async () => {
      const user = userEvent.setup();
      renderComponent();

      // Step 2
      await user.click(screen.getByRole("button", { name: /Continue/i }));

      // Fill valid info
      await user.type(screen.getByLabelText(/First Name/i), "John");
      await user.type(screen.getByLabelText(/Last Name/i), "Doe");
      await user.type(screen.getByLabelText(/Email Address/i), "john@example.com");
      await user.type(screen.getByLabelText(/Phone Number/i), "123456789");
      await user.type(screen.getByLabelText(/^Address/i), "St");
      await user.type(screen.getByLabelText(/City/i), "City");

      // Step 3
      await user.click(screen.getByRole("button", { name: /Continue/i }));

      // Confirm Submit
      const proceedBtn = screen.getByRole("button", { name: /Proceed to Payment/i });
      expect(proceedBtn.disabled).toBe(false);

      await user.click(proceedBtn);

      // Verify UI changes to Loading / Submitting 
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith("/payment/checkout", {
          campaignId: "test-campaign-123",
          amount: 1000,
        });
      });
      expect(proceedBtn.disabled).toBe(true);
      expect(screen.getByText(/Redirecting/i)).toBeTruthy();
    });
  });
});
