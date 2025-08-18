/**
 * Shared Route Helper Functions
 * ฟังก์ชันช่วยเหลือที่ใช้ร่วมกันระหว่างไฟล์ routes
 */

const path = require('path');
const DataManager = require('./dataManager');

const dataManager = new DataManager(path.join(__dirname, '../data'));

// ข้อความ Error และ Success Messages ที่ใช้ร่วมกัน
const COMMON_MESSAGES = {
    ERRORS: {
        LOAD_FAILED: 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
        SAVE_FAILED: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
        NOT_FOUND: 'ไม่พบข้อมูลที่ต้องการ',
        INVALID_INPUT: 'ข้อมูลไม่ถูกต้อง',
        SERVER_ERROR: 'เกิดข้อผิดพลาดของระบบ'
    },
    SUCCESS: {
        LOADED: 'โหลดข้อมูลสำเร็จ',
        SAVED: 'บันทึกข้อมูลสำเร็จ',
        CREATED: 'สร้างข้อมูลใหม่สำเร็จ',
        UPDATED: 'อัปเดตข้อมูลสำเร็จ',
        DELETED: 'ลบข้อมูลสำเร็จ'
    }
};

/**
 * สร้าง response สำหรับ error
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @param {Error} error - Optional error object for logging
 * @returns {Object} JSON response
 */
function createErrorResponse(res, status, message, error = null) {
    if (error) {
        console.error('Error:', error);
    }
    return res.status(status).json({
        success: false,
        message: message
    });
}

/**
 * สร้าง response สำหรับ success
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @param {number} status - HTTP status code (default: 200)
 * @returns {Object} JSON response
 */
function createSuccessResponse(res, data, message, status = 200) {
    return res.status(status).json({
        success: true,
        ...data,
        message: message
    });
}

/**
 * โหลดข้อมูลหมวดหมู่ทั้งหมด
 * @returns {Array} Categories data
 * @throws {Error} If loading fails
 */
async function loadCategories() {
    const result = await dataManager.getCategories();
    if (!result.success) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูลหมวดหมู่');
    }
    return result.data;
}

/**
 * โหลดข้อมูลสถานที่ทั้งหมด
 * @returns {Array} Places data
 * @throws {Error} If loading fails
 */
async function loadPlaces() {
    const result = await dataManager.getPlaces();
    if (!result.success) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่');
    }
    return result.data;
}

/**
 * หาข้อมูลตาม ID
 * @param {Array} items - Array of items to search
 * @param {string} id - ID to search for
 * @returns {Object|undefined} Found item or undefined
 */
function findById(items, id) {
    return items.find(item => item.id === id);
}

/**
 * บันทึกข้อมูลหมวดหมู่
 * @param {Array} categories - Categories data to save
 * @returns {Object} Save result
 * @throws {Error} If saving fails
 */
async function saveCategories(categories) {
    const result = await dataManager.saveCategories(categories);
    if (!result.success) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลหมวดหมู่');
    }
    return result;
}

/**
 * บันทึกข้อมูลสถานที่
 * @param {Array} places - Places data to save
 * @returns {Object} Save result
 * @throws {Error} If saving fails
 */
async function savePlaces(places) {
    const result = await dataManager.savePlaces(places);
    if (!result.success) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลสถานที่');
    }
    return result;
}

module.exports = {
    // Messages
    COMMON_MESSAGES,
    
    // Response helpers
    createErrorResponse,
    createSuccessResponse,
    
    // Data loading helpers
    loadCategories,
    loadPlaces,
    findById,
    
    // Data saving helpers
    saveCategories,
    savePlaces
};