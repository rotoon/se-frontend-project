// Dashboard entry point for Vite
import './config.js';  // Load config first
import './auth.js';
import './api.js';
import './components.js';
import './utils.js';

// Import CSS
import '../css/shadcn-admin.css';

// Dashboard functionality
function initDashboard() {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Theme management
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    const lightIcon = document.querySelector('.theme-icon-light');
    const darkIcon = document.querySelector('.theme-icon-dark');

    if (themeToggle && lightIcon && darkIcon) {
        // Load saved theme
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

    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const adminLayout = document.getElementById('adminLayout');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            if (sidebar) sidebar.classList.toggle('open');
            if (sidebarOverlay) sidebarOverlay.classList.toggle('show');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            if (sidebar) sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('show');
        });
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
    
    const handleLogout = async (e) => {
        e.preventDefault();
        if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
            if (window.auth && window.auth.logout) {
                await window.auth.logout();
            }
        }
    };
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.addEventListener('click', handleLogout);
    }

    // Dashboard data loading
    async function loadDashboardData() {
        try {
            // Load stats
            const response = await fetch(window.appConfig.getAPIURL('/api/admin/dashboard/stats'), {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    updateStats(data.stats);
                    // Also update activities if available
                    if (data.recentActivity) {
                        updateActivities(data.recentActivity);
                    }
                }
            }

            // Load user info
            if (window.auth && window.auth.getCurrentUser) {
                const user = window.auth.getCurrentUser();
                if (user) {
                    // Update header username (if exists)
                    const userNameEl = document.getElementById('userName');
                    if (userNameEl) {
                        userNameEl.textContent = user.username || 'Admin';
                    }
                    
                    // Update sidebar username
                    const sidebarUserNameEl = document.getElementById('sidebarUserName');
                    if (sidebarUserNameEl) {
                        sidebarUserNameEl.textContent = user.username || 'Admin';
                    }
                }
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Show skeleton/default data
            showSkeletonData();
        }
    }

    function updateStats(stats) {
        const totalPlacesEl = document.getElementById('totalPlaces');
        const publishedPlacesEl = document.getElementById('publishedPlaces');
        const recentPlacesEl = document.getElementById('recentPlaces');
        const totalCategoriesEl = document.getElementById('totalCategories');

        if (totalPlacesEl) totalPlacesEl.textContent = stats.totalPlaces || 0;
        if (publishedPlacesEl) publishedPlacesEl.textContent = stats.publishedPlaces || 0;
        if (recentPlacesEl) recentPlacesEl.textContent = stats.recentPlaces || 0;
        if (totalCategoriesEl) totalCategoriesEl.textContent = stats.totalCategories || 0;
    }

    function updateActivities(activities) {
        const activitiesList = document.getElementById('activitiesList');
        
        if (activitiesList && activities && activities.length > 0) {
            activitiesList.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i data-lucide="${activity.icon || getActivityIcon(activity.type)}" style="width: 1rem; height: 1rem;"></i>
                    </div>
                    <div class="activity-content">
                        <p class="activity-title">${activity.message || activity.title}</p>
                        <p class="activity-time">${formatTime(activity.date || activity.createdAt)}</p>
                    </div>
                </div>
            `).join('');
            
            // Re-initialize icons for new content
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    function getActivityIcon(type) {
        const icons = {
            'create': 'plus',
            'update': 'edit',
            'delete': 'trash-2',
            'upload': 'image',
            'publish': 'eye',
            'draft': 'file-text'
        };
        return icons[type] || 'activity';
    }

    function formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 60) {
            return `${diffInMinutes} นาทีที่แล้ว`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours} ชั่วโมงที่แล้ว`;
        } else {
            const days = Math.floor(diffInMinutes / 1440);
            return `${days} วันที่แล้ว`;
        }
    }

    function showSkeletonData() {
        // Show loading placeholders
        const totalPlacesEl = document.getElementById('totalPlaces');
        const publishedPlacesEl = document.getElementById('publishedPlaces');
        const recentPlacesEl = document.getElementById('recentPlaces');
        const totalCategoriesEl = document.getElementById('totalCategories');

        if (totalPlacesEl) totalPlacesEl.textContent = '...';
        if (publishedPlacesEl) publishedPlacesEl.textContent = '...';
        if (recentPlacesEl) recentPlacesEl.textContent = '...';
        if (totalCategoriesEl) totalCategoriesEl.textContent = '...';
    }

    // Export functionality
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            // Implement export functionality
            alert('ฟีเจอร์การส่งออกข้อมูลจะพร้อมใช้งานเร็วๆ นี้');
        });
    }

    // Load dashboard data
    loadDashboardData();
    
    // Auto-refresh stats every 5 minutes
    setInterval(loadDashboardData, 5 * 60 * 1000);

    // Handle window resize for responsive layout
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            if (sidebar) sidebar.classList.remove('open');
            if (sidebarOverlay) sidebarOverlay.classList.remove('show');
        }
    });

    // Get auth token
    function getAuthToken() {
        return localStorage.getItem('auth_token') || localStorage.getItem('auth_access_token');
    }
}

// Show page after CSS loads
function showPage() {
    document.body.classList.add('loaded');
}

// Initialize dashboard when DOM is ready
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
    
    // Wait a bit before checking auth to allow auth module to initialize
    setTimeout(() => {
        // Auto-protect this route
        if (window.auth && !window.auth.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        // Initialize dashboard functionality
        initDashboard();
    }, 100);
});