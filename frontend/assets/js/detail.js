// Detail page entry point for Webpack
import '../css/style.css'
import './api'
import { LanguageManager } from './modules/language'
import { Utils } from './modules/utils'
import { PlacesAPI } from './modules/places-api'
import { CategoriesAPI } from './modules/categories-api'

// Detail page functionality
document.addEventListener('DOMContentLoaded', function () {
  // Initialize detail page
  initDetailPage()
})

async function initDetailPage() {
  try {
    // Get place ID from URL
    const placeId = Utils.getUrlParams().id

    if (!placeId) {
      showError('ไม่พบรหัสสถานที่')
      return
    }

    // Show loading state
    showLoading()

    // Load place details
    await loadPlaceDetail(placeId)

    // Initialize components
    initImageGallery()
    initMap()
    initSocialShare()
  } catch (error) {
    console.error('Error initializing detail page:', error)
    showError('ไม่สามารถโหลดรายละเอียดสถานที่ได้')
  }
}

// Show loading state
function showLoading() {
  document.getElementById('loadingState').style.display = 'block'
  document.getElementById('errorState').style.display = 'none'
  document.getElementById('placeContent').style.display = 'none'
}

// Show error state
function showError(message) {
  document.getElementById('errorMessage').textContent = message
  document.getElementById('loadingState').style.display = 'none'
  document.getElementById('errorState').style.display = 'block'
  document.getElementById('placeContent').style.display = 'none'
}

// Show content state
function showContent() {
  document.getElementById('loadingState').style.display = 'none'
  document.getElementById('errorState').style.display = 'none'
  document.getElementById('placeContent').style.display = 'block'
}

// Load place detail data
async function loadPlaceDetail(placeId) {
  try {
    const response = await PlacesAPI.getPlace(placeId)

    if (response.success && response.data) {
      const place = response.data

      // Update page title
      const name = LanguageManager.translate(place.name)
      document.title = `${name} - Go Chiang Mai`

      // Update breadcrumbs
      updateBreadcrumbs(place)

      // Render place details
      const placeContent = document.getElementById('placeContent')
      placeContent.innerHTML = renderPlaceDetail(place)

      // Show content
      showContent()

      // Load related places
      if (place.category) {
        loadRelatedPlaces(place.category, placeId)
      }
    } else {
      showError('ไม่พบข้อมูลสถานที่นี้')
    }
  } catch (error) {
    console.error('Error loading place detail:', error)

    // If API fails, use example data for demonstration
    if (placeId === 'place-001') {
      const examplePlace = {
        id: 'place-001',
        name: {
          th: 'วัดพระธาตุดอยสุเทพ',
          en: 'Wat Phra That Doi Suthep',
          zh: '素贴山双龙寺',
          ja: 'ワット・プラタート・ドイ・ステープ',
        },
        description: {
          th: 'วัดที่มีชื่อเสียงที่สุดของเชียงใหม่ ตั้งอยู่บนยอดดอยสุเทพ มีพระธาตุเจดีย์ทองคำที่งดงาม',
          en: 'The most famous temple in Chiang Mai, located on top of Doi Suthep mountain with a beautiful golden pagoda',
          zh: '清迈最著名的寺庙，位于素贴山顶，有美丽的金色佛塔',
          ja: 'チェンマイで最も有名な寺院で、ドイ・ステープ山の頂上にあり、美しい金色の仏塔があります',
        },
        category: 'attraction',
        images: [],
        contact: {
          address: 'ดอยสุเทพ อำเภอเมือง จังหวัดเชียงใหม่ 50200',
          phone: '053-295-002',
          website: '',
          facebook: '',
          instagram: '',
          coordinates: {
            lat: 18.8048,
            lng: 98.9216,
          },
        },
        hours: '06:00 - 18:00',
        priceRange: 'ฟรี',
        status: 'published',
        featured: true,
        createdAt: '2024-01-15T08:00:00.000Z',
        updatedAt: '2024-01-15T08:00:00.000Z',
        createdBy: 'admin',
      }

      // Update page title
      const name = LanguageManager.translate(examplePlace.name)
      document.title = `${name} - Go Chiang Mai`

      // Update breadcrumbs
      updateBreadcrumbs(examplePlace)

      // Render place details
      const placeContent = document.getElementById('placeContent')
      placeContent.innerHTML = renderPlaceDetail(examplePlace)

      // Show content
      showContent()
    } else {
      showError('ไม่สามารถโหลดข้อมูลสถานที่ได้')
    }
  }
}

