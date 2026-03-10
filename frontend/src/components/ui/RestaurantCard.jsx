import React from "react";
import { motion } from "framer-motion";
import "./RestaurantCard.css";

const RestaurantCard = ({ restaurant, onNavigate, className = "" }) => {
  const cuisines = Array.isArray(restaurant.cuisine)
    ? restaurant.cuisine
    : typeof restaurant.cuisine === "string"
      ? restaurant.cuisine
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const deliveryTime = restaurant.deliveryTime || "30";
  const minOrder = restaurant.minOrderValue || restaurant.minOrder || 99;
  const deliveryFee = restaurant.deliveryFee ?? 0;
  const rating = Number(restaurant.rating || 4.5).toFixed(1);
  const imageSrc =
    (restaurant.banner || restaurant.image || "").startsWith("http")
      ? restaurant.banner || restaurant.image
      : restaurant.banner || restaurant.image || "/placeholder-restaurant.jpg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -10 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={`restaurant-showcase-card ${className}`}
      onClick={onNavigate}
    >
      <div className="restaurant-showcase-hero">
        <motion.img
          src={imageSrc}
          alt={restaurant.name}
          className="restaurant-showcase-image"
          onError={(e) => {
            e.target.src = "/placeholder-restaurant.jpg";
          }}
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.38, ease: "easeOut" }}
        />
        <div className="restaurant-showcase-overlay" />

        <div className="restaurant-rating-pill">
          <span className="star">★</span>
          <span>{rating}</span>
        </div>

        {restaurant.isVeg && <div className="restaurant-veg-pill">Pure Veg</div>}
      </div>

      <div className="restaurant-showcase-body">
        <div className="restaurant-heading-block">
          <h3 className="restaurant-name">{restaurant.name}</h3>
          <p className="restaurant-cuisine">
            {cuisines.length > 0 ? cuisines.slice(0, 2).join(" • ") : "Multi-cuisine"}
          </p>
        </div>

        <div className="restaurant-info-chips">
          <div className="info-chip">
            <span className="chip-icon">⏱</span>
            <span>{deliveryTime} min</span>
          </div>
          <div className="info-chip">
            <span className="chip-icon">₹</span>
            <span>Min ₹{minOrder}</span>
          </div>
          <div className="info-chip">
            <span className="chip-icon">🛵</span>
            <span>{deliveryFee === 0 ? "Free delivery" : `₹${deliveryFee} fee`}</span>
          </div>
        </div>

        {cuisines.length > 0 && (
          <div className="restaurant-tag-row">
            {cuisines.slice(0, 3).map((cat, idx) => (
              <span key={idx} className="restaurant-tag">
                {cat}
              </span>
            ))}
          </div>
        )}

        <button
          className="restaurant-cta"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate?.();
          }}
          type="button"
        >
          <span className="cta-label">View Menu</span>
          <span className="cta-arrow">→</span>
        </button>
      </div>
    </motion.div>
  );
};

export default RestaurantCard;
