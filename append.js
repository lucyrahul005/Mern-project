const fs = require('fs');
let code = fs.readFileSync('routes/adminRoutes.js', 'utf8');

const replacement = `
// =====================================================
// 🏢 RESTAURANT ADMIN REQUESTS MANAGEMENT
// =====================================================

// GET ALL RESTAURANT REQUESTS
router.get("/restaurant-requests", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const requests = await User.find({ isRestaurantAdmin: true }).select("-password").sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    console.error("❌ Error fetching restaurant requests:", err);
    res.status(500).json({ message: "Error fetching requests" });
  }
});

// APPROVE RESTAURANT REQUEST
router.put(
  "/restaurant-requests/:id/approve",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user || !user.isRestaurantAdmin) {
        return res.status(404).json({ message: "Restaurant request not found" });
      }

      user.adminStatus = "Approved";
      await user.save();

      // Activate the restaurant
      const restaurant = await Restaurant.findOne({ adminId: user._id });
      if (restaurant) {
        restaurant.isActive = true;
        await restaurant.save();
      }

      console.log(\`✅ Request \${user._id} Approved\`);
      res.json({ success: true, user, message: "Restaurant approved successfully" });
    } catch (err) {
      console.error("❌ Error approving request:", err);
      res.status(500).json({ message: "Error approving request" });
    }
  }
);

// REJECT RESTAURANT REQUEST
router.put(
  "/restaurant-requests/:id/reject",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user || !user.isRestaurantAdmin) {
        return res.status(404).json({ message: "Restaurant request not found" });
      }

      user.adminStatus = "Rejected";
      await user.save();

      console.log(\`❌ Request \${user._id} Rejected\`);
      res.json({ success: true, user, message: "Restaurant rejected successfully" });
    } catch (err) {
      console.error("❌ Error rejecting request:", err);
      res.status(500).json({ message: "Error rejecting request" });
    }
  }
);

module.exports = router;
`;

if (!code.includes('/restaurant-requests')) {
  code = code.replace('module.exports = router;', replacement);
  fs.writeFileSync('routes/adminRoutes.js', code);
}
