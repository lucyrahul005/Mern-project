import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import {
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyRupeeIcon,
  TruckIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import './RiderDashboard.css';

const RiderDashboard = () => {
  const [riderInfo, setRiderInfo] = useState({
    name: 'Rajesh Kumar',
    phone: '+91-9876543210',
    rating: 4.8,
    totalDeliveries: 345,
    totalEarnings: 12500,
    availableOrders: 5,
  });

  const [orders, setOrders] = useState([
    {
      id: '1',
      status: 'pending',
      restaurant: 'Biryani House',
      customer: 'Amit Singh',
      location: '123 MG Road',
      earnings: 50,
      time: '15 mins away',
    },
    {
      id: '2',
      status: 'active',
      restaurant: 'Pizza Palace',
      customer: 'Priya Sharma',
      location: '456 Park Avenue',
      earnings: 40,
      time: 'Delivering',
    },
  ]);

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
    <div className="rider-dashboard-premium">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="dashboard-header"
      >
        <div>
          <h1 className="dashboard-title">Welcome, {riderInfo.name}! 👋</h1>
          <p className="dashboard-subtitle">Manage your deliveries and earnings</p>
        </div>
        <div className="online-status">
          <div className="status-indicator online"></div>
          <span>Online</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="stats-grid"
      >
        <motion.div variants={itemVariants}>
          <StatCard
            title="Total Earnings"
            value={`₹${riderInfo.totalEarnings}`}
            icon={CurrencyRupeeIcon}
            backgroundColor="bg-gradient-to-br from-green-50 to-emerald-100"
            iconColor="text-green-500"
            trend="up"
            trendValue="+₹2500"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatCard
            title="Total Deliveries"
            value={riderInfo.totalDeliveries}
            subtitle="Completed"
            icon={CheckCircleIcon}
            backgroundColor="bg-gradient-to-br from-blue-50 to-cyan-100"
            iconColor="text-blue-500"
            trend="up"
            trendValue="+45"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatCard
            title="Rating"
            value={riderInfo.rating}
            subtitle="out of 5.0"
            icon={StarIcon}
            backgroundColor="bg-gradient-to-br from-yellow-50 to-orange-100"
            iconColor="text-yellow-500"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatCard
            title="Available Orders"
            value={riderInfo.availableOrders}
            subtitle="Ready to deliver"
            icon={TruckIcon}
            backgroundColor="bg-gradient-to-br from-purple-50 to-pink-100"
            iconColor="text-purple-500"
          />
        </motion.div>
      </motion.div>

      <div className="dashboard-content">
        {/* Active Delivery */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="delivery-section"
        >
          <h2 className="section-title">Current Delivery</h2>

          <div className="active-delivery">
            <div className="delivery-map">
              <div className="map-placeholder">📍</div>
            </div>

            <div className="delivery-details">
              <div className="delivery-status">
                <div className="status-step active">
                  <span className="step-icon">✓</span>
                  <span className="step-label">Picked Up</span>
                </div>
                <div className="status-line"></div>
                <div className="status-step">
                  <span className="step-icon">📍</span>
                  <span className="step-label">On Way</span>
                </div>
                <div className="status-line"></div>
                <div className="status-step">
                  <span className="step-icon">🔔</span>
                  <span className="step-label">Arrive</span>
                </div>
              </div>

              <div className="delivery-info">
                <h3>Pizza Palace → Priya Sharma</h3>
                <p className="delivery-address">456 Park Avenue, Garden City</p>

                <div className="delivery-meta">
                  <div className="meta-item">
                    <ClockIcon className="w-5 h-5" />
                    <span>8 minutes away</span>
                  </div>
                  <div className="meta-item">
                    <MapPinIcon className="w-5 h-5" />
                    <span>2.5 km</span>
                  </div>
                  <div className="meta-item earning">
                    <CurrencyRupeeIcon className="w-5 h-5" />
                    <span>₹40</span>
                  </div>
                </div>

                <button className="delivery-call-btn">📞 Call Customer</button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Available Orders */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="orders-section"
        >
          <h2 className="section-title">Available Pickups</h2>

          <div className="available-orders">
            {orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="order-card"
              >
                <div className="order-header">
                  <h4>{order.restaurant}</h4>
                  <span className="order-amount">₹{order.earnings}</span>
                </div>

                <p className="order-customer">👤 {order.customer}</p>

                <div className="order-details">
                  <div className="detail-item">
                    <MapPinIcon className="w-4 h-4" />
                    {order.location}
                  </div>
                  <div className="detail-item">
                    <ClockIcon className="w-4 h-4" />
                    {order.time}
                  </div>
                </div>

                <button className="order-action-btn">Accept Order</button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Earnings Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="earnings-section"
      >
        <h2 className="section-title">Weekly Earnings</h2>
        <div className="earnings-chart">
          <div className="chart-bar">
            <div className="bar-fill" style={{ height: '60%' }}></div>
            <span>Mon</span>
          </div>
          <div className="chart-bar">
            <div className="bar-fill" style={{ height: '75%' }}></div>
            <span>Tue</span>
          </div>
          <div className="chart-bar">
            <div className="bar-fill" style={{ height: '50%' }}></div>
            <span>Wed</span>
          </div>
          <div className="chart-bar">
            <div className="bar-fill" style={{ height: '85%' }}></div>
            <span>Thu</span>
          </div>
          <div className="chart-bar">
            <div className="bar-fill" style={{ height: '70%' }}></div>
            <span>Fri</span>
          </div>
          <div className="chart-bar">
            <div className="bar-fill" style={{ height: '90%' }}></div>
            <span>Sat</span>
          </div>
          <div className="chart-bar">
            <div className="bar-fill" style={{ height: '65%' }}></div>
            <span>Sun</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RiderDashboard;
