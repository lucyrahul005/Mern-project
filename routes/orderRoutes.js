const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Notification = require("../models/Notification");

// Middleware to verify user (you can add JWT verification here)
const verifyUser = (req, res, next) => {
  const userId = req.headers["user-id"] || req.body.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: "User ID required" });
  }
  req.userId = userId;
  console.log("✅ User ID extracted:", userId);
  next();
};

// ========== GET ALL ORDERS (ADMIN) ==========
// GET /api/orders - Get all orders (admin only)
// DO THIS FIRST - before :orderId parameter route
router.get("/", async (req, res) => {
  try {
    const { status, userId, startDate, endDate } = req.query;

    // Build filter
    let filter = {};
    if (status) filter.orderStatus = status;
    if (userId) filter.userId = userId;
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .sort({ orderDate: -1 })
      .populate("userId", "name email phone")
      .limit(100);

    res.status(200).json({
      success: true,
      message: "All orders fetched successfully",
      orders,
      count: orders.length,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Error fetching orders", error: error.message });
  }
});

// ========== GET USER'S ORDERS ==========
// GET /api/orders/user/:userId - Get all orders for a user
// MUST come BEFORE generic :orderId route
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate ObjectId
    if (!userId || userId.length !== 24) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const orders = await Order.find({ userId }).sort({ orderDate: -1 }).limit(50); // Most recent first

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      orders,
      count: orders.length,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ success: false, message: "Error fetching orders", error: error.message });
  }
});

// ========== CREATE ORDER ==========
// POST /api/orders - Create a new order from cart
router.post("/", verifyUser, async (req, res) => {
  try {
    const { items, subtotal, deliveryFee, tax, total, deliveryAddress, paymentMethod, specialInstructions } = req.body;

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Order must contain items" });
    }

    if (!deliveryAddress) {
      return res.status(400).json({ success: false, message: "Delivery address is required" });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ success: false, message: "Invalid order total" });
    }

    // Get restaurantId from first item - all items should be from same restaurant
    const restaurantId = items[0]?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant ID is required in items" });
    }

    // Verify user exists
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Create order
    const newOrder = new Order({
      userId: req.userId,
      restaurantId: restaurantId,
      items,
      subtotal: subtotal || 0,
      deliveryFee: deliveryFee || 0,
      tax: tax || 0,
      total,
      deliveryAddress,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: "Pending",
      orderStatus: "Placed",
      specialInstructions: specialInstructions || "",
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60000), // 45 mins default
    });

    const savedOrder = await newOrder.save();

    // Create notification for order placed
    try {
      console.log("📢 Creating notification for userId:", req.userId);
      const notification = await Notification.create({
        userId: req.userId,
        type: "OrderPlaced",
        title: "Order Placed Successfully 🎉",
        message: `Your order #${savedOrder._id.slice(-6)} has been placed. Total: ₹${total}`,
        orderId: savedOrder._id,
      });
      console.log("✅ Notification created:", notification._id);
    } catch (notifyErr) {
      console.error("❌ Error creating notification:", notifyErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "Error creating order", error: error.message });
  }
});

// ========== GET SINGLE ORDER ==========
// GET /api/orders/:orderId - Get order details
// MUST come AFTER /user/:userId and other specific routes
router.get("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("userId", "name email phone")
      .populate("items.productId");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ success: false, message: "Error fetching order", error: error.message });
  }
});

