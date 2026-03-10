const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const Restaurant = require("../models/Restaurant");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Notification = require("../models/Notification");
const User = require("../models/User");

// 🔐 Auth Middleware - Verify JWT and get user info
const authMiddleware = async (req, res, next) => {
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

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token: " + err.message });
  }
};

// 🔐 Restaurant Admin Middleware - Check if user owns this restaurant
const restaurantAdminMiddleware = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ adminId: req.user._id });

    if (!restaurant) {
      return res.status(403).json({ message: "You do not own any restaurant" });
    }

    if (req.user.adminStatus !== "Approved") {
      return res.status(403).json({ message: "Access Denied: Your restaurant account is pending approval." });
    }

    req.restaurant = restaurant;
    next();
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
};

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ============ RESTAURANT PROFILE MANAGEMENT ============

// Get my restaurant profile
router.get("/profile", authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    res.json(req.restaurant);
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// Update restaurant profile (handles regular updates AND multi-step registration completion with file uploads)
router.put("/profile", authMiddleware, upload.fields([
  { name: "idProof", maxCount: 1 },
  { name: "fssaiCertificate", maxCount: 1 },
  { name: "gstCertificate", maxCount: 1 },
  { name: "restaurantImages", maxCount: 5 },
  { name: "menuImages", maxCount: 10 }
]), restaurantAdminMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      cuisine,
      phone,
      email,
      address,
      operatingHours,
      deliveryFee,
      minOrderValue,
      deliveryTime,
      taxPercentage,
      platformFeePercentage,
      notificationSettings,
      paymentMethods,
      // Multi-step registration fields
      fssaiNumber,
      gstNumber,
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
    } = req.body;

    // Build update object with standard fields
    const updateData = {
      ...(name && { name }),
      ...(description && { description }),
      ...(cuisine && { cuisine }),
      ...(phone && { phone }),
      ...(email && { email }),
      ...(address && { address }),
      ...(operatingHours && { operatingHours }),
      ...(deliveryFee !== undefined && { deliveryFee }),
      ...(minOrderValue !== undefined && { minOrderValue }),
      ...(deliveryTime && { deliveryTime }),
      ...(taxPercentage !== undefined && { taxPercentage }),
      ...(platformFeePercentage !== undefined && { platformFeePercentage }),
      ...(notificationSettings && { notificationSettings }),
      ...(paymentMethods && { paymentMethods }),
      // Add multi-step registration fields if provided
      ...(fssaiNumber && { fssaiNumber }),
      ...(gstNumber && { gstNumber }),
      ...(accountHolderName || accountNumber || ifscCode || bankName ? {
        bankDetails: {
          accountHolderName: accountHolderName || "",
          accountNumber: accountNumber || "",
          ifscCode: ifscCode || "",
          bankName: bankName || "",
        }
      } : {}),
    };

    // Handle file uploads for documents
    if (req.files) {
      if (req.files.idProof && req.files.idProof[0]) {
        updateData.idProof = `/uploads/${req.files.idProof[0].filename}`;
      }
      if (req.files.fssaiCertificate && req.files.fssaiCertificate[0]) {
        updateData.fssaiCertificate = `/uploads/${req.files.fssaiCertificate[0].filename}`;
      }
      if (req.files.gstCertificate && req.files.gstCertificate[0]) {
        updateData.gstCertificate = `/uploads/${req.files.gstCertificate[0].filename}`;
      }
      if (req.files.restaurantImages && req.files.restaurantImages.length > 0) {
        updateData.restaurantImages = req.files.restaurantImages.map(f => `/uploads/${f.filename}`);
      }
      if (req.files.menuImages && req.files.menuImages.length > 0) {
        updateData.menuImages = req.files.menuImages.map(f => `/uploads/${f.filename}`);
      }
    }

    // Check if this is a registration completion (has document and bank details)
    if (fssaiNumber && gstNumber && accountNumber) {
      updateData.registrationCompleted = true;
      updateData.registrationStep = 4;
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.restaurant._id,
      updateData,
      { new: true }
    );

    res.json({ message: "Restaurant updated successfully", restaurant: updatedRestaurant });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// Update restaurant image
router.post("/profile/image", authMiddleware, restaurantAdminMiddleware, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.restaurant._id,
      { image: `/uploads/${req.file.filename}` },
      { new: true }
    );

    res.json({ message: "Image updated", restaurant: updatedRestaurant });
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// Toggle restaurant open/close status
router.put("/profile/status", authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { isOpen } = req.body;

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.restaurant._id,
      { isOpen },
      { new: true }
    );

    res.json({ message: `Restaurant is now ${isOpen ? "open" : "closed"}`, restaurant: updatedRestaurant });
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// ============ MENU MANAGEMENT ============

// Get all menu items (products for this restaurant)
router.get("/menu", authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    console.log(`📋 Fetching menu for restaurant: ${req.restaurant._id}`);
    
    const products = await Product.find({
      $or: [
        { restaurantId: req.restaurant._id },
        { restaurant: req.restaurant._id }
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`✅ Found ${products.length} products for restaurant ${req.restaurant._id}`);
    
    res.json({ success: true, products });
  } catch (err) {
    console.error(`❌ Error fetching menu: ${err.message}`);
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// Add new menu item
router.post("/menu", authMiddleware, restaurantAdminMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, category, isVeg, preparationTime } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: "Name, description, price, and category are required" });
    }

    console.log(`📝 Creating product: ${name} for restaurant: ${req.restaurant._id}`);

    const newProduct = new Product({
      name,
      description,
      price: Number(price),
      category,
      restaurantId: req.restaurant._id,
      restaurant: req.restaurant._id, // ✅ Set both fields for compatibility
      image: req.file ? `/uploads/${req.file.filename}` : "",
      isVeg: isVeg === "true",
      prepTime: preparationTime || "20 min",
      preparationTime: preparationTime || "20 min",
      isAvailable: true,
    });

    const savedProduct = await newProduct.save();
    console.log(`✅ Product saved with ID: ${savedProduct._id}`);
    console.log(`   Restaurant: ${savedProduct.restaurant}, RestaurantId: ${savedProduct.restaurantId}`);
    
    res.status(201).json({ success: true, message: "Menu item added successfully!", product: savedProduct });
  } catch (err) {
    console.error(`❌ Error adding product: ${err.message}`);
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// Update menu item
router.put("/menu/:productId", authMiddleware, restaurantAdminMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, price, category, isVeg, preparationTime, isAvailable } = req.body;

    const updateData = {
      name,
      description,
      price: Number(price),
      category,
      isVeg: isVeg === "true" || isVeg === true,
      prepTime: preparationTime || "20 min",
      preparationTime: preparationTime || "20 min",
      isAvailable: isAvailable === "true" || isAvailable === true || true,
    };

    // Add image if provided
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updated = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    console.log(`✅ Product ${productId} updated successfully`);
    res.json({ success: true, message: "Menu item updated successfully!", product: updated });
  } catch (err) {
    console.error(`❌ Error updating product: ${err.message}`);
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// Delete menu item
router.delete("/menu/:productId", authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;

    const deleted = await Product.findByIdAndDelete(productId);

    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Menu item deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// Toggle item availability
router.put("/menu/:productId/availability", authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const { isAvailable } = req.body;

    const updated = await Product.findByIdAndUpdate(
      productId,
      { isAvailable },
      { new: true }
    );

    res.json({ message: `Item is now ${isAvailable ? "available" : "unavailable"}`, product: updated });
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// ============ ORDER MANAGEMENT ============

// Get all orders for this restaurant
router.get("/orders", authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;

    let query = {
      "items.restaurantId": req.restaurant._id,
    };

    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .populate("userId", "name email phone")
      .sort({ orderDate: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    const total = await Order.countDocuments(query);

    res.json({ orders, total, limit: Number(limit), skip: Number(skip) });
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// Get orders by status
router.get("/orders/status/:status", authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { status } = req.params;

    const orders = await Order.find({
      "items.restaurantId": req.restaurant._id,
      orderStatus: status,
    })
      .populate("userId", "name email phone")
      .sort({ orderDate: -1 });

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// Get single order details
router.get("/orders/:orderId", authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("userId", "name email phone")
      .populate("items.productId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if this restaurant owns this order
    const hasRestaurantItems = order.items.some(
      (item) => item.restaurantId.toString() === req.restaurant._id.toString()
    );

    if (!hasRestaurantItems) {
      return res.status(403).json({ message: "You do not have access to this order" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// Update order status
router.put("/orders/:orderId/status", authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ["Placed", "Preparing", "Ready", "Out for Delivery", "Delivered", "Cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updated = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: status },
      { new: true }
    );

    // Create notification for user when order status changes
    if (updated && updated.userId) {
      let notificationTitle = "";
      let notificationType = "";
      let notificationMessage = "";

      switch (status) {
        case "Preparing":
          notificationType = "OrderPreparing";
          notificationTitle = "🍳 Your Order is Being Prepared";
          notificationMessage = `Order #${updated._id.slice(-6)} is now being prepared by the restaurant`;
          break;
        case "Ready":
          notificationType = "OrderReady";
          notificationTitle = "✔️ Your Order is Ready";
          notificationMessage = `Order #${updated._id.slice(-6)} is ready for pickup. Your rider will pick it up soon`;
          break;
        case "Out for Delivery":
          notificationType = "OrderOutForDelivery";
          notificationTitle = "🚗 Your Order is on the Way";
          notificationMessage = `Order #${updated._id.slice(-6)} is out for delivery. Expected arrival: ${updated.estimatedDeliveryTime}`;
          break;
        case "Delivered":
          notificationType = "OrderDelivered";
          notificationTitle = "🎉 Your Order has been Delivered";
          notificationMessage = `Order #${updated._id.slice(-6)} has been delivered. Rate your experience!`;
          break;
        case "Cancelled":
          notificationType = "OrderCancelled";
          notificationTitle = "❌ Your Order has been Cancelled";
          notificationMessage = `Order #${updated._id.slice(-6)} has been cancelled`;
          break;
      }

      if (notificationTitle) {
        try {
          await Notification.create({
            userId: updated.userId,
            type: notificationType,
            title: notificationTitle,
            message: notificationMessage,
            orderId: updated._id,
          });
          console.log(`✅ Notification created for status: ${status}`);
        } catch (notifyErr) {
          console.error("❌ Error creating notification:", notifyErr.message);
        }
      }
    }

    res.json({ message: "Order status updated", order: updated });
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// ============ DASHBOARD & ANALYTICS ============

// Get dashboard stats
router.get("/dashboard/stats", authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalOrders = await Order.countDocuments({
      "items.restaurantId": req.restaurant._id,
    });

    const todayOrders = await Order.countDocuments({
      "items.restaurantId": req.restaurant._id,
      orderDate: { $gte: today },
    });

    const completedOrders = await Order.countDocuments({
      "items.restaurantId": req.restaurant._id,
      orderStatus: "Delivered",
    });

    const pendingOrders = await Order.countDocuments({
      "items.restaurantId": req.restaurant._id,
      orderStatus: { $in: ["Placed", "Preparing", "Ready"] },
    });

    const totalRevenue = await Order.aggregate([
      {
        $match: {
          "items.restaurantId": req.restaurant._id,
          paymentStatus: "Completed",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ]);

    const todayRevenue = await Order.aggregate([
      {
        $match: {
          "items.restaurantId": req.restaurant._id,
          orderDate: { $gte: today },
          paymentStatus: "Completed",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ]);

    res.json({
      totalOrders,
      todayOrders,
      completedOrders,
      pendingOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
      totalMenuItems: await Product.countDocuments({ restaurantId: req.restaurant._id }),
    });
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// Get sales chart data
router.get("/dashboard/sales-chart", authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const salesData = await Order.aggregate([
      {
        $match: {
          "items.restaurantId": req.restaurant._id,
          paymentStatus: "Completed",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$orderDate",
            },
          },
          sales: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $limit: Number(days),
      },
    ]);

    res.json(salesData);
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// Get top selling items
router.get("/dashboard/top-items", authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const topItems = await Order.aggregate([
      {
        $match: {
          "items.restaurantId": req.restaurant._id,
        },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.name",
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      {
        $sort: { totalSold: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.json(topItems);
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// Get revenue data
router.get("/dashboard/revenue", authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const { period = "monthly" } = req.query; // daily, weekly, monthly

    let dateFormat = "%Y-%m-%d";
    if (period === "monthly") {
      dateFormat = "%Y-%m";
    } else if (period === "weekly") {
      dateFormat = "%Y-W%V";
    }

    const revenueData = await Order.aggregate([
      {
        $match: {
          "items.restaurantId": req.restaurant._id,
          paymentStatus: "Completed",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: "$orderDate",
            },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: "$total" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json(revenueData);
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// ============ NOTIFICATIONS ============

// Get notification settings
router.get("/notifications/settings", authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const settings = req.restaurant.notificationSettings;
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
});

// Get restaurant admin order notifications
router.get("/notifications/orders", authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    // Get recent orders for this restaurant to show as notifications
    const recentOrders = await Order.find({
      "items.restaurantId": req.restaurant._id,
      orderDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
      .populate("userId", "name email phone")
      .sort({ orderDate: -1 })
      .limit(20);

    // Format as notifications
    const notifications = recentOrders.map(order => ({
      _id: order._id,
      title: order.orderStatus === "Placed" ? "📦 New Order Received" : `Order ${order.orderStatus}`,
      message: `Order from ${order.userId?.name || "Customer"} - ₹${order.total} - Status: ${order.orderStatus}`,
      type: "Order",
      orderId: order._id,
      orderStatus: order.orderStatus,
      createdAt: order.orderDate,
      items: order.items,
      userId: order.userId?._id,
      userName: order.userId?.name,
      userPhone: order.userId?.phone,
    }));

    res.json({
      success: true,
      message: "Order notifications fetched successfully",
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching order notifications:", error);
    res.status(500).json({ success: false, message: "Error fetching notifications", error: error.message });
  }
});

// Update notification settings
router.put("/notifications/settings", authMiddleware, restaurantAdminMiddleware, async (req, res) => {
  try {
    const updated = await Restaurant.findByIdAndUpdate(
      req.restaurant._id,
      { notificationSettings: req.body },
      { new: true }
    );

    res.json({ message: "Notification settings updated", settings: updated.notificationSettings });
  } catch (err) {
    res.status(500).json({ message: "Error: " + err.message });
  }
});

module.exports = router;
