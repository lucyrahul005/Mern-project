import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";

const API_URL = "http://localhost:5001";

// Helper function to get CSS variable values
const getCSSVar = (varName) => {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
};

function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  
  // Personal Info
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  // Order History
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // Wishlist
  const [wishlist, setWishlist] = useState([]);
  
  // Reviews
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ productId: "", rating: 5, comment: "" });
  
  // Notifications
  const [notifications, setNotifications] = useState([]);

  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const token = sessionStorage.getItem("token");

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");

    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    setUser(JSON.parse(storedUser));
    fetchAddresses();
    fetchOrders();
    fetchWishlist();
    fetchReviews();
    fetchNotifications();

    // Listen for order placement events to refresh notifications
    const handleOrderPlaced = () => {
      console.log("📢 Order placed event detected - refreshing notifications");
      fetchNotifications();
      fetchOrders();
    };

    // Listen for order status changes from rider
    const handleOrderStatusChanged = () => {
      console.log("🚗 Order status changed - refreshing notifications");
      fetchNotifications();
      fetchOrders();
    };

    window.addEventListener("orderPlaced", handleOrderPlaced);
    window.addEventListener("orderStatusChanged", handleOrderStatusChanged);
    
    // Auto-refresh notifications every 5 seconds (increased frequency for real-time updates)
    const notificationInterval = setInterval(() => {
      fetchNotifications(); // Always refresh, don't wait for activeTab
    }, 5000);

    return () => {
      window.removeEventListener("orderPlaced", handleOrderPlaced);
      window.removeEventListener("orderStatusChanged", handleOrderStatusChanged);
      clearInterval(notificationInterval);
    };
  }, [activeTab, token, navigate]);

  const fetchAddresses = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/my-addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(res.data);
    } catch (err) {
      console.log("Error fetching addresses:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const token = sessionStorage.getItem("token");
      const user = JSON.parse(sessionStorage.getItem("user"));
      const res = await axios.get(`${API_URL}/api/orders/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.orders || []);
    } catch (err) {
      console.log("Error fetching orders:", err);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      // Get wishlist from localStorage (CartContext stores it there)
      const savedWishlist = localStorage.getItem("wishlist");
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      } else {
        setWishlist([]);
      }
    } catch (err) {
      console.log("Error fetching wishlist:", err);
      setWishlist([]);
    }
  };

  const fetchReviews = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/reviews/my-reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formattedReviews = res.data.reviews.map(review => ({
        id: review._id,
        type: review.reviewType || "Food",
        product: review.productId?.name || review.restaurantId?.name || "Order",
        rating: review.rating,
        comment: review.comment,
        experience: review.experience,
        date: new Date(review.createdAt).toLocaleDateString(),
        time: new Date(review.createdAt).toLocaleTimeString("en-IN"),
      }));
      setReviews(formattedReviews);
    } catch (err) {
      console.log("Error fetching reviews:", err);
      setReviews([]);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const user = JSON.parse(sessionStorage.getItem("user"));
      console.log("🔔 Fetching notifications for user:", user._id);
      const res = await axios.get(`${API_URL}/api/notifications/${user._id}`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "user-id": user._id,
        },
      });
      console.log("✅ Notifications fetched:", res.data.notifications.length, "notifications");
      const formattedNotifications = res.data.notifications.map(notif => ({
        id: notif._id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        date: new Date(notif.createdAt).toLocaleDateString(),
        time: new Date(notif.createdAt).toLocaleTimeString("en-IN"),
        read: notif.isRead,
      }));
      setNotifications(formattedNotifications);
    } catch (err) {
      console.log("❌ Error fetching notifications:", err);
      setNotifications([]);
    }
  };

  const handleAddAddress = async () => {
    if (Object.values(newAddress).some((v) => !v || v.trim() === "")) {
      alert("Fill all fields");
      return;
    }

    try {
      await axios.post(`${API_URL}/api/auth/add-address`, newAddress, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowAddressForm(false);
      setNewAddress({
        fullName: "",
        phone: "",
        addressLine: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
      });

      fetchAddresses();
      alert("✅ Address added successfully!");
    } catch (err) {
      console.log(err);
      alert("❌ Error adding address");
    }
  };

  const handleDeleteAddress = async (index) => {
    if (window.confirm("Delete this address?")) {
      try {
        await axios.delete(`${API_URL}/api/auth/address/${index}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchAddresses();
        alert("✅ Address deleted!");
      } catch (err) {
        console.log(err);
        alert("❌ Error deleting address");
      }
    }
  };

  const handleAddReview = async () => {
    if (!newReview.productId || !newReview.comment) {
      alert("Please select a product and write a comment");
      return;
    }

    try {
      // Find the order that contains this product
      const order = orders.find(o => 
        o.items.some(item => item.productId === newReview.productId)
      );

      if (!order) {
        alert("❌ Order not found for this product");
        return;
      }

      const reviewData = {
        productId: newReview.productId,
        orderId: order._id,
        rating: newReview.rating,
        comment: newReview.comment,
      };

      await axios.post(`${API_URL}/api/reviews`, reviewData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowReviewForm(false);
      setNewReview({ productId: "", rating: 5, comment: "" });
      fetchReviews();
      alert("✅ Review posted successfully!");
    } catch (err) {
      console.log(err);
      alert("❌ Error posting review: " + (err.response?.data?.message || err.message));
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (!user) return null;

  // Get theme colors dynamically
  const bg = getCSSVar("--bg") || "#ffffff";
  const text = getCSSVar("--text") || "#111111";
  const card = getCSSVar("--card") || "#f5f5f5";
  const border = getCSSVar("--border") || "#e0e0e0";
  const accentColor = getCSSVar("--accent") || "#ff7a00";

  return (
    <div style={{ ...styles.wrapper, background: bg, color: text }}>
      <div style={styles.container}>
        {/* PROFILE HEADER */}
        <div style={{ ...styles.profileCard, background: card, borderColor: border }}>
          <div style={styles.profileContent}>
            <div>
              <h1 style={{ ...styles.profileName, color: text }}>👤 {user.name}</h1>
              <p style={{ ...styles.profileEmail, color: text, opacity: 0.7 }}>{user.email}</p>
            </div>
            <button style={styles.logoutBtn} onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>

        {/* TABS */}
        <div style={{ ...styles.tabsContainer, background: card, borderColor: border }}>
          {[
            { id: "personal", label: "👤 Personal Info", icon: "📋" },
            { id: "orders", label: "📦 Orders", icon: "🛒" },
            { id: "wishlist", label: "❤️ Wishlist", icon: "💝" },
            { id: "reviews", label: "⭐ Reviews", icon: "💬" },
            { id: "notifications", label: "🔔 Notifications", icon: "📣" },
          ].map((tab) => (
            <button
              key={tab.id}
              style={{
                ...styles.tabBtn,
                borderBottom: activeTab === tab.id ? `3px solid ${accentColor}` : "none",
                color: activeTab === tab.id ? accentColor : text,
                opacity: activeTab === tab.id ? 1 : 0.7,
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT SECTIONS */}

        {/* PERSONAL INFORMATION */}
        {activeTab === "personal" && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📋 Personal Information</h2>
            
            <div style={styles.infoCard}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Name:</span>
                <span style={styles.infoValue}>{user.name}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Email:</span>
                <span style={styles.infoValue}>{user.email}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Member Since:</span>
                <span style={styles.infoValue}>2024</span>
              </div>
            </div>

            {/* SAVED ADDRESSES */}
            <div style={{ marginTop: "40px" }}>
              <div style={styles.addressHeader}>
                <h3 style={styles.sectionSubtitle}>📍 Saved Addresses</h3>
                <button
                  style={styles.primaryBtn}
                  onClick={() => setShowAddressForm(!showAddressForm)}
                >
                  {showAddressForm ? "✕ Cancel" : "+ Add Address"}
                </button>
              </div>

              {showAddressForm && (
                <div style={styles.formCard}>
                  <input
                    placeholder="Full Name"
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    style={styles.input}
                  />
                  <input
                    placeholder="Phone"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    style={styles.input}
                  />
                  <input
                    placeholder="Address Line"
                    value={newAddress.addressLine}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine: e.target.value })}
                    style={styles.input}
                  />
                  <input
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    style={styles.input}
                  />
                  <input
                    placeholder="State"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    style={styles.input}
                  />
                  <input
                    placeholder="Pincode"
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                    style={styles.input}
                  />
                  <button style={styles.primaryBtn} onClick={handleAddAddress}>
                    Save Address
                  </button>
                </div>
              )}

              <div style={styles.addressGrid}>
                {addresses.length === 0 ? (
                  <p style={styles.emptyState}>No saved addresses yet. Add one now!</p>
                ) : (
                  addresses.map((addr, index) => (
                    <div key={index} style={styles.addressCard}>
                      <h4 style={{color: "var(--text)"}}>
{addr.fullName}</h4>
                      <p style={{color: "var(--text)", opacity: 0.8}}>{addr.addressLine}</p>
                      <p style={{color: "var(--text)", opacity: 0.8}}>{addr.city}, {addr.state} - {addr.pincode}</p>
                      <p style={{color: "var(--text)", opacity: 0.8}}>📞 {addr.phone}</p>
                      <button 
                        style={{...styles.secondaryBtn, marginTop: "10px"}}
                        onClick={() => handleDeleteAddress(index)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ORDER HISTORY */}
        {activeTab === "orders" && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📦 Order History</h2>
            
            {loadingOrders ? (
              <p style={styles.emptyState}>Loading orders...</p>
            ) : orders.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No orders yet</p>
                <button style={styles.primaryBtn} onClick={() => navigate("/")}>
                  🍔 Browse Menu
                </button>
              </div>
            ) : (
              <div style={styles.ordersGrid}>
                {orders.map((order) => (
                  <div key={order._id} style={styles.orderCard}>
                    <div style={styles.orderHeader}>
                      <h3>Order #{order._id.slice(-6)}</h3>
                      <span style={{
                        ...styles.badge,
                        background: order.orderStatus === "Delivered" ? "#4caf50" : "#ff9800"
                      }}>
                        {order.orderStatus}
                      </span>
                    </div>
                    <p style={styles.orderDate}>📅 {new Date(order.createdAt).toLocaleDateString()}</p>
                    <p style={styles.orderAmount}>💰 ₹{order.total}</p>
                    <p style={styles.orderItems}>📦 {order.items?.length || 0} items</p>
                    <button 
                      style={styles.secondaryBtn}
                      onClick={() => navigate(`/orders`)}
                    >
                      View Details →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WISHLIST */}
        {activeTab === "wishlist" && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>❤️ Wishlist</h2>
            
            {wishlist.length === 0 ? (
              <div style={styles.emptyState}>
                <p>Your wishlist is empty</p>
                <button style={styles.primaryBtn} onClick={() => navigate("/")}>
                  💝 Continue Shopping
                </button>
              </div>
            ) : (
              <div style={styles.wishlistGrid}>
                {wishlist.map((item) => (
                  <div key={item._id} style={styles.wishlistCard}>
                    {item.image && (
                      <img src={item.image} alt={item.name} style={styles.wishlistImage} />
                    )}
                    <h4>{item.name}</h4>
                    <p style={styles.price}>₹{item.price}</p>
                    <button style={styles.primaryBtn}>Add to Cart</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS */}
        {activeTab === "reviews" && (
          <div style={styles.section}>
            <div style={styles.reviewsHeader}>
              <h2 style={styles.sectionTitle}>⭐ My Reviews</h2>
              <button 
                style={styles.primaryBtn}
                onClick={() => setShowReviewForm(!showReviewForm)}
              >
                {showReviewForm ? "✕ Cancel" : "✍️ Write Review"}
              </button>
            </div>

            {showReviewForm && (
              <div style={styles.formCard}>
                <select
                  value={newReview.productId}
                  onChange={(e) => setNewReview({ ...newReview, productId: e.target.value })}
                  style={styles.input}
                >
                  <option value="">Select a delivered product to review</option>
                  {orders.filter(o => o.orderStatus === "Delivered").map(order =>
                    order.items?.map(item => (
                      <option key={item.productId} value={item.productId}>
                        {item.name}
                      </option>
                    ))
                  )}
                </select>
                <textarea
                  placeholder="Share your experience..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  style={{...styles.input, minHeight: "120px"}}
                />
                <div style={styles.ratingSelector}>
                  <label>Rating: </label>
                  <select
                    value={newReview.rating}
                    onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                    style={styles.input}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                    <option value="4">⭐⭐⭐⭐ Good</option>
                    <option value="3">⭐⭐⭐ Average</option>
                    <option value="2">⭐⭐ Poor</option>
                    <option value="1">⭐ Very Poor</option>
                  </select>
                </div>
                <button style={styles.primaryBtn} onClick={handleAddReview}>Post Review</button>
              </div>
            )}

            <div style={styles.reviewsGrid}>
              {reviews.length === 0 ? (
                <p style={styles.emptyState}>No reviews yet. Share your thoughts!</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} style={styles.reviewCard}>
                    <div style={styles.reviewHeader}>
                      <div>
                        <h4>{review.product}</h4>
                        <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
                          {review.type === 'Food' && '🍔 Food Review'}
                          {review.type === 'Restaurant' && '🏪 Restaurant Review'}
                          {review.type === 'Rider' && '🚗 Delivery Review'}
                        </small>
                      </div>
                      <span style={styles.rating}>{"⭐".repeat(review.rating)}</span>
                    </div>
                    {review.experience && (
                      <p style={{fontSize: '14px', color: '#666', marginBottom: '8px'}}>
                        <strong>Experience:</strong> {review.experience}
                      </p>
                    )}
                    <p style={styles.reviewComment}>{review.comment}</p>
                    <p style={styles.reviewDate}>📅 {review.date} {review.time}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div style={styles.section}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={styles.sectionTitle}>🔔 Notifications</h2>
              <button 
                style={styles.primaryBtn}
                onClick={fetchNotifications}
              >
                🔄 Refresh
              </button>
            </div>
            
            <div style={styles.notificationsGrid}>
              {notifications.length === 0 ? (
                <p style={styles.emptyState}>No notifications</p>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    style={{
                      ...styles.notificationCard,
                      opacity: notif.read ? 0.6 : 1,
                      borderLeft: `4px solid ${notif.read ? '#ccc' : '#ff7a00'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--text)' }}>{notif.title}</h4>
                        <p style={{ margin: '8px 0', color: 'var(--text)', opacity: 0.9, fontSize: '14px' }}>{notif.message}</p>
                      </div>
                      {!notif.read && <span style={styles.newBadge}>NEW</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', opacity: 0.7 }}>
                      <span>📅 {notif.date}</span>
                      <span>🕐 {notif.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "var(--bg)",
    padding: "120px 4% 40px",
    color: "var(--text)",
    transition: "background 0.3s ease, color 0.3s ease",
  },
  container: {
    maxWidth: "1200px",
    margin: "auto",
  },
  profileCard: {
    background: "var(--card)",
    padding: "30px 40px",
    borderRadius: "16px",
    marginBottom: "40px",
    border: "1px solid var(--border)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    transition: "background 0.3s ease, border-color 0.3s ease",
  },
  profileContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileName: {
    fontSize: "32px",
    margin: 0,
    marginBottom: "8px",
    color: "var(--text)",
    transition: "color 0.3s ease",
  },
  profileEmail: {
    fontSize: "14px",
    color: "var(--text)",
    opacity: 0.7,
    margin: 0,
    transition: "color 0.3s ease",
  },
  logoutBtn: {
    padding: "10px 20px",
    background: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  tabsContainer: {
    display: "flex",
    gap: "0",
    marginBottom: "30px",
    borderBottom: "1px solid var(--border)",
    overflowX: "auto",
    background: "var(--card)",
    borderRadius: "8px",
    transition: "background 0.3s ease, border-color 0.3s ease",
  },
  tabBtn: {
    padding: "15px 25px",
    background: "transparent",
    border: "none",
    color: "var(--text)",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
    borderBottom: "3px solid transparent",
    opacity: 0.7,
  },
  section: {
    animation: "fadeIn 0.3s ease",
  },
  sectionTitle: {
    fontSize: "24px",
    marginBottom: "25px",
    borderBottom: "2px solid var(--accent)",
    paddingBottom: "10px",
    color: "var(--text)",
    transition: "all 0.3s ease",
  },
  sectionSubtitle: {
    fontSize: "18px",
    marginBottom: "15px",
    color: "var(--text)",
    transition: "color 0.3s ease",
  },
  infoCard: {
    background: "var(--card)",
    padding: "25px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    transition: "background 0.3s ease, border-color 0.3s ease",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid var(--border)",
    color: "var(--text)",
    transition: "all 0.3s ease",
  },
  infoLabel: {
    fontWeight: "600",
    color: "var(--accent)",
    transition: "color 0.3s ease",
  },
  infoValue: {
    color: "var(--text)",
    transition: "color 0.3s ease",
  },
  addressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  addressGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
  addressCard: {
    background: "var(--card)",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    lineHeight: "1.6",
    color: "var(--text)",
    transition: "all 0.3s ease",
  },
  formCard: {
    background: "var(--card)",
    padding: "25px",
    borderRadius: "12px",
    marginBottom: "25px",
    border: "1px solid var(--border)",
    transition: "all 0.3s ease",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    fontSize: "14px",
    transition: "all 0.3s ease",
  },
  ordersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  orderCard: {
    background: "var(--card)",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    color: "var(--text)",
    transition: "all 0.3s ease",
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },
  badge: {
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold",
    color: "white",
  },
  orderDate: {
    color: "var(--text)",
    opacity: 0.7,
    fontSize: "13px",
    transition: "all 0.3s ease",
  },
  orderAmount: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "var(--accent)",
    margin: "10px 0",
    transition: "color 0.3s ease",
  },
  orderItems: {
    color: "var(--text)",
    opacity: 0.7,
    fontSize: "13px",
    transition: "all 0.3s ease",
  },
  wishlistGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "20px",
  },
  wishlistCard: {
    background: "var(--card)",
    padding: "15px",
    borderRadius: "12px",
    textAlign: "center",
    border: "1px solid var(--border)",
    color: "var(--text)",
    transition: "all 0.3s ease",
  },
  wishlistImage: {
    width: "100%",
    height: "180px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "10px",
  },
  price: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "var(--accent)",
    margin: "10px 0",
    transition: "color 0.3s ease",
  },
  reviewsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  reviewsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  reviewCard: {
    background: "var(--card)",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    color: "var(--text)",
    transition: "all 0.3s ease",
  },
  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  rating: {
    fontSize: "14px",
  },
  reviewComment: {
    color: "var(--text)",
    opacity: 0.8,
    lineHeight: "1.6",
    marginBottom: "10px",
    transition: "all 0.3s ease",
  },
  reviewDate: {
    fontSize: "12px",
    color: "var(--text)",
    opacity: 0.6,
    transition: "all 0.3s ease",
  },
  notificationsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "15px",
  },
  notificationCard: {
    background: "var(--card)",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    position: "relative",
    color: "var(--text)",
    transition: "all 0.3s ease",
  },
  primaryBtn: {
    padding: "10px 20px",
    background: "var(--accent)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.3s ease",
  },
  secondaryBtn: {
    padding: "10px 20px",
    background: "transparent",
    border: "1px solid var(--accent)",
    color: "var(--accent)",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.3s ease",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "var(--text)",
    opacity: 0.6,
    fontSize: "18px",
    transition: "all 0.3s ease",
  },
  newBadge: {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "var(--accent)",
    color: "white",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  notificationDate: {
    fontSize: "12px",
    color: "var(--text)",
    opacity: 0.7,
    marginTop: "10px",
    transition: "all 0.3s ease",
  },
};

export default Account;
