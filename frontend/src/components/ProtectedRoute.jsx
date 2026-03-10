import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = sessionStorage.getItem("token");
  const user = sessionStorage.getItem("user");

  useEffect(() => {
    if (!token) {
      Swal.fire({
        title: "Sign In Required",
        text: "Please sign in to access this feature.",
        icon: "info",
        background: "#1a1a1a",
        color: "#fff",
        confirmButtonText: "Login Now",
        showCancelButton: true,
        cancelButtonText: "Maybe Later",
        confirmButtonColor: "#ffffff",
        cancelButtonColor: "#333",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login", { state: { from: location.pathname } });
        } else {
          navigate("/");
        }
      });
    }
    // Check if user is admin - redirect them away from user pages
    else if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.isAdmin) {
          navigate("/admin", { replace: true });
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, [token, user, navigate, location]);

  if (!token) return null;

  // Check if admin - prevent access
  if (user) {
    try {
      const userData = JSON.parse(user);
      if (userData.isAdmin) return null;
    } catch (err) {
      console.error("Error parsing user data:", err);
    }
  }

  return children;
}

export default ProtectedRoute;
