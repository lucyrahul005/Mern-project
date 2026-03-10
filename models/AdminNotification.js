const mongoose = require("mongoose");

const adminNotificationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // e.g., 'RestaurantAdminRegistration'
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Object }, // arbitrary payload (userId, restaurantId, etc.)
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminNotification", adminNotificationSchema);
