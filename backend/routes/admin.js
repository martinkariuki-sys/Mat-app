const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Route = require("../models/Route");
const Matatu = require("../models/Matatu");
const Booking = require("../models/Booking");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/dashboard", async (req, res, next) => {
  try {
    const [passengers, drivers, matatus, routes, bookings] = await Promise.all([
      User.countDocuments({ role: "passenger" }),
      User.countDocuments({ role: { $in: ["driver", "conductor"] } }),
      Matatu.countDocuments({ active: true }),
      Route.countDocuments({ active: true }),
      Booking.countDocuments()
    ]);

    const revenue = await Booking.aggregate([
      { $match: { status: { $in: ["confirmed", "completed"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.json({
      success: true,
      stats: {
        passengers,
        drivers,
        matatus,
        routes,
        bookings,
        revenue: revenue[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/routes", async (req, res, next) => {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });
    res.json({ success: true, routes });
  } catch (error) {
    next(error);
  }
});

router.post("/routes", async (req, res, next) => {
  try {
    const { name, origin, destination, fare } = req.body;

    const route = await Route.create({
      name,
      origin,
      destination,
      fare
    });

    res.status(201).json({ success: true, route });
  } catch (error) {
    next(error);
  }
});

router.get("/matatus", async (req, res, next) => {
  try {
    const matatus = await Matatu.find()
      .populate("route")
      .populate("conductor", "name phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, matatus });
  } catch (error) {
    next(error);
  }
});

router.post("/matatus", async (req, res, next) => {
  try {
    const {
      registration,
      sacco,
      capacity,
      route,
      driverName,
      conductor,
      departureTimes
    } = req.body;

    const matatu = await Matatu.create({
      registration,
      sacco,
      capacity,
      route,
      driverName,
      conductor: conductor || undefined,
      departureTimes: departureTimes || []
    });

    const populated = await matatu.populate([
      { path: "route" },
      { path: "conductor", select: "name phone" }
    ]);

    res.status(201).json({ success: true, matatu: populated });
  } catch (error) {
    next(error);
  }
});

router.post("/drivers", async (req, res, next) => {
  try {
    const { name, phone, password } = req.body;

    const exists = await User.findOne({ phone });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Phone number already exists"
      });
    }

    const driver = await User.create({
      name,
      phone,
      password: await bcrypt.hash(password, 10),
      role: "driver"
    });

    res.status(201).json({
      success: true,
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        role: driver.role
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/conductors", async (req, res, next) => {
  try {
    return res.status(400).json({
      success: false,
      message: "Use /api/admin/drivers for driver accounts."
    });
  } catch (error) {
    next(error);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
