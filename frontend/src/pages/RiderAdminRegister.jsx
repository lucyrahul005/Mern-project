import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../pages/Auth.css";

const RiderAdminRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",

    // Step 2: Personal Details
    profileImage: "",
    dateOfBirth: "",
    gender: "",

    // Step 3: Address Details
    currentAddress: "",
    city: "",
    pincode: "",

    // Step 4: Vehicle Details
    vehicleType: "",
    vehicleNumber: "",
    drivingLicense: "",

    // Step 5: ID Proof
    aadhar: "",
    panCard: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size - reject if over 2MB originally
    if (file.size > 2 * 1024 * 1024) {
      setError("❌ Image too large. Please select an image smaller than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setError("❌ Error reading image file");
    };
    reader.onload = () => {
      try {
        const img = new Image();
        img.onerror = () => {
          setError("❌ Error loading image");
        };
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Keep aspect ratio but reduce size
          let width = img.width;
          let height = img.height;
          const maxDim = 600; // Reduced from 800
          
          if (width > height) {
            if (width > maxDim) {
              height = (height * maxDim) / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = (width * maxDim) / height;
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Heavy compression - quality 0.5
          const compressedImage = canvas.toDataURL('image/jpeg', 0.5);
          console.log(`✅ Image compressed: ${(reader.result.length / 1024).toFixed(2)}KB → ${(compressedImage.length / 1024).toFixed(2)}KB`);
          
          setFormData((prev) => ({
            ...prev,
            profileImage: compressedImage,
          }));
        };
        
        img.src = reader.result;
      } catch (err) {
        console.error("Error in image compression:", err);
        setError("❌ Error processing image");
      }
    };
    
    reader.readAsDataURL(file);
  };

  const validateStep = (stepNum) => {
    if (stepNum === 1) {
      if (!formData.name.trim()) {
        setError("Name is required");
        return false;
      }
      if (!formData.email.trim()) {
        setError("Email is required");
        return false;
      }
      if (!formData.phone.trim() || formData.phone.length < 10) {
        setError("Valid phone number (10 digits) is required");
        return false;
      }
      if (!formData.password || formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
    }

    if (stepNum === 4) {
      if (!formData.vehicleType) {
        setError("Vehicle type is required");
        return false;
      }
      if (!formData.vehicleNumber.trim()) {
        setError("Vehicle number is required");
        return false;
      }
      if (!formData.drivingLicense.trim()) {
        setError("Driving license number is required");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(step)) {
      return;
    }

    if (step < 5) {
      setStep(step + 1);
      return;
    }

    // Submit on final step
    setLoading(true);
    try {
      console.log("📤 Submitting rider registration...");
      
      // Build the request body WITHOUT profileImage to keep payload small
      const requestData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        // ⚠️ IMPORTANT: Skip profileImage in registration - send only text data
        // profileImage will be uploaded separately if needed
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: {
          currentAddress: formData.currentAddress,
          city: formData.city,
          pincode: formData.pincode,
        },
        vehicle: {
          type: formData.vehicleType,
          number: formData.vehicleNumber,
          license: formData.drivingLicense,
        },
        aadhar: formData.aadhar,
        panCard: formData.panCard,
      };

      // Log total payload size
      const totalSize = JSON.stringify(requestData).length;
      console.log(`📊 Registration payload size (no image): ${(totalSize / 1024).toFixed(2)}KB`);
      if (formData.profileImage) {
        console.log(`ℹ️ Profile image (${(formData.profileImage.length / 1024).toFixed(2)}KB) will be uploaded separately after registration`);
      }

      const response = await fetch(
        "http://localhost:5001/api/rider/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const data = await response.json();
      console.log("📥 Response:", data);

      if (response.ok) {
        // Save rider data
        sessionStorage.setItem("riderToken", data.token);
        sessionStorage.setItem("riderRole", "rider");
        sessionStorage.setItem("riderName", data.rider.name);
        sessionStorage.setItem("riderData", JSON.stringify(data.rider));

        alert("✅ Registration successful! Your request has been sent to admin for approval.");
        
        navigate("/rideradmin");
      } else {
        setError(data.message || "Registration failed");
        console.error("❌ Registration error:", data);
      }
    } catch (err) {
      console.error("❌ Network/Server error:", err);
      setError(
        "🔴 Server error - Please ensure backend is running on port 5001. Check browser console for details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError("");
    }
  };

  const inputStyle = {
    width: "100%",
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    padding: "12px 16px",
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "13px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    marginBottom: "12px",
    boxSizing: "border-box",
    backdropFilter: "blur(10px)"
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
        padding: "30px 20px",
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
          padding: "42px 40px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
          position: "relative",
          zIndex: 2,
          animation: "fadeIn 0.6s ease-out"
        }}
      >
        <h2 style={{ fontSize: "28px", color: "#fff", margin: "0 0 6px 0", fontWeight: 700, textAlign: "center" }}>🛵 Rider Registration</h2>
        <p style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.7)", margin: "0 0 24px 0", fontSize: "13px", fontWeight: 500 }}>
          Step {step} of 5 - {
            step === 1 && "Basic Information"
          }
          {step === 2 && "Personal Details"}
          {step === 3 && "Address Details"}
          {step === 4 && "Vehicle Details"}
          {step === 5 && "ID Proof"}
        </p>

        {error && (
          <div 
            className="error-message"
            style={{
              background: "rgba(255, 107, 107, 0.1)",
              color: "#ff8a8a",
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontSize: "13px",
              border: "1px solid rgba(255, 107, 107, 0.2)",
              boxShadow: "0 4px 15px rgba(255, 107, 107, 0.1)"
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <>
              <input
                type="text"
                name="name"
                placeholder="Full Name *"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
              <input
                type="email"
                name="email"
                placeholder="Email *"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number (10 digits) *"
                value={formData.phone}
                onChange={handleInputChange}
                maxLength="10"
                required
                style={inputStyle}
              />
              <input
                type="password"
                name="password"
                placeholder="Password (min 6 characters) *"
                value={formData.password}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password *"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
            </>
          )}

          {/* Step 2: Personal Details */}
          {step === 2 && (
            <>
              <div className="profile-image-upload" style={{ marginBottom: "12px" }}>
                <label style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "8px" }}>Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{
                    ...inputStyle,
                    marginBottom: "8px",
                    padding: "8px 12px"
                  }}
                />
                {formData.profileImage && (
                  <img
                    src={formData.profileImage}
                    alt="Profile"
                    className="profile-preview"
                    style={{
                      width: "100%",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      marginTop: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)"
                    }}
                  />
                )}
              </div>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                style={inputStyle}
              />
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                style={{
                  ...inputStyle,
                  color: formData.gender ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.5)"
                }}
              >
                <option value="" style={{ background: "#050508", color: "rgba(255, 255, 255, 0.5)" }}>Select Gender (Optional)</option>
                <option value="Male" style={{ background: "#050508" }}>Male</option>
                <option value="Female" style={{ background: "#050508" }}>Female</option>
                <option value="Other" style={{ background: "#050508" }}>Other</option>
              </select>
            </>
          )}

          {/* Step 3: Address Details */}
          {step === 3 && (
            <>
              <textarea
                name="currentAddress"
                placeholder="Current Address"
                value={formData.currentAddress}
                onChange={handleInputChange}
                rows="3"
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  fontFamily: "inherit"
                }}
              />
              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleInputChange}
                style={inputStyle}
              />
              <input
                type="text"
                name="pincode"
                placeholder="Pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                style={inputStyle}
              />
            </>
          )}

          {/* Step 4: Vehicle Details */}
          {step === 4 && (
            <>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleInputChange}
                required
                style={{
                  ...inputStyle,
                  color: formData.vehicleType ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.5)"
                }}
              >
                <option value="" style={{ background: "#050508", color: "rgba(255, 255, 255, 0.5)" }}>Select Vehicle Type *</option>
                <option value="Bike" style={{ background: "#050508" }}>Bike 🏍️</option>
                <option value="Scooter" style={{ background: "#050508" }}>Scooter 🛵</option>
                <option value="Cycle" style={{ background: "#050508" }}>Cycle 🚲</option>
                <option value="Car" style={{ background: "#050508" }}>Car 🚗</option>
              </select>
              <input
                type="text"
                name="vehicleNumber"
                placeholder="Vehicle Number (e.g., AP09AB1234) *"
                value={formData.vehicleNumber}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
              <input
                type="text"
                name="drivingLicense"
                placeholder="Driving License Number *"
                value={formData.drivingLicense}
                onChange={handleInputChange}
                required
                style={inputStyle}
              />
            </>
          )}

          {/* Step 5: ID Proof */}
          {step === 5 && (
            <>
              <input
                type="text"
                name="aadhar"
                placeholder="Aadhar Number (12 digits)"
                value={formData.aadhar}
                onChange={handleInputChange}
                maxLength="12"
                style={inputStyle}
              />
              <input
                type="text"
                name="panCard"
                placeholder="PAN Card (10 digits)"
                value={formData.panCard}
                onChange={handleInputChange}
                maxLength="10"
                style={inputStyle}
              />
              <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "12px", marginTop: "12px", padding: "10px 12px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)", margin: "12px 0 0 0" }}>
                ℹ️ Provide at least one valid ID proof for KYC verification
              </p>
            </>
          )}

          <div className="button-group" style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="btn-secondary"
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "rgba(255, 255, 255, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "10px",
                  padding: "12px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.12)";
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.08)";
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.15)";
                }}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="auth-btn"
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #ff7a00, #ff5252)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "13px",
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
              {loading
                ? "Processing..."
                : step === 5
                  ? "Complete Registration"
                  : "Next"}
            </button>
          </div>
        </form>

        <p style={{ textAlign: "center", marginTop: "24px", color: "rgba(255, 255, 255, 0.6)", fontSize: "13px" }}>
          Already a rider?{" "}
          <Link 
            to="/rideradmin-login" 
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
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RiderAdminRegister;
