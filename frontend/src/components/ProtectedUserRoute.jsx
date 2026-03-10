import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

/**
 * ProtectedUserRoute - Prevents admin/restaurant admin/rider from accessing user pages
 * Only regular users can access these pages
 */
function ProtectedUserRoute({ children }) {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const user = sessionStorage.getItem("user");

  useEffect(() => {
    if (!token || !user) {
      return; // Not logged in, let ProtectedRoute handle it
    }

    try {
      const userData = JSON.parse(user);

      // If user is admin, redirect to admin dashboard
      if (userData.isAdmin) {
        Swal.fire({
          title: "Admin Access Only",
          text: "Admins cannot access this page. Redirecting to admin dashboard.",
          icon: "info",
          background: "#1a1a1a",
          color: "#fff",
          confirmButtonText: "Go to Admin Dashboard",
          confirmButtonColor: "#ffffff",
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(() => {
          navigate("/admin", { replace: true });
        });
      }
    } catch (err) {
      console.error("Error parsing user data:", err);
    }
  }, [token, user, navigate]);

  return children;
}

export default ProtectedUserRoute;
