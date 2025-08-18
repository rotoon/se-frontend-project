/**
 * Places Management Routes
 * จัดการระบบสถานที่ท่องเที่ยว
 */
const express = require("express");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { requireAuth } = require("./auth");
const {
  createErrorResponse,
  createSuccessResponse,
  loadPlaces,
  loadCategories,
  findById,
  savePlaces,
  COMMON_MESSAGES,
} = require("../utils/routeHelpers");
const { upload, processMultipleImages, handleUploadError } = require("../utils/uploadManager");

const router = express.Router();

// ข้อความเฉพาะสถานที่
const MESSAGES = {
  ERRORS: {
    ...COMMON_MESSAGES.ERRORS,
    CATEGORY_CHECK_FAILED: "เกิดข้อผิดพลาดในการตรวจสอบหมวดหมู่",
    CATEGORY_NOT_EXISTS: "หมวดหมู่ที่เลือกไม่มีอยู่ในระบบ",
    INVALID_STATUS:
      "สถานะไม่ถูกต้อง (ต้องเป็น draft, published, หรือ inactive)",
    INVALID_FEATURED: "ค่า featured ต้องเป็น true หรือ false",
    INVALID_PLACE_IDS: "กรุณาระบุรายการสถานที่ที่ต้องการ",
    NO_EDIT_FOUND: "ไม่พบสถานที่ที่ต้องการแก้ไข",
    NO_DELETE_FOUND: "ไม่พบสถานที่ที่ต้องการลบ",
  },
  SUCCESS: {
    ...COMMON_MESSAGES.SUCCESS,
    STATUS_UPDATED: "อัปเดตสถานะเรียบร้อยแล้ว",
  },
};

// สถานะที่อนุมัติ
const VALID_STATUSES = ["draft", "published", "inactive"];

// ========================= HELPER FUNCTIONS =========================

// Helper functions ย้ายไปใช้ shared helpers แล้ว

/**
 * หาสถานที่ตาม ID
 */
function findPlaceById(places, id) {
  return findById(places, id);
}

/**
 * หาหมวดหมู่ตาม ID
 */
function findCategoryById(categories, categoryId) {
  return findById(categories, categoryId);
}

/**
 * แปลงสถานะเป็นข้อความไทย
 */
function getStatusText(status) {
  const statusMap = {
    draft: "ร่าง",
    published: "เผยแพร่",
    inactive: "ไม่ใช้งาน",
  };
  return statusMap[status] || status;
}

/**
 * เรียงลำดับสถานที่ตามวันที่สร้าง (ใหม่สุดก่อน)
 */
