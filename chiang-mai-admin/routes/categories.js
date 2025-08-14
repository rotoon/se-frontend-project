// Routes สำหรับจัดการหมวดหมู่
const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const DataManager = require('../utils/dataManager');
const { requireAuth } = require('./auth');

const router = express.Router();
const dataManager = new DataManager(path.join(__dirname, '../data'));

// Helper function to generate slug from Thai name
function generateSlug(thaiName) {
    return thaiName
        .toLowerCase()
        .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, '') // Keep only Thai, English, numbers, and spaces
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to count places in each category
async function getCategoriesWithPlaceCounts(categories) {
    try {
        const placesResult = await dataManager.getPlaces();
        const places = placesResult.success ? placesResult.data : [];
        
        return categories.map(category => {
            const placesCount = places.filter(place => place.category === category.id).length;
            return {
                ...category,
                placesCount
            };
        });
    } catch (error) {
        console.error('Error counting places:', error);
        return categories.map(category => ({ ...category, placesCount: 0 }));
    }
}

// Helper function to validate category data
function validateCategoryData(data, isUpdate = false) {
    const errors = [];
    
    // Check required fields
    if (!data.name || typeof data.name !== 'object') {
        errors.push('ข้อมูลชื่อหมวดหมู่ไม่ถูกต้อง');
    } else {
        if (!data.name.th || typeof data.name.th !== 'string' || !data.name.th.trim()) {
            errors.push('กรุณากรอกชื่อหมวดหมู่ภาษาไทย');
        }
    }
    
    if (!data.icon || typeof data.icon !== 'string' || !data.icon.trim()) {
        errors.push('กรุณาเลือกไอคอน');
    }
    
    // Validate order if provided
    if (data.order !== null && data.order !== undefined) {
        const order = parseInt(data.order);
        if (isNaN(order) || order < 1) {
            errors.push('ลำดับการแสดงต้องเป็นตัวเลขที่มากกว่า 0');
        }
    }
    
    return errors;
}

// GET /categories - Show categories management page
router.get('/categories', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/categories.html'));
});

// GET /api/categories - Get all categories with place counts
router.get('/api/categories', requireAuth, async (req, res) => {
    try {
        const result = await dataManager.getCategories();
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูลหมวดหมู่'
            });
        }
        
        const categoriesWithCounts = await getCategoriesWithPlaceCounts(result.data);
        
        res.json({
            success: true,
            categories: categoriesWithCounts,
            message: 'โหลดข้อมูลหมวดหมู่สำเร็จ'
        });
        
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลหมวดหมู่'
        });
    }
});

// GET /api/categories/:id - Get specific category
router.get('/api/categories/:id', requireAuth, async (req, res) => {
    try {
        const categoryId = req.params.id;
        const result = await dataManager.getCategories();
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูลหมวดหมู่'
            });
        }
        
        const category = result.data.find(cat => cat.id === categoryId);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบหมวดหมู่ที่ระบุ'
            });
        }
        
        // Add place count
        const categoriesWithCounts = await getCategoriesWithPlaceCounts([category]);
        
        res.json({
            success: true,
            category: categoriesWithCounts[0],
            message: 'โหลดข้อมูลหมวดหมู่สำเร็จ'
        });
        
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลหมวดหมู่'
        });
    }
});

// POST /api/categories - Create new category
router.post('/api/categories', requireAuth, async (req, res) => {
    try {
        const categoryData = req.body;
        
        // Validate input data
        const validationErrors = validateCategoryData(categoryData);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: validationErrors.join(', ')
            });
        }
        
        // Load existing categories
        const result = await dataManager.getCategories();
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูลหมวดหมู่'
            });
        }
        
        const categories = result.data;
        
        // Check for duplicate Thai name
        const existingCategory = categories.find(cat => 
            cat.name.th.toLowerCase().trim() === categoryData.name.th.toLowerCase().trim()
        );
        
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น'
            });
        }
        
        // Generate new category
        const newCategory = {
            id: uuidv4(),
            name: {
                th: categoryData.name.th.trim(),
                en: categoryData.name.en ? categoryData.name.en.trim() : '',
                zh: categoryData.name.zh ? categoryData.name.zh.trim() : '',
                ja: categoryData.name.ja ? categoryData.name.ja.trim() : ''
            },
            slug: generateSlug(categoryData.name.th),
            icon: categoryData.icon.trim(),
            order: categoryData.order ? parseInt(categoryData.order) : (categories.length + 1),
            createdAt: new Date().toISOString()
        };
        
        // Add new category
        categories.push(newCategory);
        
        // Save categories
        const saveResult = await dataManager.saveCategories(categories);
        if (!saveResult.success) {
            return res.status(500).json({
                success: false,
                message: saveResult.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
            });
        }
        
        res.status(201).json({
            success: true,
            category: newCategory,
            message: 'เพิ่มหมวดหมู่สำเร็จ'
        });
        
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่'
        });
    }
});

// PUT /api/categories/:id - Update category
router.put('/api/categories/:id', requireAuth, async (req, res) => {
    try {
        const categoryId = req.params.id;
        const categoryData = req.body;
        
        // Validate input data
        const validationErrors = validateCategoryData(categoryData, true);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: validationErrors.join(', ')
            });
        }
        
        // Load existing categories
        const result = await dataManager.getCategories();
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูลหมวดหมู่'
            });
        }
        
        const categories = result.data;
        const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
        
        if (categoryIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบหมวดหมู่ที่ระบุ'
            });
        }
        
        // Check for duplicate Thai name (excluding current category)
        const existingCategory = categories.find(cat => 
            cat.id !== categoryId && 
            cat.name.th.toLowerCase().trim() === categoryData.name.th.toLowerCase().trim()
        );
        
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น'
            });
        }
        
        // Update category
        const updatedCategory = {
            ...categories[categoryIndex],
            name: {
                th: categoryData.name.th.trim(),
                en: categoryData.name.en ? categoryData.name.en.trim() : '',
                zh: categoryData.name.zh ? categoryData.name.zh.trim() : '',
                ja: categoryData.name.ja ? categoryData.name.ja.trim() : ''
            },
            slug: generateSlug(categoryData.name.th),
            icon: categoryData.icon.trim(),
            order: categoryData.order ? parseInt(categoryData.order) : categories[categoryIndex].order,
            updatedAt: new Date().toISOString()
        };
        
        categories[categoryIndex] = updatedCategory;
        
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
            category: updatedCategory,
            message: 'อัปเดตหมวดหมู่สำเร็จ'
        });
        
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอัปเดตหมวดหมู่'
        });
    }
});

// DELETE /api/categories/:id - Delete category
router.delete('/api/categories/:id', requireAuth, async (req, res) => {
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

// GET /api/categories/stats - Get categories statistics for dashboard
router.get('/api/categories/stats', requireAuth, async (req, res) => {
    try {
        const categoriesResult = await dataManager.getCategories();
        if (!categoriesResult.success) {
            return res.status(500).json({
                success: false,
                message: categoriesResult.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูลหมวดหมู่'
            });
        }
        
        const categoriesWithCounts = await getCategoriesWithPlaceCounts(categoriesResult.data);
        
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

module.exports = router;