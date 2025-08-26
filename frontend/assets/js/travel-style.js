// Travel Style Page JavaScript
import { CategoriesAPI } from "./modules/categories-api.js";
import { LanguageManager } from "./modules/language.js";

class TravelStylePage {
  constructor() {
    this.categories = [];
    this.currentLanguage = "en";
    this.init();
  }

  async init() {
    try {
      // Initialize language
      this.currentLanguage = LanguageManager.getCurrentLanguage();

      // Load categories
      await this.loadCategories();

      // Render categories
      this.renderCategories();

      // Update stats
      this.updateStats();

      // Hide loading and show content
      this.hideLoading();
    } catch (error) {
      console.error("Error initializing travel style page:", error);
      this.showError();
    }
  }

  async loadCategories() {
    const response = await CategoriesAPI.getCategories();
    if (response.success) {
      this.categories = response.data.sort((a, b) => a.order - b.order);
    } else {
      throw new Error("Failed to load categories");
    }
  }

  renderCategories() {
    const grid = document.getElementById("categoriesGrid");
    if (!grid) return;

    // Take first 6 categories for bento grid
    const categories = this.categories;
    let html = "";

    categories.forEach((category, index) => {
      const categoryName = this.getCategoryName(category);
      const placesCount = category.placesCount || 0;
      const icon = category.icon
        ? `fas fa-${category.icon}`
        : "fas fa-map-marker-alt";

      // Get image for category
      const imageUrl = this.getCategoryBackground(category, index);

      // Different layouts for different positions (same as main.js)
      if (index === 0) {
        // Large item (first category)
        html += `
                    <div class="col-md-8">
                        <div class="bento-item bento-tall" 
                             style="background-image: url('${imageUrl}')"
                             onclick="goToCategory('${
                               category.slug || category.id
                             }')" 
                             role="button" 
                             tabindex="0">
                            <div class="card-overlay"></div>
                            <div class="card-content">
                                <div class="category-icon"><i class="${icon}"></i></div>
                                <h4>${categoryName}</h4>
                            </div>
                        </div>
                    </div>
                `;

        // Start right column for small items
        html += '<div class="col-md-4"><div class="row g-4">';
      } else if (index === 1 || index === 2) {
        // Small items (second and third categories)
        html += `
                    <div class="col-12">
                        <div class="bento-item" 
                             style="background-image: url('${imageUrl}')"
                             onclick="goToCategory('${
                               category.slug || category.id
                             }')" 
                             role="button" 
                             tabindex="0">
                            <div class="card-overlay"></div>
                            <div class="card-content">
                                <div class="category-icon"><i class="${icon}"></i></div>
                                <h4>${categoryName}</h4>
                            </div>
                        </div>
                    </div>
                `;

        // Close right column after second small item
        if (index === 2) {
          html += "</div></div>";
        }
      } else if (index >= 3) {
        // Medium items (remaining categories)
        html += `
                    <div class="col-md-4">
                        <div class="bento-item" 
                             style="background-image: url('${imageUrl}')"
                             onclick="goToCategory('${
                               category.slug || category.id
                             }')" 
                             role="button" 
                             tabindex="0">
                            <div class="card-overlay"></div>
                            <div class="card-content">
                                <div class="category-icon"><i class="${icon}"></i></div>
                                <h4>${categoryName}</h4>
                            </div>
                        </div>
                    </div>
                `;
      }
    });

    grid.innerHTML = html;
  }

  getCategoryBackground(category, index) {
    // Map categories to background images (same as main.js)
    const categoryImages = {
      restaurant:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      cafe: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      "77021e0c-0af3-4058-8701-9b9db6d42756":
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", // Cafe by ID
      attraction:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      activity:
        "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?ixlib=rb-4.0.3&auto=format&fit=crop&w=2126&q=80",
      accommodation:
        "https://images.unsplash.com/photo-1551717309-88444dbe54f5?q=80&w=2670&auto=format&fit=crop",
      shopping:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      temple:
        "https://images.unsplash.com/photo-1605106715994-18d3fecffb98?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      nature:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      spa: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      nightlife:
        "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      "art-culture":
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      market:
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80",
      default:
        "https://images.unsplash.com/photo-1552550049-db097c9480d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80",
    };

    // Get image for category
    return (
      categoryImages[category.slug] ||
      categoryImages[category.id] ||
      categoryImages.default
    );
  }

  getCategoryName(category) {
    if (category.name && typeof category.name === "object") {
      return (
        category.name[this.currentLanguage] ||
        category.name.en ||
        category.name.th ||
        "Unknown"
      );
    }
    return category.name || "Unknown";
  }

  updateStats() {
    const totalPlacesEl = document.getElementById("totalPlaces");
    const totalCategoriesEl = document.getElementById("totalCategories");

    if (totalPlacesEl) {
      const totalPlaces = this.categories.reduce(
        (sum, cat) => sum + (cat.placesCount || 0),
        0
      );
      totalPlacesEl.textContent = totalPlaces;
    }

    if (totalCategoriesEl) {
      totalCategoriesEl.textContent = this.categories.length;
    }
  }

  hideLoading() {
    const loadingSection = document.getElementById("loadingSection");
    const categoriesSection = document.getElementById("categoriesGrid");
    const statsSection = document.getElementById("statsSection");

    if (loadingSection) {
      loadingSection.style.display = "none";
    }

    if (categoriesSection) {
      categoriesSection.style.display = "flex";
    }

    if (statsSection) {
      statsSection.style.display = "block";
    }
  }

  showError() {
    const loadingSection = document.getElementById("loadingSection");
    const categoriesSection = document.getElementById("categoriesGrid");

    if (loadingSection) {
      loadingSection.innerHTML = `
                <div class="col-12 text-center">
                    <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
                    <h3>Something went wrong</h3>
                    <p class="text-muted">Unable to load data. Please try again.</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-redo me-2"></i>Try Again
                    </button>
                </div>
            `;
    }

    if (categoriesSection) {
      categoriesSection.style.display = "none";
    }
  }
}

// Navigation functions
function goToCategory(categorySlug) {
  window.location.href = `places/index.html?category=${categorySlug}`;
}

// Make goToCategory globally available
window.goToCategory = goToCategory;

// Initialize page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new TravelStylePage();
});

export default TravelStylePage;
