// Places API Module
import { api } from "../api";

export class PlacesAPI {
  static async getPlaces(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/api/public/places${
        queryString ? `?${queryString}` : ""
      }`;
      return await api.request(endpoint);
    } catch (error) {
      console.error("Error getting places:", error);
      throw error;
    }
  }

  static async getPlace(id) {
    try {
      return await api.request(`/api/public/places/${id}`);
    } catch (error) {
      console.error("Error getting place:", error);
      throw error;
    }
  }

  static async getFeaturedPlaces(limit = 6) {
    try {
      return await this.getPlaces({
        featured: true,
        limit,
        status: "published",
      });
    } catch (error) {
      console.error("Error getting featured places:", error);
      throw error;
    }
  }

  static async searchPlaces(query, filters = {}) {
    try {
      return await this.getPlaces({
        search: query,
        ...filters,
      });
    } catch (error) {
      console.error("Error searching places:", error);
      throw error;
    }
  }

  static async getPlacesByCategory(categoryId, params = {}) {
    try {
      return await this.getPlaces({
        category: categoryId,
        ...params,
      });
    } catch (error) {
      console.error("Error getting places by category:", error);
      throw error;
    }
  }
}
