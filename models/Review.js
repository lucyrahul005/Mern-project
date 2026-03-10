const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Product review fields
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    // Restaurant review fields
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    // Rider review fields
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rider",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    // Review type: "Food", "Restaurant", "Rider"
    reviewType: {
      type: String,
      enum: ["Food", "Restaurant", "Rider"],
      default: "Food",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    // For experience-related reviews
    experience: String, // e.g., "Great service", "Slow delivery"
    
    isComplaint: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
