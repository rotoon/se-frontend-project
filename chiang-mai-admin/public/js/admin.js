// JavaScript สำหรับหน้า admin
console.log('Admin JS loaded');

// Login Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the login page
    if (document.querySelector('.login-page')) {
        initLoginPage();
    }
});

function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const errorMessage = document.getElementById('error-message');
    const attemptsWarning = document.getElementById('attempts-warning');

    // Toggle password visibility
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            if (type === 'text') {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    // Form validation and submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Clear previous error messages
            hideErrorMessage();
            hideAttemptsWarning();
            
            // Validate form
            if (!this.checkValidity()) {
                this.classList.add('was-validated');
                return;
            }

            // Show loading state
            showLoadingState(true);

            // Get form data
            const formData = new FormData(this);
            const loginData = {
                username: formData.get('username'),
                password: formData.get('password'),
                remember: formData.get('remember') === 'on'
            };

            // Submit login request
            fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            })
            .then(response => response.json())
            .then(data => {
                showLoadingState(false);
                
                if (data.success) {
                    // Redirect to dashboard
                    window.location.href = data.redirect || '/dashboard';
                } else {
                    // Show error message
                    showErrorMessage(data.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
                    
                    // Show attempts warning if applicable
                    if (data.attemptsLeft !== undefined) {
                        showAttemptsWarning(data.attemptsLeft, data.lockTime);
                    }
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                showLoadingState(false);
                showErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
            });
        });
    }

    // Check for URL parameters (error messages)
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const attempts = urlParams.get('attempts');
    const lockTime = urlParams.get('lockTime');

    if (error) {
        showErrorMessage(decodeURIComponent(error));
    }

    if (attempts !== null) {
        showAttemptsWarning(parseInt(attempts), lockTime);
    }
}

function showLoadingState(loading) {
    const loginBtn = document.getElementById('login-btn');
    const btnText = loginBtn.querySelector('.btn-text');
    const spinner = loginBtn.querySelector('.spinner-border');

    if (loading) {
        loginBtn.disabled = true;
        btnText.textContent = 'กำลังเข้าสู่ระบบ...';
        spinner.classList.remove('d-none');
    } else {
        loginBtn.disabled = false;
        btnText.textContent = 'เข้าสู่ระบบ';
        spinner.classList.add('d-none');
    }
}

function showErrorMessage(message) {
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    if (errorMessage && errorText) {
        errorText.textContent = message;
        errorMessage.classList.remove('d-none');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideErrorMessage();
        }, 5000);
    }
}

function hideErrorMessage() {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.classList.add('d-none');
    }
}

function showAttemptsWarning(attemptsLeft, lockTime) {
    const attemptsWarning = document.getElementById('attempts-warning');
    const attemptsText = document.getElementById('attempts-text');
    
    if (attemptsWarning && attemptsText) {
        let message;
        
        if (attemptsLeft === 0) {
            message = `บัญชีถูกล็อคชั่วคราว กรุณารอ ${lockTime} นาที`;
        } else {
            message = `เหลือโอกาสในการเข้าสู่ระบบอีก ${attemptsLeft} ครั้ง`;
        }
        
        attemptsText.textContent = message;
        attemptsWarning.classList.remove('d-none');
    }
}

function hideAttemptsWarning() {
    const attemptsWarning = document.getElementById('attempts-warning');
    if (attemptsWarning) {
        attemptsWarning.classList.add('d-none');
    }
}

// Utility function to clear URL parameters
function clearUrlParams() {
    const url = new URL(window.location);
    url.search = '';
    window.history.replaceState({}, document.title, url);
}

// Logout function
function logout() {
    if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
        fetch('/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/login';
            } else {
                alert('เกิดข้อผิดพลาดในการออกจากระบบ');
            }
        })
        .catch(error => {
            console.error('Logout error:', error);
            // Force redirect to login page even if request fails
            window.location.href = '/login';
        });
    }
}

// Debounce utility function for search
function debounce(func, wait) {
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