/**
 * Categories Management Routes
 * จัดการระบบหมวดหมู่สถานที่ท่องเที่ยว
 */
const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('./auth');
const {
    createErrorResponse,
    createSuccessResponse, 
    loadCategories,
    findById,
    saveCategories,
    COMMON_MESSAGES
} = require('../utils/routeHelpers');

// Import data manager
const DataManager = require('../utils/dataManager');
const dataManager = new DataManager(path.join(__dirname, '../data'));

const router = express.Router();

// ข้อความเฉพาะหมวดหมู่
const MESSAGES = {
    ERRORS: {
        ...COMMON_MESSAGES.ERRORS,
        INVALID_NAME: 'ข้อมูลชื่อหมวดหมู่ไม่ถูกต้อง',
        REQUIRED_THAI_NAME: 'กรุณากรอกชื่อหมวดหมู่ภาษาไทย',
        REQUIRED_ICON: 'กรุณาเลือกไอคอน',
        INVALID_ORDER: 'ลำดับการแสดงต้องเป็นตัวเลขที่มากกว่า 0',
        DUPLICATE_NAME: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น',
        LOAD_FAILED: 'เกิดข้อผิดพลาดในการโหลดข้อมูลหมวดหมู่'
    },
    SUCCESS: {
        ...COMMON_MESSAGES.SUCCESS,
        CREATED: 'เพิ่มหมวดหมู่สำเร็จ',
        STATS_LOADED: 'โหลดสถิติหมวดหมู่สำเร็จ'
    }
};

/**
 * สร้าง URL slug จากชื่อภาษาไทย
 * @param {string} thaiName - ชื่อภาษาไทย
 * @returns {string} slug ที่ใช้ใน URL ได้
 */
function createSlugFromThai(thaiName) {
    if (!thaiName || typeof thaiName !== 'string') {
        return '';
    }
    
    return thaiName
        .toLowerCase()
        .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, '') // เก็บแค่ไทย อังกฤษ ตัวเลข ช่องว่าง
        .replace(/\s+/g, '-')     // แทนช่องว่างด้วย -
        .replace(/-+/g, '-')      // แทน - หลายตัวด้วย - เดียว
        .replace(/^-|-$/g, '');   // ลบ - ที่หัวท้าย
}

/**
 * นับจำนวนสถานที่ในแต่ละหมวดหมู่
 * @param {Array} categories - รายการหมวดหมู่
 * @returns {Array} หมวดหมู่พร้อมจำนวนสถานที่
 */
async function addPlaceCountToCategories(categories) {
    try {
        // โหลดข้อมูลสถานที่ทั้งหมด
        const placesResult = await dataManager.getPlaces();
        const places = placesResult.success ? placesResult.data : [];
        
        // เพิ่มจำนวนสถานที่ในแต่ละหมวดหมู่
        return categories.map(category => ({
            ...category,
            placesCount: places.filter(place => place.category === category.id).length
        }));
        
    } catch (error) {
        console.error('Error counting places:', error);
        // ในกรณีเกิดข้อผิดพลาด ให้ placesCount = 0
        return categories.map(category => ({ ...category, placesCount: 0 }));
    }
}

/**
 * ตรวจสอบความถูกต้องของข้อมูลหมวดหมู่
 * @param {Object} data - ข้อมูลหมวดหมู่ที่จะตรวจสอบ
 * @param {boolean} isUpdate - เป็นการอัปเดตหรือไม่
 * @returns {Array} รายการข้อผิดพลาด (ถ้ามี)
 */
function validateCategoryInput(data, isUpdate = false) {
    const errors = [];
    
    // ตรวจชื่อหมวดหมู่
    if (!isValidCategoryName(data.name)) {
        errors.push(MESSAGES.ERRORS.INVALID_NAME);
    } else if (!data.name.th?.trim()) {
        errors.push(MESSAGES.ERRORS.REQUIRED_THAI_NAME);
    }
    
    // ตรวจไอคอน
    if (!isValidIcon(data.icon)) {
        errors.push(MESSAGES.ERRORS.REQUIRED_ICON);
    }
    
    // ตรวจลำดับ (ถ้ามี)
    if (data.order != null && !isValidOrder(data.order)) {
        errors.push(MESSAGES.ERRORS.INVALID_ORDER);
    }
    
    return errors;
}

/**
 * ตรวจสอบความถูกต้องของชื่อหมวดหมู่
 */
function isValidCategoryName(name) {
    return name && typeof name === 'object';
}

/**
 * ตรวจสอบความถูกต้องของไอคอน
 */
