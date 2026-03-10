import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./RestaurantAdminRegister.css";

const API_URL = "http://localhost:5001";

function RestaurantAdminRegister() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [restaurantId, setRestaurantId] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    name: "",
    email: "",
    password: "",
    confirmPassword: "",

    // Step 2: Restaurant Info
    restaurantName: "",
    restaurantDescription: "",
    cuisine: "Indian",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",

    // Step 3: Legal Documents
    fssaiNumber: "",
    gstNumber: "",
    restaurantImages: [],
    menuImages: [],
    idProof: null,
    fssaiCertificate: null,
    gstCertificate: null,

    // Step 4: Bank Details
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
  });

  const cuisineOptions = [
    "Indian",
    "Chinese",
    "Italian",
    "Mexican",
    "American",
    "Thai",
    "Continental",
    "Fusion",
    "North Indian",
    "South Indian",
    "Fast Food",
    "Cafe",
    "Bakery",
    "Desserts",
  ];

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === "file") {
      setFormData({
        ...formData,
        [name]: files[0],
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const validateStep = (step) => {
    setError("");

    if (step === 1) {
      if (!formData.name.trim()) {
        setError("❌ Please enter your name");
        return false;
      }
      if (!formData.email.includes("@")) {
        setError("❌ Please enter a valid email");
        return false;
      }
      if (formData.password.length < 6) {
        setError("❌ Password must be at least 6 characters");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("❌ Passwords do not match");
        return false;
      }
    }

    if (step === 2) {
      if (!formData.restaurantName.trim()) {
        setError("❌ Please enter restaurant name");
        return false;
      }
      if (!formData.phone.trim()) {
        setError("❌ Please enter phone number");
        return false;
      }
      if (!formData.city.trim()) {
        setError("❌ Please enter city");
        return false;
      }
    }

    if (step === 3) {
      if (!formData.fssaiNumber.trim()) {
        setError("❌ Please enter FSSAI number");
        return false;
      }
      if (!formData.gstNumber.trim()) {
        setError("❌ Please enter GST number");
        return false;
      }
      if (!formData.idProof) {
        setError("❌ Please upload ID proof");
        return false;
      }
      if (!formData.fssaiCertificate) {
        setError("❌ Please upload FSSAI certificate");
        return false;
      }
      if (!formData.gstCertificate) {
        setError("❌ Please upload GST certificate");
        return false;
      }
    }

    if (step === 4) {
      if (!formData.accountHolderName.trim()) {
        setError("❌ Please enter account holder name");
        return false;
      }
      if (!formData.accountNumber.trim()) {
        setError("❌ Please enter account number");
        return false;
      }
      if (!formData.ifscCode.trim()) {
        setError("❌ Please enter IFSC code");
        return false;
      }
      if (!formData.bankName.trim()) {
        setError("❌ Please enter bank name");
        return false;
      }
    }

    return true;
  };

  const handleNextStep = async () => {
    if (!validateStep(currentStep)) {
      return; // Validation failed, error already set
    }

    // Only register on Step 2 (after collecting restaurant info)
    if (currentStep === 2 && !restaurantId) {
      try {
        setLoading(true);
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          restaurantName: formData.restaurantName.trim(),
          restaurantDescription: formData.restaurantDescription.trim(),
          cuisine: formData.cuisine,
          phone: formData.phone.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        };

        const res = await axios.post(`${API_URL}/api/auth/register-restaurant-admin`, payload);
        setRestaurantId(res.data.restaurant._id);
        
        // Store token for later use
        localStorage.setItem("_temp_restaurantAdminToken", res.data.token);
        localStorage.setItem("_temp_restaurantAdmin", JSON.stringify(res.data.user));
        
        setSuccess("✅ Restaurant registered! Proceeding to document verification...");
        setLoading(false);
        setCurrentStep(currentStep + 1);
      } catch (err) {
        setError("❌ " + (err.response?.data?.message || err.message));
        setLoading(false);
      }
    } else {
      // For steps 1, 3, 4 - just move to next step
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("_temp_restaurantAdminToken");

      const formPayload = new FormData();
      
      // Add documents
      if (formData.idProof) formPayload.append("idProof", formData.idProof);
      if (formData.fssaiCertificate) formPayload.append("fssaiCertificate", formData.fssaiCertificate);
      if (formData.gstCertificate) formPayload.append("gstCertificate", formData.gstCertificate);

      // Add other fields
      formPayload.append("fssaiNumber", formData.fssaiNumber);
      formPayload.append("gstNumber", formData.gstNumber);
      formPayload.append("accountHolderName", formData.accountHolderName);
      formPayload.append("accountNumber", formData.accountNumber);
      formPayload.append("ifscCode", formData.ifscCode);
      formPayload.append("bankName", formData.bankName);

      const res = await axios.put(
        `${API_URL}/api/restaurant-admin/profile`,
        formPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Clear temp storage
      localStorage.removeItem("_temp_restaurantAdminToken");
      localStorage.removeItem("_temp_restaurantAdmin");

      setSuccess("✅ Registration complete! Redirecting to login...");
      setTimeout(() => {
        navigate("/restaurantadmin-login");
      }, 2000);
    } catch (err) {
      setError("❌ " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>🍽️ Register Your Restaurant</h1>
            <p style={styles.subtitle}>Step {currentStep} of 4 - {["Personal Info", "Restaurant Details & Registration", "Legal Documents", "Bank Details"][currentStep - 1]}</p>
          </div>

          <div style={styles.progressBar}>
            <div style={{ ...styles.progress, width: `${(currentStep / 4) * 100}%` }}></div>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {success && <div style={styles.successBox}>{success}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* STEP 1: PERSONAL INFO */}
            {currentStep === 1 && (
              <div style={styles.stepContent}>
                <h2 style={styles.stepTitle}>👤 Your Personal Information</h2>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.twoColumn}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Password *</label>
                    <input
                      type="password"
                      name="password"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: RESTAURANT INFO */}
            {currentStep === 2 && (
              <div style={styles.stepContent}>
                <h2 style={styles.stepTitle}>🏪 Restaurant Information</h2>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Restaurant Name *</label>
                  <input
                    type="text"
                    name="restaurantName"
                    placeholder="Enter restaurant name"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    name="restaurantDescription"
                    placeholder="Tell us about your restaurant..."
                    value={formData.restaurantDescription}
                    onChange={handleChange}
                    style={{ ...styles.input, minHeight: "80px", resize: "none" }}
                  />
                </div>

                <div style={styles.twoColumn}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Cuisine Type *</label>
                    <select
                      name="cuisine"
                      value={formData.cuisine}
                      onChange={handleChange}
                      style={styles.input}
                    >
                      {cuisineOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                </div>

                <h3 style={{ ...styles.label, marginTop: "20px" }}>📍 Location Details</h3>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Street Address</label>
                  <input
                    type="text"
                    name="street"
                    placeholder="Enter street address"
                    value={formData.street}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.twoColumn}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>City *</label>
                    <input
                      type="text"
                      name="city"
                      placeholder="Enter city"
                      value={formData.city}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>State</label>
                    <input
                      type="text"
                      name="state"
                      placeholder="Enter state"
                      value={formData.state}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    placeholder="Enter pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>
            )}

            {/* STEP 3: LEGAL DOCUMENTS */}
            {currentStep === 3 && (
              <div style={styles.stepContent}>
                <h2 style={styles.stepTitle}>📋 Legal Documents & Verification</h2>

                <div style={styles.twoColumn}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>FSSAI Number *</label>
                    <input
                      type="text"
                      name="fssaiNumber"
                      placeholder="Enter FSSAI number"
                      value={formData.fssaiNumber}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>GST Number *</label>
                    <input
                      type="text"
                      name="gstNumber"
                      placeholder="Enter GST number"
                      value={formData.gstNumber}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.fileGroup}>
                  <label style={styles.label}>ID Proof (Aadhar/PAN/License) *</label>
                  <input
                    type="file"
                    name="idProof"
                    accept="image/*,application/pdf"
                    onChange={handleChange}
                    style={styles.fileInput}
                  />
                  <p style={styles.fileHint}>📸 Upload clear image or PDF</p>
                </div>

                <div style={styles.fileGroup}>
                  <label style={styles.label}>FSSAI Certificate *</label>
                  <input
                    type="file"
                    name="fssaiCertificate"
                    accept="image/*,application/pdf"
                    onChange={handleChange}
                    style={styles.fileInput}
                  />
                  <p style={styles.fileHint}>📸 Upload certificate</p>
                </div>

                <div style={styles.fileGroup}>
                  <label style={styles.label}>GST Certificate *</label>
                  <input
                    type="file"
                    name="gstCertificate"
                    accept="image/*,application/pdf"
                    onChange={handleChange}
                    style={styles.fileInput}
                  />
                  <p style={styles.fileHint}>📸 Upload certificate</p>
                </div>
              </div>
            )}

            {/* STEP 4: BANK DETAILS */}
            {currentStep === 4 && (
              <div style={styles.stepContent}>
                <h2 style={styles.stepTitle}>🏦 Bank Account Details</h2>
                <p style={styles.stepSubtitle}>For receiving payments and payouts</p>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Account Holder Name *</label>
                  <input
                    type="text"
                    name="accountHolderName"
                    placeholder="Enter account holder name"
                    value={formData.accountHolderName}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Account Number *</label>
                  <input
                    type="text"
                    name="accountNumber"
                    placeholder="Enter account number"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>

                <div style={styles.twoColumn}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>IFSC Code *</label>
                    <input
                      type="text"
                      name="ifscCode"
                      placeholder="e.g., HDFC0000001"
                      value={formData.ifscCode}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Bank Name *</label>
                    <input
                      type="text"
                      name="bankName"
                      placeholder="Enter bank name"
                      value={formData.bankName}
                      onChange={handleChange}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.warningBox}>
                  ⚠️ Ensure all details are correct. They cannot be changed later.
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={styles.navigation}>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={loading}
                  style={{...styles.button, background: "#666", flex: 1, marginRight: "10px"}}
                >
                  ← Back
                </button>
              )}
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={loading}
                  style={{...styles.button, flex: 1}}
                >
                  {loading ? "⏳ Processing..." : "Next →"}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  style={{...styles.button, flex: 1}}
                >
                  {loading ? "⏳ Submitting..." : "✓ Complete Registration"}
                </button>
              )}
            </div>

            {/* Login Link */}
            <div style={styles.footer}>
              Already have an account?{" "}
              <Link to="/restaurantadmin-login" style={styles.link}>
                Login here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #121212, #080808)",
    padding: "60px 6%",
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    position: "relative",
    overflow: "hidden",
  },

  container: {
    maxWidth: "700px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },

  card: {
    background: "rgba(255, 255, 255, 0.04)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderRadius: "22px",
    padding: "40px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    width: "100%",
    transition: "all 0.4s ease",
  },

  header: {
    marginBottom: "24px",
    textAlign: "center",
  },

  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 8px 0",
    letterSpacing: "0.5px",
  },

  subtitle: {
    fontSize: "13px",
    color: "#aaa",
    margin: "0",
    fontWeight: "500",
  },

  progressBar: {
    width: "100%",
    height: "6px",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
    marginBottom: "20px",
    overflow: "hidden",
  },

  progress: {
    height: "100%",
    background: "linear-gradient(90deg, #ff7a00, #ff3c3c)",
    transition: "width 0.3s ease",
    borderRadius: "10px",
  },

  errorBox: {
    background: "rgba(255, 60, 60, 0.15)",
    backdropFilter: "blur(5px)",
    border: "1px solid rgba(255, 60, 60, 0.3)",
    color: "#ffcccc",
    padding: "12px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
    fontSize: "13px",
    fontWeight: "500",
  },

  successBox: {
    background: "rgba(107, 255, 107, 0.15)",
    backdropFilter: "blur(5px)",
    border: "1px solid rgba(107, 255, 107, 0.3)",
    color: "#ccffcc",
    padding: "12px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
    fontSize: "13px",
    fontWeight: "500",
  },

  warningBox: {
    background: "rgba(255, 193, 7, 0.15)",
    border: "1px solid rgba(255, 193, 7, 0.3)",
    color: "#ffd699",
    padding: "12px 16px",
    borderRadius: "12px",
    marginTop: "20px",
    fontSize: "13px",
    fontWeight: "500",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },

  stepContent: {
    animation: "fadeIn 0.3s ease",
  },

  stepTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "8px",
    marginTop: "0",
  },

  stepSubtitle: {
    fontSize: "13px",
    color: "#aaa",
    marginBottom: "24px",
    fontWeight: "500",
  },

  twoColumn: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "16px",
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "16px",
  },

  fileGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "16px",
  },

  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#bbb",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  input: {
    padding: "12px 14px",
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "12px",
    fontSize: "13px",
    fontFamily: "inherit",
    transition: "all 0.3s ease",
    outline: "none",
    boxSizing: "border-box",
    color: "#fff",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },

  fileInput: {
    padding: "12px 14px",
    background: "rgba(255, 255, 255, 0.06)",
    border: "2px dashed rgba(255, 122, 0, 0.3)",
    borderRadius: "12px",
    fontSize: "13px",
    fontFamily: "inherit",
    transition: "all 0.3s ease",
    outline: "none",
    boxSizing: "border-box",
    color: "#fff",
    cursor: "pointer",
  },

  fileHint: {
    fontSize: "11px",
    color: "#888",
    margin: "4px 0 0 0",
  },

  navigation: {
    display: "flex",
    gap: "12px",
    marginTop: "32px",
  },

  button: {
    padding: "14px 20px",
    background: "linear-gradient(135deg, #ff7a00, #ff3c3c)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 8px 20px rgba(255, 122, 0, 0.3)",
    letterSpacing: "0.5px",
    pointerEvents: "auto",
    zIndex: 10,
    position: "relative",
  },

  footer: {
    textAlign: "center",
    marginTop: "24px",
    fontSize: "13px",
    color: "#aaa",
  },

  link: {
    color: "#ff7a00",
    textDecoration: "none",
    fontWeight: "700",
    cursor: "pointer",
    transition: "color 0.3s ease",
  },

  "@media (max-width: 768px)": {
    wrapper: {
      padding: "40px 4%",
    },
    card: {
      padding: "30px",
    },
    title: {
      fontSize: "22px",
    },
    twoColumn: {
      gridTemplateColumns: "1fr",
    },
    navigation: {
      flexDirection: "column-reverse",
    },
  },
};

export default RestaurantAdminRegister;
