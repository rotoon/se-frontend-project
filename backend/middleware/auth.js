// Authentication middleware สำหรับ admin routes
const requireAuth = (req, res, next) => {
  // ตรวจสอบ session
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
      code: 'UNAUTHORIZED'
    });
  }

  // ส่งต่อข้อมูล user สำหรับใช้ใน routes
  req.user = req.session.user;
  next();
};

// Optional authentication - ไม่บังคับต้อง login
const optionalAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
};

module.exports = {
  requireAuth,
  optionalAuth
};