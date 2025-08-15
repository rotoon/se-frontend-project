// Routes สำหรับจัดการสถานที่
const express = require("express");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { requireAuth } = require("./auth");
const DataManager = require("../utils/dataManager");

const router = express.Router();
const dataManager = new DataManager(path.join(__dirname, "../data"));

// Middleware to validate place data
const validatePlaceMiddleware = (req, res, next) => {
  const validation = validatePlaceData(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
      errors: validation.errors || [validation.message],
    });
  }
  next();
};

// Middleware to check if category exists
const validateCategoryMiddleware = async (req, res, next) => {
  try {
    if (!req.body.category) {
      return next(); // Skip if no category provided (will be caught by main validation)
    }

    const categoriesResult = await dataManager.getCategories();
    if (!categoriesResult.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการตรวจสอบหมวดหมู่",
      });
    }

    const categoryExists = categoriesResult.data.some(
      (cat) => cat.id === req.body.category
    );
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "หมวดหมู่ที่เลือกไม่มีอยู่ในระบบ",
      });
    }

    next();
  } catch (error) {
    console.error("Error validating category:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการตรวจสอบหมวดหมู่",
    });
  }
};

// GET /places - แสดงหน้ารายการสถานที่
router.get("/places", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/places-list.html"));
});

// GET /api/places - API สำหรับดึงข้อมูลสถานที่ทั้งหมด
router.get("/api/places", requireAuth, async (req, res) => {
  try {
    const result = await dataManager.getPlaces();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่",
      });
    }

    // Sort places by creation date (newest first)
    const places = result.data.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      success: true,
      places: places,
    });
  } catch (error) {
    console.error("Error loading places:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่",
    });
  }
});

// GET /api/places/:id - API สำหรับดึงข้อมูลสถานที่เฉพาะ
router.get("/api/places/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dataManager.getPlaces();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่",
      });
    }

    const place = result.data.find((p) => p.id === id);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบสถานที่ที่ต้องการ",
      });
    }

    res.json({
      success: true,
      place: place,
    });
  } catch (error) {
    console.error("Error loading place:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่",
    });
  }
});

// DELETE /api/places/:id - API สำหรับลบสถานที่
router.delete("/api/places/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get current places
    const placesResult = await dataManager.getPlaces();
    if (!placesResult.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่",
      });
    }

    const places = placesResult.data;
    const placeIndex = places.findIndex((p) => p.id === id);

    if (placeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบสถานที่ที่ต้องการลบ",
      });
    }

    const placeToDelete = places[placeIndex];

    // Remove place from array
    places.splice(placeIndex, 1);

    // Save updated places
    const saveResult = await dataManager.savePlaces(places);
    if (!saveResult.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      });
    }

    // Handle cascading deletes - delete associated image files
    if (placeToDelete.images && placeToDelete.images.length > 0) {
      const fs = require("fs").promises;
      const path = require("path");

      // Delete each image file
      for (const image of placeToDelete.images) {
        try {
          const imagePath = path.join(
            __dirname,
            "../public/uploads",
            image.filename
          );
          await fs.unlink(imagePath);
          console.log(`Deleted image file: ${image.filename}`);
        } catch (error) {
          // Log error but don't fail the deletion if image file doesn't exist
          console.warn(
            `Could not delete image file ${image.filename}:`,
            error.message
          );
        }
      }
    }

    res.json({
      success: true,
      message: "ลบสถานที่เรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("Error deleting place:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการลบสถานที่",
    });
  }
});

