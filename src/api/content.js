import axios from 'axios';

const API_BASE = process.env.REACT_APP_CMS_API_URL || 'http://localhost:5000/api';

// Create axios instance with common config
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Add auth token to requests (for future authentication)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('cmsAuthToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const contentAPI = {
  // Get single content item
  getContent: async (siteId, contentKey) => {
    try {
      const response = await apiClient.get(`/content/${siteId}/${contentKey}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching content:', error);
      return { data: null };
    }
  },

  // Get all content for a site
  getAllContent: async (siteId) => {
    try {
      const response = await apiClient.get(`/content/${siteId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all content:', error);
      return { data: {} };
    }
  },

  // Update single content item
  updateContent: async (siteId, contentKey, data) => {
    try {
      const response = await apiClient.put(`/content/${siteId}/${contentKey}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating content:', error);
      throw error;
    }
  },

  // Bulk update content
  bulkUpdateContent: async (siteId, contentMap) => {
    try {
      const response = await apiClient.post(`/content/${siteId}/bulk`, { contentMap });
      return response.data;
    } catch (error) {
      console.error('Error bulk updating content:', error);
      throw error;
    }
  }
};

// Authentication API (for future use)
export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('cmsAuthToken', response.data.token);
        localStorage.setItem('cmsUser', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('cmsAuthToken');
    localStorage.removeItem('cmsUser');
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('cmsUser');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('cmsAuthToken');
  }
};