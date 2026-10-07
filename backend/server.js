require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const matatuRoutes = require("./routes/matatus");
const bookingRoutes = require("./routes/bookings");
const paymentRoutes = require("./routes/payments");
const adminRoutes = require("./routes/admin");
const conductorRoutes = require("./routes/conductor");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Mat App backend is running",
    paymentMode: process.env.PAYMENT_MODE || "DEMO"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/matatus", matatuRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/conductor", conductorRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: err.message || "Server error"
  });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Mat App backend running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
