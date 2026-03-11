import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config/api";

function RestaurantAdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("❌ Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      // First attempt restaurant admin login
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { token, user } = res.data;

      // Check if user is a restaurant admin
      if (!user.isRestaurantAdmin) {
        setError("❌ This account is not a restaurant admin account.");
        setLoading(false);
        return;
      }

      // Check approval status
      if (user.adminStatus === "Rejected") {
        setError("❌ Sorry for the inconvenience. Your restaurant registration has been rejected.");
        setLoading(false);
        return;
      }

      if (user.adminStatus === "Pending") {
        setError("⏳ Your restaurant registration is pending admin approval. Please wait for approval.");
        setLoading(false);
        return;
      }

      // Check if user has a restaurant
      const restaurantRes = await axios.get(`${API_URL}/api/restaurant-admin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!restaurantRes.data) {
        setError("❌ No restaurant found. Please create a restaurant first.");
        setLoading(false);
        return;
      }

      localStorage.setItem("restaurantAdminToken", token);
      localStorage.setItem("restaurantAdmin", JSON.stringify(user));
      localStorage.setItem("restaurant", JSON.stringify(restaurantRes.data));

      navigate("/restaurantadmin");
    } catch (err) {
      setError("❌ " + (err.response?.data?.message || "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.overlay}></div>

      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>🍽️ Restaurant Admin</h1>
            <p style={styles.subtitle}>Login to manage your restaurant</p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <input
                type="email"
                required
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
              <label style={styles.floatingLabel}>Email Address</label>
            </div>

            <div style={styles.inputGroup}>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
              <label style={styles.floatingLabel}>Password</label>

              <span
                style={styles.showToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={styles.loginBtn}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 12px 28px rgba(255, 122, 0, 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 8px 20px rgba(255, 122, 0, 0.3)";
                }
              }}
            >
              {loading ? "⏳ Logging in..." : "🔓 Login"}
            </button>
          </form>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              New here?{" "}
              <Link to="/restaurantadmin-register" style={styles.link}>
                Create Account
              </Link>
            </p>
            <p style={styles.footerText}>
              <Link to="/restaurantadmin-forgot-password" style={styles.link}>
                Forgot Password?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle at top, #121212, #080808)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    overflow: "hidden",
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "transparent",
  },

  container: {
    maxWidth: "450px",
    width: "95%",
    position: "relative",
    zIndex: 2,
  },

  card: {
    background: "rgba(255, 255, 255, 0.04)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderRadius: "22px",
    padding: "40px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    transition: "all 0.4s ease",
  },

  header: {
    textAlign: "center",
    marginBottom: "32px",
  },

  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 8px 0",
    letterSpacing: "0.5px",
  },

  subtitle: {
    fontSize: "14px",
    color: "#aaa",
    marginTop: "8px",
    fontWeight: "500",
  },

  errorBox: {
    background: "rgba(255, 60, 60, 0.15)",
    backdropFilter: "blur(5px)",
    border: "1px solid rgba(255, 60, 60, 0.3)",
    color: "#ffcccb",
    padding: "12px 16px",
    borderRadius: "12px",
    marginBottom: "24px",
    fontSize: "13px",
    fontWeight: "500",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  inputGroup: {
    position: "relative",
    marginBottom: "8px",
  },

  input: {
    width: "100%",
    padding: "12px 14px",
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "12px",
    fontSize: "13px",
    color: "white",
    outline: "none",
    transition: "all 0.3s ease",
    boxSizing: "border-box",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },

  floatingLabel: {
    position: "absolute",
    left: "14px",
    top: "12px",
    fontSize: "13px",
    color: "#bbb",
    transition: "all 0.3s",
    pointerEvents: "none",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  showToggle: {
    position: "absolute",
    right: "14px",
    top: "12px",
    cursor: "pointer",
    userSelect: "none",
    fontSize: "16px",
    transition: "transform 0.2s",
  },

  loginBtn: {
    padding: "14px 20px",
    background: "linear-gradient(135deg, #ff7a00, #ff3c3c)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginTop: "12px",
    boxShadow: "0 8px 20px rgba(255, 122, 0, 0.3)",
    letterSpacing: "0.5px",
  },

  footer: {
    marginTop: "24px",
    textAlign: "center",
    fontSize: "13px",
  },

  footerText: {
    color: "#aaa",
    marginBottom: "10px",
  },

  link: {
    color: "#ff7a00",
    textDecoration: "none",
    fontWeight: "700",
    cursor: "pointer",
    transition: "color 0.3s ease",
  },

  "@media (max-width: 768px)": {
    card: {
      padding: "30px",
    },
    title: {
      fontSize: "22px",
    },
  },
};

export default RestaurantAdminLogin;
