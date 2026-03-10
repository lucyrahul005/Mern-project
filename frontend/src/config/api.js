// Global API Configuration
export const API_URL = 'http://localhost:5001';

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
