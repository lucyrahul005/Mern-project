const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// Middleware to verify user
const verifyUser = (req, res, next) => {
  const userId = req.headers["user-id"] || req.body.userId || req.params.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: "User ID required" });
  }
  req.userId = userId;
  next();
};

// ========== GET UNREAD NOTIFICATION COUNT ==========
// IMPORTANT: This MUST come before /:userId to avoid route collision
// GET /api/notifications/:userId/unread-count
router.get("/:userId/unread-count", verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is requesting their own count
    if (userId !== req.userId) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized" });
    }

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ success: false, message: "Error fetching unread count", error: error.message });
  }
});

// ========== MARK NOTIFICATION AS READ ==========
// IMPORTANT: This MUST come before /:userId to avoid route collision
// PUT /api/notifications/:notificationId/read
router.put("/:notificationId/read", verifyUser, async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    // Verify user owns this notification
    if (notification.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this notification" });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Error updating notification", error: error.message });
  }
});

// ========== MARK ALL NOTIFICATIONS AS READ ==========
// IMPORTANT: This MUST come before /:userId to avoid route collision
// PUT /api/notifications/:userId/read-all
router.put("/:userId/read-all", verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is updating their own notifications
    if (userId !== req.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ success: false, message: "Error updating notifications", error: error.message });
  }
});

// ========== DELETE ALL NOTIFICATIONS ==========
// IMPORTANT: This MUST come before /:userId to avoid route collision
// DELETE /api/notifications/:userId/delete-all
router.delete("/:userId/delete-all", verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is deleting their own notifications
    if (userId !== req.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const result = await Notification.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: "All notifications deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    res.status(500).json({ success: false, message: "Error deleting notifications", error: error.message });
  }
});

// ========== DELETE NOTIFICATION ==========
// IMPORTANT: This MUST come before /:userId to avoid route collision
// DELETE /api/notifications/:notificationId
router.delete("/:notificationId", verifyUser, async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    // Verify user owns this notification
    if (notification.userId.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this notification" });
    }

    await Notification.findByIdAndDelete(notificationId);

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ success: false, message: "Error deleting notification", error: error.message });
  }
});

// ========== GET ALL NOTIFICATIONS FOR USER ==========
// IMPORTANT: This route should come LAST because /:userId matches any parameter
// GET /api/notifications/:userId - Get all notifications for a user
router.get("/:userId", verifyUser, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is requesting their own notifications
    if (userId !== req.userId) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized to access these notifications" });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("orderId", "orderStatus total items")
      .populate("riderId", "name phone");

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Error fetching notifications", error: error.message });
  }
});

module.exports = router;
