const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Rider = require("../models/Rider");
const Order = require("../models/Order");
const Notification = require("../models/Notification");
const AdminNotification = require("../models/AdminNotification");
const auth = require("../middleware/auth");

// ===================== RIDER REGISTRATION =====================
router.post("/register", async (req, res) => {
  try {
    console.log("🚴 RIDER REGISTRATION STARTED");
    console.log("📋 Received data:", {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      hasProfileImage: !!req.body.profileImage,
      profileImageSize: req.body.profileImage ? `${(req.body.profileImage.length / 1024).toFixed(2)}KB` : "N/A",
      hasAddress: !!req.body.address,
      hasVehicle: !!req.body.vehicle,
    });

    const {
      name,
      email,
      phone,
      password,
      profileImage,
      dateOfBirth,
      gender,
      address,
      vehicle,
      aadhar,
      panCard,
      bankDetails,
    } = req.body;

    // Check if profileImage is too large (> 2MB base64)
    if (profileImage && profileImage.length > 2 * 1024 * 1024) {
      console.log(`❌ Profile image too large: ${(profileImage.length / 1024 / 1024).toFixed(2)}MB`);
      return res.status(400).json({
        message: "Profile image too large ❌. Max size: 2MB. Please compress or choose a smaller image.",
      });
    }

    // Validation
    if (!name || !email || !phone || !password) {
      console.log("❌ Missing required fields");
      return res
        .status(400)
        .json({
          message:
            "Name, email, phone, and password are required ❌",
        });
    }

    // Check if rider already exists
    console.log("🔍 Checking if rider already exists...");
    const existingRider = await Rider.findOne({ $or: [{ email }, { phone }] });
    if (existingRider) {
      console.log("❌ Rider already exists with this email/phone");
      return res.status(400).json({
        message: "Rider with this email or phone already exists ❌",
      });
    }

    // Hash password
    console.log("🔒 Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new rider
    console.log("📝 Creating new rider document...");
    const newRider = new Rider({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: hashedPassword,
      profileImage: profileImage || null,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      address: {
        currentAddress: address?.currentAddress || null,
        city: address?.city || null,
        pincode: address?.pincode || null,
      },
      vehicle: {
        type: vehicle?.type || null,
        number: vehicle?.number || null,
        license: vehicle?.license || null,
      },
      aadhar: aadhar || null,
      panCard: panCard || null,
      bankDetails: {
        accountNumber: bankDetails?.accountNumber || null,
        ifscCode: bankDetails?.ifscCode || null,
      },
      isAvailable: false,
      isApprovedByAdmin: false,
      kycStatus: "Pending",
      isActive: true,
    });

    console.log("💾 Saving rider to database...");
    await newRider.save();
    console.log("✅ Rider saved successfully with ID:", newRider._id);

    // Create admin notification
    console.log("📢 Creating admin notification...");
    try {
      const adminNotification = new AdminNotification({
        type: "RiderRegistration",
        title: `New Rider Registration: ${newRider.name}`,
        message: `${newRider.name} has registered as a rider and is awaiting approval.`,
        data: {
          riderId: newRider._id,
          riderName: newRider.name,
          riderEmail: newRider.email,
          riderPhone: newRider.phone,
          vehicle: newRider.vehicle,
        },
        isRead: false,
      });
      await adminNotification.save();
      console.log("✅ Admin notification created");
    } catch (notifError) {
      console.error("⚠️ Error creating notification (non-blocking):", notifError.message);
    }

    // Create JWT token
    console.log("🔑 Creating JWT token...");
    const token = jwt.sign(
      { id: newRider._id, role: "rider" },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    console.log("✅ Registration completed successfully!");
    res.status(201).json({
      message: "Rider registered successfully! ✅ Awaiting admin approval... ⏳",
      token,
      rider: {
        id: newRider._id,
        name: newRider.name,
        email: newRider.email,
        phone: newRider.phone,
        gender: newRider.gender,
        profileImage: newRider.profileImage,
        vehicle: newRider.vehicle,
        address: newRider.address,
        kycStatus: newRider.kycStatus,
        isApprovedByAdmin: newRider.isApprovedByAdmin,
      },
    });
  } catch (error) {
    console.log("❌ RIDER REGISTER ERROR:", error);
    console.log("❌ Error message:", error.message);
    console.log("❌ Error stack:", error.stack);
    res.status(500).json({ 
      message: "Server error ❌",
      error: error.message 
    });
  }
});

// ===================== RIDER LOGIN =====================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required ❌" });
    }

    // Find rider
    const rider = await Rider.findOne({ email });
    if (!rider) {
      return res.status(400).json({ message: "Rider not found ❌" });
    }

    // Check if account is active
    if (!rider.isActive) {
      return res
        .status(400)
        .json({ message: "Your account is deactivated ❌" });
    }

    // Check if rider is approved by admin
    if (!rider.isApprovedByAdmin) {
      return res
        .status(403)
        .json({ message: "Your registration is pending admin approval ⏳. Please wait for approval to access the dashboard" });
    }

    // Check password
    const isPasswordMatch = await bcrypt.compare(password, rider.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid credentials ❌" });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: rider._id, role: "rider" },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Rider logged in successfully ✅",
      token,
      rider: {
        id: rider._id,
        name: rider.name,
        email: rider.email,
        phone: rider.phone,
        profileImage: rider.profileImage,
        isAvailable: rider.isAvailable,
        isApprovedByAdmin: rider.isApprovedByAdmin,
        kycStatus: rider.kycStatus,
        rating: rider.rating,
        totalDeliveries: rider.totalDeliveries,
      },
    });
  } catch (error) {
    console.log("RIDER LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error ❌" });
  }
});

