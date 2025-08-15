# Chiang Mai Tourism Management System

ระบบจัดการข้อมูลสถานที่ท่องเที่ยวในจังหวัดเชียงใหม่ ที่แบ่งแยกเป็นสถาปัตยกรรมแบบแยกส่วน (Separated Architecture) เพื่อความยืดหยุ่นและการบำรุงรักษาที่ง่าย

## 🏗️ สถาปัตยกรรมระบบ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend     │    │ Admin Frontend  │
│  (Port 3001)    │◄───┤   (Port 3000)   ├───►│  (Port 3002)    │
│                 │    │                 │    │                 │
│ • Tourist Site  │    │ • API Server    │    │ • Admin Panel   │
│ • Webpack 5     │    │ • Express.js    │    │ • Content Mgmt  │
│ • Hot Reload    │    │ • JSON Database │    │ • Authentication│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🎯 แต่ละส่วนของระบบ

- **Backend**: API Server สำหรับจัดการข้อมูลและการรับรองตัวตน
- **Frontend**: เว็บไซต์ท่องเที่ยวสำหรับนักท่องเที่ยว (พัฒนาด้วย Webpack)
- **Admin Frontend**: ระบบจัดการเนื้อหาสำหรับผู้ดูแลระบบ

## 🚀 การติดตั้งและใช้งาน

### ข้อกำหนดเบื้องต้น
- Node.js (v16 หรือสูงกว่า)
- npm (v8 หรือสูงกว่า)

### การติดตั้ง

1. **Clone โปรเจ็กต์**
```bash
git clone <repository-url>
cd se-frontend-project
```

2. **ติดตั้ง Dependencies สำหรับแต่ละส่วน**

```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install

# Admin Frontend
cd ../admin-frontend
npm install
```

### 🏃‍♂️ การรันระบบ

**เรียกใช้งานในลำดับนี้ (แต่ละส่วนต้องรันในแท็บเทอร์มินัลแยกกัน):**

#### 1. Backend Server (Port 3000)
```bash
cd backend
npm run dev    # Development mode
# หรือ
npm start      # Production mode
```

#### 2. Frontend Development Server (Port 3001)
```bash
cd frontend
npm run dev    # Webpack dev server พร้อม hot reloading
```

#### 3. Admin Frontend (Port 3002)
```bash
cd admin-frontend
# เปิดไฟล์ HTML ด้วย live-server หรือเซิร์ฟเวอร์คล้ายกัน
npx live-server --port=3002
```

### 🌐 การเข้าถึงระบบ

- **Tourist Website**: http://localhost:3001 - เว็บไซต์ท่องเที่ยวหลัก
- **Admin Panel**: http://localhost:3002 - ระบบจัดการเนื้อหา
- **API Server**: http://localhost:3000 - API endpoints

### 🔑 ข้อมูลการเข้าสู่ระบบ Admin

- **Username**: `admin`
- **Password**: `password`

## 🛠️ เทคโนโลยีที่ใช้

### Backend
- **Node.js** + **Express.js** - API Server
- **JSON Files** - ฐานข้อมูลแบบไฟล์
- **bcrypt** - การเข้ารหัสรหัสผ่าน
- **express-session** - จัดการ session
- **multer** - อัพโหลดไฟล์
- **CORS** - รองรับ Cross-Origin Requests

### Frontend (Tourist Website)
- **Webpack 5** - Module bundler
- **ES6 Modules** - ระบบโมดูลสมัยใหม่
- **Bootstrap 5** - CSS Framework
- **HTML5** + **CSS3** - โครงสร้างและการออกแบบ
- **JavaScript (ES6+)** - ฟังก์ชันการทำงาน

### Admin Frontend
- **HTML5** + **CSS3** + **JavaScript** - พื้นฐาน
- **Bootstrap 5** - UI Framework

## 📁 โครงสร้างโปรเจ็กต์

```
se-frontend-project/
├── backend/                 # API Server (Port 3000)
│   ├── server.js            # Express API server
│   ├── data/                # JSON Database
│   ├── routes/              # API Routes
│   ├── utils/               # Utility modules
│   └── public/              # Static uploads
├── frontend/                # Tourist Website (Port 3001)
│   ├── webpack.config.js    # Webpack configuration
│   ├── index.html           # Main HTML template
│   ├── assets/              # Source assets
│   │   ├── js/              # JavaScript modules
│   │   └── css/             # Stylesheets
│   └── dist/                # Built assets (generated)
├── admin-frontend/          # Admin Panel (Port 3002)
│   ├── *.html               # Admin pages
│   └── assets/              # Admin assets
└── .kiro/specs/            # Project specifications
```

