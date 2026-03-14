const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Rider = require("../models/Rider");

// 🔐 Auth middleware - Verify JWT and get user info
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("🔐 Auth middleware - Authorization header:", authHeader ? "Present" : "MISSING");

    const token = authHeader?.split(" ")[1];

    if (!token) {
      console.log("❌ No token found");
      return res.status(401).json({ message: "No token provided" });
    }

    console.log("✅ Token found, verifying...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    console.log("✅ Token verified, decoded:", decoded);

    const user = await User.findById(decoded.id);
    console.log("👤 User found:", user ? "Yes" : "No");

    if (!user) {
      console.log("❌ User not found in database");
      return res.status(401).json({ message: "User not found" });
    }

    console.log("✅ User authenticated:", { name: user.name, isAdmin: user.isAdmin });
    req.user = user;
    next();
  } catch (err) {
    console.log("❌ Auth error:", err.message);
    res.status(401).json({ message: "Invalid token: " + err.message });
  }
};

// 🔐 Admin middleware - Check if user is admin
const adminMiddleware = (req, res, next) => {
  console.log("👮 Admin check - User isAdmin:", req.user.isAdmin);
  if (!req.user.isAdmin) {
    console.log("❌ User is not admin, rejecting");
    return res.status(403).json({ message: "Access denied - Admin only. Your status: " + req.user.isAdmin });
  }
  console.log("✅ User is admin, allowing access");
  next();
};

// =====================================================
// 🧪 TEST ENDPOINT
// =====================================================
router.get("/test", authMiddleware, adminMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "Admin API is working!",
    user: req.user.email,
    isAdmin: req.user.isAdmin
  });
});

// =====================================================
// 📊 DASHBOARD STATS
// =====================================================
router.get("/stats", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    // Only count revenue from delivered orders
    const totalRevenue = await Order.aggregate([
      { $match: { orderStatus: "Delivered" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const totalUsers = await User.countDocuments();

    const populerItems = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          count: { $sum: 1 },
          name: { $first: "$items.name" },
          price: { $first: "$items.price" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      success: true,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalUsers,
      populerItems,
    });
  } catch (err) {
    console.error("❌ Error fetching stats:", err);
    res.status(500).json({ message: "Error fetching stats" });
  }
});

// =====================================================
// 📦 PRODUCTS MANAGEMENT
// IMPORTANT: Specific routes (/add, /:id/popular) MUST come
// BEFORE the generic /:id route to avoid route conflicts!
// =====================================================

// GET ALL PRODUCTS
router.get("/products", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ message: "Error fetching products" });
  }
});

// Multer setup for image uploads
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ADD PRODUCT — must be before /:id
router.post("/products", authMiddleware, adminMiddleware, upload.single("image"), async (req, res) => {
  try {
    console.log("🔍 DEBUG - req.body:", req.body);
    console.log("🔍 DEBUG - req.file:", req.file);
    console.log("🔍 DEBUG - req.headers:", req.headers);

    const { name, description, price, category, restaurantName } = req.body || {};

    console.log("📥 Received product data:", { name, description, price, category, restaurantName });
    console.log("📸 File:", req.file?.filename);

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Product name is required" });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ message: "Product description is required" });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ message: "Product category is required" });
    }
    if (!restaurantName || !restaurantName.trim()) {
      return res.status(400).json({ message: "Restaurant name is required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Product image is required" });
    }

    // Convert price to number and validate
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ message: "Product price must be a valid number greater than 0" });
    }

    // Find or create restaurant
    // First check if restaurant exists with this name (any admin can contribute to existing restaurants)
    let restaurant = await Restaurant.findOne({ name: restaurantName });
    
    if (!restaurant) {
      // If not found, create a new restaurant owned by current admin
      restaurant = new Restaurant({
        adminId: req.user._id,
        name: restaurantName,
        description: `${restaurantName} - Food Delivery`,
        cuisine: [category],
        phone: "0000000000",
        isActive: true,
      });
      await restaurant.save();
      console.log("✅ New restaurant created:", restaurant._id, "for admin:", req.user._id);
    } else {
      console.log("✅ Restaurant already exists:", restaurant._id, "adding product to it");
    }

    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: priceNum,
      category: category.toLowerCase().trim(),
      image: `/uploads/${req.file.filename}`,
      restaurant: restaurant._id,
      restaurantId: restaurant._id,
    };

    console.log("✍️ Creating product with data:", productData);

    const product = new Product(productData);
    const savedProduct = await product.save();
    console.log("✅ Product saved successfully:", savedProduct._id);

    res.status(201).json({ success: true, message: "Product added successfully!", product: savedProduct });
  } catch (err) {
    console.error("❌ Error adding product:", err.message);
    console.error("❌ Full error:", err);
    const message = err.message || "Error adding product";
    res.status(500).json({ message, details: err.message });
  }
});