// ===================== GET RIDER PROFILE =====================
router.get("/profile", auth, async (req, res) => {
  try {
    const rider = await Rider.findById(req.user.id)
      .select("-password")
      .populate("currentOrder");

    if (!rider) {
      return res.status(404).json({ message: "Rider not found ❌" });
    }

    res.json({
      message: "Rider profile fetched ✅",
      rider: {
        id: rider._id,
        name: rider.name,
        email: rider.email,
        phone: rider.phone,
        profileImage: rider.profileImage,
        dateOfBirth: rider.dateOfBirth,
        gender: rider.gender,
        address: rider.address,
        vehicle: rider.vehicle,
        aadhar: rider.aadhar,
        panCard: rider.panCard,
        bankDetails: rider.bankDetails,
        isApprovedByAdmin: rider.isApprovedByAdmin,
        kycStatus: rider.kycStatus,
        rating: rider.rating,
        totalDeliveries: rider.totalDeliveries,
        isAvailable: rider.isAvailable,
        currentOrder: rider.currentOrder,
        isActive: rider.isActive,
      },
    });
  } catch (error) {
    console.log("RIDER PROFILE ERROR:", error);
    res.status(500).json({ message: "Server error ❌" });
  }
});

// ===================== CHECK APPROVAL STATUS =====================
// This endpoint checks the latest approval status from database
router.get("/check-approval", auth, async (req, res) => {
  try {
    const rider = await Rider.findById(req.user.id).select("isApprovedByAdmin");

    if (!rider) {
      return res.status(404).json({ message: "Rider not found ❌" });
    }

    res.json({
      success: true,
      isApprovedByAdmin: rider.isApprovedByAdmin,
      message: rider.isApprovedByAdmin 
        ? "Rider approved! ✅" 
        : "Pending admin approval ⏳"
    });
  } catch (error) {
    console.error("❌ Error checking approval status:", error);
    res.status(500).json({ message: "Server error ❌" });
  }
});