// Update breadcrumbs based on place data
function updateBreadcrumbs(place) {
  try {
    const categoryBreadcrumb = document.getElementById('categoryBreadcrumb')
    const placeBreadcrumb = document.getElementById('placeBreadcrumb')

    if (categoryBreadcrumb) {
      // Set category name (you might want to fetch this from categories API)
      const categoryNames = {
        attraction: 'สถานที่ท่องเที่ยว',
        restaurant: 'ร้านอาหาร',
        hotel: 'โรงแรม',
        shopping: 'ช้อปปิ้ง',
      }
      categoryBreadcrumb.textContent =
        categoryNames[place.category] || place.category
    }

    if (placeBreadcrumb) {
      const name = LanguageManager.translate(place.name)
      placeBreadcrumb.textContent = name
    }
  } catch (error) {
    console.error('Error updating breadcrumbs:', error)
  }
}

// Render place detail HTML
function renderPlaceDetail(place) {
  const name = LanguageManager.translate(place.name)
  const description = LanguageManager.translate(place.description)
  const address = place.contact?.address || 'ไม่ระบุที่อยู่'

  const mainImage =
    place.images && place.images.length > 0
      ? Utils.getImageUrl(place.images[0])
      : 'https://placehold.co/800x400/152f56/ffffff?text=No+Image'

  const rating = place.rating || 4.5
  const priceRange = place.priceRange || 'ไม่ระบุ'

  return `
        <!-- Hero Section -->
        <div class="place-hero">
            <div class="place-hero-image">
                <img src="${mainImage}" alt="${name}" class="w-100"
                     onerror="this.src='https://placehold.co/800x400/152f56/ffffff?text=Place Holder'">
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
                                            <i class="fas fa-tag me-1"></i>
                                            ${priceRange}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ${
                  place.featured
                    ? '<div class="featured-badge"><i class="fas fa-star me-1"></i>แนะนำ</div>'
                    : ''
                }
            </div>
        </div>

        <!-- Main Content -->
        <div class="container my-5">
            <div class="row">
                <div class="col-lg-8">
                    <!-- Description -->
                    <div class="place-section">
                        <h3><i class="fas fa-info-circle me-2 text-primary"></i>เกี่ยวกับสถานที่นี้</h3>
                        <div class="place-description">
                            ${description
                              .split('\n')
                              .map((para) => `<p>${para}</p>`)
                              .join('')}
                        </div>
                    </div>

                    <!-- Contact Information -->
                    ${renderContactInformation(place)}

                    <!-- Image Gallery -->
                    ${
                      place.images && place.images.length > 1
                        ? renderImageGallery(place.images)
                        : ''
                    }

                    <!-- Map -->
                    ${
                      place.contact?.coordinates?.lat &&
                      place.contact?.coordinates?.lng
                        ? renderMap(place)
                        : ''
                    }
                </div>

                <!-- Sidebar -->
                <div class="col-lg-4">
                    <div class="place-sidebar">
                        <!-- Quick Info -->
                        <div class="sidebar-card">
                            <h5><i class="fas fa-info me-2"></i>ข้อมูลเบื้องต้น</h5>
                            <div class="quick-info">
                                <div class="info-item">
                                    <i class="fas fa-star text-warning"></i>
                                    <span>คะแนน: ${rating.toFixed(1)}/5</span>
                                </div>
                                <div class="info-item">
                                    <i class="fas fa-tag text-success"></i>
                                    <span>ราคา: ${priceRange}</span>
                                </div>
                                ${
                                  place.hours
                                    ? `
                                <div class="info-item">
                                    <i class="fas fa-clock text-info"></i>
                                    <span>เวลา: ${place.hours}</span>
                                </div>
                                `
                                    : ''
                                }
                                ${
                                  place.category
                                    ? `
                                <div class="info-item">
                                    <i class="fas fa-folder text-primary"></i>
                                    <span>หมวด: ${getCategoryName(
                                      place.category
                                    )}</span>
                                </div>
                                `
                                    : ''
                                }
                            </div>
                        </div>

                        <!-- Share -->
                        <div class="sidebar-card">
                            <h5><i class="fas fa-share-alt me-2"></i>แชร์สถานที่นี้</h5>
                            <div class="share-buttons" id="shareButtons">
                                <!-- Share buttons will be generated by JS -->
                            </div>
                        </div>

                        <!-- Navigation -->
                        <div class="sidebar-card">
                            <h5><i class="fas fa-map-marked-alt me-2"></i>การเดินทาง</h5>
                            <div class="d-grid gap-2">
                                ${
                                  place.contact?.coordinates?.lat &&
                                  place.contact?.coordinates?.lng
                                    ? `
                                <button class="btn btn-outline-primary" onclick="openGoogleMaps(${place.contact.coordinates.lat}, ${place.contact.coordinates.lng})">
                                    <i class="fas fa-directions me-2"></i>
                                    Google Maps
                                </button>
                                `
                                    : ''
                                }
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
                    <h3><i class="fas fa-map-pin me-2 text-primary"></i>สถานที่ใกล้เคียง</h3>
                    <div id="relatedPlacesContainer" class="row">
                        <!-- Related places will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    `
}