// ========== UPDATE ORDER STATUS ==========
// PUT /api/orders/:orderId/status - Update order status (admin only)
router.put("/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    if (!orderStatus) {
      return res.status(400).json({ success: false, message: "Order status is required" });
    }

    const validStatuses = ["Placed", "Preparing", "Ready", "Out for Delivery", "Delivered", "Cancelled"];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: "Invalid order status" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        orderStatus,
        ...(orderStatus === "Delivered" && { deliveredAt: new Date() }),
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Create notifications for different status changes
    try {
      let notificationType = "";
      let notificationTitle = "";
      let notificationMessage = "";

      switch (orderStatus) {
        case "Preparing":
          notificationType = "OrderPreparing";
          notificationTitle = "Order Confirmed ✅";
          notificationMessage = `Your order #${order._id.slice(-6)} is being prepared. Estimated time: 30-45 minutes.`;
          break;

        case "Ready":
          notificationType = "OrderReady";
          notificationTitle = "Order Ready for Pickup 📦";
          notificationMessage = `Your order #${order._id.slice(-6)} is ready! A rider will pick it up soon.`;
          break;

        case "Out for Delivery":
          notificationType = "OutForDelivery";
          notificationTitle = "Order Out for Delivery 🚗";
          notificationMessage = `Your order #${order._id.slice(-6)} is on its way! Estimated delivery: 15 minutes.`;
          break;

        case "Delivered":
          notificationType = "OrderDelivered";
          notificationTitle = "Order Delivered 🎉";
          notificationMessage = `Your order #${order._id.slice(-6)} has been delivered. Thank you for your order!`;
          break;

        case "Cancelled":
          notificationType = "OrderCancelled";
          notificationTitle = "Order Cancelled ❌";
          notificationMessage = `Your order #${order._id.slice(-6)} has been cancelled.`;
          break;

        default:
          break;
      }

      if (notificationType) {
        await Notification.create({
          userId: order.userId,
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          orderId: order._id,
        });
        console.log(`✅ Notification created: ${notificationType}`);
      }
    } catch (notifyErr) {
      console.error("❌ Error creating notification:", notifyErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ success: false, message: "Error updating order status", error: error.message });
  }
});

// ========== CANCEL ORDER ==========
// PUT /api/orders/:orderId/cancel - Cancel order
router.put("/:orderId/cancel", verifyUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Verify user owns this order
    if (order.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized to cancel this order" });
    }

    // Can't cancel delivered or already cancelled orders
    if (["Delivered", "Cancelled"].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: `Cannot cancel order with status: ${order.orderStatus}` });
    }

    order.orderStatus = "Cancelled";
    order.cancellationReason = reason || "User requested cancellation";
    await order.save();

    // Create cancellation notification
    try {
      await Notification.create({
        userId: order.userId,
        type: "OrderCancelled",
        title: "Order Cancelled ❌",
        message: `Your order #${order._id.slice(-6)} has been cancelled. Refund will be processed within 3-5 business days.`,
        orderId: order._id,
      });
      console.log("✅ Cancellation notification created");
    } catch (notifyErr) {
      console.error("❌ Error creating cancellation notification:", notifyErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ success: false, message: "Error cancelling order", error: error.message });
  }
});

// ========== UPDATE PAYMENT STATUS ==========
// PUT /api/orders/:orderId/payment - Update payment status by user
router.put("/:orderId/payment", verifyUser, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, paymentStatus, transactionDetails } = req.body;

    if (!paymentMethod || !paymentStatus) {
      return res.status(400).json({ success: false, message: "Payment method and status are required" });
    }

    const validMethods = ["COD", "Card", "UPI", "NetBanking"];
    const validStatuses = ["Pending", "Completed", "Failed"];

    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }

    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: "Invalid payment status" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Verify user owns this order
    if (order.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this order" });
    }

    // Update payment details
    order.paymentMethod = paymentMethod;
    order.paymentStatus = paymentStatus;

    // Store transaction details for card payments
    if (transactionDetails && (paymentMethod === "Card" || paymentMethod === "UPI")) {
      order.transactionDetails = {
        transactionId: transactionDetails.transactionId || `TXN_${Date.now()}`,
        cardLast4: transactionDetails.cardLast4 || null,
        cardBrand: transactionDetails.cardBrand || null,
        cardholderName: transactionDetails.cardholderName || null,
        gatewayResponse: transactionDetails.gatewayResponse || null,
        transactionTimestamp: new Date(),
      };
    }

    // If payment is successful and order is still "Placed", keep it as is
    // Admin will update status to "Preparing" later
    if (paymentStatus === "Completed" && order.orderStatus === "Placed") {
      // Order stays in "Placed" status - waiting for admin to move to "Preparing"
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ success: false, message: "Error updating payment status", error: error.message });
  }
});

module.exports = router;