function sortPlacesByCreatedDate(places) {
  return places.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * ตรวจสอบความถูกต้องของสถานะ
 */
function isValidStatus(status) {
  return !status || VALID_STATUSES.includes(status);
}

/**
 * ตรวจสอบค่า featured
 */
function isValidFeatured(featured) {
  return featured === undefined || typeof featured === "boolean";
}

// Unused helper functions removed

/**
 * Middleware สำหรับประมวลผล FormData และแปลง JSON
 */
const parseFormDataMiddleware = (req, res, next) => {
  try {
    // Parse JSON data from form
    if (req.body.data) {
      const parsedData = JSON.parse(req.body.data);
      req.body = { ...req.body, ...parsedData };
      delete req.body.data;
    }
    
    // Process uploaded images
    if (req.files && req.files.length > 0) {
      const processedImages = processMultipleImages(req.files);
      req.body.images = processedImages;
    }
    
    next();
  } catch (error) {
    console.error('Error parsing form data:', error);
    return createErrorResponse(res, 400, 'ข้อมูลฟอร์มไม่ถูกต้อง');
  }
};

/**
 * Middleware สำหรับตรวจสอบข้อมูลสถานที่
 */
const validatePlaceMiddleware = (req, res, next) => {
  const validation = validatePlaceData(req.body);
  if (!validation.isValid) {
    return createErrorResponse(res, 400, validation.message);
  }
  next();
};

/**
 * Middleware สำหรับตรวจสอบว่าหมวดหมู่มีอยู่จริงหรือไม่
 */
const validateCategoryMiddleware = async (req, res, next) => {
  try {
    // Support both category and categoryId fields
    const categoryValue = req.body.category || req.body.categoryId;
    
    // ข้ามไม่มีหมวดหมู่ ให้ผ่านไป validation หลัก
    if (!categoryValue) {
      return next();
    }

    const categories = await loadCategories();
    const categoryExists = findCategoryById(categories, categoryValue);

    if (!categoryExists) {
      return createErrorResponse(res, 400, MESSAGES.ERRORS.CATEGORY_NOT_EXISTS);
    }

    next();
  } catch (error) {
    return createErrorResponse(
      res,
      500,
      MESSAGES.ERRORS.CATEGORY_CHECK_FAILED,
      error
    );
  }
};

// ========================= ROUTES =========================

/**
 * GET / - โหลดสถานที่ทั้งหมด (เรียงตามวันที่สร้าง)
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const places = await loadPlaces();
    const sortedPlaces = sortPlacesByCreatedDate(places);

    return createSuccessResponse(
      res,
      { places: sortedPlaces },
      MESSAGES.SUCCESS.LOADED
    );
  } catch (error) {
    return createErrorResponse(res, 500, MESSAGES.ERRORS.LOAD_FAILED, error);
  }
});

/**
 * GET /:id - โหลดสถานที่ตาม ID ที่ระบุ
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const places = await loadPlaces();

    const place = findPlaceById(places, id);
    if (!place) {
      return createErrorResponse(res, 404, MESSAGES.ERRORS.NOT_FOUND);
    }

    return createSuccessResponse(
      res,
      { place: place },
      MESSAGES.SUCCESS.LOADED
    );
  } catch (error) {
    return createErrorResponse(res, 500, MESSAGES.ERRORS.LOAD_FAILED, error);
  }
});

// DELETE /api/places/:id - API สำหรับลบสถานที่
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Attempting to delete place with ID: ${id}`);

    if (!id || id.trim() === '') {
      return createErrorResponse(res, 400, "ID สถานที่ไม่ถูกต้อง");
    }

    const places = await loadPlaces();
    console.log(`Found ${places.length} places in database`);
    
    const placeIndex = places.findIndex((p) => p.id === id);
    console.log(`Place index: ${placeIndex}`);

    if (placeIndex === -1) {
      console.log(`Place with ID ${id} not found`);
      return createErrorResponse(res, 404, MESSAGES.ERRORS.NO_DELETE_FOUND);
    }

    const placeToDelete = places[placeIndex];
    console.log(`Found place to delete: ${placeToDelete.name?.th || 'Unknown'}`);

    // Remove place from array
    places.splice(placeIndex, 1);
    console.log(`Removed place from array. New array length: ${places.length}`);

    // Save updated places first
    await savePlaces(places);
    console.log('Successfully saved updated places array');

    // Handle cascading deletes - delete associated image files
    if (placeToDelete.images && placeToDelete.images.length > 0) {
      console.log(`Place has ${placeToDelete.images.length} images to delete`);
      const { deleteMultipleImages } = require("../utils/uploadManager");
      
      try {
        // Extract filenames from image objects
        const imageFilenames = placeToDelete.images
          .filter(image => image && (image.filename || typeof image === 'string'))
          .map(image => typeof image === 'string' ? image : image.filename);
        
        console.log(`Extracted ${imageFilenames.length} filenames:`, imageFilenames);
        
        if (imageFilenames.length > 0) {
          await deleteMultipleImages(imageFilenames);
          console.log(`Successfully deleted ${imageFilenames.length} image files for place ${id}`);
        }
      } catch (error) {
        // Log error but don't fail the deletion if image cleanup fails
        console.warn(
          `Could not delete image files for place ${id}:`,
          error.message
        );
      }
    } else {
      console.log('No images to delete for this place');
    }

    console.log(`Successfully deleted place ${id}`);
    return createSuccessResponse(
      res,
      { deletedId: id },
      "ลบสถานที่เรียบร้อยแล้ว"
    );
  } catch (error) {
    console.error("Error deleting place:", error);
    console.error("Error stack:", error.stack);
    return createErrorResponse(
      res,
      500,
      "เกิดข้อผิดพลาดในการลบสถานที่",
      error
    );
  }
});

/**
 * PATCH /api/places/:id/status - เปลี่ยนสถานะสถานที่
 */
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, featured } = req.body;

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!isValidStatus(status)) {
      return createErrorResponse(res, 400, MESSAGES.ERRORS.INVALID_STATUS);
    }

    if (!isValidFeatured(featured)) {
      return createErrorResponse(res, 400, MESSAGES.ERRORS.INVALID_FEATURED);
    }

    const places = await loadPlaces();
    const placeIndex = places.findIndex((p) => p.id === id);

    if (placeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบสถานที่ที่ต้องการแก้ไข",
      });
    }

    // Update status and/or featured flag with timestamp
    const updates = {
      updatedAt: new Date().toISOString(),
    };

    if (status) {
      updates.status = status;
    }

    if (featured !== undefined) {
      updates.featured = featured;
    }

    // Track status history if status is changing
    if (status && places[placeIndex].status !== status) {
      if (!places[placeIndex].statusHistory) {
        places[placeIndex].statusHistory = [];
      }
      places[placeIndex].statusHistory.push({
        from: places[placeIndex].status,
        to: status,
        changedAt: new Date().toISOString(),
        changedBy: req.user.id,
      });
    }

    // Apply updates
    Object.assign(places[placeIndex], updates);

    // Save updated places
    await savePlaces(places);

    // Create response message
    let message = "อัปเดตสถานะเรียบร้อยแล้ว";
    if (status && featured !== undefined) {
      message = `เปลี่ยนสถานะเป็น ${getStatusText(status)} และ${
        featured ? "ตั้งเป็นสถานที่เด่น" : "ยกเลิกสถานที่เด่น"
      }เรียบร้อยแล้ว`;
    } else if (status) {
      message = `เปลี่ยนสถานะเป็น ${getStatusText(status)} เรียบร้อยแล้ว`;
    } else if (featured !== undefined) {
      message = `${
        featured ? "ตั้งเป็นสถานที่เด่น" : "ยกเลิกสถานที่เด่น"
      }เรียบร้อยแล้ว`;
    }

    res.json({
      success: true,
      message: message,
      place: places[placeIndex],
    });
  } catch (error) {
    console.error("Error updating place status:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ",
    });
  }
});

