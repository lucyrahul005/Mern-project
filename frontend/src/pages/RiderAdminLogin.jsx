import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../pages/Auth.css";

const RiderAdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.email.trim() || !formData.password.trim()) {
      setError("❌ Email and password are required");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("❌ Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      console.log("🚴 Attempting rider login with email:", formData.email);
      
      const response = await fetch("http://localhost:5001/api/rider/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("📡 Response status:", response.status);
      
      const data = await response.json();
      console.log("📦 Response data:", data);

      if (!response.ok) {
        // Login failed - show error from backend
        const errorMsg = data.message || "Login failed";
        console.error("❌ Login failed:", errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      if (!data.token || !data.rider) {
        setError("❌ Invalid response from server. Missing token or rider data.");
        setLoading(false);
        return;
      }

      // Successfully logged in - save to sessionStorage
      try {
        sessionStorage.setItem("riderToken", data.token);
        sessionStorage.setItem("riderRole", "rider");
        sessionStorage.setItem("riderName", data.rider.name);
        sessionStorage.setItem("riderId", data.rider.id);
        sessionStorage.setItem("riderData", JSON.stringify(data.rider));
        console.log("✅ Session storage updated successfully");
        console.log("✅ Redirecting to dashboard...");
        
        // Immediate navigation - don't wait for state update
        setLoading(false);
        
        // Use setTimeout to ensure state update completes before navigation
        setTimeout(() => {
          navigate("/rideradmin");
        }, 10);
      } catch (storageErr) {
        console.error("❌ Error saving to sessionStorage:", storageErr);
        setError("❌ Error saving login data. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      console.error("🔴 Network/Server Error:", err);
      setError(
        "🔴 Connection failed - Please ensure: 1) Backend running on 5001, 2) MongoDB connected, 3) Correct email/password"
      );
      setLoading(false);
    }
  };

  return (
    <div 
      className="auth-container"
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #0f0f1e, #050508)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Background overlay */}
      <div 
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "radial-gradient(circle at 20% 50%, rgba(255, 122, 0, 0.08) 0%, transparent 50%)",
          pointerEvents: "none",
          zIndex: 1
        }}
      />

      <div 
        className="auth-box"
        style={{
          background: "rgba(255, 255, 255, 0.06)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "20px",
          padding: "48px 40px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
          position: "relative",
          zIndex: 2,
          animation: "fadeIn 0.6s ease-out"
        }}
      >
        <h2 style={{ fontSize: "28px", color: "#fff", margin: "0 0 8px 0", fontWeight: 700, textAlign: "center" }}>🛵 Rider Login</h2>
        <p style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.6)", margin: "0 0 24px 0", fontSize: "14px" }}>Welcome back, delivery partner!</p>

        {error && (
          <div 
            className="error-message"
            style={{
              background: "rgba(255, 107, 107, 0.1)",
              color: "#ff8a8a",
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "24px",
              fontSize: "14px",
              border: "1px solid rgba(255, 107, 107, 0.2)",
              boxShadow: "0 4px 15px rgba(255, 107, 107, 0.1)"
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
            style={{
              width: "100%",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "14px 16px",
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "14px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              marginBottom: "16px",
              boxSizing: "border-box",
              backdropFilter: "blur(10px)"
            }}
            onFocus={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.1)";
              e.target.style.borderColor = "rgba(255, 122, 0, 0.5)";
              e.target.style.boxShadow = "0 0 20px rgba(255, 122, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)";
            }}
            onBlur={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.06)";
              e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
              e.target.style.boxShadow = "none";
            }}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
            style={{
              width: "100%",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "12px",
              padding: "14px 16px",
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "14px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              marginBottom: "24px",
              boxSizing: "border-box",
              backdropFilter: "blur(10px)"
            }}
            onFocus={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.1)";
              e.target.style.borderColor = "rgba(255, 122, 0, 0.5)";
              e.target.style.boxShadow = "0 0 20px rgba(255, 122, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)";
            }}
            onBlur={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.06)";
              e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
              e.target.style.boxShadow = "none";
            }}
          />

          <button 
            type="submit" 
            disabled={loading} 
            className="auth-btn"
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #ff7a00, #ff5252)",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "14px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 4px 15px rgba(255, 122, 0, 0.25)",
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(-3px)";
                e.target.style.boxShadow = "0 8px 25px rgba(255, 122, 0, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(255, 122, 0, 0.25)";
            }}
          >
            {loading ? "Logging in..." : "Login 🚀"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "24px", color: "rgba(255, 255, 255, 0.6)", fontSize: "14px" }}>
          New rider?{" "}
          <Link 
            to="/rideradmin-register" 
            style={{
              color: "#ff7a00",
              textDecoration: "none",
              fontWeight: 600,
              transition: "all 0.3s ease",
              borderBottom: "1px solid transparent"
            }}
            onMouseEnter={(e) => {
              e.target.style.color = "#ff5252";
              e.target.style.borderBottomColor = "#ff5252";
            }}
            onMouseLeave={(e) => {
              e.target.style.color = "#ff7a00";
              e.target.style.borderBottomColor = "transparent";
            }}
          >
            Register here
          </Link>
        </p>

        <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "13px", margin: "0 0 8px 0", fontWeight: 600 }}>📱 Demo Credentials:</p>
          <code style={{ background: "rgba(255, 255, 255, 0.03)", color: "#ffb74d", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", display: "block", marginBottom: "4px" }}>Email: rider@gmail.com</code>
          <code style={{ background: "rgba(255, 255, 255, 0.03)", color: "#ffb74d", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", display: "block" }}>Password: password123</code>
        </div>
      </div>
    </div>
  );
};

export default RiderAdminLogin;
