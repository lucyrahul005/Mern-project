import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "../config/api";
import Toast from "../components/Toast";
import "./AdminDashboard.css";

// ============ SECTION COMPONENTS ============

const DashboardOverview = ({ stats, loading }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section">
    <h2>📊 Dashboard Overview</h2>
    <div className="metrics-grid">
      <div className="metric-card">
        <h3>Total Orders</h3>
        <p className="metric-value">{stats?.totalOrders || 0}</p>
        <span className="metric-label">All time</span>
      </div>
      <div className="metric-card">
        <h3>Total Revenue</h3>
        <p className="metric-value">₹{(stats?.totalRevenue || 0).toLocaleString()}</p>
        <span className="metric-label">Earned</span>
      </div>
      <div className="metric-card">
        <h3>Total Users</h3>
        <p className="metric-value">{stats?.totalUsers || 0}</p>
        <span className="metric-label">Registered</span>
      </div>
      <div className="metric-card">
        <h3>Total Restaurants</h3>
        <p className="metric-value">{stats?.totalRestaurants || 0}</p>
        <span className="metric-label">Active</span>
      </div>
      <div className="metric-card">
        <h3>Food Items</h3>
        <p className="metric-value">{stats?.totalProducts || 0}</p>
        <span className="metric-label">Listed</span>
      </div>
      <div className="metric-card red">
        <h3>Pending Orders</h3>
        <p className="metric-value">{stats?.pendingOrders || 0}</p>
        <span className="metric-label">Need attention</span>
      </div>
      <div className="metric-card">
        <h3>Delivered Orders</h3>
        <p className="metric-value">{stats?.deliveredOrders || 0}</p>
        <span className="metric-label">Completed</span>
      </div>
      <div className="metric-card">
        <h3>Cancelled Orders</h3>
        <p className="metric-value">{stats?.cancelledOrders || 0}</p>
        <span className="metric-label">Cancelled</span>
      </div>
    </div>
  </motion.div>
);

