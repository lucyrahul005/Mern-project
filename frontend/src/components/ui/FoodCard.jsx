import React, { useState } from "react";
import { motion } from "framer-motion";
import "./FoodCard.css";

const FoodCard = ({
  food,
  onAddToCart,
  onViewDetails,
  className = "",
  isWishlisted,
  onToggleWishlist,
}) => {
  const [localWishlisted, setLocalWishlisted] = useState(false);
  const wishlisted = typeof isWishlisted === "boolean" ? isWishlisted : localWishlisted;
  const rating = Number(food.rating || 4.7).toFixed(1);
  const canViewDetails = typeof onViewDetails === "function";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={canViewDetails ? onViewDetails : undefined}
      className={`foodgo-card ${canViewDetails ? "is-clickable" : "is-static"} ${className}`}
    >
      <div className="foodgo-image-wrap">
        <motion.img
          src={food.image || "/placeholder-food.jpg"}
          alt={food.name}
          className="foodgo-image"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          onError={(e) => (e.target.src = "/placeholder-food.jpg")}
        />
        {food.isPopular && (
          <span className="foodgo-popular-badge">Popular</span>
        )}
      </div>

      <div className="foodgo-card-body">
        <h3 className="foodgo-title">{food.name}</h3>
        <p className="foodgo-subtitle">{food.category || "Signature Dish"}</p>

        <div className="foodgo-footer">
          <span className="foodgo-rating">
            <span className="foodgo-star">★</span>
            {rating}
          </span>
          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.92 }}
            onClick={(e) => {
              e.stopPropagation();
              if (typeof onToggleWishlist === "function") {
                onToggleWishlist(food);
              } else {
                setLocalWishlisted((prev) => !prev);
              }
            }}
            className={`foodgo-heart ${wishlisted ? "active" : ""}`}
            aria-label="Toggle wishlist"
            type="button"
          >
            {wishlisted ? "♥" : "♡"}
          </motion.button>
        </div>

        {typeof onAddToCart === "function" && (
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(food);
            }}
            className="foodgo-order-btn"
            type="button"
          >
            <span>₹{food.price ?? "--"}</span>
            <span>ADD</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default FoodCard;
