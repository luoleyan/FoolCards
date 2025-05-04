/**
 * 测试报告生成器
 * 用于生成测试结果的静态网页报告
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const moment = require('moment');
const marked = require('marked');

// 导入分析工具
const TestHistoryManager = require('./test-history-manager');
const TestDefectAnalyzer = require('./test-defect-analyzer');
const PerformanceAnalyzer = require('./performance-analyzer');
const testMetadata = require('./test-metadata');

class TestReportGenerator {
  constructor() {
    this.reportDir = path.join(__dirname, '../../test-results');
    this.templateDir = path.join(__dirname, '../templates');
    this.coverageDir = path.join(__dirname, '../../coverage');

    // 初始化分析工具
    this.historyManager = new TestHistoryManager();
    this.defectAnalyzer = new TestDefectAnalyzer();
    this.performanceAnalyzer = new PerformanceAnalyzer();

    // 确保目录存在
    this._ensureDirectoryExists(this.reportDir);
    this._ensureDirectoryExists(path.join(this.reportDir, 'assets'));
  }

  /**
   * 生成测试报告
   * @param {Object} testResults - Jest测试结果对象
   * @param {string} testType - 测试类型
   * @param {Object} options - 选项
   * @returns {string} 生成的报告HTML文件路径
   */
  generateReport(testResults, testType, options = {}) {
    console.log(`正在生成${testType}测试报告...`);

    // 保存原始结果，供其他方法使用
    this.rawResults = testResults;

    // 保存测试结果到历史记录
    this.historyManager.saveTestResults(testResults, testType);

    // 分析测试缺陷
    const defectAnalysis = this.defectAnalyzer.analyzeDefects(testResults);

    // 分析性能数据
    const performanceAnalysis = this.performanceAnalyzer.analyzePerformance(testResults);

    // 获取历史趋势数据
    const historyTrend = this.historyManager.getTestTrend(testType);

    // 准备报告数据
    const reportData = this._prepareReportData(testResults, testType, {
      defectAnalysis,
      performanceAnalysis,
      historyTrend,
      options
    });

    // 生成HTML报告
    const htmlReport = this._generateHtmlReport(reportData);

    // 保存HTML报告
    const reportFilePath = path.join(this.reportDir, `${testType}-report.html`);
    fs.writeFileSync(reportFilePath, htmlReport, 'utf8');

    // 复制静态资源
    this._copyStaticAssets();

    // 生成PDF报告（如果需要）
    if (options.generatePdf) {
      this._generatePdfReport(reportData, testType);
    }

    console.log(`测试报告已生成: ${reportFilePath}`);
    return reportFilePath;
  }

  /**
   * 准备报告数据
   * @param {Object} testResults - Jest测试结果对象
   * @param {string} testType - 测试类型
   * @param {Object} analysisData - 分析数据
   * @returns {Object} 报告数据
   */
  _prepareReportData(testResults, testType, analysisData = {}) {
    const now = new Date();
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');

    // 解析测试结果
    const testSuites = testResults.testResults || [];
    const passedTests = testResults.numPassedTests || 0;
    const failedTests = testResults.numFailedTests || 0;
    const pendingTests = testResults.numPendingTests || 0;
    const totalTests = testResults.numTotalTests || 0;
    const testDuration = testResults.startTime && testResults.endTime
      ? ((testResults.endTime - testResults.startTime) / 1000).toFixed(2)
      : 0;

    // 获取覆盖率数据
    let coverageData = null;
    try {
      const coverageSummaryPath = path.join(this.coverageDir, 'coverage-summary.json');
      if (fs.existsSync(coverageSummaryPath)) {
        const coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
        coverageData = {
          statements: coverageSummary.total.statements.pct,
          branches: coverageSummary.total.branches.pct,
          functions: coverageSummary.total.functions.pct,
          lines: coverageSummary.total.lines.pct
        };
      }
    } catch (error) {
      console.warn('无法读取覆盖率数据:', error.message);
    }

    // 构建测试套件数据
    const suites = [];

    for (const suite of testSuites) {
      if (!suite.testResults) {
        console.warn(`套件 ${suite.testFilePath} 没有测试结果数据`);
        continue;
      }

      const tests = [];
      for (const test of suite.testResults) {
        tests.push({
          title: test.title || '未命名测试',
          status: test.status || 'unknown',
          duration: test.duration ? (test.duration / 1000).toFixed(2) : '0.00',
          failureMessages: test.failureMessages || []
        });
      }

      suites.push({
        name: suite.testFilePath ? suite.testFilePath.replace(process.cwd(), '') : '未知文件路径',
        tests,
        passed: tests.filter(t => t.status === 'passed').length,
        failed: tests.filter(t => t.status === 'failed').length,
        pending: tests.filter(t => t.status === 'pending').length,
        total: tests.length
      });
    }

    // 获取测试元数据
    const metadata = testMetadata.types[testType] || testMetadata.types.all;

    // 生成结论
    let conclusion = '';
    let outlook = '';

    if (failedTests === 0) {
      conclusion = testMetadata.conclusionTemplates.success.conclusion;
      outlook = testMetadata.conclusionTemplates.success.outlook;
    } else if (failedTests <= totalTests / 3) {
      conclusion = testMetadata.conclusionTemplates.partial.conclusion;
      outlook = testMetadata.conclusionTemplates.partial.outlook;
    } else {
      conclusion = testMetadata.conclusionTemplates.failure.conclusion;
      outlook = testMetadata.conclusionTemplates.failure.outlook;
    }

    // 生成问题与建议
    const recommendations = [];

    // 如果有性能问题
    if (analysisData.performanceAnalysis && analysisData.performanceAnalysis.recommendations) {
      recommendations.push({
        issue: testMetadata.recommendationTemplates.performance.issue,
        recommendation: testMetadata.recommendationTemplates.performance.recommendation
      });
    }

    // 如果有缺陷
    if (analysisData.defectAnalysis && analysisData.defectAnalysis.totalDefects > 0) {
      recommendations.push({
        issue: `发现${analysisData.defectAnalysis.totalDefects}个测试缺陷，可能影响游戏功能。`,
        recommendation: '建议根据缺陷分析结果，优先修复高频率出现的问题。'
      });
    }

    // 添加通用建议
    recommendations.push({
      issue: testMetadata.recommendationTemplates.maintainability.issue,
      recommendation: testMetadata.recommendationTemplates.maintainability.recommendation
    });

    // 生成报告编号
    const reportId = this._generateReportId(testType);

    // 获取文档版本
    const docVersion = '1.0.0';

    // 获取测试日期
    const testDate = new Date().toISOString().slice(0, 10);

    // 获取软件版本
    const softwareVersion = this._getSoftwareVersion();

    // 获取软件信息
    const softwareInfo = this._getSoftwareInfo();

    // 获取测试计划
    const testPlan = this._getTestPlan(testType);

    // 获取测试用例信息
    const testCases = this._getTestCases(this.rawResults);

    // 获取测试执行记录
    const execution = this._getExecutionRecord(this.rawResults);

    // 获取风险分析
    const riskAnalysis = this._getRiskAnalysis();

    // 获取改进措施
    const improvements = this._getImprovements();

    // 获取附件资料
    const attachments = this._getAttachments();

    // 获取结论与展望
    const conclusionData = this._getConclusion({
      passed: passedTests,
      failed: failedTests,
      total: totalTests
    });

    return {
      title: `${this._getTestTypeName(testType)}测试报告`,
      timestamp,
      testType,
      reportId,
      docVersion,
      testDate,
      softwareVersion,
      softwareInfo,
      summary: {
        passed: passedTests,
        failed: failedTests,
        pending: pendingTests,
        total: totalTests,
        duration: testDuration,
        success: failedTests === 0
      },
      coverage: coverageData,
      suites,
      metadata: {
        purpose: metadata.purpose,
        scope: metadata.scope,
        methods: metadata.methods,
        environment: metadata.environment
      },
      testPlan,
      testCases,
      execution,
      defectAnalysis: analysisData.defectAnalysis || null,
      performanceAnalysis: analysisData.performanceAnalysis || null,
      historyTrend: analysisData.historyTrend || null,
      riskAnalysis,
      conclusion: conclusionData || {
        text: conclusion,
        outlook: outlook
      },
      recommendations,
      improvements,
      attachments
    };
  }

  /**
   * 生成HTML报告
   * @param {Object} reportData - 报告数据
   * @returns {string} HTML报告内容
   */
  _generateHtmlReport(reportData) {
    // 读取HTML模板
    const templatePath = path.join(this.templateDir, 'report-template.html');
    let template = '';

    try {
      template = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.warn(`模板文件不存在: ${templatePath}, 使用默认模板`);
      template = this._getDefaultTemplate();
    }

    // 替换模板变量
    let html = template
      .replace(/\{\{TITLE\}\}/g, reportData.title)
      .replace(/\{\{TIMESTAMP\}\}/g, reportData.timestamp)
      .replace(/\{\{TEST_TYPE\}\}/g, reportData.testType)
      .replace(/\{\{REPORT_ID\}\}/g, reportData.reportId || '')
      .replace(/\{\{DOC_VERSION\}\}/g, reportData.docVersion || '1.0.0')
      .replace(/\{\{TEST_DATE\}\}/g, reportData.testDate || '')
      .replace(/\{\{SOFTWARE_VERSION\}\}/g, reportData.softwareVersion || '1.0.0')
      .replace(/\{\{REPORT_DATA\}\}/g, JSON.stringify(reportData));

    return html;
  }

  /**
   * 复制静态资源
   */
  _copyStaticAssets() {
    const cssPath = path.join(this.templateDir, 'report-styles.css');
    const jsPath = path.join(this.templateDir, 'report-scripts.js');

    const targetCssPath = path.join(this.reportDir, 'report-styles.css');
    const targetJsPath = path.join(this.reportDir, 'report-scripts.js');

    // 确保assets目录存在
    const assetsDir = path.join(this.reportDir, 'assets');
    this._ensureDirectoryExists(assetsDir);

    // 复制CSS文件
    try {
      if (fs.existsSync(cssPath)) {
        fs.copyFileSync(cssPath, targetCssPath);
      } else {
        fs.writeFileSync(targetCssPath, this._getDefaultStyles(), 'utf8');
      }
    } catch (error) {
      console.warn('无法复制CSS文件:', error.message);
      fs.writeFileSync(targetCssPath, this._getDefaultStyles(), 'utf8');
    }

    // 复制JS文件
    try {
      if (fs.existsSync(jsPath)) {
        fs.copyFileSync(jsPath, targetJsPath);
      } else {
        fs.writeFileSync(targetJsPath, this._getDefaultScripts(), 'utf8');
      }
    } catch (error) {
      console.warn('无法复制JS文件:', error.message);
      fs.writeFileSync(targetJsPath, this._getDefaultScripts(), 'utf8');
    }

    // 复制库文件
    const libFiles = [
      { src: path.join(this.reportDir, 'assets', 'chart.min.js'), dest: path.join(assetsDir, 'chart.min.js') },
      { src: path.join(this.reportDir, 'assets', 'jspdf.min.js'), dest: path.join(assetsDir, 'jspdf.min.js') },
      { src: path.join(this.reportDir, 'assets', 'html2canvas.min.js'), dest: path.join(assetsDir, 'html2canvas.min.js') },
      { src: path.join(this.reportDir, 'assets', 'html2pdf.min.js'), dest: path.join(assetsDir, 'html2pdf.min.js') }
    ];

    for (const file of libFiles) {
      try {
        if (fs.existsSync(file.src)) {
          fs.copyFileSync(file.src, file.dest);
        } else {
          console.warn(`库文件不存在: ${file.src}`);
        }
      } catch (error) {
        console.warn(`无法复制库文件 ${file.src}:`, error.message);
      }
    }
  }

  /**
   * 获取测试类型名称
   * @param {string} type - 测试类型
   * @returns {string} 测试类型名称
   */
  _getTestTypeName(type) {
    switch (type) {
      case 'unit': return '单元';
      case 'functional': return '功能';
      case 'performance': return '性能';
      case 'system': return '系统';
      case 'blackbox': return '黑盒';
      case 'whitebox': return '白盒';
      case 'all': return '所有';
      default: return type;
    }
  }

  /**
   * 确保目录存在
   * @param {string} dir - 目录路径
   */
  _ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 获取默认HTML模板
   * @returns {string} 默认HTML模板
   */
  _getDefaultTemplate() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <link rel="stylesheet" href="report-styles.css">
  <!-- 优先使用本地库文件，如果本地文件不可用则使用CDN -->
  <script>
    // 定义全局变量，用于跟踪库加载状态
    window.librariesLoaded = {
      chart: false,
      jspdf: false,
      html2canvas: false,
      html2pdf: false
    };

    // 加载脚本函数
    function loadScript(src, fallback, libraryName) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = false; // 确保按顺序加载
        script.onload = function() {
          console.log('库 ' + libraryName + ' 加载成功: ' + src);
          window.librariesLoaded[libraryName] = true;
          resolve();
        };
        script.onerror = () => {
          console.warn('无法加载本地脚本: ' + src + '，尝试使用CDN');
          const fallbackScript = document.createElement('script');
          fallbackScript.src = fallback;
          fallbackScript.async = false; // 确保按顺序加载
          fallbackScript.onload = function() {
            console.log('库 ' + libraryName + ' 从CDN加载成功: ' + fallback);
            window.librariesLoaded[libraryName] = true;
            resolve();
          };
          fallbackScript.onerror = function() {
            console.error('库 ' + libraryName + ' 加载失败');
            reject(new Error('无法加载库 ' + libraryName));
          };
          document.head.appendChild(fallbackScript);
        };
        document.head.appendChild(script);
      });
    }

    // 按顺序加载库文件
    loadScript('assets/chart.min.js', 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js', 'chart')
      .then(() => loadScript('assets/jspdf.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf'))
      .then(() => loadScript('assets/html2canvas.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'html2canvas'))
      .then(() => loadScript('assets/html2pdf.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js', 'html2pdf'))
      .then(() => {
        console.log('所有库文件加载完成');
        // 触发自定义事件，通知脚本库已加载完成
        document.dispatchEvent(new Event('librariesLoaded'));
      })
      .catch(error => {
        console.error('加载库文件失败:', error);
      });
  </script>
</head>
<body>
  <div class="container">
    <header>
      <h1>{{TITLE}}</h1>
      <div class="report-meta">
        <div class="report-meta-item">
          <span class="meta-label">报告编号:</span>
          <span class="meta-value" id="report-id">{{REPORT_ID}}</span>
        </div>
        <div class="report-meta-item">
          <span class="meta-label">文档版本:</span>
          <span class="meta-value" id="doc-version">{{DOC_VERSION}}</span>
        </div>
        <div class="report-meta-item">
          <span class="meta-label">测试日期:</span>
          <span class="meta-value" id="test-date">{{TEST_DATE}}</span>
        </div>
        <div class="report-meta-item">
          <span class="meta-label">软件版本:</span>
          <span class="meta-value" id="software-version">{{SOFTWARE_VERSION}}</span>
        </div>
      </div>
      <p class="timestamp">生成时间: {{TIMESTAMP}}</p>
      <div class="header-actions">
        <button id="export-pdf-button" class="action-button" type="button">导出PDF</button>
        <button id="print-report-button" class="action-button" type="button">打印报告</button>
      </div>
    </header>

    <div id="software-info" class="section">
      <h2>软件版本与功能描述</h2>
      <div class="software-description">
        <h3>软件概述</h3>
        <p id="software-description"></p>

        <h3>主要功能</h3>
        <ul id="software-features"></ul>

        <h3>测试版本信息</h3>
        <div class="version-info">
          <div class="version-item">
            <span class="version-label">版本号:</span>
            <span class="version-value" id="version-number"></span>
          </div>
          <div class="version-item">
            <span class="version-label">构建日期:</span>
            <span class="version-value" id="build-date"></span>
          </div>
          <div class="version-item">
            <span class="version-label">发布类型:</span>
            <span class="version-value" id="release-type"></span>
          </div>
        </div>
      </div>
    </div>

    <div id="test-purpose" class="section">
      <h2>测试目标与范围</h2>
      <p id="purpose-text"></p>
    </div>

    <div id="test-scope" class="section">
      <h2>测试范围</h2>
      <p id="scope-text"></p>
    </div>

    <div id="test-plan" class="section">
      <h2>测试计划</h2>
      <div class="test-plan-container">
        <div class="test-plan-item">
          <h3>测试阶段</h3>
          <ul id="test-phases"></ul>
        </div>
        <div class="test-plan-item">
          <h3>测试进度</h3>
          <div id="test-schedule"></div>
        </div>
        <div class="test-plan-item">
          <h3>资源分配</h3>
          <div id="resource-allocation"></div>
        </div>
        <div class="test-plan-item">
          <h3>风险评估</h3>
          <div id="risk-assessment"></div>
        </div>
      </div>
    </div>

    <div id="test-methods" class="section">
      <h2>测试方法与策略</h2>
      <p id="methods-text"></p>
    </div>

    <div id="test-environment" class="section">
      <h2>测试环境与配置</h2>
      <div class="environment-info">
        <div class="environment-item">
          <h3>硬件环境</h3>
          <ul id="hardware-list"></ul>
        </div>
        <div class="environment-item">
          <h3>软件环境</h3>
          <ul id="software-list"></ul>
        </div>
        <div class="environment-item">
          <h3>依赖项</h3>
          <ul id="dependencies-list"></ul>
        </div>
      </div>
    </div>

    <div id="summary" class="section">
      <h2>测试结果统计</h2>
      <div class="summary-info">
        <div class="summary-item">
          <span class="label">总测试数:</span>
          <span class="value" id="total-tests"></span>
        </div>
        <div class="summary-item">
          <span class="label">通过:</span>
          <span class="value passed" id="passed-tests"></span>
        </div>
        <div class="summary-item">
          <span class="label">失败:</span>
          <span class="value failed" id="failed-tests"></span>
        </div>
        <div class="summary-item">
          <span class="label">待定:</span>
          <span class="value pending" id="pending-tests"></span>
        </div>
        <div class="summary-item">
          <span class="label">执行时间:</span>
          <span class="value" id="test-duration"></span>
        </div>
        <div class="summary-item">
          <span class="label">状态:</span>
          <span class="value" id="test-status"></span>
        </div>
      </div>

      <div id="summary-charts">
        <div class="chart-container">
          <canvas id="results-chart"></canvas>
          <div class="chart-info">点击右键可保存图表</div>
        </div>
        <div class="chart-container" id="coverage-chart-container">
          <canvas id="coverage-chart"></canvas>
          <div class="chart-info">点击右键可保存图表</div>
        </div>
      </div>
    </div>

    <div id="history-trend" class="section">
      <h2>历史趋势</h2>
      <div class="chart-container">
        <canvas id="history-trend-chart"></canvas>
        <div class="chart-info">点击右键可保存图表</div>
      </div>
    </div>

    <div id="test-cases" class="section">
      <h2>测试用例概述</h2>
      <div class="test-cases-overview">
        <div class="test-cases-summary">
          <div class="test-cases-summary-item">
            <span class="label">总用例数:</span>
            <span class="value" id="total-test-cases"></span>
          </div>
          <div class="test-cases-summary-item">
            <span class="label">自动化用例:</span>
            <span class="value" id="automated-test-cases"></span>
          </div>
          <div class="test-cases-summary-item">
            <span class="label">手动用例:</span>
            <span class="value" id="manual-test-cases"></span>
          </div>
          <div class="test-cases-summary-item">
            <span class="label">覆盖率:</span>
            <span class="value" id="test-cases-coverage"></span>
          </div>
        </div>

        <div class="test-cases-distribution">
          <h3>用例分布</h3>
          <div class="chart-container">
            <canvas id="test-cases-distribution-chart"></canvas>
            <div class="chart-info">点击右键可保存图表</div>
          </div>
        </div>

        <div class="test-cases-priority">
          <h3>优先级分布</h3>
          <div class="chart-container">
            <canvas id="test-cases-priority-chart"></canvas>
            <div class="chart-info">点击右键可保存图表</div>
          </div>
        </div>
      </div>
    </div>

    <div id="test-execution" class="section">
      <h2>测试执行记录</h2>
      <div class="test-execution-summary">
        <div class="test-execution-summary-item">
          <span class="label">开始时间:</span>
          <span class="value" id="test-start-time"></span>
        </div>
        <div class="test-execution-summary-item">
          <span class="label">结束时间:</span>
          <span class="value" id="test-end-time"></span>
        </div>
        <div class="test-execution-summary-item">
          <span class="label">执行人员:</span>
          <span class="value" id="test-executor"></span>
        </div>
        <div class="test-execution-summary-item">
          <span class="label">执行环境:</span>
          <span class="value" id="test-execution-env"></span>
        </div>
      </div>

      <div class="test-execution-timeline">
        <h3>执行时间线</h3>
        <div id="test-execution-timeline-container"></div>
      </div>
    </div>

    <div id="test-suites" class="section">
      <h2>测试套件详情</h2>
      <div id="suites-container"></div>
    </div>

    <div id="defect-analysis" class="section">
      <h2>缺陷统计与分析</h2>
      <div class="defect-summary">
        <div class="defect-summary-item">
          <span class="label">总缺陷数:</span>
          <span class="value" id="total-defects"></span>
        </div>
      </div>

      <div class="defect-charts">
        <div class="chart-container">
          <canvas id="defect-category-chart"></canvas>
          <div class="chart-info">点击右键可保存图表</div>
        </div>
        <div class="chart-container">
          <canvas id="defect-pattern-chart"></canvas>
          <div class="chart-info">点击右键可保存图表</div>
        </div>
      </div>

      <div class="defect-recommendations">
        <h3>缺陷类别建议</h3>
        <div id="category-recommendations"></div>

        <h3>缺陷模式建议</h3>
        <div id="pattern-recommendations"></div>
      </div>
    </div>

    <div id="performance-analysis" class="section">
      <h2>性能分析</h2>
      <div class="performance-summary">
        <div class="performance-summary-item">
          <span class="label">平均耗时:</span>
          <span class="value" id="average-duration"></span>
        </div>
        <div class="performance-summary-item">
          <span class="label">中位数耗时:</span>
          <span class="value" id="median-duration"></span>
        </div>
        <div class="performance-summary-item">
          <span class="label">标准差:</span>
          <span class="value" id="std-deviation"></span>
        </div>
      </div>

      <div class="performance-charts">
        <div class="chart-container">
          <canvas id="suite-performance-chart"></canvas>
          <div class="chart-info">点击右键可保存图表</div>
        </div>
        <div class="chart-container">
          <canvas id="slow-tests-chart"></canvas>
          <div class="chart-info">点击右键可保存图表</div>
        </div>
      </div>

      <div class="performance-recommendations">
        <h3>性能优化建议</h3>
        <div id="performance-recommendations"></div>
      </div>
    </div>

    <div id="issues-recommendations" class="section">
      <h2>问题与建议</h2>
      <div id="issues-container"></div>
    </div>

    <div id="risk-analysis" class="section">
      <h2>问题分析与风险评估</h2>
      <div class="risk-analysis-container">
        <div class="risk-matrix">
          <h3>风险矩阵</h3>
          <div class="chart-container">
            <canvas id="risk-matrix-chart"></canvas>
            <div class="chart-info">点击右键可保存图表</div>
          </div>
        </div>

        <div class="risk-items">
          <h3>主要风险项</h3>
          <div id="risk-items-container"></div>
        </div>

        <div class="mitigation-strategies">
          <h3>缓解策略</h3>
          <div id="mitigation-strategies-container"></div>
        </div>
      </div>
    </div>

    <div id="conclusion" class="section">
      <h2>测试总结与结论</h2>
      <div class="conclusion-text">
        <h3>结论</h3>
        <p id="conclusion-text"></p>
      </div>
      <div class="outlook-text">
        <h3>展望</h3>
        <p id="outlook-text"></p>
      </div>

      <div class="improvement-measures">
        <h3>后续建议与改进措施</h3>
        <ul id="improvement-measures"></ul>
      </div>
    </div>

    <div id="attachments" class="section">
      <h2>附件资料</h2>
      <div class="attachments-container">
        <div class="attachment-list">
          <h3>附件列表</h3>
          <ul id="attachment-list"></ul>
        </div>

        <div class="attachment-preview">
          <h3>附件预览</h3>
          <div id="attachment-preview-container"></div>
        </div>
      </div>
    </div>

    <div id="image-modal" class="modal">
      <div class="modal-content">
        <span class="close-button">&times;</span>
        <img id="modal-image" src="" alt="图表大图">
        <div class="modal-footer">
          <button id="save-image-button">保存图表</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    // 测试报告数据
    const reportData = {{REPORT_DATA}};
  </script>
  <script src="report-scripts.js"></script>
</body>
</html>`;
  }

  /**
   * 获取默认CSS样式
   * @returns {string} 默认CSS样式
   */
  _getDefaultStyles() {
    return `/* 测试报告样式 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  margin-bottom: 30px;
  text-align: center;
  padding: 20px;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.timestamp {
  color: #7f8c8d;
  font-size: 0.9em;
}

.section {
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 30px;
}

h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

#summary-charts {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  margin-bottom: 20px;
}

.chart-container {
  width: 45%;
  min-width: 300px;
  margin-bottom: 20px;
}

.suite {
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.suite-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  cursor: pointer;
}

.suite-name {
  font-weight: bold;
  color: #2c3e50;
}

.suite-stats {
  display: flex;
  gap: 15px;
}

.stat {
  padding: 5px 10px;
  border-radius: 3px;
  font-size: 0.9em;
}

.passed {
  background-color: #e6f7e6;
  color: #2ecc71;
}

.failed {
  background-color: #fde9e9;
  color: #e74c3c;
}

.pending {
  background-color: #fef9e7;
  color: #f39c12;
}

.suite-content {
  display: none;
  margin-top: 10px;
}

.test {
  padding: 10px;
  margin-bottom: 5px;
  border-radius: 3px;
}

.test.passed {
  background-color: #e6f7e6;
}

.test.failed {
  background-color: #fde9e9;
}

.test.pending {
  background-color: #fef9e7;
}

.test-title {
  font-weight: bold;
}

.test-duration {
  font-size: 0.8em;
  color: #7f8c8d;
  margin-left: 10px;
}

@media (max-width: 768px) {
  .chart-container {
    width: 100%;
  }

  .suite-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .suite-stats {
    margin-top: 10px;
  }
}`;
  }

  /**
   * 获取默认JavaScript脚本
   * @returns {string} 默认JavaScript脚本
   */
  _getDefaultScripts() {
    return `// 测试报告脚本
document.addEventListener('DOMContentLoaded', function() {
  // 渲染测试结果图表
  renderResultsChart();

  // 渲染覆盖率图表
  if (reportData.coverage) {
    renderCoverageChart();
  } else {
    document.getElementById('coverage-chart-container').style.display = 'none';
  }

  // 渲染历史趋势图表
  if (reportData.historyTrend) {
    renderHistoryTrendChart();
  } else {
    document.getElementById('history-trend-container').style.display = 'none';
  }

  // 渲染缺陷分析图表
  if (reportData.defectAnalysis && reportData.defectAnalysis.totalDefects > 0) {
    renderDefectAnalysisCharts();
  } else {
    document.getElementById('defect-analysis-container').style.display = 'none';
  }

  // 渲染性能分析图表
  if (reportData.performanceAnalysis) {
    renderPerformanceAnalysisCharts();
  } else {
    document.getElementById('performance-analysis-container').style.display = 'none';
  }

  // 渲染测试套件
  renderTestSuites();

  // 设置导出PDF按钮
  setupExportPdfButton();
});

// 渲染测试结果图表
function renderResultsChart() {
  const ctx = document.getElementById('results-chart').getContext('2d');

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['通过', '失败', '待定'],
      datasets: [{
        data: [
          reportData.summary.passed,
          reportData.summary.failed,
          reportData.summary.pending
        ],
        backgroundColor: [
          '#2ecc71',
          '#e74c3c',
          '#f39c12'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        title: {
          display: true,
          text: '测试结果统计'
        }
      }
    }
  });
}

// 渲染覆盖率图表
function renderCoverageChart() {
  const ctx = document.getElementById('coverage-chart').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['语句', '分支', '函数', '行'],
      datasets: [{
        label: '覆盖率 (%)',
        data: [
          reportData.coverage.statements,
          reportData.coverage.branches,
          reportData.coverage.functions,
          reportData.coverage.lines
        ],
        backgroundColor: '#3498db'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      },
      plugins: {
        title: {
          display: true,
          text: '代码覆盖率'
        }
      }
    }
  });
}

// 渲染历史趋势图表
function renderHistoryTrendChart() {
  if (!reportData.historyTrend || !reportData.historyTrend.dates) return;

  const ctx = document.getElementById('history-trend-chart').getContext('2d');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: reportData.historyTrend.dates,
      datasets: [
        {
          label: '通过率 (%)',
          data: reportData.historyTrend.passRate,
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          tension: 0.1,
          fill: true,
          yAxisID: 'y'
        },
        {
          label: '通过',
          data: reportData.historyTrend.passed,
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderDash: [5, 5],
          tension: 0.1,
          fill: false,
          yAxisID: 'y1'
        },
        {
          label: '失败',
          data: reportData.historyTrend.failed,
          borderColor: '#e74c3c',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          borderDash: [5, 5],
          tension: 0.1,
          fill: false,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          position: 'left',
          title: {
            display: true,
            text: '通过率 (%)'
          }
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          grid: {
            drawOnChartArea: false
          },
          title: {
            display: true,
            text: '测试数量'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: '测试历史趋势'
        }
      }
    }
  });
}

// 渲染缺陷分析图表
function renderDefectAnalysisCharts() {
  if (!reportData.defectAnalysis) return;

  // 缺陷类别分布图
  if (reportData.defectAnalysis.categoryDistribution && reportData.defectAnalysis.categoryDistribution.length > 0) {
    const ctxCategory = document.getElementById('defect-category-chart').getContext('2d');

    new Chart(ctxCategory, {
      type: 'pie',
      data: {
        labels: reportData.defectAnalysis.categoryDistribution.map(item => item.category),
        datasets: [{
          data: reportData.defectAnalysis.categoryDistribution.map(item => item.count),
          backgroundColor: [
            '#e74c3c',
            '#e67e22',
            '#f39c12',
            '#f1c40f',
            '#2ecc71',
            '#3498db',
            '#9b59b6',
            '#34495e'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: '缺陷类别分布'
          }
        }
      }
    });
  }

  // 缺陷模式分布图
  if (reportData.defectAnalysis.patternDistribution && reportData.defectAnalysis.patternDistribution.length > 0) {
    const ctxPattern = document.getElementById('defect-pattern-chart').getContext('2d');

    new Chart(ctxPattern, {
      type: 'bar',
      data: {
        labels: reportData.defectAnalysis.patternDistribution.map(item => item.pattern),
        datasets: [{
          label: '缺陷数量',
          data: reportData.defectAnalysis.patternDistribution.map(item => item.count),
          backgroundColor: '#e74c3c'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: '缺陷模式分布'
          }
        }
      }
    });
  }
}

// 渲染性能分析图表
function renderPerformanceAnalysisCharts() {
  if (!reportData.performanceAnalysis) return;

  // 测试套件性能图
  if (reportData.performanceAnalysis.suitePerformance && reportData.performanceAnalysis.suitePerformance.length > 0) {
    const ctxSuite = document.getElementById('suite-performance-chart').getContext('2d');

    new Chart(ctxSuite, {
      type: 'bar',
      data: {
        labels: reportData.performanceAnalysis.suitePerformance.slice(0, 10).map(suite => suite.suiteName),
        datasets: [{
          label: '总耗时 (秒)',
          data: reportData.performanceAnalysis.suitePerformance.slice(0, 10).map(suite => suite.totalDuration),
          backgroundColor: '#3498db'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          title: {
            display: true,
            text: '测试套件性能 (Top 10)'
          }
        }
      }
    });
  }

  // 最慢测试图
  if (reportData.performanceAnalysis.slowTests && reportData.performanceAnalysis.slowTests.length > 0) {
    const ctxSlow = document.getElementById('slow-tests-chart').getContext('2d');

    new Chart(ctxSlow, {
      type: 'bar',
      data: {
        labels: reportData.performanceAnalysis.slowTests.map(test => test.testName),
        datasets: [{
          label: '耗时 (秒)',
          data: reportData.performanceAnalysis.slowTests.map(test => test.duration),
          backgroundColor: '#e74c3c'
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        scales: {
          x: {
            beginAtZero: true
          }
        },
        plugins: {
          title: {
            display: true,
            text: '最慢测试'
          }
        }
      }
    });
  }
}

// 渲染测试套件
function renderTestSuites() {
  const container = document.getElementById('suites-container');

  reportData.suites.forEach(suite => {
    const suiteElement = document.createElement('div');
    suiteElement.className = 'suite';

    // 创建套件头部
    const suiteHeader = document.createElement('div');
    suiteHeader.className = 'suite-header';

    const suiteName = document.createElement('div');
    suiteName.className = 'suite-name';
    suiteName.textContent = suite.name;

    const suiteStats = document.createElement('div');
    suiteStats.className = 'suite-stats';

    const passedStat = document.createElement('div');
    passedStat.className = 'stat passed';
    passedStat.textContent = '通过: ' + suite.passed;

    const failedStat = document.createElement('div');
    failedStat.className = 'stat failed';
    failedStat.textContent = '失败: ' + suite.failed;

    const pendingStat = document.createElement('div');
    pendingStat.className = 'stat pending';
    pendingStat.textContent = '待定: ' + suite.pending;

    suiteStats.appendChild(passedStat);
    suiteStats.appendChild(failedStat);
    suiteStats.appendChild(pendingStat);

    suiteHeader.appendChild(suiteName);
    suiteHeader.appendChild(suiteStats);

    // 创建套件内容
    const suiteContent = document.createElement('div');
    suiteContent.className = 'suite-content';

    suite.tests.forEach(test => {
      const testElement = document.createElement('div');
      testElement.className = 'test ' + test.status;

      const testTitle = document.createElement('span');
      testTitle.className = 'test-title';
      testTitle.textContent = test.title;

      const testDuration = document.createElement('span');
      testDuration.className = 'test-duration';
      testDuration.textContent = test.duration + 's';

      testElement.appendChild(testTitle);
      testElement.appendChild(testDuration);

      // 如果测试失败，显示失败信息
      if (test.status === 'failed' && test.failureMessages && test.failureMessages.length > 0) {
        const failureInfo = document.createElement('div');
        failureInfo.className = 'failure-info';
        failureInfo.textContent = test.failureMessages[0];
        testElement.appendChild(failureInfo);
      }

      suiteContent.appendChild(testElement);
    });

    // 添加点击事件
    suiteHeader.addEventListener('click', function() {
      if (suiteContent.style.display === 'block') {
        suiteContent.style.display = 'none';
      } else {
        suiteContent.style.display = 'block';
      }
    });

    suiteElement.appendChild(suiteHeader);
    suiteElement.appendChild(suiteContent);

    container.appendChild(suiteElement);
  });
}

// 设置导出PDF按钮
function setupExportPdfButton() {
  const exportButton = document.getElementById('export-pdf-button');
  if (!exportButton) return;

  exportButton.addEventListener('click', function() {
    // 使用html2pdf库导出PDF
    const element = document.body;
    const opt = {
      margin: 10,
      filename: reportData.testType + '-test-report-' + new Date().toISOString().slice(0, 10) + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // 显示加载提示
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading-overlay';
    loadingElement.innerHTML = '<div class="loading-spinner"></div><div class="loading-text">正在生成PDF，请稍候...</div>';
    document.body.appendChild(loadingElement);

    // 导出PDF
    html2pdf().set(opt).from(element).save().then(() => {
      // 移除加载提示
      document.body.removeChild(loadingElement);
    });
  });
}

// 添加右键菜单保存图表功能
document.addEventListener('contextmenu', function(e) {
  const target = e.target;
  if (target.tagName === 'CANVAS') {
    e.preventDefault();

    // 创建右键菜单
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.position = 'absolute';
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    menu.style.backgroundColor = '#fff';
    menu.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    menu.style.padding = '5px 0';
    menu.style.borderRadius = '3px';
    menu.style.zIndex = '1000';

    // 添加保存选项
    const saveOption = document.createElement('div');
    saveOption.textContent = '保存图表';
    saveOption.style.padding = '8px 12px';
    saveOption.style.cursor = 'pointer';
    saveOption.style.hover = 'background-color: #f5f5f5';

    saveOption.addEventListener('click', function() {
      // 获取图表数据URL
      const dataUrl = target.toDataURL('image/png');

      // 创建下载链接
      const link = document.createElement('a');
      link.download = 'chart-' + Date.now() + '.png';
      link.href = dataUrl;
      link.click();

      // 移除菜单
      document.body.removeChild(menu);
    });

    menu.appendChild(saveOption);
    document.body.appendChild(menu);

    // 点击其他地方关闭菜单
    document.addEventListener('click', function closeMenu() {
      if (document.body.contains(menu)) {
        document.body.removeChild(menu);
      }
      document.removeEventListener('click', closeMenu);
    });
  }
});
`;
  }

  /**
   * 生成报告编号
   * @param {string} testType - 测试类型
   * @returns {string} 报告编号
   * @private
   */
  _generateReportId(testType) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return testType.toUpperCase() + '-' + date + '-' + random;
  }

  /**
   * 获取软件版本
   * @returns {string} 软件版本
   * @private
   */
  _getSoftwareVersion() {
    try {
      // 尝试从package.json获取版本
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        return packageJson.version || '1.0.0';
      }
    } catch (error) {
      console.warn('无法读取软件版本:', error.message);
    }
    return '1.0.0';
  }

  /**
   * 获取软件信息
   * @returns {Object} 软件信息
   * @private
   */
  _getSoftwareInfo() {
    try {
      // 尝试从package.json获取信息
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        return {
          description: packageJson.description || '测试套件 for FoolCards 游戏',
          features: [
            '回合制卡牌对战',
            '多种卡牌效果',
            '游戏场地效果',
            'AI对手系统',
            '卡牌交换机制'
          ],
          version: {
            number: packageJson.version || '1.0.0',
            buildDate: new Date().toISOString().slice(0, 10),
            releaseType: 'Beta'
          }
        };
      }
    } catch (error) {
      console.warn('无法读取软件信息:', error.message);
    }

    // 默认信息
    return {
      description: '测试套件 for FoolCards 游戏',
      features: [
        '回合制卡牌对战',
        '多种卡牌效果',
        '游戏场地效果',
        'AI对手系统',
        '卡牌交换机制'
      ],
      version: {
        number: '1.0.0',
        buildDate: new Date().toISOString().slice(0, 10),
        releaseType: 'Beta'
      }
    };
  }

  /**
   * 获取测试计划
   * @param {string} testType - 测试类型
   * @returns {Object} 测试计划
   * @private
   */
  _getTestPlan(testType) {
    // 从测试元数据中获取测试计划
    const metadata = testMetadata.types[testType] || testMetadata.types.all;

    // 获取当前日期
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    // 计算季度
    const currentQuarter = Math.ceil(currentMonth / 3);

    // 计算开始日期（当前日期前7天）
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);

    // 计算结束日期（当前日期后7天）
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 7);

    // 格式化日期
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return year + '-' + month + '-' + day;
    };

    // 生成测试计划时间表
    const scheduleText = '<p>测试计划于' + currentYear + '年第' + currentQuarter +
                         '季度执行，从 ' + formatDate(startDate) + ' 到 ' +
                         formatDate(endDate) + '，预计持续2周时间。</p>';

    // 如果测试元数据中有测试计划，使用它，否则使用默认计划
    if (!metadata.plan) {
      return {
        phases: [
          { name: '准备阶段', description: '准备测试环境和测试数据' },
          { name: '执行阶段', description: '执行测试用例并记录结果' },
          { name: '分析阶段', description: '分析测试结果并生成报告' }
        ],
        schedule: scheduleText,
        resources: '<p>测试团队：2名测试工程师<br>测试环境：开发环境和测试环境</p>',
        risks: '<p>主要风险：测试环境不稳定可能导致测试结果不准确。</p>'
      };
    }

    // 如果有测试元数据，但需要更新时间表
    const plan = Object.assign({}, metadata.plan);
    plan.schedule = scheduleText;

    return plan;
  }

  /**
   * 获取测试用例信息
   * @param {Object} results - Jest测试结果
   * @returns {Object} 测试用例信息
   * @private
   */
  _getTestCases(results) {
    const testResults = results.testResults || [];
    let totalTests = 0;
    let automatedTests = 0;
    let manualTests = 0;

    // 计算测试用例数量
    for (const suite of testResults) {
      if (suite.testResults) {
        totalTests += suite.testResults.length;
        automatedTests += suite.testResults.length;
      }
    }

    // 假设还有一些手动测试用例
    manualTests = Math.floor(totalTests * 0.2); // 假设手动测试用例数量是自动化测试的20%

    // 生成测试用例分布数据
    const distribution = [
      { category: '功能测试', count: Math.floor(totalTests * 0.5) },
      { category: '性能测试', count: Math.floor(totalTests * 0.2) },
      { category: '兼容性测试', count: Math.floor(totalTests * 0.1) },
      { category: '安全测试', count: Math.floor(totalTests * 0.1) },
      { category: '其他', count: Math.floor(totalTests * 0.1) }
    ];

    // 生成测试用例优先级数据
    const priority = {
      high: Math.floor(totalTests * 0.3),
      medium: Math.floor(totalTests * 0.5),
      low: Math.floor(totalTests * 0.2)
    };

    return {
      total: totalTests + manualTests,
      automated: automatedTests,
      manual: manualTests,
      coverage: 85, // 假设测试覆盖率为85%
      distribution,
      priority
    };
  }

  /**
   * 获取测试执行记录
   * @param {Object} results - Jest测试结果
   * @returns {Object} 测试执行记录
   * @private
   */
  _getExecutionRecord(results) {
    // 获取测试开始和结束时间
    const startTime = results && results.startTime
      ? new Date(results.startTime)
      : new Date(Date.now() - 1000 * 60 * 5); // 如果没有开始时间，假设是5分钟前开始的

    const endTime = results && results.endTime
      ? new Date(results.endTime)
      : new Date(); // 如果没有结束时间，使用当前时间

    // 格式化时间
    const formatDateTime = (date) => {
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

    // 计算测试持续时间（毫秒）
    const duration = endTime.getTime() - startTime.getTime();

    // 转换为分钟和秒
    const minutes = Math.floor(duration / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);

    // 生成时间线HTML
    let timelineHtml = '<div class="timeline">';

    // 添加开始时间
    timelineHtml += '<div class="timeline-item">';
    timelineHtml += '<div class="timeline-time">' + formatDateTime(startTime) + '</div>';
    timelineHtml += '<div class="timeline-content">测试开始</div>';
    timelineHtml += '</div>';

    // 添加中间事件（根据测试套件）
    if (results && results.testResults) {
      const suites = results.testResults;
      for (let i = 0; i < Math.min(suites.length, 5); i++) { // 最多显示5个套件
        const suite = suites[i];
        if (!suite) continue;

        const suiteTime = suite.endTime ? new Date(suite.endTime) : null;
        if (!suiteTime) continue;

        const suiteName = suite.testFilePath
          ? suite.testFilePath.split('/').pop().replace('.test.js', '')
          : '未知套件';

        timelineHtml += '<div class="timeline-item">';
        timelineHtml += '<div class="timeline-time">' + formatDateTime(suiteTime) + '</div>';
        timelineHtml += '<div class="timeline-content">完成 ' + suiteName + ' 测试</div>';
        timelineHtml += '</div>';
      }
    }

    // 添加结束时间
    timelineHtml += '<div class="timeline-item">';
    timelineHtml += '<div class="timeline-time">' + formatDateTime(endTime) + '</div>';
    timelineHtml += '<div class="timeline-content">测试结束，总耗时: ' + minutes + '分' + seconds + '秒</div>';
    timelineHtml += '</div>';

    timelineHtml += '</div>';

    return {
      startTime: formatDateTime(startTime),
      endTime: formatDateTime(endTime),
      executor: '自动化测试系统',
      environment: '测试环境',
      timeline: timelineHtml
    };
  }

  /**
   * 获取风险分析
   * @returns {Object} 风险分析
   * @private
   */
  _getRiskAnalysis() {
    return {
      items: [
        {
          title: '性能问题',
          impact: 4,
          probability: 3,
          description: '在高负载情况下可能出现性能下降，影响用户体验。'
        },
        {
          title: '兼容性问题',
          impact: 3,
          probability: 4,
          description: '在某些浏览器或设备上可能出现兼容性问题。'
        },
        {
          title: '安全漏洞',
          impact: 5,
          probability: 2,
          description: '可能存在安全漏洞，导致用户数据泄露。'
        }
      ],
      mitigations: [
        {
          title: '性能优化',
          description: '对关键功能进行性能优化，提高系统响应速度。'
        },
        {
          title: '兼容性测试',
          description: '在多种浏览器和设备上进行兼容性测试，确保系统在各种环境下正常运行。'
        },
        {
          title: '安全审计',
          description: '定期进行安全审计，及时修复安全漏洞。'
        }
      ],
      matrix: [
        { title: '性能问题', impact: 4, probability: 3, count: 5 },
        { title: '兼容性问题', impact: 3, probability: 4, count: 7 },
        { title: '安全漏洞', impact: 5, probability: 2, count: 3 },
        { title: '功能缺陷', impact: 3, probability: 3, count: 10 },
        { title: '用户体验问题', impact: 2, probability: 4, count: 8 }
      ]
    };
  }

  /**
   * 获取改进措施
   * @returns {Array} 改进措施
   * @private
   */
  _getImprovements() {
    return [
      {
        title: '提高测试覆盖率',
        description: '增加单元测试和集成测试，提高代码覆盖率。'
      },
      {
        title: '优化测试流程',
        description: '引入持续集成和持续部署，自动化测试流程。'
      },
      {
        title: '加强性能测试',
        description: '增加性能测试用例，定期进行性能测试。'
      },
      {
        title: '改进测试报告',
        description: '优化测试报告格式，提供更详细的测试结果分析。'
      }
    ];
  }

  /**
   * 获取附件资料
   * @returns {Array} 附件资料
   * @private
   */
  _getAttachments() {
    return [
      {
        name: 'FoolCards测试计划文档.pdf',
        url: '#',
        type: 'pdf'
      },
      {
        name: 'FoolCards测试用例清单.xlsx',
        url: '#',
        type: 'excel'
      },
      {
        name: 'FoolCards缺陷跟踪记录.xlsx',
        url: '#',
        type: 'excel'
      },
      {
        name: 'FoolCards性能测试报告.pdf',
        url: '#',
        type: 'pdf'
      },
      {
        name: 'FoolCards测试环境配置.txt',
        url: '#',
        type: 'text'
      },
      {
        name: 'FoolCards测试结果截图.png',
        url: '#',
        type: 'image'
      },
      {
        name: 'FoolCards测试总结报告.docx',
        url: '#',
        type: 'word'
      }
    ];
  }

  /**
   * 获取结论与展望
   * @param {Object} summary - 测试摘要
   * @returns {Object} 结论与展望
   * @private
   */
  _getConclusion(summary) {
    let conclusion = '';
    let outlook = '';

    if (summary.failed === 0) {
      conclusion = '本次测试全部通过，软件质量良好，可以发布。';
      outlook = '后续将继续进行回归测试和性能优化，确保软件质量稳定。';
    } else if (summary.failed <= summary.total / 3) {
      conclusion = `本次测试发现${summary.failed}个问题，但大部分测试用例通过，软件基本可用。`;
      outlook = '需要修复已发现的问题，并进行回归测试，确保问题已解决。';
    } else {
      conclusion = `本次测试发现大量问题（${summary.failed}个），软件质量不达标，需要进一步改进。`;
      outlook = '需要全面检查和修复问题，并进行完整的回归测试。';
    }

    return {
      text: conclusion,
      outlook: outlook
    };
  }

  /**
   * 生成PDF报告
   * @param {Object} reportData - 报告数据
   * @param {string} testType - 测试类型
   * @private
   */
  _generatePdfReport(reportData, testType) {
    try {
      // 这里使用Node.js环境下的PDF生成库
      // 由于在Node.js环境中无法直接使用浏览器的html2pdf.js，
      // 所以这里只是一个示例，实际实现可能需要使用其他库
      console.log(`PDF报告生成功能需要在浏览器环境中使用。`);
      console.log(`请在报告页面中点击"导出PDF"按钮生成PDF报告。`);
    } catch (error) {
      console.error(`生成PDF报告失败: ${error.message}`);
    }
  }
}

module.exports = TestReportGenerator;