// PATCH /api/places/:id/status - API สำหรับเปลี่ยนสถานะสถานที่
router.patch("/api/places/:id/status", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, featured } = req.body;

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

    // Get current places
    const placesResult = await dataManager.getPlaces();
    if (!placesResult.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่",
      });
    }

    const places = placesResult.data;
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
        changedBy: req.session.user.id,
      });
    }

    // Apply updates
    Object.assign(places[placeIndex], updates);

    // Save updated places
    const saveResult = await dataManager.savePlaces(places);
    if (!saveResult.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      });
    }

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
router.delete("/api/places/bulk/delete", requireAuth, async (req, res) => {
  try {
    const { placeIds } = req.body;

    // Validate input
    if (!Array.isArray(placeIds) || placeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุรายการสถานที่ที่ต้องการลบ",
      });
    }

    // Get current places
    const placesResult = await dataManager.getPlaces();
    if (!placesResult.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่",
      });
    }

    const places = placesResult.data;
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
    const saveResult = await dataManager.savePlaces(places);
    if (!saveResult.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      });
    }

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
router.patch("/api/places/bulk/status", requireAuth, async (req, res) => {
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

    // Get current places
    const placesResult = await dataManager.getPlaces();
    if (!placesResult.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่",
      });
    }

    const places = placesResult.data;
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
            changedBy: req.session.user.id,
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
    const saveResult = await dataManager.savePlaces(places);
    if (!saveResult.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      });
    }

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
router.get("/api/places/stats", requireAuth, async (req, res) => {
  try {
    const result = await dataManager.getPlaces();
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่",
      });
    }

    const places = result.data;

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
    const categoriesResult = await dataManager.getCategories();
    if (categoriesResult.success) {
      categoriesResult.data.forEach((category) => {
        stats.byCategory[category.id] = {
          name: category.name.th,
          count: places.filter((p) => p.category === category.id).length,
        };
      });
    }

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
router.get("/api/places/search", requireAuth, async (req, res) => {
  try {
    const { q, category, status, featured, limit = 50, offset = 0 } = req.query;

    const result = await dataManager.getPlaces();
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่",
      });
    }

    let places = result.data;

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
router.get("/api/places/:id/history", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dataManager.getPlaces();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่",
      });
    }

    const place = result.data.find((p) => p.id === id);

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

// Helper function to get status text in Thai
function getStatusText(status) {
  const statusMap = {
    draft: "ร่าง",
    published: "เผยแพร่",
    inactive: "ไม่ใช้งาน",
  };
  return statusMap[status] || status;
}

// GET /places/new - แสดงหน้าฟอร์มเพิ่มสถานที่ใหม่
router.get("/places/new", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/place-form.html"));
});

// POST /api/places - API สำหรับเพิ่มสถานที่ใหม่
router.post(
  "/api/places",
  requireAuth,
  validatePlaceMiddleware,
  validateCategoryMiddleware,
  async (req, res) => {
    try {
      const placeData = req.body;

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
        category: placeData.category || "",
        images: placeData.images || [],
        contact: {
          address: "",
          phone: "",
          website: "",
          facebook: "",
          instagram: "",
          coordinates: { lat: null, lng: null },
          ...placeData.contact,
        },
        hours: placeData.hours || "",
        priceRange: placeData.priceRange || "",
        status: placeData.status || "draft", // Default to draft
        featured: placeData.featured || false, // Default to not featured
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: req.session.user.id,
      };

      // Get current places
      const placesResult = await dataManager.getPlaces();
      if (!placesResult.success) {
        return res.status(500).json({
          success: false,
          message: "เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่",
        });
      }

      const places = placesResult.data;
      places.push(newPlace);

      // Save updated places
      const saveResult = await dataManager.savePlaces(places);
      if (!saveResult.success) {
        return res.status(500).json({
          success: false,
          message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        });
      }

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
  "/api/places/:id",
  requireAuth,
  validatePlaceMiddleware,
  validateCategoryMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const placeData = req.body;

      // Get current places
      const placesResult = await dataManager.getPlaces();
      if (!placesResult.success) {
        return res.status(500).json({
          success: false,
          message: "เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่",
        });
      }

      const places = placesResult.data;
      const placeIndex = places.findIndex((p) => p.id === id);

      if (placeIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "ไม่พบสถานที่ที่ต้องการแก้ไข",
        });
      }

      // Update place data
      const updatedPlace = {
        ...places[placeIndex],
        ...placeData,
        id: id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString(),
      };

      places[placeIndex] = updatedPlace;

      // Save updated places
      const saveResult = await dataManager.savePlaces(places);
      if (!saveResult.success) {
        return res.status(500).json({
          success: false,
          message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        });
      }

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

  if (!data.category || !data.category.trim()) {
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
    const result = await dataManager.getPlaces();

    if (!result.success) {
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

    const place = result.data.find((p) => p.id === id);

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
    const result = await dataManager.getPlaces();

    if (!result.success) {
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

    const place = result.data.find((p) => p.id === id);

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
