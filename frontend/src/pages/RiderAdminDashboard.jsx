import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { API_URL } from "../config/api";
import "./AdminDashboard.css";

const RIDER_SECTIONS = [
  { id: "dashboard", label: "Rider Dashboard" },
  { id: "management", label: "Rider Management" },
  { id: "assignment", label: "Order Assignment" },
  { id: "tracking", label: "Live Tracking" },
  { id: "history", label: "Delivery History" },
  { id: "earnings", label: "Rider Earnings" },
  { id: "availability", label: "Rider Availability" },
  { id: "performance", label: "Performance Analytics" },
  { id: "ratings", label: "Ratings & Feedback" },
  { id: "notifications", label: "Notifications" },
  { id: "documents", label: "Documents Verification" },
  { id: "support", label: "Rider Support" },
];

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

function RiderAdminDashboard() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("riderToken") || "";  // Changed from localStorage to sessionStorage

  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [riderProfile, setRiderProfile] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [notificationLog, setNotificationLog] = useState([]);

  const [profileForm, setProfileForm] = useState({
    vehicleType: "",
    vehicleNumber: "",
    drivingLicense: "",
    aadhar: "",
    panCard: "",
    address: "",
    city: "",
    pincode: "",
  });

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const clearAlerts = () => {
    setError("");
    setSuccessMessage("");
  };

  const appendNotification = (text) => {
    setNotificationLog((prev) => [{ id: Date.now(), text, time: new Date().toLocaleTimeString("en-IN") }, ...prev].slice(0, 12));
  };

  const fetchProfile = async () => {
    const res = await axios.get(`${API_URL}/api/rider/profile`, authHeaders);
    const profile = res.data?.rider || null;
    setRiderProfile(profile);
    setProfileForm({
      vehicleType: profile?.vehicle?.type || "",
      vehicleNumber: profile?.vehicle?.number || "",
      drivingLicense: profile?.vehicle?.license || "",
      aadhar: profile?.aadhar || "",
      panCard: profile?.panCard || "",
      address: profile?.address?.currentAddress || "",
      city: profile?.address?.city || "",
      pincode: profile?.address?.pincode || "",
    });
  };

  const fetchAvailableOrders = async () => {
    const res = await axios.get(`${API_URL}/api/rider/available-orders`, authHeaders);
    setAvailableOrders(res.data?.orders || []);
  };

  const fetchCurrentOrder = async () => {
    const res = await axios.get(`${API_URL}/api/rider/current-order`, authHeaders);
    setCurrentOrder(res.data?.currentOrder || null);
  };

  const fetchHistory = async () => {
    const res = await axios.get(`${API_URL}/api/rider/order-history`, authHeaders);
    setOrderHistory(res.data?.orderHistory || []);
  };

  const fetchEarnings = async () => {
    const res = await axios.get(`${API_URL}/api/rider/earnings`, authHeaders);
    setEarnings(res.data?.earnings || null);
  };

  const loadSectionData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      clearAlerts();

      if (activeSection === "dashboard") {
        await Promise.all([fetchProfile(), fetchAvailableOrders(), fetchCurrentOrder(), fetchHistory(), fetchEarnings()]);
        return;
      }

      if (activeSection === "management") {
        await fetchProfile();
        return;
      }

      if (activeSection === "assignment") {
        await Promise.all([fetchAvailableOrders(), fetchCurrentOrder()]);
        return;
      }

      if (activeSection === "tracking") {
        await fetchCurrentOrder();
        return;
      }

      if (activeSection === "history") {
        await fetchHistory();
        return;
      }

      if (activeSection === "earnings") {
        await fetchEarnings();
        return;
      }

      if (activeSection === "availability") {
        await fetchProfile();
        return;
      }

      if (activeSection === "performance" || activeSection === "ratings") {
        await Promise.all([fetchProfile(), fetchHistory()]);
        return;
      }

      if (activeSection === "documents") {
        await fetchProfile();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load rider data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/rideradmin-login");
      return;
    }
    loadSectionData();
  }, [token, activeSection]);

  const performanceStats = useMemo(() => {
    const totalDeliveries = riderProfile?.totalDeliveries || 0;
    const totalTracked = orderHistory.length || 1;
    const cancelled = orderHistory.filter((o) => o.orderStatus === "Cancelled").length;
    const delivered = orderHistory.filter((o) => o.orderStatus === "Delivered").length;
    const successRate = totalTracked ? ((delivered / totalTracked) * 100).toFixed(1) : "0.0";
    const cancellationRate = totalTracked ? ((cancelled / totalTracked) * 100).toFixed(1) : "0.0";

    let totalMins = 0;
    let timedCount = 0;
    orderHistory.forEach((order) => {
      if (order.createdAt && order.deliveredAt) {
        const mins = (new Date(order.deliveredAt) - new Date(order.createdAt)) / (1000 * 60);
        if (mins > 0) {
          totalMins += mins;
          timedCount += 1;
        }
      }
    });

    const avgDeliveryTime = timedCount ? (totalMins / timedCount).toFixed(0) : "--";

    return {
      totalDeliveries,
      successRate,
      cancellationRate,
      avgDeliveryTime,
      rating: Number(riderProfile?.rating || 0).toFixed(1),
    };
  }, [orderHistory, riderProfile]);

  const todayCompleted = useMemo(() => {
    const today = new Date().toDateString();
    return orderHistory.filter((order) => order.deliveredAt && new Date(order.deliveredAt).toDateString() === today).length;
  }, [orderHistory]);

  const weeklyEarnings = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return orderHistory.filter((order) => order.deliveredAt && new Date(order.deliveredAt) >= sevenDaysAgo).length * 20;
  }, [orderHistory]);

  const monthlyEarnings = useMemo(() => {
    const now = new Date();
    return orderHistory.filter((order) => {
      if (!order.deliveredAt) return false;
      const d = new Date(order.deliveredAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length * 20;
  }, [orderHistory]);

  const handleAcceptOrder = async (orderId) => {
    try {
      clearAlerts();
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/rider/accept-order/${orderId}`, {}, authHeaders);
      setSuccessMessage(res.data?.message || "Order accepted");
      appendNotification("New order accepted");
      
      // Dispatch event so users see updates in real-time
      window.dispatchEvent(new Event("orderStatusChanged"));
      
      await Promise.all([fetchAvailableOrders(), fetchCurrentOrder(), fetchProfile()]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to accept order");
    } finally {
      setLoading(false);
    }
  };

  const handleIgnoreOrder = async (orderId) => {
    try {
      clearAlerts();
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/rider/ignore-order/${orderId}`, {}, authHeaders);
      setSuccessMessage(res.data?.message || "Order ignored");
      appendNotification("Order skipped by rider");
      await fetchAvailableOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to ignore order");
    } finally {
      setLoading(false);
    }
  };

  const handlePickup = async () => {
    if (!currentOrder?._id) {
      setError("No active order to pickup");
      return;
    }
    try {
      clearAlerts();
      setLoading(true);
      console.log("🚚 Picking up order:", currentOrder._id);
      const res = await axios.post(`${API_URL}/api/rider/pickup-order/${currentOrder._id}`, {}, authHeaders);
      console.log("✅ Pickup response:", res.data);
      setSuccessMessage(res.data?.message || "Order picked up ✅");
      appendNotification("✅ Order picked up by rider");
      
      // Dispatch event so users see updates in real-time
      window.dispatchEvent(new Event("orderStatusChanged"));
      
      await fetchCurrentOrder();
    } catch (err) {
      console.error("❌ Pickup error:", err);
      setError(err.response?.data?.message || err.message || "Failed to pickup order");
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async () => {
    if (!currentOrder?._id) {
      setError("No active order to deliver");
      return;
    }
    try {
      clearAlerts();
      setLoading(true);
      console.log("🚚 Delivering order:", currentOrder._id);
      const res = await axios.post(`${API_URL}/api/rider/deliver-order/${currentOrder._id}`, {}, authHeaders);
      console.log("✅ Delivery response:", res.data);
      setSuccessMessage(res.data?.message || "Order delivered ✅");
      appendNotification("✅ Order delivered successfully");
      
      // Dispatch event so users see updates in real-time
      window.dispatchEvent(new Event("orderStatusChanged"));
      
      await Promise.all([fetchCurrentOrder(), fetchHistory(), fetchEarnings(), fetchProfile()]);
    } catch (err) {
      console.error("❌ Delivery error:", err);
      setError(err.response?.data?.message || err.message || "Failed to deliver order");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      clearAlerts();
      setLoading(true);
      const res = await axios.put(`${API_URL}/api/rider/toggle-availability`, {}, authHeaders);
      setSuccessMessage(res.data?.message || "Availability updated");
      appendNotification("Availability status updated");
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update availability");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (event) => {
    event.preventDefault();
    try {
      clearAlerts();
      setLoading(true);
      await axios.put(
        `${API_URL}/api/rider/profile`,
        {
          address: {
            currentAddress: profileForm.address,
            city: profileForm.city,
            pincode: profileForm.pincode,
          },
          vehicle: {
            type: profileForm.vehicleType,
            number: profileForm.vehicleNumber,
            license: profileForm.drivingLicense,
          },
          aadhar: profileForm.aadhar,
          panCard: profileForm.panCard,
        },
        authHeaders
      );
      setSuccessMessage("Rider profile updated successfully");
      appendNotification("Profile details updated");
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSupportAction = (text) => {
    setSuccessMessage(text);
    appendNotification(text);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("riderToken");  // Changed from localStorage to sessionStorage
    sessionStorage.removeItem("riderRole");   // Changed from localStorage to sessionStorage
    sessionStorage.removeItem("riderName");   // Changed from localStorage to sessionStorage
    sessionStorage.removeItem("riderId");     // Changed from localStorage to sessionStorage
    sessionStorage.removeItem("riderData");   // Changed from localStorage to sessionStorage
    navigate("/rideradmin-login");
  };

  const dashboardCards = [
    { title: "Total Riders", value: 1 },
    { title: "Active Riders", value: riderProfile?.isAvailable ? 1 : 0 },
    { title: "Riders On Delivery", value: currentOrder ? 1 : 0 },
    { title: "Completed Deliveries Today", value: todayCompleted },
    { title: "Cancelled Deliveries", value: orderHistory.filter((o) => o.orderStatus === "Cancelled").length },
    { title: "Average Delivery Time", value: performanceStats.avgDeliveryTime === "--" ? "--" : `${performanceStats.avgDeliveryTime} mins` },
  ];

  const renderContent = () => {
    if (loading && !riderProfile && activeSection !== "support" && activeSection !== "notifications") {
      return <div className="admin-loader">Loading rider dashboard...</div>;
    }

    if (activeSection === "dashboard") {
      return (
        <div className="section-stack">
          <div className="metrics-strip">
            <div className="metric-pill"><span>Daily Earnings</span><strong>{formatCurrency(earnings?.today || 0)}</strong></div>
            <div className="metric-pill"><span>Weekly Earnings</span><strong>{formatCurrency(weeklyEarnings)}</strong></div>
            <div className="metric-pill"><span>Monthly Earnings</span><strong>{formatCurrency(monthlyEarnings)}</strong></div>
            <div className="metric-pill"><span>Current Status</span><strong>{riderProfile?.isAvailable ? "Online" : "Offline"}</strong></div>
          </div>

          <div className="stat-grid">
            {dashboardCards.map((card) => (
              <motion.div key={card.title} className="stat-card" whileHover={{ y: -4 }}>
                <p>{card.title}</p>
                <h3>{card.value}</h3>
              </motion.div>
            ))}
          </div>

          <div className="table-grid two-col">
            <div className="glass-panel">
              <div className="panel-head"><h3>Rider Performance</h3></div>
              <div className="simple-list">
                <div className="simple-item"><strong>Total Deliveries</strong><strong>{performanceStats.totalDeliveries}</strong></div>
                <div className="simple-item"><strong>Success Rate</strong><strong>{performanceStats.successRate}%</strong></div>
                <div className="simple-item"><strong>Average Delivery Time</strong><strong>{performanceStats.avgDeliveryTime === "--" ? "--" : `${performanceStats.avgDeliveryTime} min`}</strong></div>
                <div className="simple-item"><strong>Rating</strong><strong>{performanceStats.rating}/5</strong></div>
              </div>
            </div>

            <div className="glass-panel">
              <div className="panel-head"><h3>Daily Deliveries</h3></div>
              <div className="simple-list">
                {orderHistory.slice(0, 6).map((order) => (
                  <div className="simple-item" key={order._id}>
                    <div>
                      <strong>#{order._id.slice(-6)}</strong>
                      <p>{order.restaurantId?.name || "Restaurant"}</p>
                    </div>
                    <div>
                      <strong>{order.orderStatus}</strong>
                      <p>{order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString("en-IN") : "In progress"}</p>
                    </div>
                  </div>
                ))}
                {!orderHistory.length && <div className="empty-state">No deliveries yet.</div>}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "management") {
      return (
        <div className="section-stack">
          <form className="glass-panel add-form" onSubmit={handleUpdateProfile}>
            <input value={riderProfile?.name || ""} disabled />
            <input value={riderProfile?.phone || ""} disabled />
            <input placeholder="Vehicle Type" value={profileForm.vehicleType} onChange={(e) => setProfileForm((p) => ({ ...p, vehicleType: e.target.value }))} />
            <input placeholder="Vehicle Number" value={profileForm.vehicleNumber} onChange={(e) => setProfileForm((p) => ({ ...p, vehicleNumber: e.target.value }))} />
            <input placeholder="Driving License" value={profileForm.drivingLicense} onChange={(e) => setProfileForm((p) => ({ ...p, drivingLicense: e.target.value }))} />
            <input placeholder="Address" value={profileForm.address} onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))} />
            <input placeholder="City" value={profileForm.city} onChange={(e) => setProfileForm((p) => ({ ...p, city: e.target.value }))} />
            <input placeholder="Pincode" value={profileForm.pincode} onChange={(e) => setProfileForm((p) => ({ ...p, pincode: e.target.value }))} />
            <button className="btn primary" type="submit">Save Rider Profile</button>
          </form>
        </div>
      );
    }

    if (activeSection === "assignment") {
      return (
        <div className="section-stack">
          <div className="panel-head with-action">
            <h3>Unassigned Orders</h3>
            <button className="btn" onClick={fetchAvailableOrders}>Refresh</button>
          </div>
          <div className="table-shell">
            <div className="table-row table-head">
              <span>Order</span><span>Restaurant</span><span>Customer</span><span>Address</span><span>Total</span><span>Action</span>
            </div>
            {availableOrders.map((order) => (
              <div className="table-row" key={order._id}>
                <span>#{order._id.slice(-6)}</span>
                <span>{order.restaurantId?.name || "Restaurant"}</span>
                <span>{order.userId?.name || order.deliveryAddress?.fullName || "Customer"}</span>
                <span>{order.deliveryAddress?.addressLine || "Address unavailable"}</span>
                <span>{formatCurrency(order.total)}</span>
                <span className="inline-actions">
                  <button className="btn approve" onClick={() => handleAcceptOrder(order._id)}>Assign Me</button>
                  <button className="btn" onClick={() => handleIgnoreOrder(order._id)}>Skip</button>
                </span>
              </div>
            ))}
            {!availableOrders.length && <div className="empty-state">No unassigned orders available.</div>}
          </div>

          <div className="glass-panel">
            <div className="panel-head"><h3>Current Assignment</h3></div>
            <div className="simple-list">
              {currentOrder ? (
                <div className="simple-item">
                  <div>
                    <strong>#{currentOrder._id.slice(-6)}</strong>
                    <p>Status: {currentOrder.orderStatus}</p>
                  </div>
                  <div className="inline-actions">
                    <button 
                      className="btn" 
                      onClick={handlePickup}
                      disabled={loading || currentOrder?.orderStatus !== "Ready"}
                      title={currentOrder?.orderStatus !== "Ready" ? "Order must be in Ready status" : "Click to pick up order"}
                      style={{ opacity: (loading || currentOrder?.orderStatus !== "Ready") ? 0.6 : 1, cursor: (loading || currentOrder?.orderStatus !== "Ready") ? 'not-allowed' : 'pointer' }}
                    >
                      {loading && currentOrder?.orderStatus === "Ready" ? "⏳ Processing..." : "📍 Pickup Order"}
                    </button>
                    <button 
                      className="btn approve" 
                      onClick={handleDeliver}
                      disabled={loading || currentOrder?.orderStatus !== "Out for Delivery"}
                      title={currentOrder?.orderStatus !== "Out for Delivery" ? "Order must be Out for Delivery" : "Click to deliver order"}
                      style={{ opacity: (loading || currentOrder?.orderStatus !== "Out for Delivery") ? 0.6 : 1, cursor: (loading || currentOrder?.orderStatus !== "Out for Delivery") ? 'not-allowed' : 'pointer' }}
                    >
                      {loading && currentOrder?.orderStatus === "Out for Delivery" ? "⏳ Processing..." : "✅ Deliver Order"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-state">No active assignment.</div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "tracking") {
      const statusSteps = ["Order placed", "Restaurant preparing", "Ready for pickup", "Picked up by rider", "Out for delivery", "Delivered"];
      return (
        <div className="section-stack">
          <div className="glass-panel">
            <div className="panel-head"><h3>Live Rider Tracking</h3><span>Map integration placeholder</span></div>
            <div className="simple-list">
              <div className="module-point">Rider Location: {currentOrder ? "Live tracking active" : "No active delivery"}</div>
              <div className="module-point">Route Monitoring: Enable Google Maps API in next step for real-time routing.</div>
              <div className="module-point">Delivery Progress:
                <div className="module-points">
                  {statusSteps.map((step) => (
                    <div className="module-point" key={step}>{step}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "history") {
      return (
        <div className="section-stack">
          <div className="table-shell">
            <div className="table-row table-head">
              <span>Order ID</span><span>Restaurant</span><span>Customer</span><span>Delivery Time</span><span>Distance</span><span>Earnings</span>
            </div>
            {orderHistory.map((order) => (
              <div className="table-row" key={order._id}>
                <span>#{order._id.slice(-6)}</span>
                <span>{order.restaurantId?.name || "Restaurant"}</span>
                <span>{order.userId?.name || "Customer"}</span>
                <span>{order.deliveredAt ? new Date(order.deliveredAt).toLocaleString("en-IN") : "In progress"}</span>
                <span>--</span>
                <span>{formatCurrency(20)}</span>
              </div>
            ))}
            {!orderHistory.length && <div className="empty-state">No delivery history yet.</div>}
          </div>
        </div>
      );
    }

    if (activeSection === "earnings") {
      return (
        <div className="section-stack">
          <div className="metrics-strip">
            <div className="metric-pill"><span>Daily Earnings</span><strong>{formatCurrency(earnings?.today || 0)}</strong></div>
            <div className="metric-pill"><span>Weekly Earnings</span><strong>{formatCurrency(weeklyEarnings)}</strong></div>
            <div className="metric-pill"><span>Monthly Earnings</span><strong>{formatCurrency(monthlyEarnings)}</strong></div>
            <div className="metric-pill"><span>Total Earnings</span><strong>{formatCurrency(earnings?.total || 0)}</strong></div>
          </div>
          <div className="module-shell">
            <h3>Earning Breakdown</h3>
            <p>Delivery fee, distance fee, and incentives can be configured from platform payout policy.</p>
            <div className="module-points">
              <div className="module-point">Base delivery fee: {formatCurrency(40)}</div>
              <div className="module-point">Distance fee: {formatCurrency(10)} / km</div>
              <div className="module-point">Incentive pool: Dynamic by performance</div>
              <div className="module-point">Estimated sample payout: {formatCurrency(80)}</div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "availability") {
      return (
        <div className="section-stack">
          <div className="glass-panel">
            <div className="panel-head"><h3>Rider Availability</h3><span>Live status control</span></div>
            <div className="simple-list">
              <div className="simple-item"><strong>Status</strong><strong>{riderProfile?.isAvailable ? "Online" : "Offline"}</strong></div>
              <div className="simple-item"><strong>Busy</strong><strong>{currentOrder ? "On Delivery" : "Available"}</strong></div>
              <div className="inline-actions">
                <button className="btn primary" onClick={handleToggleAvailability} disabled={loading}>Toggle Availability</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "performance") {
      return (
        <div className="section-stack">
          <div className="table-grid two-col">
            <div className="glass-panel">
              <div className="panel-head"><h3>Performance Metrics</h3></div>
              <div className="simple-list">
                <div className="simple-item"><strong>Total deliveries</strong><strong>{performanceStats.totalDeliveries}</strong></div>
                <div className="simple-item"><strong>Delivery success rate</strong><strong>{performanceStats.successRate}%</strong></div>
                <div className="simple-item"><strong>Average delivery time</strong><strong>{performanceStats.avgDeliveryTime === "--" ? "--" : `${performanceStats.avgDeliveryTime} min`}</strong></div>
                <div className="simple-item"><strong>Customer rating</strong><strong>{performanceStats.rating}/5</strong></div>
                <div className="simple-item"><strong>Cancellation rate</strong><strong>{performanceStats.cancellationRate}%</strong></div>
              </div>
            </div>
            <div className="glass-panel">
              <div className="panel-head"><h3>Analytics Notes</h3></div>
              <div className="simple-list">
                <div className="module-point">Peak delivery slot tracking can be expanded with hourly time buckets.</div>
                <div className="module-point">Rider efficiency can include distance and waiting-time KPIs.</div>
                <div className="module-point">Performance scorecards are now connected to real rider history data.</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "ratings") {
      return (
        <div className="section-stack">
          <div className="glass-panel">
            <div className="panel-head"><h3>Ratings & Feedback</h3></div>
            <div className="simple-list">
              <div className="simple-item"><strong>Current Rating</strong><strong>{performanceStats.rating}/5</strong></div>
              <div className="module-point">Complaints queue is currently empty. Connect complaint APIs when available.</div>
              <div className="module-point">Low-rated rider warning automation can be configured here.</div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "notifications") {
      return (
        <div className="section-stack">
          <div className="glass-panel">
            <div className="panel-head with-action">
              <h3>Rider Notifications</h3>
              <div className="inline-actions">
                <button className="btn" onClick={() => handleSupportAction("New order assigned notification sent")}>Send Order Alert</button>
                <button className="btn" onClick={() => handleSupportAction("Payment update notification sent")}>Send Payment Update</button>
                <button className="btn" onClick={() => handleSupportAction("System announcement sent")}>Send Announcement</button>
              </div>
            </div>
            <div className="simple-list">
              {notificationLog.map((item) => (
                <div className="simple-item" key={item.id}><strong>{item.text}</strong><p>{item.time}</p></div>
              ))}
              {!notificationLog.length && <div className="empty-state">No notifications sent yet.</div>}
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "documents") {
      return (
        <div className="section-stack">
          <form className="glass-panel add-form" onSubmit={handleUpdateProfile}>
            <input placeholder="Driving License" value={profileForm.drivingLicense} onChange={(e) => setProfileForm((p) => ({ ...p, drivingLicense: e.target.value }))} />
            <input placeholder="Vehicle Registration Number" value={profileForm.vehicleNumber} onChange={(e) => setProfileForm((p) => ({ ...p, vehicleNumber: e.target.value }))} />
            <input placeholder="Aadhar" value={profileForm.aadhar} onChange={(e) => setProfileForm((p) => ({ ...p, aadhar: e.target.value }))} />
            <input placeholder="PAN" value={profileForm.panCard} onChange={(e) => setProfileForm((p) => ({ ...p, panCard: e.target.value }))} />
            <div className="module-point">Verification Status: {riderProfile?.kycStatus || "Pending"}</div>
            <button className="btn primary" type="submit">Save Document Details</button>
          </form>
        </div>
      );
    }

    return (
      <div className="section-stack">
        <div className="module-shell">
          <h3>Rider Support</h3>
          <p>Handle app issues, payment disputes, order problems, and emergency support.</p>
          <div className="inline-actions">
            <button className="btn" onClick={() => handleSupportAction("Support ticket created for app issue")}>App Issue</button>
            <button className="btn" onClick={() => handleSupportAction("Payment dispute ticket created")}>Payment Dispute</button>
            <button className="btn" onClick={() => handleSupportAction("Order problem ticket created")}>Order Problem</button>
            <button className="btn reject" onClick={() => handleSupportAction("Emergency support triggered")}>Emergency Support</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-shell">
      <div className="admin-bg-shape one" />
      <div className="admin-bg-shape two" />

      <aside className="admin-sidebar">
        <div className="brand-box">
          <h1>Rider Admin</h1>
          <p>Delivery Operations Console</p>
        </div>

        <div className="sidebar-revenue">
          <span>Today: {formatCurrency(earnings?.today || 0)}</span>
          <span>Total: {formatCurrency(earnings?.total || 0)}</span>
          <span>Status: {riderProfile?.isAvailable ? "Online" : "Offline"}</span>
        </div>

        <nav className="sidebar-nav">
          {RIDER_SECTIONS.map((item) => (
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
            <h2>{RIDER_SECTIONS.find((item) => item.id === activeSection)?.label}</h2>
            <p>Rider operations dashboard with delivery flow, earnings, availability, documents, support, and performance modules.</p>
          </div>
          <div className="header-actions">
            <span>{new Date().toLocaleString("en-IN")}</span>
            <button className="btn reject" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        {error && <div className="admin-loader" style={{ borderColor: "rgba(255,107,121,0.6)", color: "#ffc1c6" }}>{error}</div>}
        {successMessage && <div className="admin-loader" style={{ borderColor: "rgba(69,211,156,0.6)", color: "#b8f4dd" }}>{successMessage}</div>}

        <AnimatePresence mode="wait">
          <motion.section
            key={activeSection}
            className="content-stage"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {renderContent()}
          </motion.section>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default RiderAdminDashboard;
