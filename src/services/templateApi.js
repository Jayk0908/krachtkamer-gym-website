// src/services/templateApi.js
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

class TemplateApiService {
  static async getAvailableTemplates(siteId) {
    try {
      const response = await fetch(`${API_BASE_URL}/templates/${siteId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch templates");
      }

      return data.data;
    } catch (error) {
      console.error("Error fetching templates:", error);
      throw error;
    }
  }

  static async renderTemplate(templateId, siteId, content = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/templates/render`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId,
          siteId,
          content,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to render template");
      }

      return data.data; // Returns { html, css, theme }
    } catch (error) {
      console.error("Error rendering template:", error);
      throw error;
    }
  }

  static async getTheme(siteId) {
    try {
      const response = await fetch(`${API_BASE_URL}/themes/${siteId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch theme");
      }

      return data.data;
    } catch (error) {
      console.error("Error fetching theme:", error);
      throw error;
    }
  }

  static async getThemeCSS(siteId) {
    try {
      const response = await fetch(`${API_BASE_URL}/themes/${siteId}/css`);
      return await response.text();
    } catch (error) {
      console.error("Error fetching theme CSS:", error);
      throw error;
    }
  }
}

export default TemplateApiService;