// DELETE /api/places/bulk/delete - API สำหรับลบหลายสถานที่พร้อมกัน
router.delete("/bulk/delete", requireAuth, async (req, res) => {
  try {
    const { placeIds } = req.body;

    // Validate input
    if (!Array.isArray(placeIds) || placeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุรายการสถานที่ที่ต้องการลบ",
      });
    }

    const places = await loadPlaces();
    let deletedCount = 0;
    const notFoundIds = [];
    const deletedPlaces = [];

    // Find places to delete and collect their information
    placeIds.forEach((id) => {
      const placeIndex = places.findIndex((p) => p.id === id);
      if (placeIndex !== -1) {
        deletedPlaces.push(places[placeIndex]);
        places.splice(placeIndex, 1);
        deletedCount++;
      } else {
        notFoundIds.push(id);
      }
    });

    // Save updated places
    await savePlaces(places);

    // Handle cascading deletes - delete associated image files for all deleted places
    const fs = require("fs").promises;
    const path = require("path");

    for (const place of deletedPlaces) {
      if (place.images && place.images.length > 0) {
        for (const image of place.images) {
          try {
            const imagePath = path.join(
              __dirname,
              "../public/uploads",
              image.filename
            );
            await fs.unlink(imagePath);
            console.log(
              `Deleted image file: ${image.filename} for place: ${place.name.th}`
            );
          } catch (error) {
            // Log error but don't fail the deletion if image file doesn't exist
            console.warn(
              `Could not delete image file ${image.filename} for place ${place.name.th}:`,
              error.message
            );
          }
        }
      }
    }

    // Create response message
    let message = `ลบสถานที่ ${deletedCount} รายการเรียบร้อยแล้ว`;
    if (notFoundIds.length > 0) {
      message += ` (ไม่พบสถานที่ ${notFoundIds.length} รายการ)`;
    }

    res.json({
      success: true,
      message: message,
      deletedCount: deletedCount,
      notFoundIds: notFoundIds,
    });
  } catch (error) {
    console.error("Error bulk deleting places:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบสถานที่",
    });
  }
});

