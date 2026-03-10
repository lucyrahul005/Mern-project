import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
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
import "./RestaurantAdminDashboard.css";

const ORDER_FLOW = ["Placed", "Preparing", "Ready", "Out for Delivery", "Delivered", "Cancelled"];

const DASHBOARD_SECTIONS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "orders", label: "Order Management" },
  { id: "menu", label: "Menu Management" },
  { id: "categories", label: "Category Management" },
  { id: "profile", label: "Restaurant Profile" },
  { id: "history", label: "Order History" },
  { id: "earnings", label: "Earnings & Payments" },
  { id: "reviews", label: "Reviews & Ratings" },
  { id: "inventory", label: "Inventory" },
  { id: "offers", label: "Offers & Discounts" },
  { id: "notifications", label: "Notifications" },
  { id: "availability", label: "Availability" },
];

const defaultMenuForm = {
  id: "",
  name: "",
  description: "",
  price: "",
  category: "",
  isVeg: false,
  preparationTime: "20 min",
  isAvailable: true,
  imageFile: null,
};

const defaultOfferForm = {
  title: "",
  offerType: "Percentage",
  value: "",
  applyTo: "All Items",
  expiryDate: "",
};

const defaultInventoryForm = {
  ingredient: "",
  quantity: "",
  threshold: "",
  unit: "kg",
  linkedProductId: "",
};

const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const normalizeStatusLabel = (status = "") => {
  if (status === "Placed") return "New Order";
  if (status === "Ready") return "Ready for Pickup";
  if (status === "Out for Delivery") return "Picked up by Rider";
  return status;
};

const parseSafe = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
};

