require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Route = require("./models/Route");
const Matatu = require("./models/Matatu");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  await User.deleteMany({});
  await Route.deleteMany({});
  await Matatu.deleteMany({});

  const password = await bcrypt.hash("123456", 10);

  const admin = await User.create({
    name: "Mat App Admin",
    phone: "0700000000",
    password,
    role: "admin"
  });

  const driver = await User.create({
    name: "John Driver",
    phone: "0711111111",
    password,
    role: "driver"
  });

  await User.create({
    name: "Demo Passenger",
    phone: "0722222222",
    password,
    role: "passenger"
  });

  const route1 = await Route.create({
    name: "Nairobi - Nakuru",
    origin: "Nairobi",
    destination: "Nakuru",
    fare: 500
  });

  const route2 = await Route.create({
    name: "Nairobi - Thika",
    origin: "Nairobi",
    destination: "Thika",
    fare: 150
  });

  await Matatu.create({
    registration: "KDA 123A",
    sacco: "Demo Sacco",
    capacity: 14,
    route: route1._id,
    driverName: "Peter Driver",
    conductor: driver._id,
    departureTimes: ["07:00", "10:00", "14:00", "17:00"]
  });

  await Matatu.create({
    registration: "KDB 456B",
    sacco: "Demo Sacco",
    capacity: 14,
    route: route2._id,
    driverName: "James Driver",
    conductor: driver._id,
    departureTimes: ["06:30", "09:00", "13:00", "18:00"]
  });

  console.log("Seed complete.");
  console.log("Admin: 0700000000 / 123456");
  console.log("Driver: 0711111111 / 123456");
  console.log("Passenger: 0722222222 / 123456");
  console.log("Admin id:", admin._id.toString());

  await mongoose.disconnect();
}

seed().catch(error => {
  console.error(error);
  process.exit(1);
});
