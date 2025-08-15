const JSONManager = require('./jsonManager');
const ErrorHandler = require('./errorHandler');

/**
 * Data Manager - รวมการจัดการไฟล์ JSON และการจัดการข้อผิดพลาด
 */
class DataManager {
  constructor(dataDir = './data') {
    this.jsonManager = new JSONManager(dataDir);
    this.errorHandler = new ErrorHandler(dataDir);
    this.dataDir = dataDir;
  }

  /**
   * อ่านไฟล์ JSON พร้อมการจัดการข้อผิดพลาด
   * @param {string} filename - ชื่อไฟล์
   * @returns {Promise<Object>} - ผลลัพธ์การอ่านไฟล์
   */
  async readJSON(filename) {
    try {
      const data = await this.jsonManager.readJSON(filename);
      return {
        success: true,
        data,
        message: `อ่านไฟล์ ${filename} สำเร็จ`
      };
    } catch (error) {
      const errorResult = this.errorHandler.handleError(error, 'อ่าน', filename);
      
      // พยายามกู้คืนจากไฟล์สำรอง
      if (error.code === 'ENOENT' || error instanceof SyntaxError) {
        console.log(`พยายามกู้คืนไฟล์ ${filename} จากไฟล์สำรอง...`);
        const recovered = await this.errorHandler.recoverFromBackup(filename);
        
        if (recovered) {
          try {
            const data = await this.jsonManager.readJSON(filename);
            return {
              success: true,
              data,
              message: `กู้คืนและอ่านไฟล์ ${filename} สำเร็จ`,
              recovered: true
            };
          } catch (recoveryError) {
            console.log(`การกู้คืนล้มเหลว สร้างไฟล์เริ่มต้นใหม่...`);
          }
        }
        
        // หากกู้คืนไม่ได้ ให้สร้างไฟล์เริ่มต้น
        try {
          await this.jsonManager.createDefaultFile(filename);
          const data = await this.jsonManager.readJSON(filename);
          return {
            success: true,
            data,
            message: `สร้างไฟล์เริ่มต้น ${filename} สำเร็จ`,
            created: true
          };
        } catch (createError) {
          return this.errorHandler.handleError(createError, 'สร้างไฟล์เริ่มต้น', filename);
        }
      }
      
      return errorResult;
    }
  }

  /**
   * เขียนไฟล์ JSON พร้อมการจัดการข้อผิดพลาด
   * @param {string} filename - ชื่อไฟล์
   * @param {any} data - ข้อมูลที่จะเขียน
   * @returns {Promise<Object>} - ผลลัพธ์การเขียนไฟล์
   */
  async writeJSON(filename, data) {
    try {
      await this.jsonManager.writeJSON(filename, data);
      return {
        success: true,
        message: `บันทึกไฟล์ ${filename} สำเร็จ`
      };
    } catch (error) {
      return this.errorHandler.handleError(error, 'เขียน', filename);
    }
  }

  /**
   * ตรวจสอบสุขภาพของระบบ
   * @returns {Promise<Object>} - รายงานสุขภาพระบบ
   */
  async healthCheck() {
    try {
      return await this.errorHandler.systemHealthCheck();
    } catch (error) {
      return this.errorHandler.handleError(error, 'ตรวจสอบสุขภาพระบบ');
    }
  }

  /**
   * กู้คืนไฟล์จากไฟล์สำรอง
   * @param {string} filename - ชื่อไฟล์
   * @returns {Promise<Object>} - ผลลัพธ์การกู้คืน
   */
  async recoverFile(filename) {
    try {
      const success = await this.errorHandler.recoverFromBackup(filename);
      if (success) {
        return {
          success: true,
          message: `กู้คืนไฟล์ ${filename} สำเร็จ`
        };
      } else {
        return {
          success: false,
          error: `ไม่สามารถกู้คืนไฟล์ ${filename} ได้ (ไม่พบไฟล์สำรอง)`
        };
      }
    } catch (error) {
      return this.errorHandler.handleError(error, 'กู้คืน', filename);
    }
  }

  /**
   * ตรวจสอบความสมบูรณ์ของไฟล์
   * @param {string} filename - ชื่อไฟล์
   * @returns {Promise<Object>} - ผลการตรวจสอบ
   */
  async checkFile(filename) {
    try {
      return await this.errorHandler.checkFileIntegrity(filename);
    } catch (error) {
      return this.errorHandler.handleError(error, 'ตรวจสอบไฟล์', filename);
    }
  }

  /**
   * สร้างไฟล์เริ่มต้น
   * @param {string} filename - ชื่อไฟล์
   * @returns {Promise<Object>} - ผลลัพธ์การสร้างไฟล์
   */
  async createDefaultFile(filename) {
    try {
      await this.jsonManager.createDefaultFile(filename);
      return {
        success: true,
        message: `สร้างไฟล์เริ่มต้น ${filename} สำเร็จ`
      };
    } catch (error) {
      return this.errorHandler.handleError(error, 'สร้างไฟล์เริ่มต้น', filename);
    }
  }

  // Convenience methods สำหรับไฟล์เฉพาะ

  /**
   * อ่านข้อมูลสถานที่
   */
  async getPlaces() {
    return this.readJSON('places.json');
  }

  /**
   * บันทึกข้อมูลสถานที่
   */
  async savePlaces(places) {
    return this.writeJSON('places.json', places);
  }

  /**
   * อ่านข้อมูลหมวดหมู่
   */
  async getCategories() {
    return this.readJSON('categories.json');
  }

  /**
   * บันทึกข้อมูลหมวดหมู่
   */
  async saveCategories(categories) {
    return this.writeJSON('categories.json', categories);
  }

  /**
   * อ่านข้อมูลผู้ใช้
   */
  async getUsers() {
    return this.readJSON('users.json');
  }

  /**
   * บันทึกข้อมูลผู้ใช้
   */
  async saveUsers(users) {
    return this.writeJSON('users.json', users);
  }
}

module.exports = DataManager;