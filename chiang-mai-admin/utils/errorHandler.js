const fs = require('fs').promises;
const path = require('path');

/**
 * Error Handler Utility สำหรับจัดการข้อผิดพลาดของไฟล์ JSON
 */
class ErrorHandler {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.backupDir = path.join(dataDir, 'backups');
  }

  /**
   * จัดการข้อผิดพลาดทั่วไป
   * @param {Error} error - ข้อผิดพลาด
   * @param {string} operation - การดำเนินการที่เกิดข้อผิดพลาด
   * @param {string} filename - ชื่อไฟล์ที่เกี่ยวข้อง
   * @returns {Object} - ข้อมูลข้อผิดพลาดที่จัดรูปแบบแล้ว
   */
  handleError(error, operation, filename = '') {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      operation,
      filename,
      errorType: error.constructor.name,
      message: error.message,
      code: error.code || 'UNKNOWN',
      stack: error.stack
    };

    // บันทึกข้อผิดพลาดลงไฟล์ log
    this.logError(errorInfo);

    // สร้างข้อความแสดงข้อผิดพลาดที่เข้าใจง่าย
    const userMessage = this.createUserFriendlyMessage(error, operation, filename);
    
    return {
      success: false,
      error: userMessage,
      details: errorInfo,
      suggestions: this.getSuggestions(error, filename)
    };
  }

  /**
   * สร้างข้อความแสดงข้อผิดพลาดที่เข้าใจง่าย
   */
  createUserFriendlyMessage(error, operation, filename) {
    switch (error.code) {
      case 'ENOENT':
        return `ไม่พบไฟล์ ${filename} ระบบจะสร้างไฟล์ใหม่ให้อัตโนมัติ`;
      
      case 'EACCES':
        return `ไม่มีสิทธิ์เข้าถึงไฟล์ ${filename} กรุณาตรวจสอบสิทธิ์การเข้าถึงไฟล์`;
      
      case 'EMFILE':
      case 'ENFILE':
        return `ระบบเปิดไฟล์ได้เกินขีดจำกัด กรุณาลองใหม่อีกครั้ง`;
      
      case 'ENOSPC':
        return `พื้นที่จัดเก็บข้อมูลเต็ม ไม่สามารถบันทึกไฟล์ ${filename} ได้`;
      
      default:
        if (error instanceof SyntaxError) {
          return `ไฟล์ ${filename} มีรูปแบบ JSON ที่ไม่ถูกต้อง: ${error.message}`;
        }
        
        if (error.message.includes('validation')) {
          return `ข้อมูลในไฟล์ ${filename} ไม่ถูกต้องตามรูปแบบที่กำหนด: ${error.message}`;
        }
        
        return `เกิดข้อผิดพลาดในการ${operation}ไฟล์ ${filename}: ${error.message}`;
    }
  }

  /**
   * ให้คำแนะนำการแก้ไขปัญหา
   */
  getSuggestions(error, filename) {
    const suggestions = [];

    switch (error.code) {
      case 'ENOENT':
        suggestions.push('ระบบจะสร้างไฟล์ใหม่ให้อัตโนมัติ');
        suggestions.push('ตรวจสอบว่าโฟลเดอร์ data มีอยู่หรือไม่');
        break;
      
      case 'EACCES':
        suggestions.push('ตรวจสอบสิทธิ์การเข้าถึงไฟล์และโฟลเดอร์');
        suggestions.push('รันโปรแกรมด้วยสิทธิ์ที่เหมาะสม');
        break;
      
      case 'ENOSPC':
        suggestions.push('ลบไฟล์ที่ไม่จำเป็นเพื่อเพิ่มพื้นที่');
        suggestions.push('ตรวจสอบพื้นที่ว่างในระบบ');
        break;
      
      default:
        if (error instanceof SyntaxError) {
          suggestions.push('ตรวจสอบรูปแบบ JSON ในไฟล์');
          suggestions.push('ใช้เครื่องมือตรวจสอบ JSON เช่น JSONLint');
          suggestions.push('กู้คืนจากไฟล์สำรอง');
        } else {
          suggestions.push('ลองดำเนินการใหม่อีกครั้ง');
          suggestions.push('ตรวจสอบไฟล์ log สำหรับรายละเอียดเพิ่มเติม');
        }
    }

    return suggestions;
  }

  /**
   * บันทึกข้อผิดพลาดลงไฟล์ log
   */
  async logError(errorInfo) {
    try {
      const logDir = path.join(this.dataDir, 'logs');
      await this.ensureLogDir(logDir);
      
      const logFile = path.join(logDir, 'error.log');
      const logEntry = `${errorInfo.timestamp} [${errorInfo.errorType}] ${errorInfo.operation} - ${errorInfo.filename}: ${errorInfo.message}\n`;
      
      await fs.appendFile(logFile, logEntry, 'utf8');
    } catch (logError) {
      console.error('ไม่สามารถบันทึก error log ได้:', logError.message);
    }
  }

  /**
   * สร้างโฟลเดอร์ log หากไม่มี
   */
  async ensureLogDir(logDir) {
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }
  }

  /**
   * กู้คืนไฟล์จากไฟล์สำรองล่าสุด
   * @param {string} filename - ชื่อไฟล์ที่จะกู้คืน
   * @returns {Promise<boolean>} - สำเร็จหรือไม่
   */
  async recoverFromBackup(filename) {
    try {
      const files = await fs.readdir(this.backupDir);
      const baseFilename = filename.replace('.json', '');
      const backupFiles = files
        .filter(file => file.startsWith(baseFilename) && file.endsWith('.json'))
        .sort()
        .reverse(); // เรียงจากใหม่ไปเก่า

      if (backupFiles.length === 0) {
        console.log(`ไม่พบไฟล์สำรองสำหรับ ${filename}`);
        return false;
      }

      const latestBackup = backupFiles[0];
      const backupPath = path.join(this.backupDir, latestBackup);
      const targetPath = path.join(this.dataDir, filename);

      await fs.copyFile(backupPath, targetPath);
      console.log(`กู้คืนไฟล์ ${filename} จาก ${latestBackup} สำเร็จ`);
      return true;
    } catch (error) {
      console.error(`เกิดข้อผิดพลาดในการกู้คืนไฟล์ ${filename}:`, error.message);
      return false;
    }
  }

  /**
   * ตรวจสอบความสมบูรณ์ของไฟล์ JSON
   * @param {string} filename - ชื่อไฟล์
   * @returns {Promise<Object>} - ผลการตรวจสอบ
   */
  async checkFileIntegrity(filename) {
    const result = {
      filename,
      exists: false,
      readable: false,
      validJSON: false,
      validStructure: false,
      size: 0,
      lastModified: null,
      errors: []
    };

    try {
      const filePath = path.join(this.dataDir, filename);
      
      // ตรวจสอบว่าไฟล์มีอยู่หรือไม่
      try {
        const stats = await fs.stat(filePath);
        result.exists = true;
        result.size = stats.size;
        result.lastModified = stats.mtime;
      } catch (error) {
        result.errors.push(`ไฟล์ไม่มีอยู่: ${error.message}`);
        return result;
      }

      // ตรวจสอบว่าอ่านไฟล์ได้หรือไม่
      try {
        const data = await fs.readFile(filePath, 'utf8');
        result.readable = true;

        // ตรวจสอบว่าเป็น JSON ที่ถูกต้องหรือไม่
        try {
          const parsedData = JSON.parse(data);
          result.validJSON = true;

          // ตรวจสอบโครงสร้างข้อมูล (ใช้ JSONManager)
          const JSONManager = require('./jsonManager');
          const jsonManager = new JSONManager(this.dataDir);
          try {
            jsonManager.validateJSONStructure(filename, parsedData);
            result.validStructure = true;
          } catch (validationError) {
            result.errors.push(`โครงสร้างไม่ถูกต้อง: ${validationError.message}`);
          }
        } catch (parseError) {
          result.errors.push(`JSON ไม่ถูกต้อง: ${parseError.message}`);
        }
      } catch (readError) {
        result.errors.push(`อ่านไฟล์ไม่ได้: ${readError.message}`);
      }

    } catch (error) {
      result.errors.push(`เกิดข้อผิดพลาดทั่วไป: ${error.message}`);
    }

    return result;
  }

  /**
   * ตรวจสอบสุขภาพของระบบไฟล์ทั้งหมด
   * @returns {Promise<Object>} - รายงานสุขภาพระบบ
   */
  async systemHealthCheck() {
    const report = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      files: {},
      backups: {
        available: false,
        count: 0
      },
      recommendations: []
    };

    const filesToCheck = ['places.json', 'categories.json', 'users.json'];
    
    for (const filename of filesToCheck) {
      report.files[filename] = await this.checkFileIntegrity(filename);
      
      if (!report.files[filename].validStructure) {
        report.overall = 'warning';
        report.recommendations.push(`ตรวจสอบและแก้ไขไฟล์ ${filename}`);
      }
    }

    // ตรวจสอบไฟล์สำรอง
    try {
      const backupFiles = await fs.readdir(this.backupDir);
      report.backups.available = backupFiles.length > 1; // มากกว่า .gitkeep
      report.backups.count = backupFiles.filter(f => f.endsWith('.json')).length;
    } catch (error) {
      report.recommendations.push('สร้างโฟลเดอร์สำรองข้อมูล');
    }

    if (report.backups.count === 0) {
      report.recommendations.push('สร้างไฟล์สำรองข้อมูล');
    }

    return report;
  }
}

module.exports = ErrorHandler;