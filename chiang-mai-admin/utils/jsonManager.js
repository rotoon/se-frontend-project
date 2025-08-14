const fs = require('fs').promises;
const path = require('path');

/**
 * JSON File Manager Utility
 * จัดการการอ่าน เขียน และตรวจสอบไฟล์ JSON
 */
class JSONManager {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.backupDir = path.join(dataDir, 'backups');
  }

  /**
   * อ่านไฟล์ JSON
   * @param {string} filename - ชื่อไฟล์ (เช่น 'places.json')
   * @returns {Promise<any>} - ข้อมูลจากไฟล์ JSON
   */
  async readJSON(filename) {
    try {
      const filePath = path.join(this.dataDir, filename);
      const data = await fs.readFile(filePath, 'utf8');
      
      // ตรวจสอบว่าไฟล์ว่างหรือไม่
      if (!data.trim()) {
        console.warn(`ไฟล์ ${filename} ว่าง กำลังส่งคืนอาร์เรย์ว่าง`);
        return [];
      }

      const parsedData = JSON.parse(data);
      
      // ตรวจสอบความถูกต้องของโครงสร้าง JSON
      this.validateJSONStructure(filename, parsedData);
      
      return parsedData;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`ไฟล์ ${filename} ไม่พบ กำลังสร้างไฟล์ใหม่`);
        await this.createDefaultFile(filename);
        return this.readJSON(filename);
      } else if (error instanceof SyntaxError) {
        throw new Error(`ไฟล์ ${filename} มีรูปแบบ JSON ที่ไม่ถูกต้อง: ${error.message}`);
      } else {
        throw new Error(`เกิดข้อผิดพลาดในการอ่านไฟล์ ${filename}: ${error.message}`);
      }
    }
  }

  /**
   * เขียนไฟล์ JSON
   * @param {string} filename - ชื่อไฟล์
   * @param {any} data - ข้อมูลที่จะเขียน
   * @returns {Promise<void>}
   */
  async writeJSON(filename, data) {
    try {
      // ตรวจสอบความถูกต้องของโครงสร้าง JSON ก่อนเขียน
      this.validateJSONStructure(filename, data);
      
      // สำรองข้อมูลก่อนเขียนใหม่
      await this.backupFile(filename);
      
      const filePath = path.join(this.dataDir, filename);
      const jsonString = JSON.stringify(data, null, 2);
      
      await fs.writeFile(filePath, jsonString, 'utf8');
      console.log(`บันทึกไฟล์ ${filename} สำเร็จ`);
    } catch (error) {
      throw new Error(`เกิดข้อผิดพลาดในการเขียนไฟล์ ${filename}: ${error.message}`);
    }
  }

  /**
   * ตรวจสอบความถูกต้องของโครงสร้าง JSON
   * @param {string} filename - ชื่อไฟล์
   * @param {any} data - ข้อมูลที่จะตรวจสอบ
   */
  validateJSONStructure(filename, data) {
    switch (filename) {
      case 'places.json':
        this.validatePlacesStructure(data);
        break;
      case 'categories.json':
        this.validateCategoriesStructure(data);
        break;
      case 'users.json':
        this.validateUsersStructure(data);
        break;
      default:
        // สำหรับไฟล์อื่นๆ ตรวจสอบเพียงว่าเป็น array หรือ object
        if (typeof data !== 'object') {
          throw new Error(`ข้อมูลในไฟล์ ${filename} ต้องเป็น object หรือ array`);
        }
    }
  }

  /**
   * ตรวจสอบโครงสร้างไฟล์ places.json
   */
  validatePlacesStructure(data) {
    if (!Array.isArray(data)) {
      throw new Error('ข้อมูลสถานที่ต้องเป็น array');
    }

    data.forEach((place, index) => {
      if (!place.id || typeof place.id !== 'string') {
        throw new Error(`สถานที่ลำดับที่ ${index + 1} ต้องมี id เป็น string`);
      }
      if (!place.name || typeof place.name !== 'object') {
        throw new Error(`สถานที่ลำดับที่ ${index + 1} ต้องมี name เป็น object`);
      }
      if (!place.name.th || typeof place.name.th !== 'string') {
        throw new Error(`สถานที่ลำดับที่ ${index + 1} ต้องมีชื่อภาษาไทย`);
      }
    });
  }

  /**
   * ตรวจสอบโครงสร้างไฟล์ categories.json
   */
  validateCategoriesStructure(data) {
    if (!Array.isArray(data)) {
      throw new Error('ข้อมูลหมวดหมู่ต้องเป็น array');
    }

    data.forEach((category, index) => {
      if (!category.id || typeof category.id !== 'string') {
        throw new Error(`หมวดหมู่ลำดับที่ ${index + 1} ต้องมี id เป็น string`);
      }
      if (!category.name || typeof category.name !== 'object') {
        throw new Error(`หมวดหมู่ลำดับที่ ${index + 1} ต้องมี name เป็น object`);
      }
      if (!category.name.th || typeof category.name.th !== 'string') {
        throw new Error(`หมวดหมู่ลำดับที่ ${index + 1} ต้องมีชื่อภาษาไทย`);
      }
    });
  }

  /**
   * ตรวจสอบโครงสร้างไฟล์ users.json
   */
  validateUsersStructure(data) {
    if (!Array.isArray(data)) {
      throw new Error('ข้อมูลผู้ใช้ต้องเป็น array');
    }

    data.forEach((user, index) => {
      if (!user.id || typeof user.id !== 'string') {
        throw new Error(`ผู้ใช้ลำดับที่ ${index + 1} ต้องมี id เป็น string`);
      }
      if (!user.username || typeof user.username !== 'string') {
        throw new Error(`ผู้ใช้ลำดับที่ ${index + 1} ต้องมี username เป็น string`);
      }
      if (!user.password || typeof user.password !== 'string') {
        throw new Error(`ผู้ใช้ลำดับที่ ${index + 1} ต้องมี password เป็น string`);
      }
    });
  }

  /**
   * สำรองไฟล์ก่อนการแก้ไข
   * @param {string} filename - ชื่อไฟล์ที่จะสำรอง
   */
  async backupFile(filename) {
    try {
      const sourceFile = path.join(this.dataDir, filename);
      
      // ตรวจสอบว่าไฟล์ต้นฉบับมีอยู่หรือไม่
      try {
        await fs.access(sourceFile);
      } catch {
        // ไฟล์ไม่มีอยู่ ไม่ต้องสำรอง
        return;
      }

      // สร้างโฟลเดอร์ backup หากไม่มี
      await this.ensureBackupDir();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `${filename.replace('.json', '')}_${timestamp}.json`;
      const backupFile = path.join(this.backupDir, backupFilename);
      
      await fs.copyFile(sourceFile, backupFile);
      console.log(`สำรองไฟล์ ${filename} เป็น ${backupFilename}`);
      
      // ลบไฟล์สำรองเก่าที่เกิน 10 ไฟล์
      await this.cleanupOldBackups(filename);
    } catch (error) {
      console.error(`เกิดข้อผิดพลาดในการสำรองไฟล์ ${filename}:`, error.message);
    }
  }

  /**
   * สร้างโฟลเดอร์ backup หากไม่มี
   */
  async ensureBackupDir() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log('สร้างโฟลเดอร์ backup สำเร็จ');
    }
  }

  /**
   * ลบไฟล์สำรองเก่าที่เกิน 10 ไฟล์
   * @param {string} filename - ชื่อไฟล์ต้นฉบับ
   */
  async cleanupOldBackups(filename) {
    try {
      const files = await fs.readdir(this.backupDir);
      const baseFilename = filename.replace('.json', '');
      const backupFiles = files
        .filter(file => file.startsWith(baseFilename) && file.endsWith('.json'))
        .sort()
        .reverse(); // เรียงจากใหม่ไปเก่า

      if (backupFiles.length > 10) {
        const filesToDelete = backupFiles.slice(10);
        for (const file of filesToDelete) {
          await fs.unlink(path.join(this.backupDir, file));
          console.log(`ลบไฟล์สำรองเก่า: ${file}`);
        }
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการลบไฟล์สำรองเก่า:', error.message);
    }
  }

  /**
   * สร้างไฟล์เริ่มต้นเมื่อไฟล์เสียหาย
   * @param {string} filename - ชื่อไฟล์
   */
  async createDefaultFile(filename) {
    let defaultData;
    
    switch (filename) {
      case 'places.json':
        defaultData = [];
        break;
      case 'categories.json':
        defaultData = [
          {
            "id": "restaurant",
            "name": {
              "th": "ร้านอาหาร",
              "en": "Restaurant",
              "zh": "餐厅",
              "ja": "レストラン"
            },
            "slug": "restaurant",
            "icon": "utensils",
            "order": 1,
            "createdAt": new Date().toISOString()
          },
          {
            "id": "accommodation",
            "name": {
              "th": "ที่พัก",
              "en": "Accommodation",
              "zh": "住宿",
              "ja": "宿泊施設"
            },
            "slug": "accommodation",
            "icon": "bed",
            "order": 2,
            "createdAt": new Date().toISOString()
          },
          {
            "id": "attraction",
            "name": {
              "th": "สถานที่ท่องเที่ยว",
              "en": "Tourist Attraction",
              "zh": "旅游景点",
              "ja": "観光地"
            },
            "slug": "attraction",
            "icon": "camera",
            "order": 3,
            "createdAt": new Date().toISOString()
          }
        ];
        break;
      case 'users.json':
        defaultData = [
          {
            "id": "admin-001",
            "username": "admin",
            "password": "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
            "email": "admin@chiangmai-admin.com",
            "role": "admin",
            "loginAttempts": 0,
            "lockUntil": null,
            "lastLogin": null,
            "createdAt": new Date().toISOString()
          }
        ];
        break;
      default:
        defaultData = [];
    }

    const filePath = path.join(this.dataDir, filename);
    await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
    console.log(`สร้างไฟล์เริ่มต้น ${filename} สำเร็จ`);
  }
}

module.exports = JSONManager;