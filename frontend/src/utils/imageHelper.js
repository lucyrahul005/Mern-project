/**
 * Helper function to get the correct image URL
 * Handles both external URLs and uploaded images
 * @param {string} imagePath - Image path from database (can be URL or /uploads/...)
 * @param {string} apiUrl - Base API URL (e.g., http://localhost:5001)
 * @returns {string} - Complete image URL
 */
export const getImageUrl = (imagePath, apiUrl = "http://localhost:5001") => {
  if (!imagePath) return "";

  // If it's already a full URL (starts with http/https), return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // If it's an uploaded file (starts with /uploads), prepend API_URL
  if (imagePath.startsWith("/uploads")) {
    return `${apiUrl}${imagePath}`;
  }

  // Default: prepend API_URL (for backward compatibility)
  return `${apiUrl}${imagePath}`;
};
