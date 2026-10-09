const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  passenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  matatu: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Matatu",
    required: true
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Route",
    required: true
  },
  travelDate: { type: String, required: true },
  departureTime: { type: String, required: true },
  seatNumber: { type: Number, required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed"],
    default: "pending"
  },
  boardingStatus: {
    type: String,
    enum: ["not_boarded", "boarded"],
    default: "not_boarded"
  },
  bookingCode: { type: String, unique: true, required: true }
}, { timestamps: true });

bookingSchema.index({
  matatu: 1,
  travelDate: 1,
  departureTime: 1,
  seatNumber: 1
}, {
  unique: true,
  partialFilterExpression: {
    status: { $in: ["pending", "confirmed", "completed"] }
  }
});

module.exports = mongoose.model("Booking", bookingSchema);
