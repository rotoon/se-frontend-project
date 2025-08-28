/**
 * Categories Management JavaScript
 * จัดการระบบหมวดหมู่สถานที่ท่องเที่ยว
 */

// Import config first
import './config.js';
import './auth.js';
import './api.js';
import './components.js';
import './utils.js';

// Import CSS
import '../css/shadcn-admin.css';

// Global variables
let categories = [];
let currentCategory = null;
let isLoading = false;

// DOM Elements
const elements = {
  // Stats
  totalCategories: document.getElementById("totalCategories"),
  categoriesWithPlaces: document.getElementById("categoriesWithPlaces"),
  totalPlacesInCategories: document.getElementById("totalPlacesInCategories"),

  // Table
  categoriesTableBody: document.getElementById("categoriesTableBody"),
  searchCategories: document.getElementById("searchCategories"),

  // Buttons
  addCategoryBtn: document.getElementById("addCategoryBtn"),

  // Modal
  categoryModal: document.getElementById("categoryModal"),
  categoryModalLabel: document.getElementById("categoryModalLabel"),
  categoryForm: document.getElementById("categoryForm"),
  submitBtnText: document.getElementById("submitBtnText"),
  submitLoading: document.getElementById("submitLoading"),

  // Delete Modal
  deleteCategoryModal: document.getElementById("deleteCategoryModal"),
  deleteCategoryName: document.getElementById("deleteCategoryName"),
  deleteCategoryPlacesCount: document.getElementById(
    "deleteCategoryPlacesCount"
  ),
  confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),
  deleteBtnText: document.getElementById("deleteBtnText"),
  deleteLoading: document.getElementById("deleteLoading"),

  // Form fields
  categoryNameTh: document.getElementById("categoryNameTh"),
  categoryNameEn: document.getElementById("categoryNameEn"),
  categoryNameZh: document.getElementById("categoryNameZh"),
  categoryNameJa: document.getElementById("categoryNameJa"),
  categoryIcon: document.getElementById("categoryIcon"),
  categoryOrder: document.getElementById("categoryOrder"),

  // Icon selector
  iconSelectorButton: document.getElementById("iconSelectorButton"),
  iconDropdown: document.getElementById("iconDropdown"),
  selectedIconPreview: document.getElementById("selectedIconPreview"),
  selectedIconText: document.getElementById("selectedIconText"),
};

// Bootstrap Modal instances
let categoryModalInstance;
let deleteCategoryModalInstance;

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializePage();
});

/**
 * Initialize the page
 */
