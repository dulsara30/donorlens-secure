import crypto from "node:crypto";
import mongoose from "mongoose";
import Campaign from "../../models/campaigns/Campaign.js";
import Payment from "../../models/payment/Payment.js";
import { BadRequestError, ConfigurationError } from "../../utils/errors.js";

const md5Upper = (value) =>
  crypto.createHash("md5").update(value).digest("hex").toUpperCase();

export async function createCheckout({ donorId, campaignId, amount }) {
  const value = Number(amount);

  if (!Number.isFinite(value) || value < 50 || value > 1_000_000) {
    throw new BadRequestError("Donation amount must be between LKR 50 and 1,000,000");
  }

  if (!mongoose.isValidObjectId(campaignId)) {
    throw new BadRequestError("Campaign not available");
  }

  const campaign = await Campaign.findById(campaignId);
  if (!campaign || campaign.status !== "ONGOING") {
    throw new BadRequestError("Campaign not available");
  }

  const currency = process.env.PAYHERE_CURRENCY?.toUpperCase();
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL;
  const backendUrl =
    process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;

  if (!currency || !merchantId || !merchantSecret || !frontendUrl) {
    throw new ConfigurationError("PayHere checkout environment is incomplete");
  }

  const orderId = `DL-${crypto.randomUUID()}`;
  const amountFormatted = value.toFixed(2);

  await Payment.create({
    donor: donorId,
    campaign: campaignId,
    amount: value,
    currency,
    orderId,
    status: "PENDING",
  });

  const hash = md5Upper(
    merchantId + orderId + amountFormatted + currency + md5Upper(merchantSecret),
  );

  return {
    merchant_id: merchantId,
    order_id: orderId,
    amount: amountFormatted,
    currency,
    hash,
    items: campaign.title,
    return_url: `${frontendUrl.replace(/\/$/, "")}/payment/return?order_id=${encodeURIComponent(orderId)}`,
    cancel_url: `${frontendUrl.replace(/\/$/, "")}/payment/cancel`,
    notify_url: `${backendUrl.replace(/\/$/, "")}/api/payment/notify`,
  };
}