function RestaurantAdminDashboard() {
  const token = localStorage.getItem("restaurantAdminToken") || "";
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [restaurantProfile, setRestaurantProfile] = useState(null);
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
  });
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [salesChart, setSalesChart] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [revenueDaily, setRevenueDaily] = useState([]);
  const [revenueWeekly, setRevenueWeekly] = useState([]);
  const [revenueMonthly, setRevenueMonthly] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [menuForm, setMenuForm] = useState(defaultMenuForm);
  const [menuSaving, setMenuSaving] = useState(false);

  const [categories, setCategories] = useState(["Biryani", "Pizza", "Burgers", "Starters", "Desserts", "Beverages"]);
  const [categoryInput, setCategoryInput] = useState("");
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(-1);

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    cuisineText: "",
    openingTime: "10:00",
    closingTime: "23:00",
    logoFile: null,
    bannerFile: null,
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [ordersFilter, setOrdersFilter] = useState("Incoming");
  const [historyFilter, setHistoryFilter] = useState("All");

  const [offers, setOffers] = useState([]);
  const [offerForm, setOfferForm] = useState(defaultOfferForm);

  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryForm, setInventoryForm] = useState(defaultInventoryForm);

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    newOrderAlert: true,
    orderStatusAlert: true,
  });
  const [localAlerts, setLocalAlerts] = useState([]);

  const [busyMode, setBusyMode] = useState(false);
  const [reviewResponses, setReviewResponses] = useState({});

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  const previousOrderStatusRef = useRef({});

  const persistenceKey = useMemo(() => {
    const id = restaurantProfile?._id || "default";
    return `restaurant_admin_dashboard_${id}`;
  }, [restaurantProfile?._id]);

  const addAlert = (title, message, type = "General") => {
    setLocalAlerts((prev) => [
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        title,
        message,
        type,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const fetchBundle = async () => {
    if (!token) {
      window.location.href = "/restaurantadmin-login";
      return;
    }

    setLoading(true);
    try {
      const profileRes = await axios.get(`${API_URL}/api/restaurant-admin/profile`, authHeaders);
      const currentProfile = profileRes.data;
      setRestaurantProfile(currentProfile);

      const requests = await Promise.allSettled([
        axios.get(`${API_URL}/api/restaurant-admin/dashboard/stats`, authHeaders),
        axios.get(`${API_URL}/api/restaurant-admin/orders?limit=300`, authHeaders),
        axios.get(`${API_URL}/api/restaurant-admin/menu`, authHeaders),
        axios.get(`${API_URL}/api/restaurant-admin/dashboard/sales-chart?days=14`, authHeaders),
        axios.get(`${API_URL}/api/restaurant-admin/dashboard/top-items`, authHeaders),
        axios.get(`${API_URL}/api/restaurant-admin/dashboard/revenue?period=daily`, authHeaders),
        axios.get(`${API_URL}/api/restaurant-admin/dashboard/revenue?period=weekly`, authHeaders),
        axios.get(`${API_URL}/api/restaurant-admin/dashboard/revenue?period=monthly`, authHeaders),
        axios.get(`${API_URL}/api/restaurant-admin/notifications/settings`, authHeaders),
        axios.get(`${API_URL}/api/reviews/restaurant/${currentProfile._id}`, authHeaders),
        axios.get(`${API_URL}/api/restaurant-admin/notifications/orders`, authHeaders),
      ]);

      const pick = (index, fallback) =>
        requests[index].status === "fulfilled" ? requests[index].value.data : fallback;

      const statsData = pick(0, {});
      const ordersData = pick(1, { orders: [] });
      const menuData = pick(2, { products: [] });
      const salesData = pick(3, []);
      const topItemsData = pick(4, []);
      const revDailyData = pick(5, []);
      const revWeeklyData = pick(6, []);
      const revMonthlyData = pick(7, []);
      const notifSettingsData = pick(8, notificationSettings);
      const reviewsData = pick(9, { reviews: [] });
      const orderNotificationsData = pick(10, { notifications: [] });

      setStats({
        todayOrders: Number(statsData.todayOrders) || 0,
        todayRevenue: Number(statsData.todayRevenue) || 0,
        totalOrders: Number(statsData.totalOrders) || 0,
        pendingOrders: Number(statsData.pendingOrders) || 0,
        completedOrders: Number(statsData.completedOrders) || 0,
        totalRevenue: Number(statsData.totalRevenue) || 0,
      });
      setOrders(ordersData.orders || []);
      setMenuItems(menuData.products || []);
      setSalesChart(Array.isArray(salesData) ? salesData : []);
      setTopItems(Array.isArray(topItemsData) ? topItemsData : []);
      setRevenueDaily(Array.isArray(revDailyData) ? revDailyData : []);
      setRevenueWeekly(Array.isArray(revWeeklyData) ? revWeeklyData : []);
      setRevenueMonthly(Array.isArray(revMonthlyData) ? revMonthlyData : []);
      setNotificationSettings(notifSettingsData || notificationSettings);
      setReviews(reviewsData.reviews || []);
      
      // Set local alerts from order notifications
      const formattedAlerts = (orderNotificationsData.notifications || []).map((notif) => ({
        id: notif._id,
        title: notif.title,
        message: notif.message,
        type: notif.type || "General",
        createdAt: new Date(notif.createdAt).toISOString(),
      }));
      if (formattedAlerts.length > 0) {
        setLocalAlerts(formattedAlerts);
      }
    } catch (error) {
      console.error("Restaurant admin load error:", error?.response?.data || error.message);
      setToast(error?.response?.data?.message || "Failed to load restaurant dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundle();
  }, []);

  useEffect(() => {
    // Listen for payment completion to refresh earnings and notifications
    const handlePaymentCompleted = () => {
      console.log("💰 Payment completed - refreshing dashboard data...");
      fetchBundle();
    };

    window.addEventListener("paymentCompleted", handlePaymentCompleted);

    return () => {
      window.removeEventListener("paymentCompleted", handlePaymentCompleted);
    };
  }, [token, restaurantProfile]);

  useEffect(() => {
    if (!restaurantProfile) return;

    const persisted = parseSafe(localStorage.getItem(persistenceKey), {
      categories: ["Biryani", "Pizza", "Burgers", "Starters", "Desserts", "Beverages"],
      offers: [],
      inventoryItems: [],
      localAlerts: [],
      busyMode: false,
      reviewResponses: {},
    });

    setCategories(persisted.categories || []);
    setOffers(persisted.offers || []);
    setInventoryItems(persisted.inventoryItems || []);
    setLocalAlerts(persisted.localAlerts || []);
    setBusyMode(Boolean(persisted.busyMode));
    setReviewResponses(persisted.reviewResponses || {});
  }, [persistenceKey, restaurantProfile]);

  useEffect(() => {
    if (!restaurantProfile) return;

    localStorage.setItem(
      persistenceKey,
      JSON.stringify({
        categories,
        offers,
        inventoryItems,
        localAlerts,
        busyMode,
        reviewResponses,
      })
    );
  }, [categories, offers, inventoryItems, localAlerts, busyMode, reviewResponses, persistenceKey, restaurantProfile]);

  useEffect(() => {
    if (!restaurantProfile) return;

    setProfileForm((prev) => ({
      ...prev,
      name: restaurantProfile.name || "",
      phone: restaurantProfile.phone || "",
      email: restaurantProfile.email || "",
      street: restaurantProfile.address?.street || "",
      city: restaurantProfile.address?.city || "",
      state: restaurantProfile.address?.state || "",
      pincode: restaurantProfile.address?.pincode || "",
      cuisineText: Array.isArray(restaurantProfile.cuisine) ? restaurantProfile.cuisine.join(", ") : "",
      openingTime: restaurantProfile.operatingHours?.monday?.open || "10:00",
      closingTime: restaurantProfile.operatingHours?.monday?.close || "23:00",
      logoFile: null,
      bannerFile: null,
    }));
  }, [restaurantProfile]);

  useEffect(() => {
    const nextMap = {};
    let initialized = Object.keys(previousOrderStatusRef.current).length > 0;

    orders.forEach((order) => {
      nextMap[order._id] = order.orderStatus;

      if (!initialized) return;

      const previousStatus = previousOrderStatusRef.current[order._id];
      if (!previousStatus) {
        addAlert("New order received", `Order ${order._id.slice(-6).toUpperCase()} placed`, "OrderPlaced");
        return;
      }

      if (previousStatus !== order.orderStatus && order.orderStatus === "Cancelled") {
        addAlert("Order cancelled", `Order ${order._id.slice(-6).toUpperCase()} was cancelled`, "OrderCancelled");
      }
    });

    previousOrderStatusRef.current = nextMap;
  }, [orders]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return Number(restaurantProfile?.rating) || 0;
    const total = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
    return total / reviews.length;
  }, [reviews, restaurantProfile]);

  const cancelledOrders = useMemo(
    () => orders.filter((order) => order.orderStatus === "Cancelled").length,
    [orders]
  );

  const peakTimes = useMemo(() => {
    const counter = {};

    orders.forEach((order) => {
      const date = new Date(order.orderDate || order.createdAt);
      const hour = Number.isNaN(date.getTime()) ? null : date.getHours();
      if (hour === null) return;
      const key = `${hour.toString().padStart(2, "0")}:00`;
      counter[key] = (counter[key] || 0) + 1;
    });

    return Object.entries(counter)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders]);

  const incomingOrders = useMemo(
    () => orders.filter((order) => order.orderStatus === "Placed"),
    [orders]
  );

  const displayedOrders = useMemo(() => {
    if (ordersFilter === "Incoming") return incomingOrders;
    if (ordersFilter === "Delivered") return orders.filter((order) => order.orderStatus === "Delivered");
    if (ordersFilter === "Cancelled") return orders.filter((order) => order.orderStatus === "Cancelled");
    return orders;
  }, [orders, incomingOrders, ordersFilter]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order._id === selectedOrderId) || displayedOrders[0] || null,
    [orders, selectedOrderId, displayedOrders]
  );

  const historyOrders = useMemo(() => {
    const base = orders.filter((order) => ["Delivered", "Cancelled"].includes(order.orderStatus));
    if (historyFilter === "All") return base;
    return base.filter((order) => order.orderStatus === historyFilter);
  }, [orders, historyFilter]);

  const earningsSummary = useMemo(() => {
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let daily = 0;
    let weekly = 0;
    let monthly = 0;

    orders.forEach((order) => {
      if (order.orderStatus !== "Delivered") return;
      const amount = Number(order.total) || 0;
      const orderDate = new Date(order.orderDate || order.createdAt);
      const diff = now - orderDate;

      if (diff <= oneDayMs) daily += amount;
      if (diff <= 7 * oneDayMs) weekly += amount;
      if (diff <= 30 * oneDayMs) monthly += amount;
    });

    const commissionRate = Number(restaurantProfile?.platformFeePercentage) || 20;

    return {
      daily,
      weekly,
      monthly,
      commissionRate,
      commissionOnMonthly: (monthly * commissionRate) / 100,
      netPayoutMonthly: monthly - (monthly * commissionRate) / 100,
    };
  }, [orders, restaurantProfile]);

  const dashboardCards = [
    { label: "Today's Orders", value: stats.todayOrders },
    { label: "Today's Revenue", value: formatCurrency(stats.todayRevenue) },
    { label: "Total Orders", value: stats.totalOrders },
    { label: "Pending Orders", value: stats.pendingOrders },
    { label: "Completed Orders", value: stats.completedOrders },
    { label: "Cancelled Orders", value: cancelledOrders },
    { label: "Average Rating", value: averageRating ? averageRating.toFixed(1) : "0.0" },
  ];

  const saveMenuItem = async (event) => {
    event.preventDefault();

    if (!menuForm.name || !menuForm.description || !menuForm.price || !menuForm.category) {
      setToast("Name, description, price, and category are required");
      return;
    }

    setMenuSaving(true);
    try {
      const payload = new FormData();
      payload.append("name", menuForm.name);
      payload.append("description", menuForm.description);
      payload.append("price", menuForm.price);
      payload.append("category", menuForm.category.toLowerCase());
      payload.append("isVeg", String(menuForm.isVeg));
      payload.append("preparationTime", menuForm.preparationTime || "20 min");
      payload.append("isAvailable", String(menuForm.isAvailable));
      if (menuForm.imageFile) payload.append("image", menuForm.imageFile);

      if (menuForm.id) {
        await axios.put(`${API_URL}/api/restaurant-admin/menu/${menuForm.id}`, payload, {
          ...authHeaders,
          headers: {
            ...authHeaders.headers,
            "Content-Type": "multipart/form-data",
          },
        });
        setToast("Menu item updated");
      } else {
        await axios.post(`${API_URL}/api/restaurant-admin/menu`, payload, {
          ...authHeaders,
          headers: {
            ...authHeaders.headers,
            "Content-Type": "multipart/form-data",
          },
        });
        setToast("Menu item added");
      }

      setMenuForm(defaultMenuForm);
      const menuRes = await axios.get(`${API_URL}/api/restaurant-admin/menu`, authHeaders);
      setMenuItems(menuRes.data?.products || []);
    } catch (error) {
      setToast(error?.response?.data?.message || "Failed to save menu item");
    } finally {
      setMenuSaving(false);
    }
  };

  const editMenuItem = (item) => {
    setMenuForm({
      id: item._id,
      name: item.name || "",
      description: item.description || "",
      price: item.price || "",
      category: item.category || "",
      isVeg: Boolean(item.isVeg),
      preparationTime: item.preparationTime || item.prepTime || "20 min",
      isAvailable: item.isAvailable !== false,
      imageFile: null,
    });
    setActiveSection("menu");
  };

  const deleteMenuItem = async (productId) => {
    try {
      await axios.delete(`${API_URL}/api/restaurant-admin/menu/${productId}`, authHeaders);
      setMenuItems((prev) => prev.filter((item) => item._id !== productId));
      setToast("Menu item deleted");
    } catch (error) {
      setToast(error?.response?.data?.message || "Failed to delete menu item");
    }
  };

  const toggleAvailability = async (productId, isAvailable) => {
    try {
      await axios.put(
        `${API_URL}/api/restaurant-admin/menu/${productId}/availability`,
        { isAvailable },
        authHeaders
      );
      setMenuItems((prev) =>
        prev.map((item) => (item._id === productId ? { ...item, isAvailable } : item))
      );
      setToast(isAvailable ? "Item marked available" : "Item marked out of stock");
    } catch (error) {
      setToast(error?.response?.data?.message || "Failed to update item availability");
    }
  };

  const addOrUpdateCategory = () => {
    const value = categoryInput.trim();
    if (!value) return;

    if (editingCategoryIndex >= 0) {
      setCategories((prev) => prev.map((item, idx) => (idx === editingCategoryIndex ? value : item)));
      setEditingCategoryIndex(-1);
      setToast("Category updated");
    } else {
      if (categories.some((item) => item.toLowerCase() === value.toLowerCase())) {
        setToast("Category already exists");
        return;
      }
      setCategories((prev) => [...prev, value]);
      setToast("Category added");
    }

    setCategoryInput("");
  };

  const removeCategory = (index) => {
    const removed = categories[index];
    setCategories((prev) => prev.filter((_, idx) => idx !== index));
    setToast(`Category '${removed}' removed`);
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API_URL}/api/restaurant-admin/orders/${orderId}/status`, { status }, authHeaders);
      setOrders((prev) => prev.map((order) => (order._id === orderId ? { ...order, orderStatus: status } : order)));
      setToast(`Order moved to ${normalizeStatusLabel(status)}`);
    } catch (error) {
      setToast(error?.response?.data?.message || "Failed to update order status");
    }
  };

  const acceptOrder = (orderId) => updateOrderStatus(orderId, "Preparing");
  const rejectOrder = (orderId) => updateOrderStatus(orderId, "Cancelled");

  const saveProfile = async (event) => {
    event.preventDefault();

    if (!profileForm.name || !profileForm.phone) {
      setToast("Restaurant name and phone are required");
      return;
    }

    setProfileSaving(true);
    try {
      const cuisine = profileForm.cuisineText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const operatingHours = daysOfWeek.reduce((acc, day) => {
        acc[day] = {
          open: profileForm.openingTime,
          close: profileForm.closingTime,
        };
        return acc;
      }, {});

      await axios.put(
        `${API_URL}/api/restaurant-admin/profile`,
        {
          name: profileForm.name,
          phone: profileForm.phone,
          email: profileForm.email,
          cuisine,
          address: {
            street: profileForm.street,
            city: profileForm.city,
            state: profileForm.state,
            pincode: profileForm.pincode,
          },
          operatingHours,
        },
        authHeaders
      );

      if (profileForm.logoFile) {
        const logoPayload = new FormData();
        logoPayload.append("image", profileForm.logoFile);
        await axios.post(`${API_URL}/api/restaurant-admin/profile/image`, logoPayload, {
          ...authHeaders,
          headers: {
            ...authHeaders.headers,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      if (profileForm.bannerFile) {
        const bannerPayload = new FormData();
        bannerPayload.append("restaurantImages", profileForm.bannerFile);
        await axios.put(`${API_URL}/api/restaurant-admin/profile`, bannerPayload, {
          ...authHeaders,
          headers: {
            ...authHeaders.headers,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      await fetchBundle();
      setToast("Restaurant profile updated");
    } catch (error) {
      setToast(error?.response?.data?.message || "Failed to update restaurant profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const toggleRestaurantOpen = async (isOpen) => {
    try {
      await axios.put(`${API_URL}/api/restaurant-admin/profile/status`, { isOpen }, authHeaders);
      setRestaurantProfile((prev) => ({ ...prev, isOpen }));
      setToast(isOpen ? "Restaurant is now open" : "Restaurant is now closed");
    } catch (error) {
      setToast(error?.response?.data?.message || "Failed to update restaurant status");
    }
  };

  const saveNotificationSettings = async () => {
    try {
      await axios.put(
        `${API_URL}/api/restaurant-admin/notifications/settings`,
        notificationSettings,
        authHeaders
      );
      setToast("Notification settings updated");
    } catch (error) {
      setToast(error?.response?.data?.message || "Failed to update notification settings");
    }
  };

  const addOffer = (event) => {
    event.preventDefault();

    if (!offerForm.title || !offerForm.value || !offerForm.expiryDate) {
      setToast("Offer title, value and expiry are required");
      return;
    }

    setOffers((prev) => [
      {
        id: `${Date.now()}`,
        ...offerForm,
        isActive: true,
      },
      ...prev,
    ]);
    setOfferForm(defaultOfferForm);
    setToast("Offer created");
  };

  const addInventoryItem = (event) => {
    event.preventDefault();

    if (!inventoryForm.ingredient || !inventoryForm.quantity || !inventoryForm.threshold) {
      setToast("Ingredient, quantity and threshold are required");
      return;
    }

    setInventoryItems((prev) => [
      {
        id: `${Date.now()}`,
        ingredient: inventoryForm.ingredient,
        quantity: Number(inventoryForm.quantity),
        threshold: Number(inventoryForm.threshold),
        unit: inventoryForm.unit,
        linkedProductId: inventoryForm.linkedProductId,
      },
      ...prev,
    ]);
    setInventoryForm(defaultInventoryForm);
    setToast("Inventory item added");
  };

  const syncInventoryWithMenu = async () => {
    const lowItems = inventoryItems.filter((item) => item.quantity <= item.threshold);

    if (!lowItems.length) {
      setToast("No low stock items");
      return;
    }

    for (const stockItem of lowItems) {
      addAlert(
        "Low stock alert",
        `${stockItem.ingredient} is low (${stockItem.quantity} ${stockItem.unit})`,
        "Inventory"
      );

      if (stockItem.linkedProductId && stockItem.quantity <= 0) {
        const menuItem = menuItems.find((item) => item._id === stockItem.linkedProductId);
        if (menuItem && menuItem.isAvailable) {
          await toggleAvailability(menuItem._id, false);
        }
      }
    }

    setToast("Inventory sync completed");
  };

  const saveReviewResponse = (reviewId, responseText) => {
    if (!responseText.trim()) {
      setToast("Response cannot be empty");
      return;
    }

    setReviewResponses((prev) => ({
      ...prev,
      [reviewId]: responseText,
    }));
    setToast("Reply saved");
  };

  const renderDashboardSection = () => (
    <div className="section-grid">
      <div className="panel card-grid">
        {dashboardCards.map((card) => (
          <div className="metric-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </div>

      <div className="panel panel-double">
        <div>
          <h3>Daily Sales Chart</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salesChart.map((row) => ({ date: row._id, sales: row.sales || 0, orders: row.orders || 0 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4dde5" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#0b84f3" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3>Weekly Revenue</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueWeekly.map((row) => ({ period: row._id, revenue: row.revenue || 0 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4dde5" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel analytics-grid">
        <div>
          <h3>Most Ordered Items</h3>
          <div className="compact-list">
            {(topItems || []).length ? (
              topItems.map((item) => (
                <div key={item._id} className="compact-row">
                  <span>{item._id}</span>
                  <strong>{item.totalSold} orders</strong>
                </div>
              ))
            ) : (
              <p className="muted">No order insights available yet.</p>
            )}
          </div>
        </div>

        <div>
          <h3>Peak Order Times</h3>
          <div className="compact-list">
            {peakTimes.length ? (
              peakTimes.map((slot) => (
                <div key={slot.hour} className="compact-row">
                  <span>{slot.hour}</span>
                  <strong>{slot.count} orders</strong>
                </div>
              ))
            ) : (
              <p className="muted">No peak hours detected yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrdersSection = () => (
    <div className="section-grid">
      <div className="panel">
        <div className="panel-head">
          <h3>Incoming & Active Orders</h3>
          <div className="inline-filters">
            {[
              ["Incoming", "Incoming"],
              ["All", "All"],
              ["Delivered", "Delivered"],
              ["Cancelled", "Cancelled"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={`chip ${ordersFilter === value ? "active" : ""}`}
                onClick={() => setOrdersFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="order-list">
          {displayedOrders.map((order) => (
            <div
              className={`order-card ${selectedOrder?._id === order._id ? "selected" : ""}`}
              key={order._id}
              onClick={() => setSelectedOrderId(order._id)}
            >
              <div>
                <strong>#{order._id.slice(-6).toUpperCase()}</strong>
                <p>{order.userId?.name || order.deliveryAddress?.fullName || "Customer"}</p>
                <span>{formatDateTime(order.orderDate || order.createdAt)}</span>
              </div>
              <div className="order-card-meta">
                <span className={`status-pill status-${(order.orderStatus || "").replace(/\s+/g, "-").toLowerCase()}`}>
                  {normalizeStatusLabel(order.orderStatus)}
                </span>
                <strong>{formatCurrency(order.total)}</strong>
              </div>
            </div>
          ))}
          {!displayedOrders.length && <p className="muted">No orders in this filter.</p>}
        </div>
      </div>

      <div className="panel">
        <h3>Order Details</h3>
        {selectedOrder ? (
          <>
            <div className="detail-grid">
              <div>
                <span>Order ID</span>
                <strong>#{selectedOrder._id.slice(-6).toUpperCase()}</strong>
              </div>
              <div>
                <span>Customer</span>
                <strong>{selectedOrder.userId?.name || selectedOrder.deliveryAddress?.fullName || "-"}</strong>
              </div>
              <div>
                <span>Payment</span>
                <strong>{selectedOrder.paymentMethod || "COD"}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatCurrency(selectedOrder.total)}</strong>
              </div>
            </div>

            <div className="order-items">
              <h4>Ordered Items</h4>
              {(selectedOrder.items || []).map((item, idx) => (
                <div key={`${item.productId || item.name}_${idx}`} className="order-item-row">
                  <span>{item.name}</span>
                  <span>x{item.quantity}</span>
                  <span>{formatCurrency((item.price || 0) * (item.quantity || 1))}</span>
                </div>
              ))}
            </div>

            <div className="address-box">
              <h4>Delivery Address</h4>
              <p>
                {selectedOrder.deliveryAddress?.addressLine || "-"}, {selectedOrder.deliveryAddress?.city || ""},
                {" "}
                {selectedOrder.deliveryAddress?.state || ""} {selectedOrder.deliveryAddress?.pincode || ""}
              </p>
            </div>

            <div className="action-row">
              {selectedOrder.orderStatus === "Placed" ? (
                <>
                  <button className="btn btn-accept" onClick={() => acceptOrder(selectedOrder._id)}>
                    Accept
                  </button>
                  <button className="btn btn-reject" onClick={() => rejectOrder(selectedOrder._id)}>
                    Reject
                  </button>
                </>
              ) : selectedOrder.orderStatus === "Preparing" ? (
                <div style={{ padding: "12px 16px", background: "#fff3cd", borderRadius: "8px", textAlign: "center", color: "#856404", fontWeight: "500" }}>
                  🍳 Order is being prepared... Expected soon!
                </div>
              ) : selectedOrder.orderStatus === "Ready" ? (
                <div style={{ padding: "12px 16px", background: "#d1ecf1", borderRadius: "8px", textAlign: "center", color: "#0c5460", fontWeight: "500" }}>
                  ✅ Rider picked up the order, on the way!
                </div>
              ) : selectedOrder.orderStatus === "Out for Delivery" ? (
                <div style={{ padding: "12px 16px", background: "#cfe2ff", borderRadius: "8px", textAlign: "center", color: "#084298", fontWeight: "500" }}>
                  🚗 Rider is on the way, arriving soon!
                </div>
              ) : selectedOrder.orderStatus === "Delivered" ? (
                <div style={{ padding: "12px 16px", background: "#d1e7dd", borderRadius: "8px", textAlign: "center", color: "#0f5132", fontWeight: "500" }}>
                  🎉 Delivered successfully!
                </div>
              ) : selectedOrder.orderStatus === "Cancelled" ? (
                <div style={{ padding: "12px 16px", background: "#f8d7da", borderRadius: "8px", textAlign: "center", color: "#842029", fontWeight: "500" }}>
                  ❌ Order has been cancelled
                </div>
              ) : null}
              
              <select
                value={selectedOrder.orderStatus}
                onChange={(event) => updateOrderStatus(selectedOrder._id, event.target.value)}
              >
                {ORDER_FLOW.map((status) => (
                  <option value={status} key={status}>
                    {normalizeStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <p className="muted">Select an order to view details.</p>
        )}
      </div>
    </div>
  );

  const renderMenuSection = () => (
    <div className="section-grid">
      <div className="panel">
        <h3>{menuForm.id ? "Edit Food Item" : "Add Food Item"}</h3>
        <form className="form-grid" onSubmit={saveMenuItem}>
          <input
            type="text"
            placeholder="Food name"
            value={menuForm.name}
            onChange={(event) => setMenuForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <input
            type="number"
            placeholder="Price"
            value={menuForm.price}
            onChange={(event) => setMenuForm((prev) => ({ ...prev, price: event.target.value }))}
          />
          <select
            value={menuForm.category}
            onChange={(event) => setMenuForm((prev) => ({ ...prev, category: event.target.value }))}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option value={category.toLowerCase()} key={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Preparation time (e.g. 20 min)"
            value={menuForm.preparationTime}
            onChange={(event) => setMenuForm((prev) => ({ ...prev, preparationTime: event.target.value }))}
          />
          <textarea
            placeholder="Description"
            value={menuForm.description}
            onChange={(event) => setMenuForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <label className="checkbox">
            <input
              type="checkbox"
              checked={menuForm.isVeg}
              onChange={(event) => setMenuForm((prev) => ({ ...prev, isVeg: event.target.checked }))}
            />
            Veg item
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={menuForm.isAvailable}
              onChange={(event) => setMenuForm((prev) => ({ ...prev, isAvailable: event.target.checked }))}
            />
            Available in stock
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              setMenuForm((prev) => ({ ...prev, imageFile: event.target.files?.[0] || null }))
            }
          />
          <div className="action-row">
            <button className="btn btn-primary" type="submit" disabled={menuSaving}>
              {menuSaving ? "Saving..." : menuForm.id ? "Update Item" : "Add Item"}
            </button>
            {menuForm.id && (
              <button
                className="btn"
                type="button"
                onClick={() => setMenuForm(defaultMenuForm)}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="panel">
        <h3>Menu Items</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Price</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div className="item-cell">
                      {item.image ? (
                        <img src={getImageUrl(item.image, API_URL)} alt={item.name} />
                      ) : (
                        <div className="image-fallback">No image</div>
                      )}
                      <div>
                        <strong>{item.name}</strong>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  </td>
                  <td>{item.category}</td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>
                    <label className={`status-pill ${item.isAvailable ? "available" : "out"}`}>
                      {item.isAvailable ? "Available" : "Out of stock"}
                    </label>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn small" onClick={() => editMenuItem(item)}>
                        Edit
                      </button>
                      <button
                        className="btn small"
                        onClick={() => toggleAvailability(item._id, !item.isAvailable)}
                      >
                        {item.isAvailable ? "Mark Out" : "Mark In"}
                      </button>
                      <button className="btn small danger" onClick={() => deleteMenuItem(item._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!menuItems.length && (
                <tr>
                  <td colSpan="5" className="muted">
                    No menu items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCategoriesSection = () => (
    <div className="section-grid">
      <div className="panel">
        <h3>Category Management</h3>
        <div className="action-row">
          <input
            type="text"
            placeholder="Category name"
            value={categoryInput}
            onChange={(event) => setCategoryInput(event.target.value)}
          />
          <button className="btn btn-primary" onClick={addOrUpdateCategory}>
            {editingCategoryIndex >= 0 ? "Update" : "Add"}
          </button>
        </div>
      </div>

      <div className="panel">
        <h3>Restaurant Categories</h3>
        <div className="pill-list">
          {categories.map((category, index) => (
            <div key={`${category}_${index}`} className="category-pill">
              <span>{category}</span>
              <div className="row-actions">
                <button
                  className="btn small"
                  onClick={() => {
                    setCategoryInput(category);
                    setEditingCategoryIndex(index);
                  }}
                >
                  Edit
                </button>
                <button className="btn small danger" onClick={() => removeCategory(index)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProfileSection = () => (
    <div className="section-grid">
      <div className="panel">
        <h3>Restaurant Profile</h3>
        <form className="form-grid" onSubmit={saveProfile}>
          <input
            type="text"
            placeholder="Restaurant name"
            value={profileForm.name}
            onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <input
            type="text"
            placeholder="Phone"
            value={profileForm.phone}
            onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
          />
          <input
            type="email"
            placeholder="Email"
            value={profileForm.email}
            onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <input
            type="text"
            placeholder="Street"
            value={profileForm.street}
            onChange={(event) => setProfileForm((prev) => ({ ...prev, street: event.target.value }))}
          />
          <input
            type="text"
            placeholder="City"
            value={profileForm.city}
            onChange={(event) => setProfileForm((prev) => ({ ...prev, city: event.target.value }))}
          />
          <input
            type="text"
            placeholder="State"
            value={profileForm.state}
            onChange={(event) => setProfileForm((prev) => ({ ...prev, state: event.target.value }))}
          />
          <input
            type="text"
            placeholder="Pincode"
            value={profileForm.pincode}
            onChange={(event) => setProfileForm((prev) => ({ ...prev, pincode: event.target.value }))}
          />
          <input
            type="text"
            placeholder="Cuisine (comma separated)"
            value={profileForm.cuisineText}
            onChange={(event) => setProfileForm((prev) => ({ ...prev, cuisineText: event.target.value }))}
          />
          <label>
            Opening Time
            <input
              type="time"
              value={profileForm.openingTime}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, openingTime: event.target.value }))}
            />
          </label>
          <label>
            Closing Time
            <input
              type="time"
              value={profileForm.closingTime}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, closingTime: event.target.value }))}
            />
          </label>
          <label>
            Restaurant Logo
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, logoFile: event.target.files?.[0] || null }))
              }
            />
          </label>
          <label>
            Banner Image
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, bannerFile: event.target.files?.[0] || null }))
              }
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={profileSaving}>
            {profileSaving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>

      <div className="panel">
        <h3>Profile Preview</h3>
        <div className="profile-preview">
          {restaurantProfile?.image ? (
            <img src={getImageUrl(restaurantProfile.image, API_URL)} alt="Restaurant logo" className="logo-preview" />
          ) : (
            <div className="image-fallback large">No logo</div>
          )}

          {restaurantProfile?.restaurantImages?.[0] ? (
            <img
              src={getImageUrl(restaurantProfile.restaurantImages[0], API_URL)}
              alt="Restaurant banner"
              className="banner-preview"
            />
          ) : (
            <div className="image-fallback banner">No banner</div>
          )}

          <p>
            <strong>Opening:</strong> {profileForm.openingTime || "10:00 AM"}
          </p>
          <p>
            <strong>Closing:</strong> {profileForm.closingTime || "11:00 PM"}
          </p>
        </div>
      </div>
    </div>
  );

  const renderHistorySection = () => (
    <div className="section-grid">
      <div className="panel">
        <div className="panel-head">
          <h3>Order History</h3>
          <select value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value)}>
            <option value="All">All</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Date & Time</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {historyOrders.map((order) => (
                <tr key={order._id}>
                  <td>#{order._id.slice(-6).toUpperCase()}</td>
                  <td>{order.userId?.name || order.deliveryAddress?.fullName || "-"}</td>
                  <td>{(order.items || []).map((item) => `${item.name} x${item.quantity}`).join(", ")}</td>
                  <td>{formatDateTime(order.orderDate || order.createdAt)}</td>
                  <td>{formatCurrency(order.total)}</td>
                  <td>{order.orderStatus}</td>
                </tr>
              ))}
              {!historyOrders.length && (
                <tr>
                  <td colSpan="6" className="muted">
                    No historical orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderEarningsSection = () => (
    <div className="section-grid">
      <div className="panel card-grid">
        <div className="metric-card">
          <span>Daily Earnings</span>
          <strong>{formatCurrency(earningsSummary.daily)}</strong>
        </div>
        <div className="metric-card">
          <span>Weekly Earnings</span>
          <strong>{formatCurrency(earningsSummary.weekly)}</strong>
        </div>
        <div className="metric-card">
          <span>Monthly Earnings</span>
          <strong>{formatCurrency(earningsSummary.monthly)}</strong>
        </div>
        <div className="metric-card">
          <span>Platform Commission ({earningsSummary.commissionRate}%)</span>
          <strong>{formatCurrency(earningsSummary.commissionOnMonthly)}</strong>
        </div>
        <div className="metric-card">
          <span>Net Payout</span>
          <strong>{formatCurrency(earningsSummary.netPayoutMonthly)}</strong>
        </div>
      </div>

      <div className="panel panel-double">
        <div>
          <h3>Daily Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueDaily.map((row) => ({ x: row._id, revenue: row.revenue || 0 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4dde5" />
              <XAxis dataKey="x" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3>Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueMonthly.map((row) => ({ x: row._id, revenue: row.revenue || 0 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d4dde5" />
              <XAxis dataKey="x" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#7c3aed" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderReviewsSection = () => (
    <div className="section-grid">
      <div className="panel">
        <h3>Average Rating: {averageRating ? averageRating.toFixed(1) : "0.0"} ⭐</h3>
        <div className="review-list">
          {reviews.map((review) => (
            <div className="review-card" key={review._id}>
              <div className="review-head">
                <div>
                  <strong>{review.userId?.name || "Customer"}</strong>
                  <span className="review-badge" style={{
                    marginLeft: '10px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: review.reviewType === 'Food' ? '#ffeaa7' : review.reviewType === 'Restaurant' ? '#fab1a0' : '#81ecec',
                    color: '#2c3e50'
                  }}>
                    {review.reviewType === 'Food' && '🍔 Food Review'}
                    {review.reviewType === 'Restaurant' && '🏪 Restaurant Review'}
                    {review.reviewType === 'Rider' && '🚗 Delivery Review'}
                  </span>
                </div>
                <span>{review.rating} / 5</span>
              </div>
              <p className="muted">{review.productId?.name || review.restaurantId?.name || "Order"}</p>
              {review.experience && (
                <p style={{fontSize: '13px', color: '#7f8c8d', marginBottom: '8px'}}>
                  <strong>Experience:</strong> {review.experience}
                </p>
              )}
              <p>{review.comment}</p>
              <p style={{fontSize: '12px', color: '#95a5a6', marginTop: '8px'}}>
                📅 {new Date(review.createdAt).toLocaleDateString()} {new Date(review.createdAt).toLocaleTimeString("en-IN")}
              </p>
              <textarea
                placeholder="Respond to this review"
                value={reviewResponses[review._id] || ""}
                onChange={(event) =>
                  setReviewResponses((prev) => ({ ...prev, [review._id]: event.target.value }))
                }
              />
              <button
                className="btn btn-primary"
                onClick={() => saveReviewResponse(review._id, reviewResponses[review._id] || "")}
              >
                Save Response
              </button>
            </div>
          ))}
          {!reviews.length && <p className="muted">No reviews yet.</p>}
        </div>
      </div>
    </div>
  );

  const renderInventorySection = () => (
    <div className="section-grid">
      <div className="panel">
        <h3>Inventory Management</h3>
        <form className="form-grid" onSubmit={addInventoryItem}>
          <input
            type="text"
            placeholder="Ingredient (e.g. Chicken stock)"
            value={inventoryForm.ingredient}
            onChange={(event) => setInventoryForm((prev) => ({ ...prev, ingredient: event.target.value }))}
          />
          <input
            type="number"
            placeholder="Quantity"
            value={inventoryForm.quantity}
            onChange={(event) => setInventoryForm((prev) => ({ ...prev, quantity: event.target.value }))}
          />
          <input
            type="number"
            placeholder="Low stock threshold"
            value={inventoryForm.threshold}
            onChange={(event) => setInventoryForm((prev) => ({ ...prev, threshold: event.target.value }))}
          />
          <select
            value={inventoryForm.unit}
            onChange={(event) => setInventoryForm((prev) => ({ ...prev, unit: event.target.value }))}
          >
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="ltr">ltr</option>
            <option value="pcs">pcs</option>
          </select>
          <select
            value={inventoryForm.linkedProductId}
            onChange={(event) => setInventoryForm((prev) => ({ ...prev, linkedProductId: event.target.value }))}
          >
            <option value="">Link to menu item (optional)</option>
            {menuItems.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
          <div className="action-row">
            <button className="btn btn-primary" type="submit">
              Add Ingredient
            </button>
            <button className="btn" type="button" onClick={syncInventoryWithMenu}>
              Sync Stock Status
            </button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h3>Current Inventory</h3>
        <div className="compact-list">
          {inventoryItems.map((item) => {
            const isLow = item.quantity <= item.threshold;
            return (
              <div key={item.id} className={`compact-row ${isLow ? "low-stock" : ""}`}>
                <span>
                  {item.ingredient} - {item.quantity} {item.unit}
                </span>
                <strong>{isLow ? "Low stock" : "In stock"}</strong>
              </div>
            );
          })}
          {!inventoryItems.length && <p className="muted">No inventory items added.</p>}
        </div>
      </div>
    </div>
  );

  const renderOffersSection = () => (
    <div className="section-grid">
      <div className="panel">
        <h3>Create Offer</h3>
        <form className="form-grid" onSubmit={addOffer}>
          <input
            type="text"
            placeholder="Offer title (e.g. 20% Off on Pizza)"
            value={offerForm.title}
            onChange={(event) => setOfferForm((prev) => ({ ...prev, title: event.target.value }))}
          />
          <select
            value={offerForm.offerType}
            onChange={(event) => setOfferForm((prev) => ({ ...prev, offerType: event.target.value }))}
          >
            <option value="Percentage">Percentage</option>
            <option value="Flat">Flat</option>
            <option value="BOGO">Buy 1 Get 1</option>
          </select>
          <input
            type="number"
            placeholder="Offer value"
            value={offerForm.value}
            onChange={(event) => setOfferForm((prev) => ({ ...prev, value: event.target.value }))}
          />
          <select
            value={offerForm.applyTo}
            onChange={(event) => setOfferForm((prev) => ({ ...prev, applyTo: event.target.value }))}
          >
            <option value="All Items">All Items</option>
            {menuItems.map((item) => (
              <option key={item._id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={offerForm.expiryDate}
            onChange={(event) => setOfferForm((prev) => ({ ...prev, expiryDate: event.target.value }))}
          />
          <button className="btn btn-primary" type="submit">
            Create Offer
          </button>
        </form>
      </div>

      <div className="panel">
        <h3>Active Offers</h3>
        <div className="compact-list">
          {offers.map((offer) => (
            <div key={offer.id} className="offer-row">
              <div>
                <strong>{offer.title}</strong>
                <p>
                  {offer.offerType} - {offer.value} | Applies to: {offer.applyTo}
                </p>
                <span>Expires: {offer.expiryDate}</span>
              </div>
              <button
                className="btn small danger"
                onClick={() => setOffers((prev) => prev.filter((item) => item.id !== offer.id))}
              >
                Delete
              </button>
            </div>
          ))}
          {!offers.length && <p className="muted">No offers created yet.</p>}
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="section-grid">
      <div className="panel">
        <h3>Notification Settings</h3>
        <div className="toggle-list">
          {Object.entries(notificationSettings).map(([key, value]) => (
            <label key={key} className="toggle-row">
              <span>{key}</span>
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(event) =>
                  setNotificationSettings((prev) => ({ ...prev, [key]: event.target.checked }))
                }
              />
            </label>
          ))}
        </div>
        <button className="btn btn-primary" onClick={saveNotificationSettings}>
          Save Settings
        </button>
      </div>

      <div className="panel">
        <h3>Restaurant Alerts</h3>
        <div className="compact-list">
          {localAlerts.map((alert) => (
            <div className="alert-row" key={alert.id}>
              <strong>{alert.title}</strong>
              <p>{alert.message}</p>
              <span>{formatDateTime(alert.createdAt)}</span>
            </div>
          ))}
          {!localAlerts.length && <p className="muted">No notifications yet.</p>}
        </div>
      </div>
    </div>
  );

  const renderAvailabilitySection = () => (
    <div className="section-grid">
      <div className="panel">
        <h3>Restaurant Availability</h3>
        <div className="availability-grid">
          <div className={`availability-card ${restaurantProfile?.isOpen ? "open" : "closed"}`}>
            <span>Restaurant Status</span>
            <strong>{restaurantProfile?.isOpen ? "Open" : "Closed"}</strong>
            <div className="action-row">
              <button className="btn btn-accept" onClick={() => toggleRestaurantOpen(true)}>
                Open Restaurant
              </button>
              <button className="btn btn-reject" onClick={() => toggleRestaurantOpen(false)}>
                Close Temporarily
              </button>
            </div>
          </div>

          <div className={`availability-card ${busyMode ? "busy" : "open"}`}>
            <span>Busy Mode</span>
            <strong>{busyMode ? "Enabled" : "Disabled"}</strong>
            <button
              className="btn"
              onClick={() => {
                const next = !busyMode;
                setBusyMode(next);
                setToast(next ? "Busy mode enabled" : "Busy mode disabled");
              }}
            >
              Toggle Busy Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const sectionMap = useMemo(
    () => ({
      dashboard: renderDashboardSection,
      orders: renderOrdersSection,
      menu: renderMenuSection,
      categories: renderCategoriesSection,
      profile: renderProfileSection,
      history: renderHistorySection,
      earnings: renderEarningsSection,
      reviews: renderReviewsSection,
      inventory: renderInventorySection,
      offers: renderOffersSection,
      notifications: renderNotificationsSection,
      availability: renderAvailabilitySection,
    }),
    [
      renderDashboardSection,
      renderOrdersSection,
      renderMenuSection,
      renderCategoriesSection,
      renderProfileSection,
      renderHistorySection,
      renderEarningsSection,
      renderReviewsSection,
      renderInventorySection,
      renderOffersSection,
      renderNotificationsSection,
      renderAvailabilitySection,
    ]
  );

  const renderSection = () => {
    const sectionRenderer = sectionMap[activeSection] || renderDashboardSection;
    return sectionRenderer();
  };

  return (
    <div className="restaurant-admin-shell">
      {toast && <Toast message={toast} onClose={() => setToast("")} />}

      <aside className="restaurant-admin-sidebar">
        <div className="brand-card">
          <h2>{restaurantProfile?.name || "Restaurant Admin"}</h2>
          <p>Manage menu, orders, earnings and operations.</p>
          <div className="status-row">
            <span className={`status-dot ${restaurantProfile?.isOpen ? "on" : "off"}`} />
            <strong>{restaurantProfile?.isOpen ? "Accepting Orders" : "Not Accepting Orders"}</strong>
          </div>
        </div>

        <nav className="section-nav">
          {DASHBOARD_SECTIONS.map((section) => (
            <button
              key={section.id}
              className={`section-link ${activeSection === section.id ? "active" : ""}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="restaurant-admin-main">
        <header className="main-head">
          <div>
            <h1>{DASHBOARD_SECTIONS.find((item) => item.id === activeSection)?.label}</h1>
            <p>
              {loading
                ? "Refreshing dashboard data..."
                : "Live business operations with analytics, menu control, and order workflow."}
            </p>
          </div>
          <button className="btn" onClick={fetchBundle} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <section className="content-area">
          {renderSection()}
        </section>
      </main>
    </div>
  );
}

export default RestaurantAdminDashboard;
