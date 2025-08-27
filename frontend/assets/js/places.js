// Places Page JavaScript
import { CategoriesAPI } from "./modules/categories-api.js";
import { LanguageManager } from "./modules/language.js";
import { PlacesAPI } from "./modules/places-api.js";
import { Utils } from "./modules/utils.js";

class PlacesPage {
  constructor() {
    this.places = [];
    this.filteredPlaces = [];
    this.currentCategory = null;
    this.currentLanguage = "en";
    this.currentPage = 1;
    this.placesPerPage = 12;
    this.init();
  }

  async init() {
    try {
      // Initialize language
      this.currentLanguage = LanguageManager.getCurrentLanguage();

      // Get category from URL
      this.currentCategory = this.getCategoryFromURL();

      // Load category data
      if (this.currentCategory) {
        await this.loadCategoryData();
      }

      // Load places
      await this.loadPlaces();

      // Setup event listeners
      this.setupEventListeners();

      // Render places
      this.renderPlaces();

      // Hide loading and show content
      this.hideLoading();
    } catch (error) {
      console.error("Error initializing places page:", error);
      this.showError();
    }
  }

  getCategoryFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("category");
  }

  async loadCategoryData() {
    if (!this.currentCategory) {
      throw new Error("No category specified");
    }

    const response = await CategoriesAPI.getCategories();
    if (response.success) {
      const category = response.data.find(
        (cat) =>
          cat.slug === this.currentCategory || cat.id === this.currentCategory
      );

      if (category) {
        this.updatePageHeader(category);
      } else {
        throw new Error("Category not found");
      }
    } else {
      throw new Error("Failed to load category data");
    }
  }

  updatePageHeader(category) {
    const categoryName = this.getCategoryName(category);
    const icon = category.icon
      ? `fas fa-${category.icon}`
      : "fas fa-map-marker-alt";

    // Update title
    document.title = `${categoryName} Places - Go Chiang Mai`;
    document.getElementById(
      "categoryTitle"
    ).innerHTML = `<i class="${icon} me-3"></i>${categoryName}`;

    // Update breadcrumb
    document.getElementById("categoryBreadcrumb").textContent = categoryName;

    // Update description
    document.getElementById(
      "categoryDescription"
    ).textContent = `Discover the best ${categoryName.toLowerCase()} places in Chiang Mai`;
  }

  async loadPlaces() {
    const response = await PlacesAPI.getPlaces({
      category: this.currentCategory ?? "",
    });
    if (response.success) {
      this.places = response.data;
      this.filteredPlaces = [...this.places];
    } else {
      throw new Error("Failed to load places");
    }
  }

  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", (e) => {
      this.filterPlaces(e.target.value);
    });

    // Sort select
    const sortSelect = document.getElementById("sortSelect");
    sortSelect.addEventListener("change", (e) => {
      this.sortPlaces(e.target.value);
    });
  }

  filterPlaces(searchTerm) {
    if (!searchTerm.trim()) {
      this.filteredPlaces = [...this.places];
    } else {
      this.filteredPlaces = this.places.filter((place) => {
        const placeName = this.getPlaceName(place).toLowerCase();
        const placeDescription = this.getPlaceDescription(place).toLowerCase();
        const search = searchTerm.toLowerCase();

        return placeName.includes(search) || placeDescription.includes(search);
      });
    }

    this.currentPage = 1;
    this.renderPlaces();
  }

  sortPlaces(sortBy) {
    switch (sortBy) {
      case "name":
        this.filteredPlaces.sort((a, b) => {
          const nameA = this.getPlaceName(a);
          const nameB = this.getPlaceName(b);
          return nameA.localeCompare(nameB);
        });
        break;
      case "rating":
        this.filteredPlaces.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
        this.filteredPlaces.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.createdAt || b.updatedAt || 0);
          return dateB - dateA;
        });
        break;
    }

    this.renderPlaces();
  }

  renderPlaces() {
    const grid = document.getElementById("placesGrid");
    const noResults = document.getElementById("noResults");
    const placesCount = document.getElementById("placesCount");

    // Update places count
    placesCount.textContent = this?.filteredPlaces?.length ?? "0";

    if (this.filteredPlaces.length === 0) {
      grid.style.display = "none";
      noResults.style.display = "block";
      return;
    }

    noResults.style.display = "none";
    grid.style.display = "flex";

    // Calculate pagination
    const startIndex = (this.currentPage - 1) * this.placesPerPage;
    const endIndex = startIndex + this.placesPerPage;
    const currentPlaces = this.filteredPlaces.slice(startIndex, endIndex);

    let html = "";

    currentPlaces.forEach((place) => {
      html += this.createPlaceCard(place);
    });

    grid.innerHTML = html;

    // Render pagination
    this.renderPagination();
  }

  renderPagination() {
    const totalPages = Math.ceil(
      this.filteredPlaces.length / this.placesPerPage
    );
    const pagination = document.getElementById("pagination");
    const paginationSection = document.getElementById("paginationSection");

    if (totalPages <= 1) {
      paginationSection.style.display = "none";
      return;
    }

    paginationSection.style.display = "block";

    let html = "";

    // Previous button
    html += `
            <li class="page-item ${this.currentPage === 1 ? "disabled" : ""}">
                <a class="page-link" href="#" onclick="placesPage.changePage(${
                  this.currentPage - 1
                }); return false;">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= this.currentPage - 2 && i <= this.currentPage + 2)
      ) {
        html += `
                    <li class="page-item ${
                      this.currentPage === i ? "active" : ""
                    }">
                        <a class="page-link" href="#" onclick="placesPage.changePage(${i}); return false;">${i}</a>
                    </li>
                `;
      } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
        html +=
          '<li class="page-item disabled"><span class="page-link">...</span></li>';
      }
    }

    // Next button
    html += `
            <li class="page-item ${
              this.currentPage === totalPages ? "disabled" : ""
            }">
                <a class="page-link" href="#" onclick="placesPage.changePage(${
                  this.currentPage + 1
                }); return false;">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

    pagination.innerHTML = html;
  }

  changePage(page) {
    const totalPages = Math.ceil(
      this.filteredPlaces.length / this.placesPerPage
    );

    if (page < 1 || page > totalPages) return;

    this.currentPage = page;
    this.renderPlaces();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  getPlaceName(place) {
    if (place.name && typeof place.name === "object") {
      return (
        place.name[this.currentLanguage] ||
        place.name.en ||
        place.name.th ||
        "Unknown Place"
      );
    }
    return place.name || "Unknown Place";
  }

  getPlaceDescription(place) {
    if (place.description && typeof place.description === "object") {
      return (
        place.description[this.currentLanguage] ||
        place.description.en ||
        place.description.th ||
        "No description available"
      );
    }
    return place.description || "No description available";
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

  getPlaceImage(place) {
    if (place.images && place.images.length > 0) {
      return place.images[0];
    }

    // Default image based on category
    const defaultImages = {
      restaurant:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      cafe: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      attraction:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      activity:
        "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      accommodation:
        "https://images.unsplash.com/photo-1551717309-88444dbe54f5?q=80&w=800&auto=format&fit=crop",
      shopping:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      temple:
        "https://cms.dmpcdn.com/travel/2020/01/09/421cafa0-32bf-11ea-ba25-f3dc3bd21411_original.JPG",
      nature:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      spa: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      nightlife:
        "https://img.wongnai.com/p/1920x0/2017/07/12/4e2fa59dff994c2e8d65c215cd482a07.jpg",
      "art-culture":
        "https://images.squarespace-cdn.com/content/v1/5d91f0811b06bc4c5b873679/1612056644420-RRK8X2WLDXAW621PKUFZ/Kamol%2BPhaosavasdi.jpg?format=800w",
      market:
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      default:
        "https://images.unsplash.com/photo-1552550049-db097c9480d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    };

    return defaultImages[this.currentCategory] || defaultImages.default;
  }

  hideLoading() {
    const loadingSection = document.getElementById("loadingSection");
    const placesGrid = document.getElementById("placesGrid");

    if (loadingSection) {
      loadingSection.style.display = "none";
    }

    if (placesGrid) {
      placesGrid.style.display = "flex";
    }
  }

  showError() {
    const loadingSection = document.getElementById("loadingSection");
    const errorSection = document.getElementById("errorSection");
    const placesGrid = document.getElementById("placesGrid");

    if (loadingSection) {
      loadingSection.style.display = "none";
    }

    if (placesGrid) {
      placesGrid.style.display = "none";
    }

    if (errorSection) {
      errorSection.style.display = "block";
    }
  }

  // Create place card HTML using same format as main.js
  createPlaceCard(place) {
    const name = this.getPlaceName(place);
    const description = Utils.truncateText(
      this.getPlaceDescription(place),
      120
    );

    // Handle different image structures
    let imageUrl = "https://placeholder.co/400x250?text=No+Image";
    if (place.images && place.images.length > 0) {
      if (typeof place.images[0] === "string") {
        imageUrl = Utils.getImageUrl(place.images[0]);
      } else if (place.images[0] && place.images[0].url) {
        imageUrl = Utils.getImageUrl(place.images[0].url);
      }
    } else if (place.image) {
      imageUrl = Utils.getImageUrl(place.image);
    }

    const rating = place.rating || 0;
    const priceRange =
      place.priceRange || place.price_range || "Price not specified";

    // Category-based badge mapping
    const categoryBadges = {
      temple: { class: "bg-primary", text: "Sacred" },
      restaurant: { class: "bg-success", text: "Food" },
      cafe: { class: "bg-info", text: "Cafe" },
      attraction: { class: "bg-warning", text: "Popular" },
      nature: { class: "bg-success", text: "Nature" },
      culture: { class: "bg-purple", text: "Culture" },
      activity: { class: "bg-danger", text: "Activity" },
      accommodation: { class: "bg-dark", text: "Stay" },
      shopping: { class: "bg-info", text: "Shop" },
      spa: { class: "bg-success", text: "Wellness" },
      nightlife: { class: "bg-dark", text: "Night" },
      "art-culture": { class: "bg-purple", text: "Art" },
      market: { class: "bg-warning", text: "Market" },
    };

    const categorySlug =
      place.category?.slug || place.categorySlug || this.currentCategory;
    const badge = categoryBadges[categorySlug] || {
      class: "bg-secondary",
      text: "Place",
    };

    return `
        <div class="col-lg-4 col-md-6">
            <div class="attraction-card place-card" onclick="goToPlaceDetail('${
              place.id
            }')">
                <div class="card-image">
                    <img src="${imageUrl}" alt="${name}" class="card-img-top" loading="lazy"
                         onerror="this.src='https://placeholder.co/400x250?text=No+Image'">
                    <div class="card-overlay">
                        ${
                          place.status === "featured" || place.featured
                            ? '<span class="badge bg-warning"><i class="fas fa-star"></i> Featured</span>'
                            : `<span class="badge ${badge.class}">${badge.text}</span>`
                        }
                    </div>
                </div>
                <div class="card-content">
                    <h4>${name}</h4>
                    <p>${description || "Interesting place in Chiang Mai"}</p>
                    <div class="card-features">
                        ${
                          rating > 0
                            ? `<span class="place-rating">
                               <span class="rating-stars">${Utils.generateStars(
                                 rating
                               )}</span>
                               <span class="ms-1">${rating.toFixed(1)}</span>
                             </span>`
                            : '<span><i class="fas fa-star me-1"></i>No rating yet</span>'
                        }
                        <span>${priceRange}</span>
                    </div>
                    
                    <div class="mt-3">
                        <button 
                            class="btn btn-primary w-100" 
                            onclick="goToPlaceDetail('${
                              place.id
                            }'); event.stopPropagation();"
                        >
                            <i class="fas fa-eye me-2"></i>
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
  }
}

// Navigation functions
function goToPlaceDetail(placeId) {
  window.location.href = `place-detail.html?id=${placeId}`;
}

// Make functions globally available
window.goToPlaceDetail = goToPlaceDetail;

// Initialize page when DOM is loaded
let placesPage;
document.addEventListener("DOMContentLoaded", () => {
  placesPage = new PlacesPage();
});

// Make placesPage globally available for pagination
window.placesPage = placesPage;

export default PlacesPage;
