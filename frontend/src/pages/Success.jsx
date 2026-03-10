import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import "./Success.css";

function Success() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const { theme } = useTheme();
  const [orderDetails] = useState(location.state || {});

  useEffect(() => {
    // Clear cart after successful payment
    clearCart();
  }, []);

  return (
    <div className="success-wrapper">
      <div className="success-card">
        <div className="success-animation">
          <div className="success-checkmark">✓</div>
        </div>

        <h1>🎉 Order Confirmed!</h1>
        <p className="success-subtitle">
          Your payment was successful and your order is now being processed.
        </p>

        {orderDetails.orderId && (
          <div className="success-details-box">
            <div className="success-detail-row">
              <span>Order ID:</span>
              <strong>{orderDetails.orderId.slice(-8).toUpperCase()}</strong>
            </div>
            <div className="success-detail-row">
              <span>Total Amount:</span>
              <strong className="success-amount">
                ₹ {orderDetails.total?.toFixed(2) || "0.00"}
              </strong>
            </div>
            {orderDetails.paymentMethod && (
              <div className="success-detail-row">
                <span>Payment Method:</span>
                <strong className="success-success">{orderDetails.paymentMethod}</strong>
              </div>
            )}
          </div>
        )}

        <div className="success-message-box">
          <p>📍 You will receive your order within 45 minutes</p>
          <p>📧 A confirmation email has been sent to your registered email</p>
          <p>📱 You can track your order in real-time</p>
        </div>

        <div className="success-button-row">
          <button className="success-primary" onClick={() => navigate("/orders")}>
            📦 View My Orders
          </button>

          <button
            className="success-secondary"
            onClick={() => navigate("/")}
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {};

export default Success;
