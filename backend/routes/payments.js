const express = require("express");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");
const { protect } = require("../middleware/auth");
const { stkPush } = require("../services/mpesa");

const router = express.Router();

router.post("/stkpush", protect, async (req, res, next) => {
  try {
    const { bookingId, phone } = req.body;

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
      phone,
      amount: booking.amount,
      status: "pending"
    });

    const result = await stkPush({
      phone,
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

router.post("/callback", async (req, res) => {
  try {
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

    payment.rawResponse = req.body;

    if (body.ResultCode === 0) {
      const items = body.CallbackMetadata?.Item || [];
      const receipt = items.find(i => i.Name === "MpesaReceiptNumber");

      payment.status = "success";
      payment.mpesaReceipt = receipt?.Value || "";

      await payment.save();

      await Booking.findByIdAndUpdate(payment.booking, {
        status: "confirmed"
      });
    } else {
      payment.status = "failed";
      await payment.save();
    }

    return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    return res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
});

router.get("/:bookingId", protect, async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ booking: req.params.bookingId })
      .sort({ createdAt: -1 });

    res.json({ success: true, payment });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
