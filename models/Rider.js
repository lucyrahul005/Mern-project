const mongoose = require("mongoose");

const riderSchema = new mongoose.Schema(
  {
    // Basic Information (MANDATORY)
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },

    // Personal Details
    profileImage: {
      type: String,
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: null,
    },

    // Address Details
    address: {
      currentAddress: {
        type: String,
        default: null,
      },
      city: {
        type: String,
        default: null,
      },
      pincode: {
        type: String,
        default: null,
      },
    },

    // Vehicle Details (VERY IMPORTANT)
    vehicle: {
      type: {
        type: String,
        enum: ["Bike", "Cycle", "Scooter", "Car"],
        default: null,
      },
      number: {
        type: String,
        default: null,
      },
      license: {
        type: String,
        default: null,
      },
    },

    // ID Proof (KYC)
    aadhar: {
      type: String,
      default: null,
    },
    panCard: {
      type: String,
      default: null,
    },

    // Bank Details (Optional for now)
    bankDetails: {
      accountNumber: {
        type: String,
        default: null,
      },
      ifscCode: {
        type: String,
        default: null,
      },
    },

    // Availability Status
    isAvailable: {
      type: Boolean,
      default: false,
    },

    // Admin Approval Status (Riders need approval before accessing dashboard)
    isApprovedByAdmin: {
      type: Boolean,
      default: false,
    },

    // Current Order
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    // Earnings
    earnings: {
      today: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        default: 0,
      },
    },

    // KYC Status
    kycStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Delivery Count
    totalDeliveries: {
      type: Number,
      default: 0,
    },

    // Rating
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // Past Orders
    orderHistory: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rider", riderSchema);
