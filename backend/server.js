// API-only Express.js server สำหรับ Chiang Mai Admin System
const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Import CORS middleware
const corsMiddleware = require("./middleware/cors");

// Import routes
const authRouter = require("./routes/auth");
const categoriesRouter = require("./routes/categories");
const placesRouter = require("./routes/places");
const imagesRouter = require("./routes/images");

// Import Public API routes
const publicPlacesRouter = require("./routes/api/public/places");
const publicCategoriesRouter = require("./routes/api/public/categories");

// Import data manager
const DataManager = require("./utils/dataManager");
const dataManager = new DataManager(path.join(__dirname, "data"));

// CORS middleware - ต้องอยู่ก่อน middleware อื่นๆ
app.use(corsMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JWT-based authentication - no session needed
// Session middleware removed for JWT implementation

// Static files สำหรับ uploaded images เท่านั้น
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Public API Routes (ไม่ต้อง authentication)
app.use("/api/public/places", publicPlacesRouter);
app.use("/api/public/categories", publicCategoriesRouter);

// Admin API Routes (ต้อง authentication)
app.use("/api/admin/auth", authRouter.router);
app.use("/api/admin/categories", categoriesRouter);
app.use("/api/admin/places", placesRouter);
app.use("/api/admin/images", imagesRouter);

// API Route สำหรับ dashboard stats
app.get("/api/admin/dashboard/stats", authRouter.requireAuth, async (req, res) => {
  try {
    const placesResult = await dataManager.getPlaces();
    const categoriesResult = await dataManager.getCategories();

    if (!placesResult.success || !categoriesResult.success) {
      return res.status(500).json({
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      });
    }

    const places = placesResult.data;
    const categories = categoriesResult.data;

    // Calculate statistics
    const totalPlaces = places.length;
    const totalCategories = categories.length;
    const publishedPlaces = places.filter(
      (place) => place.status === "published"
    ).length;

    // Calculate recent places (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPlaces = places.filter((place) => {
      const createdAt = new Date(place.createdAt);
      return createdAt >= sevenDaysAgo;
    }).length;

    // Add place counts to categories
    const categoriesWithCounts = categories.map((category) => {
      const placesCount = places.filter(
        (place) => place.category === category.id
      ).length;
      return {
        ...category,
        placesCount,
      };
    });

    // Generate recent activity (placeholder for now)
    const recentActivity = [
      {
        message: "ระบบ API เริ่มทำงาน",
        date: new Date().toISOString(),
        icon: "power-off",
        type: "success",
      },
    ];

    res.json({
      success: true,
      stats: {
        totalPlaces,
        totalCategories,
        publishedPlaces,
        recentPlaces,
      },
      categories: categoriesWithCounts,
      recentActivity,
    });
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการโหลดข้อมูลสถิติ",
    });
  }
});

// API Route สำหรับ user info - JWT based
app.get("/api/admin/user/info", authRouter.requireAuth, (req, res) => {
  try {
    const user = req.user; // From JWT token
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Error loading user info:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้",
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Chiang Mai Admin API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "เกิดข้อผิดพลาดในระบบ",
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "ไม่พบ API endpoint ที่ต้องการ",
    path: req.path,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Chiang Mai Admin API Server running on port ${PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);

  // Ensure data directory exists
  const dataDir = path.join(__dirname, "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log("📁 Created data directory");
  }

  // Ensure backups directory exists
  const backupsDir = path.join(dataDir, "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
    console.log("📁 Created backups directory");
  }

  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("📁 Created uploads directory");
  }

  console.log(`🌟 Environment: ${process.env.NODE_ENV || 'development'}`);
});