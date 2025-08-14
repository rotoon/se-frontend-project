# Chiang Mai Admin System

ระบบหน้า admin สำหรับจัดการสถานที่ท่องเที่ยวเชียงใหม่

## โครงสร้างโปรเจค

```
chiang-mai-admin/
├── server.js                 # Express.js server หลัก
├── package.json              # Dependencies และ scripts
├── data/
│   ├── places.json          # ข้อมูลสถานที่ท่องเที่ยว
│   ├── categories.json      # ข้อมูลหมวดหมู่
│   ├── users.json           # ข้อมูลผู้ใช้ admin
│   └── backups/             # โฟลเดอร์สำรองข้อมูล
├── public/
│   ├── css/
│   │   └── admin.css        # CSS สำหรับหน้า admin
│   ├── js/
│   │   └── admin.js         # JavaScript สำหรับหน้า admin
│   └── uploads/             # รูปภาพที่อัปโหลด
├── views/
│   ├── login.html           # หน้าเข้าสู่ระบบ
│   ├── dashboard.html       # หน้าแดชบอร์ด
│   ├── places-list.html     # หน้ารายการสถานที่
│   ├── place-form.html      # หน้าฟอร์มเพิ่ม/แก้ไขสถานที่
│   └── categories.html      # หน้าจัดการหมวดหมู่
└── routes/
    ├── auth.js              # Routes สำหรับการเข้าสู่ระบบ
    ├── places.js            # Routes สำหรับจัดการสถานที่
    └── categories.js        # Routes สำหรับจัดการหมวดหมู่
```

## การติดตั้ง

```bash
cd chiang-mai-admin
npm install
```

## การรัน

```bash
npm start
# หรือ
npm run dev  # สำหรับ development mode
```

## ข้อมูลเริ่มต้น

- **Admin User:** username: `admin`, password: `password` (hashed ใน users.json)
- **Categories:** มีหมวดหมู่เริ่มต้น 4 หมวดหมู่ (ร้านอาหาร, ที่พัก, สถานที่ท่องเที่ยว, กิจกรรม)
- **Places:** เริ่มต้นเป็น array ว่าง

## เทคโนโลยีที่ใช้

- **Backend:** Node.js + Express.js
- **Frontend:** HTML5, CSS3, Bootstrap 5
- **Database:** JSON Files
- **Session Management:** express-session
- **File Upload:** multer
- **Authentication:** bcrypt