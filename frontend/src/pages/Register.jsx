import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate inputs
    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, {
        name,
        email,
        password,
      });
      console.log("REGISTER RESPONSE 👉", res.data);
      setSuccess("✅ Successfully registered! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Registration failed. Try again.";
      console.error("Registration error:", err);
      setError(errorMsg);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.logo}>
        Web<span style={styles.brandAccent}>n</span>App
      </div>

      <div style={styles.card}>
        <h2 style={styles.title}>Create your account</h2>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        <form onSubmit={handleRegister} style={styles.form}>
          <input
            type="text"
            placeholder="Full Name"
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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

          <button type="submit" style={styles.button}>
            Continue
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Sign in
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

  successBox: {
    background: "rgba(52, 199, 89, 0.1)",
    color: "#30d158",
    padding: "10px",
    borderRadius: "12px",
    fontSize: "13px",
    marginBottom: "20px",
    border: "1px solid rgba(52, 199, 89, 0.3)",
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

export default Register;
