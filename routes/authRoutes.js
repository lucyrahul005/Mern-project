const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const AdminNotification = require("../models/AdminNotification");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;

    // Check user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists ❌" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    user = new User({
      name,
      email,
      password: hashedPassword,
      isAdmin: isAdmin || false,
    });

    await user.save();

    // Create token
    const token = jwt.sign(
      { id: user._id, email: user.email, isAdmin: user.isAdmin, isRestaurantAdmin: user.isRestaurantAdmin },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.json({
      message: "User registered successfully ✅",
      token,
      user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error ❌" });
  }
});

// RESTAURANT ADMIN REGISTER
router.post("/register-restaurant-admin", async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      restaurantName, 
      restaurantDescription, 
      cuisine,
      phone,
      city,
      state,
      pincode 
    } = req.body;

    // Validation
    if (!name || !email || !password || !restaurantName || !phone) {
      return res.status(400).json({ 
        message: "❌ Please fill all required fields" 
      });
    }

    // Check if email already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "❌ Email already registered" });
    }

    // Check if restaurant name already exists
    let restaurant = await Restaurant.findOne({ name: restaurantName });
    if (restaurant) {
      return res.status(400).json({ message: "❌ Restaurant name already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with restaurant admin role, default Pending
    user = new User({
      name,
      email,
      password: hashedPassword,
      isAdmin: false,
      isRestaurantAdmin: true,
      adminStatus: "Pending",
    });

    await user.save();

    // Create restaurant with inactive status until approval
    restaurant = new Restaurant({
      adminId: user._id,
      name: restaurantName,
      description: restaurantDescription || `Welcome to ${restaurantName}! We serve delicious ${Array.isArray(cuisine) ? cuisine.join(", ") : cuisine} cuisine.`,
      cuisine: Array.isArray(cuisine) ? cuisine : [cuisine],
      phone,
      address: {
        street: "",
        city: city || "",
        state: state || "",
        pincode: pincode || "",
      },
      image: "", // Default empty image
      deliveryFee: 40,
      minOrderValue: 100,
      deliveryTime: "30 min",
      rating: 4.5,
      reviews: 0,
      taxPercentage: 5,
      platformFeePercentage: 3,
      isOpen: true,
      isPopular: false,
      isActive: false,
    });

    await restaurant.save();

    // Create an admin notification for approval
    try {
      await AdminNotification.create({
        type: "RestaurantAdminRegistration",
        title: "New restaurant admin registration",
        message: `${user.name} requested access for restaurant '${restaurant.name}'.`,
        data: { userId: user._id, restaurantId: restaurant._id, email: user.email },
      });
    } catch (notifyErr) {
      console.error("Failed to create admin notification:", notifyErr.message);
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, email: user.email, isAdmin: user.isAdmin, isRestaurantAdmin: user.isRestaurantAdmin },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Restaurant admin registered successfully ✅ Awaiting admin approval.",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isRestaurantAdmin: user.isRestaurantAdmin,
        adminStatus: user.adminStatus,
      },
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        adminId: restaurant.adminId,
        isActive: restaurant.isActive,
      },
    });
  } catch (err) {
    console.error("Restaurant registration error:", err);
    res.status(500).json({ 
      message: "❌ Registration failed",
      error: err.message 
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found ❌" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password ❌" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, isAdmin: user.isAdmin, isRestaurantAdmin: user.isRestaurantAdmin },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful ✅",
      token,
      user,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error ❌" });
  }
});

// =====================================================
// 📍 ADDRESS MANAGEMENT
// =====================================================

// ADD ADDRESS
router.post("/add-address", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const { fullName, phone, addressLine, city, state, pincode, country } = req.body;

    if (!fullName || !phone || !addressLine || !city || !state || !pincode) {
      return res.status(400).json({ message: "All fields are required" });
    }

    user.addresses.push({
      fullName,
      phone,
      addressLine,
      city,
      state,
      pincode,
      country: country || "India",
    });

    await user.save();

    res.json({ message: "Address added successfully ✅", addresses: user.addresses });
  } catch (err) {
    console.error("Error adding address:", err);
    res.status(500).json({ message: "Error adding address: " + err.message });
  }
});

// GET MY ADDRESSES
router.get("/my-addresses", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json(user.addresses || []);
  } catch (err) {
    console.error("Error fetching addresses:", err);
    res.status(500).json({ message: "Error fetching addresses" });
  }
});

// DELETE ADDRESS
router.delete("/address/:index", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const index = parseInt(req.params.index);
    if (index >= 0 && index < user.addresses.length) {
      user.addresses.splice(index, 1);
      await user.save();
      res.json({ message: "Address deleted ✅", addresses: user.addresses });
    } else {
      res.status(400).json({ message: "Invalid address index" });
    }
  } catch (err) {
    console.error("Error deleting address:", err);
    res.status(500).json({ message: "Error deleting address" });
  }
});

module.exports = router;
