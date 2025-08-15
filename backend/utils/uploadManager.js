const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// สร้างโฟลเดอร์ uploads หากไม่มี
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// กำหนดค่า storage สำหรับ multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // สร้างชื่อไฟล์ใหม่ด้วย UUID เพื่อป้องกันการซ้ำกัน
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

// ฟังก์ชันตรวจสอบประเภทไฟล์
const fileFilter = (req, file, cb) => {
    // ประเภทไฟล์ที่อนุญาต: JPG, PNG, WebP
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('ประเภทไฟล์ไม่ถูกต้อง กรุณาอัปโหลดไฟล์ JPG, PNG หรือ WebP เท่านั้น'), false);
    }
};

// กำหนดค่า multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // จำกัดขนาดไฟล์ 5MB
        files: 10 // จำกัดจำนวนไฟล์สูงสุด 10 ไฟล์ต่อครั้ง
    }
});

// ฟังก์ชันลบไฟล์รูปภาพ
const deleteImage = (filename) => {
    return new Promise((resolve, reject) => {
        if (!filename) {
            return resolve();
        }
        
        const filePath = path.join(uploadsDir, filename);
        
        fs.unlink(filePath, (err) => {
            if (err && err.code !== 'ENOENT') {
                // ถ้าไฟล์ไม่พบ (ENOENT) ให้ถือว่าสำเร็จ
                console.error('Error deleting file:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

// ฟังก์ชันตรวจสอบว่าไฟล์มีอยู่จริง
const fileExists = (filename) => {
    if (!filename) return false;
    const filePath = path.join(uploadsDir, filename);
    return fs.existsSync(filePath);
};

// Middleware สำหรับจัดการข้อผิดพลาดการอัปโหลด
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'ขนาดไฟล์เกินกำหนด กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB'
            });
        } else if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'จำนวนไฟล์เกินกำหนด สามารถอัปโหลดได้สูงสุด 10 ไฟล์ต่อครั้ง'
            });
        } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'พบไฟล์ที่ไม่คาดคิด กรุณาตรวจสอบชื่อฟิลด์'
            });
        }
    } else if (error.message.includes('ประเภทไฟล์ไม่ถูกต้อง')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    return res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์'
    });
};

