/**
 * 报告管理器 - 测试报告的存储和管理
 * 负责报告的保存、读取、删除和列表查询
 */
const fs = require('fs');
const path = require('path');

// 报告管理
class ReportManager {
  constructor() {
    // 报告存储目录：项目根目录下的 reports 文件夹
    this.reportDir = path.join(__dirname, '../../reports');
    this.ensureDirs();
  }

  /**
   * 确保报告目录存在
   * 如果目录不存在则创建
   */
  ensureDirs() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  async saveReport(taskId, report) {
    const filePath = path.join(this.reportDir, `${taskId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    return filePath;
  }

  getReport(taskId) {
    const filePath = path.join(this.reportDir, `${taskId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (err) {
        return null;
      }
    }
    return null;
  }

  deleteReport(taskId) {
    const filePath = path.join(this.reportDir, `${taskId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  /**
   * 获取报告列表
   * @returns {Array<{taskId: string, modifiedAt: Date}>} 报告列表，按修改时间降序排列
   */
  listReports() {
    try {
      return fs.readdirSync(this.reportDir)
        .filter(file => file.endsWith('.json'))
        .map(file => ({
          taskId: file.replace('.json', ''),
          modifiedAt: fs.statSync(path.join(this.reportDir, file)).mtime
        }))
        .sort((a, b) => b.modifiedAt - a.modifiedAt);
    } catch (err) {
      return [];
    }
  }

  cleanOldReports(daysToKeep = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    fs.readdirSync(this.reportDir)
      .filter(file => file.endsWith('.json'))
      .forEach(file => {
        const filePath = path.join(this.reportDir, file);
        const stats = fs.statSync(filePath);
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old report: ${file}`);
        }
      });
  }
}

module.exports = ReportManager;