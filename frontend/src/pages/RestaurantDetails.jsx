import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaStar, FaClock, FaMotorcycle } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import Toast from "../components/Toast";
import FoodCard from "../components/ui/FoodCard";
import { getImageUrl } from "../utils/imageHelper";
import "./RestaurantDetails.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function RestaurantDetails() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [toast, setToast] = useState(null);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, wishlist } = useWishlist();

  const categories = [
    "all",
    "burger",
    "pizza",
    "chicken",
    "pasta",
    "drinks",
    "snacks",
    "sandwich",
    "rice",
  ];

  useEffect(() => {
    fetchRestaurantAndProducts();
  }, [restaurantId]);

  const fetchRestaurantAndProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch restaurant details
      const restaurantResponse = await fetch(
        `${API_URL}/api/restaurants/${restaurantId}`
      );
      
      if (!restaurantResponse.ok) {
        throw new Error(`Restaurant not found (${restaurantResponse.status})`);
      }
      
      const restaurantData = await restaurantResponse.json();
      
      if (!restaurantData) {
        throw new Error("Restaurant data is empty");
      }
      
      setRestaurant(restaurantData);

      // Fetch products for this restaurant
      const productsResponse = await fetch(
        `${API_URL}/api/restaurants/${restaurantId}/products`
      );
      
      if (!productsResponse.ok) {
        throw new Error(`Failed to fetch products (${productsResponse.status})`);
      }
      
      const productsData = await productsResponse.json();
      setProducts(Array.isArray(productsData) ? productsData : []);
      setFilteredProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      showToast(`❌ ${error.message || "Error loading restaurant details"}`, "error");
      setRestaurant(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterProducts();
  }, [searchTerm, selectedCategory, products]);

  const filterProducts = () => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product) => {
    const cartItem = {
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      restaurant: restaurant.name,
      restaurantId: restaurant._id,
    };
    addToCart(cartItem);
    showToast(`${product.name} added to cart!`, "success");
  };

  const handleWishlist = (product) => {
    const isInWishlist = wishlist.some((item) => item._id === product._id);
    if (isInWishlist) {
      removeFromWishlist(product._id);
      showToast("Removed from wishlist", "info");
    } else {
      addToWishlist(product);
      showToast("Added to wishlist!", "success");
    }
  };

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="restaurant-details-container">
        <div className="loading">Loading restaurant...</div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="restaurant-details-container">
        <div className="error" style={{ padding: "40px", textAlign: "center" }}>
          <h2>❌ Restaurant not found</h2>
          <p style={{ marginTop: "20px", fontSize: "14px", color: "#aaa" }}>
            Restaurant ID: {restaurantId}
          </p>
          <p style={{ marginTop: "10px", fontSize: "12px", color: "#888" }}>
            This restaurant may not exist or might not be approved yet.
          </p>
          <button 
            onClick={() => navigate("/restaurants")}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: "#ff7a00",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Back to Restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurant-details-container">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Restaurant Header */}
      <div className="restaurant-header">
        <button className="back-button" onClick={() => navigate("/restaurants")}>
          <FaArrowLeft /> Back
        </button>

        <div className="restaurant-hero">
          <img
            src={getImageUrl(restaurant.image, API_URL)}
            alt={restaurant.name}
            className="restaurant-hero-image"
          />
        </div>

        <div className="restaurant-details">
          <h1>{restaurant.name}</h1>
          <p className="description">{restaurant.description}</p>

          <div className="details-grid">
            <div className="detail-item">
              <FaStar className="icon" />
              <div>
                <p className="label">Rating</p>
                <p className="value">{restaurant.rating}</p>
              </div>
            </div>

            <div className="detail-item">
              <FaClock className="icon" />
              <div>
                <p className="label">Delivery Time</p>
                <p className="value">{restaurant.deliveryTime}</p>
              </div>
            </div>

            <div className="detail-item">
              <FaMotorcycle className="icon" />
              <div>
                <p className="label">Delivery Fee</p>
                <p className="value">₹{restaurant.deliveryFee}</p>
              </div>
            </div>

            <div className="detail-item">
              <div>
                <p className="label">Min Order</p>
                <p className="value">₹{restaurant.minOrderValue}</p>
              </div>
            </div>
          </div>

          <div className="cuisine-list">
            {restaurant.cuisine.map((c, idx) => (
              <span key={idx} className="cuisine">{c}</span>
            ))}
          </div>

          <div className="restaurant-contact">
            <p>📍 {typeof restaurant.address === 'object' 
              ? `${restaurant.address?.street || ''} ${restaurant.address?.city || ''} ${restaurant.address?.state || ''} ${restaurant.address?.pincode || ''}`.trim() 
              : restaurant.address
            }</p>
            <p>📞 {restaurant.phone}</p>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="products-section">
        <h2>🍔 Menu Items</h2>

        <div className="filters">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <div className="category-filter">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? "active" : ""}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <p>No items found in this category</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <FoodCard
                key={product._id}
                food={{
                  ...product,
                  image: getImageUrl(product.image, API_URL),
                }}
                className="restaurant-food-card"
                isWishlisted={wishlist.some((item) => item._id === product._id)}
                onToggleWishlist={handleWishlist}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
