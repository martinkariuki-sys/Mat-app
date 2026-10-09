const express = require("express");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const { protect } = require("../middleware/auth");
const rateLimit = require("express-rate-limit");
const { stkPush, formatPhone } = require("../services/mpesa");

const router = express.Router();
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many payment requests. Try again later." }
});

router.post("/stkpush", paymentLimiter, protect, async (req, res, next) => {
  try {
    const { bookingId, phone } = req.body;
    const normalizedPhone = formatPhone(phone);

    const booking = await Booking.findById(bookingId);

    if (!booking || booking.passenger.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This booking is no longer waiting for payment"
      });
    }

    const payment = await Payment.create({
      booking: booking._id,
      phone: normalizedPhone,
      amount: booking.amount,
      status: "pending"
    });

    const result = await stkPush({
      phone: normalizedPhone,
      amount: booking.amount,
      accountReference: booking.bookingCode,
      description: "Mat App seat booking"
    });

    payment.checkoutRequestId = result.CheckoutRequestID || result.checkoutRequestId || "";
    payment.merchantRequestId = result.MerchantRequestID || result.merchantRequestId || "";
    payment.rawResponse = result;

    if (result.demo) {
      payment.status = "success";
      payment.mpesaReceipt = "DEMO-" + Date.now();
      booking.status = "confirmed";
      await booking.save();
    }

    await payment.save();

    res.json({
      success: true,
      message: result.demo
        ? "Demo payment successful"
        : (result.CustomerMessage || result.customerMessage || "STK push sent"),
      demo: Boolean(result.demo),
      payment,
      booking
    });
  } catch (error) {
    next(error);
  }
});

router.post("/callback/:token", async (req, res) => {
  try {
    const expectedToken = process.env.MPESA_CALLBACK_TOKEN || "";
    const suppliedToken = req.params.token || "";
    const expectedBuffer = Buffer.from(expectedToken);
    const suppliedBuffer = Buffer.from(suppliedToken);
    if (
      expectedBuffer.length === 0 ||
      expectedBuffer.length !== suppliedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)
    ) {
      return res.status(404).json({ ResultCode: 1, ResultDesc: "Not found" });
    }

    const body = req.body?.Body?.stkCallback;

    if (!body) {
      return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const payment = await Payment.findOne({
      checkoutRequestId: body.CheckoutRequestID
    });

    if (!payment) {
      return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    if (payment.status !== "pending") {
      return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    if (payment.merchantRequestId && body.MerchantRequestID !== payment.merchantRequestId) {
      return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    payment.rawResponse = req.body;

    if (body.ResultCode === 0) {
      const items = body.CallbackMetadata?.Item || [];
      const receipt = items.find(i => i.Name === "MpesaReceiptNumber");
      const paidAmount = items.find(i => i.Name === "Amount");
      const paidPhone = items.find(i => i.Name === "PhoneNumber");
      const amountMatches = Number(paidAmount?.Value) === Number(payment.amount);
      const phoneMatches = paidPhone && String(paidPhone.Value) === payment.phone;

      if (!receipt?.Value || !amountMatches || !phoneMatches) {
        payment.status = "failed";
        await payment.save();
        await Booking.findOneAndUpdate(
          { _id: payment.booking, status: "pending" },
          { status: "cancelled" }
        );
        return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
      }

      payment.status = "success";
      payment.mpesaReceipt = String(receipt.Value);

      await payment.save();

      await Booking.findOneAndUpdate(
        { _id: payment.booking, status: "pending" },
        { status: "confirmed" }
      );
    } else {
      payment.status = "failed";
      await payment.save();
      await Booking.findOneAndUpdate(
        { _id: payment.booking, status: "pending" },
        { status: "cancelled" }
      );
    }

    return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
});

router.get("/:bookingId", protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking || (
      req.user.role !== "admin" &&
      booking.passenger.toString() !== req.user._id.toString()
    )) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const payment = await Payment.findOne({ booking: req.params.bookingId })
      .sort({ createdAt: -1 });

    res.json({ success: true, payment });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
