import { PaymentUsecase } from "../../usecases/payment/payment.js";
import { PaymentLogUsecase } from "../../usecases/payment/paymentLog.js";
import { createCheckout } from "../../usecases/payment/createCheckout.js";
import {
  confirmPayment as confirmPaymentUsecase,
  listPendingPayments as listPendingPaymentsUsecase,
  rejectPayment as rejectPaymentUsecase,
} from "../../usecases/payment/reviewPayment.js";

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

export const listPendingPayments = async (req, res, next) => {
  try {
    const result = await listPendingPaymentsUsecase();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const confirmPayment = async (req, res, next) => {
  try {
    const payment = await confirmPaymentUsecase({
      paymentId: req.params.id,
      adminId: req.user.userId,
    });
    return res.status(200).json({
      success: true,
      message: "Payment confirmed successfully",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectPayment = async (req, res, next) => {
  try {
    const payment = await rejectPaymentUsecase({
      paymentId: req.params.id,
      adminId: req.user.userId,
    });
    return res.status(200).json({
      success: true,
      message: "Payment rejected successfully",
      data: payment,
    });
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
