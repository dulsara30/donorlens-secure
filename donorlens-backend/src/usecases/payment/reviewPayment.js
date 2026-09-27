import mongoose from "mongoose";
import Campaign from "../../models/campaigns/Campaign.js";
import Payment from "../../models/payment/Payment.js";
import { BadRequestError, ConflictError } from "../../utils/errors.js";

export async function listPendingPayments() {
  const payments = await Payment.find({ status: "PENDING" })
    .populate("donor", "fullName email")
    .populate("campaign", "title")
    .sort({ createdAt: 1 });

  return {
    success: true,
    count: payments.length,
    data: payments,
  };
}

export async function confirmPayment({ paymentId, adminId }) {
  const payment = await reviewPendingPayment(paymentId, {
    status: "COMPLETED",
    confirmedBy: adminId,
    confirmedAt: new Date(),
  });

  await Campaign.updateOne(
    { _id: payment.campaign },
    { $inc: { raisedAmount: payment.amount } },
  );
  await Campaign.updateOne(
    { _id: payment.campaign },
    [
      {
        $set: {
          progressPercentage: {
            $cond: [
              { $gt: ["$totalPlannedCost", 0] },
              {
                $min: [
                  100,
                  {
                    $round: [
                      {
                        $multiply: [
                          { $divide: ["$raisedAmount", "$totalPlannedCost"] },
                          100,
                        ],
                      },
                      0,
                    ],
                  },
                ],
              },
              0,
            ],
          },
          status: {
            $cond: [
              {
                $and: [
                  { $gt: ["$totalPlannedCost", 0] },
                  { $gte: ["$raisedAmount", "$totalPlannedCost"] },
                ],
              },
              "COMPLETED",
              "$status",
            ],
          },
        },
      },
    ],
    { updatePipeline: true },
  );

  return payment;
}

export async function rejectPayment({ paymentId, adminId }) {
  return reviewPendingPayment(paymentId, {
    status: "REJECTED",
    confirmedBy: adminId,
    confirmedAt: new Date(),
  });
}

async function reviewPendingPayment(paymentId, review) {
  if (!mongoose.isValidObjectId(paymentId)) {
    throw new BadRequestError("Invalid payment ID");
  }

  const payment = await Payment.findOneAndUpdate(
    { _id: paymentId, status: "PENDING" },
    { $set: review },
    { new: true, runValidators: true },
  );

  if (!payment) {
    throw new ConflictError("Payment not found or already reviewed");
  }

  return payment;
}