## 🎨 คุณสมบัติหลัก

### Frontend (เว็บไซต์ท่องเที่ยว)
- ✨ **Video Background Hero Section** - หน้าแรกสวยงาม
- 🌍 **Multi-language Support** - รองรับหลายภาษา
- 📱 **Responsive Design** - ใช้งานได้ทุกขนาดหน้าจอ
- ⚡ **Hot Module Replacement** - แก้ไขโค้ดเห็นผลทันที
- 🔍 **Search & Filter** - ค้นหาและกรองสถานที่
- 🏺 **Interactive Cards** - การ์ดแสดงสถานที่แบบโต้ตอบ

### Admin Panel
- 🔐 **Authentication System** - ระบบเข้าสู่ระบบปลอดภัย
- 📝 **CRUD Operations** - จัดการข้อมูลครบครัน
- 🖼️ **Image Upload** - อัพโหลดรูปภาพ
- 📊 **Dashboard** - หน้าแดชบอร์ดภาพรวม
- 🏷️ **Category Management** - จัดการหมวดหมู่

### Backend API
- 🚀 **RESTful API** - API มาตรฐาน
- 🔒 **Security Features** - ระบบรักษาความปลอดภัย
- 💾 **Auto Backup** - สำรองข้อมูลอัตโนมัติ
- ⚡ **Error Recovery** - ระบบกู้คืนข้อมูล
- 📁 **File Management** - จัดการไฟล์

## 🎯 Webpack Features

### Development
- **Hot Module Replacement (HMR)** - โหลดซ้ำโมดูลแบบทันที
- **Development Server** - เซิร์ฟเวอร์พัฒนา
- **API Proxy** - ส่งต่อ API calls ไป backend
- **Source Maps** - แก้ไขข้อผิดพลาดง่าย

### Production
- **Code Splitting** - แยกไฟล์สำหรับประสิทธิภาพ
- **Minification** - บีบอัดไฟล์
- **CSS Extraction** - แยกไฟล์ CSS
- **Asset Optimization** - ปรับปรุงไฟล์สื่อ

## 🔧 คำสั่งที่สำคัญ

### Frontend Development
```bash
cd frontend
npm run dev          # เริ่มพัฒนาพร้อม hot reload
npm run build        # Build สำหรับ production
```

### Backend Development
```bash
cd backend
npm run dev          # เริ่มพัฒนาด้วย nodemon
npm start            # เริ่มใน production mode
```

## 📊 API Endpoints

### Public APIs (สำหรับ Frontend)
- `GET /api/places` - รายการสถานที่ท่องเที่ยว
- `GET /api/places/:id` - ข้อมูลสถานที่เฉพาะ
- `GET /api/categories` - รายการหมวดหมู่

### Admin APIs (สำหรับ Admin Panel)
- `POST /auth/login` - เข้าสู่ระบบ
- `POST /auth/logout` - ออกจากระบบ
- `GET /admin/api/places` - จัดการสถานที่ (รองรับ search, filter)
- `POST /admin/api/places` - เพิ่มสถานที่ใหม่
- `PUT /admin/api/places/:id` - แก้ไขสถานที่
- `DELETE /admin/api/places/:id` - ลบสถานที่

## 🔍 การทดสอบ

### Frontend Testing
```bash
cd frontend
npm run build        # ทดสอบการ build
```

### Backend Testing
```bash
cd backend
npm test            # รันเทส (ถ้ามี)
```

## 🤝 การพัฒนา

1. **Fork** โปรเจ็กต์
2. **สร้าง branch** สำหรับฟีเจอร์ใหม่ (`git checkout -b feature/amazing-feature`)
3. **Commit** การเปลี่ยนแปลง (`git commit -m 'Add some amazing feature'`)
4. **Push** ไปยัง branch (`git push origin feature/amazing-feature`)
5. **เปิด Pull Request**

## 📄 License

โปรเจ็กต์นี้ใช้ภายใต้ MIT License

## 📞 ติดต่อ

สำหรับคำถามหรือข้อเสนอแนะ กรุณาติดต่อผู้พัฒนาโปรเจ็กต์

---

**หมายเหตุ**: โปรเจ็กต์นี้พัฒนาขึ้นเพื่อการศึกษาและสาธิต การใช้งานจริงควรปรับปรุงด้านความปลอดภัยเพิ่มเติม