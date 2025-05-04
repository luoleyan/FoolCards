// 测试报告脚本
document.addEventListener('DOMContentLoaded', function() {
  // 初始化报告
  function initReport() {
    console.log('初始化测试报告...');

    try {
      // 填充报告元数据
      fillReportMetadata();

      // 填充软件信息
      fillSoftwareInfo();

      // 填充摘要信息
      fillSummaryInfo();

      // 填充测试元数据
      fillTestMetadata();

      // 填充测试计划
      fillTestPlan();

      // 填充测试用例概述
      fillTestCasesOverview();

      // 填充测试执行记录
      fillTestExecutionRecord();

      // 检查Chart.js是否已加载
      if (typeof Chart === 'undefined') {
        console.error('Chart.js 库未加载，无法渲染图表');
        document.querySelectorAll('.chart-container').forEach(container => {
          container.innerHTML = '<div class="error-message">图表库加载失败，无法显示图表</div>';
        });
      } else {
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
          document.getElementById('history-trend').style.display = 'none';
        }

        // 渲染测试用例分布图表
        renderTestCasesDistributionChart();

        // 渲染测试用例优先级图表
        renderTestCasesPriorityChart();

        // 渲染缺陷分析
        if (reportData.defectAnalysis && reportData.defectAnalysis.totalDefects > 0) {
          fillDefectAnalysis();
          renderDefectAnalysisCharts();
        } else {
          document.getElementById('defect-analysis').style.display = 'none';
        }

        // 渲染性能分析
        if (reportData.performanceAnalysis) {
          fillPerformanceAnalysis();
          renderPerformanceAnalysisCharts();
        } else {
          document.getElementById('performance-analysis').style.display = 'none';
        }

        // 渲染风险矩阵
        renderRiskMatrix();

        // 设置图表点击事件
        setupChartClickEvents();
      }

      // 填充风险分析
      fillRiskAnalysis();

      // 填充问题与建议
      fillIssuesRecommendations();

      // 填充结论与展望
      fillConclusion();

      // 填充改进措施
      fillImprovementMeasures();

      // 填充附件资料
      fillAttachments();

      // 渲染测试套件
      renderTestSuites();

      // 设置模态框事件
      setupModalEvents();

      // 设置导出PDF按钮
      setupExportPdfButton();

      // 设置打印按钮
      setupPrintButton();

      console.log('测试报告初始化完成');

      // 隐藏加载提示
      hideLoading();
    } catch (error) {
      console.error('初始化报告时发生错误:', error);
      alert('初始化报告时发生错误: ' + error.message);
      hideLoading();
    }
  }

  // 显示加载状态
  function showLoading() {
    // 检查是否已存在加载提示
    if (document.getElementById('loading-libraries')) {
      return;
    }

    const loadingElement = document.createElement('div');
    loadingElement.id = 'loading-libraries';
    loadingElement.className = 'loading-overlay';
    loadingElement.innerHTML = '<div class="loading-spinner"></div><div class="loading-text">正在加载库文件，请稍候...</div>';
    document.body.appendChild(loadingElement);
  }

  // 隐藏加载状态
  function hideLoading() {
    const loadingElement = document.getElementById('loading-libraries');
    if (loadingElement && document.body.contains(loadingElement)) {
      document.body.removeChild(loadingElement);
    }
  }

  // 显示加载提示
  showLoading();

  // 监听库加载完成事件
  document.addEventListener('librariesLoaded', function() {
    console.log('收到库加载完成事件');
    initReport();
  });

  // 如果5秒后仍未收到库加载完成事件，尝试直接初始化
  setTimeout(function() {
    if (document.getElementById('loading-libraries')) {
      console.warn('未收到库加载完成事件，尝试直接初始化报告');
      initReport();
    }
  }, 5000);
});

// 填充报告元数据
function fillReportMetadata() {
  // 生成报告编号
  const reportId = generateReportId();
  document.getElementById('report-id').textContent = reportId;

  // 设置文档版本
  const docVersion = reportData.docVersion || '1.0.0';
  document.getElementById('doc-version').textContent = docVersion;

  // 设置测试日期
  const testDate = reportData.testDate || new Date().toISOString().slice(0, 10);
  document.getElementById('test-date').textContent = testDate;

  // 设置软件版本
  const softwareVersion = reportData.softwareVersion || '1.0.0';
  document.getElementById('software-version').textContent = softwareVersion;
}

