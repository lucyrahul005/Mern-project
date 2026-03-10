const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    // 👇 ADMIN FIELD
    isAdmin: {
      type: Boolean,
      default: false,
    },

    // 🥘 RESTAURANT ADMIN
    isRestaurantAdmin: {
      type: Boolean,
      default: false,
    },
    adminStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    // 🔥 ADD THESE TWO FIELDS
    resetToken: String,
    resetTokenExpiry: Date,

    // 🔴 Block/Unblock user
    isBlocked: {
      type: Boolean,
      default: false,
    },

    // Address Array
    addresses: [addressSchema],

    // Wishlist
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
