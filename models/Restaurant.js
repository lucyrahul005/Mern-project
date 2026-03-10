const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    // 🔐 Admin user reference
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Basic Info
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    cuisine: {
      type: [String],
      required: true,
    },

    // 📍 Location Details
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    phone: {
      type: String,
      required: true,
    },

    email: {
      type: String,
    },

    // ⏰ Operating Hours
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },

    isOpen: {
      type: Boolean,
      default: true,
    },

    // 💰 Business Settings
    deliveryFee: {
      type: Number,
      default: 0,
    },

    minOrderValue: {
      type: Number,
      default: 100,
    },

    deliveryTime: {
      type: String,
      default: "30 min",
    },

    // 💳 Tax & Charges
    taxPercentage: {
      type: Number,
      default: 5,
    },

    platformFeePercentage: {
      type: Number,
      default: 3,
    },

    // 📊 Ratings & Reviews
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },

    reviews: {
      type: Number,
      default: 0,
    },

    isPopular: {
      type: Boolean,
      default: false,
    },

    // 🔔 Notification Preferences
    notificationSettings: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      newOrderAlert: { type: Boolean, default: true },
      orderStatusAlert: { type: Boolean, default: true },
    },

    // 💳 Payment Settings
    paymentMethods: {
      COD: { type: Boolean, default: true },
      Card: { type: Boolean, default: true },
      UPI: { type: Boolean, default: true },
    },

    // 📈 Analytics
    totalOrders: {
      type: Number,
      default: 0,
    },

    totalRevenue: {
      type: Number,
      default: 0,
    },

    averageOrderValue: {
      type: Number,
      default: 0,
    },

    // ❌ Soft delete
    isActive: {
      type: Boolean,
      default: true,
    },

    // 📋 REGISTRATION & VERIFICATION FIELDS
    // Step 1: Basic Info (already covered above)
    
    // Step 2: Documents & Licenses
    restaurantImages: {
      type: [String], // Array of image URLs
      default: [],
    },

    menuImages: {
      type: [String], // Array of menu item images
      default: [],
    },

    idProof: {
      type: String, // Image of Aadhar/PAN/License
      default: "",
    },

    fssaiNumber: {
      type: String,
      trim: true,
    },

    fssaiCertificate: {
      type: String, // Image of FSSAI certificate
      default: "",
    },

    gstNumber: {
      type: String,
      trim: true,
    },

    gstCertificate: {
      type: String, // Image of GST certificate
      default: "",
    },

    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
    },

    // Registration completion tracking
    registrationStep: {
      type: Number,
      enum: [1, 2, 3, 4], // Step 1: Basic, Step 2: Documents, Step 3: Bank, Step 4: Complete
      default: 1,
    },

    registrationCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
