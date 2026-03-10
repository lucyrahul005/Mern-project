const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Review = require("../models/Review");
const Notification = require("../models/Notification");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");

// Auth middleware
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

// =====================================================
// ⭐ REVIEWS MANAGEMENT
// =====================================================

// GET MY REVIEWS
router.get("/reviews/my-reviews", authMiddleware, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id })
      .populate("productId", "name image")
      .populate("orderId", "_id")
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

// ADD REVIEW - Generic (for backward compatibility)
router.post("/reviews", authMiddleware, async (req, res) => {
  try {
    const { productId, orderId, rating, comment, reviewType = "Food", experience, isComplaint } = req.body;

    if (!orderId || !rating || !comment) {
      return res.status(400).json({ message: "Order ID, rating, and comment are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Verify order belongs to user and is delivered
    const order = await Order.findById(orderId);
    if (!order || order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (order.orderStatus !== "Delivered") {
      return res.status(400).json({ message: "Can only review delivered orders" });
    }

    // For Food reviews, require productId
    if (reviewType === "Food") {
      if (!productId) {
        return res.status(400).json({ message: "Product ID required for food reviews" });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if review already exists for this product
      const existingReview = await Review.findOne({
        userId: req.user._id,
        productId,
        orderId,
        reviewType: "Food",
      });

      if (existingReview) {
        return res.status(400).json({ message: "You already reviewed this product" });
      }

      const review = new Review({
        userId: req.user._id,
        productId,
        orderId,
        restaurantId: product.restaurant || product.restaurantId,
        rating,
        comment,
        experience,
        reviewType: "Food",
        isComplaint: isComplaint || false,
      });

      await review.save();
      const populatedReview = await Review.findById(review._id)
        .populate("productId", "name")
        .populate("restaurantId", "name");

      return res.status(201).json({ message: "Food review posted successfully ✅", review: populatedReview });
    }

    if (reviewType === "Restaurant") {
      // Restaurant review
      const restaurantId = order.restaurantId;
      if (!restaurantId) {
        return res.status(400).json({ message: "Restaurant not found" });
      }

      const existingReview = await Review.findOne({
        userId: req.user._id,
        restaurantId,
        orderId,
        reviewType: "Restaurant",
      });

      if (existingReview) {
        return res.status(400).json({ message: "You already reviewed this restaurant" });
      }

      const review = new Review({
        userId: req.user._id,
        restaurantId,
        orderId,
        rating,
        comment,
        experience,
        reviewType: "Restaurant",
        isComplaint: isComplaint || false,
      });

      await review.save();
      const populatedReview = await Review.findById(review._id)
        .populate("restaurantId", "name");

      return res.status(201).json({ message: "Restaurant review posted successfully ✅", review: populatedReview });
    }

    if (reviewType === "Rider") {
      // Rider review
      const riderId = order.riderId;
      if (!riderId) {
        return res.status(400).json({ message: "Rider not found for this order" });
      }

      const existingReview = await Review.findOne({
        userId: req.user._id,
        riderId,
        orderId,
        reviewType: "Rider",
      });

      if (existingReview) {
        return res.status(400).json({ message: "You already reviewed this rider" });
      }

      const review = new Review({
        userId: req.user._id,
        riderId,
        orderId,
        rating,
        comment,
        experience,
        reviewType: "Rider",
        isComplaint: isComplaint || false,
      });

      await review.save();
      const populatedReview = await Review.findById(review._id);

      return res.status(201).json({ message: "Rider review posted successfully ✅", review: populatedReview });
    }

    res.status(400).json({ message: "Invalid review type" });
  } catch (err) {
    console.error("Error adding review:", err);
    res.status(500).json({ message: "Error adding review: " + err.message });
  }
});

// GET MY REVIEWS (all types)
router.get("/my-reviews", authMiddleware, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id })
      .populate("productId", "name image")
      .populate("restaurantId", "name")
      .populate("riderId", "name phone")
      .populate("orderId", "_id orderStatus")
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

// GET RESTAURANT REVIEWS (for restaurant admin)
router.get("/restaurant/:restaurantId", authMiddleware, async (req, res) => {
  try {
    const foodReviews = await Review.find({ 
      restaurantId: req.params.restaurantId,
      reviewType: "Food"
    })
      .populate("userId", "name email")
      .populate("productId", "name")
      .sort({ createdAt: -1 });

    const restaurantReviews = await Review.find({
      restaurantId: req.params.restaurantId,
      reviewType: "Restaurant"
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    const allReviews = [...foodReviews, ...restaurantReviews].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({ reviews: allReviews, foodReviews, restaurantReviews });
  } catch (err) {
    console.error("Error fetching restaurant reviews:", err);
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

// GET RIDER REVIEWS (for rider admin)
router.get("/rider/:riderId", authMiddleware, async (req, res) => {
  try {
    const riderReviews = await Review.find({
      riderId: req.params.riderId,
      reviewType: "Rider"
    })
      .populate("userId", "name email")
      .populate("orderId", "_id orderStatus")
      .sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating = riderReviews.length > 0
      ? (riderReviews.reduce((sum, r) => sum + r.rating, 0) / riderReviews.length).toFixed(1)
      : 0;

    res.json({ reviews: riderReviews, averageRating: avgRating, totalReviews: riderReviews.length });
  } catch (err) {
    console.error("Error fetching rider reviews:", err);
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

// GET REVIEWS FOR A SPECIFIC ORDER (for review form on Orders page)
router.get("/order/:orderId", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate("userId", "name")
      .populate("restaurantId", "name")
      .populate("riderId", "name");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check authorization
    if (order.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (order.orderStatus !== "Delivered") {
      return res.status(400).json({ message: "Can only review delivered orders" });
    }

    // Get existing reviews for this order
    const existingReviews = await Review.find({ orderId })
      .populate("productId", "name");

    // Get order items for review form
    const items = order.items || [];

    res.json({
      order: {
        _id: order._id,
        status: order.orderStatus,
        restaurant: order.restaurantId,
        rider: order.riderId,
        items,
      },
      existingReviews,
    });
  } catch (err) {
    console.error("Error fetching order reviews:", err);
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

// =====================================================
// 🔔 NOTIFICATIONS MANAGEMENT
// =====================================================

// GET MY NOTIFICATIONS
router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

// MARK NOTIFICATION AS READ
router.put("/notifications/:id/read", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    res.json({ notification });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ message: "Error updating notification" });
  }
});

// CREATE NOTIFICATION (internal use - called by order routes)
router.post("/notifications/create", async (req, res) => {
  try {
    const { userId, type, title, message, orderId } = req.body;

    const notification = new Notification({
      userId,
      type,
      title,
      message,
      orderId,
    });

    await notification.save();

    res.status(201).json({ notification });
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({ message: "Error creating notification" });
  }
});

// =====================================================
// 💝 WISHLIST MANAGEMENT
// =====================================================

// GET WISHLIST
router.get("/wishlist", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");
    res.json({ items: user.wishlist || [] });
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    res.status(500).json({ message: "Error fetching wishlist" });
  }
});

// ADD TO WISHLIST
router.post("/wishlist/add", authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const user = await User.findById(req.user._id);

    if (!user.wishlist) {
      user.wishlist = [];
    }

    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    user.wishlist.push(productId);
    await user.save();

    const updatedUser = await User.findById(req.user._id).populate("wishlist");

    res.json({ message: "Added to wishlist ✅", items: updatedUser.wishlist });
  } catch (err) {
    console.error("Error adding to wishlist:", err);
    res.status(500).json({ message: "Error adding to wishlist" });
  }
});

// REMOVE FROM WISHLIST
router.post("/wishlist/remove", authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const user = await User.findById(req.user._id);

    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
    await user.save();

    const updatedUser = await User.findById(req.user._id).populate("wishlist");

    res.json({ message: "Removed from wishlist ✅", items: updatedUser.wishlist });
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    res.status(500).json({ message: "Error removing from wishlist" });
  }
});

module.exports = router;