// PATCH /api/places/bulk/status - API สำหรับเปลี่ยนสถานะหลายสถานที่พร้อมกัน
router.patch("/bulk/status", requireAuth, async (req, res) => {
  try {
    const { placeIds, status, featured } = req.body;

    // Validate input
    if (!Array.isArray(placeIds) || placeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุรายการสถานที่ที่ต้องการอัปเดต",
      });
    }

    // Validate status
    const validStatuses = ["draft", "published", "inactive"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "สถานะไม่ถูกต้อง (ต้องเป็น draft, published, หรือ inactive)",
      });
    }

    // Validate featured flag
    if (featured !== undefined && typeof featured !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "ค่า featured ต้องเป็น true หรือ false",
      });
    }

    const places = await loadPlaces();
    let updatedCount = 0;
    const notFoundIds = [];

    // Update each place
    placeIds.forEach((id) => {
      const placeIndex = places.findIndex((p) => p.id === id);
      if (placeIndex !== -1) {
        const updates = {
          updatedAt: new Date().toISOString(),
        };

        // Track status history if status is changing
        if (status && places[placeIndex].status !== status) {
          if (!places[placeIndex].statusHistory) {
            places[placeIndex].statusHistory = [];
          }
          places[placeIndex].statusHistory.push({
            from: places[placeIndex].status,
            to: status,
            changedAt: new Date().toISOString(),
            changedBy: req.user.id,
          });
          updates.status = status;
        }

        if (featured !== undefined) {
          updates.featured = featured;
        }

        Object.assign(places[placeIndex], updates);
        updatedCount++;
      } else {
        notFoundIds.push(id);
      }
    });

    // Save updated places
    await savePlaces(places);

    // Create response message
    let message = `อัปเดตสถานที่ ${updatedCount} รายการเรียบร้อยแล้ว`;
    if (notFoundIds.length > 0) {
      message += ` (ไม่พบสถานที่ ${notFoundIds.length} รายการ)`;
    }

    res.json({
      success: true,
      message: message,
      updatedCount: updatedCount,
      notFoundIds: notFoundIds,
    });
  } catch (error) {
    console.error("Error bulk updating place status:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ",
    });
  }
});

// GET /api/places/stats - API สำหรับดึงสถิติสถานที่
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const places = await loadPlaces();

    // Calculate statistics
    const stats = {
      total: places.length,
      byStatus: {
        draft: places.filter((p) => p.status === "draft").length,
        published: places.filter((p) => p.status === "published").length,
        inactive: places.filter((p) => p.status === "inactive").length,
      },
      featured: places.filter((p) => p.featured === true).length,
      byCategory: {},
    };

    // Get category statistics
    const categories = await loadCategories();
    categories.forEach((category) => {
      stats.byCategory[category.id] = {
        name: category.name.th,
        count: places.filter((p) => p.category === category.id).length,
      };
    });

    // Recent activity (places created in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    stats.recentlyCreated = places.filter(
      (p) => new Date(p.createdAt) > sevenDaysAgo
    ).length;

    // Recently updated (places updated in last 7 days)
    stats.recentlyUpdated = places.filter(
      (p) => new Date(p.updatedAt) > sevenDaysAgo
    ).length;

    res.json({
      success: true,
      stats: stats,
    });
  } catch (error) {
    console.error("Error getting place statistics:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงสถิติ",
    });
  }
});

