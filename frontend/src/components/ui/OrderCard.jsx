import React from 'react';
import { motion } from 'framer-motion';

/**
 * Order Card Component
 * Used in Orders page and order history
 */
const OrderCard = ({
  order,
  onViewDetails,
  onReOrder,
  status = 'delivered',
  className = '',
}) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    out_for_delivery: 'bg-cyan-100 text-cyan-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusEmojis = {
    pending: '⏳',
    confirmed: '✅',
    preparing: '👨‍🍳',
    out_for_delivery: '🚚',
    delivered: '✔️',
    cancelled: '❌',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow ${className}`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {order.restaurantName || 'Restaurant'}
            </h3>
            <p className="text-gray-600 text-sm">
              Order #{order._id?.slice(-8) || 'XXXXX'}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${statusColors[status]}`}>
            <span>{statusEmojis[status]}</span>
            {status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="space-y-2 mb-3">
            {order.items?.slice(0, 2).map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-gray-600">₹{item.price * item.quantity}</span>
              </div>
            ))}
            {order.items?.length > 2 && (
              <div className="text-sm text-gray-600">
                +{order.items.length - 2} more items
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>₹{order.totalAmount || 0}</span>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex gap-4 text-xs text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <span>📅</span>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📍</span>
            <span>{order.deliveryAddress?.area || 'Delivery Address'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onViewDetails}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            View Details
          </button>
          {status === 'delivered' && (
            <button
              onClick={onReOrder}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Reorder
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default OrderCard;