// ===================== UPDATE RIDER PROFILE =====================
router.put("/profile", auth, async (req, res) => {
  try {
    const {
      profileImage,
      dateOfBirth,
      gender,
      address,
      vehicle,
      aadhar,
      panCard,
      bankDetails,
    } = req.body;

    const rider = await Rider.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          profileImage: profileImage || undefined,
          dateOfBirth: dateOfBirth || undefined,
          gender: gender || undefined,
          address: address || undefined,
          vehicle: vehicle || undefined,
          aadhar: aadhar || undefined,
          panCard: panCard || undefined,
          bankDetails: bankDetails || undefined,
        },
      },
      { new: true }
    ).select("-password");

    res.json({
      message: "Rider profile updated successfully ✅",
      rider,
    });
  } catch (error) {
    console.log("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ message: "Server error ❌" });
  }
});

// ===================== TOGGLE AVAILABILITY =====================
router.put("/toggle-availability", auth, async (req, res) => {
  try {
    const rider = await Rider.findById(req.user.id);

    if (!rider) {
      return res.status(404).json({ message: "Rider not found ❌" });
    }

    if (rider.kycStatus !== "Approved") {
      return res.status(400).json({
        message: "You can only go online after KYC approval ❌",
      });
    }

    rider.isAvailable = !rider.isAvailable;
    await rider.save();

    res.json({
      message: `Rider is now ${rider.isAvailable ? "online" : "offline"} ✅`,
      isAvailable: rider.isAvailable,
    });
  } catch (error) {
    console.log("TOGGLE AVAILABILITY ERROR:", error);
    res.status(500).json({ message: "Server error ❌" });
  }
});

// ===================== GET AVAILABLE ORDERS =====================
router.get("/available-orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ orderStatus: "Placed" })
      .populate("restaurantId", "name address phone")
      .populate("userId", "name phone")
      .populate("riderId", "name phone")
      .select("-password")
      .limit(20)
      .sort({ orderDate: -1 });

    res.json({
      message: "Available orders fetched ✅",
      orders,
    });
  } catch (error) {
    console.log("GET AVAILABLE ORDERS ERROR:", error);
    res.status(500).json({ message: "Server error ❌" });
  }
});

// ===================== ACCEPT ORDER =====================
router.post("/accept-order/:orderId", auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log("🎯 ACCEPT ORDER STARTED - Order ID:", orderId);
    console.log("🚴 Rider ID:", req.user.id);

    // Check if rider already has an active order
    const rider = await Rider.findById(req.user.id);
    if (!rider) {
      console.log("❌ Rider not found");
      return res.status(404).json({ message: "Rider not found ❌" });
    }

    if (rider.currentOrder) {
      console.log("❌ Rider already has an active order:", rider.currentOrder);
      return res
        .status(400)
        .json({ message: "You already have an active order ❌" });
    }

    // Find and update order
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          orderStatus: "Ready",
          riderId: req.user.id,
        },
      },
      { new: true }
    ).populate("restaurantId userId");

    if (!order) {
      console.log("❌ Order not found for ID:", orderId);
      return res.status(404).json({ message: "Order not found ❌" });
    }

    console.log("✅ Order status updated to Ready");
    console.log("👤 User ID:", order.userId._id);

    // Update rider's current order
    rider.currentOrder = orderId;
    await rider.save();
    console.log("✅ Rider assigned to order");

    // Create notification for user with rider details
    const notification = new Notification({
      userId: order.userId._id,
      type: "RiderAssigned",
      title: "🚗 Rider Assigned - Order Confirmed",
      message: `Rider ${rider.name} has picked your delivery. Contact: ${rider.phone}. Rating: ${rider.rating || "N/A"}`,
      orderId: orderId,
      riderId: rider._id,
    });
    await notification.save();
    console.log("✅ Notification created for rider assignment - Notification ID:", notification._id);

    res.json({
      message: "Order accepted successfully ✅",
      order,
      notification: {
        id: notification._id,
        title: notification.title,
        message: notification.message,
      },
      rider: {
        id: rider._id,
        name: rider.name,
        phone: rider.phone,
        rating: rider.rating,
        profileImage: rider.profileImage,
      },
    });
  } catch (error) {
    console.log("❌ ACCEPT ORDER ERROR:", error);
    res.status(500).json({ message: "Server error ❌", error: error.message });
  }
});

