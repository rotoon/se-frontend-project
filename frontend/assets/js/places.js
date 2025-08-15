// Places page entry point for Webpack
import '../css/style.css';
import './api';
import { LanguageManager } from './modules/language';
import { Utils } from './modules/utils';
import { PlacesAPI } from './modules/places-api';
import { CategoriesAPI } from './modules/categories-api';

// Places page functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('🗺️ Places page loaded with Webpack');
    
    // Initialize places page
    initPlacesPage();
});

async function initPlacesPage() {
    try {
        // Initialize UI components
        initFilters();
        initSearch();
        initPagination();
        
        // Load initial data
        await loadPlacesData();
        await loadCategoriesFilter();
        
    } catch (error) {
        console.error('Error initializing places page:', error);
        Utils.showError('placesContainer', 'ไม่สามารถโหลดข้อมูลสถานที่ได้');
    }
}

// Initialize filters
function initFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleFilterChange);
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', handleFilterChange);
    }
}

// Initialize search
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', Utils.debounce(handleSearch, 300));
    }
}

// Initialize pagination
function initPagination() {
    // Pagination will be handled dynamically when data is loaded
}

// Handle filter changes
async function handleFilterChange() {
    const params = getFilterParams();
    await loadPlacesData(params);
    updateURL(params);
}

// Handle search
async function handleSearch(event) {
    const searchTerm = event.target.value.trim();
    const params = getFilterParams();
    
    if (searchTerm) {
        params.search = searchTerm;
    } else {
        delete params.search;
    }
    
    await loadPlacesData(params);
    updateURL(params);
}

// Get filter parameters from form
function getFilterParams() {
    const params = {};
    
    // Get URL parameters first
    const urlParams = Utils.getUrlParams();
    Object.assign(params, urlParams);
    
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter && categoryFilter.value) {
        params.category = categoryFilter.value;
    }
    
    // Sort filter
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter && sortFilter.value) {
        const [sortBy, sortOrder] = sortFilter.value.split('_');
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;
    }
    
    // Search term
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim()) {
        params.search = searchInput.value.trim();
    }
    
    return params;
}

// Load places data
async function loadPlacesData(params = {}) {
    const container = document.getElementById('placesContainer');
    const resultsInfo = document.getElementById('resultsInfo');
    
    Utils.showLoading('placesContainer');
    
    try {
        const response = await PlacesAPI.getPlaces({
            limit: 12,
            ...params
        });
        
        if (response.success && response.data.length > 0) {
            // Display places
            container.innerHTML = response.data.map(place => createPlaceCard(place)).join('');
            
            // Update results info
            if (resultsInfo) {
                const total = response.pagination?.total || response.data.length;
                resultsInfo.textContent = `พบ ${total} สถานที่`;
            }
            
            // Handle pagination if needed
            if (response.pagination) {
                renderPagination(response.pagination);
            }
            
        } else {
            Utils.showEmpty('placesContainer', 'ไม่พบสถานที่ที่ตรงกับเงื่อนไข');
            if (resultsInfo) {
                resultsInfo.textContent = 'พบ 0 สถานที่';
            }
        }
        
    } catch (error) {
        console.error('Error loading places:', error);
        Utils.showError('placesContainer', 'ไม่สามารถโหลดข้อมูลสถานที่ได้');
    }
}

// Load categories for filter dropdown
async function loadCategoriesFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    try {
        const response = await CategoriesAPI.getCategories();
        
        if (response.success) {
            // Clear existing options (except "All")
            const allOption = categoryFilter.querySelector('option[value=""]');
            categoryFilter.innerHTML = '';
            if (allOption) {
                categoryFilter.appendChild(allOption);
            }
            
            // Add category options
            response.data.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = LanguageManager.translate(category.name);
                categoryFilter.appendChild(option);
            });
            
            // Set selected category from URL params
            const urlParams = Utils.getUrlParams();
            if (urlParams.category) {
                categoryFilter.value = urlParams.category;
            }
        }
        
    } catch (error) {
        console.error('Error loading categories for filter:', error);
    }
}

// Create place card HTML
function createPlaceCard(place) {
    const name = LanguageManager.translate(place.name);
    const description = Utils.truncateText(LanguageManager.translate(place.description), 120);
    const imageUrl = place.images && place.images.length > 0 
        ? Utils.getImageUrl(place.images[0]) 
        : 'https://via.placeholder.com/400x250?text=No+Image';
    
    const rating = place.rating || 0;
    const priceRange = place.priceRange || 'ไม่ระบุ';

    return `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="place-card" onclick="goToPlaceDetail('${place.id}')">
                <div class="place-image">
                    <img src="${imageUrl}" alt="${name}" loading="lazy"
                         onerror="this.src='https://via.placeholder.com/400x250?text=No+Image'">
                    ${place.featured ? '<div class="place-badge"><span class="badge bg-warning">แนะนำ</span></div>' : ''}
                </div>
                <div class="place-content">
                    <h5 class="place-title">${name}</h5>
                    <p class="place-description">${description}</p>
                    <div class="place-meta">
                        <div class="place-rating">
                            ${Utils.generateStars(rating)}
                            <span class="ms-1">${rating.toFixed(1)}</span>
                        </div>
                        <div class="place-price">${priceRange}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render pagination
function renderPagination(pagination) {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer || !pagination) return;
    
    const { current, total, hasNext, hasPrev } = pagination;
    
    let paginationHtml = '<nav><ul class="pagination justify-content-center">';
    
    // Previous button
    paginationHtml += `
        <li class="page-item ${!hasPrev ? 'disabled' : ''}">
            <button class="page-link" onclick="changePage(${current - 1})" ${!hasPrev ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        </li>
    `;
    
    // Page numbers
    const startPage = Math.max(1, current - 2);
    const endPage = Math.min(total, current + 2);
    
    if (startPage > 1) {
        paginationHtml += `<li class="page-item"><button class="page-link" onclick="changePage(1)">1</button></li>`;
        if (startPage > 2) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <li class="page-item ${i === current ? 'active' : ''}">
                <button class="page-link" onclick="changePage(${i})">${i}</button>
            </li>
        `;
    }
    
    if (endPage < total) {
        if (endPage < total - 1) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        paginationHtml += `<li class="page-item"><button class="page-link" onclick="changePage(${total})">${total}</button></li>`;
    }
    
    // Next button
    paginationHtml += `
        <li class="page-item ${!hasNext ? 'disabled' : ''}">
            <button class="page-link" onclick="changePage(${current + 1})" ${!hasNext ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        </li>
    `;
    
    paginationHtml += '</ul></nav>';
    paginationContainer.innerHTML = paginationHtml;
}

// Change page
window.changePage = async function(page) {
    const params = getFilterParams();
    params.page = page;
    await loadPlacesData(params);
    updateURL(params);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Navigate to place detail
window.goToPlaceDetail = function(placeId) {
    window.location.href = `detail.html?id=${placeId}`;
};

// Update URL with current filters
function updateURL(params) {
    Utils.updateUrl(params, true);
}

// Initialize filters from URL on page load
window.addEventListener('load', () => {
    const urlParams = Utils.getUrlParams();
    
    // Set filter values from URL
    Object.keys(urlParams).forEach(key => {
        const element = document.getElementById(key + 'Filter') || document.getElementById(key);
        if (element && element.tagName.toLowerCase() === 'select') {
            element.value = urlParams[key];
        } else if (element && element.type === 'text') {
            element.value = urlParams[key];
        }
    });
});