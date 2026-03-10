import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RiderPendingApproval.css";

const RiderPendingApproval = () => {
  const navigate = useNavigate();
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    setShowAnimation(true);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("riderToken");
    sessionStorage.removeItem("riderRole");
    sessionStorage.removeItem("riderData");
    sessionStorage.removeItem("riderName");
    navigate("/rideradmin-login");
  };

  return (
    <div className="pending-approval-wrapper">
      {/* Animated gradient background */}
      <div className="gradient-bg"></div>
      <div className="gradient-blur"></div>

      {/* Floating elements */}
      <div className="floating-element float-1"></div>
      <div className="floating-element float-2"></div>
      <div className="floating-element float-3"></div>

      {/* Main content */}
      <div className="pending-container">
        <div className={`pending-card ${showAnimation ? "animate-in" : ""}`}>
          {/* Top section with circular icon */}
          <div className="pending-icon-section">
            <div className="pending-icon">
              <div className="icon-inner">
                <span className="hourglass">⏳</span>
              </div>
            </div>
            <div className="pulse-ring"></div>
          </div>

          {/* Title and description */}
          <div className="pending-content">
            <h1 className="pending-title">Application Under Review</h1>
            <p className="pending-subtitle">
              Your registration has been received and is being reviewed by our admin team.
            </p>

            {/* Status indicator */}
            <div className="status-box">
              <div className="status-header">
                <span className="status-label">Current Status</span>
                <span className="status-badge">Pending</span>
              </div>
              <div className="status-steps">
                <div className="step active">
                  <div className="step-icon">✓</div>
                  <div className="step-label">Registration Submitted</div>
                </div>
                <div className="step-line"></div>
                <div className="step">
                  <div className="step-icon">2</div>
                  <div className="step-label">Admin Review</div>
                </div>
                <div className="step-line"></div>
                <div className="step">
                  <div className="step-icon">3</div>
                  <div className="step-label">Approval Complete</div>
                </div>
              </div>
            </div>

            {/* Timeline info */}
            <div className="timeline-section">
              <h3>What happens next?</h3>
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <h4>📋 Documents Review</h4>
                    <p>Our team will verify your vehicle details, KYC documents, and bank information.</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <h4>✅ Verification</h4>
                    <p>We'll validate your information and ensure everything meets our quality standards.</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <h4>🚀 Activation</h4>
                    <p>Once approved, you'll get instant access to start accepting deliveries and earning!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info boxes */}
            <div className="info-boxes">
              <div className="info-box">
                <div className="info-icon">⏱️</div>
                <div className="info-text">
                  <h4>Expected Timeline</h4>
                  <p>Typically 24-48 hours</p>
                </div>
              </div>
              <div className="info-box">
                <div className="info-icon">🔔</div>
                <div className="info-text">
                  <h4>Get Notified</h4>
                  <p>We'll email you when approved</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="action-buttons">
              <button className="btn-logout" onClick={handleLogout}>
                <span>🚪 Back to Login</span>
              </button>
            </div>

            {/* Footer message */}
            <p className="footer-message">
              Need help? Contact our support team at{" "}
              <a href="mailto:support@webnapp.com">support@webnapp.com</a>
            </p>
          </div>
        </div>

        {/* Decorative cards */}
        <div className="decoration-cards">
          <div className="decoration-card card-1">
            <div className="card-icon">🚴</div>
          </div>
          <div className="decoration-card card-2">
            <div className="card-icon">📦</div>
          </div>
          <div className="decoration-card card-3">
            <div className="card-icon">💰</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderPendingApproval;