function initializePage() {
  try {
    // Initialize Bootstrap modals
    categoryModalInstance = new bootstrap.Modal(elements.categoryModal);
    deleteCategoryModalInstance = new bootstrap.Modal(
      elements.deleteCategoryModal
    );

    // Set up event listeners
    setupEventListeners();

    // Load initial data
    loadCategoriesData();
    loadCategoriesStats();

    // Set page as loaded
    setTimeout(() => {
      document.body.classList.add("loaded");
    }, 300);
  } catch (error) {
    console.error("Error initializing categories page:", error);
    showNotification("เกิดข้อผิดพลาดในการโหลดหน้าเว็บ", "error");
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Add category button
  elements.addCategoryBtn?.addEventListener("click", () => {
    openAddCategoryModal();
  });

  // Category form submission
  elements.categoryForm?.addEventListener("submit", handleCategoryFormSubmit);

  // Search categories
  elements.searchCategories?.addEventListener("input", handleCategorySearch);

  // Delete confirmation
  elements.confirmDeleteBtn?.addEventListener("click", handleDeleteCategory);

  // Modal reset on hide
  elements.categoryModal?.addEventListener(
    "hidden.bs.modal",
    resetCategoryForm
  );

  // Icon selector
  setupIconSelector();

  // Theme toggle
  const themeToggle = document.getElementById("themeToggle");
  themeToggle?.addEventListener("click", toggleTheme);

  // Sidebar toggle for mobile
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const sidebar = document.getElementById("sidebar");

  sidebarToggle?.addEventListener("click", () => {
    sidebar?.classList.toggle("open");
    sidebarOverlay?.classList.toggle("show");
  });

  sidebarOverlay?.addEventListener("click", () => {
    sidebar?.classList.remove("open");
    sidebarOverlay?.classList.remove("show");
  });

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");
  logoutBtn?.addEventListener("click", handleLogout);
  sidebarLogoutBtn?.addEventListener("click", handleLogout);
}

/**
 * Load categories data from API
 */
async function loadCategoriesData() {
  try {
    isLoading = true;
    showLoadingState();

    const token = getAuthToken();
    if (!token) {
      redirectToLogin();
      return;
    }

    const response = await fetch(window.appConfig.getAPIURL("/api/admin/categories"), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      redirectToLogin();
      return;
    }

    const data = await response.json();

    if (data.success) {
      categories = data.categories || [];
      renderCategoriesTable();
    } else {
      throw new Error(data.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลหมวดหมู่");
    }
  } catch (error) {
    console.error("Error loading categories:", error);
    showNotification("เกิดข้อผิดพลาดในการโหลดข้อมูลหมวดหมู่", "error");
    showEmptyState("เกิดข้อผิดพลาดในการโหลดข้อมูล");
  } finally {
    isLoading = false;
  }
}

/**
 * Load categories statistics
 */
async function loadCategoriesStats() {
  try {
    const token = getAuthToken();

    if (!token) return;

    const response = await fetch(window.appConfig.getAPIURL("/api/admin/categories/stats"), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.stats) {
        updateStatsDisplay(data.stats);
      }
    }
  } catch (error) {
    console.error("Error loading categories stats:", error);
  }
}

/**
 * Update stats display
 */
function updateStatsDisplay(stats) {
  if (elements.totalCategories) {
    elements.totalCategories.textContent = stats.totalCategories || 0;
  }
  if (elements.categoriesWithPlaces) {
    elements.categoriesWithPlaces.textContent = stats.categoriesWithPlaces || 0;
  }
  if (elements.totalPlacesInCategories) {
    elements.totalPlacesInCategories.textContent =
      stats.totalPlacesInCategories || 0;
  }
}

/**
 * Render categories table
 */
function renderCategoriesTable() {
  if (!elements.categoriesTableBody) return;

  if (categories.length === 0) {
    showEmptyState("ยังไม่มีหมวดหมู่ในระบบ");
    return;
  }

  const html = categories
    .map((category) => createCategoryRowHTML(category))
    .join("");
  elements.categoriesTableBody.innerHTML = html;

  // Re-initialize Lucide icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

/**
 * Create category row HTML
 */
function createCategoryRowHTML(category) {
  const placesCount = category.placesCount || 0;
  const iconName = category.icon || "folder";

  return `
        <div class="category-row">
            <div class="category-info">
                <div class="category-icon">
                    <i data-lucide="${iconName}" style="width: 1rem; height: 1rem;"></i>
                </div>
                <div class="category-details">
                    <h4>${escapeHtml(category.name.th)}</h4>
                    <p>${
                      category.name.en
                        ? escapeHtml(category.name.en)
                        : "ไม่มีชื่อภาษาอังกฤษ"
                    }</p>
                </div>
            </div>
            
            <div class="category-meta">
                <span><i data-lucide="map-pin" style="width: 0.875rem; height: 0.875rem; margin-right: 0.25rem;"></i>${placesCount} สถานที่</span>
                <span><i data-lucide="hash" style="width: 0.875rem; height: 0.875rem; margin-right: 0.25rem;"></i>ลำดับ ${
                  category.order || 0
                }</span>
            </div>
            
            <div class="category-actions">
                <button class="btn-shadcn ghost icon" onclick="openEditCategoryModal('${
                  category.id
                }')" title="แก้ไข">
                    <i data-lucide="edit" style="width: 1rem; height: 1rem;"></i>
                </button>
                <button class="btn-shadcn ghost icon" onclick="openDeleteCategoryModal('${
                  category.id
                }')" title="ลบ">
                    <i data-lucide="trash" style="width: 1rem; height: 1rem;"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Show loading state
 */
function showLoadingState() {
  if (elements.categoriesTableBody) {
    elements.categoriesTableBody.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <div class="loading-shadcn" style="width: 2rem; height: 2rem;"></div>
                </div>
                <h4>กำลังโหลดข้อมูล...</h4>
                <p>กรุณารอสักครู่</p>
            </div>
        `;
  }
}

/**
 * Show empty state
 */
function showEmptyState(message = "ยังไม่มีข้อมูล") {
  if (elements.categoriesTableBody) {
    elements.categoriesTableBody.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i data-lucide="folder-x" style="width: 2rem; height: 2rem;"></i>
                </div>
                <h4>${escapeHtml(message)}</h4>
                <p>เริ่มต้นโดยการเพิ่มหมวดหมู่แรก</p>
                <button class="btn-shadcn default" onclick="openAddCategoryModal()">
                    <i data-lucide="plus" style="width: 1rem; height: 1rem;"></i>
                    เพิ่มหมวดหมู่ใหม่
                </button>
            </div>
        `;

    // Re-initialize Lucide icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }
}

/**
 * Handle category search
 */
function handleCategorySearch(event) {
  const searchTerm = event.target.value.toLowerCase().trim();

  if (!searchTerm) {
    renderCategoriesTable();
    return;
  }

  const filteredCategories = categories.filter((category) => {
    return (
      category.name.th.toLowerCase().includes(searchTerm) ||
      category.name.en.toLowerCase().includes(searchTerm) ||
      category.name.zh.toLowerCase().includes(searchTerm) ||
      category.name.ja.toLowerCase().includes(searchTerm)
    );
  });

  if (filteredCategories.length === 0) {
    showEmptyState(`ไม่พบหมวดหมู่ที่ตรงกับ "${searchTerm}"`);
    return;
  }

  const html = filteredCategories
    .map((category) => createCategoryRowHTML(category))
    .join("");
  elements.categoriesTableBody.innerHTML = html;

  // Re-initialize Lucide icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

/**
 * Open add category modal
 */
function openAddCategoryModal() {
  currentCategory = null;
  resetCategoryForm();
  elements.categoryModalLabel.textContent = "เพิ่มหมวดหมู่ใหม่";
  elements.submitBtnText.textContent = "เพิ่มหมวดหมู่";
  categoryModalInstance.show();
}

/**
 * Open edit category modal
 */
window.openEditCategoryModal = function(categoryId) {
  const category = categories.find((c) => c.id === categoryId);
  if (!category) {
    showNotification("ไม่พบหมวดหมู่ที่ต้องการแก้ไข", "error");
    return;
  }

  currentCategory = category;
  populateCategoryForm(category);
  elements.categoryModalLabel.textContent = "แก้ไขหมวดหมู่";
  elements.submitBtnText.textContent = "บันทึกการเปลี่ยนแปลง";
  categoryModalInstance.show();
};

/**
 * Reset category form
 */
function resetCategoryForm() {
  elements.categoryForm?.reset();
  currentCategory = null;
  
  // Reset icon selector
  selectIcon('folder', 'เลือกไอคอน');
}

/**
 * Populate category form with data
 */
function populateCategoryForm(category) {
  elements.categoryNameTh.value = category.name.th || "";
  elements.categoryNameEn.value = category.name.en || "";
  elements.categoryNameZh.value = category.name.zh || "";
  elements.categoryNameJa.value = category.name.ja || "";
  elements.categoryIcon.value = category.icon || "";
  elements.categoryOrder.value = category.order || "";
  
  // Update icon selector
  if (category.icon) {
    const iconOption = document.querySelector(`.icon-option[data-icon="${category.icon}"]`);
    const iconText = iconOption ? iconOption.querySelector('span').textContent : category.icon;
    selectIcon(category.icon, iconText);
  }
}

/**
 * Setup icon selector functionality
 */
function setupIconSelector() {
  // Toggle dropdown
  elements.iconSelectorButton?.addEventListener('click', (e) => {
    e.preventDefault();
    elements.iconDropdown?.classList.toggle('show');
  });

  // Handle icon selection
  const iconOptions = document.querySelectorAll('.icon-option');
  iconOptions.forEach(option => {
    option.addEventListener('click', () => {
      const iconName = option.dataset.icon;
      const iconText = option.querySelector('span').textContent;
      
      // Update selected icon
      selectIcon(iconName, iconText);
      
      // Close dropdown
      elements.iconDropdown?.classList.remove('show');
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.icon-selector')) {
      elements.iconDropdown?.classList.remove('show');
    }
  });
}

/**
 * Select an icon
 */
function selectIcon(iconName, iconText) {
  // Update hidden input value
  if (elements.categoryIcon) {
    elements.categoryIcon.value = iconName;
    // Also update the actual input attribute to ensure it's changed
    elements.categoryIcon.setAttribute('value', iconName);
    
    // Trigger change event to notify form
    const event = new Event('change', { bubbles: true });
    elements.categoryIcon.dispatchEvent(event);
    
    // Debug log
  }
  
  // Update preview
  if (elements.selectedIconPreview) {
    elements.selectedIconPreview.setAttribute('data-lucide', iconName);
  }
  
  if (elements.selectedIconText) {
    elements.selectedIconText.textContent = iconText || iconName;
  }
  
  // Re-initialize lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Update selected state
  document.querySelectorAll('.icon-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.icon === iconName);
  });
}

/**
 * Handle category form submission
 */
async function handleCategoryFormSubmit(event) {
  event.preventDefault();

  if (isLoading) return;

  try {
    // Show loading state
    isLoading = true;
    elements.submitBtnText.classList.add("d-none");
    elements.submitLoading.classList.remove("d-none");

    // Get form data
    const formData = new FormData(elements.categoryForm);
    
    // Debug: Log icon value before submission
    
    const categoryData = {
      name: {
        th: formData.get("nameTh").trim(),
        en: formData.get("nameEn").trim(),
        zh: formData.get("nameZh").trim(),
        ja: formData.get("nameJa").trim(),
      },
      icon: formData.get("icon").trim(),
      order: formData.get("order") ? parseInt(formData.get("order")) : null,
    };

    // Validate required fields
    if (!categoryData.name.th) {
      showNotification("กรุณากรอกชื่อหมวดหมู่ภาษาไทย", "error");
      return;
    }

    if (!categoryData.icon) {
      showNotification("กรุณาเลือกไอคอน", "error");
      return;
    }

    // Send request
    const token = getAuthToken();
    if (!token) {
      redirectToLogin();
      return;
    }

    const url = currentCategory
      ? `/api/admin/categories/${currentCategory.id}`
      : "/api/admin/categories";
    const method = currentCategory ? "PUT" : "POST";

    const response = await fetch(window.appConfig.getAPIURL(url), {
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(categoryData),
    });

    const data = await response.json();

    if (data.success) {
      const message = currentCategory
        ? "แก้ไขหมวดหมู่สำเร็จ"
        : "เพิ่มหมวดหมู่สำเร็จ";

      showNotification(message, "success");
      categoryModalInstance.hide();

      // Reload data
      await loadCategoriesData();
      await loadCategoriesStats();
    } else {
      showNotification(
        data.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        "error"
      );
    }
  } catch (error) {
    console.error("Error saving category:", error);
    showNotification("เกิดข้อผิดพลาดในการบันทึกข้อมูล", "error");
  } finally {
    // Reset loading state
    isLoading = false;
    elements.submitBtnText.classList.remove("d-none");
    elements.submitLoading.classList.add("d-none");
  }
}

/**
 * Open delete category modal
 */
window.openDeleteCategoryModal = function(categoryId) {
  const category = categories.find((c) => c.id === categoryId);
  if (!category) {
    showNotification("ไม่พบหมวดหมู่ที่ต้องการลบ", "error");
    return;
  }

  currentCategory = category;
  elements.deleteCategoryName.textContent = category.name.th;
  elements.deleteCategoryPlacesCount.textContent = category.placesCount || 0;

  deleteCategoryModalInstance.show();
}

/**
 * Handle delete category
 */
async function handleDeleteCategory() {
  if (!currentCategory || isLoading) return;

  try {
    // Show loading state
    isLoading = true;
    elements.deleteBtnText.classList.add("d-none");
    elements.deleteLoading.classList.remove("d-none");

    const token = getAuthToken();
    if (!token) {
      redirectToLogin();
      return;
    }

    const response = await fetch(
      window.appConfig.getAPIURL(`/api/admin/categories/${currentCategory.id}`),
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      showNotification("ลบหมวดหมู่สำเร็จ", "success");
      deleteCategoryModalInstance.hide();

      // Reload data
      await loadCategoriesData();
      await loadCategoriesStats();
    } else {
      showNotification(
        data.message || "เกิดข้อผิดพลาดในการลบหมวดหมู่",
        "error"
      );
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    showNotification("เกิดข้อผิดพลาดในการลบหมวดหมู่", "error");
  } finally {
    // Reset loading state
    isLoading = false;
    elements.deleteBtnText.classList.remove("d-none");
    elements.deleteLoading.classList.add("d-none");
    currentCategory = null;
  }
}

/**
 * Utility Functions
 */

/**
 * Get auth token from localStorage
 */
function getAuthToken() {
  // ตรวจสอบทั้ง 2 key เพื่อรองรับทั้ง login.js และ AuthManager
  return localStorage.getItem("auth_token") || localStorage.getItem("auth_access_token");
}

/**
 * Redirect to login page
 */
function redirectToLogin() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_access_token");
  localStorage.removeItem("auth_refresh_token");
  localStorage.removeItem("auth_user");
  window.location.href = "index.html";
}

/**
 * Handle logout
 */
function handleLogout() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_access_token");
  localStorage.removeItem("auth_refresh_token");
  localStorage.removeItem("auth_user");
  window.location.href = "index.html";
}

/**
 * Toggle theme
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  // Update theme icons
  const lightIcon = document.querySelector(".theme-icon-light");
  const darkIcon = document.querySelector(".theme-icon-dark");

  if (newTheme === "dark") {
    lightIcon?.style.setProperty("display", "none");
    darkIcon?.style.setProperty("display", "block");
  } else {
    lightIcon?.style.setProperty("display", "block");
    darkIcon?.style.setProperty("display", "none");
  }
}

/**
 * Show notification
 */
function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `alert-shadcn ${
    type === "error" ? "destructive" : "default"
  }`;
  notification.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 9999;
        min-width: 300px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease-in-out;
    `;

  const icon =
    type === "error"
      ? "alert-circle"
      : type === "success"
      ? "check-circle"
      : "info";

  notification.innerHTML = `
        <i data-lucide="${icon}" style="width: 1rem; height: 1rem; margin-right: 0.5rem;"></i>
        ${escapeHtml(message)}
    `;

  document.body.appendChild(notification);

  // Initialize Lucide icon
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  // Show notification
  setTimeout(() => {
    notification.style.opacity = "1";
    notification.style.transform = "translateX(0)";
  }, 100);

  // Hide notification after 5 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(100%)";

    // Remove from DOM
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Initialize theme from localStorage
 */
function initializeTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  const lightIcon = document.querySelector(".theme-icon-light");
  const darkIcon = document.querySelector(".theme-icon-dark");

  if (savedTheme === "dark") {
    lightIcon?.style.setProperty("display", "none");
    darkIcon?.style.setProperty("display", "block");
  } else {
    lightIcon?.style.setProperty("display", "block");
    darkIcon?.style.setProperty("display", "none");
  }
}

// Initialize theme when script loads
initializeTheme();

// Check URL parameters for actions
document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get("action");

  if (action === "create") {
    setTimeout(() => {
      openAddCategoryModal();
    }, 500);
  }
});
