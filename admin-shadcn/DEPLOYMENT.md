# Go Chiangmai Admin - Deployment Guide

## 🚀 การ Deploy Admin Dashboard

### Environment Variables

**Development (.env)**
```bash
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3000
VITE_DEV_SERVER_PORT=3002
```

**Production (.env.production)**
```bash
NODE_ENV=production
# ใน production จะใช้ same origin (ไม่ต้อง proxy)
VITE_API_BASE_URL=""
```

### สำหรับ Railway

1. **Build Command:**
```bash
npm run build
```

2. **Start Command:**
```bash
npm run preview
```

3. **Environment Variables ใน Railway:**
- `NODE_ENV=production`
- `VITE_API_BASE_URL=""` (หรือไม่ต้องตั้งเลย)

### การทำงานของระบบ

**Development Mode:**
- Admin dashboard: `http://localhost:3002`
- API calls จะถูก proxy ไปยัง `http://localhost:3000` (หรือตาม VITE_API_BASE_URL)
- Hot reloading ใช้งานได้

**Production Mode:**
- Admin dashboard และ Backend API อยู่ใน domain เดียวกัน
- API calls ใช้ relative URLs (same origin)
- ไม่ต้องการ CORS configuration พิเศษ

### API Endpoints ที่ใช้

- `/api/admin/auth/login` - Admin login
- `/api/admin/places/*` - Places management
- `/api/admin/categories/*` - Categories management
- `/uploads/*` - Static images

### ตัวอย่าง URL Structure

**Development:**
- Admin: `http://localhost:3002`
- API calls: `http://localhost:3000/api/admin/...`

**Production:**
- Admin: `https://your-domain.railway.app`  
- API calls: `https://your-domain.railway.app/api/admin/...`

### การ Debug

ใช้ `window.appConfig.getDebugInfo()` ใน browser console เพื่อดูการตั้งค่า:

```javascript
console.log(window.appConfig.getDebugInfo());
```

### Configuration Class

ระบบใช้ `assets/js/config.js` ในการจัดการ environment configuration:

- **Development**: ใช้ proxy ผ่าน Vite dev server
- **Production**: ใช้ same origin requests
- **Dynamic API URLs**: ปรับตัวตาม environment อัตโนมัติ

### การแก้ปัญหา

1. **API calls ล้มเหลว:**
   - ตรวจสอบ environment variables
   - ดู Network tab ใน DevTools
   - ตรวจสอบ `window.appConfig.getDebugInfo()`

2. **CORS errors:**
   - ใน development: ตรวจสอบ vite.config.js proxy settings
   - ใน production: Backend และ Frontend ต้องใช้ same origin

3. **Environment variables ไม่ทำงาน:**
   - ตรวจสอบว่าชื่อขึ้นต้นด้วย `VITE_`
   - ใน Railway ต้องตั้งใน Settings > Variables
