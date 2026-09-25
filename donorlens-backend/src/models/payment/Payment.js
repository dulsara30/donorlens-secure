import mongoose from "mongoose";

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    donor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    campaign: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: [1, "Amount must be greater than 0"],
    },

    orderId: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      trim: true,
    },

    currency: {
      type: String,
      default: "LKR",
      uppercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "REJECTED", "FAILED"],
      default: "PENDING",
    },

    confirmedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    confirmedAt: {
      type: Date,
    },

    transactionId: {
      type: String,
      unique: true,
      sparse: true, // allows multiple documents with no transactionId
      trim: true,
    },

    paymentMethod: {
      type: String,
      enum: ["CARD", "BANK_TRANSFER", "ONLINE", "OTHER"],
      default: "CARD",
    },
  },
  {
    timestamps: true,
  },
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;