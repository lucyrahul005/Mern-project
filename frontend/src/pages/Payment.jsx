import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import "./Payment.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PAYMENT_METHODS = [
  {
    id: "cod",
    name: "💵 Cash on Delivery",
    description: "Pay when order arrives",
    icon: "💵",
    status: "Pending",
  },
  {
    id: "upi",
    name: "📱 UPI Payment",
    description: "Pay using any UPI app",
    icon: "📱",
    status: "Completed",
  },
  {
    id: "debit",
    name: "🏧 Debit Card",
    description: "Fast & Secure",
    icon: "🏧",
    status: "Completed",
  },
  {
    id: "credit",
    name: "💳 Credit Card",
    description: "Fast & Secure",
    icon: "💳",
    status: "Completed",
  },
  {
    id: "netbanking",
    name: "🏦 Net Banking",
    description: "Direct bank transfer",
    icon: "🏦",
    status: "Completed",
  },
];

function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = sessionStorage.getItem("token");

  const [order, setOrder] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Card payment details
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardholderName: "",
  });
  const [upiId, setUpiId] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");

  useEffect(() => {
    if (!token) navigate("/login");
    fetchOrderDetails();
  }, [orderId, token]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError("");
      
      if (!user._id) {
        setError("User session lost. Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      const response = await axios.get(`${API_URL}/api/orders/${orderId}`, {
        headers: {
          "user-id": user._id,
        },
      });

      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        setError(response.data.message || "Failed to load order details");
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      let errorMsg = "Failed to load order details";
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.code === "ERR_NETWORK") {
        errorMsg = "Cannot connect to server. Is the backend running?";
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Extract last 4 digits from card number
  const getCardLast4 = (cardNum) => {
    const cleaned = cardNum.replace(/\s+/g, "");
    return cleaned.slice(-4);
  };

  // Detect card brand
  const getCardBrand = (cardNum) => {
    const cleaned = cardNum.replace(/\s+/g, "");
    if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(cleaned)) return "Visa";
    if (/^5[1-5][0-9]{14}$/.test(cleaned)) return "Mastercard";
    if (/^3[47][0-9]{13}$/.test(cleaned)) return "Amex";
    return "Card";
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePayment = async (method) => {
    if (!selectedMethod) {
      setError("Please select a payment method");
      return;
    }

    if (!user._id) {
      setError("User session lost. Please login again.");
      navigate("/login");
      return;
    }

    // Validate card for card payments
    if ((selectedMethod === "debit" || selectedMethod === "credit") && !cardDetails.cardNumber) {
      setError("Please enter card details");
      return;
    }

    // Validate UPI ID for UPI payments
    if (selectedMethod === "upi" && !upiId) {
      setError("Please enter UPI ID");
      return;
    }

    try {
      setProcessingPayment(true);
      setError("");

      // Find the payment status based on method
      const paymentData = PAYMENT_METHODS.find((m) => m.id === selectedMethod);
      const paymentStatus = paymentData.status;
      const paymentMethodName =
        selectedMethod === "cod"
          ? "COD"
          : selectedMethod === "upi"
          ? "UPI"
          : selectedMethod === "debit"
          ? "Card"
          : selectedMethod === "credit"
          ? "Card"
          : "NetBanking";

      // Prepare transaction details for card and UPI payments
      let transactionDetails = null;
      if (selectedMethod === "debit" || selectedMethod === "credit") {
        transactionDetails = {
          cardLast4: getCardLast4(cardDetails.cardNumber),
          cardBrand: getCardBrand(cardDetails.cardNumber),
          cardholderName: cardDetails.cardholderName,
          gatewayResponse: {
            method: selectedMethod,
            processedAt: new Date().toISOString(),
          },
        };
      } else if (selectedMethod === "upi") {
        transactionDetails = {
          cardLast4: null,
          cardBrand: null,
          cardholderName: null,
          gatewayResponse: {
            upiId: upiId,
            method: "upi",
            processedAt: new Date().toISOString(),
          },
        };
      }

      // Update order with payment details
      const response = await axios.put(
        `${API_URL}/api/orders/${orderId}/payment`,
        {
          paymentMethod: paymentMethodName,
          paymentStatus: paymentStatus,
          transactionDetails: transactionDetails,
        },
        {
          headers: {
            "user-id": user._id,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        // Simulate payment processing delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Clear cart and order details
        sessionStorage.removeItem("currentOrderId");
        sessionStorage.removeItem("orderDetails");

        // Dispatch event to refresh notifications and earnings
        window.dispatchEvent(new Event("paymentCompleted"));
        console.log("✅ Payment completed - event dispatched");

        navigate("/success", {
          state: {
            orderId: response.data.order._id,
            total: response.data.order.total,
            paymentMethod: paymentMethodName,
          },
        });
      } else {
        setError(response.data.message || "Payment failed. Please try again.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      
      let errorMsg = "Payment processing failed. Please try again.";
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.code === "ERR_NETWORK") {
        errorMsg = "Cannot connect to server. Is the backend running?";
      }
      
      setError(errorMsg);
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="payment-wrapper">
        <div className="payment-center">
          <h2>Loading order details...</h2>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="payment-wrapper">
        <div className="payment-center">
          <h2>Order not found</h2>
          <button
            onClick={() => navigate("/cart")}
            className="payment-back-button"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-wrapper">
      <div className="payment-container">
        <div className="payment-header">
          <h1>💳 Complete Payment</h1>
          <p>Order ID: {orderId.slice(-8)}</p>
        </div>

        {/* ORDER SUMMARY */}
        <div className="payment-summary-card">
          <h2>Order Summary</h2>
          <div className="payment-summary-row">
            <span>Amount:</span>
            <span className="payment-amount">₹ {order.total?.toFixed(2)}</span>
          </div>
          <div className="payment-summary-row">
            <span>Items:</span>
            <span>{order.items?.length} items</span>
          </div>
          <div className="payment-summary-row">
            <span>Status:</span>
            <span className="payment-status-badge">{order.orderStatus}</span>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && <div className="payment-error-box">{error}</div>}

        {/* PAYMENT METHODS */}
        <div className="payment-methods-container">
          <h2>Select Payment Method</h2>
          <div className="payment-methods-grid">
            {PAYMENT_METHODS.map((method) => (
              <div
                key={method.id}
                className={`payment-method-card ${selectedMethod === method.id ? "payment-method-card-selected" : ""}`}
                onClick={() => setSelectedMethod(method.id)}
              >
                <div className="payment-method-icon">{method.icon}</div>
                <h3 className="payment-method-name">{method.name}</h3>
                <p className="payment-method-desc">{method.description}</p>
                {method.id !== "cod" && (
                  <span className="payment-success-badge">✓ Instant</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* PAYMENT DETAILS */}
        {selectedMethod && (
          <div className="payment-details-card">
            <h3>Payment Details</h3>
            {selectedMethod === "cod" && (
              <div className="payment-details">
                <p>💵 Payment Method: <strong>Cash on Delivery</strong></p>
                <p>📍 You will pay when your order is delivered</p>
                <p>⚠️ Payment Status: <strong>Pending</strong></p>
              </div>
            )}
            {selectedMethod === "upi" && (
              <div className="payment-details">
                <p>📱 UPI ID: <input 
                  type="text" 
                  placeholder="Enter UPI ID (e.g., user@bank)" 
                  className="payment-small-input"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                /></p>
                <p>✓ This payment method is secure</p>
              </div>
            )}
            {(selectedMethod === "debit" || selectedMethod === "credit") && (
              <div className="payment-details">
                <p>💳 Card Number: <input 
                  type="text" 
                  placeholder="1234 5678 9012 3456" 
                  className="payment-small-input"
                  name="cardNumber"
                  value={cardDetails.cardNumber}
                  onChange={handleCardInputChange}
                  maxLength="19"
                /></p>
                <div className="payment-card-row">
                  <p>Expiry: <input 
                    type="text" 
                    placeholder="MM/YY" 
                    className="payment-small-input"
                    name="expiry"
                    value={cardDetails.expiry}
                    onChange={handleCardInputChange}
                    maxLength="5"
                  /></p>
                  <p>CVV: <input 
                    type="password" 
                    placeholder="123" 
                    className="payment-small-input"
                    name="cvv"
                    value={cardDetails.cvv}
                    onChange={handleCardInputChange}
                    maxLength="4"
                  /></p>
                </div>
                <p>Name: <input 
                  type="text" 
                  placeholder="Card Holder Name" 
                  className="payment-small-input"
                  name="cardholderName"
                  value={cardDetails.cardholderName}
                  onChange={handleCardInputChange}
                /></p>
              </div>
            )}
            {selectedMethod === "netbanking" && (
              <div className="payment-details">
                <p>🏦 Select Your Bank:</p>
                <select 
                  className="payment-small-input"
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                >
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>SBI Bank</option>
                  <option>Other Banks</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* BUTTONS */}
        <div className="payment-button-row">
          <button
            onClick={() => navigate("/checkout")}
            className="payment-cancel-button"
            disabled={processingPayment}
          >
            Back to Checkout
          </button>
          <button
            onClick={() => handlePayment(selectedMethod)}
            className="payment-pay-button"
            style={{
              opacity: selectedMethod ? 1 : 0.5,
              cursor: selectedMethod ? "pointer" : "not-allowed",
            }}
            disabled={!selectedMethod || processingPayment}
          >
            {processingPayment ? "Processing..." : `Pay ₹ ${order.total?.toFixed(2)}`}
          </button>
        </div>

        {/* INFO */}
        <div className="payment-info-box">
          <p>🔒 Your payment information is secure and encrypted</p>
          <p>📱 You will receive an OTP for verification</p>
        </div>
      </div>
    </div>
  );
}

const styles = {};

export default Payment;
