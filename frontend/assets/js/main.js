// Main entry point for homepage with Vite
import '../css/style.css'
import './api'
import { CategoriesAPI } from './modules/categories-api'
import { LanguageManager } from './modules/language'
import { PlacesAPI } from './modules/places-api'
import { Utils } from './modules/utils'

document.addEventListener('DOMContentLoaded', function () {
  // Initialize components
  initLanguageSwitcher()
  initNavbar()
  initSmoothScrolling()
  loadHomePageData()
})

// Language Switcher
function initLanguageSwitcher() {
  const langButtons = document.querySelectorAll('.lang-btn')
  const currentLang = LanguageManager.getCurrentLanguage()

  // Set active language button
  langButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang)

    btn.addEventListener('click', () => {
      const selectedLang = btn.dataset.lang

      // Update active state
      langButtons.forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')

      // Change language
      LanguageManager.setLanguage(selectedLang)

      // Reload page content
      loadHomePageData()
    })
  })

  // Listen for language change events
  window.addEventListener('languageChange', (event) => {
    updatePageLanguage(event.detail.language)
  })
}

// Update page content based on language
function updatePageLanguage(language) {
  const translations = {
    th: {
      navHome: 'หน้าแรก',
      navAttractions: 'สถานที่ท่องเที่ยว',
      navCategories: 'หมวดหมู่',
      navViewAll: 'ดูทั้งหมด',
      heroTitle: 'ยินดีต้อนรับสู่ <span class="text-gradient">เชียงใหม่</span>',
      heroSubtitle:
        'ดอกไม้แห่งภาคเหนือ • ดินแดนแห่งวัดโบราณ • สวรรค์ทางวัฒนธรรม',
      heroDescription:
        'ค้นพบเสน่ห์อันน่าหลงใหลของเมืองหลวงทางวัฒนธรรมภาคเหนือของไทย ที่ซึ่งประเพณีโบราณผสานกับเสน่ห์สมัยใหม่อย่างลงตัว',
      btnExplore: '<i class="fas fa-compass me-2"></i>เริ่มสำรวจ',
      btnPlan: '<i class="fas fa-map me-2"></i>วางแผนการเดินทาง',
    },
    en: {
      navHome: 'Home',
      navAttractions: 'Attractions',
      navCategories: 'Categories',
      navViewAll: 'View All',
      heroTitle: 'Welcome to <span class="text-gradient">Chiang Mai</span>',
      heroSubtitle:
        'Rose of the North • Land of Ancient Temples • Cultural Paradise',
      heroDescription:
        "Discover the enchanting beauty of Northern Thailand's cultural capital, where ancient traditions meet modern charm in perfect harmony.",
      btnExplore: '<i class="fas fa-compass me-2"></i>Explore Now',
      btnPlan: '<i class="fas fa-map me-2"></i>Plan Your Trip',
    },
  }

  const t = translations[language]
  if (!t) return

  // Update navigation
  document.querySelector('a[href="#home"]').textContent = t.navHome
  document.querySelector('a[href="#attractions"]').textContent =
    t.navAttractions
  document.querySelector('a[href="#categories"]').textContent = t.navCategories
  document.querySelector('a[href="places.html"]').textContent = t.navViewAll

  // Update hero section
  document.querySelector('.hero-title').innerHTML = t.heroTitle
  document.querySelector('.hero-subtitle').textContent = t.heroSubtitle
  document.querySelector('.hero-description').textContent = t.heroDescription

  const exploreBtn = document.querySelector(
    'a[href="#attractions"].btn-primary'
  )
  const planBtn = document.querySelector(
    'a[href="places.html"].btn-outline-light'
  )
  if (exploreBtn) exploreBtn.innerHTML = t.btnExplore
  if (planBtn) planBtn.innerHTML = t.btnPlan
}

// Navbar scroll effect
function initNavbar() {
  window.addEventListener('scroll', function () {
    const navbar = document.getElementById('mainNavbar')
    if (window.scrollY > 100) {
      navbar.classList.add('navbar-scrolled')
    } else {
      navbar.classList.remove('navbar-scrolled')
    }
  })
}

// Smooth scrolling
function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute('href'))
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    })
  })
}

