import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { API_URL } from "../config/api";
import { getImageUrl } from "../utils/imageHelper";
import Toast from "../components/Toast";
import "./AdminDashboard.css";

const SECTION_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "requests", label: "Requests" },
  { id: "products", label: "Products" },
  { id: "orders", label: "Order Management" },
  { id: "restaurants", label: "Restaurant Management" },
  { id: "users", label: "User Management" },
  { id: "riders", label: "Delivery Partners" },
  { id: "payments", label: "Payment Management" },
  { id: "categories", label: "Category Management" },
  { id: "coupons", label: "Coupons & Offers" },
  { id: "reviews", label: "Reviews & Ratings" },
  { id: "notifications", label: "Notifications" },
  { id: "settings", label: "Settings" },
  { id: "analytics", label: "Analytics" },
  { id: "support", label: "Support / Complaints" },
];

const ORDER_STATUSES = [
  "Placed",
  "Preparing",
  "Ready",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const compactNumber = (value = 0) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

const toDateOnly = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

function AdminDashboard() {
  const token = sessionStorage.getItem("token") || "";
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantRequests, setRestaurantRequests] = useState([]);
  const [pendingRiders, setPendingRiders] = useState([]);
  const [approvedRiders, setApprovedRiders] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [orderFilter, setOrderFilter] = useState("All");
  const [userSearch, setUserSearch] = useState("");
  const [toast, setToast] = useState(null);

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    restaurantName: "",
    image: null,
  });

  const [editingProduct, setEditingProduct] = useState(null);

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const fetchDashboardBundle = async () => {
    const [statsRes, ordersRes, usersRes, restaurantsRes, productsRes] = await Promise.all([
      axios.get(`${API_URL}/api/admin/stats`, authHeaders),
      axios.get(`${API_URL}/api/admin/orders`, authHeaders),
      axios.get(`${API_URL}/api/admin/users`, authHeaders),
      axios.get(`${API_URL}/api/admin/restaurants`, authHeaders),
      axios.get(`${API_URL}/api/admin/products`, authHeaders),
    ]);

    setStats(statsRes.data || null);
    setOrders(ordersRes.data?.orders || []);
    setUsers(usersRes.data?.users || []);
    setRestaurants(restaurantsRes.data?.restaurants || []);
    setProducts(productsRes.data?.products || []);
  };

  const fetchRequests = async () => {
    const [restaurantReqRes, riderPendingRes] = await Promise.allSettled([
      axios.get(`${API_URL}/api/admin/restaurant-requests`, authHeaders),
      axios.get(`${API_URL}/api/admin/riders/pending`, authHeaders),
    ]);

    if (restaurantReqRes.status === "fulfilled") {
      setRestaurantRequests(restaurantReqRes.value.data?.requests || []);
    } else {
      setRestaurantRequests([]);
      console.error("Restaurant requests fetch failed:", restaurantReqRes.reason);
    }

    if (riderPendingRes.status === "fulfilled") {
      setPendingRiders(riderPendingRes.value.data?.riders || []);
    } else {
      setPendingRiders([]);
      console.error("Rider pending fetch failed:", riderPendingRes.reason);
    }
  };

  const fetchProducts = async () => {
    const res = await axios.get(`${API_URL}/api/admin/products`, authHeaders);
    setProducts(res.data?.products || []);
  };

  const fetchOrders = async () => {
    const res = await axios.get(`${API_URL}/api/admin/orders`, authHeaders);
    setOrders(res.data?.orders || []);
  };

  const fetchUsers = async () => {
    const res = await axios.get(`${API_URL}/api/admin/users`, authHeaders);
    setUsers(res.data?.users || []);
  };

  const fetchRestaurants = async () => {
    const res = await axios.get(`${API_URL}/api/admin/restaurants`, authHeaders);
    setRestaurants(res.data?.restaurants || []);
  };

  const fetchApprovedRiders = async () => {
    const res = await axios.get(`${API_URL}/api/admin/riders/approved`, authHeaders);
    setApprovedRiders(res.data?.riders || []);
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/payments/transactions`, authHeaders);
      setTransactions(res.data?.transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    }
  };

  useEffect(() => {
    if (!token) {
      window.location.href = "/admin-login";
      return;
    }

    const loadSectionData = async () => {
      try {
        setLoading(true);

        if (activeSection === "dashboard") {
          await fetchDashboardBundle();
          return;
        }

        if (activeSection === "requests") {
          await fetchRequests();
          return;
        }

        if (activeSection === "products") {
          await fetchProducts();
          return;
        }

        if (activeSection === "orders") {
          await fetchOrders();
          return;
        }

        if (activeSection === "users") {
          await fetchUsers();
          return;
        }

        if (activeSection === "restaurants") {
          await fetchRestaurants();
          return;
        }

        if (activeSection === "riders") {
          await Promise.all([fetchApprovedRiders(), fetchRequests()]);
          return;
        }

        if (activeSection === "payments") {
          await fetchTransactions();
          return;
        }
      } catch (error) {
        console.error("Admin section load error:", error?.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    loadSectionData();
  }, [activeSection, token, authHeaders]);

  // Auto-refresh orders every 10 seconds while on dashboard
  useEffect(() => {
    if (activeSection !== "dashboard") return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_URL}/api/admin/orders`, authHeaders);
        setOrders(res.data?.orders || []);
      } catch (err) {
        console.error("Auto-refresh orders failed:", err.message);
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [activeSection, authHeaders]);

  const revenueStats = useMemo(() => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    let annualRevenue = 0;
    let monthlyRevenue = 0;
    let weeklyRevenue = 0;
    let dailyRevenue = 0;

    let monthlyOrders = 0;
    let weeklyOrders = 0;

    const statusCounts = {
      pending: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      // Count status for ALL orders
      if (["Placed", "Preparing", "Ready", "Out for Delivery"].includes(order.orderStatus)) {
        statusCounts.pending += 1;
      }
      if (order.orderStatus === "Delivered") statusCounts.delivered += 1;
      if (order.orderStatus === "Cancelled") statusCounts.cancelled += 1;

      // Only count delivered orders for revenue
      if (order.orderStatus !== "Delivered") return;

      const total = Number(order.total) || 0;
      const orderDate = new Date(order.createdAt);
      const diff = now - orderDate;

      if (diff <= 365 * oneDay) annualRevenue += total;
      if (diff <= 30 * oneDay) {
        monthlyRevenue += total;
        monthlyOrders += 1;
      }
      if (diff <= 7 * oneDay) {
        weeklyRevenue += total;
        weeklyOrders += 1;
      }
      if (diff <= oneDay) dailyRevenue += total;
    });

    return {
      annualRevenue,
      monthlyRevenue,
      weeklyRevenue,
      dailyRevenue,
      monthlyOrders,
      weeklyOrders,
      statusCounts,
    };
  }, [orders]);

  const dashboardCards = useMemo(
    () => [
      { title: "Total Orders", value: orders.length },
      { title: "Total Revenue", value: formatCurrency(stats?.totalRevenue || revenueStats.annualRevenue) },
      { title: "Total Users", value: users.length },
      { title: "Total Restaurants", value: restaurants.length },
      { title: "Total Food Items", value: products.length },
      { title: "Pending Orders", value: revenueStats.statusCounts.pending },
      { title: "Delivered Orders", value: revenueStats.statusCounts.delivered },
      { title: "Cancelled Orders", value: revenueStats.statusCounts.cancelled },
    ],
    [orders.length, products.length, restaurants.length, revenueStats, stats?.totalRevenue, users.length]
  );

  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);

  const topSellingFoods = useMemo(() => stats?.populerItems || [], [stats]);

  const topRestaurants = useMemo(() => {
    if (!products.length) return restaurants.slice(0, 5);

    const countByRestaurant = products.reduce((acc, product) => {
      const key = product.restaurant?.name || product.restaurantName || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(countByRestaurant)
      .map(([name, itemCount]) => ({ name, itemCount }))
      .sort((a, b) => b.itemCount - a.itemCount)
      .slice(0, 5);
  }, [products, restaurants]);

  const revenueChartData = useMemo(() => {
    const now = new Date();
    const last7 = [];

    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      last7.push({
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("en-IN", { weekday: "short" }),
        revenue: 0,
        orders: 0,
      });
    }

    const indexMap = last7.reduce((acc, day, idx) => {
      acc[day.key] = idx;
      return acc;
    }, {});

    orders.forEach((order) => {
      // Only include delivered orders for revenue chart
      if (order.orderStatus !== "Delivered") return;

      const orderDay = toDateOnly(order.createdAt).toISOString().slice(0, 10);
      if (indexMap[orderDay] !== undefined) {
        const idx = indexMap[orderDay];
        last7[idx].revenue += Number(order.total) || 0;
        last7[idx].orders += 1;
      }
    });

    return last7;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === "All") return orders;
    return orders.filter((order) => order.orderStatus === orderFilter);
  }, [orders, orderFilter]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const searchText = userSearch.toLowerCase();
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchText) ||
        user.email?.toLowerCase().includes(searchText)
    );
  }, [users, userSearch]);

  const pendingRestaurantRequests = useMemo(
    () => restaurantRequests.filter((req) => req.adminStatus === "Pending"),
    [restaurantRequests]
  );

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(
        `${API_URL}/api/admin/orders/${orderId}/status`,
        { status: newStatus },
        authHeaders
      );
      await fetchOrders();
    } catch (error) {
      console.error("Order status update failed:", error?.response?.data || error.message);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await axios.put(`${API_URL}/api/admin/users/${userId}/block`, {}, authHeaders);
      await fetchUsers();
    } catch (error) {
      console.error("User status update failed:", error?.response?.data || error.message);
    }
  };

  const handleApproveRestaurant = async (userId) => {
    try {
      const response = await axios.put(`${API_URL}/api/admin/restaurant-requests/${userId}/approve`, {}, authHeaders);
      setToast({ message: "✅ Restaurant approved successfully!", type: "success" });
      setTimeout(() => setToast(null), 3000);
      await fetchRequests();
    } catch (error) {
      const errorMsg = error?.response?.data?.message || "Failed to approve restaurant";
      setToast({ message: `❌ ${errorMsg}`, type: "error" });
      setTimeout(() => setToast(null), 3000);
      console.error("Restaurant approval failed:", error?.response?.data || error.message);
    }
  };

  const handleRejectRestaurant = async (userId) => {
    try {
      const response = await axios.put(`${API_URL}/api/admin/restaurant-requests/${userId}/reject`, {}, authHeaders);
      setToast({ message: "❌ Restaurant rejected successfully!", type: "success" });
      setTimeout(() => setToast(null), 3000);
      await fetchRequests();
    } catch (error) {
      const errorMsg = error?.response?.data?.message || "Failed to reject restaurant";
      setToast({ message: `❌ ${errorMsg}`, type: "error" });
      setTimeout(() => setToast(null), 3000);
      console.error("Restaurant rejection failed:", error?.response?.data || error.message);
    }
  };

  const handleApproveRider = async (riderId) => {
    try {
      await axios.post(`${API_URL}/api/admin/riders/${riderId}/approve`, {}, authHeaders);
      await fetchRequests();
    } catch (error) {
      console.error("Rider approval failed:", error?.response?.data || error.message);
    }
  };

  const handleRejectRider = async (riderId) => {
    try {
      await axios.post(`${API_URL}/api/admin/riders/${riderId}/reject`, {}, authHeaders);
      await fetchRequests();
    } catch (error) {
      console.error("Rider rejection failed:", error?.response?.data || error.message);
    }
  };

  const handleProductFormChange = (event) => {
    const { name, value, files } = event.target;
    if (name === "image") {
      setProductForm((prev) => ({ ...prev, image: files?.[0] || null }));
      return;
    }
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      description: "",
      price: "",
      category: "",
      restaurantName: "",
      image: null,
    });
  };

  const handleAddProduct = async (event) => {
    event.preventDefault();

    try {
      const payload = new FormData();
      payload.append("name", productForm.name);
      payload.append("description", productForm.description);
      payload.append("price", productForm.price);
      payload.append("category", productForm.category);
      payload.append("restaurantName", productForm.restaurantName);
      if (productForm.image) {
        payload.append("image", productForm.image);
      }

      await axios.post(`${API_URL}/api/admin/products`, payload, {
        ...authHeaders,
        headers: {
          ...authHeaders.headers,
          "Content-Type": "multipart/form-data",
        },
      });

      resetProductForm();
      setShowAddProduct(false);
      await fetchProducts();
    } catch (error) {
      console.error("Add product failed:", error?.response?.data || error.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await axios.delete(`${API_URL}/api/admin/products/${productId}`, authHeaders);
      await fetchProducts();
    } catch (error) {
      console.error("Delete product failed:", error?.response?.data || error.message);
    }
  };

  const handleTogglePopular = async (productId) => {
    try {
      await axios.put(`${API_URL}/api/admin/products/${productId}/popular`, {}, authHeaders);
      await fetchProducts();
    } catch (error) {
      console.error("Toggle popular failed:", error?.response?.data || error.message);
    }
  };

  const handleStartProductEdit = (product) => {
    setEditingProduct({
      _id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
    });
  };

  const handleSaveProductEdit = async () => {
    if (!editingProduct?._id) return;

    try {
      await axios.put(
        `${API_URL}/api/admin/products/${editingProduct._id}`,
        {
          name: editingProduct.name,
          description: editingProduct.description,
          price: editingProduct.price,
          category: editingProduct.category,
        },
        authHeaders
      );
      setEditingProduct(null);
      await fetchProducts();
    } catch (error) {
      console.error("Edit product failed:", error?.response?.data || error.message);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "/admin-login";
  };

  const renderModuleCards = (title, description, points) => (
    <div className="module-shell">
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="module-points">
        {points.map((point) => (
          <div className="module-point" key={point}>
            {point}
          </div>
        ))}
      </div>
    </div>
  );

  const renderSectionContent = () => {
    if (loading) {
      return <div className="admin-loader">Loading {activeSection}...</div>;
    }

    if (activeSection === "dashboard") {
      return (
        <div className="section-stack">
          <div className="metrics-strip">
            <div className="metric-pill">
              <span>Annual Revenue</span>
              <strong>{formatCurrency(revenueStats.annualRevenue)}</strong>
            </div>
            <div className="metric-pill">
              <span>Weekly Revenue</span>
              <strong>{formatCurrency(revenueStats.weeklyRevenue)}</strong>
            </div>
            <div className="metric-pill">
              <span>Monthly Revenue</span>
              <strong>{formatCurrency(revenueStats.monthlyRevenue)}</strong>
            </div>
            <div className="metric-pill">
              <span>Weekly Orders</span>
              <strong>{compactNumber(revenueStats.weeklyOrders)}</strong>
            </div>
            <div className="metric-pill">
              <span>Monthly Orders</span>
              <strong>{compactNumber(revenueStats.monthlyOrders)}</strong>
            </div>
          </div>

          <div className="stat-grid">
            {dashboardCards.map((card) => (
              <motion.div key={card.title} layout className="stat-card" whileHover={{ y: -4 }}>
                <p>{card.title}</p>
                <h3>{card.value}</h3>
              </motion.div>
            ))}
          </div>

          <div className="chart-grid">
            <div className="glass-panel">
              <div className="panel-head">
                <h3>Revenue (Daily)</h3>
                <span>Last 7 days</span>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.15)" />
                    <XAxis dataKey="label" stroke="#cfe4ff" />
                    <YAxis stroke="#cfe4ff" />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#ffb84d" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel">
              <div className="panel-head">
                <h3>Orders (Daily)</h3>
                <span>Volume trend</span>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.15)" />
                    <XAxis dataKey="label" stroke="#cfe4ff" />
                    <YAxis stroke="#cfe4ff" />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#78f0ff" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="table-grid">
            <div className="glass-panel">
              <div className="panel-head">
                <h3>Recent Orders</h3>
              </div>
              <div className="simple-list">
                {recentOrders.map((order) => (
                  <div key={order._id} className="simple-item">
                    <div>
                      <strong>#{order._id.slice(-6)}</strong>
                      <p>{order.userId?.name || "Customer"}</p>
                    </div>
                    <div>
                      <strong>{formatCurrency(order.total)}</strong>
                      <p>{order.orderStatus}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel">
              <div className="panel-head">
                <h3>Top Selling Foods</h3>
              </div>
              <div className="simple-list">
                {topSellingFoods.map((food) => (
                  <div key={food._id || food.name} className="simple-item">
                    <div>
                      <strong>{food.name}</strong>
                      <p>{food.count} orders</p>
                    </div>
                    <div>
                      <strong>{formatCurrency((food.price || 0) * (food.count || 0))}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel">
              <div className="panel-head">
                <h3>Top Restaurants</h3>
              </div>
              <div className="simple-list">
                {topRestaurants.map((item) => (
                  <div key={item.name || item._id} className="simple-item">
                    <div>
                      <strong>{item.name || "Restaurant"}</strong>
                    </div>
                    <div>
                      <strong>{item.itemCount || "Live"}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "requests") {
      return (
        <div className="section-stack">
          <div className="table-grid two-col">
            <div className="glass-panel">
              <div className="panel-head">
                <h3>Restaurant Admin Requests</h3>
                <span>{pendingRestaurantRequests.length} pending / {restaurantRequests.length} total</span>
              </div>
              <div className="request-list">
                {pendingRestaurantRequests.map((request) => (
                  <div className="request-card" key={request._id}>
                    <div>
                      <strong>{request.name}</strong>
                      <p>{request.email}</p>
                      <p>Status: {request.adminStatus}</p>
                    </div>
                    <div className="inline-actions">
                      <button
                        className="btn approve"
                        onClick={() => handleApproveRestaurant(request._id)}
                        disabled={request.adminStatus === "Approved"}
                      >
                        Approve
                      </button>
                      <button
                        className="btn reject"
                        onClick={() => handleRejectRestaurant(request._id)}
                        disabled={request.adminStatus === "Rejected"}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {!pendingRestaurantRequests.length && (
                  <div className="empty-state">No pending restaurant admin requests.</div>
                )}
              </div>
            </div>

            <div className="glass-panel">
              <div className="panel-head">
                <h3>Rider Admin Requests</h3>
                <span>{pendingRiders.length} pending</span>
              </div>
              <div className="request-list">
                {pendingRiders.map((rider) => (
                  <div className="request-card" key={rider._id}>
                    <div>
                      <strong>{rider.name}</strong>
                      <p>{rider.email}</p>
                      <p>{rider.phone || "No phone"}</p>
                    </div>
                    <div className="inline-actions">
                      <button className="btn approve" onClick={() => handleApproveRider(rider._id)}>
                        Approve
                      </button>
                      <button className="btn reject" onClick={() => handleRejectRider(rider._id)}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {!pendingRiders.length && <div className="empty-state">No pending rider requests.</div>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "products") {
      return (
        <div className="section-stack">
          <div className="panel-head with-action">
            <h3>Food Items Management</h3>
            <button className="btn primary" onClick={() => setShowAddProduct((prev) => !prev)}>
              {showAddProduct ? "Close Form" : "Add New Food Item"}
            </button>
          </div>

          <AnimatePresence>
            {showAddProduct && (
              <motion.form
                className="glass-panel add-form"
                onSubmit={handleAddProduct}
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
              >
                <input name="name" placeholder="Food name" value={productForm.name} onChange={handleProductFormChange} required />
                <input
                  name="description"
                  placeholder="Description"
                  value={productForm.description}
                  onChange={handleProductFormChange}
                  required
                />
                <input name="price" type="number" placeholder="Price" value={productForm.price} onChange={handleProductFormChange} required />
                <input name="category" placeholder="Category (pizza, biryani...)" value={productForm.category} onChange={handleProductFormChange} required />
                <input
                  name="restaurantName"
                  placeholder="Restaurant name"
                  value={productForm.restaurantName}
                  onChange={handleProductFormChange}
                  required
                />
                <input name="image" type="file" accept="image/*" onChange={handleProductFormChange} required />
                <button type="submit" className="btn primary">Save Product</button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="product-grid">
            {products.map((product) => (
              <motion.div className="product-card" key={product._id} whileHover={{ y: -3 }}>
                <img src={getImageUrl(product.image, API_URL)} alt={product.name} />
                <div className="product-body">
                  <h4>{product.name}</h4>
                  <p>{product.description}</p>
                  <strong>{formatCurrency(product.price)}</strong>
                  <span>{product.category}</span>
                  <div className="inline-actions">
                    <button className="btn ghost" onClick={() => handleStartProductEdit(product)}>Edit</button>
                    <button className="btn" onClick={() => handleTogglePopular(product._id)}>
                      {product.isPopular ? "Unmark Popular" : "Mark Popular"}
                    </button>
                    <button className="btn reject" onClick={() => handleDeleteProduct(product._id)}>Delete</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {editingProduct && (
              <motion.div className="edit-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="edit-modal" initial={{ scale: 0.96 }} animate={{ scale: 1 }}>
                  <h3>Edit Product</h3>
                  <input
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Name"
                  />
                  <input
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Description"
                  />
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="Price"
                  />
                  <input
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="Category"
                  />
                  <div className="inline-actions">
                    <button className="btn primary" onClick={handleSaveProductEdit}>Save</button>
                    <button className="btn ghost" onClick={() => setEditingProduct(null)}>Cancel</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    if (activeSection === "orders") {
      return (
        <div className="section-stack">
          <div className="panel-head with-action">
            <h3>Order Management</h3>
            <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)} className="filter-select">
              <option value="All">All Orders</option>
              {ORDER_STATUSES.map((status) => (
                <option value={status} key={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="table-shell">
            <div className="table-row table-head">
              <span>Order</span>
              <span>Customer</span>
              <span>Address</span>
              <span>Payment</span>
              <span>Total</span>
              <span>Status</span>
            </div>
            {filteredOrders.map((order) => (
              <div className="table-row" key={order._id}>
                <span>#{order._id.slice(-6)}</span>
                <span>{order.userId?.name || "Customer"}</span>
                <span>{order.address?.street || order.address || "Address unavailable"}</span>
                <span>{order.paymentMethod || order.paymentStatus || "N/A"}</span>
                <span>{formatCurrency(order.total)}</span>
                <span>
                  <select
                    value={order.orderStatus}
                    onChange={(event) => handleUpdateOrderStatus(order._id, event.target.value)}
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option value={status} key={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeSection === "restaurants") {
      return (
        <div className="section-stack">
          <div className="table-shell">
            <div className="table-row table-head restaurants-head">
              <span>Restaurant</span>
              <span>Owner</span>
              <span>Email</span>
              <span>Cuisine</span>
              <span>Status</span>
            </div>
            {restaurants.map((restaurant) => (
              <div className="table-row restaurants-head" key={restaurant._id}>
                <span>{restaurant.name}</span>
                <span>{restaurant.adminId?.name || "Admin"}</span>
                <span>{restaurant.adminId?.email || "-"}</span>
                <span>{restaurant.cuisine?.join(", ") || "-"}</span>
                <span>{restaurant.isActive ? "Active" : "Inactive"}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeSection === "users") {
      return (
        <div className="section-stack">
          <div className="panel-head with-action">
            <h3>User Management</h3>
            <input
              className="search-input"
              placeholder="Search users by name or email"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>

          <div className="table-shell">
            <div className="table-row table-head users-head">
              <span>Name</span>
              <span>Email</span>
              <span>Joined</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {filteredUsers.map((user) => (
              <div className="table-row users-head" key={user._id}>
                <span>{user.name}</span>
                <span>{user.email}</span>
                <span>{new Date(user.createdAt).toLocaleDateString("en-IN")}</span>
                <span>{user.isBlocked ? "Blocked" : "Active"}</span>
                <span>
                  <button className="btn" onClick={() => handleBlockUser(user._id)}>
                    {user.isBlocked ? "Unblock" : "Block"}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeSection === "riders") {
      return (
        <div className="section-stack">
          <div className="metrics-strip">
            <div className="metric-pill">
              <span>Approved Riders</span>
              <strong>{approvedRiders.length}</strong>
            </div>
            <div className="metric-pill">
              <span>Pending Approvals</span>
              <strong>{pendingRiders.length}</strong>
            </div>
          </div>

          <div className="table-shell">
            <div className="table-row table-head riders-head">
              <span>Name</span>
              <span>Email</span>
              <span>Phone</span>
              <span>Rating</span>
              <span>Total Deliveries</span>
            </div>
            {approvedRiders.map((rider) => (
              <div className="table-row riders-head" key={rider._id}>
                <span>{rider.name}</span>
                <span>{rider.email}</span>
                <span>{rider.phone || "-"}</span>
                <span>{rider.rating || "N/A"}</span>
                <span>{rider.totalDeliveries || 0}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeSection === "payments") {
      return (
        <div className="section-stack">
          <div className="glass-panel">
            <div className="panel-head">
              <h3>💳 Payment Transactions</h3>
              <span>{transactions.length} transactions</span>
            </div>
            
            {transactions.length > 0 ? (
              <div className="payment-transactions-table">
                <div className="table-header">
                  <span>Order ID</span>
                  <span>User</span>
                  <span>Amount</span>
                  <span>Method</span>
                  <span>Status</span>
                  <span>Payment Details</span>
                  <span>Date</span>
                </div>
                {transactions.map((txn) => (
                  <div key={txn._id} className="table-row">
                    <span className="mono">{txn.orderId}</span>
                    <span>{txn.user}</span>
                    <span className="amount">₹{txn.amount?.toFixed(2)}</span>
                    <span className="badge">{txn.paymentMethod}</span>
                    <span className={`status-badge ${txn.status.toLowerCase()}`}>
                      {txn.status}
                    </span>
                    <span>
                      {txn.paymentMethod === "UPI" ? (
                        txn.upiId && txn.upiId !== "-" ? (
                          <span className="upi-info">📱 {txn.upiId}</span>
                        ) : (
                          "—"
                        )
                      ) : txn.paymentMethod === "Card" ? (
                        txn.cardBrand && txn.cardLast4 !== "-" ? (
                          <span className="card-info">
                            {txn.cardBrand} •••• {txn.cardLast4}
                          </span>
                        ) : (
                          "—"
                        )
                      ) : (
                        "—"
                      )}
                    </span>
                    <span className="date">
                      {new Date(txn.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                No payment transactions found
              </p>
            )}
          </div>
        </div>
      );
    }

    if (activeSection === "categories") {
      return renderModuleCards("Category Management", "Control food categories displayed to customers.", [
        "Add / edit / delete categories",
        "Category image management",
        "Availability toggles",
        "Sort order and visibility rules",
      ]);
    }

    if (activeSection === "coupons") {
      return renderModuleCards("Coupons & Offers", "Launch and manage discount campaigns.", [
        "Create and expire coupon codes",
        "Usage limits and targeting",
        "Apply to specific foods or restaurants",
        "Campaign performance snapshot",
      ]);
    }

    if (activeSection === "reviews") {
      return renderModuleCards("Reviews & Ratings", "Moderate public feedback and keep quality high.", [
        "View food and restaurant reviews",
        "Remove inappropriate content",
        "Rating trends by restaurant",
        "Flagged review queue",
      ]);
    }

    if (activeSection === "notifications") {
      return renderModuleCards("Notifications", "Broadcast updates to customers, restaurants, and riders.", [
        "New offers and seasonal campaigns",
        "System-wide order update alerts",
        "Audience-based segmentation",
        "Delivery performance announcements",
      ]);
    }

    if (activeSection === "settings") {
      return renderModuleCards("Platform Settings", "Configure core platform behaviors and branding.", [
        "Delivery charges and GST rules",
        "Payment gateway configuration",
        "App branding and contact details",
        "Operational policy controls",
      ]);
    }

    if (activeSection === "analytics") {
      return renderModuleCards("Analytics", "Deep reporting for growth and operations.", [
        "Best selling foods and categories",
        "Peak order hours",
        "Customer growth funnel",
        "Revenue trend reports",
      ]);
    }

    return renderModuleCards("Support / Complaints", "Handle customer and partner issues from one console.", [
      "Complaint and ticket dashboard",
      "Refund and dispute actions",
      "Response SLA tracking",
      "Issue history per customer",
    ]);
  };

  return (
    <div className="admin-shell">
      {toast && <Toast message={toast.message} type={toast.type} />}
      <div className="admin-bg-shape one" />
      <div className="admin-bg-shape two" />

      <aside className="admin-sidebar">
        <div className="brand-box">
          <h1>FoodFlow Admin</h1>
          <p>Premium Control Center</p>
        </div>

        <div className="sidebar-revenue">
          <span>Annual: {formatCurrency(revenueStats.annualRevenue)}</span>
          <span>Weekly: {formatCurrency(revenueStats.weeklyRevenue)}</span>
          <span>Monthly Orders: {compactNumber(revenueStats.monthlyOrders)}</span>
        </div>

        <nav className="sidebar-nav">
          {SECTION_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sidebar-link ${activeSection === item.id ? "active" : ""}`}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header glass-panel">
          <div>
            <h2>{SECTION_ITEMS.find((item) => item.id === activeSection)?.label}</h2>
            <p>
              Admin page for end-to-end food delivery operations: restaurants, food items, orders, users,
              payments, analytics, and support.
            </p>
          </div>
          <div className="header-actions">
            <span>{new Date().toLocaleString("en-IN")}</span>
            <button className="btn reject" onClick={logout}>Logout</button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.section
            key={activeSection}
            className="content-stage"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
          >
            {renderSectionContent()}
          </motion.section>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default AdminDashboard;
