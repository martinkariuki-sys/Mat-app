const express = require("express");
const Booking = require("../models/Booking");
const Matatu = require("../models/Matatu");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("conductor", "admin"));

router.get("/bookings", async (req, res, next) => {
  try {
    const filter = {};

    if (req.user.role === "conductor") {
      const matatus = await Matatu.find({ conductor: req.user._id }).select("_id");
      filter.matatu = { $in: matatus.map(m => m._id) };
    }

    if (req.query.date) filter.travelDate = req.query.date;

    const bookings = await Booking.find(filter)
      .populate("passenger", "name phone")
      .populate("matatu")
      .populate("route")
      .sort({ travelDate: 1, departureTime: 1, seatNumber: 1 });

    res.json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
});

router.patch("/bookings/:id/board", async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed bookings can board"
      });
    }

    booking.boardingStatus = "boarded";
    booking.status = "completed";
    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
