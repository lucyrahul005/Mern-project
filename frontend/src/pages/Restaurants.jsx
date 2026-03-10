import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import RestaurantCard from '../components/ui/RestaurantCard';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { useNavigate } from 'react-router-dom';
import { API_URL, getImageUrl } from '../config/api';
import {
  FunnelIcon,
  StarIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import './Restaurants.css';

const Restaurants = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('rating');
  const [filterVeg, setFilterVeg] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/restaurants`);
      setRestaurants(res.data || []);
      setFilteredRestaurants(res.data || []);
    } catch (error) {
      console.log('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...restaurants];

    if (filterVeg) {
      filtered = filtered.filter((r) => r.isVeg);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortBy === 'delivery') {
        // Parse delivery time string (e.g., "25 min") to get numeric value
        const aTime = parseInt(a.deliveryTime?.split(' ')[0] || 999);
        const bTime = parseInt(b.deliveryTime?.split(' ')[0] || 999);
        return aTime - bTime;
      }
      return 0;
    });

    setFilteredRestaurants(filtered);
  }, [sortBy, filterVeg, restaurants]);

  const containerVariants = {
    initial: {},
    animate: {
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="restaurants-premium">
      {/* Header Section */}
      <div className="restaurants-header">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="header-content"
          >
            <h1 className="header-title">All Restaurants</h1>
            <p className="header-subtitle">
              Discover best restaurants delivering to your area
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="filters-container"
          >
            <div className="filter-group">
              <FunnelIcon className="filter-icon" />
              <label className="filter-label">
                <input
                  type="checkbox"
                  checked={filterVeg}
                  onChange={(e) => setFilterVeg(e.target.checked)}
                  className="filter-checkbox"
                />
                Vegetarian Only
              </label>
            </div>

            <div className="filter-group">
              <label className="filter-label">
                Sort By:
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="rating">⭐ Highest Rated</option>
                  <option value="delivery">🚚 Fastest Delivery</option>
                </select>
              </label>
            </div>

            <div className="filter-info">
              Showing {filteredRestaurants.length} restaurants
            </div>
          </motion.div>
        </div>
      </div>

      {/* Restaurants Grid */}
      <div className="restaurants-content">
        <div className="container mx-auto">
          {loading ? (
            <SkeletonLoader type="card" count={8} />
          ) : filteredRestaurants.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              className="restaurants-grid"
            >
              {filteredRestaurants.map((restaurant) => (
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
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="empty-state"
            >
              <div className="empty-icon">🔍</div>
              <h2>No restaurants found</h2>
              <p>Try adjusting your filters</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Restaurants;
