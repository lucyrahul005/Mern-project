import React from 'react';
import { motion } from 'framer-motion';
import { animations } from '../../styles/animations';

/**
 * Premium Loading Skeleton Component
 * Used for placeholder content while loading
 */
const SkeletonLoader = ({ 
  type = 'card', 
  count = 6,
  className = '' 
}) => {
  const skeletonVariants = animations.skeletonVariants;

  // Card skeleton
  if (type === 'card') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {Array(count).fill(0).map((_, i) => (
          <motion.div
            key={i}
            variants={skeletonVariants}
            animate="animate"
            className="bg-gray-200 rounded-2xl overflow-hidden"
          >
            <div className="h-48 bg-gray-300" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-300 rounded w-3/4" />
              <div className="h-4 bg-gray-300 rounded w-1/2" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // Table row skeleton
  if (type === 'row') {
    return (
      <div className="space-y-3">
        {Array(count).fill(0).map((_, i) => (
          <motion.div
            key={i}
            variants={skeletonVariants}
            animate="animate"
            className="h-12 bg-gray-200 rounded-lg"
          />
        ))}
      </div>
    );
  }

  // List skeleton
  if (type === 'list') {
    return (
      <div className="space-y-4">
        {Array(count).fill(0).map((_, i) => (
          <motion.div
            key={i}
            variants={skeletonVariants}
            animate="animate"
            className="flex space-x-4"
          >
            <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-1/2" />
              <div className="h-4 bg-gray-300 rounded w-1/3" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }
};

export default SkeletonLoader;
