const express = require("express");
const Matatu = require("../models/Matatu");
const Route = require("../models/Route");
const Booking = require("../models/Booking");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { origin, destination, date } = req.query;

    const routeFilter = { active: true };
    if (origin) routeFilter.origin = new RegExp(origin, "i");
    if (destination) routeFilter.destination = new RegExp(destination, "i");

    const routes = await Route.find(routeFilter);

    const matatus = await Matatu.find({
      active: true,
      route: { $in: routes.map(r => r._id) }
    }).populate("route").populate("conductor", "name phone");

    const result = await Promise.all(matatus.map(async m => {
      const booked = date
        ? await Booking.countDocuments({
            matatu: m._id,
            travelDate: date,
            status: { $in: ["pending", "confirmed", "completed"] }
          })
        : 0;

      return {
        ...m.toObject(),
        bookedSeats: booked,
        availableSeats: Math.max(m.capacity - booked, 0)
      };
    }));

    res.json({ success: true, matatus: result });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/seats", async (req, res, next) => {
  try {
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: "date and time are required"
      });
    }

    const matatu = await Matatu.findById(req.params.id).populate("route");
    if (!matatu) {
      return res.status(404).json({ success: false, message: "Matatu not found" });
    }

    const bookings = await Booking.find({
      matatu: matatu._id,
      travelDate: date,
      departureTime: time,
      status: { $in: ["pending", "confirmed", "completed"] }
    }).select("seatNumber");

    const bookedSeats = bookings.map(b => b.seatNumber);

    const seats = Array.from({ length: matatu.capacity }, (_, i) => ({
      number: i + 1,
      booked: bookedSeats.includes(i + 1)
    }));

    res.json({ success: true, seats, matatu });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
