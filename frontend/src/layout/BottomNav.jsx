import {
  FaHome,
  FaThLarge,
  FaShoppingCart,
  FaHeart,
  FaUser,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Swal from "sweetalert2";
import "./BottomNav.css";

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCartClick = () => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      Swal.fire({
        title: "Login Required",
        text: "Please login to access cart.",
        icon: "warning",
      });
      navigate("/login");
      return;
    }

    navigate("/cart"); // ✅ FIXED HERE
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="bottom-nav">
      <div
        className={`nav-item ${isActive("/") ? "active" : ""}`}
        onClick={() => navigate("/")}
      >
        <FaHome />
        <p>Home</p>
      </div>

      <div
        className={`nav-item ${isActive("/products") ? "active" : ""}`}
        onClick={() => navigate("/products")}
      >
        <FaThLarge />
        <p>Categories</p>
      </div>

      <div
        className={`nav-item ${isActive("/cart") ? "active" : ""}`}
        onClick={handleCartClick}
      >
        <div style={{ position: "relative" }}>
          <FaShoppingCart />
          {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </div>
        <p>Cart</p>
      </div>

      <div
        className={`nav-item ${isActive("/wishlist") ? "active" : ""}`}
        onClick={() => navigate("/wishlist")}
      >
        <FaHeart />
        <p>Wishlist</p>
      </div>

      <div
        className={`nav-item ${isActive("/account") ? "active" : ""}`}
        onClick={() => navigate("/account")}
      >
        <FaUser />
        <p>Account</p>
      </div>
    </div>
  );
}

export default BottomNav;