// TOGGLE POPULAR — MUST be before PUT /products/:id
router.put(
  "/products/:id/popular",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: "Product not found" });
      product.isPopular = !product.isPopular;
      await product.save();
      console.log(`✅ Product ${product._id} popular toggled to: ${product.isPopular}`);
      res.json({ success: true, product });
    } catch (err) {
      console.error("❌ Error toggling popular:", err);
      res.status(500).json({ message: "Error toggling popular" });
    }
  }
);

// TOGGLE POPULAR (alternate endpoint)
router.put(
  "/products/:id/toggle-popular",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: "Product not found" });
      product.isPopular = !product.isPopular;
      await product.save();
      res.json({ success: true, product });
    } catch (err) {
      console.error("❌ Error toggling popular:", err);
      res.status(500).json({ message: "Error toggling popular" });
    }
  }
);

// UPDATE PRODUCT — generic /:id, AFTER specific sub-routes
router.put(
  "/products/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { ...req.body, category: req.body.category?.toLowerCase() },
        { new: true }
      );
      res.json({ success: true, product });
    } catch (err) {
      console.error("❌ Error updating product:", err);
      res.status(500).json({ message: "Error updating product" });
    }
  }
);

// DELETE PRODUCT
router.delete(
  "/products/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      await Product.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: "Product deleted" });
    } catch (err) {
      console.error("❌ Error deleting product:", err);
      res.status(500).json({ message: "Error deleting product" });
    }
  }
);

// =====================================================
// 🔧 PRODUCT MAINTENANCE & FIX ENDPOINTS
// =====================================================

// FIX: Ensure all products have both restaurant and restaurantId fields set
router.post(
  "/fix-products",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      // Get all products that have restaurant OR restaurantId but not both
      const productsToFix = await Product.find({
        $or: [
          { restaurant: { $exists: false } },
          { restaurantId: { $exists: false } },
          { restaurant: null },
          { restaurantId: null }
        ]
      });

      console.log(`🔧 Found ${productsToFix.length} products to fix`);

      let fixedCount = 0;

      for (const product of productsToFix) {
        // Use whichever field has a value
        const restaurantRef = product.restaurant || product.restaurantId;
        
        if (restaurantRef) {
          // Update to have both fields
          await Product.findByIdAndUpdate(
            product._id,
            {
              restaurant: restaurantRef,
              restaurantId: restaurantRef
            },
            { new: true }
          );
          fixedCount++;
        }
      }

      console.log(`✅ Fixed ${fixedCount} products`);
      res.json({ 
        success: true, 
        message: `✅ Fixed ${fixedCount} products. All products now have both restaurant and restaurantId fields.`,
        fixedCount,
        totalProcessed: productsToFix.length
      });
    } catch (err) {
      console.error("❌ Error fixing products:", err);
      res.status(500).json({ message: "Error fixing products: " + err.message });
    }
  }
);

