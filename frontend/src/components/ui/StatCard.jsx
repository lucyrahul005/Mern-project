import React from 'react';
import { motion } from 'framer-motion';

/**
 * Statistics Card Component
 * Used in dashboards to display metrics
 */
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  backgroundColor = 'bg-gradient-to-br from-orange-50 to-orange-100',
  iconColor = 'text-orange-500',
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`${backgroundColor} rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-4xl font-bold text-gray-900">{value}</h3>
          {subtitle && (
            <p className="text-gray-600 text-xs mt-1">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl bg-white/50 ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-1 text-sm">
          <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
            {trend === 'up' ? '↗' : '↘'}
          </span>
          <span className={trend === 'up' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
            {trendValue}
          </span>
          <span className="text-gray-600">vs last month</span>
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
