const express = require('express');
const router = express.Router();
const { 
    upload, 
    deleteImage, 
    deleteMultipleImages,
    handleUploadError,
    validateImageFile,
    processMultipleImages,
    reorderImages,
    setFeaturedImage,
    updateImageAlt,
    cleanupUnusedImages
} = require('../utils/uploadManager');
const { readJSONFile, writeJSONFile } = require('../utils/jsonManager');

// Route สำหรับอัปโหลดรูปภาพ
router.post('/upload', upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'กรุณาเลือกไฟล์รูปภาพ'
            });
        }

        const processedImages = processMultipleImages(req.files);
        
        res.json({
            success: true,
            message: `อัปโหลดรูปภาพสำเร็จ ${processedImages.length} ไฟล์`,
            images: processedImages
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ'
        });
    }
}, handleUploadError);

// Route สำหรับลบรูปภาพเดี่ยว
router.delete('/delete/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        
        if (!filename) {
            return res.status(400).json({
                success: false,
                message: 'กรุณาระบุชื่อไฟล์ที่ต้องการลบ'
            });
        }

        // ตรวจสอบว่าไฟล์มีอยู่จริง
        const { fileExists } = require('../utils/uploadManager');
        if (!fileExists(filename)) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบไฟล์ที่ต้องการลบ'
            });
        }

        await deleteImage(filename);
        
        res.json({
            success: true,
            message: 'ลบรูปภาพสำเร็จ'
        });
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการลบรูปภาพ'
        });
    }
});

// Route สำหรับลบรูปภาพหลายรูป
router.delete('/delete-multiple', async (req, res) => {
    try {
        const { filenames } = req.body;
        
        if (!Array.isArray(filenames) || filenames.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'กรุณาระบุรายการไฟล์ที่ต้องการลบ'
            });
        }

        const result = await deleteMultipleImages(filenames);
        
        res.json({
            success: true,
            message: `ลบรูปภาพสำเร็จ ${filenames.length} ไฟล์`
        });
    } catch (error) {
        console.error('Delete multiple images error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการลบรูปภาพ'
        });
    }
});

// Route สำหรับจัดเรียงรูปภาพใหม่
router.put('/reorder', async (req, res) => {
    try {
        const { placeId, images, newOrder } = req.body;
        
        if (!placeId || !Array.isArray(images) || !Array.isArray(newOrder)) {
            return res.status(400).json({
                success: false,
                message: 'ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง'
            });
        }

        const reorderedImages = reorderImages(images, newOrder);
        
        // อัปเดตข้อมูลในไฟล์ JSON
        const places = await readJSONFile('places.json');
        const placeIndex = places.findIndex(place => place.id === placeId);
        
        if (placeIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลสถานที่'
            });
        }
        
        places[placeIndex].images = reorderedImages;
        places[placeIndex].updatedAt = new Date().toISOString();
        
        await writeJSONFile('places.json', places);
        
        res.json({
            success: true,
            message: 'จัดเรียงรูปภาพใหม่สำเร็จ',
            images: reorderedImages
        });
    } catch (error) {
        console.error('Reorder images error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการจัดเรียงรูปภาพ'
        });
    }
});

// Route สำหรับตั้งรูปเด่น
router.put('/set-featured', async (req, res) => {
    try {
        const { placeId, imageIndex } = req.body;
        
        if (!placeId || typeof imageIndex !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง'
            });
        }

        // อัปเดตข้อมูลในไฟล์ JSON
        const places = await readJSONFile('places.json');
        const placeIndex = places.findIndex(place => place.id === placeId);
        
        if (placeIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลสถานที่'
            });
        }
        
        if (!places[placeIndex].images || places[placeIndex].images.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'ไม่มีรูปภาพในสถานที่นี้'
            });
        }
        
        const updatedImages = setFeaturedImage(places[placeIndex].images, imageIndex);
        places[placeIndex].images = updatedImages;
        places[placeIndex].updatedAt = new Date().toISOString();
        
        await writeJSONFile('places.json', places);
        
        res.json({
            success: true,
            message: 'ตั้งรูปเด่นสำเร็จ',
            images: updatedImages
        });
    } catch (error) {
        console.error('Set featured image error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการตั้งรูปเด่น'
        });
    }
});

// Route สำหรับอัปเดต alt text
router.put('/update-alt', async (req, res) => {
    try {
        const { placeId, imageIndex, altText } = req.body;
        
        if (!placeId || typeof imageIndex !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง'
            });
        }

        // อัปเดตข้อมูลในไฟล์ JSON
        const places = await readJSONFile('places.json');
        const placeIndex = places.findIndex(place => place.id === placeId);
        
        if (placeIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลสถานที่'
            });
        }
        
        const updatedImages = updateImageAlt(places[placeIndex].images, imageIndex, altText);
        places[placeIndex].images = updatedImages;
        places[placeIndex].updatedAt = new Date().toISOString();
        
        await writeJSONFile('places.json', places);
        
        res.json({
            success: true,
            message: 'อัปเดต alt text สำเร็จ',
            images: updatedImages
        });
    } catch (error) {
        console.error('Update alt text error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการอัปเดต alt text'
        });
    }
});

// Route สำหรับทำความสะอาดรูปภาพที่ไม่ใช้
router.post('/cleanup', async (req, res) => {
    try {
        const places = await readJSONFile('places.json');
        const result = await cleanupUnusedImages(places);
        
        res.json({
            success: true,
            message: `ทำความสะอาดรูปภาพเสร็จสิ้น ลบไฟล์ที่ไม่ใช้ ${result.deletedCount} ไฟล์`,
            deletedCount: result.deletedCount,
            deletedFiles: result.deletedFiles
        });
    } catch (error) {
        console.error('Cleanup images error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการทำความสะอาดรูปภาพ'
        });
    }
});

module.exports = router;