// ฟังก์ชันตรวจสอบไฟล์เพิ่มเติม
const validateImageFile = (file) => {
    const errors = [];
    
    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
        errors.push('ประเภทไฟล์ไม่ถูกต้อง กรุณาอัปโหลดไฟล์ JPG, PNG หรือ WebP เท่านั้น');
    }
    
    // ตรวจสอบขนาดไฟล์
    if (file.size > 5 * 1024 * 1024) {
        errors.push('ขนาดไฟล์เกิน 5MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่า');
    }
    
    // ตรวจสอบชื่อไฟล์
    if (!file.originalname || file.originalname.trim() === '') {
        errors.push('ชื่อไฟล์ไม่ถูกต้อง');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

// ฟังก์ชันจัดการหลายรูปภาพ
const processMultipleImages = (files, existingImages = []) => {
    const processedImages = [];
    
    // เพิ่มรูปภาพใหม่
    if (files && files.length > 0) {
        files.forEach((file, index) => {
            const validation = validateImageFile(file);
            if (validation.isValid) {
                processedImages.push({
                    filename: file.filename,
                    originalname: file.originalname,
                    alt: file.originalname.split('.')[0], // ใช้ชื่อไฟล์เป็น alt text เริ่มต้น
                    featured: false,
                    order: existingImages.length + index,
                    size: file.size,
                    mimetype: file.mimetype
                });
            }
        });
    }
    
    return processedImages;
};

// ฟังก์ชันจัดเรียงรูปภาพใหม่
const reorderImages = (images, newOrder) => {
    if (!Array.isArray(images) || !Array.isArray(newOrder)) {
        throw new Error('ข้อมูลรูปภาพหรือลำดับใหม่ไม่ถูกต้อง');
    }
    
    // ตรวจสอบว่าลำดับใหม่มีจำนวนเท่ากับรูปภาพ
    if (images.length !== newOrder.length) {
        throw new Error('จำนวนลำดับใหม่ไม่ตรงกับจำนวนรูปภาพ');
    }
    
    const reorderedImages = [];
    newOrder.forEach((index, newIndex) => {
        if (images[index]) {
            const image = { ...images[index] };
            image.order = newIndex;
            reorderedImages.push(image);
        }
    });
    
    return reorderedImages;
};

// ฟังก์ชันตั้งรูปเด่น
const setFeaturedImage = (images, featuredIndex) => {
    if (!Array.isArray(images)) {
        throw new Error('ข้อมูลรูปภาพไม่ถูกต้อง');
    }
    
    if (featuredIndex < 0 || featuredIndex >= images.length) {
        throw new Error('ดัชนีรูปเด่นไม่ถูกต้อง');
    }
    
    // ยกเลิกการตั้งรูปเด่นทั้งหมด
    const updatedImages = images.map(image => ({
        ...image,
        featured: false
    }));
    
    // ตั้งรูปเด่นใหม่
    if (updatedImages[featuredIndex]) {
        updatedImages[featuredIndex].featured = true;
    }
    
    return updatedImages;
};

// ฟังก์ชันลบรูปภาพหลายรูป
const deleteMultipleImages = async (imagesToDelete) => {
    if (!Array.isArray(imagesToDelete)) {
        throw new Error('ข้อมูลรูปภาพที่จะลบไม่ถูกต้อง');
    }
    
    const deletePromises = imagesToDelete.map(image => {
        if (typeof image === 'string') {
            return deleteImage(image);
        } else if (image && image.filename) {
            return deleteImage(image.filename);
        }
        return Promise.resolve();
    });
    
    try {
        await Promise.all(deletePromises);
        return { success: true, message: 'ลบรูปภาพสำเร็จ' };
    } catch (error) {
        console.error('Error deleting multiple images:', error);
        throw new Error('เกิดข้อผิดพลาดในการลบรูปภาพ');
    }
};

// ฟังก์ชันอัปเดต alt text ของรูปภาพ
const updateImageAlt = (images, imageIndex, newAlt) => {
    if (!Array.isArray(images)) {
        throw new Error('ข้อมูลรูปภาพไม่ถูกต้อง');
    }
    
    if (imageIndex < 0 || imageIndex >= images.length) {
        throw new Error('ดัชนีรูปภาพไม่ถูกต้อง');
    }
    
    const updatedImages = [...images];
    if (updatedImages[imageIndex]) {
        updatedImages[imageIndex].alt = newAlt || '';
    }
    
    return updatedImages;
};

// ฟังก์ชันตรวจสอบและทำความสะอาดรูปภาพที่ไม่ใช้
const cleanupUnusedImages = async (allPlaces) => {
    try {
        // รวบรวมชื่อไฟล์ทั้งหมดที่ใช้งาน
        const usedImages = new Set();
        allPlaces.forEach(place => {
            if (place.images && Array.isArray(place.images)) {
                place.images.forEach(image => {
                    if (image.filename) {
                        usedImages.add(image.filename);
                    }
                });
            }
        });
        
        // อ่านไฟล์ทั้งหมดในโฟลเดอร์ uploads
        const uploadedFiles = fs.readdirSync(uploadsDir);
        const imagesToDelete = [];
        
        uploadedFiles.forEach(filename => {
            // ข้าม .gitkeep และไฟล์ที่ไม่ใช่รูปภาพ
            if (filename === '.gitkeep' || !filename.match(/\.(jpg|jpeg|png|webp)$/i)) {
                return;
            }
            
            if (!usedImages.has(filename)) {
                imagesToDelete.push(filename);
            }
        });
        
        // ลบไฟล์ที่ไม่ใช้
        if (imagesToDelete.length > 0) {
            await deleteMultipleImages(imagesToDelete);
            console.log(`Cleaned up ${imagesToDelete.length} unused images`);
        }
        
        return {
            success: true,
            deletedCount: imagesToDelete.length,
            deletedFiles: imagesToDelete
        };
    } catch (error) {
        console.error('Error cleaning up unused images:', error);
        throw new Error('เกิดข้อผิดพลาดในการทำความสะอาดรูปภาพ');
    }
};

module.exports = {
    upload,
    deleteImage,
    fileExists,
    uploadsDir,
    handleUploadError,
    validateImageFile,
    processMultipleImages,
    reorderImages,
    setFeaturedImage,
    deleteMultipleImages,
    updateImageAlt,
    cleanupUnusedImages
};