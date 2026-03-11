const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");
require("dotenv").config(); // Load environment variables from .env

const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const adminRoutes = require("./routes/adminRoutes");
const restaurantAdminRoutes = require("./routes/restaurantAdminRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const riderRoutes = require("./routes/riderRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const User = require("./models/User");
const Order = require("./models/Order");
const auth = require("./middleware/auth");

const app = express();

// ================= MIDDLEWARE =================
console.log("🔧 Configuring middleware...");
app.use(cors({
  origin: "https://webnapp-food-delivery.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "100mb", strict: false }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
console.log("✅ Body parser configured with 100MB limits");
console.log("✅ CORS enabled for https://webnapp-food-delivery.vercel.app");

// Serve static files for uploads
app.use("/uploads", express.static("uploads"));

// ✅ USE ONLY THIS FOR PRODUCTS (IMPORTANT)
app.use("/api/products", productRoutes);
app.use("/api/restaurants", restaurantRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/restaurant-admin", restaurantAdminRoutes);
app.use("/api/rider", riderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", reviewRoutes);

// ================= DATABASE =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("MongoDB Error ❌", err));

// ================= SERVICES =================
const resend = new Resend(process.env.RESEND_API_KEY);

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// ================= REGISTER =================
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists ❌" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully ✅" });
  } catch (error) {
    console.log("REGISTER ERROR:", error);
    res.status(500).json({ message: "Server error ❌" });
  }
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found ❌" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials ❌" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.log("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error ❌" });
  }
});

// ================= PLACE ORDER =================
app.post("/place-order", auth, async (req, res) => {
  try {
    const { products, shippingAddress, amount } = req.body;

    const newOrder = new Order({
      userId: req.user.id,
      products,
      totalAmount: amount,
      shippingAddress,
      paymentStatus: "Cash on Delivery",
      orderStatus: "Processing",
    });

    await newOrder.save();

    // OPTIONAL EMAIL
    try {
      const user = await User.findById(req.user.id);
      if (user?.email) {
        await resend.emails.send({
          from: "WebnApp <onboarding@resend.dev>",
          to: user.email,
          subject: "Order Confirmed 🎉",
          html: `<h2>Your food is on the way! 🍔</h2><p>Total: ₹ ${amount}</p>`,
        });
      }
    } catch (err) {
      console.log("Email error:", err);
    }

    res.json({ message: "Order placed successfully ✅" });
  } catch (error) {
    console.log("ORDER ERROR:", error);
    res.status(500).json({ message: "Order failed ❌" });
  }
});

// ================= GET MY ORDERS =================
app.get("/my-orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate("products.productId");

    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📌 Production Ready: ${process.env.PORT ? "✅ YES (Render)" : "❌ Development Mode"}`);
});