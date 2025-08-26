const express = require("express");
const router = express.Router();
const path = require("path");
const DataManager = require("../../../utils/dataManager");

// Initialize data manager
const dataManager = new DataManager(path.join(__dirname, "../../../data"));

/**
 * GET /api/public/categories
 * ดึงรายการหมวดหมู่สำหรับ public พร้อมจำนวนสถานที่
 */
router.get("/", async (req, res) => {
  try {
    const categoriesResult = await dataManager.getCategories();
    const placesResult = await dataManager.getPlaces();
    
    if (!categoriesResult.success || !placesResult.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      });
    }

    const categories = categoriesResult.data;
    const places = placesResult.data;

    // นับจำนวนสถานที่ที่เผยแพร่แล้วในแต่ละหมวดหมู่
    const categoriesWithCounts = categories
      .filter(category => category.status === 'active') // เฉพาะหมวดหมู่ที่ active
      .map((category) => {
        const publishedPlacesCount = places.filter(
          (place) => place.category === category.id && place.status === 'published'
        ).length;
        
        return {
          id: category.id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          slug: category.slug,
          color: category.color,
          placesCount: publishedPlacesCount,
          order: category.order || 0
        };
      })
      .sort((a, b) => a.order - b.order); // เรียงตาม order

    res.json({
      success: true,
      data: categoriesWithCounts,
      total: categoriesWithCounts.length
    });

  } catch (error) {
    console.error("Error loading public categories:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการโหลดข้อมูลหมวดหมู่",
    });
  }
});

/**
 * GET /api/public/categories/:slug
 * ดึงข้อมูลหมวดหมู่จาก slug
 */
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    
    const categoriesResult = await dataManager.getCategories();
    const placesResult = await dataManager.getPlaces();
    
    if (!categoriesResult.success || !placesResult.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      });
    }

    const category = categoriesResult.data.find(cat => 
      cat.slug === slug && cat.status === 'active'
    );
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบหมวดหมู่ที่ต้องการ",
      });
    }

    const places = placesResult.data;
    const publishedPlacesCount = places.filter(
      (place) => place.category === category.id && place.status === 'published'
    ).length;

    // ดึงสถานที่ในหมวดหมู่นี้ (featured ก่อน)
    const categoryPlaces = places
      .filter(place => place.category === category.id && place.status === 'published')
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      })
      .slice(0, 12) // จำกัดแค่ 12 รายการ
      .map(place => ({
        id: place.id,
        name: place.name,
        description: {
          th: place.description.th.substring(0, 150) + '...',
          en: place.description.en.substring(0, 150) + '...'
        },
        images: place.images ? [place.images[0]] : [],
        location: place.location,
        rating: place.rating || 0,
        priceRange: place.priceRange,
        featured: place.featured
      }));

    const cleanCategory = {
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      slug: category.slug,
      color: category.color,
      placesCount: publishedPlacesCount,
      places: categoryPlaces
    };

    res.json({
      success: true,
      data: cleanCategory
    });

  } catch (error) {
    console.error("Error loading category details:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการโหลดรายละเอียดหมวดหมู่",
    });
  }
});

/**
 * GET /api/public/categories/:id/places
 * ดึงสถานที่ทั้งหมดในหมวดหมู่
 */
router.get("/:id/places", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      search, 
      limit = 20, 
      offset = 0,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const placesResult = await dataManager.getPlaces();
    const categoriesResult = await dataManager.getCategories();
    
    if (!placesResult.success || !categoriesResult.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      });
    }

    // ตรวจสอบหมวดหมู่
    const category = categoriesResult.data.find(cat => 
      (cat.id === id || cat.slug === id) && cat.status === 'active'
    );
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบหมวดหมู่ที่ต้องการ",
      });
    }

    let places = placesResult.data.filter(place => 
      place.category === category.id && place.status === 'published'
    );

    // Filter by search keyword
    if (search) {
      const searchLower = search.toLowerCase();
      places = places.filter(place => {
        return (
          place.name.th.toLowerCase().includes(searchLower) ||
          place.name.en.toLowerCase().includes(searchLower) ||
          place.description.th.toLowerCase().includes(searchLower) ||
          place.description.en.toLowerCase().includes(searchLower)
        );
      });
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
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
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

    // Clean data
    const cleanPlaces = paginatedPlaces.map(place => ({
      id: place.id,
      name: place.name,
      description: place.description,
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
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug
      },
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total
      }
    });

  } catch (error) {
    console.error("Error loading category places:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการโหลดสถานที่ในหมวดหมู่",
    });
  }
});

module.exports = router;