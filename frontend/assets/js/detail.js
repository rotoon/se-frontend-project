// Detail page entry point for Webpack
import '../css/style.css';
import './api';
import { LanguageManager } from './modules/language';
import { Utils } from './modules/utils';
import { PlacesAPI } from './modules/places-api';
import { CategoriesAPI } from './modules/categories-api';

// Detail page functionality
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize detail page
    initDetailPage();
});

async function initDetailPage() {
    try {
        // Get place ID from URL
        const placeId = Utils.getUrlParams().id;
        
        if (!placeId) {
            Utils.showError('placeDetailContainer', 'ไม่พบรหัสสถานที่');
            return;
        }
        
        // Load place details
        await loadPlaceDetail(placeId);
        
        // Initialize components
        initImageGallery();
        initMap();
        initSocialShare();
        
    } catch (error) {
        console.error('Error initializing detail page:', error);
        Utils.showError('placeDetailContainer', 'ไม่สามารถโหลดรายละเอียดสถานที่ได้');
    }
}

// Load place detail data
async function loadPlaceDetail(placeId) {
    const container = document.getElementById('placeDetailContainer');
    Utils.showLoading('placeDetailContainer');
    
    try {
        const response = await PlacesAPI.getPlace(placeId);
        
        if (response.success && response.data) {
            const place = response.data;
            
            // Update page title
            const name = LanguageManager.translate(place.name);
            document.title = `${name} - เชียงใหม่ท่องเที่ยว`;
            
            // Render place details
            container.innerHTML = renderPlaceDetail(place);
            
            // Load related places
            if (place.category) {
                loadRelatedPlaces(place.category, placeId);
            }
            
        } else {
            Utils.showError('placeDetailContainer', 'ไม่พบข้อมูลสถานที่นี้');
        }
        
    } catch (error) {
        console.error('Error loading place detail:', error);
        Utils.showError('placeDetailContainer', 'ไม่สามารถโหลดรายละเอียดสถานที่ได้');
    }
}

