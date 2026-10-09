const express = require("express");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const Matatu = require("../models/Matatu");
const { protect } = require("../middleware/auth");

const router = express.Router();

function makeBookingCode() {
  return "MAT-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

router.post("/", protect, async (req, res, next) => {
  try {
    const {
      matatuId,
      travelDate,
      departureTime,
      seatNumber
    } = req.body;

    if (!matatuId || !travelDate || !departureTime || !seatNumber) {
      return res.status(400).json({
        success: false,
        message: "Matatu, date, time and seat are required"
      });
    }

    const matatu = await Matatu.findById(matatuId).populate("route");

    if (!matatu || !matatu.active) {
      return res.status(404).json({
        success: false,
        message: "Matatu is not available"
      });
    }

    if (seatNumber < 1 || seatNumber > matatu.capacity) {
      return res.status(400).json({
        success: false,
        message: "Invalid seat number"
      });
    }

    const existing = await Booking.findOne({
      matatu: matatu._id,
      travelDate,
      departureTime,
      seatNumber,
      status: { $in: ["pending", "confirmed", "completed"] }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "That seat has already been booked"
      });
    }

    const booking = await Booking.create({
      passenger: req.user._id,
      matatu: matatu._id,
      route: matatu.route._id,
      travelDate,
      departureTime,
      seatNumber,
      amount: matatu.route.fare,
      bookingCode: makeBookingCode()
    });

    const populated = await booking.populate([
      { path: "matatu", populate: { path: "route" } },
      { path: "passenger", select: "name phone" }
    ]);

    res.status(201).json({
      success: true,
      booking: populated
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "That seat has already been booked"
      });
    }
    next(error);
  }
});

router.get("/mine", protect, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ passenger: req.user._id })
      .populate("matatu")
      .populate("route")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("passenger", "name phone")
      .populate("matatu")
      .populate("route");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (
      req.user.role === "passenger" &&
      booking.passenger._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/cancel", protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking || booking.passenger.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Completed booking cannot be cancelled"
      });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
