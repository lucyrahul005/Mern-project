import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Checkout.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Checkout() {
  const { cart, getTotal } = useCart();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Initialize address with user's saved details if available
  const [address, setAddress] = useState({
    fullName: user.name || "",
    phone: user.phone || "",
    addressLine: user.address?.addressLine || "",
    city: user.address?.city || "",
    state: user.address?.state || "",
    pincode: user.address?.pincode || "",
    country: "India",
  });

  const [specialInstructions, setSpecialInstructions] = useState("");

  const subtotal = getTotal();
  const deliveryFee = 40;
  const tax = subtotal * 0.1;
  const total = subtotal + tax + deliveryFee;

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    
    const fetchAddresses = async () => {
      try {
        setLoadingAddresses(true);
        // Refresh token from sessionStorage to ensure we have the latest
        const currentToken = sessionStorage.getItem("token");
        if (!currentToken) {
          navigate("/login");
          return;
        }
        
        const response = await axios.get(`${API_URL}/api/auth/my-addresses`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        setSavedAddresses(response.data || []);
      } catch (err) {
        if (err.response?.status === 401) {
          // Token expired or invalid
          localStorage.clear();
          navigate("/login");
        } else {
          console.log("Error fetching saved addresses:", err);
        }
        setSavedAddresses([]);
      } finally {
        setLoadingAddresses(false);
      }
    };
    
    fetchAddresses();
  }, [navigate]);

  const handleSelectSavedAddress = (savedAddr) => {
    setAddress({
      fullName: savedAddr.fullName || "",
      phone: savedAddr.phone || "",
      addressLine: savedAddr.addressLine || "",
      city: savedAddr.city || "",
      state: savedAddr.state || "",
      pincode: savedAddr.pincode || "",
      country: savedAddr.country || "India",
    });
  };

  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleOrder = async () => {
    // Validation
    if (!address.fullName || !address.phone || !address.addressLine || !address.city || !address.state || !address.pincode) {
      setError("Please fill all address fields");
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty");
      return;
    }

    if (!user._id) {
      setError("User not logged in. Please login again.");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Create order with user-id header
      const response = await axios.post(
        `${API_URL}/api/orders`,
        {
          items: cart.map((item) => ({
            productId: item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            restaurantId: item.restaurantId || item.restaurant?._id,
          })),
          subtotal,
          deliveryFee,
          tax,
          total,
          deliveryAddress: address,
          specialInstructions,
          paymentMethod: "COD",
        },
        {
          headers: {
            "user-id": user._id,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        // Store order details and redirect to payment
        const orderId = response.data.order._id;
        sessionStorage.setItem("currentOrderId", orderId);
        sessionStorage.setItem("orderDetails", JSON.stringify({
          orderId,
          total,
          items: cart.length,
        }));

        // Dispatch event to refresh notifications
        window.dispatchEvent(new Event("orderPlaced"));

        navigate(`/payment/${orderId}`, {
          state: {
            orderId,
            total,
            items: cart.length,
          },
        });
      } else {
        setError(response.data.message || "Failed to create order");
      }
    } catch (err) {
      console.error("Order creation error:", err);
      
      let errorMessage = "Failed to create order. Please try again.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message === "Network Error") {
        errorMessage = "Network error. Please check if backend is running on port 5001.";
      } else if (err.code === "ERR_NETWORK") {
        errorMessage = "Cannot connect to server. Is the backend running?";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-wrapper">
      <div className="checkout-container">
        {/* LEFT - ADDRESS */}
        <div className="checkout-card">
          <h2 className="checkout-heading">🚚 Delivery Details</h2>

          {error && <p className="checkout-error">{error}</p>}

          {/* SAVED ADDRESSES SECTION */}
          {savedAddresses.length > 0 && (
            <div className="saved-addresses-section">
              <h3 className="saved-addresses-title">📍 Your Saved Addresses</h3>
              <div className="saved-addresses-list">
                {savedAddresses.map((addr, index) => (
                  <button
                    key={index}
                    className="saved-address-btn"
                    onClick={() => handleSelectSavedAddress(addr)}
                    type="button"
                  >
                    <div className="saved-address-content">
                      <strong>{addr.fullName}</strong>
                      <p>{addr.addressLine}</p>
                      <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                    </div>
                  </button>
                ))}
              </div>
              <hr className="address-divider" />
              <p className="or-text">Or Enter New Address Below</p>
            </div>
          )}

          <input
            name="fullName"
            placeholder="Full Name *"
            value={address.fullName}
            onChange={handleChange}
            className="checkout-input"
          />
          <input
            name="phone"
            placeholder="Phone Number *"
            value={address.phone}
            onChange={handleChange}
            className="checkout-input"
          />
          <input
            name="addressLine"
            placeholder="Street Address *"
            value={address.addressLine}
            onChange={handleChange}
            className="checkout-input"
          />
          <input
            name="city"
            placeholder="City *"
            value={address.city}
            onChange={handleChange}
            className="checkout-input"
          />
          <input
            name="state"
            placeholder="State *"
            value={address.state}
            onChange={handleChange}
            className="checkout-input"
          />
          <input
            name="pincode"
            placeholder="Pincode *"
            value={address.pincode}
            onChange={handleChange}
            className="checkout-input"
          />

          <textarea
            placeholder="Special Instructions (e.g., Extra spice, no onions, etc.)"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="checkout-textarea"
          />
        </div>

        {/* RIGHT - SUMMARY */}
        <div className="checkout-summary">
          <h2 className="checkout-heading">🧾 Order Summary</h2>

          <div className="checkout-summary-box">
            <p>Subtotal: ₹ {subtotal.toFixed(2)}</p>
            <p>Delivery Fee: ₹ {deliveryFee.toFixed(2)}</p>
            <p>Tax (10%): ₹ {tax.toFixed(2)}</p>
            <hr className="checkout-divider" />
            <h3>Total: ₹ {total.toFixed(2)}</h3>
          </div>

          <button onClick={handleOrder} className="checkout-button" disabled={loading}>
            {loading ? "Processing..." : "Proceed to Payment 💳"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {};

export default Checkout;