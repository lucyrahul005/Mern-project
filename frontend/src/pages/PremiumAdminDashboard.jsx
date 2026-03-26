import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";
import { API_URL } from "../config/api";
import Toast from "../components/Toast";
import "./PremiumAdminDashboard.css";

// ============ REVENUE CHART DATA ============
const revenueChartData = [
  { date: "Mon", revenue: 4000, orders: 240 },
  { date: "Tue", revenue: 3000, orders: 221 },
  { date: "Wed", revenue: 2000, orders: 229 },
  { date: "Thu", revenue: 2780, orders: 200 },
  { date: "Fri", revenue: 1890, orders: 229 },
  { date: "Sat", revenue: 2390, orders: 200 },
  { date: "Sun", revenue: 3490, orders: 310 },
];

const topRestaurantsData = [
  { name: "Spice Garden", orders: 1240, revenue: 52000 },
  { name: "Pizza Palace", orders: 980, revenue: 45000 },
  { name: "Biryani House", orders: 876, revenue: 38000 },
  { name: "Burger Zone", orders: 754, revenue: 32000 },
];

const topFoodsData = [
  { name: "Biryani", sales: 450 },
  { name: "Pizza", sales: 380 },
  { name: "Burgers", sales: 290 },
  { name: "Desserts", sales: 180 },
];

const COLORS = ["#8b5cf6", "#ec4899", "#06b6d4", "#f59e0b"];

// ============ KPI CARD COMPONENT ============
const KPICard = ({ icon, title, value, change, gradient }) => (
  <motion.div
    whileHover={{ translateY: -5 }}
    className={`kpi-card gradient-${gradient}`}
  >
    <div className="kpi-icon">{icon}</div>
    <div className="kpi-content">
      <p className="kpi-title">{title}</p>
      <h3 className="kpi-value">{value}</h3>
      <span className={`kpi-change ${change > 0 ? "positive" : "negative"}`}>
        {change > 0 ? "↑" : "↓"} {Math.abs(change)}% from last week
      </span>
    </div>
  </motion.div>
);

// ============ STATUS BADGE COMPONENT ============
const StatusBadge = ({ status }) => {
  const statusMap = {
    "Delivered": { class: "badge-delivered", icon: "✓" },
    "Pending": { class: "badge-pending", icon: "○" },
    "Cancelled": { class: "badge-cancelled", icon: "✕" },
    "Preparing": { class: "badge-preparing", icon: "⟳" },
  };
  const badge = statusMap[status] || statusMap["Pending"];
  return <span className={`status-badge ${badge.class}`}>{badge.icon} {status}</span>;
};

// ============ RECENT ORDERS TABLE ============
const RecentOrdersTable = ({ orders }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
    <div className="card-header">
      <h3>📦 Recent Orders</h3>
    </div>
    <div className="table-wrapper">
      <table className="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.slice(0, 5).map(order => (
            <motion.tr
              key={order._id}
              whileHover={{ backgroundColor: "rgba(139, 92, 246, 0.1)" }}
            >
              <td className="order-id">#{order._id.slice(-6)}</td>
              <td>{order.userId?.name || "Guest"}</td>
              <td className="amount">₹{order.total || 0}</td>
              <td><StatusBadge status={order.orderStatus} /></td>
              <td>{new Date(order.orderDate).toLocaleDateString()}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
);

