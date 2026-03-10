const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const Rider = require("./models/Rider");

const seedDemoRider = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/food-delivery");
    console.log("✅ MongoDB Connected");

    // Delete existing demo rider if exists
    await Rider.deleteOne({ email: "rider@gmail.com" });
    console.log("🗑️ Cleaned up old demo account (if exists)");

    // Hash password
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Create demo rider
    const demoRider = new Rider({
      name: "Demo Rider",
      email: "rider@gmail.com",
      phone: "9876543210",
      password: hashedPassword,
      profileImage: "",
      dateOfBirth: new Date("1995-05-15"),
      gender: "Male",
      address: {
        currentAddress: "123 Demo Street, Demo City",
        city: "Demo City",
        pincode: "123456",
      },
      vehicle: {
        type: "Bike",
        number: "DK-09-AB-1234",
        license: "DL001234567890",
      },
      aadhar: "123456789012",
      panCard: "ABCDE1234F",
      bankDetails: {
        accountHolder: "Demo Rider",
        accountNumber: "1234567890",
        ifsc: "DEMO0001",
        bankName: "Demo Bank",
      },
      isAvailable: true,
      isActive: true,
      kycStatus: "Approved",
      rating: 4.8,
      totalDeliveries: 25,
      currentOrder: null,
      orderHistory: [],
      earnings: {
        today: 500,
        total: 5000,
        lastUpdated: new Date(),
      },
      notifications: [],
    });

    await demoRider.save();
    console.log("✅ Demo Rider Created Successfully!");
    console.log("📧 Email: rider@gmail.com");
    console.log("🔑 Password: password123");
    console.log("🚀 You can now login!");

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error seeding rider:", error.message);
    process.exit(1);
  }
};

seedDemoRider();