function isValidIcon(icon) {
    return icon && typeof icon === 'string' && icon.trim();
}

/**
 * ตรวจสอบความถูกต้องของลำดับ
 */
function isValidOrder(order) {
    const orderNum = parseInt(order);
    return !isNaN(orderNum) && orderNum > 0;
}

// Helper functions ย้ายไปใช้ shared helpers แล้ว

/**
 * ตรวจสอบชื่อซ้ำ
 */
function isDuplicateName(categories, thaiName, excludeId = null) {
    return categories.some(cat => 
        cat.id !== excludeId && 
        cat.name.th.toLowerCase().trim() === thaiName.toLowerCase().trim()
    );
}

/**
 * สร้างออบเจกต์หมวดหมู่ใหม่
 */
function createNewCategory(categoryData, categories) {
    return {
        id: uuidv4(),
        name: {
            th: categoryData.name.th.trim(),
            en: categoryData.name.en?.trim() || '',
            zh: categoryData.name.zh?.trim() || '',
            ja: categoryData.name.ja?.trim() || ''
        },
        slug: createSlugFromThai(categoryData.name.th),
        icon: categoryData.icon.trim(),
        order: categoryData.order ? parseInt(categoryData.order) : (categories.length + 1),
        createdAt: new Date().toISOString()
    };
}

/**
 * อัปเดตข้อมูลหมวดหมู่
 */
function updateCategoryData(existingCategory, newData) {
    return {
        ...existingCategory,
        name: {
            th: newData.name.th.trim(),
            en: newData.name.en?.trim() || '',
            zh: newData.name.zh?.trim() || '',
            ja: newData.name.ja?.trim() || ''
        },
        slug: createSlugFromThai(newData.name.th),
        icon: newData.icon.trim(),
        order: newData.order ? parseInt(newData.order) : existingCategory.order,
        updatedAt: new Date().toISOString()
    };
}

// ========================= ROUTES =========================

/**
 * GET / - โหลดหมวดหมู่ทั้งหมดพร้อมจำนวนสถานที่
 */
router.get('/', requireAuth, async (req, res) => {
    try {
        const categories = await loadCategories();
        const categoriesWithCounts = await addPlaceCountToCategories(categories);
        
        return createSuccessResponse(res, 
            { categories: categoriesWithCounts }, 
            MESSAGES.SUCCESS.LOADED
        );
        
    } catch (error) {
        return createErrorResponse(res, 500, MESSAGES.ERRORS.LOAD_FAILED, error);
    }
});

/**
 * GET /stats - Get categories statistics for dashboard
 */
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const categoriesResult = await dataManager.getCategories();
        if (!categoriesResult.success) {
            return res.status(500).json({
                success: false,
                message: categoriesResult.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูลหมวดหมู่'
            });
        }
        
        const categoriesWithCounts = await addPlaceCountToCategories(categoriesResult.data);
        
        const stats = {
            totalCategories: categoriesWithCounts.length,
            categoriesWithPlaces: categoriesWithCounts.filter(cat => cat.placesCount > 0).length,
            totalPlacesInCategories: categoriesWithCounts.reduce((sum, cat) => sum + cat.placesCount, 0)
        };
        
        res.json({
            success: true,
            stats,
            categories: categoriesWithCounts,
            message: 'โหลดสถิติหมวดหมู่สำเร็จ'
        });
        
    } catch (error) {
        console.error('Error fetching categories stats:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการโหลดสถิติหมวดหมู่'
        });
    }
});

/**
 * GET /:id - โหลดหมวดหมู่ตาม ID ที่ระบุ
 */
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const categoryId = req.params.id;
        const categories = await loadCategories();
        
        // หาหมวดหมู่ตาม ID
        const category = categories.find(cat => cat.id === categoryId);
        if (!category) {
            return createErrorResponse(res, 404, MESSAGES.ERRORS.NOT_FOUND);
        }
        
        // เพิ่มจำนวนสถานที่
        const categoriesWithCounts = await addPlaceCountToCategories([category]);
        
        return createSuccessResponse(res, 
            { category: categoriesWithCounts[0] }, 
            MESSAGES.SUCCESS.LOADED
        );
        
    } catch (error) {
        return createErrorResponse(res, 500, MESSAGES.ERRORS.LOAD_FAILED, error);
    }
});

