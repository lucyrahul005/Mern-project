import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config/api";

function AdminResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("❌ Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("❌ Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("❌ Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/reset-password/${token}`,
        { password }
      );

      setSuccess("✅ " + (res.data.message || "Password reset successfully! Redirecting to login..."));
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/admin-login");
      }, 2000);
    } catch (err) {
      console.error("❌ Error:", err);
      const errorMsg = err.response?.data?.message || "Failed to reset password";
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
            <h1 style={styles.title}>🔐 Reset Admin Password</h1>
            <p style={styles.subtitle}>Create a new password for your admin account</p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {success && <div style={styles.successBox}>{success}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>🔑 New Password</label>
              <div style={styles.passwordInput}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.toggleBtn}
                >
                  {showPassword ? "🙈 Hide" : "👁️ Show"}
                </button>
              </div>
              <p style={styles.hint}>Minimum 6 characters</p>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>✓ Confirm Password</label>
              <div style={styles.passwordInput}>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={styles.toggleBtn}
                >
                  {showConfirm ? "🙈 Hide" : "👁️ Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "⏳ Resetting..." : "🔐 Reset Password"}
            </button>
          </form>

          <div style={styles.divider}>or</div>

          <div style={styles.footer}>
            <p>Remember your password? <Link to="/admin-login" style={styles.link}>Login here</Link></p>
          </div>

          <div style={styles.securityBox}>
            <h4>🛡️ Password Security Tips</h4>
            <ul style={styles.list}>
              <li>Use a combination of uppercase and lowercase letters</li>
              <li>Include numbers and special characters</li>
              <li>Avoid using personal information</li>
              <li>Use a unique password you don't use elsewhere</li>
            </ul>
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
    maxWidth: "450px",
    width: "100%",
  },
  card: {
    background: "#111",
    border: "2px solid #ff7a00",
    borderRadius: "16px",
    padding: "40px",
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
  passwordInput: {
    display: "flex",
    gap: "8px",
  },
  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#0a0a0a",
    color: "#fff",
    fontSize: "14px",
    transition: "all 0.3s ease",
  },
  toggleBtn: {
    padding: "12px 16px",
    background: "#333",
    color: "#ff7a00",
    border: "1px solid #333",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    transition: "all 0.3s ease",
  },
  hint: {
    fontSize: "12px",
    color: "#666",
    marginTop: "6px",
    margin: "6px 0 0 0",
  },
  submitBtn: {
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
  divider: {
    textAlign: "center",
    color: "#666",
    fontSize: "12px",
    margin: "25px 0",
  },
  footer: {
    textAlign: "center",
    fontSize: "13px",
    color: "#999",
  },
  link: {
    color: "#ff7a00",
    textDecoration: "none",
    fontWeight: "600",
  },
  securityBox: {
    background: "rgba(255, 122, 0, 0.05)",
    border: "1px solid #ff7a00",
    borderRadius: "8px",
    padding: "15px",
    marginTop: "25px",
    fontSize: "12px",
  },
  list: {
    margin: "8px 0 0 0",
    paddingLeft: "20px",
    color: "#ccc",
  },
};

export default AdminResetPassword;