// ============ TOP RESTAURANTS SECTION ============
const TopRestaurants = ({ restaurants }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
    <div className="card-header">
      <h3>🏆 Top Restaurants</h3>
    </div>
    <div className="restaurants-grid">
      {restaurants.slice(0, 4).map((rest, idx) => (
        <motion.div
          key={idx}
          whileHover={{ scale: 1.02 }}
          className="restaurant-item"
        >
          <div className="rank-badge">#{idx + 1}</div>
          {rest.image && <img src={rest.image} alt={rest.name} className="rest-thumb" />}
          <h4>{rest.name}</h4>
          <p className="rest-stats">
            <span>⭐ {rest.rating || "4.5"}</span> • <span>{rest.totalOrders || 0} orders</span>
          </p>
          <p className="rest-revenue">₹{(rest.totalRevenue || 0).toLocaleString()}</p>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

// ============ MAIN PREMIUM ADMIN DASHBOARD ============
function PremiumAdminDashboard() {
  const token = sessionStorage.getItem("token") || "";
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [toast, setToast] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  // Data states
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoadingData(true);
    try {
      const [statsRes, ordersRes, restaurantsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats`, authHeaders).catch(() => ({ data: null })),
        axios.get(`${API_URL}/api/admin/orders`, authHeaders).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/admin/restaurants`, authHeaders).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/admin/users`, authHeaders).catch(() => ({ data: [] })),
      ]);

      setStats(statsRes.data);
      setOrders(ordersRes.data);
      setRestaurants(restaurantsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setToast({ message: "Error loading dashboard data", type: "error" });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [authHeaders, token]);

  const logout = () => {
    sessionStorage.removeItem("token");
    window.location.href = "/admin-login";
  };

  const menuItems = [
    { icon: "📊", label: "Dashboard" },
    { icon: "🍽️", label: "Orders" },
    { icon: "🏪", label: "Restaurants" },
    { icon: "🚴", label: "Riders" },
    { icon: "👤", label: "Users" },
    { icon: "💳", label: "Payments" },
    { icon: "📈", label: "Analytics" },
    { icon: "⭐", label: "Reviews" },
    { icon: "⚙️", label: "Settings" },
  ];

  return (
    <div className={`premium-dashboard ${darkMode ? "dark" : "light"}`}>
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* ============ SIDEBAR ============ */}
      <aside className={`premium-sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="logo-icon">🍴</div>
            {sidebarOpen && <h1>FoodFlow</h1>}
          </div>
          <button
            className="collapse-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, idx) => (
            <motion.a
              key={idx}
              href="#"
              whileHover={{ x: 5 }}
              className="nav-item"
              onClick={(e) => e.preventDefault()}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </motion.a>
          ))}
        </nav>

        <button className="logout-btn" onClick={logout}>
          🚪 {sidebarOpen ? "Logout" : ""}
        </button>
      </aside>

      {/* ============ MAIN CONTENT ============ */}
      <div className="premium-main">
        {/* ============ TOP NAVBAR ============ */}
        <header className="premium-navbar">
          <div className="navbar-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search orders, restaurants..." />
            </div>
          </div>

          <div className="navbar-right">
            <motion.button
              whileHover={{ scale: 1.1 }}
              className="navbar-icon-btn"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? "🌙" : "☀️"}
            </motion.button>

            <motion.button whileHover={{ scale: 1.1 }} className="navbar-icon-btn">
              🔔
              <span className="notification-badge">3</span>
            </motion.button>

            <div className="admin-profile">
              <img src="https://via.placeholder.com/40" alt="Admin" className="profile-avatar" />
              <motion.button whileHover={{ scale: 1.05 }} className="profile-menu">
                ▼
              </motion.button>
            </div>
          </div>
        </header>

        {/* ============ DASHBOARD CONTENT ============ */}
        <main className="dashboard-content">
          {loadingData ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Page Title */}
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="page-header">
                <h1>Dashboard Overview</h1>
                <p>Welcome back, Admin! Here's your platform's performance.</p>
              </motion.div>

              {/* KPI Cards */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
                className="kpi-grid"
              >
                <KPICard
                  icon="📦"
                  title="Total Orders"
                  value={stats?.totalOrders || 0}
                  change={12}
                  gradient="purple"
                />
                <KPICard
                  icon="💰"
                  title="Total Revenue"
                  value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
                  change={18}
                  gradient="pink"
                />
                <KPICard
                  icon="👥"
                  title="Active Users"
                  value={stats?.totalUsers || 0}
                  change={8}
                  gradient="cyan"
                />
                <KPICard
                  icon="🏪"
                  title="Restaurants"
                  value={stats?.totalRestaurants || 0}
                  change={5}
                  gradient="amber"
                />
                <KPICard
                  icon="🚴"
                  title="Delivery Partners"
                  value="45"
                  change={3}
                  gradient="green"
                />
              </motion.div>

              {/* Charts Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="charts-grid"
              >
                {/* Revenue & Orders Chart */}
                <div className="glass-card chart-card">
                  <div className="card-header">
                    <h3>📊 Revenue & Orders</h3>
                    <select className="chart-period">
                      <option>This Week</option>
                      <option>This Month</option>
                      <option>This Year</option>
                    </select>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis stroke="rgba(255,255,255,0.5)" />
                      <YAxis stroke="rgba(255,255,255,0.5)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(20, 20, 40, 0.95)",
                          border: "1px solid rgba(139, 92, 246, 0.3)",
                          borderRadius: "12px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={{ fill: "#8b5cf6", r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="orders"
                        stroke="#ec4899"
                        strokeWidth={3}
                        dot={{ fill: "#ec4899", r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Selling Foods */}
                <div className="glass-card chart-card">
                  <div className="card-header">
                    <h3>🍔 Top Selling Foods</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={topFoodsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, sales }) => `${name}: ${sales}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="sales"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Recent Orders & Top Restaurants */}
              <div className="bottom-section">
                <RecentOrdersTable orders={orders} />
                <TopRestaurants restaurants={restaurants} />
              </div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="quick-stats"
              >
                <div className="glass-card stat-box">
                  <h4>🟢 Pending Orders</h4>
                  <p className="stat-value">{stats?.pendingOrders || 0}</p>
                </div>
                <div className="glass-card stat-box">
                  <h4>✓ Delivered Orders</h4>
                  <p className="stat-value">{stats?.deliveredOrders || 0}</p>
                </div>
                <div className="glass-card stat-box">
                  <h4>✕ Cancelled Orders</h4>
                  <p className="stat-value">{stats?.cancelledOrders || 0}</p>
                </div>
                <div className="glass-card stat-box">
                  <h4>⭐ Avg Rating</h4>
                  <p className="stat-value">4.8</p>
                </div>
              </motion.div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default PremiumAdminDashboard;