// GET /api/places/search - API สำหรับค้นหาสถานที่
router.get("/search", requireAuth, async (req, res) => {
  try {
    const { q, category, status, featured, limit = 50, offset = 0 } = req.query;

    let places = await loadPlaces();

    // Apply filters
    if (q && q.trim()) {
      const searchTerm = q.trim().toLowerCase();
      places = places.filter((place) => {
        return (
          (place.name.th && place.name.th.toLowerCase().includes(searchTerm)) ||
          (place.name.en && place.name.en.toLowerCase().includes(searchTerm)) ||
          (place.description.th &&
            place.description.th.toLowerCase().includes(searchTerm)) ||
          (place.description.en &&
            place.description.en.toLowerCase().includes(searchTerm))
        );
      });
    }

    if (category && category.trim()) {
      places = places.filter((place) => place.category === category.trim());
    }

    if (status && status.trim()) {
      places = places.filter((place) => place.status === status.trim());
    }

    if (featured !== undefined) {
      const isFeatured = featured === "true";
      places = places.filter((place) => place.featured === isFeatured);
    }

    // Sort by creation date (newest first)
    places.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const total = places.length;
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedPlaces = places.slice(startIndex, endIndex);

    res.json({
      success: true,
      places: paginatedPlaces,
      pagination: {
        total: total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: endIndex < total,
      },
    });
  } catch (error) {
    console.error("Error searching places:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการค้นหาสถานที่",
    });
  }
});

// GET /api/places/:id/history - API สำหรับดึงประวัติการเปลี่ยนแปลงสถานะ
router.get("/:id/history", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const places = await loadPlaces();
    const place = places.find((p) => p.id === id);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบสถานที่ที่ต้องการ",
      });
    }

    // Get status history with Thai translations
    const history = (place.statusHistory || []).map((entry) => ({
      ...entry,
      fromText: getStatusText(entry.from),
      toText: getStatusText(entry.to),
    }));

    res.json({
      success: true,
      history: history,
      currentStatus: place.status,
      currentStatusText: getStatusText(place.status),
    });
  } catch (error) {
    console.error("Error loading place history:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการโหลดประวัติ",
    });
  }
});

// ฟังก์ชัน getStatusText ย้ายไปข้างบนแล้ว

// GET /places/new - แสดงหน้าฟอร์มเพิ่มสถานที่ใหม่
router.get("/places/new", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/place-form.html"));
});

// POST /api/places - API สำหรับเพิ่มสถานที่ใหม่
router.post(
  "/",
  requireAuth,
  upload.array('images', 10), // Allow up to 10 images
  parseFormDataMiddleware,
  validatePlaceMiddleware,
  validateCategoryMiddleware,
  handleUploadError,
  async (req, res) => {
    try {
      const placeData = req.body;

      // Process contact information from flat structure
      const contact = {
        address: placeData.address || "",
        phone: placeData.phone || "",
        website: placeData.website || "",
        facebook: placeData.facebook || "",
        instagram: placeData.instagram || "",
        coordinates: placeData.coordinates || { lat: null, lng: null },
      };

      // Generate unique ID and set defaults
      const newPlace = {
        id: uuidv4(),
        name: placeData.name || { th: "", en: "", zh: "", ja: "" },
        description: placeData.description || {
          th: "",
          en: "",
          zh: "",
          ja: "",
        },
        category: placeData.category || placeData.categoryId || "",
        images: placeData.images || [],
        contact: contact,
        hours: placeData.hours || "",
        priceRange: placeData.priceRange || "",
        status: placeData.status || "draft", // Default to draft
        featured: placeData.featured || false, // Default to not featured
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: req.user.id,
      };

      const places = await loadPlaces();
      places.push(newPlace);

      // Save updated places
      await savePlaces(places);

      res.json({
        success: true,
        message: "เพิ่มสถานที่เรียบร้อยแล้ว",
        place: newPlace,
      });
    } catch (error) {
      console.error("Error creating place:", error);
      res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการเพิ่มสถานที่",
      });
    }
  }
);