// 生成报告编号
function generateReportId() {
  if (reportData.reportId) {
    return reportData.reportId;
  }

  const testType = reportData.testType.toUpperCase();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  return `${testType}-${date}-${random}`;
}

// 填充软件信息
function fillSoftwareInfo() {
  if (!reportData.softwareInfo) {
    document.getElementById('software-info').style.display = 'none';
    return;
  }

  const info = reportData.softwareInfo;

  // 填充软件描述
  if (info.description) {
    document.getElementById('software-description').textContent = info.description;
  }

  // 填充主要功能
  if (info.features && info.features.length > 0) {
    const featuresList = document.getElementById('software-features');

    for (const feature of info.features) {
      const li = document.createElement('li');
      li.textContent = feature;
      featuresList.appendChild(li);
    }
  }

  // 填充版本信息
  if (info.version) {
    document.getElementById('version-number').textContent = info.version.number || 'N/A';
    document.getElementById('build-date').textContent = info.version.buildDate || 'N/A';
    document.getElementById('release-type').textContent = info.version.releaseType || 'N/A';
  }
}

// 填充摘要信息
function fillSummaryInfo() {
  document.getElementById('total-tests').textContent = reportData.summary.total;
  document.getElementById('passed-tests').textContent = reportData.summary.passed;
  document.getElementById('failed-tests').textContent = reportData.summary.failed;
  document.getElementById('pending-tests').textContent = reportData.summary.pending;
  document.getElementById('test-duration').textContent = `${reportData.summary.duration}秒`;

  const statusElement = document.getElementById('test-status');
  if (reportData.summary.success) {
    statusElement.textContent = '通过';
    statusElement.className = 'value passed';
  } else {
    statusElement.textContent = '失败';
    statusElement.className = 'value failed';
  }
}

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
    passedStat.textContent = `通过: ${suite.passed}`;

    const failedStat = document.createElement('div');
    failedStat.className = 'stat failed';
    failedStat.textContent = `失败: ${suite.failed}`;

    const pendingStat = document.createElement('div');
    pendingStat.className = 'stat pending';
    pendingStat.textContent = `待定: ${suite.pending}`;

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
      testElement.className = `test ${test.status}`;

      const testTitle = document.createElement('span');
      testTitle.className = 'test-title';
      testTitle.textContent = test.title;

      const testDuration = document.createElement('span');
      testDuration.className = 'test-duration';
      testDuration.textContent = `${test.duration}s`;

      testElement.appendChild(testTitle);
      testElement.appendChild(testDuration);

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

// 设置图表点击事件
function setupChartClickEvents() {
  const charts = document.querySelectorAll('canvas');

  charts.forEach(chart => {
    chart.addEventListener('click', function() {
      showImageModal(this);
    });
  });
}

// 显示图表模态框
function showImageModal(canvas) {
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-image');

  // 获取高质量图表
  const dataUrl = canvas.toDataURL('image/png');

  modalImg.src = dataUrl;
  modal.style.display = 'block';
}

// 设置模态框事件
function setupModalEvents() {
  const modal = document.getElementById('image-modal');
  const closeButton = document.querySelector('.close-button');
  const saveButton = document.getElementById('save-image-button');

  // 关闭按钮事件
  closeButton.addEventListener('click', function() {
    modal.style.display = 'none';
  });

  // 点击模态框外部关闭
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });

  // 保存图片按钮事件
  saveButton.addEventListener('click', function() {
    const modalImg = document.getElementById('modal-image');

    // 创建下载链接
    const link = document.createElement('a');
    link.download = `chart-${Date.now()}.png`;
    link.href = modalImg.src;
    link.click();
  });
}

