/**
 * Utility Functions for Shadcn Admin
 * Common helper functions and utilities
 */

// Form validation utilities
const FormValidator = {
    /**
     * Validate required fields
     */
    required(value, fieldName = 'ฟิลด์') {
        if (!value || value.toString().trim() === '') {
            return `${fieldName}จำเป็นต้องกรอก`;
        }
        return null;
    },

    /**
     * Validate email format
     */
    email(value) {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return 'รูปแบบอีเมลไม่ถูกต้อง';
        }
        return null;
    },

    /**
     * Validate minimum length
     */
    minLength(value, min, fieldName = 'ฟิลด์') {
        if (!value) return null;
        if (value.toString().length < min) {
            return `${fieldName}ต้องมีอย่างน้อย ${min} ตัวอักษร`;
        }
        return null;
    },

    /**
     * Validate maximum length
     */
    maxLength(value, max, fieldName = 'ฟิลด์') {
        if (!value) return null;
        if (value.toString().length > max) {
            return `${fieldName}ต้องมีไม่เกิน ${max} ตัวอักษร`;
        }
        return null;
    },

    /**
     * Validate phone number (Thai format)
     */
    phoneNumber(value) {
        if (!value) return null;
        const phoneRegex = /^(\+66|0)[6-9]\d{8}$/;
        if (!phoneRegex.test(value.replace(/[-\s]/g, ''))) {
            return 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';
        }
        return null;
    },

    /**
     * Validate URL format
     */
    url(value) {
        if (!value) return null;
        try {
            new URL(value);
            return null;
        } catch {
            return 'รูปแบบ URL ไม่ถูกต้อง';
        }
    },

    /**
     * Validate coordinates
     */
    coordinates(lat, lng) {
        const errors = [];
        
        if (!lat || isNaN(lat) || lat < -90 || lat > 90) {
            errors.push('ละติจูดไม่ถูกต้อง');
        }
        
        if (!lng || isNaN(lng) || lng < -180 || lng > 180) {
            errors.push('ลองจิจูดไม่ถูกต้อง');
        }
        
        return errors.length > 0 ? errors.join(', ') : null;
    },

    /**
     * Validate form with rules
     */
    validateForm(formData, rules) {
        const errors = {};
        
        Object.keys(rules).forEach(field => {
            const value = formData[field];
            const fieldRules = Array.isArray(rules[field]) ? rules[field] : [rules[field]];
            
            for (const rule of fieldRules) {
                let error = null;
                
                if (typeof rule === 'function') {
                    error = rule(value);
                } else if (typeof rule === 'object') {
                    const { type, params = [], message } = rule;
                    error = this[type]?.(value, ...params) || null;
                    if (error && message) {
                        error = message;
                    }
                }
                
                if (error) {
                    errors[field] = error;
                    break; // Stop at first error for this field
                }
            }
        });
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
};