// PUT /api/places/:id - API สำหรับอัปเดตสถานที่
router.put(
  "/:id",
  requireAuth,
  upload.array('images', 10), // Allow up to 10 images
  parseFormDataMiddleware,
  validatePlaceMiddleware,
  validateCategoryMiddleware,
  handleUploadError,
  async (req, res) => {
    try {
      const { id } = req.params;
      const placeData = req.body;

      const places = await loadPlaces();
      const placeIndex = places.findIndex((p) => p.id === id);

      if (placeIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "ไม่พบสถานที่ที่ต้องการแก้ไข",
        });
      }

      // Normalize categoryId to category for storage consistency
      if (placeData.categoryId && !placeData.category) {
        placeData.category = placeData.categoryId;
        delete placeData.categoryId;
      }

      // Process contact information from flat structure if provided
      const existingContact = places[placeIndex].contact || {};
      const contact = {
        address: placeData.address !== undefined ? placeData.address : existingContact.address,
        phone: placeData.phone !== undefined ? placeData.phone : existingContact.phone,
        website: placeData.website !== undefined ? placeData.website : existingContact.website,
        facebook: placeData.facebook !== undefined ? placeData.facebook : existingContact.facebook,
        instagram: placeData.instagram !== undefined ? placeData.instagram : existingContact.instagram,
        coordinates: placeData.coordinates !== undefined ? placeData.coordinates : existingContact.coordinates,
      };

      // Clean up flat contact fields from placeData
      const cleanedPlaceData = { ...placeData };
      delete cleanedPlaceData.address;
      delete cleanedPlaceData.phone;
      delete cleanedPlaceData.website;
      delete cleanedPlaceData.facebook;
      delete cleanedPlaceData.instagram;
      delete cleanedPlaceData.coordinates;

      // Update place data
      const updatedPlace = {
        ...places[placeIndex],
        ...cleanedPlaceData,
        contact: contact,
        id: id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString(),
      };

      places[placeIndex] = updatedPlace;

      // Save updated places
      await savePlaces(places);

      res.json({
        success: true,
        message: "อัปเดตสถานที่เรียบร้อยแล้ว",
        place: updatedPlace,
      });
    } catch (error) {
      console.error("Error updating place:", error);
      res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการอัปเดตสถานที่",
      });
    }
  }
);

// Helper validation functions
function validatePhoneNumber(phone) {
  if (!phone || !phone.trim()) return true; // Optional field
  const phonePattern = /^0[2-9]\d{1}-\d{3}-\d{4}$|^0[689]\d{1}-\d{3}-\d{4}$/;
  return phonePattern.test(phone.trim());
}

function validateUrl(url) {
  if (!url || !url.trim()) return true; // Optional field
  try {
    const urlObj = new URL(url.trim());
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch (e) {
    return false;
  }
}

function validateFacebookUrl(url) {
  if (!url || !url.trim()) return true; // Optional field
  const facebookPattern =
    /^https?:\/\/(www\.|m\.)?facebook\.com\/[a-zA-Z0-9._-]+\/?$/;
  return facebookPattern.test(url.trim());
}

function validateInstagramUrl(url) {
  if (!url || !url.trim()) return true; // Optional field
  const instagramPattern =
    /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/;
  return instagramPattern.test(url.trim());
}

function validateCoordinates(lat, lng) {
  // Both must be provided or both must be null/undefined
  if (
    (lat !== null &&
      lat !== undefined &&
      (lng === null || lng === undefined)) ||
    (lng !== null && lng !== undefined && (lat === null || lat === undefined))
  ) {
    return {
      isValid: false,
      message: "กรุณากรอกพิกัดให้ครบทั้งละติจูดและลองจิจูด",
    };
  }

  // If both are provided, validate ranges for Thailand
  if (lat !== null && lat !== undefined && lng !== null && lng !== undefined) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || latNum < 5 || latNum > 21) {
      return {
        isValid: false,
        message: "ละติจูดต้องอยู่ระหว่าง 5-21 (ประเทศไทย)",
      };
    }
    if (isNaN(lngNum) || lngNum < 97 || lngNum > 106) {
      return {
        isValid: false,
        message: "ลองจิจูดต้องอยู่ระหว่าง 97-106 (ประเทศไทย)",
      };
    }
  }

  return { isValid: true };
}

