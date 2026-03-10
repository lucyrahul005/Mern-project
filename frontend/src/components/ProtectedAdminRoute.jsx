import { Navigate } from "react-router-dom";

function ProtectedAdminRoute({ children }) {
  const token = sessionStorage.getItem("token");
  const user = sessionStorage.getItem("user");

  // If no token, redirect to admin login
  if (!token) {
    return <Navigate to="/admin-login" replace />;
  }

  // If user exists, parse and check isAdmin
  if (user) {
    try {
      const userData = JSON.parse(user);
      if (!userData.isAdmin) {
        // Not an admin, redirect to admin login (not to user login)
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        return <Navigate to="/admin-login" replace />;
      }
    } catch (err) {
      console.error("❌ Error parsing user data:", err);
      return <Navigate to="/admin-login" replace />;
    }
  }

  // User is authenticated and is admin, render the component
  return children;
}

export default ProtectedAdminRoute;