// DIAGNOSTIC: Get products by restaurant for debugging
router.get(
  "/diagnose/products/:restaurantId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { restaurantId } = req.params;
      
      console.log(`🔍 Diagnosing products for restaurant: ${restaurantId}`);
      
      const productsViaRestaurant = await Product.find({ restaurant: restaurantId });
      const productsViaRestaurantId = await Product.find({ restaurantId });
      const productsViaEither = await Product.find({
        $or: [
          { restaurant: restaurantId },
          { restaurantId: restaurantId }
        ]
      });
      
      res.json({
        success: true,
        restaurantId,
        counts: {
          viaRestaurant: productsViaRestaurant.length,
          viaRestaurantId: productsViaRestaurantId.length,
          viaEither: productsViaEither.length,
        },
        samples: {
          viaRestaurant: productsViaRestaurant.slice(0, 3).map(p => ({ _id: p._id, name: p.name, restaurant: p.restaurant, restaurantId: p.restaurantId })),
          viaRestaurantId: productsViaRestaurantId.slice(0, 3).map(p => ({ _id: p._id, name: p.name, restaurant: p.restaurant, restaurantId: p.restaurantId })),
        }
      });
    } catch (err) {
      console.error(`❌ Error diagnosing products: ${err.message}`);
      res.status(500).json({ message: "Error diagnosing products: " + err.message });
    }
  }
);

// =====================================================
// 🎁 ORDERS MANAGEMENT
// IMPORTANT: /orders/:id/status MUST be before /orders/:id
// =====================================================

// GET ALL ORDERS
router.get("/orders", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// UPDATE ORDER STATUS — specific sub-route BEFORE generic /:id
router.put(
  "/orders/:id/status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      // Accept both 'status' and 'orderStatus' for compatibility
      const orderStatus = req.body.orderStatus || req.body.status;

      console.log(`📦 Updating order ${req.params.id} status to: ${orderStatus}`);

      const validStatuses = [
        "Placed",
        "Preparing",
        "Ready",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ];

      if (!orderStatus || !validStatuses.includes(orderStatus)) {
        return res
          .status(400)
          .json({ message: `Invalid status: "${orderStatus}". Valid: ${validStatuses.join(", ")}` });
      }

      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { orderStatus },
        { new: true }
      );

      if (!order) return res.status(404).json({ message: "Order not found" });

      console.log(`✅ Order ${req.params.id} status updated to: ${order.orderStatus}`);
      res.json({ success: true, order });
    } catch (err) {
      console.error("❌ Error updating order status:", err);
      res.status(500).json({ message: "Error updating order status" });
    }
  }
);

// =====================================================
// 👥 USERS MANAGEMENT
// IMPORTANT: /users/:id/block MUST be before /users/:id
// =====================================================

// GET ALL USERS
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// BLOCK / UNBLOCK USER — specific sub-route BEFORE generic /:id
router.put(
  "/users/:id/block",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.isBlocked = !user.isBlocked;
      await user.save();

      console.log(`✅ User ${user._id} isBlocked: ${user.isBlocked}`);
      res.json({
        success: true,
        user,
        message: user.isBlocked ? "User blocked" : "User unblocked",
      });
    } catch (err) {
      console.error("❌ Error blocking/unblocking user:", err);
      res.status(500).json({ message: "Error updating user status" });
    }
  }
);

// TOGGLE ADMIN STATUS — specific sub-route BEFORE generic /:id
router.put(
  "/users/:id/toggle-admin",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.isAdmin = !user.isAdmin;
      await user.save();
      res.json({ success: true, user });
    } catch (err) {
      console.error("❌ Error toggling admin status:", err);
      res.status(500).json({ message: "Error toggling admin status" });
    }
  }
);

// GET USER DETAILS — generic /:id, AFTER specific sub-routes
router.get(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ success: true, user });
    } catch (err) {
      console.error("❌ Error fetching user:", err);
      res.status(500).json({ message: "Error fetching user" });
    }
  }
);


