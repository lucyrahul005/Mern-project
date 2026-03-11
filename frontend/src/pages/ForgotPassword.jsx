import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(`${API_URL}/forgot-password`, { email });
      setMessage(res.data.message);
    } catch (err) {
      setMessage("Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.logo}>
        Web<span style={styles.brandAccent}>n</span>App
      </div>

      <div style={styles.card}>
        <h2 style={styles.title}>Reset Your Password</h2>
        <p style={styles.subtitle}>
          Enter your registered email to receive a reset link.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Enter your email"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 50% 0%, #1a1a1a 0%, #0a0a0a 40%, #000000 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: "100px",
  },

  logo: {
    fontSize: "36px",
    fontWeight: "700",
    letterSpacing: "3px",
    marginBottom: "60px",
    color: "#f5f5f7",
    textShadow: "0 0 25px rgba(255,255,255,0.15)",
  },

  brandAccent: {
    fontWeight: "900",
  },

  card: {
    width: "420px",
    padding: "45px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(25px)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 40px 80px rgba(0,0,0,0.9)",
  },

  title: {
    color: "#f5f5f7",
    marginBottom: "10px",
    fontWeight: "500",
  },

  subtitle: {
    color: "#aaa",
    fontSize: "14px",
    marginBottom: "25px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  input: {
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid #2a2a2a",
    background: "#111",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
  },

  button: {
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    background: "#f5f5f7",
    color: "#000",
    fontWeight: "600",
    cursor: "pointer",
  },

  message: {
    marginTop: "20px",
    fontSize: "14px",
    color: "#aaa",
  },
};

export default ForgotPassword;
