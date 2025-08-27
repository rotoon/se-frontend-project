// Places entry point for Vite
import './auth.js';
import './api.js';
import './components.js';
import './utils.js';

// Import CSS
import '../css/shadcn-admin.css';

// Store references
let placeModalInstance = null;
let deletePlaceModalInstance = null;
let currentPlaceId = null;
let currentView = 'grid';
let places = [];
let categories = [];

// DOM Elements
const elements = {
  // Buttons
  addPlaceBtn: document.getElementById('addPlaceBtn'),
  themeToggle: document.getElementById('themeToggle'),
  sidebarToggle: document.getElementById('sidebarToggle'),
  gridViewBtn: document.getElementById('gridViewBtn'),
  listViewBtn: document.getElementById('listViewBtn'),
  confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
  
  // Search and filters
  searchPlaces: document.getElementById('searchPlaces'),
  categoryFilter: document.getElementById('categoryFilter'),
  statusFilter: document.getElementById('statusFilter'),
  
  // Containers
  placesGrid: document.getElementById('placesGrid'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebarOverlay'),
  
  // Modal elements
  placeModal: document.getElementById('placeModal'),
  placeModalTitle: document.getElementById('placeModalTitle'),
  placeForm: document.getElementById('placeForm'),
  deletePlaceModal: document.getElementById('deletePlaceModal'),
  deletePlaceName: document.getElementById('deletePlaceName'),
  
  // Form fields
  placeId: document.getElementById('placeId'),
  name_th: document.getElementById('name_th'),
  name_en: document.getElementById('name_en'),
  name_zh: document.getElementById('name_zh'),
  name_ja: document.getElementById('name_ja'),
  description_th: document.getElementById('description_th'),
  description_en: document.getElementById('description_en'),
  description_zh: document.getElementById('description_zh'),
  description_ja: document.getElementById('description_ja'),
  categoryId: document.getElementById('categoryId'),
  status: document.getElementById('status'),
  priceRange: document.getElementById('priceRange'),
  hours: document.getElementById('hours'),
  address: document.getElementById('address'),
  phone: document.getElementById('phone'),
  website: document.getElementById('website'),
  latitude: document.getElementById('latitude'),
  longitude: document.getElementById('longitude'),
  imageUpload: document.getElementById('imageUpload'),
  imagePreview: document.getElementById('imagePreview')
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Places page loaded with Webpack');
  
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
      console.log('Not authenticated, redirecting to login');
      window.location.href = 'index.html';
      return;
    }

    // Initialize page functionality
    initializePage();
  }, 100);
});

/**
 * Show page after CSS loads
 */
function showPage() {
  document.body.classList.add('loaded');
}

/**
 * Initialize the page
 */
function initializePage() {
  try {
    // Initialize Bootstrap modals
    placeModalInstance = new bootstrap.Modal(elements.placeModal);
    deletePlaceModalInstance = new bootstrap.Modal(elements.deletePlaceModal);
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadCategories();
    loadPlaces(); // This will call calculateStatsFromPlaces after loading
    loadPlacesStats(); // Load real stats from API
    
    // Update user info
    updateUserInfo();
  } catch (error) {
    console.error('Error initializing places page:', error);
    showNotification('เกิดข้อผิดพลาดในการโหลดหน้าเว็บ', 'error');
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Add place button
  elements.addPlaceBtn?.addEventListener('click', () => {
    openAddPlaceModal();
  });
  
  // Theme toggle
  const themeToggle = elements.themeToggle;
  themeToggle?.addEventListener('click', toggleTheme);
  
  // Mobile sidebar toggle
  elements.sidebarToggle?.addEventListener('click', () => {
    elements.sidebar?.classList.toggle('open');
    elements.sidebarOverlay?.classList.toggle('show');
  });
  
  elements.sidebarOverlay?.addEventListener('click', () => {
    elements.sidebar?.classList.remove('open');
    elements.sidebarOverlay?.classList.remove('show');
  });
  
  // Logout buttons
  const logoutBtn = document.getElementById('logoutBtn');
  const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
  logoutBtn?.addEventListener('click', handleLogout);
  sidebarLogoutBtn?.addEventListener('click', handleLogout);
  
  // View toggle
  elements.gridViewBtn?.addEventListener('click', () => setView('grid'));
  elements.listViewBtn?.addEventListener('click', () => setView('list'));
  
  // Search and filters
  elements.searchPlaces?.addEventListener('input', handleSearch);
  elements.categoryFilter?.addEventListener('change', handleFilter);
  elements.statusFilter?.addEventListener('change', handleFilter);
  
  // Form submission
  elements.placeForm?.addEventListener('submit', handlePlaceFormSubmit);
  
  // Delete confirmation
  elements.confirmDeleteBtn?.addEventListener('click', handleDeletePlace);
  
  // Language tabs
  const langTabs = document.querySelectorAll('.form-tab');
  langTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      switchLanguageTab(tab.dataset.lang);
    });
  });
  
  // Image upload
  elements.imageUpload?.addEventListener('change', handleImageUpload);
  
  // Modal reset on hide
  elements.placeModal?.addEventListener('hidden.bs.modal', () => {
    resetPlaceForm();
  });
}

