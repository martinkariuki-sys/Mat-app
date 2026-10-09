require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const matatuRoutes = require("./routes/matatus");
const bookingRoutes = require("./routes/bookings");
const paymentRoutes = require("./routes/payments");
const adminRoutes = require("./routes/admin");
const conductorRoutes = require("./routes/conductor");
const Booking = require("./models/Booking");
const { validateEnvironment } = require("./config");

const app = express();
const { paymentMode } = validateEnvironment();
const allowedOrigins = new Set(
  (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean)
);

app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.has(origin));
  }
}));
app.use(express.json({ limit: "32kb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Try again later." }
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Mat App backend is running",
    paymentMode
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/matatus", matatuRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/conductor", conductorRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === "production" && status >= 500
      ? "Server error"
      : (err.message || "Server error")
  });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    const collectionName = Booking.collection.collectionName;
    const collectionExists = await mongoose.connection.db
      .listCollections({ name: collectionName }, { nameOnly: true })
      .hasNext();

    if (collectionExists) {
      const indexes = await Booking.collection.indexes();
      const seatIndex = indexes.find(index =>
        index.key.matatu === 1 &&
        index.key.travelDate === 1 &&
        index.key.departureTime === 1 &&
        index.key.seatNumber === 1
      );

      if (seatIndex && !seatIndex.partialFilterExpression) {
        await Booking.collection.dropIndex(seatIndex.name);
      }
    }

    await Booking.createIndexes();
    app.listen(PORT, () => {
      console.log(`Mat App backend running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
