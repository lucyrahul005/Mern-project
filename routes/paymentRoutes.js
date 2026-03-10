const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const Order = require("../models/Order");
const authMiddleware = require("../middleware/auth");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { cart } = req.body;

    const line_items = cart.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Payment failed" });
  }
});

// ========== GET ALL TRANSACTIONS ==========
// GET /api/payments/transactions - Get all transactions (admin only)
router.get("/transactions", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { paymentStatus: "Completed" },
        { paymentStatus: "Failed" },
      ]
    })
      .select("_id paymentMethod paymentStatus transactionDetails total createdAt")
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(100);

    const transactions = orders.map((order) => {
      const txnDetails = order.transactionDetails || {};
      const gatewayResponse = txnDetails.gatewayResponse || {};
      
      // Extract UPI ID if available
      const upiId = gatewayResponse.upiId || null;
      
      return {
        _id: order._id,
        orderId: order._id.toString().slice(-8).toUpperCase(),
        user: order.userId?.name || "Unknown",
        userEmail: order.userId?.email || "-",
        amount: order.total,
        paymentMethod: order.paymentMethod,
        status: order.paymentStatus,
        transactionId: txnDetails.transactionId || "-",
        cardLast4: txnDetails.cardLast4 || "-",
        cardBrand: txnDetails.cardBrand || "-",
        upiId: upiId || "-",
        date: order.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      message: "Transactions fetched successfully",
      transactions,
      total: transactions.length,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ success: false, message: "Error fetching transactions", error: error.message });
  }
});

module.exports = router;