// Load homepage data
async function loadHomePageData() {
  try {
    // Load all data concurrently
    await Promise.all([
      loadFeaturedPlaces(),
      loadCategories(),
      loadBentoGrid(),
      loadStats(),
    ])
  } catch (error) {
    console.error('Error loading homepage data:', error)
  }
}

// Load featured places
async function loadFeaturedPlaces() {
  const container = document.getElementById('featuredPlacesContainer')
  Utils.showLoading('featuredPlacesContainer')

  try {
    const response = await PlacesAPI.getFeaturedPlaces(6)

    if (response.success && response.data.length > 0) {
      container.innerHTML = response.data
        .map((place) => createPlaceCard(place))
        .join('')
    } else {
      Utils.showEmpty('featuredPlacesContainer', 'ไม่มีสถานที่แนะนำในขณะนี้')
    }
  } catch (error) {
    console.error('Error loading featured places:', error)
    Utils.showError('featuredPlacesContainer', 'ไม่สามารถโหลดสถานที่แนะนำได้')
  }
}

// Load categories
async function loadCategories() {
  const container = document.getElementById('categoriesContainer')
  const footerContainer = document.getElementById('footerCategories')
  Utils.showLoading('categoriesContainer')

  try {
    const response = await CategoriesAPI.getCategories()

    if (response.success && response.data.length > 0) {
      container.innerHTML = response.data
        .map((category) => createCategoryCard(category))
        .join('')

      // Update footer categories
      if (footerContainer) {
        footerContainer.innerHTML = response.data
          .slice(0, 5)
          .map(
            (category) =>
              `<li><a href="places.html?category=${
                category.id
              }">${LanguageManager.translate(category.name)}</a></li>`
          )
          .join('')
      }
    } else {
      Utils.showEmpty('categoriesContainer', 'ไม่มีหมวดหมู่ในขณะนี้')
    }
  } catch (error) {
    console.error('Error loading categories:', error)
    Utils.showError('categoriesContainer', 'ไม่สามารถโหลดหมวดหมู่ได้')
  }
}

// Load Bento Grid with categories data
async function loadBentoGrid() {
  const container = document.querySelector('.bento-grid-section .row.g-4')
  if (!container) return

  // Show loading state
  container.innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `

  try {
    const response = await CategoriesAPI.getCategories()

    if (response.success && response.data.length > 0) {
      // Take first 6 categories for bento grid
      const categories = response.data.slice(0, 6)

      // Map categories to background images
      const categoryImages = {
        restaurant:
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        '77021e0c-0af3-4058-8701-9b9db6d42756':
          'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80', // Cafe by ID
        attraction:
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        activity:
          'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?ixlib=rb-4.0.3&auto=format&fit=crop&w=2126&q=80',
        accommodation:
          'https://img.wongnai.com/p/624x0/2020/02/23/de8d92bd8257467088d914107514d146.jpg',
        shopping:
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        temple:
          'https://cms.dmpcdn.com/travel/2020/01/09/421cafa0-32bf-11ea-ba25-f3dc3bd21411_original.JPG',
        nature:
          'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        spa: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        nightlife:
          'https://img.wongnai.com/p/1920x0/2017/07/12/4e2fa59dff994c2e8d65c215cd482a07.jpg',
        'art-culture':
          'https://images.squarespace-cdn.com/content/v1/5d91f0811b06bc4c5b873679/1612056644420-RRK8X2WLDXAW621PKUFZ/Kamol%2BPhaosavasdi.jpg?format=2500w',
        market:
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80',
        default:
          'https://images.unsplash.com/photo-1552550049-db097c9480d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80',
      }

      let html = ''

      categories.forEach((category, index) => {
        const name = LanguageManager.translate(category.name)
        const placesCount = category.placesCount || 0
        const icon = category.icon
          ? `fas fa-${category.icon}`
          : 'fas fa-map-marker-alt'

        // Get image for category
        const imageUrl =
          categoryImages[category.slug] ||
          categoryImages[category.id] ||
          categoryImages.default

        // Different layouts for different positions
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
                                    <h4>${name}</h4>
                                </div>
                            </div>
                        </div>
                    `

          // Start right column for small items
          html += '<div class="col-md-4"><div class="row g-4">'
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
                                    <h4>${name}</h4>
                                </div>
                            </div>
                        </div>
                    `

          // Close right column after second small item
          if (index === 2) {
            html += '</div></div>'
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
                                    <h4>${name}</h4>
                                </div>
                            </div>
                        </div>
                    `
        }
      })

      container.innerHTML = html
    } else {
      // Fallback to static content
      loadStaticBentoGrid(container)
    }
  } catch (error) {
    console.error('Error loading bento grid:', error)
    // Fallback to static content
    loadStaticBentoGrid(container)
  }
}

