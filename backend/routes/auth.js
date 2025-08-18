// Routes สำหรับการเข้าสู่ระบบ - JWT Based
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'chiang-mai-admin-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Path to users data file
const USERS_FILE = path.join(__dirname, '../data/users.json');

// Helper function to read users data
async function readUsersData() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading users data:', error);
        // Return default admin user if file doesn't exist
        return [{
            id: "admin-001",
            username: "admin",
            password: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password: "password"
            email: "admin@chiangmai-admin.com",
            role: "admin",
            loginAttempts: 0,
            lockUntil: null,
            lastLogin: null,
            createdAt: new Date().toISOString()
        }];
    }
}

// Helper function to write users data
async function writeUsersData(users) {
    try {
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing users data:', error);
        return false;
    }
}

// Helper function to find user by username
async function findUserByUsername(username) {
    const users = await readUsersData();
    return users.find(user => user.username === username);
}

// Helper function to check if account is locked
function isAccountLocked(user) {
    if (!user.lockUntil) return false;
    
    const lockTime = new Date(user.lockUntil);
    const now = new Date();
    
    return now < lockTime;
}

// Helper function to increment login attempts
async function incrementLoginAttempts(username) {
    const users = await readUsersData();
    const userIndex = users.findIndex(user => user.username === username);
    
    if (userIndex === -1) return false;
    
    const user = users[userIndex];
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    
    // Lock account after 5 failed attempts for 15 minutes
    if (user.loginAttempts >= 5) {
        const lockTime = new Date();
        lockTime.setMinutes(lockTime.getMinutes() + 15);
        user.lockUntil = lockTime.toISOString();
    }
    
    await writeUsersData(users);
    return user;
}

// Helper function to reset login attempts
async function resetLoginAttempts(username) {
    const users = await readUsersData();
    const userIndex = users.findIndex(user => user.username === username);
    
    if (userIndex === -1) return false;
    
    users[userIndex].loginAttempts = 0;
    users[userIndex].lockUntil = null;
    users[userIndex].lastLogin = new Date().toISOString();
    
    await writeUsersData(users);
    return true;
}

// JWT Helper Functions
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

// JWT Authentication middleware
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

    // Add user info to request
    req.user = decoded;
    next();
}

// GET /login - Show login page
router.get('/login', (req, res) => {
    // If already logged in, redirect to dashboard
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

// POST /login - Process login
router.post('/login', async (req, res) => {
    try {
        const { username, password, remember } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
            });
        }
        
        // Find user
        const user = await findUserByUsername(username);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
            });
        }
        
        // Check if account is locked
        if (isAccountLocked(user)) {
            const lockTime = new Date(user.lockUntil);
            const now = new Date();
            const minutesLeft = Math.ceil((lockTime - now) / (1000 * 60));
            
            return res.status(423).json({
                success: false,
                message: `บัญชีถูกล็อคชั่วคราว กรุณารอ ${minutesLeft} นาที`,
                attemptsLeft: 0,
                lockTime: minutesLeft
            });
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            // Increment login attempts
            const updatedUser = await incrementLoginAttempts(username);
            const attemptsLeft = 5 - (updatedUser.loginAttempts || 0);
            
            let message = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
            let lockTime = null;
            
            if (updatedUser.loginAttempts >= 5) {
                message = 'บัญชีถูกล็อคชั่วคราว 15 นาที เนื่องจากพยายามเข้าสู่ระบบผิดหลายครั้ง';
                lockTime = 15;
            }
            
            return res.status(401).json({
                success: false,
                message: message,
                attemptsLeft: Math.max(0, attemptsLeft),
                lockTime: lockTime
            });
        }
        
        // Reset login attempts on successful login
        await resetLoginAttempts(username);
        
        // Generate JWT tokens
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

// POST /logout - Process logout (JWT-based)
router.post('/logout', requireAuth, (req, res) => {
    // With JWT, logout is handled client-side by removing tokens
    // Server can optionally implement token blacklisting here
    
    res.json({
        success: true,
        message: 'ออกจากระบบสำเร็จ',
        redirect: '/login'
    });
});

// POST /refresh - Refresh JWT token
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

        // Find user by ID from refresh token
        const users = await readUsersData();
        const user = users.find(u => u.id === decoded.id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'ไม่พบผู้ใช้งาน',
                code: 'USER_NOT_FOUND'
            });
        }

        // Generate new tokens
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

// GET /me - Get current user info
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

// Export middleware and router
module.exports = {
    router,
    requireAuth
};