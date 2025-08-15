const express = require("express");
const router = express.Router();
const path = require("path");
const DataManager = require("../../../utils/dataManager");

// Initialize data manager
const dataManager = new DataManager(path.join(__dirname, "../../../data"));

/**
 * GET /api/public/places
 * ดึงรายการสถานที่ท่องเที่ยวสำหรับ public (เฉพาะ published)
 */
router.get("/", async (req, res) => {
  try {
    const { 
      category, 
      search, 
      limit = 20, 
      offset = 0,
      featured,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const placesResult = await dataManager.getPlaces();
    
    if (!placesResult.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      });
    }

    let places = placesResult.data;

    // Filter เฉพาะ published places
    places = places.filter(place => place.status === 'published');

    // Filter by category
    if (category) {
      places = places.filter(place => place.category === category);
    }

    // Filter by search keyword
    if (search) {
      const searchLower = search.toLowerCase();
      places = places.filter(place => {
        return (
          place.name.th.toLowerCase().includes(searchLower) ||
          place.name.en.toLowerCase().includes(searchLower) ||
          place.description.th.toLowerCase().includes(searchLower) ||
          place.description.en.toLowerCase().includes(searchLower) ||
          (place.tags && place.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
      });
    }

    // Filter by featured
    if (featured === 'true') {
      places = places.filter(place => place.featured === true);
    }

    // Sort places
    places.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.th.toLowerCase();
          bValue = b.name.th.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        default:
          aValue = a.name.th.toLowerCase();
          bValue = b.name.th.toLowerCase();
      }

      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    // Pagination
    const total = places.length;
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    const paginatedPlaces = places.slice(offsetNum, offsetNum + limitNum);

    // Remove sensitive information
    const cleanPlaces = paginatedPlaces.map(place => ({
      id: place.id,
      name: place.name,
      description: place.description,
      category: place.category,
      images: place.images,
      location: place.location,
      contact: place.contact,
      hours: place.hours,
      priceRange: place.priceRange,
      tags: place.tags,
      featured: place.featured,
      rating: place.rating || 0,
      createdAt: place.createdAt,
      updatedAt: place.updatedAt
    }));

    res.json({
      success: true,
      data: cleanPlaces,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total
      },
      filters: {
        category,
        search,
        featured,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error("Error loading public places:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่",
    });
  }
});

/**
 * GET /api/public/places/:id
 * ดึงรายละเอียดสถานที่เดียว (เฉพาะ published)
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const placesResult = await dataManager.getPlaces();
    
    if (!placesResult.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      });
    }

    const place = placesResult.data.find(p => p.id === id && p.status === 'published');
    
    if (!place) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบสถานที่ท่องเที่ยวที่ต้องการ",
      });
    }

    // Remove sensitive information
    const cleanPlace = {
      id: place.id,
      name: place.name,
      description: place.description,
      category: place.category,
      images: place.images,
      location: place.location,
      contact: place.contact,
      hours: place.hours,
      priceRange: place.priceRange,
      tags: place.tags,
      featured: place.featured,
      rating: place.rating || 0,
      createdAt: place.createdAt,
      updatedAt: place.updatedAt
    };

    res.json({
      success: true,
      data: cleanPlace
    });

  } catch (error) {
    console.error("Error loading place details:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการโหลดรายละเอียดสถานที่",
    });
  }
});

/**
 * GET /api/public/places/featured/random
 * ดึงสถานที่แนะนำแบบสุ่ม
 */
router.get("/featured/random", async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    const placesResult = await dataManager.getPlaces();
    
    if (!placesResult.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      });
    }

    // Filter featured and published places
    let featuredPlaces = placesResult.data.filter(place => 
      place.status === 'published' && place.featured === true
    );

    // Shuffle array
    featuredPlaces = featuredPlaces.sort(() => Math.random() - 0.5);
    
    // Limit results
    const limitedPlaces = featuredPlaces.slice(0, parseInt(limit));
    
    // Clean data
    const cleanPlaces = limitedPlaces.map(place => ({
      id: place.id,
      name: place.name,
      description: place.description,
      category: place.category,
      images: place.images ? [place.images[0]] : [], // เอาเฉพาะรูปแรก
      location: place.location,
      rating: place.rating || 0,
      priceRange: place.priceRange
    }));

    res.json({
      success: true,
      data: cleanPlaces
    });

  } catch (error) {
    console.error("Error loading featured places:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการโหลดสถานที่แนะนำ",
    });
  }
});

module.exports = router;