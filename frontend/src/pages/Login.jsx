import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : "https://webnapp-backend.onrender.com";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/");
    } catch (err) {
      setError("Invalid email or password");
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
        <h2 style={styles.title}>Welcome Back</h2>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* 🔥 Forgot Password */}
          <div style={styles.forgotWrapper}>
            <Link to="/forgot-password" style={styles.forgotLink}>
              Forgot Password?
            </Link>
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>

        <p style={styles.footer}>
          New here?{" "}
          <Link to="/register" style={styles.link}>
            Create account
          </Link>
        </p>
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
    marginBottom: "70px",
    color: "#f5f5f7",
    textShadow: "0 0 25px rgba(255,255,255,0.15)",
  },

  brandAccent: {
    fontWeight: "900",
  },

  card: {
    width: "400px",
    padding: "45px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(25px)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 40px 80px rgba(0,0,0,0.9)",
  },

  title: {
    color: "#f5f5f7",
    marginBottom: "20px",
    fontWeight: "500",
  },

  errorBox: {
    background: "rgba(255, 59, 48, 0.1)",
    color: "#ff453a",
    padding: "10px",
    borderRadius: "12px",
    fontSize: "13px",
    marginBottom: "20px",
    border: "1px solid rgba(255, 59, 48, 0.3)",
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

  forgotWrapper: {
    textAlign: "right",
    marginTop: "-8px",
  },

  forgotLink: {
    fontSize: "13px",
    color: "#aaa",
    textDecoration: "none",
    transition: "0.3s",
  },

  button: {
    marginTop: "10px",
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    background: "#f5f5f7",
    color: "#000",
    fontWeight: "600",
    cursor: "pointer",
  },

  footer: {
    marginTop: "25px",
    fontSize: "14px",
    color: "#999",
    textAlign: "center",
  },

  link: {
    color: "#f5f5f7",
    textDecoration: "none",
  },
};

export default Login;
