const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "OrderPlaced",
        "OrderConfirmed",
        "OrderPreparing",
        "OrderReady",
        "OrderOutForDelivery",
        "OrderDelivered",
        "OrderCancelled",
        "RiderAssigned",
        "OrderPickedUp",
        "PaymentFailed",
        "Discount",
        "Review",
        "General",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rider",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
