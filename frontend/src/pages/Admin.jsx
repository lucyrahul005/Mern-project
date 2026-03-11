import { useEffect, useState } from "react";
import axios from "axios";
import { getImageUrl } from "../utils/imageHelper";
import { API_URL } from "../config/api";
import "./AdminDashboard.css";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function Admin() {
  // ============ STATE ============
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Dashboard
  const [dashStats, setDashStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Products
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
  });

  // Orders
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Users
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Get token from sessionStorage
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = sessionStorage.getItem("token") || "";

  // ============ API CALLS ============

  // Fetch Dashboard Stats
  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axios.get(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("✅ Dashboard stats:", res.data);
      setDashStats(res.data);
    } catch (err) {
      console.error("❌ Error fetching stats:", err.response?.data || err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await axios.get(`${API_URL}/api/admin/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("✅ Products:", res.data);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error("❌ Error fetching products:", err.response?.data || err.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Add Product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_URL}/api/admin/products`,
        newProduct,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("✅ Product added:", res.data);
      alert("Product added successfully!");
      setNewProduct({
        name: "",
        description: "",
        price: "",
        category: "",
        image: "",
      });
      setShowAddProduct(false);
      fetchProducts();
    } catch (err) {
      console.error("❌ Error adding product:", err.response?.data);
      alert("Error adding product: " + (err.response?.data?.message || err.message));
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("✅ Product deleted");
      alert("Product deleted successfully!");
      fetchProducts();
    } catch (err) {
      console.error("❌ Error deleting product:", err.response?.data);
    }
  };

  // Mark Product as Popular
  const handleMarkPopular = async (productId) => {
    try {
      const res = await axios.put(
        `${API_URL}/api/admin/products/${productId}/popular`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("✅ Product popularity toggled:", res.data);
      fetchProducts();
    } catch (err) {
      console.error("❌ Error toggling popular:", err.response?.data);
    }
  };

  // Fetch Orders
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await axios.get(`${API_URL}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("✅ Orders:", res.data);
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("❌ Error fetching orders:", err.response?.data || err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await axios.put(
        `${API_URL}/api/admin/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("✅ Order status updated:", res.data);
      fetchOrders();
    } catch (err) {
      console.error("❌ Error updating order:", err.response?.data);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("✅ Users:", res.data);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("❌ Error fetching users:", err.response?.data || err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Block/Unblock User
  const handleBlockUser = async (userId) => {
    try {
      const res = await axios.put(
        `${API_URL}/api/admin/users/${userId}/block`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("✅ User blocked/unblocked:", res.data);
      fetchUsers();
    } catch (err) {
      console.error("❌ Error blocking user:", err.response?.data);
    }
  };

  // ============ EFFECTS ============
  useEffect(() => {
    if (!token) {
      alert("Please login as admin to access this page");
      window.location.href = "/login";
      return;
    }

    if (activeTab === "dashboard") {
      fetchDashboardStats();
    } else if (activeTab === "products") {
      fetchProducts();
    } else if (activeTab === "orders") {
      fetchOrders();
    } else if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab, token]);

  if (!token) return null;

  // Chart data
  const revenueChartData = dashStats?.populerItems
    ?.slice(0, 5)
    .map((item) => ({
      name: item.name,
      revenue: item.price * item.count,
      count: item.count,
    })) || [];

  return (
    <div style={styles.wrapper}>
      {/* ============ SIDEBAR ============ */}
      <div style={{
        ...styles.sidebar,
        width: sidebarOpen ? "220px" : "70px",
      }}>
        <h2 style={styles.logo}>👨‍💼</h2>

        <button
          style={{
            ...styles.menuBtn,
            background: activeTab === "dashboard" ? "#ff7a00" : "transparent",
          }}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Dashboard
        </button>

        <button
          style={{
            ...styles.menuBtn,
            background: activeTab === "products" ? "#ff7a00" : "transparent",
          }}
          onClick={() => setActiveTab("products")}
        >
          🛍️ Products
        </button>

        <button
          style={{
            ...styles.menuBtn,
            background: activeTab === "orders" ? "#ff7a00" : "transparent",
          }}
          onClick={() => setActiveTab("orders")}
        >
          📦 Orders
        </button>

        <button
          style={{
            ...styles.menuBtn,
            background: activeTab === "users" ? "#ff7a00" : "transparent",
          }}
          onClick={() => setActiveTab("users")}
        >
          👥 Users
        </button>

        <button
          style={styles.toggleBtn}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>
      </div>

      {/* ============ MAIN CONTENT ============ */}
      <div style={styles.main}>
        {/* ===== DASHBOARD ===== */}
        {activeTab === "dashboard" && (
          <div style={styles.container}>
            <h1 style={styles.header}>📊 Dashboard</h1>

            {loadingStats ? (
              <p>Loading...</p>
            ) : dashStats ? (
              <>
                {/* KPI CARDS */}
                <div style={styles.kpiGrid}>
                  <div style={styles.kpiCard}>
                    <h3>📦 Total Orders</h3>
                    <p style={styles.kpiValue}>{dashStats.totalOrders || 0}</p>
                  </div>

                  <div style={styles.kpiCard}>
                    <h3>💰 Total Revenue</h3>
                    <p style={styles.kpiValue}>₹{dashStats.totalRevenue || 0}</p>
                  </div>

                  <div style={styles.kpiCard}>
                    <h3>👥 Total Users</h3>
                    <p style={styles.kpiValue}>{dashStats.totalUsers || 0}</p>
                  </div>

                  <div style={styles.kpiCard}>
                    <h3>⭐ Popular Items</h3>
                    <p style={styles.kpiValue}>{dashStats.populerItems?.length || 0}</p>
                  </div>
                </div>

                {/* POPULAR ITEMS */}
                <div style={styles.section}>
                  <h2>🔥 Popular Items</h2>
                  <div style={styles.itemsGrid}>
                    {dashStats.populerItems?.map((item) => (
                      <div key={item._id} style={styles.itemCard}>
                        <h4>{item.name}</h4>
                        <p>Price: ₹{item.price}</p>
                        <p>Orders: {item.count}</p>
                        <p style={{ color: "#ff7a00", fontWeight: "bold" }}>
                          Revenue: ₹{item.price * item.count}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p>Failed to load dashboard data</p>
            )}
          </div>
        )}

        {/* ===== PRODUCTS MANAGEMENT ===== */}
        {activeTab === "products" && (
          <div style={styles.container}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h1 style={styles.header}>🛍️ Products</h1>
              <button
                style={styles.addBtn}
                onClick={() => setShowAddProduct(!showAddProduct)}
              >
                {showAddProduct ? "✕ Cancel" : "+ Add Product"}
              </button>
            </div>

            {/* ADD PRODUCT FORM */}
            {showAddProduct && (
              <div style={styles.formCard}>
                <h3>Add New Product</h3>
                <form onSubmit={handleAddProduct} style={styles.form}>
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    style={styles.input}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, description: e.target.value })
                    }
                    style={styles.input}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                    style={styles.input}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, category: e.target.value })
                    }
                    style={styles.input}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Image URL"
                    value={newProduct.image}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, image: e.target.value })
                    }
                    style={styles.input}
                    required
                  />
                  <button type="submit" style={styles.submitBtn}>
                    Add Product
                  </button>
                </form>
              </div>
            )}

            {/* PRODUCTS LIST */}
            {loadingProducts ? (
              <p>Loading...</p>
            ) : (
              <div style={styles.itemsGrid}>
                {products.map((product) => (
                  <div key={product._id} style={styles.productCard}>
                    {product.image && (
                      <img
                        src={getImageUrl(product.image, API_URL)}
                        alt={product.name}
                        style={styles.productImage}
                      />
                    )}
                    <h4>{product.name}</h4>
                    <p>{product.description}</p>
                    <p style={{ fontWeight: "bold", color: "#ff7a00" }}>
                      ₹{product.price}
                    </p>
                    <p>Category: {product.category}</p>

                    {product.isPopular && (
                      <p style={{ color: "gold" }}>⭐ Popular</p>
                    )}

                    <div style={styles.buttonGroup}>
                      <button
                        style={{
                          ...styles.actionBtn,
                          background: product.isPopular ? "#FFD700" : "#666",
                          color: product.isPopular ? "#333" : "white",
                        }}
                        onClick={() => handleMarkPopular(product._id)}
                      >
                        {product.isPopular ? "★ Unmark Popular" : "☆ Mark Popular"}
                      </button>
                      <button
                        style={styles.deleteBtn}
                        onClick={() => handleDeleteProduct(product._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== ORDERS MANAGEMENT ===== */}
        {activeTab === "orders" && (
          <div style={styles.container}>
            <h1 style={styles.header}>📦 Orders Management</h1>

            {loadingOrders ? (
              <p>Loading...</p>
            ) : (
              <div style={styles.ordersTable}>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <div key={order._id} style={styles.orderCard}>
                      <div style={styles.orderHeader}>
                        <h3>Order #{order._id.slice(-6)}</h3>
                        <p>Total: ₹{order.total}</p>
                      </div>

                      <p>Items: {order.items?.length || 0}</p>
                      <p>Status: {order.orderStatus}</p>
                      <p>Payment: {order.paymentStatus}</p>

                      <div style={styles.buttonGroup}>
                        <select
                          value={order.orderStatus}
                          onChange={(e) =>
                            handleUpdateOrderStatus(order._id, e.target.value)
                          }
                          style={styles.statusSelect}
                        >
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
                ) : (
                  <p>No orders found</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== USERS MANAGEMENT ===== */}
        {activeTab === "users" && (
          <div style={styles.container}>
            <h1 style={styles.header}>👥 Users</h1>

            {loadingUsers ? (
              <p>Loading...</p>
            ) : (
              <div style={styles.usersTable}>
                {users.length > 0 ? (
                  users.map((u) => (
                    <div key={u._id} style={styles.userCard}>
                      <div>
                        <h4>{u.name}</h4>
                        <p>{u.email}</p>
                        <p>Status: {u.isBlocked ? "🔴 Blocked" : "🟢 Active"}</p>
                      </div>
                      <button
                        style={{
                          ...styles.actionBtn,
                          background: u.isBlocked ? "#4CAF50" : "#f44336",
                          flex: "unset",
                          width: "100px",
                          minWidth: "100px",
                        }}
                        onClick={() => handleBlockUser(u._id)}
                      >
                        {u.isBlocked ? "Unblock" : "Block"}
                      </button>
                    </div>
                  ))
                ) : (
                  <p>No users found</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    height: "100vh",
    background: "#1a1a2e",
    color: "white",
    fontFamily: "Arial, sans-serif",
  },

  sidebar: {
    background: "#16213e",
    borderRight: "1px solid #ff7a00",
    padding: "20px 10px",
    transition: "0.3s",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  logo: {
    textAlign: "center",
    fontSize: "28px",
    marginBottom: "20px",
  },

  menuBtn: {
    background: "transparent",
    border: "none",
    color: "white",
    padding: "12px",
    cursor: "pointer",
    borderRadius: "8px",
    transitionDuration: "0.3s",
    fontSize: "13px",
  },

  toggleBtn: {
    marginTop: "auto",
    background: "#ff7a00",
    border: "none",
    color: "white",
    padding: "10px",
    cursor: "pointer",
    borderRadius: "6px",
  },

  main: {
    flex: 1,
    overflow: "auto",
    padding: "20px",
  },

  container: {
    maxWidth: "1400px",
    margin: "0 auto",
  },

  header: {
    fontSize: "28px",
    marginBottom: "30px",
    color: "#ff7a00",
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  },

  kpiCard: {
    background: "rgba(255, 122, 0, 0.1)",
    border: "1px solid #ff7a00",
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center",
  },

  kpiValue: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#ff7a00",
    marginTop: "10px",
  },

  section: {
    marginBottom: "40px",
  },

  itemsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },

  itemCard: {
    background: "rgba(255, 122, 0, 0.05)",
    border: "1px solid rgba(255, 122, 0, 0.3)",
    padding: "15px",
    borderRadius: "10px",
  },

  productCard: {
    background: "rgba(255, 122, 0, 0.05)",
    border: "1px solid rgba(255, 122, 0, 0.3)",
    padding: "15px",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
  },

  productImage: {
    width: "100%",
    height: "150px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "10px",
  },

  formCard: {
    background: "rgba(255, 122, 0, 0.1)",
    border: "1px solid #ff7a00",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "30px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  input: {
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid #ff7a00",
    color: "white",
    padding: "12px",
    borderRadius: "6px",
    fontSize: "14px",
  },

  submitBtn: {
    background: "#ff7a00",
    border: "none",
    color: "white",
    padding: "12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  addBtn: {
    background: "#ff7a00",
    border: "none",
    color: "white",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  orderCard: {
    background: "rgba(255, 122, 0, 0.05)",
    border: "1px solid rgba(255, 122, 0, 0.3)",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "15px",
  },

  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },

  userCard: {
    background: "rgba(255, 122, 0, 0.05)",
    border: "1px solid rgba(255, 122, 0, 0.3)",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  buttonGroup: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },

  actionBtn: {
    background: "#ff7a00",
    border: "none",
    color: "white",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    flex: 1,
  },

  deleteBtn: {
    background: "#f44336",
    border: "none",
    color: "white",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    flex: 1,
  },

  statusSelect: {
    background: "rgba(255, 122, 0, 0.2)",
    border: "1px solid #ff7a00",
    color: "white",
    padding: "8px",
    borderRadius: "6px",
    cursor: "pointer",
    flex: 1,
  },

  ordersTable: {
    marginTop: "20px",
  },

  usersTable: {
    marginTop: "20px",
  },
};

export default Admin;