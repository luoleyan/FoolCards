/**
 * 测试历史数据管理器
 * 用于保存和加载历史测试结果
 */

const fs = require('fs');
const path = require('path');
const moment = require('moment');

class TestHistoryManager {
  constructor() {
    this.historyDir = path.join(__dirname, '../../test-results/history');
    this._ensureDirectoryExists(this.historyDir);
  }
  
  /**
   * 保存测试结果到历史记录
   * @param {Object} testResults - 测试结果对象
   * @param {string} testType - 测试类型
   * @returns {string} 保存的文件路径
   */
  saveTestResults(testResults, testType) {
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const fileName = `${testType}_${timestamp}.json`;
    const filePath = path.join(this.historyDir, fileName);
    
    // 提取关键数据
    const historyData = {
      timestamp,
      testType,
      summary: {
        passed: testResults.numPassedTests || 0,
        failed: testResults.numFailedTests || 0,
        pending: testResults.numPendingTests || 0,
        total: testResults.numTotalTests || 0,
        duration: testResults.startTime && testResults.endTime 
          ? ((testResults.endTime - testResults.startTime) / 1000).toFixed(2)
          : 0
      },
      date: moment().format('YYYY-MM-DD')
    };
    
    // 保存历史数据
    fs.writeFileSync(filePath, JSON.stringify(historyData, null, 2), 'utf8');
    
    // 更新测试类型的历史索引
    this._updateHistoryIndex(testType, fileName, historyData);
    
    return filePath;
  }
  
  /**
   * 获取测试类型的历史数据
   * @param {string} testType - 测试类型
   * @param {number} limit - 限制返回的记录数量，默认为10
   * @returns {Array} 历史数据数组
   */
  getTestHistory(testType, limit = 10) {
    const indexPath = path.join(this.historyDir, `${testType}_index.json`);
    
    if (!fs.existsSync(indexPath)) {
      return [];
    }
    
    try {
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      return index.history.slice(0, limit);
    } catch (error) {
      console.warn(`无法读取历史索引: ${error.message}`);
      return [];
    }
  }
  
  /**
   * 获取所有测试类型的最新历史数据
   * @returns {Object} 各测试类型的最新历史数据
   */
  getLatestHistory() {
    const result = {};
    const testTypes = ['unit', 'functional', 'performance', 'system', 'blackbox', 'whitebox', 'all'];
    
    for (const type of testTypes) {
      const history = this.getTestHistory(type, 1);
      if (history.length > 0) {
        result[type] = history[0];
      }
    }
    
    return result;
  }
  
  /**
   * 获取测试类型的历史趋势数据
   * @param {string} testType - 测试类型
   * @param {number} days - 天数，默认为7
   * @returns {Object} 趋势数据
   */
  getTestTrend(testType, days = 7) {
    const history = this.getTestHistory(testType, 100); // 获取足够多的历史记录
    const now = moment();
    const result = {
      dates: [],
      passed: [],
      failed: [],
      pending: [],
      passRate: []
    };
    
    // 初始化日期数组
    for (let i = days - 1; i >= 0; i--) {
      const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
      result.dates.push(date);
      result.passed.push(0);
      result.failed.push(0);
      result.pending.push(0);
      result.passRate.push(0);
    }
    
    // 填充数据
    for (const item of history) {
      const date = item.date;
      const index = result.dates.indexOf(date);
      
      if (index !== -1) {
        result.passed[index] += item.summary.passed;
        result.failed[index] += item.summary.failed;
        result.pending[index] += item.summary.pending;
        
        const total = item.summary.passed + item.summary.failed + item.summary.pending;
        result.passRate[index] = total > 0 ? (item.summary.passed / total) * 100 : 0;
      }
    }
    
    return result;
  }
  
  /**
   * 更新历史索引
   * @param {string} testType - 测试类型
   * @param {string} fileName - 文件名
   * @param {Object} data - 历史数据
   * @private
   */
  _updateHistoryIndex(testType, fileName, data) {
    const indexPath = path.join(this.historyDir, `${testType}_index.json`);
    let index = { history: [] };
    
    // 读取现有索引
    if (fs.existsSync(indexPath)) {
      try {
        index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      } catch (error) {
        console.warn(`无法读取历史索引: ${error.message}`);
      }
    }
    
    // 添加新记录
    index.history.unshift({
      fileName,
      timestamp: data.timestamp,
      date: data.date,
      summary: data.summary
    });
    
    // 限制历史记录数量
    if (index.history.length > 100) {
      index.history = index.history.slice(0, 100);
    }
    
    // 保存索引
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
  }
  
  /**
   * 确保目录存在
   * @param {string} dir - 目录路径
   * @private
   */
  _ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

module.exports = TestHistoryManager;
