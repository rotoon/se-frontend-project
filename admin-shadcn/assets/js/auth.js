/**
 * Authentication Module for Shadcn Admin
 * Handles login, logout, token management, and route protection
 */

class AuthManager {
    constructor() {
        this.baseURL = window.appConfig ? window.appConfig.getAPIBaseURL() : 'https://go-chiangmai-api-production.up.railway.app';
        this.accessTokenKey = 'auth_access_token';
        this.refreshTokenKey = 'auth_refresh_token';
        this.userKey = 'auth_user';
        this.refreshPromise = null; // Prevent multiple simultaneous refresh calls
        this.init();
    }

    init() {
        // Check authentication status on page load
        this.checkAuthStatus();
        
        // Setup axios interceptors if available
        if (typeof axios !== 'undefined') {
            this.setupAxiosInterceptors();
        }
    }

    /**
     * Login user with credentials
     * @param {string} username 
     * @param {string} password 
     * @param {boolean} remember 
     * @returns {Promise<Object>}
     */
    async login(username, password, remember = false) {
        try {
            const response = await this.makeRequest('/api/admin/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                    remember
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store JWT tokens
                if (data.accessToken) {
                    this.setAccessToken(data.accessToken);
                }
                
                if (data.refreshToken) {
                    this.setRefreshToken(data.refreshToken);
                }
                
                if (data.user) {
                    this.setUser(data.user);
                }

                // Set flag to prevent immediate redirect after login
                this.justLoggedIn = true;
                
                // Trigger login event
                this.dispatchAuthEvent('login', { user: data.user });

                return {
                    success: true,
                    data: data
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'การเข้าสู่ระบบล้มเหลว'
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง'
            };
        }
    }

    /**
     * Logout user
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            // Call logout endpoint if token exists
            const token = this.getAccessToken();
            if (token) {
                await this.makeRequest('/api/admin/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local data
            this.clearAuthData();
            
            // Trigger logout event
            this.dispatchAuthEvent('logout');
            
            // Redirect to login
            this.redirectToLogin();
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        const accessToken = this.getAccessToken();
        const user = this.getUser();
        
        if (!accessToken || !user) {
            return false;
        }

        // Check token expiration
        try {
            const payload = this.parseJWT(accessToken);
            if (payload && payload.exp) {
                const now = Math.floor(Date.now() / 1000);
                if (payload.exp < now) {
                    // Token expired, try to refresh silently
                    this.silentRefresh();
                    return false;
                }
            }
        } catch (error) {
            // If token parsing fails, consider it invalid
            console.warn('Invalid token format:', error);
            this.clearAuthData();
            return false;
        }

        return true;
    }

    /**
     * Get current user data
     * @returns {Object|null}
     */
    getCurrentUser() {
        return this.getUser();
    }

    /**
     * Get authentication token
     * @returns {string|null}
     */
    getAuthToken() {
        return this.getAccessToken();
    }

    /**
     * Refresh authentication token
     * @returns {Promise<boolean>}
     */
    async refreshToken() {
        // Prevent multiple simultaneous refresh calls
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = this._performRefresh();
        const result = await this.refreshPromise;
        this.refreshPromise = null;
        return result;
    }

    /**
     * Perform actual token refresh
     * @private
     */
    async _performRefresh() {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                return false;
            }

            const response = await this.makeRequest('/api/admin/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store new tokens
                if (data.accessToken) {
                    this.setAccessToken(data.accessToken);
                }
                if (data.refreshToken) {
                    this.setRefreshToken(data.refreshToken);
                }
                if (data.user) {
                    this.setUser(data.user);
                }
                return true;
            }

            return false;
        } catch (error) {
            console.error('Token refresh error:', error);
            return false;
        }
    }

    /**
     * Silent token refresh (doesn't throw errors)
     */
    async silentRefresh() {
        try {
            await this.refreshToken();
        } catch (error) {
            console.warn('Silent refresh failed:', error);
        }
    }

    /**
     * Protect route - redirect to login if not authenticated
     */
    protectRoute() {
        if (!this.isAuthenticated()) {
            this.redirectToLogin();
            return false;
        }
        return true;
    }

    /**
     * Check authentication status and redirect if needed
     */
    checkAuthStatus() {
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/admin-shadcn/');
        
        // Don't auto-redirect immediately after successful login
        if (this.justLoggedIn) {
            this.justLoggedIn = false;
            return;
        }
        
        if (isLoginPage && this.isAuthenticated()) {
            // Redirect to dashboard if already logged in
            this.redirectToDashboard();
        } else if (!isLoginPage && !this.isAuthenticated()) {
            // Redirect to login if not authenticated
            this.redirectToLogin();
        }
    }

    // Private methods

    /**
     * Make HTTP request with error handling
     * @private
     */
    async makeRequest(url, options = {}) {
        const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
        
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        return fetch(fullUrl, mergedOptions);
    }

    /**
     * Store access token
     * @private
     */
    setAccessToken(token) {
        localStorage.setItem(this.accessTokenKey, token);
    }

    /**
     * Get access token
     * @private
     */
    getAccessToken() {
        return localStorage.getItem(this.accessTokenKey);
    }

    /**
     * Store refresh token
     * @private
     */
    setRefreshToken(token) {
        localStorage.setItem(this.refreshTokenKey, token);
    }

    /**
     * Get refresh token
     * @private
     */
    getRefreshToken() {
        return localStorage.getItem(this.refreshTokenKey);
    }

    /**
     * Store user data
     * @private
     */
    setUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    /**
     * Get user data
     * @private
     */
    getUser() {
        const userData = localStorage.getItem(this.userKey);
        try {
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }

    /**
     * Clear all authentication data
     * @private
     */
    clearAuthData() {
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem(this.userKey);
        
        // Clear any session storage as well
        sessionStorage.removeItem(this.accessTokenKey);
        sessionStorage.removeItem(this.refreshTokenKey);
        sessionStorage.removeItem(this.userKey);
    }

    /**
     * Parse JWT token
     * @private
     */
    parseJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('JWT parsing error:', error);
            return null;
        }
    }

    /**
     * Setup Axios interceptors for automatic token handling
     * @private
     */
    setupAxiosInterceptors() {
        // Request interceptor to add auth token
        axios.interceptors.request.use(
            (config) => {
                const token = this.getAccessToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor to handle auth errors
        axios.interceptors.response.use(
            (response) => {
                return response;
            },
            async (error) => {
                if (error.response && error.response.status === 401) {
                    // Try to refresh token
                    const refreshed = await this.refreshToken();
                    if (refreshed) {
                        // Retry the original request
                        const originalRequest = error.config;
                        originalRequest.headers.Authorization = `Bearer ${this.getAccessToken()}`;
                        return axios(originalRequest);
                    } else {
                        // Refresh failed, logout user
                        this.logout();
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * Dispatch authentication events
     * @private
     */
    dispatchAuthEvent(type, detail = {}) {
        const event = new CustomEvent(`auth:${type}`, { detail });
        window.dispatchEvent(event);
    }

    /**
     * Redirect to login page
     * @private
     */
    redirectToLogin() {
        const currentPath = window.location.pathname;
        if (!currentPath.includes('index.html') && currentPath !== '/') {
            window.location.href = 'index.html';
        }
    }

    /**
     * Redirect to dashboard
     * @private
     */
    redirectToDashboard() {
        window.location.href = 'dashboard.html';
    }
}

// Create global auth manager instance
const authManager = new AuthManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}

// Global utility functions
window.auth = {
    login: (username, password, remember) => authManager.login(username, password, remember),
    logout: () => authManager.logout(),
    isAuthenticated: () => authManager.isAuthenticated(),
    getCurrentUser: () => authManager.getCurrentUser(),
    getToken: () => authManager.getAuthToken(),
    protectRoute: () => authManager.protectRoute(),
    refreshToken: () => authManager.refreshToken()
};

// Auto-protect routes on page load (except login page)
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('index.html') || 
                       currentPath === '/' || 
                       currentPath.endsWith('/admin-shadcn/');
    
    if (!isLoginPage) {
        authManager.protectRoute();
    }
});

// Listen for storage changes (multi-tab logout)
window.addEventListener('storage', (event) => {
    if ((event.key === authManager.accessTokenKey || event.key === authManager.userKey) && !event.newValue) {
        // Token/user was removed in another tab, logout this tab too
        authManager.clearAuthData();
        authManager.redirectToLogin();
    }
});