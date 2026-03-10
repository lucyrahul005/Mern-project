import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import React, { useEffect } from "react";
import "./Wishlist.css";

function Wishlist() {
  const { wishlist, toggleWishlist, addToCart } = useCart();
  const navigate = useNavigate();
  const [, setRefresh] = React.useState(0);

  // Listen for wishlist updates
  useEffect(() => {
    const handleWishlistUpdate = () => {
      setRefresh((prev) => prev + 1);
    };

    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    window.addEventListener('storage', handleWishlistUpdate);

    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
      window.removeEventListener('storage', handleWishlistUpdate);
    };
  }, []);

  if (wishlist.length === 0) {
    return (
      <div className="wishlist-empty-wrapper">
        <div className="wishlist-empty-card">
          <img
            src="https://cdn-icons-png.flaticon.com/512/833/833472.png"
            alt="Wishlist"
            className="wishlist-empty-image"
          />
          <h2 className="wishlist-empty-title">Your Wishlist is Empty</h2>
          <p className="wishlist-empty-desc">
            Save your favorite products here ❤️
          </p>

          <button 
            className="wishlist-empty-btn" 
            onClick={() => navigate("/products")}
          >
            Discover Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-wrapper">
      <h2 className="wishlist-header">My Wishlist ❤️</h2>

      <div className="wishlist-grid">
        {wishlist.map((item) => (
          <div key={item._id} className="wishlist-card">
            <img 
              src={item.image} 
              alt={item.name} 
              className="wishlist-image" 
            />

            <h4 className="wishlist-name">{item.name}</h4>
            <p className="wishlist-price">₹ {item.price}</p>

            {/* ✅ ADD TO CART */}
            <button
              className="wishlist-cart-btn"
              onClick={() => addToCart(item)}
            >
              Add to Cart 🛒
            </button>

            {/* ✅ REMOVE */}
            <button
              className="wishlist-remove-btn"
              onClick={() => toggleWishlist(item)}
            >
              Remove ❌
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Wishlist;