// ===================== IGNORE ORDER =====================
router.post("/ignore-order/:orderId", auth, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found ❌" });
    }

    // Check if order is still available (not accepted by someone else)
    if (order.orderStatus !== "Placed") {
      return res
        .status(400)
        .json({ message: "Order is no longer available ❌" });
    }

    // Order remains with "Placed" status, rider just ignores it
    res.json({
      message: "Order ignored successfully ✅",
      order,
    });
  } catch (error) {
    console.log("IGNORE ORDER ERROR:", error);
    res.status(500).json({ message: "Server error ❌" });
  }
});

// ===================== PICKUP ORDER =====================
router.post("/pickup-order/:orderId", auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log("📦 PICKUP ORDER STARTED - Order ID:", orderId);
    console.log("🚴 Rider ID:", req.user.id);

    // Verify order is in Ready status before pickup
    const checkOrder = await Order.findById(orderId);
    if (checkOrder?.orderStatus !== "Ready") {
      return res.status(400).json({ 
        message: `Order must be in Ready status to pick up. Current status: ${checkOrder?.orderStatus}` 
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          orderStatus: "Out for Delivery",
        },
      },
      { new: true }
    ).populate("userId");

    if (!order) {
      console.log("❌ Order not found for ID:", orderId);
      return res.status(404).json({ message: "Order not found ❌" });
    }

    // Get rider details
    const rider = await Rider.findById(req.user.id);
    console.log("🚴 Rider details:", rider?.name, rider?.phone);

    if (!rider) {
      console.log("❌ Rider not found");
      return res.status(404).json({ message: "Rider not found ❌" });
    }

    // Create notification for user that order has been picked up
    const notification = new Notification({
      userId: order.userId._id,
      type: "OrderPickedUp",
      title: "📦 Your Delivery Picked Up",
      message: `Rider ${rider.name} has picked up your order at ${new Date().toLocaleTimeString("en-IN")}. On the way to you! 🚴`,
      orderId: orderId,
      riderId: rider._id,
    });
    await notification.save();
    console.log("✅ Notification created for pickup - Notification ID:", notification._id);

    res.json({
      message: "Order picked up ✅",
      order,
      notification: {
        id: notification._id,
        title: notification.title,
        message: notification.message,
      }
    });
  } catch (error) {
    console.log("❌ PICKUP ORDER ERROR:", error);
    res.status(500).json({ message: "Server error ❌", error: error.message });
  }
});

// ===================== DELIVER ORDER =====================
router.post("/deliver-order/:orderId", auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log("✅ DELIVER ORDER STARTED - Order ID:", orderId);
    console.log("🚴 Rider ID:", req.user.id);

    const order = await Order.findById(orderId);
    if (!order) {
      console.log("❌ Order not found for ID:", orderId);
      return res.status(404).json({ message: "Order not found ❌" });
    }

    console.log("📋 Current order status:", order.orderStatus);

    // Verify order is in Out for Delivery status
    if (order.orderStatus !== "Out for Delivery") {
      return res.status(400).json({ 
        message: `Order must be Out for Delivery to complete. Current status: ${order.orderStatus}` 
      });
    }

    // Update order status
    order.orderStatus = "Delivered";
    order.deliveredAt = new Date();
    await order.save();
    console.log("✅ Order status updated to Delivered");

    // Get full order with user details
    await order.populate("userId");
    console.log("👤 User ID:", order.userId._id);

    // Update rider
    const rider = await Rider.findById(req.user.id);
    if (!rider) {
      console.log("❌ Rider not found");
      return res.status(404).json({ message: "Rider not found ❌" });
    }

    rider.currentOrder = null;
    rider.totalDeliveries += 1;
    
    // Add to order history
    rider.orderHistory.push(orderId);

    // Calculate earnings (example: ₹20 per delivery + 5% commission)
    const deliveryCharge = 20;
    rider.earnings.today += deliveryCharge;
    rider.earnings.total += deliveryCharge;

    await rider.save();
    console.log("✅ Rider stats updated - Total Deliveries:", rider.totalDeliveries);

    // Create notification for user that order is delivered
    const notification = new Notification({
      userId: order.userId._id,
      type: "OrderDelivered",
      title: "✅ Your Item Was Delivered",
      message: `Your order has been successfully delivered by ${rider.name} at ${new Date().toLocaleTimeString("en-IN")}. Rider Rating: ⭐ ${rider.rating || "N/A"}. Thank you for your order!`,
      orderId: orderId,
      riderId: rider._id,
    });
    await notification.save();
    console.log("✅ Notification created for delivery - Notification ID:", notification._id);

    res.json({
      message: "Order delivered successfully ✅",
      order,
      notification: {
        id: notification._id,
        title: notification.title,
        message: notification.message,
      },
      rider: {
        totalDeliveries: rider.totalDeliveries,
        earningsToday: rider.earnings.today,
        earningsTotal: rider.earnings.total,
      },
    });
  } catch (error) {
    console.log("❌ DELIVER ORDER ERROR:", error);
    res.status(500).json({ message: "Server error ❌", error: error.message });
  }
});