// Render place detail HTML
function renderPlaceDetail(place) {
    const name = LanguageManager.translate(place.name);
    const description = LanguageManager.translate(place.description);
    const address = LanguageManager.translate(place.address);
    
    const mainImage = place.images && place.images.length > 0 
        ? Utils.getImageUrl(place.images[0]) 
        : 'https://via.placeholder.com/800x400?text=No+Image';
        
    const rating = place.rating || 0;
    const priceRange = place.priceRange || 'ไม่ระบุ';
    
    return `
        <!-- Hero Section -->
        <div class="place-hero">
            <div class="place-hero-image">
                <img src="${mainImage}" alt="${name}" class="w-100" style="height: 400px; object-fit: cover;"
                     onerror="this.src='https://via.placeholder.com/800x400?text=No+Image'">
                <div class="place-hero-overlay">
                    <div class="container">
                        <div class="row align-items-end h-100">
                            <div class="col-lg-8">
                                <div class="place-hero-content">
                                    <h1 class="place-title text-white mb-3">${name}</h1>
                                    <div class="place-meta text-white-50">
                                        <span class="me-4">
                                            <i class="fas fa-star text-warning me-1"></i>
                                            ${rating.toFixed(1)}
                                        </span>
                                        <span class="me-4">
                                            <i class="fas fa-dollar-sign me-1"></i>
                                            ${priceRange}
                                        </span>
                                        ${place.featured ? '<span class="badge bg-warning text-dark">แนะนำ</span>' : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="container my-5">
            <div class="row">
                <div class="col-lg-8">
                    <!-- Description -->
                    <div class="place-section">
                        <h3>เกี่ยวกับสถานที่นี้</h3>
                        <div class="place-description">
                            ${description.split('\\n').map(para => `<p>${para}</p>`).join('')}
                        </div>
                    </div>

                    <!-- Image Gallery -->
                    ${place.images && place.images.length > 1 ? renderImageGallery(place.images) : ''}

                    <!-- Details -->
                    <div class="place-section">
                        <h3>รายละเอียด</h3>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="detail-item">
                                    <strong>ที่อยู่:</strong>
                                    <p>${address}</p>
                                </div>
                                ${place.phone ? `
                                <div class="detail-item">
                                    <strong>โทรศัพท์:</strong>
                                    <p><a href="tel:${place.phone}">${place.phone}</a></p>
                                </div>
                                ` : ''}
                                ${place.website ? `
                                <div class="detail-item">
                                    <strong>เว็บไซต์:</strong>
                                    <p><a href="${place.website}" target="_blank">${place.website}</a></p>
                                </div>
                                ` : ''}
                            </div>
                            <div class="col-md-6">
                                ${place.openingHours ? renderOpeningHours(place.openingHours) : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Map -->
                    ${place.location && place.location.lat && place.location.lng ? renderMap(place) : ''}
                </div>

                <!-- Sidebar -->
                <div class="col-lg-4">
                    <div class="place-sidebar">
                        <!-- Quick Info -->
                        <div class="sidebar-card">
                            <h5>ข้อมูลเบื้องต้น</h5>
                            <div class="quick-info">
                                <div class="info-item">
                                    <i class="fas fa-star text-warning"></i>
                                    <span>คะแนน: ${rating.toFixed(1)}/5</span>
                                </div>
                                <div class="info-item">
                                    <i class="fas fa-dollar-sign text-success"></i>
                                    <span>ราคา: ${priceRange}</span>
                                </div>
                                ${place.category ? `
                                <div class="info-item">
                                    <i class="fas fa-tag text-info"></i>
                                    <span>หมวด: ${place.categoryName || place.category}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Share -->
                        <div class="sidebar-card">
                            <h5>แชร์สถานที่นี้</h5>
                            <div class="share-buttons" id="shareButtons">
                                <!-- Share buttons will be generated by JS -->
                            </div>
                        </div>

                        <!-- Navigation -->
                        <div class="sidebar-card">
                            <h5>การเดินทาง</h5>
                            <div class="d-grid gap-2">
                                ${place.location && place.location.lat && place.location.lng ? `
                                <button class="btn btn-outline-primary" onclick="openGoogleMaps(${place.location.lat}, ${place.location.lng})">
                                    <i class="fas fa-directions me-2"></i>
                                    Google Maps
                                </button>
                                ` : ''}
                                <button class="btn btn-outline-secondary" onclick="goBack()">
                                    <i class="fas fa-arrow-left me-2"></i>
                                    กลับไปหน้าก่อน
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Related Places -->
        <div class="container mb-5">
            <div class="row">
                <div class="col-12">
                    <h3>สถานที่ใกล้เคียง</h3>
                    <div id="relatedPlacesContainer" class="row">
                        <!-- Related places will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render image gallery
function renderImageGallery(images) {
    return `
        <div class="place-section">
            <h3>รูปภาพ</h3>
            <div class="image-gallery" id="imageGallery">
                <div class="row g-2">
                    ${images.map((image, index) => `
                        <div class="col-md-4">
                            <div class="gallery-item" onclick="openLightbox(${index})">
                                <img src="${Utils.getImageUrl(image)}" alt="รูปภาพที่ ${index + 1}" 
                                     class="w-100" style="height: 200px; object-fit: cover; cursor: pointer;">
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Render opening hours
function renderOpeningHours(openingHours) {
    return `
        <div class="detail-item">
            <strong>เวลาเปิด-ปิด:</strong>
            <div class="opening-hours">
                ${Object.entries(openingHours).map(([day, hours]) => `
                    <div class="hours-item">
                        <span class="day">${translateDay(day)}:</span>
                        <span class="hours">${hours || 'ปิด'}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Render map
function renderMap(place) {
    return `
        <div class="place-section">
            <h3>แผนที่</h3>
            <div class="map-container">
                <div id="placeMap" style="height: 300px; background: #f8f9fa; border-radius: 8px;">
                    <div class="d-flex align-items-center justify-content-center h-100">
                        <div class="text-center">
                            <i class="fas fa-map-marked-alt fa-3x text-muted mb-3"></i>
                            <p class="text-muted">แผนที่จะแสดงที่นี่</p>
                            <button class="btn btn-primary" onclick="openGoogleMaps(${place.location.lat}, ${place.location.lng})">
                                <i class="fas fa-external-link-alt me-2"></i>
                                ดูใน Google Maps
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Load related places
async function loadRelatedPlaces(categoryId, excludeId) {
    const container = document.getElementById('relatedPlacesContainer');
    
    try {
        const response = await PlacesAPI.getPlacesByCategory(categoryId, { 
            limit: 3,
            exclude: excludeId 
        });
        
        if (response.success && response.data.length > 0) {
            container.innerHTML = response.data.map(place => createRelatedPlaceCard(place)).join('');
        } else {
            container.innerHTML = '<div class="col-12"><p class="text-muted">ไม่มีสถานที่ที่เกี่ยวข้อง</p></div>';
        }
        
    } catch (error) {
        console.error('Error loading related places:', error);
        container.innerHTML = '<div class="col-12"><p class="text-danger">ไม่สามารถโหลดสถานที่ที่เกี่ยวข้องได้</p></div>';
    }
}

// Create related place card
function createRelatedPlaceCard(place) {
    const name = LanguageManager.translate(place.name);
    const imageUrl = place.images && place.images.length > 0 
        ? Utils.getImageUrl(place.images[0]) 
        : 'https://via.placeholder.com/300x200?text=No+Image';
    
    return `
        <div class="col-md-4 mb-3">
            <div class="card h-100" onclick="goToPlace('${place.id}')" style="cursor: pointer;">
                <img src="${imageUrl}" alt="${name}" class="card-img-top" style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <h6 class="card-title">${name}</h6>
                    <div class="text-muted small">
                        <i class="fas fa-star text-warning me-1"></i>
                        ${(place.rating || 0).toFixed(1)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Initialize image gallery
function initImageGallery() {
    // Gallery functionality will be initialized here
}

// Initialize map
function initMap() {
    // Map functionality will be initialized here
}

// Initialize social share
function initSocialShare() {
    const shareContainer = document.getElementById('shareButtons');
    if (!shareContainer) return;
    
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    
    shareContainer.innerHTML = `
        <div class="d-flex gap-2">
            <button class="btn btn-outline-primary flex-fill" onclick="shareOnFacebook('${url}')">
                <i class="fab fa-facebook-f"></i>
            </button>
            <button class="btn btn-outline-info flex-fill" onclick="shareOnTwitter('${url}', '${title}')">
                <i class="fab fa-twitter"></i>
            </button>
            <button class="btn btn-outline-success flex-fill" onclick="shareOnLine('${url}')">
                <i class="fab fa-line"></i>
            </button>
            <button class="btn btn-outline-secondary flex-fill" onclick="copyLink()">
                <i class="fas fa-copy"></i>
            </button>
        </div>
    `;
}

// Helper function to translate day names
function translateDay(day) {
    const days = {
        monday: 'จันทร์',
        tuesday: 'อังคาร', 
        wednesday: 'พุธ',
        thursday: 'พฤหัสฯ',
        friday: 'ศุกร์',
        saturday: 'เสาร์',
        sunday: 'อาทิตย์'
    };
    return days[day.toLowerCase()] || day;
}

// Global functions for interactions
window.openLightbox = function(index) {
    // Implement lightbox functionality
};

window.openGoogleMaps = function(lat, lng) {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
};

window.goBack = function() {
    if (document.referrer) {
        window.history.back();
    } else {
        window.location.href = '../places/';
    }
};

window.goToPlace = function(placeId) {
    window.location.href = `detail.html?id=${placeId}`;
};

window.shareOnFacebook = function(url) {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
};

window.shareOnTwitter = function(url, title) {
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank');
};

window.shareOnLine = function(url) {
    window.open(`https://social-plugins.line.me/lineit/share?url=${url}`, '_blank');
};

window.copyLink = function() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        Utils.showToast('คัดลอกลิงก์เรียบร้อย', 'success');
    }).catch(() => {
        Utils.showToast('ไม่สามารถคัดลอกลิงก์ได้', 'error');
    });
};