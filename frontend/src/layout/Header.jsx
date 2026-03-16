import { FaShoppingCart, FaHome, FaThLarge, FaHeart, FaUser } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "./Header.css";

function Header() {
  const { cart } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const headerRef = useRef(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      lastScrollYRef.current = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = lastScrollYRef.current;
          const previousScrollY = lastScrollYRef.current;

          if (currentScrollY > previousScrollY && currentScrollY > 100) {
            // Scrolling down - hide navbar
            setIsVisible(false);
          } else {
            // Scrolling up - show navbar
            setIsVisible(true);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleToggleTheme = () => {
    toggleTheme();
    console.log("🎨 Theme toggle clicked - switching theme");
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearch = () => {
    if (search.trim() !== "") {
      navigate(`/products?search=${search}`);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header 
      className={`header-wrapper ${isVisible ? "visible" : "hidden"}`}
      ref={headerRef}
    >
      <div className="header-inner">
        {/* LEFT SECTION */}
        <div className="header-left">
          <h2 className="logo" onClick={() => navigate("/")}>
            WebnApp
          </h2>
        </div>

        {/* CENTER SEARCH */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search premium products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={handleSearch}>Search</button>
        </div>

        {/* RIGHT SECTION */}
        <div className="header-right">
          {/* NAVIGATION LINKS */}
          <nav className="header-nav">
            <button 
              className={`nav-link ${isActive("/") ? "active" : ""}`}
              onClick={() => navigate("/")}
              title="Home"
            >
              <FaHome /> Home
            </button>

            <button 
              className={`nav-link ${isActive("/products") ? "active" : ""}`}
              onClick={() => navigate("/products")}
              title="Products"
            >
              <FaThLarge /> Products
            </button>

            <button 
              className={`nav-link ${isActive("/restaurants") ? "active" : ""}`}
              onClick={() => navigate("/restaurants")}
              title="Restaurants"
            >
              🏪 Restaurants
            </button>

            <button 
              className={`nav-link ${isActive("/wishlist") ? "active" : ""}`}
              onClick={() => navigate("/wishlist")}
              title="Wishlist"
            >
              <FaHeart /> Wishlist
            </button>

            <button 
              className={`nav-link ${isActive("/account") ? "active" : ""}`}
              onClick={() => navigate("/account")}
              title="Account"
            >
              <FaUser /> Account
            </button>
          </nav>

          {/* DARK MODE BUTTON */}
          <button 
            className="header-btn theme-toggle"
            onClick={handleToggleTheme}
            title="Toggle Dark Mode"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>

          {/* CART */}
          <div
            className="cart-wrapper"
            onClick={() => navigate("/cart")}
            style={{ cursor: "pointer" }}
          >
            <FaShoppingCart />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