// Fallback function to load static bento grid
function loadStaticBentoGrid(container) {
  container.innerHTML = `
        <!-- Large item -->
        <div class="col-md-8">
            <div class="bento-item bento-tall"
                 style="background-image: url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80');">
                <div class="card-overlay"></div>
                <div class="card-content">
                    <div class="category-icon"><i class="fas fa-mountain"></i></div>
                    <h3>Explore Nature</h3>
                    <p>Discover the beauty of Chiang Mai's mountains and national parks</p>
                </div>
            </div>
        </div>
        <!-- Two small items -->
        <div class="col-md-4">
            <div class="row g-4">
                <div class="col-12">
                    <div class="bento-item"
                         style="background-image: url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80');">
                        <div class="card-overlay"></div>
                        <div class="card-content">
                            <div class="category-icon"><i class="fas fa-utensils"></i></div>
                            <h4>Culinary Delights</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12">
                    <div class="bento-item"
                         style="background-image: url('https://images.unsplash.com/photo-1551717309-88444dbe54f5?q=80&w=2670&auto=format&fit=crop');">
                        <div class="card-overlay"></div>
                        <div class="card-content">
                            <div class="category-icon"><i class="fas fa-landmark"></i></div>
                            <h4>Cultural Heritage</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Medium items -->
        <div class="col-md-4">
            <div class="bento-item"
                 style="background-image: url('https://images.unsplash.com/photo-1552550049-db097c9480d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80');">
                <div class="card-overlay"></div>
                <div class="card-content">
                    <div class="category-icon"><i class="fas fa-place-of-worship"></i></div>
                    <h4>Temple Tours</h4>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="bento-item"
                 style="background-image: url('https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80');">
                <div class="card-overlay"></div>
                <div class="card-content">
                    <div class="category-icon"><i class="fas fa-palette"></i></div>
                    <h4>Local Arts</h4>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div class="bento-item"
                 style="background-image: url('https://images.unsplash.com/photo-1564760055775-d63b17a55c44?ixlib=rb-4.0.3&auto=format&fit=crop&w=2126&q=80');">
                <div class="card-overlay"></div>
                <div class="card-content">
                    <div class="category-icon"><i class="fas fa-bicycle"></i></div>
                    <h4>Adventure Sports</h4>
                </div>
            </div>
        </div>
    `
}

// Load stats (simulate stats from places and categories)
async function loadStats() {
  const container = document.getElementById('statsContainer')

  try {
    // Get basic stats from API responses
    const [placesResponse, categoriesResponse] = await Promise.all([
      PlacesAPI.getPlaces({ limit: 1000 }), // Get all places to count
      CategoriesAPI.getCategories(),
    ])

    const stats = [
      {
        icon: 'fas fa-map-marked-alt',
        number: placesResponse.success
          ? placesResponse.pagination?.total || placesResponse.data.length
          : '100+',
        label: 'สถานที่ท่องเที่ยว',
      },
      {
        icon: 'fas fa-layer-group',
        number: categoriesResponse.success
          ? categoriesResponse.data.length
          : '10+',
        label: 'หมวดหมู่',
      },
      {
        icon: 'fas fa-temple',
        number: '300+',
        label: 'วัดโบราณ',
      },
      {
        icon: 'fas fa-mountain',
        number: '1,676m',
        label: 'ยอดดอยอินทนนท์',
      },
    ]

    container.innerHTML = stats
      .map(
        (stat) => `
            <div class="col-md-3 col-6 mb-4">
                <div class="stat-item">
                    <i class="${stat.icon} fa-3x mb-3"></i>
                    <h3 class="stat-number">${stat.number}</h3>
                    <p class="stat-label">${stat.label}</p>
                </div>
            </div>
        `
      )
      .join('')
  } catch (error) {
    console.error('Error loading stats:', error)
    // Show fallback stats
    container.innerHTML = `
            <div class="col-md-3 col-6 mb-4">
                <div class="stat-item">
                    <i class="fas fa-map-marked-alt fa-3x mb-3"></i>
                    <h3 class="stat-number">100+</h3>
                    <p class="stat-label">สถานที่ท่องเที่ยว</p>
                </div>
            </div>
            <div class="col-md-3 col-6 mb-4">
                <div class="stat-item">
                    <i class="fas fa-layer-group fa-3x mb-3"></i>
                    <h3 class="stat-number">10+</h3>
                    <p class="stat-label">หมวดหมู่</p>
                </div>
            </div>
            <div class="col-md-3 col-6 mb-4">
                <div class="stat-item">
                    <i class="fas fa-temple fa-3x mb-3"></i>
                    <h3 class="stat-number">300+</h3>
                    <p class="stat-label">วัดโบราณ</p>
                </div>
            </div>
            <div class="col-md-3 col-6 mb-4">
                <div class="stat-item">
                    <i class="fas fa-mountain fa-3x mb-3"></i>
                    <h3 class="stat-number">1,676m</h3>
                    <p class="stat-label">ยอดดอยอินทนนท์</p>
                </div>
            </div>
        `
  }
}

