import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ProtectedRestaurantAdminRoute({ children }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("restaurantAdminToken");

    if (!token) {
      navigate("/restaurantadmin-login");
    } else {
      setIsAuthenticated(true);
    }

    setLoading(false);
  }, [navigate]);

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>⏳ Loading...</div>;
  }

  return isAuthenticated ? children : null;
}

export default ProtectedRestaurantAdminRoute;
