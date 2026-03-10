import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import RiderPendingApproval from "../pages/RiderPendingApproval";

const ProtectedRiderRoute = ({ children }) => {
  const token = sessionStorage.getItem("riderToken");
  const riderRole = sessionStorage.getItem("riderRole");
  const riderData = JSON.parse(sessionStorage.getItem("riderData") || "{}");
  
  console.log("🔍 ProtectedRiderRoute - Checking access:");
  console.log("  Token exists:", !!token);
  console.log("  Rider role:", riderRole);
  console.log("  Rider data:", riderData);

  // If no token or wrong role, redirect to login
  if (!token || riderRole !== "rider") {
    console.log("❌ No valid token/role - Redirecting to login");
    return <Navigate to="/rideradmin-login" replace />;
  }

  // If rider is not approved, show pending page
  if (!riderData.isApprovedByAdmin) {
    console.log("⏳ Rider not approved yet");
    return <RiderPendingApproval />;
  }

  // Rider is authenticated and approved - show dashboard
  console.log("✅ Rider authenticated and approved - showing dashboard");
  return children;
};

export default ProtectedRiderRoute;