// Comprehensive validation function for place data
function validatePlaceData(data) {
  const errors = [];

  // Check required fields - Thai language is mandatory
  if (!data.name || !data.name.th || !data.name.th.trim()) {
    errors.push("กรุณากรอกชื่อสถานที่ภาษาไทย");
  }

  if (
    !data.description ||
    !data.description.th ||
    !data.description.th.trim()
  ) {
    errors.push("กรุณากรอกคำอธิบายภาษาไทย");
  }

  // Check for category (support both category and categoryId fields)
  const categoryValue = data.category || data.categoryId;
  if (!categoryValue || !categoryValue.trim()) {
    errors.push("กรุณาเลือกหมวดหมู่");
  }

  // Validate multilingual content structure
  if (data.name) {
    const requiredLanguages = ["th", "en", "zh", "ja"];
    requiredLanguages.forEach((lang) => {
      if (data.name[lang] && typeof data.name[lang] !== "string") {
        errors.push(`ชื่อสถานที่ภาษา ${lang} ต้องเป็นข้อความ`);
      }
    });
  }

  if (data.description) {
    const requiredLanguages = ["th", "en", "zh", "ja"];
    requiredLanguages.forEach((lang) => {
      if (
        data.description[lang] &&
        typeof data.description[lang] !== "string"
      ) {
        errors.push(`คำอธิบายภาษา ${lang} ต้องเป็นข้อความ`);
      }
    });
  }

  // Validate contact information if provided
  if (data.contact) {
    // Validate address
    if (data.contact.address && typeof data.contact.address !== "string") {
      errors.push("ที่อยู่ต้องเป็นข้อความ");
    }

    // Validate phone number format (Thai format)
    if (!validatePhoneNumber(data.contact.phone)) {
      errors.push(
        "รูปแบบหมายเลขโทรศัพท์ไม่ถูกต้อง (ใช้รูปแบบ 08X-XXX-XXXX หรือ 02X-XXX-XXXX)"
      );
    }

    // Validate website URL
    if (!validateUrl(data.contact.website)) {
      errors.push(
        "รูปแบบ URL เว็บไซต์ไม่ถูกต้อง (ต้องเริ่มต้นด้วย http:// หรือ https://)"
      );
    }

    // Validate Facebook URL
    if (!validateFacebookUrl(data.contact.facebook)) {
      errors.push(
        "รูปแบบลิงก์ Facebook ไม่ถูกต้อง (ต้องเป็น https://facebook.com/username)"
      );
    }

    // Validate Instagram URL
    if (!validateInstagramUrl(data.contact.instagram)) {
      errors.push(
        "รูปแบบลิงก์ Instagram ไม่ถูกต้อง (ต้องเป็น https://instagram.com/username)"
      );
    }

    // Validate coordinates
    if (data.contact.coordinates) {
      const { lat, lng } = data.contact.coordinates;
      const coordValidation = validateCoordinates(lat, lng);
      if (!coordValidation.isValid) {
        errors.push(coordValidation.message);
      }
    }
  }

  // Validate hours format
  if (data.hours && typeof data.hours !== "string") {
    errors.push("เวลาทำการต้องเป็นข้อความ");
  }

  // Validate price range
  if (data.priceRange && typeof data.priceRange !== "string") {
    errors.push("ช่วงราคาต้องเป็นข้อความ");
  }

  // Validate status
  const validStatuses = ["draft", "published", "inactive"];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push("สถานะไม่ถูกต้อง (ต้องเป็น draft, published, หรือ inactive)");
  }

  // Validate featured flag
  if (data.featured !== undefined && typeof data.featured !== "boolean") {
    errors.push("ค่า featured ต้องเป็น true หรือ false");
  }

  // Validate images array
  if (data.images && !Array.isArray(data.images)) {
    errors.push("รายการรูปภาพต้องเป็น array");
  } else if (data.images) {
    data.images.forEach((image, index) => {
      if (!image.filename || typeof image.filename !== "string") {
        errors.push(`รูปภาพที่ ${index + 1}: ต้องมีชื่อไฟล์`);
      }
      if (image.featured !== undefined && typeof image.featured !== "boolean") {
        errors.push(
          `รูปภาพที่ ${index + 1}: ค่า featured ต้องเป็น true หรือ false`
        );
      }
    });
  }

  // Return validation result
  if (errors.length > 0) {
    return {
      isValid: false,
      message: errors.join(", "),
      errors: errors,
    };
  }

  return { isValid: true };
}