// Create place card HTML
function createPlaceCard(place) {
  const currentLang = LanguageManager.getCurrentLanguage()
  const name = LanguageManager.translate(place.name)
  const description = Utils.truncateText(
    LanguageManager.translate(place.description),
    120
  )
  const imageUrl =
    place.images && place.images.length > 0
      ? Utils.getImageUrl(place.images[0])
      : 'https://placeholder.co/400x250?text=No+Image'

  const rating = place.rating || 0
  const priceRange = place.priceRange || 'ไม่ระบุ'

  return `
        <div class="col-lg-4 col-md-6">
            <div class="attraction-card place-card" onclick="goToPlaceDetail('${
              place.id
            }')">
                <div class="card-image">
                    <img src="${imageUrl}" alt="${name}" class="card-img-top" loading="lazy"
                         onerror="this.src='https://placeholder.co/400x250?text=No+Image'">
                    ${
                      place.featured
                        ? '<div class="card-overlay"><span class="badge bg-warning">แนะนำ</span></div>'
                        : ''
                    }
                </div>
                <div class="card-content">
                    <h4>${name}</h4>
                    <p>${description}</p>
                    <div class="card-features">
                        <span class="place-rating">
                            <span class="rating-stars">${Utils.generateStars(
                              rating
                            )}</span>
                            <span class="ms-1">${rating.toFixed(1)}</span>
                        </span>
                        <span>${priceRange}</span>
                    </div>
                </div>
            </div>
        </div>
    `
}

// Create category card HTML
function createCategoryCard(category) {
  const name = LanguageManager.translate(category.name)
  const description = LanguageManager.translate(category.description)
  const icon = category.icon || 'fas fa-map-marker-alt'
  const color = category.color || 'var(--primary-navy)'
  const placesCount = category.placesCount || 0

  return `
        <div class="col-lg-3 col-md-6">
            <div class="tip-card" onclick="goToCategory('${
              category.slug || category.id
            }')" 
                 style="cursor: pointer; border-left: 4px solid ${color};">
                <div class="tip-icon" style="background: ${color};">
                    <i class="${icon}"></i>
                </div>
                <div class="tip-content">
                    <h5>${name}</h5>
                    <p>${description}</p>
                    <small class="text-muted">${placesCount} สถานที่</small>
                </div>
            </div>
        </div>
    `
}

// Navigation functions
function goToPlaceDetail(placeId) {
  window.location.href = `detail.html?id=${placeId}`
}

function goToCategory(categorySlug) {
  window.location.href = `places.html?category=${categorySlug}`
}

// Animation observer
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px',
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1'
      entry.target.style.transform = 'translateY(0)'
    }
  })
}, observerOptions)

// Observe elements for animation
window.addEventListener('load', () => {
  document
    .querySelectorAll('.attraction-card, .tip-card, .stat-item')
    .forEach((el) => {
      el.style.opacity = '0'
      el.style.transform = 'translateY(30px)'
      el.style.transition = 'all 0.6s ease'
      observer.observe(el)
    })
})
