const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// 🔐 Auth middleware
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// 🔐 Admin middleware
const adminMiddleware = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};


// ✅ GET PRODUCTS (FILTER WORKS)
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;

    let filter = {};

    // ✅ CATEGORY FILTER
    if (category) {
      filter.category = category.toLowerCase();
    }

    // ✅ SEARCH FILTER (🔥 IMPORTANT)
    if (search) {
      filter.name = { $regex: search, $options: "i" }; // case-insensitive
    }

    const products = await Product.find(filter);

    res.json(products);
  } catch (error) {
    console.log("Error fetching products ❌", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ ADD PRODUCT (FIXED)
router.post("/add-product", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const product = new Product({
      ...req.body,
      category: req.body.category.toLowerCase(), // 🔥 IMPORTANT FIX
    });

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Error adding product" });
  }
});


// ✅ DELETE PRODUCT
router.delete(
  "/delete-product/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      await Product.findByIdAndDelete(req.params.id);
      res.json({ message: "Deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting product" });
    }
  }
);

module.exports = router;