// GET /places/:id - แสดงหน้ารายละเอียดสถานที่
router.get("/places/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const places = await loadPlaces();

    if (!places) {
      return res.status(500).send(`
                <html>
                <head><title>เกิดข้อผิดพลาด</title></head>
                <body>
                    <h1>เกิดข้อผิดพลาด</h1>
                    <p>ไม่สามารถโหลดข้อมูลสถานที่ได้</p>
                    <a href="/places">กลับไปยังรายการสถานที่</a>
                </body>
                </html>
            `);
    }

    const place = places.find((p) => p.id === id);

    if (!place) {
      return res.status(404).send(`
                <html>
                <head><title>ไม่พบสถานที่</title></head>
                <body>
                    <h1>ไม่พบสถานที่</h1>
                    <p>ไม่พบสถานที่ที่ต้องการ</p>
                    <a href="/places">กลับไปยังรายการสถานที่</a>
                </body>
                </html>
            `);
    }

    // For now, redirect to edit page since we don't have a dedicated details view yet
    // This will be properly implemented in task 7
    res.redirect(`/places/${id}/edit`);
  } catch (error) {
    console.error("Error loading place details:", error);
    res.status(500).send(`
            <html>
            <head><title>เกิดข้อผิดพลาด</title></head>
            <body>
                <h1>เกิดข้อผิดพลาด</h1>
                <p>เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่</p>
                <a href="/places">กลับไปยังรายการสถานที่</a>
            </body>
            </html>
        `);
  }
});

// GET /places/:id/edit - แสดงหน้าฟอร์มแก้ไขสถานที่
router.get("/places/:id/edit", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const places = await loadPlaces();

    if (!places) {
      return res.status(500).send(`
                <html>
                <head><title>เกิดข้อผิดพลาด</title></head>
                <body>
                    <h1>เกิดข้อผิดพลาด</h1>
                    <p>ไม่สามารถโหลดข้อมูลสถานที่ได้</p>
                    <a href="/places">กลับไปยังรายการสถานที่</a>
                </body>
                </html>
            `);
    }

    const place = places.find((p) => p.id === id);

    if (!place) {
      return res.status(404).send(`
                <html>
                <head><title>ไม่พบสถานที่</title></head>
                <body>
                    <h1>ไม่พบสถานที่</h1>
                    <p>ไม่พบสถานที่ที่ต้องการแก้ไข</p>
                    <a href="/places">กลับไปยังรายการสถานที่</a>
                </body>
                </html>
            `);
    }

    // Use the place form for editing
    res.sendFile(path.join(__dirname, "../views/place-form.html"));
  } catch (error) {
    console.error("Error loading place for editing:", error);
    res.status(500).send(`
            <html>
            <head><title>เกิดข้อผิดพลาด</title></head>
            <body>
                <h1>เกิดข้อผิดพลาด</h1>
                <p>เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่</p>
                <a href="/places">กลับไปยังรายการสถานที่</a>
            </body>
            </html>
        `);
  }
});

module.exports = router;
