// Login entry point for Vite
import './config.js';  // Load config first
import './auth.js';
import './api.js';
import './components.js';
import './utils.js';

// Import CSS
import '../css/shadcn-admin.css';

// Login page functionality
function initLoginPage() {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    const lightIcon = document.querySelector('.theme-icon-light');
    const darkIcon = document.querySelector('.theme-icon-dark');

    if (themeToggle && lightIcon && darkIcon) {
        // Check for saved theme preference or default to light
        const currentTheme = localStorage.getItem('theme') || 'light';
        html.setAttribute('data-theme', currentTheme);
        updateThemeIcon();

        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon();
        });

        function updateThemeIcon() {
            const theme = html.getAttribute('data-theme');
            if (theme === 'dark') {
                lightIcon.style.display = 'none';
                darkIcon.style.display = 'block';
            } else {
                lightIcon.style.display = 'block';
                darkIcon.style.display = 'none';
            }
        }
    }

    // Password toggle functionality
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('password');
    const passwordShow = document.querySelector('.password-show');
    const passwordHide = document.querySelector('.password-hide');

    if (passwordToggle && passwordInput && passwordShow && passwordHide) {
        passwordToggle.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            if (type === 'text') {
                passwordShow.style.display = 'none';
                passwordHide.style.display = 'block';
            } else {
                passwordShow.style.display = 'block';
                passwordHide.style.display = 'none';
            }
        });
    }

    // Form validation and submission
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const loginBtn = document.getElementById('loginBtn');
    const loginText = document.querySelector('.login-text');
    const loadingState = document.querySelector('.loading-state');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(loginForm);
            const username = formData.get('username');
            const password = formData.get('password');
            const remember = formData.get('remember');

            // Hide previous errors
            hideError();
            
            // Show loading state
            showLoading();

            try {
                // Use auth manager if available
                if (window.auth && window.auth.login) {
                    const result = await window.auth.login(username, password, !!remember);
                    if (result.success) {
                        window.location.href = 'dashboard.html';
                    } else {
                        showError(result.message || 'การเข้าสู่ระบบล้มเหลว กรุณาลองใหม่อีกครั้ง');
                    }
                } else {
                    // Use API client if available
                    if (window.api && window.api.auth) {
                        const result = await window.api.auth.login({ username, password });
                        if (result.success) {
                            // Store auth token if provided
                            if (result.data.accessToken) {
                                localStorage.setItem('auth_token', result.data.accessToken);
                            }
                            
                            // Redirect to dashboard
                            window.location.href = 'dashboard.html';
                        } else {
                            showError(result.error || 'การเข้าสู่ระบบล้มเหลว กรุณาลองใหม่อีกครั้ง');
                        }
                    } else {
                        // Fallback to direct API call to correct endpoint
                        const response = await fetch(window.appConfig.getAPIURL('/api/admin/auth/login'), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                username,
                                password,
                                remember: !!remember
                            })
                        });

                        const data = await response.json();

                        if (response.ok && data.success) {
                            // Store auth token if provided
                            if (data.accessToken) {
                                localStorage.setItem('auth_token', data.accessToken);
                            }
                            
                            // Redirect to dashboard
                            window.location.href = 'dashboard.html';
                        } else {
                            showError(data.message || 'การเข้าสู่ระบบล้มเหลว กรุณาลองใหม่อีกครั้ง');
                        }
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                showError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
            } finally {
                hideLoading();
            }
        });

        function showError(message) {
            if (errorText && errorMessage) {
                errorText.textContent = message;
                errorMessage.style.display = 'block';
            }
        }

        function hideError() {
            if (errorMessage) {
                errorMessage.style.display = 'none';
            }
        }

        function showLoading() {
            if (loginBtn && loginText && loadingState) {
                loginBtn.disabled = true;
                loginText.style.display = 'none';
                loadingState.style.display = 'flex';
                loadingState.style.alignItems = 'center';
                loadingState.style.gap = '0.5rem';
            }
        }

        function hideLoading() {
            if (loginBtn && loginText && loadingState) {
                loginBtn.disabled = false;
                loginText.style.display = 'flex';
                loginText.style.alignItems = 'center';
                loginText.style.gap = '0.5rem';
                loadingState.style.display = 'none';
            }
        }
    }

    // Auto-focus first input
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.focus();
    }

    // Handle Enter key in form fields
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && loginForm) {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    });
}

// Show page after CSS loads
function showPage() {
    document.body.classList.add('loaded');
}

// Initialize login page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    
    // Show page immediately if CSS is likely loaded
    if (document.readyState === 'complete') {
        showPage();
    } else {
        // Wait for window load to ensure CSS is loaded
        window.addEventListener('load', showPage);
        
        // Fallback: show page after short delay
        setTimeout(showPage, 200);
    }
    
    // Initialize login functionality
    initLoginPage();
    
    // Wait a bit before checking auth to allow auth module to initialize
    setTimeout(() => {
        // Redirect to dashboard if already authenticated
        if (window.auth && window.auth.isAuthenticated()) {
            window.location.href = 'dashboard.html';
        }
    }, 100);
});