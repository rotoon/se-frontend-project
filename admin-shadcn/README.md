# Shadcn Admin Dashboard

Modern admin dashboard สำหรับระบบจัดการเชียงใหม่ท่องเที่ยว ที่ใช้ Shadcn design system ร่วมกับ Bootstrap

## 🎨 Design System

Dashboard นี้ใช้ **Shadcn design principles** ร่วมกับ Bootstrap เพื่อให้ได้:
- Modern และ clean interface
- Consistent design language
- Dark/Light mode support
- Responsive design
- Accessibility support

## 📁 โครงสร้างไฟล์

```
admin-shadcn/
├── index.html              # หน้า Login
├── dashboard.html           # หน้า Dashboard หลัก
├── assets/
│   ├── css/
│   │   └── shadcn-admin.css # CSS หลักแบบ Shadcn
│   ├── js/
│   │   ├── auth.js          # Authentication system
│   │   ├── api.js           # API client
│   │   ├── components.js    # UI Components
│   │   └── utils.js         # Utility functions
│   └── images/
├── pages/                   # หน้าย่อยต่างๆ (places, categories, etc.)
├── components/              # HTML components
└── README.md
```

## 🚀 การเริ่มต้นใช้งาน

### วิธีที่ 1: ใช้ Webpack Development Server (แนะนำ)

#### ติดตั้ง Dependencies
```bash
cd admin-shadcn
npm install
```

#### Development Mode
```bash
npm run dev
# หรือ
npm start
```
- เปิดเบราว์เซอร์ที่ `http://localhost:3002`
- Hot Module Replacement (HMR)
- Auto-refresh เมื่อแก้ไขไฟล์
- Proxy API calls ไปยัง backend (localhost:3000)

#### Production Build
```bash
npm run build
```
- สร้างไฟล์ optimized ใน `dist/` folder
- Minified JavaScript และ CSS
- Code splitting สำหรับ performance

#### Serve Production Build
```bash
npm run serve
```
- เสิร์ฟไฟล์ production จาก `dist/` folder

### วิธีที่ 2: เปิดไฟล์ HTML โดยตรง

#### 1. เปิดหน้า Login
- เปิดไฟล์ `index.html` ในเบราว์เซอร์
- ใช้ข้อมูลเข้าสู่ระบบ: `admin` / `password`

#### 2. การนำทาง
- หลังจาก login จะเข้าสู่หน้า Dashboard
- ใช้ sidebar เพื่อเปลี่ยนหน้า
- รองรับ mobile navigation

#### 3. Theme Toggle
- คลิกปุ่ม sun/moon ที่มุมขวาบนเพื่อเปลี่ยน theme
- Theme จะถูกบันทึกใน localStorage

## 🎯 คุณสมบัติหลัก

### Authentication System
- Session-based authentication
- Auto logout ตามเวลา
- Protected routes
- Multi-tab logout support

### UI Components
- **Toast Notifications**: แจ้งเตือนต่างๆ
- **Modal Dialogs**: หน้าต่าง popup
- **Data Tables**: ตารางข้อมูลพร้อม search, sort, pagination
- **Loading Spinners**: แสดงสถานะการโหลด
- **Confirm Dialogs**: ยืนยันการดำเนินการ

### API Integration
- RESTful API client
- Automatic error handling
- Request/Response interceptors
- File upload support

### Utilities
- Form validation
- Date/Time formatting
- File handling
- URL management
- Local storage
- Performance optimization

### Webpack Features
- **Hot Module Replacement**: Live reloading ระหว่างพัฒนา
- **Code Splitting**: แยกไฟล์เพื่อประสิทธิภาพ
- **Asset Optimization**: Minification และ compression
- **Development Server**: Local server พร้อม proxy
- **Production Build**: Optimized build สำหรับ production

## 💻 การใช้งาน Components

### Toast Notifications
```javascript
// แสดง toast แบบต่างๆ
window.showToast('บันทึกสำเร็จ', 'success');
window.showToast('เกิดข้อผิดพลาด', 'error');
window.showToast('ข้อมูลไม่ครบ', 'warning');
window.showToast('ข้อมูลทั่วไป', 'info');
```

### Modal Dialog
```javascript
// แสดง modal
const modal = new window.components.Modal();
modal.create('หัวข้อ', 'เนื้อหา', 'ปุ่มต่างๆ').show();
```

