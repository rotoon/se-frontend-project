/**
 * API Client for Shadcn Admin
 * Centralized API management with authentication and error handling
 */

import config from './config.js';

class APIClient {
    constructor() {
        this.config = config;
        this.baseURL = config.getAPIBaseURL();
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    /**
     * Make authenticated API request
     * @param {string} endpoint 
     * @param {Object} options 
     * @returns {Promise<Object>}
     */
    async request(endpoint, options = {}) {
        const url = this.config.getAPIURL(endpoint);
        
        const config = {
            ...options,
            headers: {
                ...this.defaultHeaders,
                ...options.headers,
            },
            credentials: 'include',
        };

        // Add auth token if available
        const token = window.auth?.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                // Handle 401 Unauthorized - try to refresh token
                if (response.status === 401 && window.auth && data.code !== 'NO_REFRESH_TOKEN') {
                    const refreshed = await window.auth.refreshToken();
                    if (refreshed) {
                        // Retry the request with new token
                        const newToken = window.auth.getToken();
                        config.headers.Authorization = `Bearer ${newToken}`;
                        const retryResponse = await fetch(url, config);
                        const retryData = await retryResponse.json();
                        
                        if (retryResponse.ok) {
                            return {
                                success: true,
                                data: retryData,
                                status: retryResponse.status
                            };
                        }
                    } else {
                        // Refresh failed, logout user
                        window.auth.logout();
                    }
                }
                
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return {
                success: true,
                data: data,
                status: response.status
            };
        } catch (error) {
            console.error('API request error:', error);
            return {
                success: false,
                error: error.message,
                status: error.status || 500
            };
        }
    }

    /**
     * GET request
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'GET',
        });
    }

    /**
     * POST request
     */
    async post(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : null,
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = null, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : null,
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'DELETE',
        });
    }

    /**
     * Upload file
     */
    async upload(endpoint, formData, options = {}) {
        const config = {
            ...options,
            method: 'POST',
            body: formData,
            credentials: 'include',
        };

        // Don't set Content-Type for FormData, let browser set it
        const headers = { ...options.headers };
        delete headers['Content-Type'];
        config.headers = headers;

        // Add auth token if available
        const token = window.auth?.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        try {
            const response = await fetch(this.config.getAPIURL(endpoint), config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return {
                success: true,
                data: data,
                status: response.status
            };
        } catch (error) {
            console.error('Upload error:', error);
            return {
                success: false,
                error: error.message,
                status: error.status || 500
            };
        }
    }
}

// Create global API client instance
const api = new APIClient();

/**
 * Places API
 */
const placesAPI = {
    // Create new place
    async create(placeData) {
        return api.post('/api/admin/places', placeData);
    },

    // Update place
    async update(id, placeData) {
        return api.put(`/api/admin/places/${id}`, placeData);
    },

    // Delete place
    async delete(id) {
        return api.delete(`/api/admin/places/${id}`);
    },

    // Update place status
    async updateStatus(id, status) {
        return api.put(`/api/admin/places/${id}/status`, { status });
    }
};

/**
 * Categories API
 */
const categoriesAPI = {
    // Get all categories (admin)
    async getAll() {
        return api.get('/api/admin/categories');
    },

    // Get single category (admin)
    async getById(id) {
        return api.get(`/api/admin/categories/${id}`);
    },

    // Create new category
    async create(categoryData) {
        return api.post('/api/admin/categories', categoryData);
    },

    // Update category
    async update(id, categoryData) {
        return api.put(`/api/admin/categories/${id}`, categoryData);
    },

    // Delete category
    async delete(id) {
        return api.delete(`/api/admin/categories/${id}`);
    },

    // Get category with places count
    async getWithPlacesCount() {
        return api.get('/api/admin/categories/stats');
    }
};

/**
 * Auth API
 */
const authAPI = {
    // Login
    async login(credentials) {
        return api.post('/api/admin/auth/login', credentials);
    },

    // Logout
    async logout() {
        return api.post('/api/admin/auth/logout');
    },

    // getCurrentUser removed (use AuthManager local state)

    // Refresh token
    async refreshToken() {
        return api.post('/api/admin/auth/refresh');
    }
};

/**
 * Dashboard API
 */
const dashboardAPI = {
    // Get dashboard stats
    async getStats() {
        return api.get('/api/admin/dashboard/stats');
    }
};

/**
 * Images API
 */
// imagesAPI removed (no direct image endpoints in use)

/**
 * Utility functions for API responses
 */
const apiUtils = {
    /**
     * Handle API response with toast notifications
     */
    async handleResponse(response, successMessage = null, errorMessage = null) {
        if (response.success) {
            if (successMessage && window.showToast) {
                window.showToast(successMessage, 'success');
            }
            return response.data;
        } else {
            const message = errorMessage || response.error || 'เกิดข้อผิดพลาด';
            if (window.showToast) {
                window.showToast(message, 'error');
            }
            throw new Error(message);
        }
    },

    /**
     * Format error message for display
     */
    formatError(error) {
        if (typeof error === 'string') {
            return error;
        }
        if (error.message) {
            return error.message;
        }
        return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
    },

    /**
     * Create query string from object
     */
    createQueryString(params) {
        const filtered = Object.entries(params).filter(([key, value]) => 
            value !== null && value !== undefined && value !== ''
        );
        return new URLSearchParams(filtered).toString();
    },

    /**
     * Parse pagination info from response
     */
    parsePagination(response) {
        const data = response.data || response;
        return {
            currentPage: data.currentPage || 1,
            totalPages: data.totalPages || 1,
            totalItems: data.totalItems || 0,
            itemsPerPage: data.itemsPerPage || 10,
            hasNext: data.hasNext || false,
            hasPrevious: data.hasPrevious || false
        };
    }
};

// Export APIs for global use
window.api = {
    client: api,
    places: placesAPI,
    categories: categoriesAPI,
    auth: authAPI,
    dashboard: dashboardAPI,
    utils: apiUtils
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        APIClient,
        placesAPI,
        categoriesAPI,
        authAPI,
    dashboardAPI,
    apiUtils
    };
}
