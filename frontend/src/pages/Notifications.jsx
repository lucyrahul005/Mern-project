import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaBell,
  FaBox,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaUser,
  FaTag,
  FaInfoCircle,
  FaTrash,
  FaCheck,
} from "react-icons/fa";
import "./Notifications.css";

const API_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : "https://webnapp-backend.onrender.com";

// Notification type to icon mapping
const notificationIcons = {
  OrderPlaced: <FaBox className="icon" />,
  OrderConfirmed: <FaCheckCircle className="icon" />,
  OrderPreparing: <FaBox className="icon" />,
  OrderReady: <FaBox className="icon" />,
  RiderAssigned: <FaTruck className="icon" />,
  OrderOutForDelivery: <FaTruck className="icon" />,
  OutForDelivery: <FaTruck className="icon" />,
  OrderDelivered: <FaCheckCircle className="icon" />,
  OrderCancelled: <FaTimesCircle className="icon" />,
  PaymentFailed: <FaTimesCircle className="icon" />,
  Review: <FaUser className="icon" />,
  Discount: <FaTag className="icon" />,
  General: <FaInfoCircle className="icon" />,
};

// Notification type to color mapping
const notificationColors = {
  OrderPlaced: "#667eea",
  OrderConfirmed: "#32CD32",
  OrderPreparing: "#FF8C00",
  OrderReady: "#9B59B6",
  RiderAssigned: "#4169E1",
  OrderOutForDelivery: "#4169E1",
  OutForDelivery: "#4169E1",
  OrderDelivered: "#32CD32",
  OrderCancelled: "#FF0000",
  PaymentFailed: "#FF0000",
  Review: "#FF7A00",
  Discount: "#FFD700",
  General: "#808080",
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread
  const [selectedNotification, setSelectedNotification] = useState(null);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const userId = user._id;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!userId) {
          console.log("❌ No user ID found");
          setLoading(false);
          return;
        }

        console.log("📍 Fetching notifications for userId:", userId);

        const res = await axios.get(`${API_URL}/api/notifications/${userId}`, {
          headers: { "user-id": userId },
        });

        console.log("✅ Notifications fetched:", res.data);

        if (res.data.success) {
          setNotifications(res.data.notifications);
        }
      } catch (err) {
        console.error("❌ Error fetching notifications:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchNotifications();
      // Refresh notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const res = await axios.put(
        `${API_URL}/api/notifications/${notificationId}/read`,
        {},
        { headers: { "user-id": userId } }
      );

      if (res.data.success) {
        setNotifications(
          notifications.map((n) =>
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (err) {
      console.error("❌ Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await axios.put(
        `${API_URL}/api/notifications/${userId}/read-all`,
        {},
        { headers: { "user-id": userId } }
      );

      if (res.data.success) {
        setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("❌ Error marking all as read:", err);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const res = await axios.delete(
        `${API_URL}/api/notifications/${notificationId}`,
        { headers: { "user-id": userId } }
      );

      if (res.data.success) {
        setNotifications(notifications.filter((n) => n._id !== notificationId));
        setSelectedNotification(null);
      }
    } catch (err) {
      console.error("❌ Error deleting notification:", err);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to delete all notifications?"))
      return;

    try {
      const res = await axios.delete(
        `${API_URL}/api/notifications/${userId}/delete-all`,
        { headers: { "user-id": userId } }
      );

      if (res.data.success) {
        setNotifications([]);
        setSelectedNotification(null);
      }
    } catch (err) {
      console.error("❌ Error deleting all notifications:", err);
    }
  };

  // Filter notifications
  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="notifications-container">
        <div className="loading">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <div className="header-content">
          <div className="header-title">
            <FaBell className="header-icon" />
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="header-actions">
              {unreadCount > 0 && (
                <button
                  className="btn btn-secondary"
                  onClick={handleMarkAllAsRead}
                >
                  <FaCheck /> Mark All as Read
                </button>
              )}
              <button className="btn btn-danger" onClick={handleDeleteAll}>
                <FaTrash /> Clear All
              </button>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs">
          <button
            className={`tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({notifications.length})
          </button>
          <button
            className={`tab ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      <div className="notifications-content">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <FaBell className="empty-icon" />
            <h2>
              {filter === "unread"
                ? "No unread notifications"
                : "No notifications"}
            </h2>
            <p>
              {filter === "unread"
                ? "You're all caught up! "
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-card ${
                  !notification.isRead ? "unread" : ""
                }`}
                onClick={() => setSelectedNotification(notification)}
                style={{
                  borderLeftColor:
                    notificationColors[notification.type] || "#667eea",
                }}
              >
                <div className="notification-icon" style={{
                  color:
                    notificationColors[notification.type] || "#667eea",
                }}>
                  {notificationIcons[notification.type] ||
                    notificationIcons.General}
                </div>

                <div className="notification-content">
                  <div className="notification-header">
                    <h3>{notification.title}</h3>
                    <span className="notification-type">
                      {notification.type}
                    </span>
                  </div>
                  <p className="notification-message">
                    {notification.message}
                  </p>
                  <div className="notification-meta">
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                    {!notification.isRead && (
                      <span className="unread-indicator">●</span>
                    )}
                  </div>
                </div>

                <div className="notification-actions">
                  {!notification.isRead && (
                    <button
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification._id);
                      }}
                      title="Mark as read"
                    >
                      <FaCheck />
                    </button>
                  )}
                  <button
                    className="action-btn delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification._id);
                    }}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for selected notification */}
      {selectedNotification && (
        <div className="notification-modal-overlay">
          <div className="notification-modal">
            <div className="modal-header">
              <h2>{selectedNotification.title}</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedNotification(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="modal-icon" style={{
                color:
                  notificationColors[selectedNotification.type] || "#667eea",
              }}>
                {notificationIcons[selectedNotification.type] ||
                  notificationIcons.General}
              </div>
              <div className="modal-text">
                <h3>{selectedNotification.title}</h3>
                <p className="modal-type">
                  Type: {selectedNotification.type}
                </p>
                <p className="modal-message">
                  {selectedNotification.message}
                </p>
                {selectedNotification.orderId && (
                  <p className="modal-order">
                    Order ID:{" "}
                    {selectedNotification.orderId._id ||
                      selectedNotification.orderId}
                  </p>
                )}
                <p className="modal-time">
                  {new Date(selectedNotification.createdAt).toLocaleString(
                    "en-US"
                  )}
                </p>
              </div>
            </div>
            <div className="modal-actions">
              {!selectedNotification.isRead && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    handleMarkAsRead(selectedNotification._id);
                    setSelectedNotification(null);
                  }}
                >
                  <FaCheck /> Mark as Read
                </button>
              )}
              <button
                className="btn btn-danger"
                onClick={() => {
                  handleDeleteNotification(selectedNotification._id);
                }}
              >
                <FaTrash /> Delete
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedNotification(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;
