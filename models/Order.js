const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // User info
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Restaurant info
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    // Rider info
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rider",
      default: null,
    },

    // Items ordered
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: String,
        price: Number,
        quantity: Number,
        image: String,
        restaurantId: mongoose.Schema.Types.ObjectId,
      },
    ],

    // Order totals
    subtotal: {
      type: Number,
      required: true,
    },

    deliveryFee: {
      type: Number,
      default: 0,
    },

    tax: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      required: true,
    },

    // Delivery address
    deliveryAddress: {
      fullName: String,
      phone: String,
      addressLine: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
    },

    // Payment info
    paymentMethod: {
      type: String,
      enum: ["COD", "Card", "UPI"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },

    // Transaction details
    transactionDetails: {
      transactionId: String,
      cardLast4: String,
      cardBrand: String,
      cardholderName: String,
      gatewayResponse: mongoose.Schema.Types.Mixed,
      transactionTimestamp: Date,
    },

    // Order status flow: Placed → Preparing → Ready → Out for Delivery → Delivered
    orderStatus: {
      type: String,
      enum: ["Placed", "Preparing", "Ready", "Out for Delivery", "Delivered", "Cancelled"],
      default: "Placed",
    },

    // Timestamps
    orderDate: {
      type: Date,
      default: Date.now,
    },

    estimatedDeliveryTime: Date,

    deliveredAt: Date,

    // Additional info
    specialInstructions: String,

    cancellationReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);