// Render contact information
function renderContactInformation(place) {
  const contact = place.contact || {}
  const hasContact =
    contact.address ||
    contact.phone ||
    contact.website ||
    contact.facebook ||
    contact.instagram

  if (!hasContact) return ''

  return `
        <div class="place-section">
            <h3><i class="fas fa-address-card me-2 text-primary"></i>ข้อมูลการติดต่อ</h3>
            <div class="contact-info-card">
                ${
                  contact.address
                    ? `
                <div class="contact-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${contact.address}</span>
                </div>
                `
                    : ''
                }
                ${
                  contact.phone
                    ? `
                <div class="contact-item">
                    <i class="fas fa-phone"></i>
                    <a href="tel:${contact.phone}">${contact.phone}</a>
                </div>
                `
                    : ''
                }
                ${
                  contact.website
                    ? `
                <div class="contact-item">
                    <i class="fas fa-globe"></i>
                    <a href="${contact.website}" target="_blank" rel="noopener">${contact.website}</a>
                </div>
                `
                    : ''
                }
                ${
                  contact.facebook
                    ? `
                <div class="contact-item">
                    <i class="fab fa-facebook"></i>
                    <a href="${contact.facebook}" target="_blank" rel="noopener">Facebook</a>
                </div>
                `
                    : ''
                }
                ${
                  contact.instagram
                    ? `
                <div class="contact-item">
                    <i class="fab fa-instagram"></i>
                    <a href="${contact.instagram}" target="_blank" rel="noopener">Instagram</a>
                </div>
                `
                    : ''
                }
            </div>
        </div>
    `
}

// Get category display name
function getCategoryName(category) {
  const categoryNames = {
    attraction: 'สถานที่ท่องเที่ยว',
    restaurant: 'ร้านอาหาร',
    hotel: 'โรงแรม',
    shopping: 'ช้อปปิ้ง',
    cafe: 'คาเฟ่',
    spa: 'สปา',
    temple: 'วัด',
    market: 'ตลาด',
  }
  return categoryNames[category] || category
}

// Render image gallery
function renderImageGallery(images) {
  return `
        <div class="place-section">
            <h3>รูปภาพ</h3>
            <div class="image-gallery" id="imageGallery">
                <div class="row g-2">
                    ${images
                      .map(
                        (image, index) => `
                        <div class="col-md-4">
                            <div class="gallery-item" onclick="openLightbox(${index})">
                                <img src="${Utils.getImageUrl(
                                  image
                                )}" alt="รูปภาพที่ ${index + 1}" 
                                     class="w-100" style="height: 200px; object-fit: cover; cursor: pointer;">
                            </div>
                        </div>
                    `
                      )
                      .join('')}
                </div>
            </div>
        </div>
    `
}

// Render opening hours
function renderOpeningHours(openingHours) {
  return `
        <div class="detail-item">
            <strong>เวลาเปิด-ปิด:</strong>
            <div class="opening-hours">
                ${Object.entries(openingHours)
                  .map(
                    ([day, hours]) => `
                    <div class="hours-item">
                        <span class="day">${translateDay(day)}:</span>
                        <span class="hours">${hours || 'ปิด'}</span>
                    </div>
                `
                  )
                  .join('')}
            </div>
        </div>
    `
}

