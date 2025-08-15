// Admin API Client for managing data
const API_BASE_URL = 'http://localhost:3000';

// Admin API wrapper
class AdminAPI {
    // Generic authenticated request
    static async request(endpoint, options = {}) {
        try {
            const response = await AuthAPI.authenticatedFetch(endpoint, options);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('Admin API Error:', error);
            throw error;
        }
    }

    // Dashboard API
    static async getDashboardStats() {
        return this.request('/api/admin/dashboard/stats');
    }

    static async getUserInfo() {
        return this.request('/api/admin/user/info');
    }

    // Places API
    static async getPlaces(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/api/admin/places${queryString ? `?${queryString}` : ''}`;
        return this.request(endpoint);
    }

    static async getPlace(id) {
        return this.request(`/api/admin/places/${id}`);
    }

    static async createPlace(placeData) {
        return this.request('/api/admin/places', {
            method: 'POST',
            body: JSON.stringify(placeData)
        });
    }

    static async updatePlace(id, placeData) {
        return this.request(`/api/admin/places/${id}`, {
            method: 'PUT',
            body: JSON.stringify(placeData)
        });
    }

    static async deletePlace(id) {
        return this.request(`/api/admin/places/${id}`, {
            method: 'DELETE'
        });
    }

    // Categories API
    static async getCategories() {
        return this.request('/api/admin/categories');
    }

    static async getCategory(id) {
        return this.request(`/api/admin/categories/${id}`);
    }

    static async createCategory(categoryData) {
        return this.request('/api/admin/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    }

    static async updateCategory(id, categoryData) {
        return this.request(`/api/admin/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        });
    }

    static async deleteCategory(id) {
        return this.request(`/api/admin/categories/${id}`, {
            method: 'DELETE'
        });
    }

    // Images API
    static async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await AuthAPI.authenticatedFetch('/api/admin/images', {
            method: 'POST',
            body: formData,
            headers: {} // Don't set Content-Type for FormData
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    }
}

// Utility functions for admin
const AdminUtils = {
    // Show loading overlay
    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.remove('d-none');
    },

    // Hide loading overlay
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.add('d-none');
    },

    // Show toast notification
    showToast(message, type = 'success') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast-custom');
        existingToasts.forEach(toast => toast.remove());

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast-custom alert alert-${type} position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 10000; min-width: 300px;';
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas ${this.getToastIcon(type)} me-2"></i>
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    },

    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    },

    // Format date for Thai locale
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Get localized text
    getLocalizedText(obj, lang = 'th') {
        if (typeof obj === 'string') return obj;
        if (typeof obj === 'object' && obj !== null) {
            return obj[lang] || obj.th || obj.en || '';
        }
        return '';
    },

    // Generate status badge HTML
    getStatusBadge(status) {
        const statusConfig = {
            published: { class: 'success', text: 'เผยแพร่' },
            draft: { class: 'warning', text: 'ฉบับร่าง' },
            inactive: { class: 'secondary', text: 'ไม่ใช้งาน' },
            active: { class: 'success', text: 'ใช้งาน' }
        };

        const config = statusConfig[status] || { class: 'secondary', text: status };
        return `<span class="badge bg-${config.class}">${config.text}</span>`;
    },

    // Create image URL
    getImageUrl(imagePath) {
        if (!imagePath) return 'https://via.placeholder.com/200x150?text=No+Image';
        if (imagePath.startsWith('http')) return imagePath;
        return `${API_BASE_URL}/uploads/${imagePath}`;
    },

    // Confirm dialog
    async confirm(message, title = 'ยืนยัน') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ยกเลิก</button>
                            <button type="button" class="btn btn-danger" id="confirmBtn">ยืนยัน</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            const bsModal = new bootstrap.Modal(modal);
            
            modal.querySelector('#confirmBtn').addEventListener('click', () => {
                bsModal.hide();
                resolve(true);
            });

            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
                resolve(false);
            });

            bsModal.show();
        });
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Common admin page initialization
function initAdminPage() {
    // Check authentication
    AuthAPI.requireAuth().then(isAuth => {
        if (!isAuth) return;
        
        // Initialize sidebar toggle
        initSidebarToggle();
        
        // Initialize user info
        loadUserInfo();
        
        // Hide loading overlay
        AdminUtils.hideLoading();
    });
}

// Sidebar toggle functionality
function initSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');

    if (sidebarToggle && sidebar && mainContent) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        });
    }
}

// Load and display user info
async function loadUserInfo() {
    try {
        const user = AuthAPI.getCurrentUser();
        const userAvatar = document.getElementById('userAvatar');
        
        if (user && userAvatar) {
            userAvatar.textContent = user.username.charAt(0).toUpperCase();
            userAvatar.title = `ผู้ใช้: ${user.username}`;
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Export for global use
window.AdminAPI = AdminAPI;
window.AdminUtils = AdminUtils;
window.initAdminPage = initAdminPage;