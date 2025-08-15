const cors = require('cors');

// CORS configuration ตาม Express best practices
const corsOptions = {
  origin: function (origin, callback) {
    // อนุญาตให้ frontend และ admin-frontend เข้าถึง
    const allowedOrigins = [
      'http://localhost:3001', // frontend
      'http://localhost:3002', // admin-frontend
      'http://localhost:8080', // development server
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:8080'
    ];
    
    // อนุญาต requests ที่ไม่มี origin (เช่น mobile apps, postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Origin not allowed by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'x-api-key'
  ],
  credentials: true,
  optionsSuccessStatus: 200 // สำหรับ legacy browsers
};

// Development mode - อนุญาตทุก origin
if (process.env.NODE_ENV === 'development') {
  corsOptions.origin = true;
}

module.exports = cors(corsOptions);