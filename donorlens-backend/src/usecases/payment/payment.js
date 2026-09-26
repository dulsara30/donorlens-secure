import Payment from "../../models/payment/Payment.js";

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

}
