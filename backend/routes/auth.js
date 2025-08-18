// Routes สำหรับการเข้าสู่ระบบ - JWT Based
// ใช้ JWT Token แทน Session-based authentication
const express = require('express');
const bcrypt = require('bcrypt'); // สำหรับเข้ารหัสรหัสผ่าน
const jwt = require('jsonwebtoken'); // สำหรับสร้าง JWT Token
const fs = require('fs').promises; // สำหรับอ่าน/เขียนไฟล์
const path = require('path');
const router = express.Router();

// ตั้งค่า JWT - เปลี่ยน JWT_SECRET ในการใช้งานจริง
const JWT_SECRET = process.env.JWT_SECRET || 'chiang-mai-admin-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// ที่อยู่ไฟล์ข้อมูลผู้ใช้
const USERS_FILE = path.join(__dirname, '../data/users.json');

// ฟังก์ชันอ่านข้อมูลผู้ใช้จากไฟล์ JSON
async function readUsersData() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading users data:', error);
        // สร้างผู้ใช้ admin เริ่มต้นถ้าไฟล์ไม่มี
        return [{
            id: "admin-001",
            username: "admin",
            password: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password: "password"
            email: "admin@chiangmai-admin.com",
            role: "admin",
            createdAt: new Date().toISOString()
        }];
    }
}


// ฟังก์ชันค้นหาผู้ใช้จากชื่อผู้ใช้
async function findUserByUsername(username) {
    const users = await readUsersData();
    return users.find(user => user.username === username);
}


// ฟังก์ชันช่วยเหลือสำหรับ JWT Token
function generateTokens(user) {
    const accessToken = jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            email: user.email, 
            role: user.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
        { 
            id: user.id, 
            type: 'refresh' 
        },
        JWT_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Middleware ตรวจสอบ JWT Token สำหรับ API ที่ต้องล็อกอิน
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'กรุณาเข้าสู่ระบบ',
            code: 'NO_TOKEN'
        });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token ไม่ถูกต้องหรือหมดอายุ',
            code: 'INVALID_TOKEN'
        });
    }

    // เพิ่มข้อมูลผู้ใช้ใน request เพื่อใช้ใน route อื่น
    req.user = decoded;
    next();
}


// POST /login - ประมวลผลการเข้าสู่ระบบ
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // ตรวจสอบข้อมูลที่ส่งมา
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
            });
        }
        
        // ค้นหาผู้ใช้
        const user = await findUserByUsername(username);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
            });
        }
        
        // ตรวจสอบรหัสผ่าน
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
            });
        }
        
        
        // สร้าง JWT tokens สำหรับใช้งาน
        const { accessToken, refreshToken } = generateTokens(user);
        
        res.json({
            success: true,
            message: 'เข้าสู่ระบบสำเร็จ',
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            expiresIn: JWT_EXPIRES_IN
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง'
        });
    }
});

// POST /logout - ออกจากระบบ (JWT-based)
router.post('/logout', requireAuth, (_, res) => {
    // JWT ใช้ client-side logout โดยลบ token
    // Server สามารถเพิ่ม blacklist token ได้ที่นี่
    
    res.json({
        success: true,
        message: 'ออกจากระบบสำเร็จ',
        redirect: '/login'
    });
});

// POST /refresh - ต่ออายุ JWT token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token ไม่พบ',
                code: 'NO_REFRESH_TOKEN'
            });
        }

        const decoded = verifyToken(refreshToken);
        if (!decoded || decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                message: 'Refresh token ไม่ถูกต้องหรือหมดอายุ',
                code: 'INVALID_REFRESH_TOKEN'
            });
        }

        // ค้นหาผู้ใช้จาก ID ใน refresh token
        const users = await readUsersData();
        const user = users.find(u => u.id === decoded.id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'ไม่พบผู้ใช้งาน',
                code: 'USER_NOT_FOUND'
            });
        }

        // สร้าง tokens ใหม่
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
        
        res.json({
            success: true,
            message: 'ต่ออายุ token สำเร็จ',
            accessToken,
            refreshToken: newRefreshToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            expiresIn: JWT_EXPIRES_IN
        });
        
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการต่ออายุ token',
            code: 'REFRESH_ERROR'
        });
    }
});

// GET /me - ดึงข้อมูลผู้ใช้ปัจจุบัน
router.get('/me', requireAuth, async (req, res) => {
    try {
        const users = await readUsersData();
        const user = users.find(u => u.id === req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลผู้ใช้',
                code: 'USER_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Get user info error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้',
            code: 'GET_USER_ERROR'
        });
    }
});

// ส่งออก middleware และ router เพื่อใช้ในไฟล์อื่น
module.exports = {
    router,
    requireAuth
};