const mongoose = require("mongoose");

const matatuSchema = new mongoose.Schema({
  registration: { type: String, required: true, unique: true, uppercase: true },
  sacco: { type: String, required: true },
  capacity: { type: Number, required: true, min: 1, default: 14 },
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
  driverName: { type: String, default: "" },
  conductor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  active: { type: Boolean, default: true },
  departureTimes: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model("Matatu", matatuSchema);
