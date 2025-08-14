// Express.js server หลัก
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const { router: authRouter, requireAuth } = require('./routes/auth');
const categoriesRouter = require('./routes/categories');
const placesRouter = require('./routes/places');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'chiang-mai-admin-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours default
    },
    name: 'chiang-mai-admin-session'
}));

// Import data manager
const DataManager = require('./utils/dataManager');
const dataManager = new DataManager(path.join(__dirname, 'data'));

// Routes
app.use('/auth', authRouter);
app.use('/', categoriesRouter);
app.use('/', placesRouter);

// Root redirect
app.get('/', (req, res) => {
    if (req.session && req.session.user) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/login');
    }
});

// Login page route
app.get('/login', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'views/login.html'));
});

// Protected dashboard route
app.get('/dashboard', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'views/dashboard.html'));
});

// API Routes for dashboard data
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
        const placesResult = await dataManager.getPlaces();
        const categoriesResult = await dataManager.getCategories();
        
        if (!placesResult.success || !categoriesResult.success) {
            return res.status(500).json({
                success: false,
                message: 'เกิดข้อผิดพลาดในการโหลดข้อมูล'
            });
        }
        
        const places = placesResult.data;
        const categories = categoriesResult.data;
        
        // Calculate statistics
        const totalPlaces = places.length;
        const totalCategories = categories.length;
        const publishedPlaces = places.filter(place => place.status === 'published').length;
        
        // Calculate recent places (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentPlaces = places.filter(place => {
            const createdAt = new Date(place.createdAt);
            return createdAt >= sevenDaysAgo;
        }).length;
        
        // Add place counts to categories
        const categoriesWithCounts = categories.map(category => {
            const placesCount = places.filter(place => place.category === category.id).length;
            return {
                ...category,
                placesCount
            };
        });
        
        // Generate recent activity (placeholder for now)
        const recentActivity = [
            {
                message: 'ระบบเริ่มทำงาน',
                date: new Date().toISOString(),
                icon: 'power-off',
                type: 'success'
            }
        ];
        
        res.json({
            success: true,
            stats: {
                totalPlaces,
                totalCategories,
                publishedPlaces,
                recentPlaces
            },
            categories: categoriesWithCounts,
            recentActivity
        });
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสถิติ'
        });
    }
});

// API Route for user info
app.get('/api/user/info', requireAuth, (req, res) => {
    try {
        const user = req.session.user;
        res.json({
            success: true,
            user: {
                username: user.username,
                email: user.email,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Error loading user info:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในระบบ'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'ไม่พบหน้าที่ต้องการ'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Chiang Mai Admin Server running on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
    
    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('Created data directory');
    }
    
    // Ensure backups directory exists
    const backupsDir = path.join(dataDir, 'backups');
    if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
        console.log('Created backups directory');
    }
});