// =====================================================
// 🏢 RESTAURANT ADMIN REQUESTS MANAGEMENT
// =====================================================

// GET ALL RESTAURANT REQUESTS
router.get("/restaurant-requests", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const requests = await User.find({ isRestaurantAdmin: true }).select("-password").sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    console.error("❌ Error fetching restaurant requests:", err);
    res.status(500).json({ message: "Error fetching requests" });
  }
});

// APPROVE RESTAURANT REQUEST
router.put(
  "/restaurant-requests/:id/approve",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user || !user.isRestaurantAdmin) {
        return res.status(404).json({ message: "Restaurant request not found" });
      }

      user.adminStatus = "Approved";
      await user.save();

      // Activate the restaurant
      const restaurant = await Restaurant.findOne({ adminId: user._id });
      if (restaurant) {
        restaurant.isActive = true;
        await restaurant.save();
      }

      console.log(`✅ Request ${user._id} Approved`);
      res.json({ success: true, user, message: "Restaurant approved successfully" });
    } catch (err) {
      console.error("❌ Error approving request:", err);
      res.status(500).json({ message: "Error approving request" });
    }
  }
);

// REJECT RESTAURANT REQUEST
router.put(
  "/restaurant-requests/:id/reject",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user || !user.isRestaurantAdmin) {
        return res.status(404).json({ message: "Restaurant request not found" });
      }

      user.adminStatus = "Rejected";
      await user.save();

      console.log(`❌ Request ${user._id} Rejected`);
      res.json({ success: true, user, message: "Restaurant rejected successfully" });
    } catch (err) {
      console.error("❌ Error rejecting request:", err);
      res.status(500).json({ message: "Error rejecting request" });
    }
  }
);

// =====================================================
// 🚴 RIDER MANAGEMENT
// =====================================================

// Get all pending riders (not approved by admin)
router.get("/riders/pending", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pendingRiders = await Rider.find({ isApprovedByAdmin: false }).select("-password");
    res.json({
      success: true,
      riders: pendingRiders,
      count: pendingRiders.length
    });
  } catch (err) {
    console.error("❌ Error fetching pending riders:", err);
    res.status(500).json({ message: "Error fetching pending riders" });
  }
});

// Get all approved riders (for rider details section)
router.get("/riders/approved", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const approvedRiders = await Rider.find({ isApprovedByAdmin: true }).select("-password");
    res.json({
      success: true,
      riders: approvedRiders,
      count: approvedRiders.length
    });
  } catch (err) {
    console.error("❌ Error fetching approved riders:", err);
    res.status(500).json({ message: "Error fetching approved riders" });
  }
});

// Approve a rider
router.post("/riders/:id/approve", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.id);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    rider.isApprovedByAdmin = true;
    await rider.save();

    console.log(`✅ Rider ${rider._id} approved`);
    res.json({ 
      success: true, 
      rider,
      message: "Rider approved successfully" 
    });
  } catch (err) {
    console.error("❌ Error approving rider:", err);
    res.status(500).json({ message: "Error approving rider" });
  }
});

// Reject/Deactivate a rider
router.post("/riders/:id/reject", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.id);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    rider.isActive = false;
    await rider.save();

    console.log(`❌ Rider ${rider._id} rejected/deactivated`);
    res.json({ 
      success: true, 
      rider,
      message: "Rider rejected successfully" 
    });
  } catch (err) {
    console.error("❌ Error rejecting rider:", err);
    res.status(500).json({ message: "Error rejecting rider" });
  }
});

// =====================================================
// 🏪 RESTAURANT DETAILS
// =====================================================

// Get all restaurants (for restaurant details section)
router.get("/restaurants", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .populate("adminId", "name email phone")
      .select("-password");
    
    res.json({
      success: true,
      restaurants,
      count: restaurants.length
    });
  } catch (err) {
    console.error("❌ Error fetching restaurants:", err);
    res.status(500).json({ message: "Error fetching restaurants" });
  }
});

module.exports = router;