/**
 * POST / - สร้างหมวดหมู่ใหม่
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const categoryData = req.body;
        
        // ตรวจสอบข้อมูลที่ส่งมา
        const validationErrors = validateCategoryInput(categoryData);
        if (validationErrors.length > 0) {
            return createErrorResponse(res, 400, validationErrors.join(', '));
        }
        
        // โหลดหมวดหมู่ที่มีอยู่
        const categories = await loadCategories();
        
        // ตรวจสอบชื่อซ้ำ
        if (isDuplicateName(categories, categoryData.name.th)) {
            return createErrorResponse(res, 400, MESSAGES.ERRORS.DUPLICATE_NAME);
        }
        
        // สร้างและบันทึกหมวดหมู่ใหม่
        const newCategory = createNewCategory(categoryData, categories);
        categories.push(newCategory);
        
        const saveResult = await dataManager.saveCategories(categories);
        if (!saveResult.success) {
            return createErrorResponse(res, 500, saveResult.error || MESSAGES.ERRORS.SAVE_FAILED);
        }
        
        return createSuccessResponse(res, 
            { category: newCategory }, 
            MESSAGES.SUCCESS.CREATED, 
            201
        );
        
    } catch (error) {
        return createErrorResponse(res, 500, MESSAGES.ERRORS.CREATE_FAILED, error);
    }
});

/**
 * PUT /:id - อัปเดตหมวดหมู่
 */
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const categoryId = req.params.id;
        const categoryData = req.body;
        
        // ตรวจสอบข้อมูลที่ส่งมา
        const validationErrors = validateCategoryInput(categoryData, true);
        if (validationErrors.length > 0) {
            return createErrorResponse(res, 400, validationErrors.join(', '));
        }
        
        // โหลดและหาหมวดหมู่ที่จะอัปเดต
        const categories = await loadCategories();
        const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
        
        if (categoryIndex === -1) {
            return createErrorResponse(res, 404, MESSAGES.ERRORS.NOT_FOUND);
        }
        
        // ตรวจสอบชื่อซ้ำ (ยกเว้น ID ปัจจุบัน)
        if (isDuplicateName(categories, categoryData.name.th, categoryId)) {
            return createErrorResponse(res, 400, MESSAGES.ERRORS.DUPLICATE_NAME);
        }
        
        // อัปเดตและบันทึก
        const updatedCategory = updateCategoryData(categories[categoryIndex], categoryData);
        categories[categoryIndex] = updatedCategory;
        
        const saveResult = await dataManager.saveCategories(categories);
        if (!saveResult.success) {
            return createErrorResponse(res, 500, saveResult.error || MESSAGES.ERRORS.SAVE_FAILED);
        }
        
        return createSuccessResponse(res, 
            { category: updatedCategory }, 
            MESSAGES.SUCCESS.UPDATED
        );
        
    } catch (error) {
        return createErrorResponse(res, 500, MESSAGES.ERRORS.UPDATE_FAILED, error);
    }
});

// DELETE /:id - Delete category
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const categoryId = req.params.id;
        
        // Load existing categories
        const categoriesResult = await dataManager.getCategories();
        if (!categoriesResult.success) {
            return res.status(500).json({
                success: false,
                message: categoriesResult.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูลหมวดหมู่'
            });
        }
        
        const categories = categoriesResult.data;
        const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
        
        if (categoryIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบหมวดหมู่ที่ระบุ'
            });
        }
        
        const categoryToDelete = categories[categoryIndex];
        
        // Check if category has places
        const placesResult = await dataManager.getPlaces();
        if (placesResult.success) {
            const places = placesResult.data;
            const placesInCategory = places.filter(place => place.category === categoryId);
            
            if (placesInCategory.length > 0) {
                // Update places to remove category reference
                const updatedPlaces = places.map(place => {
                    if (place.category === categoryId) {
                        return {
                            ...place,
                            category: null, // or set to a default category
                            updatedAt: new Date().toISOString()
                        };
                    }
                    return place;
                });
                
                // Save updated places
                const savePlacesResult = await dataManager.savePlaces(updatedPlaces);
                if (!savePlacesResult.success) {
                    return res.status(500).json({
                        success: false,
                        message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลสถานที่ที่เกี่ยวข้อง'
                    });
                }
            }
        }
        
        // Remove category
        categories.splice(categoryIndex, 1);
        
        // Save categories
        const saveResult = await dataManager.saveCategories(categories);
        if (!saveResult.success) {
            return res.status(500).json({
                success: false,
                message: saveResult.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
            });
        }
        
        res.json({
            success: true,
            message: `ลบหมวดหมู่ "${categoryToDelete.name.th}" สำเร็จ`
        });
        
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการลบหมวดหมู่'
        });
    }
});

module.exports = router;