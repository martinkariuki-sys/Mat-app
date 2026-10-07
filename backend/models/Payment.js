const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true
  },
  phone: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["MPESA"], default: "MPESA" },
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending"
  },
  checkoutRequestId: { type: String, default: "" },
  merchantRequestId: { type: String, default: "" },
  mpesaReceipt: { type: String, default: "" },
  rawResponse: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
