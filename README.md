# Chiang Mai Tourism Management System

ระบบเว็บท่องเที่ยวเชียงใหม่แบบแยกส่วน ประกอบด้วย Backend API (Express), เว็บไซต์ผู้ใช้ทั่วไป (Vite) และแผงผู้ดูแลระบบ Shadcn Admin (Vite)

## สถาปัตยกรรมโดยย่อ

```
Frontend (Vite)  ───►  Backend API (Express)  ◄───  Admin (Vite)
   /api/public            /api/admin + /uploads           JWT Auth
```

## โครงสร้างโปรเจ็กต์

```
cm-travel/
├── backend/                # Express API + JSON data
│   ├── server.js           # จุดเริ่ม API
│   ├── routes/             # เส้นทาง API (admin/public)
│   ├── utils/              # data/json/upload helpers
│   └── data/, public/      # ฐานข้อมูล JSON และอัปโหลดรูป
├── frontend/               # เว็บไซต์ท่องเที่ยว (Vite)
│   ├── index.html          # หน้าเว็บหลัก + assets/
│   └── dist/               # ไฟล์ build (อัตโนมัติ)
└── admin-shadcn/           # แผงผู้ดูแลระบบ (Vite)
    └── assets/js/*.js      # โมดูล UI + API client
```

## ข้อกำหนดระบบ
- Node.js >= 16, npm >= 8

## การติดตั้งอย่างรวดเร็ว

จากรากโปรเจ็กต์:
```bash
npm run install:all
```

## เริ่มพัฒนาแบบครบชุด

เลือกอย่างใดอย่างหนึ่ง:

- ใช้สคริปต์รวม (แนะนำสำหรับ dev):
```bash
npm run dev              # รัน backend + frontend + admin พร้อมกัน
```

- หรือรันแยกส่วน:
```bash
npm run start:backend    # ที่พอร์ต 3000 (nodemon)
npm run start:frontend   # Vite dev server (พอร์ตอัตโนมัติ)
npm run start:admin      # Vite dev server (พอร์ตอัตโนมัติ)
```

สคริปต์เสริม:
```bash
./start-all.sh           # สตาร์ตรวม (bash)
./stop-all.sh            # หยุดทั้งหมด
npm run build:frontend   # build ฝั่ง frontend (to frontend/dist)
npm run logs             # tail logs
```

## การ Build และ Preview (Frontend/Admin)

```bash
cd frontend && npm run build && npm run preview
cd admin-shadcn && npm run build && npm run preview
```

ตั้งค่า base URL ผ่านตัวแปรสภาพแวดล้อม (optional):
- `VITE_API_BASE_URL` ใน frontend/admin เพื่อชี้ไปยัง Backend API (เช่น http://localhost:3000)

## Backend API (สรุป ณ ปัจจุบัน)

- Health: `GET /api/health`
- Static uploads: `GET /uploads/*`

Public (ไม่ต้องล็อกอิน)
- Places: `GET /api/public/places`, `GET /api/public/places/:id`, `GET /api/public/places/featured/random`
- Categories: `GET /api/public/categories`, `GET /api/public/categories/:slug`, `GET /api/public/categories/:id/places`

Admin (ต้อง JWT)
- Auth: `POST /api/admin/auth/login`, `POST /api/admin/auth/logout`, `POST /api/admin/auth/refresh`, `GET /api/admin/auth/me`
- Dashboard: `GET /api/admin/dashboard/stats`
- Categories: `GET /api/admin/categories`, `GET /api/admin/categories/stats`, `GET /api/admin/categories/:id`, `POST /api/admin/categories`, `PUT /api/admin/categories/:id`, `DELETE /api/admin/categories/:id`
- Places: `GET /api/admin/places`, `GET /api/admin/places/:id`, `POST /api/admin/places`, `PUT /api/admin/places/:id`, `DELETE /api/admin/places/:id`, `PATCH /api/admin/places/:id/status`, `GET /api/admin/places/stats`

หมายเหตุ: ได้ลบ endpoint ที่ไม่ใช้แล้ว เช่น `user/info`, `admin/images/*`, bulk actions บางส่วน และ SSR routes เก่า เพื่อให้ API สะอาดและตรงการใช้งานจริง

## การยืนยันตัวตน (Admin)
- ใช้ JWT ผ่าน `Authorization: Bearer <token>`
- `POST /api/admin/auth/login` จะส่งคืน `accessToken` และ `refreshToken`
- `POST /api/admin/auth/refresh` ใช้ต่ออายุ token

บัญชีเริ่มต้น (สำหรับ dev): ดู/แก้ไขใน `backend/data/users.json` (ค่าเริ่มต้นผู้ใช้ admin จะถูกสร้างอัตโนมัติหากไม่มีไฟล์)

## แนวทางดีไซน์ (Frontend)
- ใช้ CSS Variables ใน `frontend/assets/css/style.css` เช่น
  - `--primary-navy`, `--light-blue`, `--medium-blue`, `--golden-yellow`, `--accent-blue`, `--white`
- ได้ปรับโค้ดให้ใช้ `var(--white)` แทน `#fff/white` เพื่อความสอดคล้อง และลบคลาสที่ไม่ใช้งานออกจากสไตล์ชีตแล้ว

## การทดสอบเร็ว (Smoke Test)

หลังรัน backend:
```bash
curl http://localhost:3000/api/health
```
ควรได้ `{ success: true }`

## ไลเซนส์
MIT
