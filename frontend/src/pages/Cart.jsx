import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, updateCart, removeFromCart } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [, setRefresh] = React.useState(0);

  // Listen for localStorage changes
  React.useEffect(() => {
    const handleCartUpdate = () => {
      setRefresh((prev) => prev + 1);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = appliedPromo ? Math.round(subtotal * 0.1) : 0; // 10% discount
  const deliveryFee = subtotal > 200 ? 0 : 40;
  const gst = Math.round((subtotal - discount) * 0.05);
  const total = subtotal - discount + deliveryFee + gst;

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'FOODIE10') {
      setAppliedPromo('FOODIE10');
    }
  };

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      updateCart(id, newQuantity);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart-premium">
        <div className="empty-cart-container">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="empty-cart-content"
          >
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add items to get started</p>
            <button
              onClick={() => navigate('/products')}
              className="empty-cart-btn"
            >
              Browse Menu
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const containerVariants = {
    initial: {},
    animate: {
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
  };

  return (
    <div className="cart-premium">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="cart-header"
        >
          <h1 className="cart-title">Your Order</h1>
          <p className="cart-subtitle">{cart.length} items in cart</p>
        </motion.div>

        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items-section">
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              className="cart-items"
            >
              {cart.map((item) => (
                <motion.div
                  key={item._id}
                  variants={itemVariants}
                  className="cart-item"
                >
                  <div className="item-image">
                    <img src={item.image} alt={item.name} />
                  </div>

                  <div className="item-details">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-restaurant">{item.restaurantName}</p>
                    <p className="item-price">₹{item.price}</p>
                  </div>

                  <div className="item-quantity">
                    <button
                      onClick={() =>
                        handleQuantityChange(item._id, item.quantity - 1)
                      }
                      className="qty-btn"
                    >
                      <MinusIcon className="w-4 h-4" />
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                      onClick={() =>
                        handleQuantityChange(item._id, item.quantity + 1)
                      }
                      className="qty-btn"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="item-total">
                    ₹{item.price * item.quantity}
                  </div>

                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="item-remove"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </motion.div>

            {/* Promo Code */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="promo-section"
            >
              <h3 className="promo-title">🎟️ Apply Promo Code</h3>
              <div className="promo-input-group">
                <input
                  type="text"
                  placeholder="Enter promo code (try FOODIE10)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="promo-input"
                  disabled={appliedPromo}
                />
                <button
                  onClick={handleApplyPromo}
                  disabled={appliedPromo}
                  className="promo-btn"
                >
                  {appliedPromo ? '✓ Applied' : 'Apply'}
                </button>
              </div>
              {appliedPromo && (
                <p className="promo-success">
                  ✓ Promo code applied! You saved ₹{discount}
                </p>
              )}
            </motion.div>
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="order-summary"
          >
            <h3 className="summary-title">Order Summary</h3>

            <div className="summary-items">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>

              {discount > 0 && (
                <div className="summary-row discount">
                  <span>Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}

              <div className="summary-row">
                <span>Delivery Fee</span>
                <span className={deliveryFee === 0 ? 'free' : ''}>
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </span>
              </div>

              <div className="summary-row">
                <span>GST (5%)</span>
                <span>₹{gst}</span>
              </div>

              <div className="summary-row total">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>

            <div className="summary-info">
              <p>✅ Safe & Secure Checkout</p>
              <p>🚚 Fast Delivery</p>
              <p>💳 Multiple Payment Options</p>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="checkout-btn"
            >
              Proceed to Checkout →
            </button>

            <button
              onClick={() => navigate('/products')}
              className="continue-shopping-btn"
            >
              Continue Shopping
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
