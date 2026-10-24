/**
 * API Utility for making requests to the custom backend.
 * This automatically uses the local backend during development
 * and the production backend when deployed to Vercel (based on Environment Variables).
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  /**
   * Make a GET request
   */
  get: async (endpoint: string) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  },

  /**
   * Make a POST request with JSON data
   */
  post: async (endpoint: string, data: any) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  }
};
