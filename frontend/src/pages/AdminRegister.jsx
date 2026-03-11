import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function AdminRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("❌ Please fill all fields");
      return;
    }

    if (formData.password.length < 6) {
      setError("❌ Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("❌ Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        isAdmin: false, // User registers as regular user first
      });

      setSuccess("✅ Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/admin-login");
      }, 2000);
    } catch (err) {
      console.error("❌ Registration error:", err);
      const errorMsg = err.response?.data?.message || "Registration failed";
      setError("❌ " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>➕ Admin Registration</h1>
            <p style={styles.subtitle}>Create Your Admin Account</p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {success && <div style={styles.successBox}>{success}</div>}

          <form onSubmit={handleRegister} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>👤 Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>📧 Email</label>
              <input
                type="email"
                name="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>🔐 Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>🔐 Confirm Password</label>
              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{...styles.input, marginBottom: 0}}
                />
                <button
                  type="button"
                  style={styles.showPasswordBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈 Hide" : "👁️ Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.registerBtn,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "🔄 Creating account..." : "✅ Create Admin Account"}
            </button>
          </form>

          <div style={styles.footer}>
            <p>Already have an account? <Link to="/admin-login" style={styles.link}>Login here</Link></p>
          </div>

          <div style={styles.infoBox}>
            <h4>📝 Important</h4>
            <p>Please note: Regular admin accounts need to be manually approved by superadmin. Contact your administrator after registration.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #000 0%, #1a1a1a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    display: "flex",
    gap: "40px",
    maxWidth: "500px",
    width: "100%",
  },
  card: {
    background: "#111",
    border: "2px solid #ff7a00",
    borderRadius: "16px",
    padding: "40px",
    flex: 1,
    boxShadow: "0 10px 40px rgba(255, 122, 0, 0.2)",
  },
  header: {
    textAlign: "center",
    marginBottom: "30px",
  },
  title: {
    fontSize: "28px",
    color: "#ff7a00",
    margin: 0,
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#999",
    margin: 0,
  },
  errorBox: {
    background: "rgba(244, 67, 54, 0.1)",
    border: "1px solid #f44336",
    color: "#ff5252",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px",
  },
  successBox: {
    background: "rgba(76, 175, 80, 0.1)",
    border: "1px solid #4caf50",
    color: "#66bb6a",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#ff7a00",
    marginBottom: "8px",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#0a0a0a",
    color: "#fff",
    fontSize: "14px",
    transition: "all 0.3s ease",
  },
  passwordWrapper: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  showPasswordBtn: {
    padding: "8px 12px",
    background: "#333",
    border: "1px solid #444",
    color: "#fff",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    whiteSpace: "nowrap",
    transition: "all 0.3s ease",
  },
  registerBtn: {
    padding: "12px",
    background: "#ff7a00",
    color: "black",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
    transition: "all 0.3s ease",
    marginTop: "10px",
  },
  footer: {
    textAlign: "center",
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid #333",
    fontSize: "13px",
    color: "#999",
  },
  link: {
    color: "#ff7a00",
    textDecoration: "none",
    fontWeight: "600",
  },
  infoBox: {
    background: "rgba(255, 122, 0, 0.05)",
    border: "1px solid #ff7a00",
    borderRadius: "8px",
    padding: "15px",
    marginTop: "20px",
    fontSize: "12px",
  },
};

export default AdminRegister;
