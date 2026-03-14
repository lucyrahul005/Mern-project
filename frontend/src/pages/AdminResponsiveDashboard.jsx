import { useState, useEffect } from "react";
import axios from "axios";
import "./AdminResponsiveDashboard.css";
import { API_URL } from "../config/api";

const NAV_ITEMS = [
  { label: "Overview", icon: "📊" },
  { label: "Orders", icon: "📦" },
  { label: "Restaurants", icon: "🏪" },
  { label: "Users", icon: "👥" },
  { label: "Riders", icon: "🚴" },
  { label: "Analytics", icon: "📈" },
];

export default function AdminResponsiveDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [ordersRes, restaurantsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/orders`, config).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/restaurants`, config).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/admin/users`, config).catch(() => ({ data: [] })),
      ]);

      setOrders(ordersRes.data?.slice(0, 10) || []);
      setRestaurants(restaurantsRes.data?.slice(0, 10) || []);
      setUsers(usersRes.data?.slice(0, 10) || []);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalOrders = orders.length;
  const totalRestaurants = restaurants.length;
  const totalUsers = users.length;

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>🍲 FoodFlow Admin</h2>
          <button className="close-btn" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`nav-link ${activeTab === item.label ? "active" : ""}`}
              onClick={() => {
                setActiveTab(item.label);
                setSidebarOpen(false);
              }}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰ Menu
          </button>
          <h1>{activeTab}</h1>
          <div className="header-actions">
            <button className="btn-icon">🔔</button>
            <button className="btn-icon">⚙️</button>
          </div>
        </header>

        {/* Content */}
        <main className="admin-content">
          {activeTab === "Overview" && (
            <div className="overview-section">
              <div className="metrics-grid">
                <div className="metric-box">
                  <span className="metric-icon">📦</span>
                  <div>
                    <p className="metric-label">Total Orders</p>
                    <h3 className="metric-value">{totalOrders}</h3>
                  </div>
                </div>
                <div className="metric-box">
                  <span className="metric-icon">🏪</span>
                  <div>
                    <p className="metric-label">Restaurants</p>
                    <h3 className="metric-value">{totalRestaurants}</h3>
                  </div>
                </div>
                <div className="metric-box">
                  <span className="metric-icon">👥</span>
                  <div>
                    <p className="metric-label">Users</p>
                    <h3 className="metric-value">{totalUsers}</h3>
                  </div>
                </div>
                <div className="metric-box">
                  <span className="metric-icon">💰</span>
                  <div>
                    <p className="metric-label">Revenue</p>
                    <h3 className="metric-value">₹0</h3>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Orders" && (
            <div className="section-content">
              <h2>Recent Orders</h2>
              {orders.length ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td>{order._id?.slice(-6)}</td>
                        <td>{order.userId?.name || "Unknown"}</td>
                        <td>₹{order.totalAmount}</td>
                        <td><span className="status-badge">{order.status}</span></td>
                        <td><button className="btn-small">Details</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-state">No orders found</p>
              )}
            </div>
          )}

          {activeTab === "Restaurants" && (
            <div className="section-content">
              <h2>All Restaurants</h2>
              {restaurants.length ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>City</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurants.map((restaurant) => (
                      <tr key={restaurant._id}>
                        <td>{restaurant.name}</td>
                        <td>{restaurant.city || "N/A"}</td>
                        <td><span className="status-badge">{restaurant.approved ? "Approved" : "Pending"}</span></td>
                        <td><button className="btn-small">Edit</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-state">No restaurants found</p>
              )}
            </div>
          )}

          {activeTab === "Users" && (
            <div className="section-content">
              <h2>All Users</h2>
              {users.length ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td><span className="role-badge">User</span></td>
                        <td><button className="btn-small">View</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-state">No users found</p>
              )}
            </div>
          )}

          {activeTab === "Riders" && (
            <div className="section-content">
              <h2>Riders Management</h2>
              <p className="empty-state">Riders management coming soon</p>
            </div>
          )}

          {activeTab === "Analytics" && (
            <div className="section-content">
              <h2>Analytics</h2>
              <p className="empty-state">Analytics dashboard coming soon</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

