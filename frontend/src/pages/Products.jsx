import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import FoodCard from '../components/ui/FoodCard';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import Toast from '../components/Toast';
import { animations } from '../styles/animations';
import { API_URL, getImageUrl } from '../config/api';
import { useCart } from '../context/CartContext';
import {
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import './Products.css';
import Swal from 'sweetalert2';

const Products = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleWishlist, wishlist, addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const queryParams = new URLSearchParams(location.search);
  const selectedCategory = queryParams.get('category');
  const searchQuery = queryParams.get('search');

  const [sortBy, setSortBy] = useState('popular');
  const [vegOnly, setVegOnly] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [location.search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/products`;

      const params = [];
      if (selectedCategory) {
        params.push(`category=${selectedCategory.toLowerCase()}`);
      }
      if (searchQuery) {
        params.push(`search=${searchQuery}`);
      }

      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await axios.get(url);
      let data = res.data.products || res.data;

      // Frontend filtering
      if (selectedCategory) {
        data = data.filter(
          (item) => item.category?.toLowerCase() === selectedCategory.toLowerCase()
        );
      }

      if (searchQuery) {
        data = data.filter((item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (vegOnly) {
        data = data.filter((item) => item.isVeg);
      }

      // Sorting
      if (sortBy === 'price-low') {
        data.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price-high') {
        data.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'rating') {
        data.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }

      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    setToastMessage('✅ Added to cart!');
    console.log('✅ Added to cart:', product.name);
  };

  const handleToggleWishlist = (product) => {
    toggleWishlist(product);
    console.log('❤️ Wishlist toggled:', product.name);
  };

  const handleCategoryClick = (category) => {
    if (category === 'All') {
      navigate('/products');
    } else {
      navigate(`/products?category=${category.toLowerCase()}`);
    }
  };

  const categories = [
    'All',
    'Pizza',
    'Burger',
    'Chicken',
    'Biryani',
    'Dessert',
    'Drinks',
  ];

  const containerVariants = animations.containerVariants;
  const itemVariants = animations.itemVariants;

  return (
    <div className="products-premium">
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      )}

      {/* Header */}
      <div className="products-header">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="header-content"
          >
            <h1 className="products-title">
              {selectedCategory
                ? `${selectedCategory} Menu`
                : searchQuery
                ? `🔍 Results for "${searchQuery}"`
                : 'All Dishes'}
            </h1>
            <p className="products-subtitle">
              {filteredProducts.length} dishes available
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section-products">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="filters-container-products"
          >
            {/* Categories */}
            <div className="filter-group-categories">
              <div className="categories-scroll">
                {categories.map((cat) => (
                  <motion.button
                    key={cat}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCategoryClick(cat)}
                    className={`category-btn ${
                      selectedCategory?.toLowerCase() === cat.toLowerCase() ||
                      (cat === 'All' && !selectedCategory)
                        ? 'active'
                        : ''
                    }`}
                  >
                    {cat}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Filter Controls */}
            <div className="filter-controls">
              <div className="filter-item">
                <label>
                  <input
                    type="checkbox"
                    checked={vegOnly}
                    onChange={(e) => {
                      setVegOnly(e.target.checked);
                      fetchProducts();
                    }}
                    className="filter-checkbox"
                  />
                  <span>Vegetarian Only</span>
                </label>
              </div>

              <div className="filter-item">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="popular">🔥 Most Popular</option>
                  <option value="rating">⭐ Highest Rated</option>
                  <option value="price-low">💰 Price: Low to High</option>
                  <option value="price-high">💸 Price: High to Low</option>
                </select>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="products-content">
        <div className="container mx-auto">
          {loading ? (
            <SkeletonLoader type="card" count={12} />
          ) : filteredProducts.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              className="products-grid"
            >
              {filteredProducts.map((product) => (
                <motion.div
                  key={product._id}
                  variants={itemVariants}
                >
                  <FoodCard
                    food={{
                      ...product,
                      image: getImageUrl(product.image),
                    }}
                    onAddToCart={handleAddToCart}
                    onViewDetails={() => navigate(`/products?id=${product._id}`)}
                    isWishlisted={wishlist.some((item) => item._id === product._id)}
                    onToggleWishlist={handleToggleWishlist}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="empty-state"
            >
              <div className="empty-icon">🔍</div>
              <h2>No products found</h2>
              <p>Try adjusting your filters or search terms</p>
              <button
                onClick={() => navigate('/products')}
                className="empty-state-btn"
              >
                Browse All Dishes
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;