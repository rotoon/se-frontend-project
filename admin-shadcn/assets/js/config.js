/**
 * Configuration for Shadcn Admin
 * Environment-based configuration management
 */

class Config {
    constructor() {
        this.mode = import.meta.env.MODE || 'development';
        this.isDevelopment = this.mode === 'development';
        this.isProduction = this.mode === 'production';
        
        // API Configuration
        this.apiConfig = this.getAPIConfig();
    }

    getAPIConfig() {
        // Use environment variable for API base URL
        const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 
                          (this.isProduction ? 'https://go-chiangmai-api-production.up.railway.app' : 'http://localhost:3000');
        
        return {
            baseURL: apiBaseURL,
            timeout: 30000,
            withCredentials: true
        };
    }

    // Get API base URL
    getAPIBaseURL() {
        return this.apiConfig.baseURL;
    }

    // Get full API URL
    getAPIURL(endpoint) {
        const baseURL = this.getAPIBaseURL();
        if (!baseURL) {
            // Same origin - just return the endpoint
            return endpoint;
        }
        
        // Remove leading slash from endpoint if baseURL ends with one
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
        
        return `${cleanBaseURL}/${cleanEndpoint}`;
    }

    // Get image URL
    getImageURL(filename) {
        if (!filename) return '';
        
        const baseURL = this.getAPIBaseURL();
        if (!baseURL) {
            return `/uploads/${filename}`;
        }
        
        return `${baseURL}/uploads/${filename}`;
    }

    // Debug info
    getDebugInfo() {
        return {
            mode: this.mode,
            isDevelopment: this.isDevelopment,
            isProduction: this.isProduction,
            apiBaseURL: this.getAPIBaseURL(),
            envVars: {
                VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
                MODE: import.meta.env.MODE,
                PROD: import.meta.env.PROD,
                DEV: import.meta.env.DEV
            }
        };
    }
}

// Export singleton instance
const config = new Config();

// Make it available globally
window.appConfig = config;

export default config;