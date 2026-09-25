import { PaymentUsecase } from "../../usecases/payment/payment.js";
import { PaymentLogUsecase } from "../../usecases/payment/paymentLog.js";
import { createCheckout } from "../../usecases/payment/createCheckout.js";
import { isNull } from "../../utils/isNull.js";

const paymentUsecase = new PaymentUsecase();
const paymentLogUsecase = new PaymentLogUsecase();

export const createCheckoutController = async (req, res, next) => {
  try {
    const checkout = await createCheckout({
      donorId: req.user.userId,
      campaignId: req.body?.campaignId,
      amount: req.body?.amount,
    });
    return res.status(201).json(checkout);
  } catch (error) {
    next(error);
  }
};

export const getAllPayments = async (req, res, next) => {
  try {
    const result = await paymentUsecase.getAllPayments();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getUserPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await paymentUsecase.getUserPayments(userId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllPaymentLogs = async (req, res, next) => {
  try {
    const result = await paymentLogUsecase.getAllLogs();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (req, res, next) => {
  const donorId = req.user?.userId || null;
  const { campaignId, amount, currency, paymentMethod } = req.body || null;
  const ipAddress = req.ip || req.connection?.remoteAddress || null;

  const logData = {
    donor: donorId,
    campaign: campaignId || null,
    amount: amount || null,
    currency: currency || "LKR",
    paymentMethod: paymentMethod || null,
    requestBody: req.body,
    ipAddress,
  };

  try {
    if (isNull(campaignId) || isNull(amount)) {
      paymentLogUsecase.createLog({
        ...logData,
        status: "FAILED",
        failureReason: "campaignId and amount are required",
        failureCategory: "VALIDATION_ERROR",
      });

      return res.status(400).json({
        success: false,
        message: "campaignId and amount are required",
      });
    }

    if (typeof amount !== "number" || amount <= 0 || isNull(amount)) {
      paymentLogUsecase.createLog({
        ...logData,
        status: "FAILED",
        failureReason: "amount must be a positive number",
        failureCategory: "VALIDATION_ERROR",
      });

      return res.status(400).json({
        success: false,
        message: "amount must be a positive number",
      });
    }

    if (isNull(paymentMethod)) {
      paymentLogUsecase.createLog({
        ...logData,
        status: "FAILED",
        failureReason: "paymentMethod is required",
        failureCategory: "VALIDATION_ERROR",
      });

      return res.status(400).json({
        success: false,
        message: "paymentMethod is required",
      });
    }

    const result = await paymentUsecase.createPayment({
      donorId,
      campaignId,
      amount,
      currency,
      paymentMethod,
    });

    paymentLogUsecase.createLog({
      ...logData,
      status: "SUCCESS",
      payment: result.data?._id || null,
    });

    return res.status(201).json(result);
  } catch (error) {
    const failureCategory = categorizeError(error);

    paymentLogUsecase.createLog({
      ...logData,
      status: "FAILED",
      failureReason: error.message,
      failureCategory,
    });

    next(error);
  }
};

function categorizeError(error) {
  const message = (error.message || "").toLowerCase();

  if (message.includes("not found") || message.includes("cannot donate")) {
    return "CAMPAIGN_ERROR";
  }

  if (
    message.includes("validation") ||
    message.includes("required") ||
    message.includes("invalid") ||
    error.name === "ValidationError"
  ) {
    return "VALIDATION_ERROR";
  }

  if (
    message.includes("payment") ||
    message.includes("provider") ||
    message.includes("gateway") ||
    message.includes("transaction")
  ) {
    return "PAYMENT_PROVIDER_ERROR";
  }

  if (
    message.includes("database") ||
    message.includes("mongo") ||
    message.includes("connection") ||
    error.name === "MongoError" ||
    error.name === "MongoServerError"
  ) {
    return "SYSTEM_ERROR";
  }

  return "UNKNOWN";
}