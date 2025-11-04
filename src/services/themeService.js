// Theme service for fetching client theme from backend
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

/**
 * Fetch theme by client email
 * @param {string} clientEmail - The client's email address
 * @returns {Promise<Object>} Theme configuration
 */
export async function getClientTheme(clientEmail) {
  try {
    const response = await fetch(`${API_BASE}/themes/client/email/${encodeURIComponent(clientEmail)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return theme with defaults if not found
    if (!data || !data.colors) {
      return getDefaultTheme();
    }
    
    return data;
  } catch (error) {
    console.error("Failed to fetch client theme:", error);
    return getDefaultTheme();
  }
}

/**
 * Get default theme fallback
 * @returns {Object} Default theme configuration
 */
function getDefaultTheme() {
  return {
    colors: {
      primary: "#56642D",
      secondary: "#FFD700",
      background: "#F9FAFB",
      surface: "#FFFFFF",
      text: "#111827",
      textSecondary: "#6B7280",
      border: "#E5E7EB",
      error: "#EF4444",
      success: "#10B981",
      warning: "#F59E0B",
      info: "#3B82F6",
    },
    branding: {
      appName: "Gym",
      logo: null,
      company: null,
    },
    customCSS: null,
  };
}

export default {
  getClientTheme,
  getDefaultTheme,
};



