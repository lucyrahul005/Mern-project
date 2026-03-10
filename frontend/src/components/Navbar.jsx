import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  BuildingStorefrontIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import './Navbar.css';

/**
 * Premium Modern Navbar Component
 * Inspired by Swiggy/Zomato design
 */
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();
  const token = sessionStorage.getItem('token');
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const API_URL =
    import.meta.env.MODE === "development"
      ? "http://localhost:5001"
      : "https://webnapp-backend.onrender.com";

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!token || !user._id) return;

      try {
        const res = await fetch(
          `${API_URL}/api/notifications/${user._id}/unread-count`,
          {
            headers: { "user-id": user._id },
          }
        );
        const data = await res.json();
        if (data.success) {
          setUnreadCount(data.unreadCount);
        }
      } catch (err) {
        console.error("Error fetching unread count:", err);
      }
    };

    if (token) {
      fetchUnreadCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [token, user._id, API_URL]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/products?search=${search}`);
    setSearch('');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  const menuVariants = {
    hidden: { opacity: 0, x: -300 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -300, transition: { duration: 0.2 } },
  };

  const navLinks = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/restaurants', label: 'Restaurants', icon: BuildingStorefrontIcon },
    { path: '/products', label: 'Products', icon: 'FaPizzaSlice' },
  ];

  return (
    <nav className="navbar-premium sticky top-0 z-50">
      <div className="navbar-container">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="navbar-logo cursor-pointer"
          onClick={() => navigate('/')}
        >
          <span className="logo-icon">🍔</span>
          <span className="logo-text">
            Food<span className="logo-highlight">ie</span>
          </span>
        </motion.div>

        {/* Desktop Search Bar */}
        <div className="hidden md:flex navbar-search">
          <form onSubmit={handleSearch} className="search-form">
            <MagnifyingGlassIcon className="search-icon" />
            <input
              type="text"
              placeholder="Search restaurants or food..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </form>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex navbar-links">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Right Section */}
        <div className="navbar-right">
          {/* Mobile Search Icon */}
          <button
            className="md:hidden p-2 hover:bg-gray-100 rounded-full transition"
            onClick={() => setShowSearch(!showSearch)}
          >
            <MagnifyingGlassIcon className="w-6 h-6" />
          </button>

          {/* Notification Bell */}
          {token && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="notification-button relative"
              onClick={() => navigate('/notifications')}
              title="Notifications"
            >
              <BellIcon className="w-6 h-6" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="notification-badge"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </motion.button>
          )}

          {/* Cart Icon */}
          {token && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="cart-button relative"
              onClick={() => navigate('/cart')}
            >
              <ShoppingCartIcon className="w-6 h-6" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="cart-badge"
                >
                  {cartCount}
                </motion.span>
              )}
            </motion.button>
          )}

          {/* Auth Links */}
          {!token ? (
            <div className="hidden sm:flex gap-2">
              <button
                onClick={() => navigate('/login')}
                className="btn-outline"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="btn-primary"
              >
                Sign Up
              </button>
            </div>
          ) : (
            <div className="auth-dropdown group">
              <button className="user-button">
                <UserIcon className="w-6 h-6" />
                <span className="hidden sm:inline text-sm font-medium">
                  {user.name?.split(' ')[0] || 'Account'}
                </span>
              </button>
              <div className="dropdown-menu">
                <button
                  onClick={() => navigate('/account')}
                  className="dropdown-item"
                >
                  👤 Profile
                </button>
                <button
                  onClick={() => navigate('/orders')}
                  className="dropdown-item"
                >
                  📦 Orders
                </button>
                <button onClick={handleLogout} className="dropdown-item text-red-600">
                  🚪 Logout
                </button>
              </div>
            </div>
          )}

          {/* Mobile Menu Icon */}
          <button
            className="md:hidden p-2 hover:bg-gray-100 rounded-full"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showSearch && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden px-4 pb-3"
        >
          <form onSubmit={handleSearch} className="search-form">
            <MagnifyingGlassIcon className="search-icon" />
            <input
              type="text"
              placeholder="Search food..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="search-input"
            />
          </form>
        </motion.div>
      )}

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          variants={menuVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="md:hidden bg-white border-t border-gray-200"
        >
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className="block px-4 py-3 rounded-lg hover:bg-orange-50 font-medium text-gray-700"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            {!token && (
              <>
                <button
                  onClick={() => {
                    navigate('/login');
                    setIsOpen(false);
                  }}
                  className="w-full mt-3 px-4 py-3 border-2 border-orange-500 text-orange-500 rounded-lg font-semibold"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    navigate('/register');
                    setIsOpen(false);
                  }}
                  className="w-full mt-2 px-4 py-3 bg-orange-500 text-white rounded-lg font-semibold"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
