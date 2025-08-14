// Routes สำหรับจัดการสถานที่
const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { requireAuth } = require('./auth');
const DataManager = require('../utils/dataManager');

const router = express.Router();
const dataManager = new DataManager(path.join(__dirname, '../data'));

// GET /places - แสดงหน้ารายการสถานที่
router.get('/places', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/places-list.html'));
});

// GET /api/places - API สำหรับดึงข้อมูลสถานที่ทั้งหมด
router.get('/api/places', requireAuth, async (req, res) => {
    try {
        const result = await dataManager.getPlaces();
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่'
            });
        }

        // Sort places by creation date (newest first)
        const places = result.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            places: places
        });
    } catch (error) {
        console.error('Error loading places:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่'
        });
    }
});

// GET /api/places/:id - API สำหรับดึงข้อมูลสถานที่เฉพาะ
router.get('/api/places/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await dataManager.getPlaces();
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่'
            });
        }

        const place = result.data.find(p => p.id === id);
        
        if (!place) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบสถานที่ที่ต้องการ'
            });
        }

        res.json({
            success: true,
            place: place
        });
    } catch (error) {
        console.error('Error loading place:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่'
        });
    }
});

// DELETE /api/places/:id - API สำหรับลบสถานที่
router.delete('/api/places/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get current places
        const placesResult = await dataManager.getPlaces();
        if (!placesResult.success) {
            return res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่'
            });
        }

        const places = placesResult.data;
        const placeIndex = places.findIndex(p => p.id === id);
        
        if (placeIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบสถานที่ที่ต้องการลบ'
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
                message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
            });
        }

        // TODO: Delete associated image files
        // This would be implemented when we have the image management system

        res.json({
            success: true,
            message: 'ลบสถานที่เรียบร้อยแล้ว'
        });
    } catch (error) {
        console.error('Error deleting place:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการลบสถานที่'
        });
    }
});

// PATCH /api/places/:id/status - API สำหรับเปลี่ยนสถานะสถานที่
router.patch('/api/places/:id/status', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Validate status
        const validStatuses = ['draft', 'published', 'inactive'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'สถานะไม่ถูกต้อง'
            });
        }

        // Get current places
        const placesResult = await dataManager.getPlaces();
        if (!placesResult.success) {
            return res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่'
            });
        }

        const places = placesResult.data;
        const placeIndex = places.findIndex(p => p.id === id);
        
        if (placeIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบสถานที่ที่ต้องการแก้ไข'
            });
        }

        // Update status and timestamp
        places[placeIndex].status = status;
        places[placeIndex].updatedAt = new Date().toISOString();
        
        // Save updated places
        const saveResult = await dataManager.savePlaces(places);
        if (!saveResult.success) {
            return res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
            });
        }

        res.json({
            success: true,
            message: 'เปลี่ยนสถานะเรียบร้อยแล้ว',
            place: places[placeIndex]
        });
    } catch (error) {
        console.error('Error updating place status:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ'
        });
    }
});

// GET /places/new - แสดงหน้าฟอร์มเพิ่มสถานที่ใหม่
router.get('/places/new', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/place-form.html'));
});

// POST /api/places - API สำหรับเพิ่มสถานที่ใหม่
router.post('/api/places', requireAuth, async (req, res) => {
    try {
        const placeData = req.body;
        
        // Validate required fields
        const validation = validatePlaceData(placeData);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        // Generate unique ID
        const newPlace = {
            id: uuidv4(),
            ...placeData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: req.session.user.id
        };

        // Get current places
        const placesResult = await dataManager.getPlaces();
        if (!placesResult.success) {
            return res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่'
            });
        }

        const places = placesResult.data;
        places.push(newPlace);

        // Save updated places
        const saveResult = await dataManager.savePlaces(places);
        if (!saveResult.success) {
            return res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
            });
        }

        res.json({
            success: true,
            message: 'เพิ่มสถานที่เรียบร้อยแล้ว',
            place: newPlace
        });
    } catch (error) {
        console.error('Error creating place:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการเพิ่มสถานที่'
        });
    }
});