// 填充测试元数据
function fillTestMetadata() {
  if (!reportData.metadata) return;

  // 填充测试目的
  if (reportData.metadata.purpose) {
    document.getElementById('purpose-text').textContent = reportData.metadata.purpose;
  } else {
    document.getElementById('test-purpose').style.display = 'none';
  }

  // 填充测试范围
  if (reportData.metadata.scope) {
    document.getElementById('scope-text').textContent = reportData.metadata.scope;
  } else {
    document.getElementById('test-scope').style.display = 'none';
  }

  // 填充测试方法
  if (reportData.metadata.methods) {
    document.getElementById('methods-text').textContent = reportData.metadata.methods;
  } else {
    document.getElementById('test-methods').style.display = 'none';
  }

  // 填充测试环境
  if (reportData.metadata.environment) {
    const env = reportData.metadata.environment;

    // 硬件环境
    if (env.hardware) {
      const hardwareList = document.getElementById('hardware-list');

      if (typeof env.hardware === 'string') {
        const li = document.createElement('li');
        li.textContent = env.hardware;
        hardwareList.appendChild(li);
      } else {
        for (const [key, value] of Object.entries(env.hardware)) {
          const li = document.createElement('li');
          li.textContent = `${key}: ${value}`;
          hardwareList.appendChild(li);
        }
      }
    }

    // 软件环境
    if (env.software) {
      const softwareList = document.getElementById('software-list');

      if (typeof env.software === 'string') {
        const li = document.createElement('li');
        li.textContent = env.software;
        softwareList.appendChild(li);
      } else {
        for (const [key, value] of Object.entries(env.software)) {
          const li = document.createElement('li');
          li.textContent = `${key}: ${value}`;
          softwareList.appendChild(li);
        }
      }
    }

    // 依赖项
    if (env.dependencies) {
      const dependenciesList = document.getElementById('dependencies-list');

      if (typeof env.dependencies === 'string') {
        const li = document.createElement('li');
        li.textContent = env.dependencies;
        dependenciesList.appendChild(li);
      } else {
        for (const [key, value] of Object.entries(env.dependencies)) {
          const li = document.createElement('li');
          li.textContent = `${key}: ${value}`;
          dependenciesList.appendChild(li);
        }
      }
    }
  } else {
    document.getElementById('test-environment').style.display = 'none';
  }
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

// 填充缺陷分析
function fillDefectAnalysis() {
  if (!reportData.defectAnalysis) return;

  // 填充总缺陷数
  document.getElementById('total-defects').textContent = reportData.defectAnalysis.totalDefects;

  // 填充缺陷类别建议
  if (reportData.defectAnalysis.recommendations && reportData.defectAnalysis.recommendations.categoryRecommendations) {
    const categoryRecommendationsContainer = document.getElementById('category-recommendations');

    for (const rec of reportData.defectAnalysis.recommendations.categoryRecommendations) {
      const recElement = document.createElement('div');
      recElement.className = 'recommendation-item';

      const category = document.createElement('div');
      category.className = 'recommendation-category';
      category.innerHTML = `<strong>${rec.category}</strong> (${rec.count}个, ${rec.percentage}%)`;

      const recommendation = document.createElement('div');
      recommendation.className = 'recommendation-text';
      recommendation.textContent = rec.recommendation;

      recElement.appendChild(category);
      recElement.appendChild(recommendation);

      categoryRecommendationsContainer.appendChild(recElement);
    }
  }

  // 填充缺陷模式建议
  if (reportData.defectAnalysis.recommendations && reportData.defectAnalysis.recommendations.patternRecommendations) {
    const patternRecommendationsContainer = document.getElementById('pattern-recommendations');

    for (const rec of reportData.defectAnalysis.recommendations.patternRecommendations) {
      const recElement = document.createElement('div');
      recElement.className = 'recommendation-item';

      const pattern = document.createElement('div');
      pattern.className = 'recommendation-pattern';
      pattern.innerHTML = `<strong>${rec.pattern}</strong> (${rec.count}个, ${rec.percentage}%)`;

      const recommendation = document.createElement('div');
      recommendation.className = 'recommendation-text';
      recommendation.textContent = rec.recommendation;

      recElement.appendChild(pattern);
      recElement.appendChild(recommendation);

      patternRecommendationsContainer.appendChild(recElement);
    }
  }
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

// 填充性能分析
function fillPerformanceAnalysis() {
  if (!reportData.performanceAnalysis) return;

  const summary = reportData.performanceAnalysis.summary;

  // 填充性能摘要
  document.getElementById('average-duration').textContent = `${summary.averageDuration.toFixed(3)}秒`;
  document.getElementById('median-duration').textContent = `${summary.medianDuration.toFixed(3)}秒`;
  document.getElementById('std-deviation').textContent = `${summary.stdDeviation.toFixed(3)}秒`;

  // 填充性能优化建议
  if (reportData.performanceAnalysis.recommendations) {
    const recommendationsContainer = document.getElementById('performance-recommendations');

    for (const rec of reportData.performanceAnalysis.recommendations) {
      const recElement = document.createElement('div');
      recElement.className = 'recommendation-item';

      const type = document.createElement('div');
      type.className = 'recommendation-type';
      type.innerHTML = `<strong>${rec.type}</strong> (影响: ${rec.impact})`;

      const description = document.createElement('div');
      description.className = 'recommendation-description';
      description.textContent = rec.description;

      const recommendation = document.createElement('div');
      recommendation.className = 'recommendation-text';
      recommendation.textContent = rec.recommendation;

      recElement.appendChild(type);
      recElement.appendChild(description);
      recElement.appendChild(recommendation);

      if (rec.targets && rec.targets.length > 0) {
        const targets = document.createElement('div');
        targets.className = 'recommendation-targets';
        targets.innerHTML = '<strong>目标:</strong>';

        const targetsList = document.createElement('ul');
        for (const target of rec.targets) {
          const targetItem = document.createElement('li');
          targetItem.textContent = target;
          targetsList.appendChild(targetItem);
        }

        targets.appendChild(targetsList);
        recElement.appendChild(targets);
      }

      recommendationsContainer.appendChild(recElement);
    }
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

// 填充问题与建议
function fillIssuesRecommendations() {
  if (!reportData.recommendations || reportData.recommendations.length === 0) {
    document.getElementById('issues-recommendations').style.display = 'none';
    return;
  }

  const container = document.getElementById('issues-container');

  for (const rec of reportData.recommendations) {
    const issueItem = document.createElement('div');
    issueItem.className = 'issue-item';

    const issueTitle = document.createElement('div');
    issueTitle.className = 'issue-title';
    issueTitle.textContent = rec.issue;

    const issueRecommendation = document.createElement('div');
    issueRecommendation.className = 'issue-recommendation';
    issueRecommendation.textContent = rec.recommendation;

    issueItem.appendChild(issueTitle);
    issueItem.appendChild(issueRecommendation);

    container.appendChild(issueItem);
  }
}

// 填充测试计划
function fillTestPlan() {
  if (!reportData.testPlan) {
    document.getElementById('test-plan').style.display = 'none';
    return;
  }

  const plan = reportData.testPlan;

  // 填充测试阶段
  if (plan.phases && plan.phases.length > 0) {
    const phasesList = document.getElementById('test-phases');

    for (const phase of plan.phases) {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${phase.name}</strong>: ${phase.description}`;
      phasesList.appendChild(li);
    }
  }

  // 填充测试进度
  if (plan.schedule) {
    const scheduleContainer = document.getElementById('test-schedule');
    scheduleContainer.innerHTML = plan.schedule;
  }

  // 填充资源分配
  if (plan.resources) {
    const resourcesContainer = document.getElementById('resource-allocation');
    resourcesContainer.innerHTML = plan.resources;
  }

  // 填充风险评估
  if (plan.risks) {
    const risksContainer = document.getElementById('risk-assessment');
    risksContainer.innerHTML = plan.risks;
  }
}

// 填充测试用例概述
function fillTestCasesOverview() {
  if (!reportData.testCases) {
    document.getElementById('test-cases').style.display = 'none';
    return;
  }

  const cases = reportData.testCases;

  // 填充用例数量
  document.getElementById('total-test-cases').textContent = cases.total || 0;
  document.getElementById('automated-test-cases').textContent = cases.automated || 0;
  document.getElementById('manual-test-cases').textContent = cases.manual || 0;
  document.getElementById('test-cases-coverage').textContent = `${cases.coverage || 0}%`;
}

// 渲染测试用例分布图表
function renderTestCasesDistributionChart() {
  if (!reportData.testCases || !reportData.testCases.distribution) {
    document.querySelector('.test-cases-distribution').style.display = 'none';
    return;
  }

  const ctx = document.getElementById('test-cases-distribution-chart').getContext('2d');

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: reportData.testCases.distribution.map(item => item.category),
      datasets: [{
        data: reportData.testCases.distribution.map(item => item.count),
        backgroundColor: [
          '#3498db',
          '#2ecc71',
          '#9b59b6',
          '#e67e22',
          '#f1c40f',
          '#1abc9c',
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
          text: '测试用例分布'
        }
      }
    }
  });
}

// 渲染测试用例优先级图表
function renderTestCasesPriorityChart() {
  if (!reportData.testCases || !reportData.testCases.priority) {
    document.querySelector('.test-cases-priority').style.display = 'none';
    return;
  }

  const ctx = document.getElementById('test-cases-priority-chart').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['高', '中', '低'],
      datasets: [{
        label: '用例数量',
        data: [
          reportData.testCases.priority.high || 0,
          reportData.testCases.priority.medium || 0,
          reportData.testCases.priority.low || 0
        ],
        backgroundColor: [
          '#e74c3c',
          '#f39c12',
          '#3498db'
        ]
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
          text: '测试用例优先级分布'
        }
      }
    }
  });
}

// 填充测试执行记录
function fillTestExecutionRecord() {
  if (!reportData.execution) {
    document.getElementById('test-execution').style.display = 'none';
    return;
  }

  const execution = reportData.execution;

  // 填充执行信息
  document.getElementById('test-start-time').textContent = execution.startTime || 'N/A';
  document.getElementById('test-end-time').textContent = execution.endTime || 'N/A';
  document.getElementById('test-executor').textContent = execution.executor || 'N/A';
  document.getElementById('test-execution-env').textContent = execution.environment || 'N/A';

  // 填充执行时间线
  if (execution.timeline) {
    const timelineContainer = document.getElementById('test-execution-timeline-container');
    timelineContainer.innerHTML = execution.timeline;
  }
}

// 填充风险分析
function fillRiskAnalysis() {
  if (!reportData.riskAnalysis) {
    document.getElementById('risk-analysis').style.display = 'none';
    return;
  }

  const risk = reportData.riskAnalysis;

  // 填充风险项
  if (risk.items && risk.items.length > 0) {
    const riskItemsContainer = document.getElementById('risk-items-container');

    for (const item of risk.items) {
      const riskItem = document.createElement('div');
      riskItem.className = 'risk-item';

      const riskTitle = document.createElement('div');
      riskTitle.className = 'risk-title';
      riskTitle.innerHTML = `<strong>${item.title}</strong> (影响: ${item.impact}, 可能性: ${item.probability})`;

      const riskDescription = document.createElement('div');
      riskDescription.className = 'risk-description';
      riskDescription.textContent = item.description;

      riskItem.appendChild(riskTitle);
      riskItem.appendChild(riskDescription);

      riskItemsContainer.appendChild(riskItem);
    }
  }

  // 填充缓解策略
  if (risk.mitigations && risk.mitigations.length > 0) {
    const mitigationsContainer = document.getElementById('mitigation-strategies-container');

    for (const mitigation of risk.mitigations) {
      const mitigationItem = document.createElement('div');
      mitigationItem.className = 'mitigation-item';

      const mitigationTitle = document.createElement('div');
      mitigationTitle.className = 'mitigation-title';
      mitigationTitle.innerHTML = `<strong>${mitigation.title}</strong>`;

      const mitigationDescription = document.createElement('div');
      mitigationDescription.className = 'mitigation-description';
      mitigationDescription.textContent = mitigation.description;

      mitigationItem.appendChild(mitigationTitle);
      mitigationItem.appendChild(mitigationDescription);

      mitigationsContainer.appendChild(mitigationItem);
    }
  }
}

// 渲染风险矩阵
function renderRiskMatrix() {
  if (!reportData.riskAnalysis || !reportData.riskAnalysis.matrix) {
    document.querySelector('.risk-matrix').style.display = 'none';
    return;
  }

  const ctx = document.getElementById('risk-matrix-chart').getContext('2d');

  // 准备数据
  const matrix = reportData.riskAnalysis.matrix;
  const data = [];
  const labels = [];
  const colors = [];

  for (const item of matrix) {
    data.push({
      x: item.probability,
      y: item.impact,
      r: item.count * 5 + 5
    });
    labels.push(item.title);

    // 根据风险等级设置颜色
    if (item.impact >= 4 && item.probability >= 4) {
      colors.push('#e74c3c'); // 高风险 - 红色
    } else if (item.impact >= 3 && item.probability >= 3) {
      colors.push('#f39c12'); // 中风险 - 橙色
    } else {
      colors.push('#3498db'); // 低风险 - 蓝色
    }
  }

  new Chart(ctx, {
    type: 'bubble',
    data: {
      datasets: [{
        label: '风险项',
        data: data,
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          min: 0,
          max: 5,
          title: {
            display: true,
            text: '可能性'
          },
          ticks: {
            stepSize: 1
          }
        },
        y: {
          min: 0,
          max: 5,
          title: {
            display: true,
            text: '影响'
          },
          ticks: {
            stepSize: 1
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const index = context.dataIndex;
              return [
                labels[index],
                `影响: ${context.raw.y}`,
                `可能性: ${context.raw.x}`,
                `数量: ${(context.raw.r - 5) / 5}`
              ];
            }
          }
        },
        title: {
          display: true,
          text: '风险矩阵'
        }
      }
    }
  });
}

// 填充改进措施
function fillImprovementMeasures() {
  if (!reportData.improvements || reportData.improvements.length === 0) {
    document.querySelector('.improvement-measures').style.display = 'none';
    return;
  }

  const measuresList = document.getElementById('improvement-measures');

  for (const measure of reportData.improvements) {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${measure.title}</strong>: ${measure.description}`;
    measuresList.appendChild(li);
  }
}

// 填充附件资料
function fillAttachments() {
  if (!reportData.attachments || reportData.attachments.length === 0) {
    document.getElementById('attachments').style.display = 'none';
    return;
  }

  const attachmentsList = document.getElementById('attachment-list');

  for (const attachment of reportData.attachments) {
    const li = document.createElement('li');

    // 创建附件图标
    const icon = document.createElement('span');
    icon.className = 'attachment-icon ' + getAttachmentIconClass(attachment.type);

    // 创建附件链接
    const link = document.createElement('a');
    link.href = attachment.url || '#';
    link.textContent = attachment.name;
    link.className = 'attachment-link';

    // 添加点击事件，预览附件
    link.addEventListener('click', function(e) {
      e.preventDefault();
      previewAttachment(attachment);
    });

    // 创建下载按钮
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'attachment-download-btn';
    downloadBtn.title = '下载附件';
    downloadBtn.innerHTML = '<i class="download-icon">↓</i>';

    // 添加下载事件
    downloadBtn.addEventListener('click', function(e) {
      e.preventDefault();
      downloadAttachment(attachment);
    });

    // 添加到列表项
    li.appendChild(icon);
    li.appendChild(link);
    li.appendChild(downloadBtn);

    attachmentsList.appendChild(li);
  }
}

// 获取附件图标类名
function getAttachmentIconClass(type) {
  switch(type) {
    case 'pdf': return 'icon-pdf';
    case 'excel': return 'icon-excel';
    case 'word': return 'icon-word';
    case 'image': return 'icon-image';
    case 'text': return 'icon-text';
    default: return 'icon-file';
  }
}

// 预览附件
function previewAttachment(attachment) {
  const previewContainer = document.getElementById('attachment-preview-container');

  // 清空预览容器
  previewContainer.innerHTML = '';

  // 创建预览标题
  const previewTitle = document.createElement('div');
  previewTitle.className = 'preview-title';
  previewTitle.textContent = attachment.name;
  previewContainer.appendChild(previewTitle);

  // 创建预览内容容器
  const previewContent = document.createElement('div');
  previewContent.className = 'preview-content';

  // 根据附件类型创建预览
  if (attachment.type === 'image') {
    const img = document.createElement('img');
    img.src = attachment.url || 'assets/placeholder-image.png';
    img.alt = attachment.name;
    img.style.maxWidth = '100%';
    previewContent.appendChild(img);
  } else if (attachment.type === 'pdf') {
    const iframe = document.createElement('iframe');
    iframe.src = attachment.url || 'about:blank';
    iframe.style.width = '100%';
    iframe.style.height = '500px';
    previewContent.appendChild(iframe);
  } else if (attachment.type === 'excel') {
    // 为Excel文件创建表格预览
    const tablePreview = document.createElement('div');
    tablePreview.className = 'excel-preview';

    // 这里我们创建一个模拟的Excel表格预览
    tablePreview.innerHTML = `
      <table class="excel-table">
        <thead>
          <tr>
            <th>测试ID</th>
            <th>测试名称</th>
            <th>状态</th>
            <th>执行时间</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>TC001</td>
            <td>基本功能测试</td>
            <td class="status-passed">通过</td>
            <td>0.5秒</td>
            <td>-</td>
          </tr>
          <tr>
            <td>TC002</td>
            <td>卡牌效果测试</td>
            <td class="status-passed">通过</td>
            <td>0.8秒</td>
            <td>-</td>
          </tr>
          <tr>
            <td>TC003</td>
            <td>场景效果测试</td>
            <td class="status-passed">通过</td>
            <td>1.2秒</td>
            <td>-</td>
          </tr>
          <tr>
            <td>TC004</td>
            <td>特殊牌型测试</td>
            <td class="status-passed">通过</td>
            <td>0.7秒</td>
            <td>-</td>
          </tr>
          <tr>
            <td>TC005</td>
            <td>AI对手测试</td>
            <td class="status-passed">通过</td>
            <td>1.5秒</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
      <div class="preview-note">注：这是Excel文件的模拟预览，实际内容可能有所不同</div>
    `;

    previewContent.appendChild(tablePreview);
  } else {
    // 对于其他类型的文件，显示无法预览的消息
    const message = document.createElement('div');
    message.className = 'preview-message';
    message.innerHTML = `
      <div class="preview-icon ${getAttachmentIconClass(attachment.type)}"></div>
      <div class="preview-text">无法预览此类型的文件</div>
      <div class="preview-description">请下载后在相应的应用程序中查看</div>
    `;
    previewContent.appendChild(message);
  }

  previewContainer.appendChild(previewContent);

  // 创建操作按钮
  const previewActions = document.createElement('div');
  previewActions.className = 'preview-actions';

  // 下载按钮
  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'preview-action-btn download-btn';
  downloadBtn.textContent = '下载文件';
  downloadBtn.addEventListener('click', function() {
    downloadAttachment(attachment);
  });

  previewActions.appendChild(downloadBtn);
  previewContainer.appendChild(previewActions);
}

// 下载附件
function downloadAttachment(attachment) {
  // 如果没有真实URL，我们创建一个模拟的下载
  if (!attachment.url || attachment.url === '#') {
    // 创建一个模拟的文件内容
    let content = '';
    let mimeType = '';
    let filename = attachment.name || 'download';

    // 根据文件类型设置MIME类型
    switch(attachment.type) {
      case 'pdf':
        mimeType = 'application/pdf';
        if (!filename.endsWith('.pdf')) filename += '.pdf';
        break;
      case 'excel':
        mimeType = 'application/vnd.ms-excel';
        if (!filename.endsWith('.xlsx') && !filename.endsWith('.xls')) filename += '.xlsx';
        break;
      case 'word':
        mimeType = 'application/msword';
        if (!filename.endsWith('.docx') && !filename.endsWith('.doc')) filename += '.docx';
        break;
      case 'image':
        mimeType = 'image/png';
        if (!filename.endsWith('.png') && !filename.endsWith('.jpg')) filename += '.png';
        break;
      case 'text':
        mimeType = 'text/plain';
        if (!filename.endsWith('.txt')) filename += '.txt';
        content = '这是一个示例文本文件，用于演示下载功能。';
        break;
      default:
        mimeType = 'application/octet-stream';
        break;
    }

    // 创建Blob对象
    const blob = new Blob([content], { type: mimeType });

    // 创建URL
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // 清理
    setTimeout(function() {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } else {
    // 如果有真实URL，直接下载
    const a = document.createElement('a');
    a.href = attachment.url;
    a.download = attachment.name || 'download';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();

    // 清理
    setTimeout(function() {
      document.body.removeChild(a);
    }, 100);
  }
}

// 设置打印按钮
function setupPrintButton() {
  const printButton = document.getElementById('print-report-button');
  if (!printButton) return;

  printButton.addEventListener('click', function() {
    window.print();
  });
}

// 填充结论与展望
function fillConclusion() {
  if (!reportData.conclusion) {
    document.getElementById('conclusion').style.display = 'none';
    return;
  }

  document.getElementById('conclusion-text').textContent = reportData.conclusion.text;
  document.getElementById('outlook-text').textContent = reportData.conclusion.outlook;
}

// 设置导出PDF按钮
function setupExportPdfButton() {
  const exportButton = document.getElementById('export-pdf-button');
  if (!exportButton) return;

  // 初始状态设置为禁用，等待库加载完成
  exportButton.disabled = true;
  exportButton.title = '正在加载PDF导出功能...';

  // 检查库是否已加载
  const checkLibsLoaded = () => {
    if (typeof html2pdf !== 'undefined' &&
        typeof html2canvas !== 'undefined' &&
        typeof window.jspdf !== 'undefined') {
      // 库已加载，启用按钮
      exportButton.disabled = false;
      exportButton.title = '导出测试报告为PDF';
      return true;
    }
    return false;
  };

  // 立即检查一次
  if (!checkLibsLoaded()) {
    // 如果库尚未加载，设置定时检查
    const interval = setInterval(() => {
      if (checkLibsLoaded()) {
        clearInterval(interval);
      }
    }, 500);

    // 最多等待10秒
    setTimeout(() => {
      clearInterval(interval);
      if (!checkLibsLoaded()) {
        exportButton.title = '无法加载PDF导出功能';
        console.error('PDF导出库加载超时');
      }
    }, 10000);
  }

  exportButton.addEventListener('click', function() {
    // 再次检查库是否已加载
    if (!checkLibsLoaded()) {
      alert('PDF导出功能尚未加载完成，请稍后再试');
      return;
    }

    // 显示加载提示
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading-overlay';
    loadingElement.innerHTML = '<div class="loading-spinner"></div><div class="loading-text">正在生成PDF，请稍候...</div>';
    document.body.appendChild(loadingElement);

    try {
      // 准备要导出的内容
      const container = document.querySelector('.container');

      // 使用html2pdf库导出PDF
      const opt = {
        margin: 10,
        filename: `${reportData.testType}-test-report-${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true
        }
      };

      // 使用 Promise 处理导出过程
      html2pdf()
        .from(container)
        .set(opt)
        .save()
        .then(() => {
          // 移除加载提示
          if (document.body.contains(loadingElement)) {
            document.body.removeChild(loadingElement);
          }
          console.log('PDF 导出成功');
        })
        .catch(error => {
          console.error('PDF 导出失败:', error);
          if (document.body.contains(loadingElement)) {
            document.body.removeChild(loadingElement);
          }
          alert('PDF 导出失败: ' + error.message);
        });
    } catch (error) {
      console.error('PDF 导出初始化失败:', error);
      if (document.body.contains(loadingElement)) {
        document.body.removeChild(loadingElement);
      }
      alert('PDF 导出初始化失败: ' + error.message);
    }
  });
}

// 添加右键菜单保存图表功能
document.addEventListener('contextmenu', function(e) {
  const target = e.target;
  if (target.tagName === 'CANVAS') {
    e.preventDefault();

    // 移除已有的上下文菜单
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
      document.body.removeChild(existingMenu);
    }

    // 创建右键菜单
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;

    // 添加查看选项
    const viewOption = document.createElement('div');
    viewOption.className = 'context-menu-item';
    viewOption.textContent = '查看大图';

    viewOption.addEventListener('click', function() {
      showImageModal(target);
      document.body.removeChild(menu);
    });

    // 添加保存选项
    const saveOption = document.createElement('div');
    saveOption.className = 'context-menu-item';
    saveOption.textContent = '保存图表';

    saveOption.addEventListener('click', function() {
      // 获取图表数据URL
      const dataUrl = target.toDataURL('image/png');

      // 创建下载链接
      const link = document.createElement('a');
      link.download = `chart-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      // 移除菜单
      document.body.removeChild(menu);
    });

    menu.appendChild(viewOption);
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
