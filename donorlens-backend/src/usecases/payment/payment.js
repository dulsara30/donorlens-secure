import crypto from "node:crypto";
import Payment from "../../models/payment/Payment.js";
import Campaign from "../../models/campaigns/Campaign.js";

export class PaymentUsecase {
  async getAllPayments() {
    const payments = await Payment.find()
      .populate("donor", "fullName email profile")
      .populate("campaign", "title status raisedAmount totalPlannedCost")
      .sort({ createdAt: -1 });

    return {
      success: true,
      message: "Payments fetched successfully",
      count: payments.length,
      data: payments,
    };
  }

  async getUserPayments(userId) {
    const payments = await Payment.find({ donor: userId })
      .populate(
        "campaign",
        "title status raisedAmount totalPlannedCost coverImage",
      )
      .sort({ createdAt: -1 });

    return {
      success: true,
      message: "Payment history fetched successfully",
      count: payments.length,
      data: payments,
    };
  }

  async createPayment({ donorId, campaignId, amount, currency, paymentMethod }) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    if (campaign.status !== "ONGOING") {
      throw new Error("Cannot donate to a completed campaign");
    }

    const payment = new Payment({
      donor: donorId,
      campaign: campaignId,
      amount,
      orderId: `DL-${crypto.randomUUID()}`,
      currency: currency || "LKR",
      paymentMethod: paymentMethod || "CARD",
      status: "COMPLETED",
    });

    await payment.save();

    campaign.raisedAmount += amount;
    if (campaign.totalPlannedCost > 0) {
      campaign.progressPercentage = Math.min(
        100,
        Math.round((campaign.raisedAmount / campaign.totalPlannedCost) * 100),
      );
    }
    await campaign.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate("donor", "fullName email")
      .populate("campaign", "title status raisedAmount totalPlannedCost");

    return {
      success: true,
      message: "Payment created successfully",
      data: populatedPayment,
    };
  }
}