const OrderManagement = ({ orders, onStatusChange, loading }) => {
  const [filter, setFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filteredOrders = filter === "All" ? orders : orders.filter(o => o.orderStatus === filter);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section">
      <h2>🍽️ Order Management</h2>
      <div className="filter-bar">
        {["All", "Placed", "Preparing", "Ready", "Out for Delivery", "Delivered", "Cancelled"].map(status => (
          <button key={status} className={`filter-btn ${filter === status ? "active" : ""}`} onClick={() => setFilter(status)}>
            {status}
          </button>
        ))}
      </div>

      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <p className="empty-state">No orders found</p>
        ) : (
          filteredOrders.map(order => (
            <div key={order._id} className="order-card" onClick={() => setSelectedOrder(order)}>
              <div className="order-header">
                <span className="order-id">Order #{order._id.slice(-6)}</span>
                <span className={`status-badge ${order.orderStatus.toLowerCase().replace(" ", "-")}`}>{order.orderStatus}</span>
              </div>
              <p><strong>Customer:</strong> {order.userId?.name || "Unknown"}</p>
              <p><strong>Total:</strong> ₹{order.total || 0}</p>
              <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
              <div className="order-actions">
                <select onChange={(e) => onStatusChange(order._id, e.target.value)} value={order.orderStatus}>
                  <option value="Placed">Placed</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Ready">Ready</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> {selectedOrder._id}</p>
            <p><strong>Customer:</strong> {selectedOrder.userId?.name}</p>
            <p><strong>Items:</strong></p>
            <ul>
              {selectedOrder.items?.map((item, i) => (
                <li key={i}>{item.name} x{item.quantity} = ₹{item.price * item.quantity}</li>
              ))}
            </ul>
            <p><strong>Status:</strong> {selectedOrder.orderStatus}</p>
            <p><strong>Payment:</strong> {selectedOrder.paymentStatus}</p>
            <button className="btn-close" onClick={() => setSelectedOrder(null)}>Close</button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const FoodItemsManagement = ({ products, restaurants, onAddProduct, onDeleteProduct, loading }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    restaurantId: "",
    isVeg: true,
    image: null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.keys(formData).forEach(key => {
      if (key !== "image") fd.append(key, formData[key]);
    });
    if (formData.image) fd.append("image", formData.image);

    try {
      const token = sessionStorage.getItem("token");
      await axios.post(`${API_URL}/api/admin/products`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      onAddProduct();
      setShowForm(false);
      setFormData({ name: "", description: "", price: "", category: "", restaurantId: "", isVeg: true, image: null });
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section">
      <h2>🍔 Food Items Management</h2>
      <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Add New Item</button>

      {showForm && (
        <form className="form-container" onSubmit={handleSubmit}>
          <input type="text" placeholder="Food Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          <input type="number" placeholder="Price" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
          <input type="text" placeholder="Category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
          <select value={formData.restaurantId} onChange={(e) => setFormData({...formData, restaurantId: e.target.value})} required>
            <option>Select Restaurant</option>
            {restaurants.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
          <label>
            <input type="checkbox" checked={formData.isVeg} onChange={(e) => setFormData({...formData, isVeg: e.target.checked})} />
            Vegetarian
          </label>
          <input type="file" onChange={(e) => setFormData({...formData, image: e.target.files[0]})} />
          <button type="submit" className="btn-success">Add Item</button>
          <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
        </form>
      )}

      <div className="products-grid">
        {products.map(product => (
          <div key={product._id} className="product-card">
            {product.image && <img src={product.image} alt={product.name} />}
            <h4>{product.name}</h4>
            <p className="price">₹{product.price}</p>
            <p className="category">{product.category}</p>
            <p>{product.isVeg ? "🥗 Veg" : "🍖 Non-Veg"}</p>
            <button className="btn-danger" onClick={() => onDeleteProduct(product._id)}>Delete</button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const RestaurantManagement = ({ restaurants, requests, onApproveRestaurant, onRejectRestaurant, loading }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section">
      <h2>🏪 Restaurant Management</h2>

      <div className="subsection">
        <h3>Pending Restaurant Requests ({requests.length})</h3>
        {requests.length === 0 ? (
          <p className="empty-state">No pending requests</p>
        ) : (
          <div className="restaurants-list">
            {requests.map(req => (
              <div key={req._id} className="restaurant-card">
                <h4>{req.name}</h4>
                <p><strong>Admin:</strong> {req.adminName}</p>
                <p><strong>Email:</strong> {req.email}</p>
                <p><strong>Phone:</strong> {req.phone}</p>
                <div className="action-buttons">
                  <button className="btn-success" onClick={() => onApproveRestaurant(req._id)}>Approve</button>
                  <button className="btn-danger" onClick={() => onRejectRestaurant(req._id)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="subsection">
        <h3>Approved Restaurants ({restaurants.length})</h3>
        <div className="restaurants-list">
          {restaurants.map(rest => (
            <div key={rest._id} className="restaurant-card">
              {rest.image && <img src={rest.image} alt={rest.name} className="rest-img" />}
              <h4>{rest.name}</h4>
              <p><strong>Cuisine:</strong> {rest.cuisine?.join(", ")}</p>
              <p><strong>Rating:</strong> ⭐ {rest.rating || "N/A"}</p>
              <p><strong>City:</strong> {rest.address?.city}</p>
              <p><strong>Status:</strong> {rest.isOpen ? "🟢 Open" : "🔴 Closed"}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const UserManagement = ({ users, onBlockUser, loading }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section">
      <h2>👤 User Management</h2>
      <input type="text" placeholder="Search users..." className="search-bar" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

      <div className="users-list">
        {filteredUsers.length === 0 ? (
          <p className="empty-state">No users found</p>
        ) : (
          filteredUsers.map(user => (
            <div key={user._id} className="user-card">
              <h4>{user.name}</h4>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Status:</strong> {user.isBlocked ? "🔴 Blocked" : "🟢 Active"}</p>
              <button className={user.isBlocked ? "btn-success" : "btn-danger"} onClick={() => onBlockUser(user._id, !user.isBlocked)}>
                {user.isBlocked ? "Unblock" : "Block"} User
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

const RiderManagement = ({ pendingRiders, approvedRiders, onApproveRider, onRejectRider, loading }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section">
      <h2>🚴 Delivery Partner Management</h2>

      <div className="subsection">
        <h3>Pending Approvals ({pendingRiders.length})</h3>
        {pendingRiders.length === 0 ? (
          <p className="empty-state">No pending riders</p>
        ) : (
          <div className="riders-list">
            {pendingRiders.map(rider => (
              <div key={rider._id} className="rider-card">
                <h4>{rider.name}</h4>
                <p><strong>Email:</strong> {rider.email}</p>
                <p><strong>Phone:</strong> {rider.phone}</p>
                <p><strong>Vehicle:</strong> {rider.vehicle?.type}</p>
                <p><strong>KYC:</strong> {rider.kycStatus || "Pending"}</p>
                <div className="action-buttons">
                  <button className="btn-success" onClick={() => onApproveRider(rider._id)}>Approve</button>
                  <button className="btn-danger" onClick={() => onRejectRider(rider._id)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="subsection">
        <h3>Approved Riders ({approvedRiders.length})</h3>
        <div className="riders-list">
          {approvedRiders.map(rider => (
            <div key={rider._id} className="rider-card">
              <h4>{rider.name}</h4>
              <p><strong>Phone:</strong> {rider.phone}</p>
              <p><strong>Vehicle:</strong> {rider.vehicle?.type} - {rider.vehicle?.number}</p>
              <p><strong>Status:</strong> {rider.isAvailable ? "🟢 Available" : "🔴 Busy"}</p>
              <p><strong>Rating:</strong> ⭐ {rider.rating || "N/A"}</p>
              <p><strong>Deliveries:</strong> {rider.totalDeliveries || 0}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const PaymentManagement = ({ transactions, loading }) => {
  const [filter, setFilter] = useState("All");
  const filteredTransactions = filter === "All" ? transactions : transactions.filter(t => t.paymentStatus === filter);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section">
      <h2>💳 Payment Management</h2>
      <div className="filter-bar">
        {["All", "Completed", "Pending", "Failed"].map(status => (
          <button key={status} className={`filter-btn ${filter === status ? "active" : ""}`} onClick={() => setFilter(status)}>
            {status}
          </button>
        ))}
      </div>

      <div className="transactions-list">
        {filteredTransactions.length === 0 ? (
          <p className="empty-state">No transactions found</p>
        ) : (
          filteredTransactions.map(trans => (
            <div key={trans._id} className="transaction-card">
              <div className="trans-header">
                <span className="trans-id">#{trans._id.slice(-6)}</span>
                <span className={`status-badge ${trans.paymentStatus.toLowerCase()}`}>{trans.paymentStatus}</span>
              </div>
              <p><strong>Amount:</strong> ₹{trans.amount || 0}</p>
              <p><strong>Method:</strong> {trans.paymentMethod || "Unknown"}</p>
              <p><strong>Date:</strong> {new Date(trans.createdAt).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

const CategoryManagement = ({ categories, onAddCategory, onDeleteCategory, loading }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", image: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement category API call
    setShowForm(false);
    setFormData({ name: "", image: null });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section">
      <h2>🍱 Category Management</h2>
      <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Category</button>

      {showForm && (
        <form className="form-container" onSubmit={handleSubmit}>
          <input type="text" placeholder="Category Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          <input type="file" onChange={(e) => setFormData({...formData, image: e.target.files[0]})} />
          <button type="submit" className="btn-success">Add Category</button>
          <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
        </form>
      )}

      <div className="categories-grid">
        <div className="category-item">Pizza</div>
        <div className="category-item">Biryani</div>
        <div className="category-item">Desserts</div>
        <div className="category-item">Drinks</div>
        <div className="category-item">Burgers</div>
      </div>
    </motion.div>
  );
};

const CouponsManagement = ({ coupons, onAddCoupon, loading }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discount: "",
    expiryDate: "",
    maxUses: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement coupon API call
    setShowForm(false);
    setFormData({ code: "", discount: "", expiryDate: "", maxUses: "" });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section">
      <h2>🎟️ Coupons & Offers</h2>
      <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Create Coupon</button>

      {showForm && (
        <form className="form-container" onSubmit={handleSubmit}>
          <input type="text" placeholder="Coupon Code" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} required />
          <input type="number" placeholder="Discount %" value={formData.discount} onChange={(e) => setFormData({...formData, discount: e.target.value})} required />
          <input type="date" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} required />
          <input type="number" placeholder="Max Uses" value={formData.maxUses} onChange={(e) => setFormData({...formData, maxUses: e.target.value})} />
          <button type="submit" className="btn-success">Create Coupon</button>
          <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
        </form>
      )}

      <div className="coupons-list">
        <div className="coupon-card">
          <h4>WELCOME50</h4>
          <p className="discount">50% OFF</p>
          <p><strong>Expires:</strong> 2024-12-31</p>
          <p className="uses">100 uses</p>
        </div>
        <div className="coupon-card">
          <h4>FOOD20</h4>
          <p className="discount">20% OFF</p>
          <p><strong>Expires:</strong> 2024-11-30</p>
          <p className="uses">50 uses</p>
        </div>
      </div>
    </motion.div>
  );
};

const ReviewsManagement = ({ reviews, onDeleteReview, loading }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section">
      <h2>⭐ Reviews & Ratings</h2>
      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p className="empty-state">No reviews</p>
        ) : (
          reviews.map(review => (
            <div key={review._id} className="review-card">
              <div className="review-header">
                <span className="stars">{"⭐".repeat(review.rating)}</span>
                <span className="type">{review.reviewType}</span>
              </div>
              <p><strong>User:</strong> {review.userId?.name || "Anonymous"}</p>
              <p className="comment">{review.comment}</p>
              <button className="btn-danger" onClick={() => onDeleteReview(review._id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

const NotificationsSection = ({ notifications, onSendNotification, loading }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement send notification API call
    setShowForm(false);
    setFormData({ title: "", message: "" });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section">
      <h2>🔔 Notifications</h2>
      <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Send Notification</button>

      {showForm && (
        <form className="form-container" onSubmit={handleSubmit}>
          <input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
          <textarea placeholder="Message" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} required />
          <button type="submit" className="btn-success">Send to All Users</button>
          <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
        </form>
      )}
    </motion.div>
  );
};

const AnalyticsSection = ({ analytics, loading }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section">
      <h2>📈 Analytics</h2>
      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>Best Selling Foods</h4>
          <ol>
            <li>🍕 Pizza - 450 orders</li>
            <li>🍜 Biryani - 350 orders</li>
            <li>🍔 Burger - 280 orders</li>
          </ol>
        </div>
        <div className="analytics-card">
          <h4>Peak Order Hours</h4>
          <ol>
            <li>12:00 PM - 2:00 PM (Lunch)</li>
            <li>7:00 PM - 9:00 PM (Dinner)</li>
            <li>6:00 PM - 7:00 PM (Evening)</li>
          </ol>
        </div>
        <div className="analytics-card">
          <h4>Customer Growth</h4>
          <p>📈 +15% this month</p>
          <p>📊 2,450 active users</p>
        </div>
        <div className="analytics-card">
          <h4>Revenue Trends</h4>
          <p>💰 ₹2,50,000 this week</p>
          <p>📅 ₹10,50,000 this month</p>
        </div>
      </div>
    </motion.div>
  );
};

const SettingsSection = ({ settings, onSaveSettings, loading }) => {
  const [formData, setFormData] = useState({
    deliveryCharges: 50,
    taxPercent: 5,
    platformFee: 2,
    companyName: "FoodFlow",
    contactEmail: "support@foodflow.com",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement settings API call
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section">
      <h2>⚙️ Settings</h2>
      <form className="form-container" onSubmit={handleSubmit}>
        <label>
          Delivery Charges (₹):
          <input type="number" value={formData.deliveryCharges} onChange={(e) => setFormData({...formData, deliveryCharges: e.target.value})} />
        </label>
        <label>
          Tax Percentage (%):
          <input type="number" value={formData.taxPercent} onChange={(e) => setFormData({...formData, taxPercent: e.target.value})} />
        </label>
        <label>
          Platform Fee (%):
          <input type="number" value={formData.platformFee} onChange={(e) => setFormData({...formData, platformFee: e.target.value})} />
        </label>
        <label>
          Company Name:
          <input type="text" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} />
        </label>
        <label>
          Contact Email:
          <input type="email" value={formData.contactEmail} onChange={(e) => setFormData({...formData, contactEmail: e.target.value})} />
        </label>
        <button type="submit" className="btn-success">Save Settings</button>
      </form>
    </motion.div>
  );
};

const SupportSection = ({ complaints, loading }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section">
      <h2>🛠️ Support & Complaints</h2>
      <div className="complaints-list">
        {complaints.length === 0 ? (
          <p className="empty-state">No complaints</p>
        ) : (
          complaints.map((complaint, i) => (
            <div key={i} className="complaint-card">
              <h4>{complaint.title}</h4>
              <p><strong>User:</strong> {complaint.userName}</p>
              <p className="description">{complaint.description}</p>
              <p><strong>Status:</strong> {complaint.status}</p>
              <textarea placeholder="Response..." />
              <button className="btn-success">Send Response</button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

// ============ MAIN ADMIN DASHBOARD COMPONENT ============

function NewAdminDashboard() {
  const token = sessionStorage.getItem("token") || "";
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Data states
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantRequests, setRestaurantRequests] = useState([]);
  const [pendingRiders, setPendingRiders] = useState([]);
  const [approvedRiders, setApprovedRiders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reviews, setReviews] = useState([]);

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        ordersRes,
        productsRes,
        usersRes,
        restaurantsRes,
        restaurantReqRes,
        pendingRidersRes,
        approvedRidersRes,
        transRes,
        reviewsRes,
      ] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats`, authHeaders).catch(() => ({ data: null })),
        axios.get(`${API_URL}/api/admin/orders`, authHeaders).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/admin/products`, authHeaders).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/admin/users`, authHeaders).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/admin/restaurants`, authHeaders).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/admin/restaurant-requests`, authHeaders).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/admin/riders/pending`, authHeaders).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/admin/riders/approved`, authHeaders).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/payment/transactions`, authHeaders).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/reviews`, authHeaders).catch(() => ({ data: [] })),
      ]);

      setStats(statsRes.data);
      setOrders(ordersRes.data);
      setProducts(productsRes.data);
      setUsers(usersRes.data);
      setRestaurants(restaurantsRes.data);
      setRestaurantRequests(restaurantReqRes.data);
      setPendingRiders(pendingRidersRes.data);
      setApprovedRiders(approvedRidersRes.data);
      setTransactions(transRes.data);
      setReviews(reviewsRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setToast({ message: "Error loading dashboard data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [authHeaders]);

  // API handlers
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_URL}/api/admin/orders/${orderId}/status`, { status: newStatus }, authHeaders);
      setToast({ message: "Order status updated", type: "success" });
      fetchDashboardData();
    } catch (error) {
      setToast({ message: "Error updating order status", type: "error" });
    }
  };

  const handleBlockUser = async (userId, blocked) => {
    try {
      await axios.put(`${API_URL}/api/admin/users/${userId}/block`, { isBlocked: blocked }, authHeaders);
      setToast({ message: blocked ? "User blocked" : "User unblocked", type: "success" });
      fetchDashboardData();
    } catch (error) {
      setToast({ message: "Error updating user status", type: "error" });
    }
  };

  const handleApproveRestaurant = async (requestId) => {
    try {
      await axios.put(`${API_URL}/api/admin/restaurant-requests/${requestId}/approve`, {}, authHeaders);
      setToast({ message: "Restaurant approved", type: "success" });
      fetchDashboardData();
    } catch (error) {
      setToast({ message: "Error approving restaurant", type: "error" });
    }
  };

  const handleRejectRestaurant = async (requestId) => {
    try {
      await axios.put(`${API_URL}/api/admin/restaurant-requests/${requestId}/reject`, {}, authHeaders);
      setToast({ message: "Restaurant rejected", type: "success" });
      fetchDashboardData();
    } catch (error) {
      setToast({ message: "Error rejecting restaurant", type: "error" });
    }
  };

  const handleApproveRider = async (riderId) => {
    try {
      await axios.post(`${API_URL}/api/admin/riders/${riderId}/approve`, {}, authHeaders);
      setToast({ message: "Rider approved", type: "success" });
      fetchDashboardData();
    } catch (error) {
      setToast({ message: "Error approving rider", type: "error" });
    }
  };

  const handleRejectRider = async (riderId) => {
    try {
      await axios.post(`${API_URL}/api/admin/riders/${riderId}/reject`, {}, authHeaders);
      setToast({ message: "Rider rejected", type: "success" });
      fetchDashboardData();
    } catch (error) {
      setToast({ message: "Error rejecting rider", type: "error" });
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await axios.delete(`${API_URL}/api/admin/products/${productId}`, authHeaders);
      setToast({ message: "Product deleted", type: "success" });
      fetchDashboardData();
    } catch (error) {
      setToast({ message: "Error deleting product", type: "error" });
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await axios.delete(`${API_URL}/api/reviews/${reviewId}`, authHeaders);
      setToast({ message: "Review deleted", type: "success" });
      fetchDashboardData();
    } catch (error) {
      setToast({ message: "Error deleting review", type: "error" });
    }
  };

  const renderSectionContent = () => {
    const props = { loading };
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview stats={stats} {...props} />;
      case "orders":
        return <OrderManagement orders={orders} onStatusChange={handleStatusChange} {...props} />;
      case "products":
        return <FoodItemsManagement products={products} restaurants={restaurants} onAddProduct={fetchDashboardData} onDeleteProduct={handleDeleteProduct} {...props} />;
      case "restaurants":
        return <RestaurantManagement restaurants={restaurants} requests={restaurantRequests} onApproveRestaurant={handleApproveRestaurant} onRejectRestaurant={handleRejectRestaurant} {...props} />;
      case "users":
        return <UserManagement users={users} onBlockUser={handleBlockUser} {...props} />;
      case "riders":
        return <RiderManagement pendingRiders={pendingRiders} approvedRiders={approvedRiders} onApproveRider={handleApproveRider} onRejectRider={handleRejectRider} {...props} />;
      case "payments":
        return <PaymentManagement transactions={transactions} {...props} />;
      case "categories":
        return <CategoryManagement categories={[]} onAddCategory={() => {}} onDeleteCategory={() => {}} {...props} />;
      case "coupons":
        return <CouponsManagement coupons={[]} onAddCoupon={() => {}} {...props} />;
      case "reviews":
        return <ReviewsManagement reviews={reviews} onDeleteReview={handleDeleteReview} {...props} />;
      case "notifications":
        return <NotificationsSection notifications={[]} onSendNotification={() => {}} {...props} />;
      case "analytics":
        return <AnalyticsSection analytics={{}} {...props} />;
      case "settings":
        return <SettingsSection settings={{}} onSaveSettings={() => {}} {...props} />;
      case "support":
        return <SupportSection complaints={[]} {...props} />;
      default:
        return <DashboardOverview stats={stats} {...props} />;
    }
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    window.location.href = "/login";
  };

  const SECTIONS = [
    { id: "dashboard", label: "📊 Dashboard", icon: "📊" },
    { id: "orders", label: "🍽️ Orders", icon: "🍽️" },
    { id: "products", label: "🍔 Food Items", icon: "🍔" },
    { id: "restaurants", label: "🏪 Restaurants", icon: "🏪" },
    { id: "users", label: "👤 Users", icon: "👤" },
    { id: "riders", label: "🚴 Riders", icon: "🚴" },
    { id: "payments", label: "💳 Payments", icon: "💳" },
    { id: "categories", label: "🍱 Categories", icon: "🍱" },
    { id: "coupons", label: "🎟️ Coupons", icon: "🎟️" },
    { id: "reviews", label: "⭐ Reviews", icon: "⭐" },
    { id: "notifications", label: "🔔 Notifications", icon: "🔔" },
    { id: "analytics", label: "📈 Analytics", icon: "📈" },
    { id: "settings", label: "⚙️ Settings", icon: "⚙️" },
    { id: "support", label: "🛠️ Support", icon: "🛠️" },
  ];

  return (
    <div className="admin-dashboard-wrapper">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <aside className="admin-sidebar-nav">
        <div className="sidebar-header">
          <h2>🍴 FoodFlow Admin</h2>
          <p>Platform Control Center</p>
        </div>

        <nav className="sidebar-menu">
          {SECTIONS.map(section => (
            <button
              key={section.id}
              className={`menu-item ${activeSection === section.id ? "active" : ""}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="menu-icon">{section.icon}</span>
              <span className="menu-label">{section.label}</span>
            </button>
          ))}
        </nav>

        <button className="btn-logout" onClick={logout}>🚪 Logout</button>
      </aside>

      <main className="admin-main-content">
        <header className="admin-top-bar">
          <h1>{SECTIONS.find(s => s.id === activeSection)?.label || "Dashboard"}</h1>
          <div className="top-bar-right">
            <span className="user-info">Admin User</span>
            <span className="timestamp">{new Date().toLocaleString()}</span>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="section-container"
          >
            {renderSectionContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default NewAdminDashboard;
