import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config/api";

function AdminForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("❌ Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email,
      });

      setSuccess("✅ " + (res.data.message || "Password reset link sent to your email!"));
      setEmail("");
      
      setTimeout(() => {
        navigate("/admin-login");
      }, 3000);
    } catch (err) {
      console.error("❌ Error:", err);
      const errorMsg = err.response?.data?.message || "Failed to send reset link";
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
            <h1 style={styles.title}>🔑 Forgot Password?</h1>
            <p style={styles.subtitle}>Reset Your Admin Password</p>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {success && <div style={styles.successBox}>{success}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>📧 Admin Email</label>
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
              <p style={styles.hint}>Enter the email associated with your admin account</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "🔄 Sending..." : "📧 Send Reset Link"}
            </button>
          </form>

          <div style={styles.divider}>or</div>

          <div style={styles.footer}>
            <p>Remember your password? <Link to="/admin-login" style={styles.link}>Login here</Link></p>
          </div>

          <div style={styles.infoBox}>
            <h4>📝 What happens next?</h4>
            <p>We'll send you an email with instructions to reset your password. Click the link in the email to create a new password.</p>
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
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#0a0a0a",
    color: "#fff",
    fontSize: "14px",
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
  infoBox: {
    background: "rgba(255, 122, 0, 0.05)",
    border: "1px solid #ff7a00",
    borderRadius: "8px",
    padding: "15px",
    marginTop: "25px",
    fontSize: "12px",
  },
};

export default AdminForgotPassword;
