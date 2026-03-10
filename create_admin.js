require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    createAdmin();
  })
  .catch((err) => {
    console.log("❌ Connection error:", err);
    process.exit(1);
  });

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@foodapp.com" });
    if (existingAdmin) {
      console.log("✅ Admin user already exists:", existingAdmin.email);
      console.log("   ID:", existingAdmin._id);
      console.log("   isAdmin:", existingAdmin.isAdmin);
      mongoose.connection.close();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Create admin user
    const admin = new User({
      name: "Admin User",
      email: "admin@foodapp.com",
      password: hashedPassword,
      isAdmin: true,
      isRestaurantAdmin: false,
    });

    await admin.save();
    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@foodapp.com");
    console.log("🔑 Password: admin123");
    console.log("👤 User ID:", admin._id);
    console.log("🔒 isAdmin:", admin.isAdmin);

    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
    mongoose.connection.close();
    process.exit(1);
  }
}