// Render map
function renderMap(place) {
  const coords = place.contact?.coordinates
  if (!coords?.lat || !coords?.lng) return ''

  return `
        <div class="place-section">
            <h3><i class="fas fa-map-marked-alt me-2 text-primary"></i>แผนที่</h3>
            <div class="map-container">
                <div id="placeMap" style="height: 300px; background: #f8f9fa; border-radius: 8px;">
                    <div class="d-flex align-items-center justify-content-center h-100">
                        <div class="text-center">
                            <i class="fas fa-map-marked-alt fa-3x text-muted mb-3"></i>
                            <p class="text-muted">แผนที่จะแสดงที่นี่</p>
                            <button class="btn btn-primary" onclick="openGoogleMaps(${coords.lat}, ${coords.lng})">
                                <i class="fas fa-external-link-alt me-2"></i>
                                ดูใน Google Maps
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}

// Load related places
async function loadRelatedPlaces(categoryId, excludeId) {
  const container = document.getElementById('relatedPlacesContainer')

  try {
    const response = await PlacesAPI.getPlacesByCategory(categoryId, {
      limit: 6,
      exclude: excludeId,
    })

    if (response.success && response.data.length > 0) {
      container.innerHTML = response.data
        .map((place) => createRelatedPlaceCard(place))
        .join('')
    } else {
      container.innerHTML =
        '<div class="col-12"><p class="text-muted">ไม่มีสถานที่ที่เกี่ยวข้อง</p></div>'
    }
  } catch (error) {
    console.error('Error loading related places:', error)
    container.innerHTML =
      '<div class="col-12"><p class="text-danger">ไม่สามารถโหลดสถานที่ที่เกี่ยวข้องได้</p></div>'
  }
}

// Create related place card
function createRelatedPlaceCard(place) {
  const name = LanguageManager.translate(place.name)
  const imageUrl =
    place.images && place.images.length > 0
      ? Utils.getImageUrl(place.images[0])
      : 'https://placehold.co/300x200/152f56/ffffff?text=No+Image'

  return `
        <div class="col-md-4 mb-3">
            <div class="card h-100 related-place-card" onclick="goToPlace('${
              place.id
            }')" style="cursor: pointer;">
                <img src="${imageUrl}" alt="${name}" class="card-img-top" 
                     style="height: 200px; object-fit: cover;"
                     onerror="this.src='https://placehold.co/300x200/152f56/ffffff?text=No+Image'">
                <div class="card-body">
                    <h6 class="card-title">${name}</h6>
                    <div class="text-muted small">
                        <i class="fas fa-star text-warning me-1"></i>
                        ${(place.rating || 4.5).toFixed(1)}
                        <span class="ms-2">
                            <i class="fas fa-tag me-1"></i>
                            ${place.priceRange || 'ไม่ระบุ'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `
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
  const shareContainer = document.getElementById('shareButtons')
  if (!shareContainer) return

  const url = encodeURIComponent(window.location.href)
  const title = encodeURIComponent(document.title)

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
    `
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
    sunday: 'อาทิตย์',
  }
  return days[day.toLowerCase()] || day
}

// Global functions for interactions
window.openLightbox = function (index) {
  // Implement lightbox functionality
}

window.openGoogleMaps = function (lat, lng) {
  window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
}

window.goBack = function () {
  if (document.referrer && !document.referrer.includes('place-detail.html')) {
    window.history.back()
  } else {
    window.location.href = 'travel-style.html'
  }
}

window.goToPlace = function (placeId) {
  window.location.href = `place-detail.html?id=${placeId}`
}

window.shareOnFacebook = function (url) {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
}

window.shareOnTwitter = function (url, title) {
  window.open(
    `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
    '_blank'
  )
}

window.shareOnLine = function (url) {
  window.open(
    `https://social-plugins.line.me/lineit/share?url=${url}`,
    '_blank'
  )
}

window.copyLink = function () {
  navigator.clipboard
    .writeText(window.location.href)
    .then(() => {
      Utils.showToast('คัดลอกลิงก์เรียบร้อย', 'success')
    })
    .catch(() => {
      Utils.showToast('ไม่สามารถคัดลอกลิงก์ได้', 'error')
    })
}
