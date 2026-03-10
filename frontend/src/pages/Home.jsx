import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import FoodCard from '../components/ui/FoodCard';
import RestaurantCard from '../components/ui/RestaurantCard';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { animations } from '../styles/animations';
import { API_URL, getImageUrl } from '../config/api';
import { useCart } from '../context/CartContext';
import {
  SparklesIcon,
  TruckIcon,
  CheckCircleIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { toggleWishlist, wishlist, addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleHeroSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleHeroSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleHeroSearch();
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, restaurantsRes] = await Promise.all([
          axios.get(`${API_URL}/api/products?limit=6`),
          axios.get(`${API_URL}/api/restaurants?limit=8`),
        ]);

        setProducts(productsRes.data.filter((p) => p.isPopular).slice(0, 6));
        setRestaurants(restaurantsRes.data.slice(0, 8));
      } catch (error) {
        console.log('Home fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = (food) => {
    addToCart(food);
    console.log('✅ Added to cart:', food.name);
  };

  const handleToggleWishlist = (food) => {
    toggleWishlist(food);
    console.log('❤️ Wishlist toggled:', food.name);
  };

  const categories = [
    { id: 'all', label: 'All', emoji: '🍽️' },
    { id: 'pizza', label: 'Pizza', emoji: '🍕' },
    { id: 'burger', label: 'Burgers', emoji: '🍔' },
    { id: 'biryani', label: 'Biryani', emoji: '🍚' },
    { id: 'chinese', label: 'Chinese', emoji: '🥢' },
    { id: 'dessert', label: 'Desserts', emoji: '🍰' },
  ];

  const features = [
    {
      icon: TruckIcon,
      title: 'Fast Delivery',
      description: 'Get your order delivered in 30-45 minutes',
    },
    {
      icon: StarIcon,
      title: 'Quality Assured',
      description: 'Fresh food from verified restaurants',
    },
    {
      icon: CheckCircleIcon,
      title: '100% Safe',
      description: 'Secure payment & hygienic handling',
    },
  ];

  // Filter products based on active category
  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter((p) => p.category?.toLowerCase() === activeCategory);

  const containerVariants = animations.containerVariants;
  const itemVariants = animations.itemVariants;

  return (
    <div className="home-premium">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="hero-text"
          >
            <h1 className="hero-title">
              Order food & groceries
              <br />
              <span className="gradient-text">instantly</span>
            </h1>
            <p className="hero-subtitle">
              Get fresh food from verified restaurants and groceries delivered to your doorstep
            </p>

            {/* Hero Search */}
            <div className="hero-search mt-8">
              <div className="search-wrapper">
                <input
                  type="text"
                  placeholder="🔍 Search for restaurants or food..."
                  className="search-hero-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleHeroSearchKeyPress}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.1)';
                  }}
                />
                <button
                  onClick={handleHeroSearch}
                  className="search-hero-btn"
                >
                  Search
                </button>
              </div>
            </div>
          </motion.div>

          {/* Hero Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hero-image hidden lg:block"
          >
            <div className="floating-card card-1">🍕</div>
            <div className="floating-card card-2">🍔</div>
            <div className="floating-card card-3">🍜</div>
            <div className="floating-card card-4">🍰</div>
          </motion.div>
        </div>

        {/* Animated Background Shapes */}
        <div className="hero-shapes">
          <motion.div
            className="shape shape-1"
            animate={{ y: [0, 20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <motion.div
            className="shape shape-2"
            animate={{ y: [0, -20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container mx-auto">
          <motion.div
            variants={containerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="features-grid"
          >
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="feature-card"
                >
                  <div className="feature-icon">
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-header"
          >
            <h2 className="section-title">Quick Categories</h2>
            <p className="section-subtitle">
              Explore food from your favorite categories
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="categories-grid"
          >
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat.id)}
                className={`category-card ${
                  activeCategory === cat.id ? 'active' : ''
                }`}
              >
                <span className="category-emoji">{cat.emoji}</span>
                <span className="category-label">{cat.label}</span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Popular Foods Section */}
      <section className="popular-foods-section">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-header"
          >
            <h2 className="section-title">Popular Dishes</h2>
            <p className="section-subtitle">
              Trending now in your area
            </p>
          </motion.div>

          {loading ? (
            <SkeletonLoader type="card" count={6} />
          ) : filteredProducts.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              className="foods-grid"
            >
              {filteredProducts.map((food) => (
                <motion.div
                  key={food._id}
                  variants={itemVariants}
                >
                  <FoodCard
                    food={{
                      ...food,
                      image: getImageUrl(food.image),
                    }}
                    onAddToCart={handleAddToCart}
                    onViewDetails={() => navigate(`/products?id=${food._id}`)}
                    isWishlisted={wishlist.some((item) => item._id === food._id)}
                    onToggleWishlist={handleToggleWishlist}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}
            >
              <p style={{ fontSize: '1.2rem', color: '#666' }}>No items found in this category</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="view-all-section"
          >
            <button
              onClick={() => navigate('/products')}
              className="view-all-btn"
            >
              Explore All Dishes →
            </button>
          </motion.div>
        </div>
      </section>

      {/* Featured Restaurants Section */}
      <section className="featured-restaurants-section">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-header"
          >
            <h2 className="section-title">Featured Restaurants</h2>
            <p className="section-subtitle">
              Best rated restaurants near you
            </p>
          </motion.div>

          {loading ? (
            <SkeletonLoader type="card" count={4} />
          ) : (
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              className="restaurants-grid"
            >
              {restaurants.map((restaurant) => (
                <motion.div
                  key={restaurant._id}
                  variants={itemVariants}
                >
                  <RestaurantCard
                    restaurant={{
                      ...restaurant,
                      banner: getImageUrl(restaurant.image),
                      image: getImageUrl(restaurant.image),
                    }}
                    onNavigate={() =>
                      navigate(`/restaurant/${restaurant._id}`)
                    }
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="view-all-section"
          >
            <button
              onClick={() => navigate('/restaurants')}
              className="view-all-btn"
            >
              View All Restaurants →
            </button>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="cta-content"
        >
          <h2 className="cta-title">What are you craving?</h2>
          <p className="cta-subtitle">
            Sign up now to get exclusive deals and faster checkout
          </p>
          <div className="cta-buttons">
            <button
              onClick={() => navigate('/register')}
              className="cta-btn primary"
            >
              Get Started
            </button>
            <button onClick={() => navigate('/products')} className="cta-btn secondary">
              Browse Menu
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