// PUT /api/places/:id - API สำหรับอัปเดตสถานที่
router.put('/api/places/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const placeData = req.body;
        
        // Validate required fields
        const validation = validatePlaceData(placeData);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        // Get current places
        const placesResult = await dataManager.getPlaces();
        if (!placesResult.success) {
            return res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสถานที่'
            });
        }

        const places = placesResult.data;
        const placeIndex = places.findIndex(p => p.id === id);
        
        if (placeIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบสถานที่ที่ต้องการแก้ไข'
            });
        }

        // Update place data
        const updatedPlace = {
            ...places[placeIndex],
            ...placeData,
            id: id, // Ensure ID doesn't change
            updatedAt: new Date().toISOString()
        };

        places[placeIndex] = updatedPlace;

        // Save updated places
        const saveResult = await dataManager.savePlaces(places);
        if (!saveResult.success) {
            return res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
            });
        }

        res.json({
            success: true,
            message: 'อัปเดตสถานที่เรียบร้อยแล้ว',
            place: updatedPlace
        });
    } catch (error) {
        console.error('Error updating place:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอัปเดตสถานที่'
        });
    }
});

// Validation function for place data
function validatePlaceData(data) {
    // Check required fields
    if (!data.name || !data.name.th || !data.name.th.trim()) {
        return { isValid: false, message: 'กรุณากรอกชื่อสถานที่ภาษาไทย' };
    }

    if (!data.description || !data.description.th || !data.description.th.trim()) {
        return { isValid: false, message: 'กรุณากรอกคำอธิบายภาษาไทย' };
    }

    if (!data.category || !data.category.trim()) {
        return { isValid: false, message: 'กรุณาเลือกหมวดหมู่' };
    }

    // Validate contact information if provided
    if (data.contact) {
        // Validate phone number format (Thai format)
        if (data.contact.phone && data.contact.phone.trim()) {
            const phonePattern = /^0[2-9]\d{1}-\d{3}-\d{4}$|^0[689]\d{1}-\d{3}-\d{4}$/;
            if (!phonePattern.test(data.contact.phone.trim())) {
                return { isValid: false, message: 'รูปแบบหมายเลขโทรศัพท์ไม่ถูกต้อง (ใช้รูปแบบ 08X-XXX-XXXX)' };
            }
        }

        // Validate website URL
        if (data.contact.website && data.contact.website.trim()) {
            try {
                const url = new URL(data.contact.website.trim());
                if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                    return { isValid: false, message: 'URL เว็บไซต์ต้องเริ่มต้นด้วย http:// หรือ https://' };
                }
            } catch (e) {
                return { isValid: false, message: 'รูปแบบ URL เว็บไซต์ไม่ถูกต้อง' };
            }
        }

        // Validate Facebook URL
        if (data.contact.facebook && data.contact.facebook.trim()) {
            const facebookPattern = /^https?:\/\/(www\.|m\.)?facebook\.com\/[a-zA-Z0-9._-]+\/?$/;
            if (!facebookPattern.test(data.contact.facebook.trim())) {
                return { isValid: false, message: 'รูปแบบลิงก์ Facebook ไม่ถูกต้อง' };
            }
        }

        // Validate Instagram URL
        if (data.contact.instagram && data.contact.instagram.trim()) {
            const instagramPattern = /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/;
            if (!instagramPattern.test(data.contact.instagram.trim())) {
                return { isValid: false, message: 'รูปแบบลิงก์ Instagram ไม่ถูกต้อง' };
            }
        }

        // Validate coordinates
        if (data.contact.coordinates) {
            const { lat, lng } = data.contact.coordinates;
            
            // Check if both coordinates are provided or both are null
            if ((lat !== null && lng === null) || (lat === null && lng !== null)) {
                return { isValid: false, message: 'กรุณากรอกพิกัดให้ครบทั้งละติจูดและลองจิจูด' };
            }
            
            // Validate coordinate ranges for Thailand
            if (lat !== null && lng !== null) {
                if (isNaN(lat) || lat < 5 || lat > 21) {
                    return { isValid: false, message: 'ละติจูดต้องอยู่ระหว่าง 5-21 (ประเทศไทย)' };
                }
                if (isNaN(lng) || lng < 97 || lng > 106) {
                    return { isValid: false, message: 'ลองจิจูดต้องอยู่ระหว่าง 97-106 (ประเทศไทย)' };
                }
            }
        }
    }

    // Validate status
    const validStatuses = ['draft', 'published', 'inactive'];
    if (data.status && !validStatuses.includes(data.status)) {
        return { isValid: false, message: 'สถานะไม่ถูกต้อง' };
    }

    return { isValid: true };
}

// GET /places/:id - แสดงหน้ารายละเอียดสถานที่
router.get('/places/:id', requireAuth, async (req, res) => {
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

        const place = result.data.find(p => p.id === id);
        
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
        console.error('Error loading place details:', error);
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
router.get('/places/:id/edit', requireAuth, async (req, res) => {
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

        const place = result.data.find(p => p.id === id);
        
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
        res.sendFile(path.join(__dirname, '../views/place-form.html'));
    } catch (error) {
        console.error('Error loading place for editing:', error);
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