// ===================== GET CURRENT ACTIVE ORDER =====================
router.get("/current-order", auth, async (req, res) => {
  try {
    const rider = await Rider.findById(req.user.id).populate({
      path: "currentOrder",
      populate: [
        { path: "restaurantId", select: "name address phone" },
        { path: "userId", select: "name phone address" },
      ],
    });

    if (!rider) {
      return res.status(404).json({ message: "Rider not found ❌" });
    }

    if (!rider.currentOrder) {
      return res.json({
        message: "No active order",
        currentOrder: null,
      });
    }

    res.json({
      message: "Current order fetched ✅",
      currentOrder: rider.currentOrder,
    });
  } catch (error) {
    console.log("GET CURRENT ORDER ERROR:", error);
    res.status(500).json({ message: "Server error ❌" });
  }
});

// ===================== GET ORDER HISTORY =====================
router.get("/order-history", auth, async (req, res) => {
  try {
    const rider = await Rider.findById(req.user.id).populate({
      path: "orderHistory",
      populate: [
        { path: "restaurantId", select: "name" },
        { path: "userId", select: "name" },
      ],
      options: { sort: { deliveredAt: -1 } },
    });

    if (!rider) {
      return res.status(404).json({ message: "Rider not found ❌" });
    }

    res.json({
      message: "Order history fetched ✅",
      orderHistory: rider.orderHistory,
    });
  } catch (error) {
    console.log("GET ORDER HISTORY ERROR:", error);
    res.status(500).json({ message: "Server error ❌" });
  }
});

// ===================== GET EARNINGS =====================
router.get("/earnings", auth, async (req, res) => {
  try {
    const rider = await Rider.findById(req.user.id).select("earnings totalDeliveries");

    if (!rider) {
      return res.status(404).json({ message: "Rider not found ❌" });
    }

    res.json({
      message: "Earnings fetched ✅",
      earnings: rider.earnings,
      totalDeliveries: rider.totalDeliveries,
    });
  } catch (error) {
    console.log("GET EARNINGS ERROR:", error);
    res.status(500).json({ message: "Server error ❌" });
  }
});

// ===================== RESET EARNINGS (DAILY) =====================
router.post("/reset-daily-earnings", auth, async (req, res) => {
  try {
    const rider = await Rider.findByIdAndUpdate(
      req.user.id,
      { $set: { "earnings.today": 0 } },
      { new: true }
    ).select("earnings");

    res.json({
      message: "Daily earnings reset ✅",
      earnings: rider.earnings,
    });
  } catch (error) {
    console.log("RESET EARNINGS ERROR:", error);
    res.status(500).json({ message: "Server error ❌" });
  }
});

module.exports = router;
