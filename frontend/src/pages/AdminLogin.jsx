import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config/api";

function AdminLogin() {
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
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { token, user } = res.data;

      if (!user.isAdmin) {
        setError("❌ Admin access only");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("user", JSON.stringify(user));

      navigate("/admin");
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
        {/* LEFT SIDE */}
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>Admin Panel</h1>
            <p style={styles.subtitle}>Secure Access Portal</p>
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
            >
              {loading ? "Authenticating..." : "Login to Dashboard"}
            </button>
          </form>

          <div style={styles.links}>
            <Link to="/admin-forgot-password" style={styles.link}>
              Forgot Password
            </Link>
            <Link to="/admin-register" style={styles.link}>
              Create Admin
            </Link>
          </div>

          <div style={styles.footer}>
            <p>
              Regular user?{" "}
              <Link to="/login" style={styles.userLink}>
                Login here
              </Link>
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div style={styles.sidePanel}>
          <h2 style={styles.sideTitle}>Control Everything</h2>
          <p style={styles.sideText}>
            Manage products, track orders, and monitor performance from one powerful dashboard.
          </p>

          <ul style={styles.features}>
            <li>📊 Analytics Dashboard</li>
            <li>🛍️ Product Control</li>
            <li>📦 Orders Tracking</li>
            <li>👥 User Management</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #000, #111)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Poppins, sans-serif",
    position: "relative",
    overflow: "hidden",
  },

  overlay: {
    position: "absolute",
    width: "200%",
    height: "200%",
    background:
      "radial-gradient(circle at 30% 30%, rgba(255,122,0,0.15), transparent 40%)",
    animation: "float 10s infinite linear",
  },

  container: {
    display: "flex",
    gap: "40px",
    maxWidth: "1000px",
    width: "100%",
    zIndex: 2,
  },

  card: {
    flex: 1,
    background: "rgba(20,20,20,0.7)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "40px",
    border: "1px solid rgba(255,122,0,0.3)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
  },

  header: {
    textAlign: "center",
    marginBottom: "30px",
  },

  title: {
    color: "#ff7a00",
    fontSize: "32px",
    marginBottom: "5px",
  },

  subtitle: {
    color: "#aaa",
    fontSize: "14px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "25px",
  },

  inputGroup: {
    position: "relative",
  },

  input: {
    width: "100%",
    padding: "14px",
    background: "transparent",
    border: "1px solid #333",
    borderRadius: "10px",
    color: "#fff",
    outline: "none",
  },

  floatingLabel: {
    position: "absolute",
    top: "50%",
    left: "12px",
    transform: "translateY(-50%)",
    color: "#777",
    fontSize: "13px",
    pointerEvents: "none",
  },

  showToggle: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
  },

  loginBtn: {
    background: "linear-gradient(135deg, #ff7a00, #ff3c3c)",
    border: "none",
    padding: "14px",
    borderRadius: "10px",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    transition: "0.3s",
  },

  links: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "15px",
  },

  link: {
    color: "#ff7a00",
    fontSize: "13px",
    textDecoration: "none",
  },

  footer: {
    marginTop: "20px",
    textAlign: "center",
    color: "#aaa",
  },

  userLink: {
    color: "#ff7a00",
  },

  sidePanel: {
    flex: 1,
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  sideTitle: {
    fontSize: "28px",
    marginBottom: "15px",
    color: "#ff7a00",
  },

  sideText: {
    color: "#aaa",
    marginBottom: "20px",
  },

  features: {
    listStyle: "none",
    padding: 0,
    lineHeight: "2",
  },

  errorBox: {
    background: "rgba(255,0,0,0.1)",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "15px",
    color: "#ff4d4d",
  },
};

export default AdminLogin;