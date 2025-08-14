// Routes สำหรับการเข้าสู่ระบบ
const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

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

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        // For API requests, return JSON
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(401).json({ 
                success: false, 
                message: 'กรุณาเข้าสู่ระบบ',
                redirect: '/login'
            });
        }
        // For regular requests, redirect to login
        return res.redirect('/login?error=' + encodeURIComponent('กรุณาเข้าสู่ระบบ'));
    }
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
        
        // Create session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };
        
        // Set session options
        if (remember) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        } else {
            req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
        }
        
        res.json({
            success: true,
            message: 'เข้าสู่ระบบสำเร็จ',
            redirect: '/dashboard',
            user: {
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง'
        });
    }
});

// POST /logout - Process logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการออกจากระบบ'
            });
        }
        
        res.clearCookie('connect.sid'); // Clear session cookie
        
        // For API requests
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({
                success: true,
                message: 'ออกจากระบบสำเร็จ',
                redirect: '/login'
            });
        }
        
        // For regular requests
        res.redirect('/login');
    });
});

// GET /logout - Handle GET logout requests
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// Export middleware and router
module.exports = {
    router,
    requireAuth
};