// Date and time utilities
const DateUtils = {
    /**
     * Format date to Thai format
     */
    formatThai(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            ...options
        };
        
        return new Intl.DateTimeFormat('th-TH', defaultOptions).format(new Date(date));
    },

    /**
     * Format relative time (e.g., "2 hours ago")
     */
    formatRelative(date) {
        const now = new Date();
        const target = new Date(date);
        const diffInMs = now - target;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMinutes < 1) {
            return 'เมื่อกี้นี้';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} นาทีที่แล้ว`;
        } else if (diffInHours < 24) {
            return `${diffInHours} ชั่วโมงที่แล้ว`;
        } else if (diffInDays < 7) {
            return `${diffInDays} วันที่แล้ว`;
        } else {
            return this.formatThai(target, { month: 'short' });
        }
    },

    /**
     * Get current timestamp in Thai timezone
     */
    getCurrentTimestamp() {
        return new Date().toLocaleString('th-TH', {
            timeZone: 'Asia/Bangkok'
        });
    },

    /**
     * Parse Thai date string
     */
    parseThai(dateString) {
        // Handle various Thai date formats
        return new Date(dateString);
    }
};

// File handling utilities
const FileUtils = {
    /**
     * Format file size in human readable format
     */
    formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Validate file type
     */
    validateType(file, allowedTypes) {
        const fileType = file.type;
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        return allowedTypes.some(type => {
            if (type.includes('/')) {
                return fileType === type;
            } else {
                return fileExtension === type;
            }
        });
    },

    /**
     * Validate file size
     */
    validateSize(file, maxSize) {
        return file.size <= maxSize;
    },

    /**
     * Read file as data URL
     */
    readAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /**
     * Create image thumbnail
     */
    createThumbnail(file, maxWidth = 200, maxHeight = 200, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                const { width, height } = this.calculateThumbnailSize(
                    img.width, 
                    img.height, 
                    maxWidth, 
                    maxHeight
                );
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };
            
            img.src = URL.createObjectURL(file);
        });
    },

    /**
     * Calculate thumbnail dimensions
     */
    calculateThumbnailSize(originalWidth, originalHeight, maxWidth, maxHeight) {
        let width = originalWidth;
        let height = originalHeight;
        
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }
        
        return { width: Math.round(width), height: Math.round(height) };
    }
};

// URL and navigation utilities
const UrlUtils = {
    /**
     * Get URL parameters
     */
    getParams() {
        return new URLSearchParams(window.location.search);
    },

    /**
     * Get specific parameter
     */
    getParam(name, defaultValue = null) {
        return this.getParams().get(name) || defaultValue;
    },

    /**
     * Update URL parameters without page reload
     */
    updateParams(params) {
        const url = new URL(window.location);
        Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === undefined) {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, params[key]);
            }
        });
        window.history.replaceState({}, '', url);
    },

    /**
     * Build URL with parameters
     */
    buildUrl(baseUrl, params = {}) {
        const url = new URL(baseUrl, window.location.origin);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.set(key, params[key]);
            }
        });
        return url.toString();
    }
};

// Local storage utilities
const StorageUtils = {
    /**
     * Set item in localStorage with expiration
     */
    set(key, value, expirationInMinutes = null) {
        const item = {
            value,
            timestamp: Date.now(),
            expiration: expirationInMinutes ? Date.now() + (expirationInMinutes * 60 * 1000) : null
        };
        localStorage.setItem(key, JSON.stringify(item));
    },

    /**
     * Get item from localStorage
     */
    get(key, defaultValue = null) {
        try {
            const itemStr = localStorage.getItem(key);
            if (!itemStr) return defaultValue;

            const item = JSON.parse(itemStr);
            
            // Check expiration
            if (item.expiration && Date.now() > item.expiration) {
                localStorage.removeItem(key);
                return defaultValue;
            }
            
            return item.value;
        } catch {
            return defaultValue;
        }
    },

    /**
     * Remove item from localStorage
     */
    remove(key) {
        localStorage.removeItem(key);
    },

    /**
     * Clear all items
     */
    clear() {
        localStorage.clear();
    },

    /**
     * Check if item exists and is not expired
     */
    has(key) {
        return this.get(key) !== null;
    }
};

// Debounce and throttle utilities
const PerformanceUtils = {
    /**
     * Debounce function execution
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    /**
     * Throttle function execution
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Lazy load images
     */
    lazyLoadImages(selector = 'img[data-src]', options = {}) {
        const defaultOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1,
            ...options
        };

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        }, defaultOptions);

        document.querySelectorAll(selector).forEach(img => {
            imageObserver.observe(img);
        });
    }
};

// Text and string utilities
const TextUtils = {
    /**
     * Truncate text with ellipsis
     */
    truncate(text, length = 100, suffix = '...') {
        if (!text || text.length <= length) return text;
        return text.substring(0, length).trim() + suffix;
    },

    /**
     * Convert to slug (URL-friendly string)
     */
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\u0E00-\u0E7Fa-z0-9 -]/g, '') // Keep Thai characters, English, numbers, spaces, hyphens
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Strip HTML tags
     */
    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    },

    /**
     * Capitalize first letter
     */
    capitalize(text) {
        if (!text) return text;
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
};

// Color utilities
const ColorUtils = {
    /**
     * Generate random color
     */
    randomHex() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16);
    },

    /**
     * Convert hex to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    /**
     * Get contrast color (black or white)
     */
    getContrastColor(hex) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return '#000000';
        
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
    }
};

// Export utilities for global use
window.utils = {
    form: FormValidator,
    date: DateUtils,
    file: FileUtils,
    url: UrlUtils,
    storage: StorageUtils,
    performance: PerformanceUtils,
    text: TextUtils,
    color: ColorUtils
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FormValidator,
        DateUtils,
        FileUtils,
        UrlUtils,
        StorageUtils,
        PerformanceUtils,
        TextUtils,
        ColorUtils
    };
}