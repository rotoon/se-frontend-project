// Categories API Module
import { api } from '../api';

export class CategoriesAPI {
    static async getCategories() {
        try {
            return await api.request('/api/public/categories');
        } catch (error) {
            console.error('Error getting categories:', error);
            throw error;
        }
    }

    static async getCategory(id) {
        try {
            return await api.request(`/api/public/categories/${id}`);
        } catch (error) {
            console.error('Error getting category:', error);
            throw error;
        }
    }

    static async getCategoryBySlug(slug) {
        try {
            const response = await this.getCategories();
            if (response.success) {
                const category = response.data.find(cat => cat.slug === slug || cat.id === slug);
                return {
                    success: true,
                    data: category || null
                };
            }
            return response;
        } catch (error) {
            console.error('Error getting category by slug:', error);
            throw error;
        }
    }
}