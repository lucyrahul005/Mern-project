const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // 🍔 NEW FIELDS FOR FOOD APP
    isVeg: {
      type: Boolean,
      default: false,
    },

    spicyLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    prepTime: {
      type: String,
      default: "20 min",
    },

    rating: {
      type: Number,
      default: 4,
    },

    // Optional (for UI badges)
    isPopular: {
      type: Boolean,
      default: false,
    },

    isRecommended: {
      type: Boolean,
      default: false,
    },

    // Link to Restaurant
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },

    // Alternative field name for restaurant admin routes
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },

    // Availability status
    isAvailable: {
      type: Boolean,
      default: true,
    },

    // Preparation time display field
    preparationTime: {
      type: String,
      default: "20 min",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);