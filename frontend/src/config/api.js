// Global API Configuration
// In production (Vercel), use environment variable VITE_API_URL
// In development, default to localhost:5000
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Get complete image URL
 * @param {string} imagePath - Image path from DB (filename, /uploads/..., or full URL)
 * @returns {string} - Complete image URL ready to use
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '/placeholder.jpg';

  // Already a full URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Has /uploads prefix
  if (imagePath.startsWith('/uploads')) {
    return `${API_URL}${imagePath}`;
  }

  // Just a filename - add /uploads prefix
  return `${API_URL}/uploads/${imagePath}`;
};
