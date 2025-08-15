// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize admin page
    initAdminPage();
    
    // Load dashboard data
    loadDashboardData();
});

// Load all dashboard data
async function loadDashboardData() {
    AdminUtils.showLoading();
    
    try {
        await Promise.all([
            loadStats(),
            loadCategoriesChart(),
            loadRecentActivity(),
            loadLatestPlaces()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        AdminUtils.showToast('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้', 'error');
    } finally {
        AdminUtils.hideLoading();
    }
}

// Load and display statistics
async function loadStats() {
    try {
        const response = await AdminAPI.getDashboardStats();
        
        if (response.success) {
            const stats = response.stats;
            const statsGrid = document.getElementById('statsGrid');
            
            const statsData = [
                {
                    title: 'สถานที่ท่องเที่ยวทั้งหมด',
                    number: stats.totalPlaces,
                    icon: 'fas fa-map-marker-alt',
                    color: 'primary',
                    change: '+12%'
                },
                {
                    title: 'สถานที่ที่เผยแพร่',
                    number: stats.publishedPlaces,
                    icon: 'fas fa-eye',
                    color: 'success',
                    change: '+8%'
                },
                {
                    title: 'หมวดหมู่',
                    number: stats.totalCategories,
                    icon: 'fas fa-layer-group',
                    color: 'info',
                    change: '+2'
                },
                {
                    title: 'เพิ่มใหม่ (7 วัน)',
                    number: stats.recentPlaces,
                    icon: 'fas fa-plus',
                    color: 'warning',
                    change: '+' + stats.recentPlaces
                }
            ];

            statsGrid.innerHTML = statsData.map(stat => `
                <div class="stat-card ${stat.color}">
                    <div class="stat-header">
                        <h6 class="stat-title">${stat.title}</h6>
                        <div class="stat-icon">
                            <i class="${stat.icon}"></i>
                        </div>
                    </div>
                    <div class="d-flex justify-content-between align-items-end">
                        <h2 class="stat-number">${stat.number}</h2>
                        <small class="text-success">
                            <i class="fas fa-arrow-up me-1"></i>${stat.change}
                        </small>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        AdminUtils.showToast('ไม่สามารถโหลดสถิติได้', 'error');
    }
}

// Load categories chart
async function loadCategoriesChart() {
    try {
        const response = await AdminAPI.getDashboardStats();
        
        if (response.success && response.categories) {
            const categories = response.categories;
            const ctx = document.getElementById('categoryChart').getContext('2d');
            
            // Chart colors
            const colors = [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                '#9966FF', '#FF9F40', '#FF6384', '#36A2EB'
            ];

            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: categories.map(cat => AdminUtils.getLocalizedText(cat.name)),
                    datasets: [{
                        data: categories.map(cat => cat.placesCount),
                        backgroundColor: colors.slice(0, categories.length),
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${value} สถานที่ (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            document.getElementById('categoriesChart').innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-chart-pie fa-3x mb-3"></i>
                    <p>ไม่มีข้อมูลแสดงกราฟ</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading categories chart:', error);
        document.getElementById('categoriesChart').innerHTML = `
            <div class="text-center text-danger py-5">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <p>ไม่สามารถโหลดกราฟได้</p>
            </div>
        `;
    }
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const response = await AdminAPI.getDashboardStats();
        
        if (response.success && response.recentActivity) {
            const activities = response.recentActivity;
            const container = document.getElementById('recentActivity');
            
            if (activities.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-history fa-2x mb-3"></i>
                        <p>ไม่มีกิจกรรมล่าสุด</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = activities.map(activity => `
                <div class="d-flex align-items-center mb-3 p-2 border-bottom">
                    <div class="flex-shrink-0">
                        <div class="rounded-circle d-flex align-items-center justify-content-center" 
                             style="width: 40px; height: 40px; background: rgba(13, 110, 253, 0.1);">
                            <i class="fas ${activity.icon || 'fa-info'} text-primary"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1 ms-3">
                        <p class="mb-1 small">${activity.message}</p>
                        <small class="text-muted">${AdminUtils.formatDate(activity.date)}</small>
                    </div>
                </div>
            `).join('');
        } else {
            document.getElementById('recentActivity').innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-history fa-2x mb-3"></i>
                    <p>ไม่มีกิจกรรมล่าสุด</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
        document.getElementById('recentActivity').innerHTML = `
            <div class="text-center text-danger py-4">
                <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                <p>ไม่สามารถโหลดกิจกรรมได้</p>
            </div>
        `;
    }
}

// Load latest places
async function loadLatestPlaces() {
    try {
        const response = await AdminAPI.getPlaces({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
        
        if (response.success && response.data) {
            const places = response.data;
            const tableBody = document.getElementById('latestPlacesTable');
            
            if (places.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-muted py-4">
                            <i class="fas fa-map-marker-alt fa-2x mb-3"></i>
                            <br>ไม่มีสถานที่ท่องเที่ยว
                        </td>
                    </tr>
                `;
                return;
            }

            // Get categories for lookup
            const categoriesResponse = await AdminAPI.getCategories();
            const categories = categoriesResponse.success ? categoriesResponse.data : [];
            const categoryMap = categories.reduce((map, cat) => {
                map[cat.id] = AdminUtils.getLocalizedText(cat.name);
                return map;
            }, {});

            tableBody.innerHTML = places.map(place => `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${AdminUtils.getImageUrl(place.images && place.images[0])}" 
                                 alt="${AdminUtils.getLocalizedText(place.name)}"
                                 class="rounded me-3" 
                                 style="width: 50px; height: 50px; object-fit: cover;"
                                 onerror="this.src='https://via.placeholder.com/50x50?text=No+Image'">
                            <div>
                                <div class="fw-bold">${AdminUtils.getLocalizedText(place.name)}</div>
                                <small class="text-muted">${place.id}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge bg-info">${categoryMap[place.category] || 'ไม่ระบุ'}</span>
                    </td>
                    <td>
                        ${AdminUtils.getStatusBadge(place.status)}
                    </td>
                    <td>
                        <small>${AdminUtils.formatDate(place.createdAt)}</small>
                    </td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="viewPlace('${place.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-secondary" onclick="editPlace('${place.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading latest places:', error);
        document.getElementById('latestPlacesTable').innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                    <br>ไม่สามารถโหลดข้อมูลได้
                </td>
            </tr>
        `;
    }
}

// Action functions
function viewPlace(placeId) {
    window.open(`../../frontend/places/detail.html?id=${placeId}`, '_blank');
}

function editPlace(placeId) {
    window.location.href = `../places/edit.html?id=${placeId}`;
}