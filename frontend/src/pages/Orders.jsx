import { useEffect, useState } from "react";
import axios from "axios";
import { FaBox, FaTruck, FaClock, FaCheckCircle, FaTimesCircle, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import "../pages/Orders.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Order status color mapping
const statusColors = {
  Pending: "#FFD700",         // Yellow
  Preparing: "#FF8C00",       // Orange
  Ready: "#9B59B6",           // Purple
  "Out for Delivery": "#4169E1", // Blue
  Delivered: "#32CD32",       // Green
  Cancelled: "#FF0000",       // Red
  // Legacy labels for backward compat
  Placed: "#FFD700",
};

const statusIcons = {
  Pending: <FaClock />,
  Preparing: <FaBox />,
  Ready: <FaBox />,
  "Out for Delivery": <FaTruck />,
  Delivered: <FaCheckCircle />,
  Cancelled: <FaTimesCircle />,
  // Legacy
  Placed: <FaClock />,
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [reviewForms, setReviewForms] = useState({});
  const [submittingReview, setSubmittingReview] = useState(null);

  // Get user ID from the user object stored in localStorage
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = sessionStorage.getItem("token");
  const userId = user._id;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!userId) {
          console.log("❌ No user ID found in localStorage");
          setLoading(false);
          return;
        }

        console.log("📍 Fetching orders for userId:", userId);

        const res = await axios.get(`${API_URL}/api/orders/user/${userId}`);

        console.log("✅ Orders fetched:", res.data);

        if (res.data.success) {
          console.log("📦 Number of orders:", res.data.orders.length);
          setOrders(res.data.orders);
        } else {
          console.log("❌ Failed to fetch:", res.data.message);
        }
      } catch (err) {
        console.error("❌ Error fetching orders:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchOrders();
    }
  }, [userId]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    setCancelling(orderId);
    try {
      const res = await axios.put(
        `${API_URL}/api/orders/${orderId}/cancel`,
        { reason: "User cancelled the order" },
        {
          headers: {
            "user-id": userId,
          },
        }
      );

      if (res.data.success) {
        setOrders(orders.map(order =>
          order._id === orderId ? res.data.order : order
        ));
        alert("Order cancelled successfully!");
      }
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancelling(null);
    }
  };

  const handleReviewSubmit = async (orderId, reviewType) => {
    const formKey = `${orderId}_${reviewType}`;
    const reviewData = reviewForms[formKey];

    if (!reviewData || !reviewData.rating || !reviewData.comment) {
      alert("Please fill all fields");
      return;
    }

    setSubmittingReview(formKey);
    try {
      const order = orders.find(o => o._id === orderId);
      
      const submitData = {
        orderId,
        rating: parseInt(reviewData.rating),
        comment: reviewData.comment,
        experience: reviewData.experience,
        reviewType,
      };

      // Add required IDs based on review type
      if (reviewType === "Food" && reviewData.productId) {
        submitData.productId = reviewData.productId;
      }

      const res = await axios.post(
        `${API_URL}/api/reviews`,
        submitData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.message) {
        alert(res.data.message);
        setReviewForms(prev => {
          const updated = { ...prev };
          delete updated[formKey];
          return updated;
        });
        // Mark review as submitted
        setReviewingOrder(null);
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      alert(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(null);
    }
  };

  if (loading) {
    return (
      <div className="orders-container">
        <div className="orders-header">
          <h1>📦 My Orders</h1>
        </div>
        <div className="loading">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>📦 My Orders</h1>
        <p className="order-count">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <FaBox size={48} />
          <p>No orders yet</p>
          <small>Your food delivery orders will appear here</small>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              {/* Order Header */}
              <div className="order-header-row">
                <div className="order-id-section">
                  <span className="order-label">Order ID</span>
                  <span className="order-id">{order._id.slice(-8).toUpperCase()}</span>
                </div>

                <div className="order-status-section">
                  <div
                    className="status-badge"
                    style={{
                      backgroundColor: statusColors[order.orderStatus] || "#888",
                      color: order.orderStatus === "Pending" || order.orderStatus === "Placed" ? "#000" : "#fff"
                    }}
                  >
                    {statusIcons[order.orderStatus]}
                    <span>{order.orderStatus}</span>
                  </div>
                </div>

                <div className="order-date-section">
                  <span className="date-label">{new Date(order.orderDate).toLocaleDateString()}</span>
                  <span className="time-label">{new Date(order.orderDate).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Order Summary */}
              <div className="order-summary">
                <div className="summary-item">
                  <span className="label">Items:</span>
                  <span className="value">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                </div>

                <div className="summary-item">
                  <span className="label">Total:</span>
                  <span className="value amount">₹{order.total.toFixed(2)}</span>
                </div>

                <div className="summary-item">
                  <span className="label">Payment:</span>
                  <span className="value">{order.paymentMethod}</span>
                </div>

                <div className="summary-item">
                  <span className="label">Expected:</span>
                  <span className="value">
                    {order.estimatedDeliveryTime
                      ? new Date(order.estimatedDeliveryTime).toLocaleTimeString()
                      : "—"
                    }
                  </span>
                </div>
              </div>

              {/* Expandable Details */}
              <div className="order-details">
                <button
                  className="details-toggle"
                  onClick={() => setSelectedOrder(selectedOrder === order._id ? null : order._id)}
                >
                  {selectedOrder === order._id ? "Hide Details" : "View Details"}
                </button>

                {selectedOrder === order._id && (
                  <div className="details-expanded">
                    {/* Items */}
                    <div className="details-section">
                      <h4>🍔 Items Ordered</h4>
                      <div className="items-list">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="item-row">
                            <div className="item-info">
                              <span className="item-name">{item.name}</span>
                              <span className="item-qty">x{item.quantity}</span>
                            </div>
                            <span className="item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="details-section">
                      <h4>📍 Delivery Address</h4>
                      <div className="address-box">
                        <div className="address-line"><strong>{order.deliveryAddress.fullName}</strong></div>
                        <div className="address-line">
                          <FaMapMarkerAlt size={14} />
                          {order.deliveryAddress.addressLine}
                        </div>
                        <div className="address-line">
                          {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.pincode}
                        </div>
                        <div className="address-line">
                          <FaPhone size={14} />
                          {order.deliveryAddress.phone}
                        </div>
                      </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="details-section">
                      <h4>📅 Order Timeline</h4>
                      <div className="timeline">
                        <div className="timeline-item">
                          <div className="timeline-dot placed"></div>
                          <div>
                            <div className="timeline-label">Order Placed</div>
                            <div className="timeline-time">{new Date(order.orderDate).toLocaleString()}</div>
                          </div>
                        </div>

                        {order.orderStatus !== "Cancelled" && (
                          <>
                            <div className="timeline-item">
                              <div className={`timeline-dot ${["Pending", "Placed"].includes(order.orderStatus) ? "active" : order.orderStatus !== "Pending" && order.orderStatus !== "Placed" ? "done" : ""}`}></div>
                              <div>
                                <div className="timeline-label">Preparing</div>
                              </div>
                            </div>

                            <div className="timeline-item">
                              <div className={`timeline-dot ${order.orderStatus === "Ready" ? "active" : ["Out for Delivery", "Delivered"].includes(order.orderStatus) ? "done" : ""}`}></div>
                              <div>
                                <div className="timeline-label">Ready</div>
                              </div>
                            </div>

                            <div className="timeline-item">
                              <div className={`timeline-dot ${order.orderStatus === "Out for Delivery" ? "active" : order.orderStatus === "Delivered" ? "done" : ""}`}></div>
                              <div>
                                <div className="timeline-label">Out for Delivery</div>
                              </div>
                            </div>

                            <div className="timeline-item">
                              <div className={`timeline-dot ${order.orderStatus === "Delivered" ? "done" : ""}`}></div>
                              <div>
                                <div className="timeline-label">Delivered</div>
                                {order.deliveredAt && (
                                  <div className="timeline-time">{new Date(order.deliveredAt).toLocaleString()}</div>
                                )}
                              </div>
                            </div>
                          </>
                        )}

                        {order.orderStatus === "Cancelled" && (
                          <div className="timeline-item">
                            <div className="timeline-dot cancelled"></div>
                            <div>
                              <div className="timeline-label">Cancelled</div>
                              <div className="timeline-time">{order.cancellationReason}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Special Instructions */}
                    {order.specialInstructions && (
                      <div className="details-section">
                        <h4>📝 Special Instructions</h4>
                        <p className="special-instructions">{order.specialInstructions}</p>
                      </div>
                    )}

                    {/* Price Breakdown */}
                    <div className="details-section">
                      <h4>💰 Price Breakdown</h4>
                      <div className="price-breakdown">
                        <div className="breakdown-item">
                          <span>Subtotal</span>
                          <span>₹{order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="breakdown-item">
                          <span>Delivery Fee</span>
                          <span>₹{order.deliveryFee.toFixed(2)}</span>
                        </div>
                        <div className="breakdown-item">
                          <span>Tax</span>
                          <span>₹{order.tax.toFixed(2)}</span>
                        </div>
                        <div className="breakdown-item total">
                          <span>Total</span>
                          <span>₹{order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!["Delivered", "Cancelled"].includes(order.orderStatus) && (
                <div className="order-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancelOrder(order._id)}
                    disabled={cancelling === order._id}
                  >
                    {cancelling === order._id ? "Cancelling..." : "Cancel Order"}
                  </button>
                </div>
              )}

              {/* Review Form (Show only for Delivered orders) */}
              {order.orderStatus === "Delivered" && (
                <div className="review-section">
                  <h4>⭐ Rate Your Order</h4>
                  <div className="review-tabs">
                    <button
                      className={`review-tab ${reviewingOrder === `${order._id}_Food` ? "active" : ""}`}
                      onClick={() => setReviewingOrder(reviewingOrder === `${order._id}_Food` ? null : `${order._id}_Food`)}
                    >
                      🍔 Food Quality
                    </button>
                    <button
                      className={`review-tab ${reviewingOrder === `${order._id}_Restaurant` ? "active" : ""}`}
                      onClick={() => setReviewingOrder(reviewingOrder === `${order._id}_Restaurant` ? null : `${order._id}_Restaurant`)}
                    >
                      🏪 Restaurant
                    </button>
                    {order.riderId && (
                      <button
                        className={`review-tab ${reviewingOrder === `${order._id}_Rider` ? "active" : ""}`}
                        onClick={() => setReviewingOrder(reviewingOrder === `${order._id}_Rider` ? null : `${order._id}_Rider`)}
                      >
                        🚗 Delivery
                      </button>
                    )}
                  </div>

                  {reviewingOrder === `${order._id}_Food` && (
                    <div className="review-form-box">
                      <div className="form-group">
                        <label>How was the food quality?</label>
                        <select
                          value={reviewForms[`${order._id}_Food`]?.rating || ""}
                          onChange={(e) => setReviewForms(prev => ({
                            ...prev,
                            [`${order._id}_Food`]: { ...prev[`${order._id}_Food`], rating: e.target.value }
                          }))}
                        >
                          <option value="">Select rating...</option>
                          <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                          <option value="4">⭐⭐⭐⭐ Good</option>
                          <option value="3">⭐⭐⭐ Average</option>
                          <option value="2">⭐⭐ Poor</option>
                          <option value="1">⭐ Terrible</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>How would you describe your experience?</label>
                        <input
                          type="text"
                          placeholder="Fresh, Delicious, Hot, Cold, etc."
                          value={reviewForms[`${order._id}_Food`]?.experience || ""}
                          onChange={(e) => setReviewForms(prev => ({
                            ...prev,
                            [`${order._id}_Food`]: { ...prev[`${order._id}_Food`], experience: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Your feedback</label>
                        <textarea
                          placeholder="Tell us about your food..."
                          value={reviewForms[`${order._id}_Food`]?.comment || ""}
                          onChange={(e) => setReviewForms(prev => ({
                            ...prev,
                            [`${order._id}_Food`]: { ...prev[`${order._id}_Food`], comment: e.target.value }
                          }))}
                          rows="3"
                        />
                      </div>
                      <button
                        className="btn-submit-review"
                        onClick={() => handleReviewSubmit(order._id, "Food")}
                        disabled={submittingReview === `${order._id}_Food`}
                      >
                        {submittingReview === `${order._id}_Food` ? "Submitting..." : "Submit Food Review"}
                      </button>
                    </div>
                  )}

                  {reviewingOrder === `${order._id}_Restaurant` && (
                    <div className="review-form-box">
                      <div className="form-group">
                        <label>How would you rate the restaurant?</label>
                        <select
                          value={reviewForms[`${order._id}_Restaurant`]?.rating || ""}
                          onChange={(e) => setReviewForms(prev => ({
                            ...prev,
                            [`${order._id}_Restaurant`]: { ...prev[`${order._id}_Restaurant`], rating: e.target.value }
                          }))}
                        >
                          <option value="">Select rating...</option>
                          <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                          <option value="4">⭐⭐⭐⭐ Good</option>
                          <option value="3">⭐⭐⭐ Average</option>
                          <option value="2">⭐⭐ Poor</option>
                          <option value="1">⭐ Terrible</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Your experience</label>
                        <textarea
                          placeholder="Tell us about your restaurant experience..."
                          value={reviewForms[`${order._id}_Restaurant`]?.comment || ""}
                          onChange={(e) => setReviewForms(prev => ({
                            ...prev,
                            [`${order._id}_Restaurant`]: { ...prev[`${order._id}_Restaurant`], comment: e.target.value }
                          }))}
                          rows="3"
                        />
                      </div>
                      <button
                        className="btn-submit-review"
                        onClick={() => handleReviewSubmit(order._id, "Restaurant")}
                        disabled={submittingReview === `${order._id}_Restaurant`}
                      >
                        {submittingReview === `${order._id}_Restaurant` ? "Submitting..." : "Submit Restaurant Review"}
                      </button>
                    </div>
                  )}

                  {reviewingOrder === `${order._id}_Rider` && (
                    <div className="review-form-box">
                      <div className="form-group">
                        <label>How was the delivery experience?</label>
                        <select
                          value={reviewForms[`${order._id}_Rider`]?.rating || ""}
                          onChange={(e) => setReviewForms(prev => ({
                            ...prev,
                            [`${order._id}_Rider`]: { ...prev[`${order._id}_Rider`], rating: e.target.value }
                          }))}
                        >
                          <option value="">Select rating...</option>
                          <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                          <option value="4">⭐⭐⭐⭐ Good</option>
                          <option value="3">⭐⭐⭐ Average</option>
                          <option value="2">⭐⭐ Poor</option>
                          <option value="1">⭐ Terrible</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Describe the delivery</label>
                        <input
                          type="text"
                          placeholder="Fast, Professional, Polite, etc."
                          value={reviewForms[`${order._id}_Rider`]?.experience || ""}
                          onChange={(e) => setReviewForms(prev => ({
                            ...prev,
                            [`${order._id}_Rider`]: { ...prev[`${order._id}_Rider`], experience: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Your feedback</label>
                        <textarea
                          placeholder="Tell us about the rider's service..."
                          value={reviewForms[`${order._id}_Rider`]?.comment || ""}
                          onChange={(e) => setReviewForms(prev => ({
                            ...prev,
                            [`${order._id}_Rider`]: { ...prev[`${order._id}_Rider`], comment: e.target.value }
                          }))}
                          rows="3"
                        />
                      </div>
                      <button
                        className="btn-submit-review"
                        onClick={() => handleReviewSubmit(order._id, "Rider")}
                        disabled={submittingReview === `${order._id}_Rider`}
                      >
                        {submittingReview === `${order._id}_Rider` ? "Submitting..." : "Submit Delivery Review"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;