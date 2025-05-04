/**
 * Jest测试结果处理器
 * 用于处理Jest测试结果并生成报告
 */

const fs = require('fs');
const path = require('path');
const TestReportGenerator = require('./test-report-generator');

class TestResultsProcessor {
  constructor() {
    this.reportGenerator = new TestReportGenerator();
  }

  /**
   * 处理测试结果
   * @param {Object} results - Jest测试结果对象
   * @param {Object} options - 处理选项
   * @returns {Object} 处理后的测试结果
   */
  process(results, options = {}) {
    const { testType = 'all', generatePdf = false } = options;

    // 生成HTML报告
    const reportPath = this.reportGenerator.generateReport(results, testType, { generatePdf });

    // 保存原始测试结果
    this._saveRawResults(results, testType);

    // 打开测试报告
    this._openReport(reportPath);

    // 返回原始结果
    return results;
  }

  /**
   * 保存原始测试结果
   * @param {Object} results - Jest测试结果对象
   * @param {string} testType - 测试类型
   */
  _saveRawResults(results, testType) {
    const resultsDir = path.join(__dirname, '../../test-results');

    // 确保目录存在
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // 保存JSON结果
    const resultsPath = path.join(resultsDir, `${testType}-results.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf8');
  }

  /**
   * 打开测试报告
   * @param {string} reportPath - 报告文件路径
   */
  _openReport(reportPath) {
    // 检查操作系统类型
    const isWindows = process.platform === 'win32';
    const isMac = process.platform === 'darwin';
    const isLinux = process.platform === 'linux';

    try {
      // 根据操作系统打开报告
      if (isWindows) {
        require('child_process').exec(`start "" "${reportPath}"`);
      } else if (isMac) {
        require('child_process').exec(`open "${reportPath}"`);
      } else if (isLinux) {
        require('child_process').exec(`xdg-open "${reportPath}"`);
      } else {
        console.log(`测试报告已生成: ${reportPath}`);
      }
    } catch (error) {
      console.warn(`无法自动打开测试报告: ${error.message}`);
      console.log(`测试报告已生成: ${reportPath}`);
    }
  }
}

module.exports = TestResultsProcessor;
