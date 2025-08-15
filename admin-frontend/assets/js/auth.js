// Authentication JavaScript for Admin Frontend
const API_BASE_URL = 'http://localhost:3000';

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on login page
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        initLoginForm();
        
        // Auto-redirect if already logged in
        checkAuthStatus().then(isAuthenticated => {
            if (isAuthenticated) {
                window.location.href = 'dashboard/';
            }
        });
    }
});

// Initialize login form
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Validate inputs
        if (!username || !password) {
            showError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
            return;
        }
        
        // Show loading state
        setLoading(true);
        hideError();
        
        try {
            const response = await login(username, password);
            
            if (response.success) {
                // Store user info
                localStorage.setItem('adminUser', JSON.stringify(response.user));
                
                // Show success message
                showSuccess('เข้าสู่ระบบสำเร็จ กำลังโหลด...');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard/';
                }, 1500);
            } else {
                showError(response.message || 'ไม่สามารถเข้าสู่ระบบได้');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + error.message);
        } finally {
            setLoading(false);
        }
    });

    function setLoading(loading) {
        loginBtn.disabled = loading;
        loginBtn.innerHTML = loading 
            ? '<i class="fas fa-spinner fa-spin me-2"></i>กำลังเข้าสู่ระบบ...'
            : '<i class="fas fa-sign-in-alt me-2"></i>เข้าสู่ระบบ';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
    }

    function hideError() {
        errorMessage.classList.add('d-none');
    }

    function showSuccess(message) {
        errorMessage.className = 'alert alert-success';
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
    }
}

// API Functions
async function login(username, password) {
    const response = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
}

async function logout() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        // Clear local storage regardless of response
        localStorage.removeItem('adminUser');
        
        // Redirect to login
        window.location.href = '/admin-frontend/';
        
    } catch (error) {
        console.error('Logout error:', error);
        // Still redirect to login on error
        localStorage.removeItem('adminUser');
        window.location.href = '/admin-frontend/';
    }
}

async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/user/info`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Update stored user info
                localStorage.setItem('adminUser', JSON.stringify(data.user));
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

// Middleware for protected pages
async function requireAuth() {
    const isAuthenticated = await checkAuthStatus();
    
    if (!isAuthenticated) {
        // Clear any stale data
        localStorage.removeItem('adminUser');
        
        // Redirect to login with return URL
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/admin-frontend/?redirect=${encodeURIComponent(currentPath)}`;
        return false;
    }
    
    return true;
}

// Get current user info
function getCurrentUser() {
    const userStr = localStorage.getItem('adminUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Utility function for API calls with auth
async function authenticatedFetch(url, options = {}) {
    const config = {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    // Check if session expired
    if (response.status === 401) {
        localStorage.removeItem('adminUser');
        window.location.href = '/admin-frontend/';
        throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
    }

    return response;
}

// Export functions for other scripts
window.AuthAPI = {
    login,
    logout,
    checkAuthStatus,
    requireAuth,
    getCurrentUser,
    authenticatedFetch
};