### Confirm Dialog
```javascript
// ยืนยันการลบ
const confirmed = await window.showConfirm({
    title: 'ยืนยันการลบ',
    message: 'คุณต้องการลบรายการนี้หรือไม่?',
    type: 'danger',
    confirmText: 'ลบ',
    cancelText: 'ยกเลิก'
});

if (confirmed) {
    // ดำเนินการลบ
}
```

### Data Table
```javascript
// สร้าง data table
const table = new window.components.DataTable('#table-container', {
    columns: [
        { key: 'name', title: 'ชื่อ' },
        { key: 'email', title: 'อีเมล' },
        { 
            key: 'actions', 
            title: 'การดำเนินการ',
            render: (value, row) => `
                <button onclick="editRow(${row.id})">แก้ไข</button>
                <button onclick="deleteRow(${row.id})">ลบ</button>
            `
        }
    ],
    data: [
        { id: 1, name: 'John', email: 'john@example.com' },
        // ... more data
    ],
    pagination: true,
    pageSize: 10,
    searchable: true
});
```

### Loading Spinner
```javascript
// แสดง loading
const loading = new window.components.LoadingSpinner('#content');
loading.show();

// ซ่อน loading
loading.hide();
```

## 🔧 API Usage

### Authentication
```javascript
// Login
const result = await window.auth.login('username', 'password', true);

// Logout
await window.auth.logout();

// Check authentication
const isAuth = window.auth.isAuthenticated();
```

### API Calls
```javascript
// GET request
const response = await window.api.places.getAll();

// POST request
const newPlace = await window.api.places.create({
    name: 'สถานที่ใหม่',
    description: 'รายละเอียด'
});

// File upload
const files = document.querySelector('#file-input').files;
const uploadResult = await window.api.places.uploadImages(placeId, files);
```

### Form Validation
```javascript
const formData = {
    name: 'Test',
    email: 'test@example.com',
    phone: '0812345678'
};

const validation = window.utils.form.validateForm(formData, {
    name: [
        window.utils.form.required,
        { type: 'minLength', params: [3], message: 'ชื่อต้องมีอย่างน้อย 3 ตัวอักษร' }
    ],
    email: [
        window.utils.form.required,
        window.utils.form.email
    ],
    phone: window.utils.form.phoneNumber
});

if (!validation.isValid) {
    console.log('Errors:', validation.errors);
}
```

## 🎨 CSS Variables

ใช้ CSS variables แบบ Shadcn สำหรับ theming:

```css
:root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --secondary: 210 40% 96%;
    --muted: 210 40% 96%;
    --border: 214.3 31.8% 91.4%;
    --radius: 0.5rem;
    /* ... และอื่นๆ */
}
```

## 📱 Responsive Design

- Mobile-first approach
- Collapsible sidebar บน mobile
- Touch-friendly interface
- Responsive tables และ forms

## 🔒 Security Features

- XSS protection ใน form inputs
- CSRF token support
- Secure session management
- Input validation และ sanitization

## 🚀 Performance

- Lazy loading สำหรับรูปภาพ
- Debounced search
- Efficient DOM updates
- Optimized bundle size

## 🔧 Customization

### เปลี่ยน Color Scheme
แก้ไข CSS variables ใน `shadcn-admin.css`

### เพิ่ม Navigation Items
แก้ไข sidebar ใน `dashboard.html`

### เพิ่ม API Endpoints
เพิ่มใน `assets/js/api.js`

### สร้าง Components ใหม่
เพิ่มใน `assets/js/components.js`

## 🐛 Troubleshooting

### Login ไม่ได้
- ตรวจสอบ backend server ว่าทำงาน
- ดู console สำหรับ error messages
- ตรวจสอบ CORS settings

### API calls ล้มเหลว
- ตรวจสอบ network tab ใน dev tools
- ยืนยัน endpoint URLs
- ตรวจสอบ authentication token

### Style ไม่แสดงถูกต้อง
- ตรวจสอบ CSS file paths
- Clear browser cache
- ตรวจสอบ console สำหรับ CSS errors

## 📄 License

MIT License - ใช้ได้ฟรีสำหรับทุกโปรเจค

## 🤝 Contributing

ยินดีรับ contribution ทุกรูปแบบ:
- Bug reports
- Feature requests
- Code improvements
- Documentation updates

---

**Created with ❤️ using Shadcn design system and Bootstrap**