/**
 * Update user info in UI
 */
function updateUserInfo() {
  if (window.auth && window.auth.getCurrentUser) {
    const user = window.auth.getCurrentUser();
    if (user) {
      const sidebarUserNameEl = document.getElementById('sidebarUserName');
      if (sidebarUserNameEl) {
        sidebarUserNameEl.textContent = user.username || 'Admin';
      }
    }
  }
}

/**
 * Load categories for dropdown
 */
async function loadCategories() {
  try {
    const response = await fetch('/api/admin/categories', {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    
    if (data.success) {
      categories = data.categories || data.data || [];
      populateCategoryDropdowns();
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

/**
 * Populate category dropdowns
 */
function populateCategoryDropdowns() {
  // Category filter dropdown
  elements.categoryFilter.innerHTML = '<option value="">ทุกหมวดหมู่</option>';
  
  // Category form dropdown
  elements.categoryId.innerHTML = '<option value="">เลือกหมวดหมู่</option>';
  
  categories.forEach(category => {
    const option1 = new Option(category.name.th, category.id);
    const option2 = new Option(category.name.th, category.id);
    elements.categoryFilter.add(option1);
    elements.categoryId.add(option2);
  });
}

/**
 * Load places stats
 */
async function loadPlacesStats() {
  try {
    const response = await fetch('/api/admin/places/stats', {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    
    if (data.success) {
      updateStats(data.stats || data);
    } else {
      // Calculate stats from loaded places as fallback
      calculateStatsFromPlaces();
    }
  } catch (error) {
    console.error('Error loading places stats:', error);
    // Calculate stats from loaded places as fallback
    calculateStatsFromPlaces();
  }
}

/**
 * Calculate stats from loaded places
 */
function calculateStatsFromPlaces() {
  if (places.length > 0) {
    const stats = {
      total: places.length,
      published: places.filter(p => p.status === 'published').length,
      draft: places.filter(p => p.status === 'draft').length,
      featured: places.filter(p => p.status === 'featured' || p.featured === true).length
    };
    updateStats(stats);
  } else {
    // Show default values
    updateStats({
      total: 0,
      published: 0,
      draft: 0,
      featured: 0
    });
  }
}

/**
 * Update stats display
 */
function updateStats(stats) {
  const totalEl = document.getElementById('totalPlaces');
  const publishedEl = document.getElementById('publishedPlaces');
  const draftEl = document.getElementById('draftPlaces');
  const featuredEl = document.getElementById('featuredPlaces');
  
  if (totalEl) totalEl.textContent = stats.total || 0;
  
  // Handle both formats (direct or nested in byStatus)
  if (publishedEl) {
    publishedEl.textContent = stats.published || stats.byStatus?.published || 0;
  }
  if (draftEl) {
    draftEl.textContent = stats.draft || stats.byStatus?.draft || 0;
  }
  if (featuredEl) {
    featuredEl.textContent = stats.featured || 0;
  }
}

/**
 * Load places from API
 */
async function loadPlaces() {
  try {
    showLoadingState();
    
    const response = await fetch('/api/admin/places', {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    
    if (data.success) {
      places = data.places || data.data || [];
      renderPlaces();
      calculateStatsFromPlaces(); // Update stats after loading places
    } else {
      showError('ไม่สามารถโหลดข้อมูลสถานที่ได้');
    }
  } catch (error) {
    console.error('Error loading places:', error);
    showError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
  } finally {
    hideLoadingState();
  }
}

/**
 * Render places based on current filters and view
 */
function renderPlaces() {
  const filteredPlaces = filterPlaces();
  
  if (filteredPlaces.length === 0) {
    showEmptyState();
    return;
  }
  
  hideEmptyState();
  
  if (currentView === 'grid') {
    renderGridView(filteredPlaces);
  } else {
    renderListView(filteredPlaces);
  }
  
  // Re-initialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

/**
 * Filter places based on search and filters
 */
function filterPlaces() {
  let filtered = [...places];
  
  // Search filter
  const searchTerm = elements.searchPlaces.value.toLowerCase().trim();
  if (searchTerm) {
    filtered = filtered.filter(place => {
      return (
        place.name.th.toLowerCase().includes(searchTerm) ||
        place.name.en?.toLowerCase().includes(searchTerm) ||
        place.description.th?.toLowerCase().includes(searchTerm) ||
        place.address?.toLowerCase().includes(searchTerm)
      );
    });
  }
  
  // Category filter
  const categoryId = elements.categoryFilter.value;
  if (categoryId) {
    filtered = filtered.filter(place => place.category === categoryId || place.categoryId === categoryId);
  }
  
  // Status filter
  const status = elements.statusFilter.value;
  if (status) {
    if (status === 'featured') {
      // Filter for featured places (either featured flag or status)
      filtered = filtered.filter(place => place.featured === true || place.status === 'featured');
    } else {
      filtered = filtered.filter(place => place.status === status);
    }
  }
  
  return filtered;
}

/**
 * Render grid view
 */
function renderGridView(places) {
  elements.placesGrid.innerHTML = places.map(place => {
    const category = categories.find(c => c.id === place.category || c.id === place.categoryId);
    const mainImage = place.images?.[0] || '';
    
    return `
      <div class="place-card">
        ${place.featured || place.status === 'featured' ? `
          <div class="featured-badge">
            <i data-lucide="star" style="width: 0.875rem; height: 0.875rem;"></i>
            แนะนำ
          </div>
        ` : ''}
        ${mainImage ? `
          <img src="${mainImage}" alt="${place.name.th}" class="place-image" />
        ` : `
          <div class="place-image" style="display: flex; align-items: center; justify-content: center;">
            <i data-lucide="image-off" style="width: 3rem; height: 3rem; color: hsl(var(--muted-foreground));"></i>
          </div>
        `}
        <div class="place-content">
          <div class="place-header">
            <h3 class="place-title">${place.name.th}</h3>
            <span class="place-status ${place.status}">${getStatusText(place.status)}</span>
          </div>
          ${category ? `
            <div class="place-category">
              <i data-lucide="tag" style="width: 0.875rem; height: 0.875rem;"></i>
              <span>${category.name.th}</span>
            </div>
          ` : ''}
          ${place.description.th ? `
            <p class="place-description">${place.description.th}</p>
          ` : ''}
          <div class="place-meta">
            ${place.priceRange ? `
              <span>
                <i data-lucide="banknote" style="width: 0.875rem; height: 0.875rem;"></i>
                ${place.priceRange}
              </span>
            ` : ''}
            ${place.hours ? `
              <span>
                <i data-lucide="clock" style="width: 0.875rem; height: 0.875rem;"></i>
                ${place.hours}
              </span>
            ` : ''}
          </div>
          <div class="place-actions">
            <button class="btn-shadcn ghost sm" onclick="viewPlace('${place.id}')">
              <i data-lucide="eye" style="width: 0.875rem; height: 0.875rem;"></i>
              ดู
            </button>
            <button class="btn-shadcn ghost sm" onclick="editPlace('${place.id}')">
              <i data-lucide="edit" style="width: 0.875rem; height: 0.875rem;"></i>
              แก้ไข
            </button>
            <button class="btn-shadcn ghost destructive sm" onclick="confirmDeletePlace('${place.id}', '${place.name.th}')">
              <i data-lucide="trash-2" style="width: 0.875rem; height: 0.875rem;"></i>
              ลบ
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render list view (not implemented yet)
 */
function renderListView(places) {
  // TODO: Implement list view
  renderGridView(places); // Fallback to grid view for now
}

/**
 * Get status text in Thai
 */
function getStatusText(status) {
  const statusMap = {
    'published': 'เผยแพร่',
    'draft': 'แบบร่าง',
    'featured': 'แนะนำ',
    'inactive': 'ไม่ใช้งาน'
  };
  return statusMap[status] || status;
}

/**
 * Open add place modal
 */
function openAddPlaceModal() {
  currentPlaceId = null;
  elements.placeModalTitle.textContent = 'เพิ่มสถานที่ใหม่';
  resetPlaceForm();
  placeModalInstance.show();
}

/**
 * Edit place
 */
window.editPlace = async function(placeId) {
  try {
    const response = await fetch(`/api/admin/places/${placeId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    
    if (data.success) {
      currentPlaceId = placeId;
      elements.placeModalTitle.textContent = 'แก้ไขสถานที่';
      populatePlaceForm(data.place || data.data);
      placeModalInstance.show();
    } else {
      showNotification('ไม่สามารถโหลดข้อมูลสถานที่ได้', 'error');
    }
  } catch (error) {
    console.error('Error loading place:', error);
    showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
  }
};

/**
 * View place (redirect to detail page)
 */
window.viewPlace = function(placeId) {
  // TODO: Implement view place detail
  window.editPlace(placeId); // For now, just edit
};

/**
 * Confirm delete place
 */
window.confirmDeletePlace = function(placeId, placeName) {
  currentPlaceId = placeId;
  elements.deletePlaceName.textContent = placeName;
  deletePlaceModalInstance.show();
};

/**
 * Handle delete place
 */
async function handleDeletePlace() {
  if (!currentPlaceId) {
    console.error('No place ID provided for deletion');
    return;
  }
  
  console.log(`Attempting to delete place with ID: ${currentPlaceId}`);
  
  try {
    const response = await fetch(`/api/admin/places/${currentPlaceId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    console.log(`Delete response status: ${response.status}`);
    
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.error('Delete error response:', errorData);
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Delete response data:', data);
    
    if (data.success) {
      showNotification('ลบสถานที่เรียบร้อยแล้ว', 'success');
      deletePlaceModalInstance.hide();
      loadPlaces();
    } else {
      console.error('Delete failed with response:', data);
      showNotification(data.message || 'ไม่สามารถลบสถานที่ได้', 'error');
    }
  } catch (error) {
    console.error('Error deleting place:', error);
    showNotification(`เกิดข้อผิดพลาดในการลบสถานที่: ${error.message}`, 'error');
  }
}

/**
 * Populate place form with data
 */
function populatePlaceForm(place) {
  elements.placeId.value = place.id;
  elements.name_th.value = place.name.th || '';
  elements.name_en.value = place.name.en || '';
  elements.name_zh.value = place.name.zh || '';
  elements.name_ja.value = place.name.ja || '';
  elements.description_th.value = place.description.th || '';
  elements.description_en.value = place.description.en || '';
  elements.description_zh.value = place.description.zh || '';
  elements.description_ja.value = place.description.ja || '';
  elements.categoryId.value = place.categoryId || place.category || '';
  elements.status.value = place.status || 'draft';
  elements.priceRange.value = place.priceRange || '';
  elements.hours.value = place.hours || '';
  
  // Handle contact information (support both flat and nested structure)
  const contact = place.contact || {};
  elements.address.value = place.address || contact.address || '';
  elements.phone.value = place.phone || contact.phone || '';
  elements.website.value = place.website || contact.website || '';
  elements.latitude.value = place.coordinates?.lat || contact.coordinates?.lat || '';
  elements.longitude.value = place.coordinates?.lng || contact.coordinates?.lng || '';
  
  // Show existing images
  if (place.images && place.images.length > 0) {
    elements.imagePreview.innerHTML = place.images.map((image, index) => `
      <div class="image-preview-item">
        <img src="${image}" alt="Image ${index + 1}" />
        <button type="button" onclick="removeImage(${index})">
          <i data-lucide="x" style="width: 1rem; height: 1rem;"></i>
        </button>
      </div>
    `).join('');
    
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

/**
 * Reset place form
 */
function resetPlaceForm() {
  elements.placeForm.reset();
  elements.placeId.value = '';
  elements.imagePreview.innerHTML = '';
  switchLanguageTab('th');
}

/**
 * Switch language tab
 */
function switchLanguageTab(lang) {
  // Update tab buttons
  document.querySelectorAll('.form-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.lang === lang);
  });
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${lang}`);
  });
}

/**
 * Handle place form submission
 */
async function handlePlaceFormSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData();
  
  // Collect form data
  const placeData = {
    name: {
      th: elements.name_th.value,
      en: elements.name_en.value || undefined,
      zh: elements.name_zh.value || undefined,
      ja: elements.name_ja.value || undefined
    },
    description: {
      th: elements.description_th.value || undefined,
      en: elements.description_en.value || undefined,
      zh: elements.description_zh.value || undefined,
      ja: elements.description_ja.value || undefined
    },
    categoryId: elements.categoryId.value,
    status: elements.status.value,
    priceRange: elements.priceRange.value || undefined,
    hours: elements.hours.value || undefined,
    address: elements.address.value || undefined,
    phone: elements.phone.value || undefined,
    website: elements.website.value || undefined,
    coordinates: {
      lat: parseFloat(elements.latitude.value) || undefined,
      lng: parseFloat(elements.longitude.value) || undefined
    }
  };
  
  // Remove undefined coordinates if both are missing
  if (!placeData.coordinates.lat && !placeData.coordinates.lng) {
    delete placeData.coordinates;
  }
  
  formData.append('data', JSON.stringify(placeData));
  
  // Add images if any
  const files = elements.imageUpload.files;
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }
  
  try {
    const url = currentPlaceId 
      ? `/api/admin/places/${currentPlaceId}`
      : '/api/admin/places';
    
    const method = currentPlaceId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: getAuthHeaders(true), // true = skip content-type for FormData
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification(
        currentPlaceId ? 'แก้ไขสถานที่เรียบร้อยแล้ว' : 'เพิ่มสถานที่เรียบร้อยแล้ว',
        'success'
      );
      placeModalInstance.hide();
      loadPlaces();
    } else {
      showNotification(data.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    }
  } catch (error) {
    console.error('Error saving place:', error);
    showNotification('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
  }
}

/**
 * Handle image upload preview
 */
function handleImageUpload(e) {
  const files = e.target.files;
  const preview = elements.imagePreview;
  
  // Clear existing preview
  preview.innerHTML = '';
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="${file.name}" />
        <button type="button" onclick="removeNewImage(${i})">
          <i data-lucide="x" style="width: 1rem; height: 1rem;"></i>
        </button>
      `;
      preview.appendChild(div);
      
      // Re-initialize icons
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    };
    
    reader.readAsDataURL(file);
  }
}

/**
 * Remove new image from upload
 */
window.removeNewImage = function(index) {
  // This is a simplified version - in production, you'd need to properly manage the FileList
  const preview = elements.imagePreview;
  const items = preview.querySelectorAll('.image-preview-item');
  if (items[index]) {
    items[index].remove();
  }
};

/**
 * Remove existing image
 */
window.removeImage = function(index) {
  // TODO: Implement remove existing image
  console.log('Remove image at index:', index);
};

/**
 * Handle search
 */
function handleSearch() {
  renderPlaces();
}

/**
 * Handle filter change
 */
function handleFilter() {
  renderPlaces();
}

/**
 * Set view mode
 */
function setView(view) {
  currentView = view;
  
  // Update button states
  elements.gridViewBtn.classList.toggle('active', view === 'grid');
  elements.listViewBtn.classList.toggle('active', view === 'list');
  
  // Update grid class
  elements.placesGrid.className = view === 'grid' ? 'places-grid' : 'places-list';
  
  renderPlaces();
}

/**
 * Show loading state
 */
function showLoadingState() {
  elements.placesGrid.innerHTML = `
    <div class="text-center" style="grid-column: 1 / -1; padding: 4rem 2rem;">
      <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
      <p style="color: hsl(var(--muted-foreground));">กำลังโหลดข้อมูล...</p>
    </div>
  `;
}

/**
 * Hide loading state
 */
function hideLoadingState() {
  // Loading state is replaced by actual content
}

/**
 * Show empty state
 */
function showEmptyState() {
  elements.placesGrid.innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
      <i data-lucide="map-pin-off" style="width: 4rem; height: 4rem; color: hsl(var(--muted-foreground)); margin: 0 auto 1rem;"></i>
      <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">ไม่พบสถานที่ท่องเที่ยว</h3>
      <p style="color: hsl(var(--muted-foreground)); margin-bottom: 1.5rem;">เริ่มต้นด้วยการเพิ่มสถานที่ท่องเที่ยวแรกของคุณ</p>
      <button class="btn-shadcn default" onclick="document.getElementById('addPlaceBtn').click()">
        <i data-lucide="plus" style="width: 1rem; height: 1rem"></i>
        เพิ่มสถานที่แรก
      </button>
    </div>
  `;
  
  // Re-initialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

/**
 * Hide empty state
 */
function hideEmptyState() {
  // Empty state is replaced by actual content
}

/**
 * Show error message
 */
function showError(message) {
  elements.placesGrid.innerHTML = `
    <div class="text-center" style="grid-column: 1 / -1; padding: 2rem;">
      <i data-lucide="alert-circle" style="width: 3rem; height: 3rem; color: hsl(var(--destructive)); margin-bottom: 1rem;"></i>
      <p style="color: hsl(var(--muted-foreground));">${message}</p>
    </div>
  `;
  
  // Re-initialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

/**
 * Toggle theme
 */
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon();
}

/**
 * Update theme icon
 */
function updateThemeIcon() {
  const html = document.documentElement;
  const theme = html.getAttribute('data-theme');
  const lightIcon = document.querySelector('.theme-icon-light');
  const darkIcon = document.querySelector('.theme-icon-dark');
  
  if (theme === 'dark') {
    lightIcon.style.display = 'none';
    darkIcon.style.display = 'block';
  } else {
    lightIcon.style.display = 'block';
    darkIcon.style.display = 'none';
  }
}

/**
 * Get auth headers
 */
function getAuthHeaders(skipContentType = false) {
  const headers = {};
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('Using auth token for request (truncated):', token.substring(0, 20) + '...');
  } else {
    console.warn('No auth token found!');
  }
  
  if (!skipContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
}

/**
 * Get auth token from localStorage
 */
function getAuthToken() {
  return localStorage.getItem('auth_token') || localStorage.getItem('auth_access_token');
}

/**
 * Handle logout
 */
async function handleLogout(e) {
  e.preventDefault();
  
  if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
    // Clear auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_access_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
    
    // Redirect to login
    window.location.href = 'index.html';
  }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  // Enhanced notification system
  const prefix = type === 'success' ? '✅ ' : type === 'error' ? '❌ ' : 'ℹ️ ';
  const fullMessage = prefix + message;
  
  // Log to console for debugging
  if (type === 'error') {
    console.error('Notification Error:', message);
  } else if (type === 'success') {
    console.log('Notification Success:', message);
  } else {
    console.info('Notification Info:', message);
  }
  
  alert(fullMessage);
  
  // TODO: Replace with a better toast notification system
}

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// Initialize theme icon on page load
setTimeout(() => {
  updateThemeIcon();
}, 100);