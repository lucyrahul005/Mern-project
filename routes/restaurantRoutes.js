const express = require("express");
const router = express.Router();
const Restaurant = require("../models/Restaurant");
const Product = require("../models/Product");

// ✅ GET ALL RESTAURANTS
router.get("/", async (req, res) => {
  try { // Only show approved/active restaurants
    const restaurants = await Restaurant.find({ isActive: true }).sort({ rating: -1 });
    
    // Ensure all restaurants have default values for required fields
    const restaurantList = restaurants.map(r => ({
      ...r.toObject(),
      image: r.image || "",
      deliveryFee: r.deliveryFee ?? 40,
      minOrderValue: r.minOrderValue ?? 100,
      deliveryTime: r.deliveryTime || "30 min",
      rating: r.rating ?? 4.5,
      reviews: r.reviews ?? 0,
      taxPercentage: r.taxPercentage ?? 5,
      platformFeePercentage: r.platformFeePercentage ?? 3,
      isOpen: r.isOpen ?? true,
      phone: r.phone || "N/A",
      cuisine: Array.isArray(r.cuisine) ? r.cuisine : [],
    }));
    
    res.json(restaurantList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET SINGLE RESTAURANT
router.get("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    // Ensure all required fields have defaults
    const restaurantData = {
      ...restaurant.toObject(),
      image: restaurant.image || "",
      deliveryFee: restaurant.deliveryFee ?? 40,
      minOrderValue: restaurant.minOrderValue ?? 100,
      deliveryTime: restaurant.deliveryTime || "30 min",
      rating: restaurant.rating ?? 4.5,
      reviews: restaurant.reviews ?? 0,
      taxPercentage: restaurant.taxPercentage ?? 5,
      platformFeePercentage: restaurant.platformFeePercentage ?? 3,
      isOpen: restaurant.isOpen ?? true,
      phone: restaurant.phone || "N/A",
      cuisine: Array.isArray(restaurant.cuisine) ? restaurant.cuisine : [],
    };
    
    res.json(restaurantData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ GET PRODUCTS BY RESTAURANT
router.get("/:id/products", async (req, res) => {
  try {
    const { search, category } = req.query;

    let filter = {
      $or: [
        { restaurant: req.params.id },
        { restaurantId: req.params.id }
      ]
    };

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (category) {
      filter.category = category.toLowerCase();
    }

    const products = await Product.find(filter).sort({ rating: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ SEARCH RESTAURANTS
router.get("/search/:query", async (req, res) => {
  try {
    const { query } = req.params;
    const restaurants = await Restaurant.find({
      isActive: true,
      $or: [
        { name: { $regex: query, $options: "i" } },
        { cuisine: { $in: [new RegExp(query, "i")] } },
        { description: { $regex: query, $options: "i" } },
      ],
    }).sort({ rating: -1 });

    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ CREATE RESTAURANT (ADMIN ONLY)
router.post("/", async (req, res) => {
  const restaurant = new Restaurant({
    name: req.body.name,
    description: req.body.description,
    image: req.body.image,
    cuisine: req.body.cuisine,
    address: req.body.address,
    phone: req.body.phone,
    rating: req.body.rating,
    deliveryTime: req.body.deliveryTime,
    deliveryFee: req.body.deliveryFee,
    minOrderValue: req.body.minOrderValue,
    isOpen: req.body.isOpen,
    isPopular: req.body.isPopular,
  });

  try {
    const newRestaurant = await restaurant.save();
    res.status(201).json(newRestaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ✅ UPDATE RESTAURANT
router.put("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    Object.assign(restaurant, req.body);
    const updatedRestaurant = await restaurant.save();
    res.json(updatedRestaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ✅ DELETE RESTAURANT
router.delete("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json({ message: "Restaurant deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
