// 测试报告脚本 - ECharts版本
document.addEventListener('DOMContentLoaded', function() {
  // 初始化报告
  initReport();

  // 初始化报告
  function initReport() {
    try {
      console.log('初始化测试报告...');

      // 填充报告元数据
      fillReportMetadata();

      // 填充软件信息
      fillSoftwareInfo();

      // 填充摘要信息
      fillSummaryInfo();

      // 填充测试目的
      fillTestPurpose();

      // 填充测试范围
      fillTestScope();

      // 填充测试计划
      fillTestPlan();

      // 填充测试方法
      fillTestMethods();

      // 填充测试环境
      fillTestEnvironment();

      // 填充测试用例概述
      fillTestCasesOverview();

      // 填充测试执行记录
      fillTestExecutionRecord();

      // 填充测试套件详情
      fillTestSuites();

      // 填充缺陷分析
      fillDefectAnalysis();

      // 填充性能分析
      fillPerformanceAnalysis();

      // 填充问题与建议
      fillIssuesRecommendations();

      // 填充风险分析
      fillRiskAnalysis();

      // 填充结论与展望
      fillConclusion();

      // 填充附件资料
      fillAttachments();

      // 渲染图表
      renderCharts();

      // 初始化模态框
      initModal();

      // 初始化导出PDF功能
      initExportPDF();

      // 初始化打印功能
      initPrint();

      console.log('测试报告初始化完成');
    } catch (error) {
      console.error('初始化报告时发生错误:', error);
    }
  }

  // 渲染所有图表
  function renderCharts() {
    // 渲染测试结果图表
    renderResultsChart();

    // 渲染覆盖率图表
    renderCoverageChart();

    // 渲染历史趋势图表
    renderHistoryTrendChart();

    // 渲染缺陷分类图表
    renderDefectCategoryChart();

    // 渲染缺陷模式图表
    renderDefectPatternChart();

    // 渲染套件性能图表
    renderSuitePerformanceChart();

    // 渲染慢测试图表
    renderSlowTestsChart();

    // 渲染测试用例分布图表
    renderTestCasesDistributionChart();

    // 渲染测试用例优先级图表
    renderTestCasesPriorityChart();

    // 渲染风险矩阵图表
    renderRiskMatrixChart();
  }

  // 初始化模态框
  function initModal() {
    const modal = document.getElementById('image-modal');
    const closeButton = document.querySelector('.close-button');
    const saveButton = document.getElementById('save-image-button');

    // 关闭模态框
    closeButton.addEventListener('click', function() {
      modal.style.display = 'none';
    });

    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });

    // 保存图表
    saveButton.addEventListener('click', function() {
      const chartContainer = document.getElementById('modal-chart-container');
      const chart = echarts.getInstanceByDom(chartContainer);

      if (chart) {
        try {
          // 获取图表的数据URL
          const url = chart.getDataURL({
            type: 'png',
            pixelRatio: 2,
            backgroundColor: '#fff'
          });

          // 创建下载链接
          const link = document.createElement('a');
          link.download = `chart-${Date.now()}.png`;
          link.href = url;
          link.click();
        } catch (error) {
          console.error('保存图表时出错:', error);
          alert('保存图表失败: ' + error.message);
        }
      }
    });
  }

  // 显示图表模态框
  function showChartModal(title, option) {
    const modal = document.getElementById('image-modal');
    const container = document.getElementById('modal-chart-container');

    // 显示模态框
    modal.style.display = 'block';

    // 创建新的ECharts实例
    const chart = echarts.init(container);

    // 更新标题
    const newOption = JSON.parse(JSON.stringify(option));
    if (newOption.title) {
      newOption.title.text = title;
    }

    // 设置图表选项
    chart.setOption(newOption);

    // 调整大小
    chart.resize();
  }

  // 初始化导出PDF功能
  function initExportPDF() {
    const exportButton = document.getElementById('export-pdf-button');

    exportButton.addEventListener('click', function() {
      try {
        const element = document.querySelector('.container');
        const opt = {
          margin: 10,
          filename: `test-report-${Date.now()}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // 显示加载提示
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
          <div class="loading-spinner"></div>
          <div class="loading-text">正在生成PDF，请稍候...</div>
        `;
        document.body.appendChild(loadingOverlay);

        // 生成PDF
        html2pdf().set(opt).from(element).save().then(() => {
          // 移除加载提示
          document.body.removeChild(loadingOverlay);
        }).catch(error => {
          console.error('生成PDF时出错:', error);
          alert('生成PDF失败: ' + error.message);
          // 移除加载提示
          document.body.removeChild(loadingOverlay);
        });
      } catch (error) {
        console.error('生成PDF报告失败:', error.message);
        alert('生成PDF失败: ' + error.message);
      }
    });
  }

  // 初始化打印功能
  function initPrint() {
    const printButton = document.getElementById('print-report-button');

    printButton.addEventListener('click', function() {
      window.print();
    });
  }
  // 格式化持续时间
  function formatDuration(seconds) {
    if (seconds < 60) {
      return `${seconds}秒`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}分${remainingSeconds}秒`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      return `${hours}时${minutes}分${remainingSeconds}秒`;
    }
  }

  // 填充报告元数据
  function fillReportMetadata() {
    document.getElementById('report-id').textContent = reportData.reportId || 'N/A';
    document.getElementById('doc-version').textContent = reportData.docVersion || 'N/A';
    document.getElementById('test-date').textContent = reportData.testDate || 'N/A';
    document.getElementById('software-version').textContent = reportData.softwareVersion || 'N/A';
  }

  // 填充软件信息
  function fillSoftwareInfo() {
    if (!reportData.softwareInfo) {
      document.getElementById('software-info').style.display = 'none';
      return;
    }

    const info = reportData.softwareInfo;

    document.getElementById('software-description').textContent = info.description || 'N/A';

    if (info.features && info.features.length > 0) {
      const featuresList = document.getElementById('software-features');
      for (const feature of info.features) {
        const li = document.createElement('li');
        li.textContent = feature;
        featuresList.appendChild(li);
      }
    }

    if (info.version) {
      document.getElementById('version-number').textContent = info.version.number || 'N/A';
      document.getElementById('build-date').textContent = info.version.buildDate || 'N/A';
      document.getElementById('release-type').textContent = info.version.releaseType || 'N/A';
    }
  }

  // 填充摘要信息
  function fillSummaryInfo() {
    if (!reportData.summary) {
      document.getElementById('summary').style.display = 'none';
      return;
    }

    const summary = reportData.summary;

    document.getElementById('total-tests').textContent = summary.total || 0;
    document.getElementById('passed-tests').textContent = summary.passed || 0;
    document.getElementById('failed-tests').textContent = summary.failed || 0;
    document.getElementById('pending-tests').textContent = summary.pending || 0;
    document.getElementById('test-duration').textContent = formatDuration(summary.duration || 0);
    document.getElementById('test-status').textContent = summary.success ? '通过' : '失败';
    document.getElementById('test-status').className = summary.success ? 'value passed' : 'value failed';
  }

  // 填充测试目的
  function fillTestPurpose() {
    if (!reportData.metadata || !reportData.metadata.purpose) {
      document.getElementById('test-purpose').style.display = 'none';
      return;
    }

    document.getElementById('purpose-text').textContent = reportData.metadata.purpose;
  }

  // 填充测试范围
  function fillTestScope() {
    if (!reportData.metadata || !reportData.metadata.scope) {
      document.getElementById('test-scope').style.display = 'none';
      return;
    }

    document.getElementById('scope-text').textContent = reportData.metadata.scope;
  }

  // 填充测试计划
  function fillTestPlan() {
    if (!reportData.testPlan) {
      document.getElementById('test-plan').style.display = 'none';
      return;
    }

    const plan = reportData.testPlan;

    if (plan.phases && plan.phases.length > 0) {
      const phasesList = document.getElementById('test-phases');
      for (const phase of plan.phases) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${phase.name}:</strong> ${phase.description}`;
        phasesList.appendChild(li);
      }
    }

    if (plan.schedule) {
      document.getElementById('test-schedule').innerHTML = plan.schedule;
    }

    if (plan.resources) {
      document.getElementById('resource-allocation').innerHTML = plan.resources;
    }

    if (plan.risks) {
      document.getElementById('risk-assessment').innerHTML = plan.risks;
    }
  }

  // 填充测试方法
  function fillTestMethods() {
    if (!reportData.metadata || !reportData.metadata.methods) {
      document.getElementById('test-methods').style.display = 'none';
      return;
    }

    document.getElementById('methods-text').textContent = reportData.metadata.methods;
  }

  // 填充测试环境
  function fillTestEnvironment() {
    if (!reportData.metadata || !reportData.metadata.environment) {
      document.getElementById('test-environment').style.display = 'none';
      return;
    }

    const env = reportData.metadata.environment;

    if (env.hardware) {
      const hardwareList = document.getElementById('hardware-list');
      const li = document.createElement('li');
      li.textContent = env.hardware;
      hardwareList.appendChild(li);
    }

    if (env.software) {
      const softwareList = document.getElementById('software-list');
      const li = document.createElement('li');
      li.textContent = env.software;
      softwareList.appendChild(li);
    }

    if (env.dependencies) {
      const dependenciesList = document.getElementById('dependencies-list');
      const li = document.createElement('li');
      li.textContent = env.dependencies;
      dependenciesList.appendChild(li);
    }
  }

  // 填充测试用例概述
  function fillTestCasesOverview() {
    if (!reportData.testCases) {
      document.getElementById('test-cases').style.display = 'none';
      return;
    }

    const testCases = reportData.testCases;

    document.getElementById('total-test-cases').textContent = testCases.total || 0;
    document.getElementById('automated-test-cases').textContent = testCases.automated || 0;
    document.getElementById('manual-test-cases').textContent = testCases.manual || 0;
    document.getElementById('test-cases-coverage').textContent = testCases.coverage ? testCases.coverage + '%' : 'N/A';

    // 渲染用例分布图表
    if (testCases.distribution && testCases.distribution.length > 0) {
      renderTestCasesDistributionChart();
    }

    // 渲染优先级分布图表
    if (testCases.priority) {
      renderTestCasesPriorityChart();
    }
  }

  // 填充测试执行记录
  function fillTestExecutionRecord() {
    if (!reportData.execution) {
      document.getElementById('test-execution').style.display = 'none';
      return;
    }

    const execution = reportData.execution;

    document.getElementById('test-start-time').textContent = execution.startTime || 'N/A';
    document.getElementById('test-end-time').textContent = execution.endTime || 'N/A';
    document.getElementById('test-executor').textContent = execution.executor || 'N/A';
    document.getElementById('test-execution-env').textContent = execution.environment || 'N/A';

    if (execution.timeline) {
      document.getElementById('test-execution-timeline-container').innerHTML = execution.timeline;
    }
  }

  // 填充测试套件详情
  function fillTestSuites() {
    if (!reportData.suites || reportData.suites.length === 0) {
      document.getElementById('test-suites').style.display = 'none';
      return;
    }

    const suitesContainer = document.getElementById('suites-container');
    for (const suite of reportData.suites) {
      const suiteDiv = document.createElement('div');
      suiteDiv.className = 'suite-item';

      const suiteHeader = document.createElement('div');
      suiteHeader.className = 'suite-header';
      suiteHeader.innerHTML = `
        <h3>${suite.name}</h3>
        <div class="suite-summary">
          <span class="suite-summary-item">通过: <span class="passed">${suite.passed}</span></span>
          <span class="suite-summary-item">失败: <span class="failed">${suite.failed}</span></span>
          <span class="suite-summary-item">总数: ${suite.total}</span>
          <span class="suite-summary-item">耗时: ${formatDuration(suite.duration)}</span>
        </div>
      `;
      suiteDiv.appendChild(suiteHeader);

      if (suite.tests && suite.tests.length > 0) {
        const testsTable = document.createElement('table');
        testsTable.className = 'tests-table';
        testsTable.innerHTML = `
          <thead>
            <tr>
              <th>测试名称</th>
              <th>状态</th>
              <th>耗时</th>
              <th>错误信息</th>
            </tr>
          </thead>
          <tbody>
            ${suite.tests.map(test => `
              <tr class="${test.status}">
                <td>${test.name}</td>
                <td>${test.status === 'passed' ? '通过' : test.status === 'failed' ? '失败' : '待定'}</td>
                <td>${formatDuration(test.duration)}</td>
                <td>${test.error || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        `;
        suiteDiv.appendChild(testsTable);
      }

      suitesContainer.appendChild(suiteDiv);
    }
  }

  // 填充缺陷分析
  function fillDefectAnalysis() {
    if (!reportData.defectAnalysis || reportData.defectAnalysis.totalDefects === 0) {
      document.getElementById('defect-analysis').style.display = 'none';
      return;
    }

    const defectAnalysis = reportData.defectAnalysis;

    document.getElementById('total-defects').textContent = defectAnalysis.totalDefects || 0;

    // 渲染缺陷分类图表
    if (defectAnalysis.categoryDistribution && defectAnalysis.categoryDistribution.length > 0) {
      renderDefectCategoryChart();
    }

    // 渲染缺陷模式图表
    if (defectAnalysis.patternDistribution && defectAnalysis.patternDistribution.length > 0) {
      renderDefectPatternChart();
    }

    // 填充修复建议
    if (defectAnalysis.recommendations) {
      if (defectAnalysis.recommendations.categoryRecommendations && defectAnalysis.recommendations.categoryRecommendations.length > 0) {
        const categoryRecommendations = document.getElementById('category-recommendations');
        const ul = document.createElement('ul');
        for (const recommendation of defectAnalysis.recommendations.categoryRecommendations) {
          const li = document.createElement('li');
          li.textContent = recommendation;
          ul.appendChild(li);
        }
        categoryRecommendations.appendChild(ul);
      }

      if (defectAnalysis.recommendations.patternRecommendations && defectAnalysis.recommendations.patternRecommendations.length > 0) {
        const patternRecommendations = document.getElementById('pattern-recommendations');
        const ul = document.createElement('ul');
        for (const recommendation of defectAnalysis.recommendations.patternRecommendations) {
          const li = document.createElement('li');
          li.textContent = recommendation;
          ul.appendChild(li);
        }
        patternRecommendations.appendChild(ul);
      }
    }
  }

  // 填充性能分析
  function fillPerformanceAnalysis() {
    if (!reportData.performanceAnalysis) {
      document.getElementById('performance-analysis').style.display = 'none';
      return;
    }

    const performanceAnalysis = reportData.performanceAnalysis;

    if (performanceAnalysis.summary) {
      document.getElementById('average-duration').textContent = formatDuration(performanceAnalysis.summary.averageDuration || 0);
      document.getElementById('median-duration').textContent = formatDuration(performanceAnalysis.summary.medianDuration || 0);
      document.getElementById('std-deviation').textContent = formatDuration(performanceAnalysis.summary.stdDeviation || 0);
    }

    // 渲染套件性能图表
    if (performanceAnalysis.suitePerformance && performanceAnalysis.suitePerformance.length > 0) {
      renderSuitePerformanceChart();
    }

    // 渲染慢测试图表
    if (performanceAnalysis.slowTests && performanceAnalysis.slowTests.length > 0) {
      renderSlowTestsChart();
    }

    // 填充性能优化建议
    if (performanceAnalysis.recommendations && performanceAnalysis.recommendations.length > 0) {
      const recommendationsContainer = document.getElementById('performance-recommendations');
      const ul = document.createElement('ul');
      for (const recommendation of performanceAnalysis.recommendations) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${recommendation.type}</strong> - ${recommendation.description}<br>建议: ${recommendation.recommendation}<br>影响: ${recommendation.impact}`;
        ul.appendChild(li);
      }
      recommendationsContainer.appendChild(ul);
    }
  }

  // 填充问题与建议
  function fillIssuesRecommendations() {
    if (!reportData.recommendations || reportData.recommendations.length === 0) {
      document.getElementById('issues-recommendations').style.display = 'none';
      return;
    }

    const issuesContainer = document.getElementById('issues-container');
    const ul = document.createElement('ul');
    for (const recommendation of reportData.recommendations) {
      const li = document.createElement('li');
      li.innerHTML = `<strong>问题:</strong> ${recommendation.issue}<br><strong>建议:</strong> ${recommendation.recommendation}`;
      ul.appendChild(li);
    }
    issuesContainer.appendChild(ul);
  }

  // 填充风险分析
  function fillRiskAnalysis() {
    if (!reportData.riskAnalysis) {
      document.getElementById('risk-analysis').style.display = 'none';
      return;
    }

    const riskAnalysis = reportData.riskAnalysis;

    // 渲染风险矩阵图表
    if (riskAnalysis.matrix && riskAnalysis.matrix.length > 0) {
      renderRiskMatrixChart();
    }

    // 填充风险项
    if (riskAnalysis.items && riskAnalysis.items.length > 0) {
      const riskItemsContainer = document.getElementById('risk-items-container');
      const ul = document.createElement('ul');
      for (const item of riskAnalysis.items) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${item.title}</strong> (影响: ${item.impact}, 可能性: ${item.probability}) - ${item.description}`;
        ul.appendChild(li);
      }
      riskItemsContainer.appendChild(ul);
    }

    // 填充缓解策略
    if (riskAnalysis.mitigations && riskAnalysis.mitigations.length > 0) {
      const mitigationsContainer = document.getElementById('mitigation-strategies-container');
      const ul = document.createElement('ul');
      for (const mitigation of riskAnalysis.mitigations) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${mitigation.title}</strong> - ${mitigation.description}`;
        ul.appendChild(li);
      }
      mitigationsContainer.appendChild(ul);
    }
  }

  // 填充结论与展望
  function fillConclusion() {
    if (!reportData.conclusion) {
      document.getElementById('conclusion').style.display = 'none';
      return;
    }

    document.getElementById('conclusion-text').textContent = reportData.conclusion.text || 'N/A';
    document.getElementById('outlook-text').textContent = reportData.conclusion.outlook || 'N/A';

    // 填充改进措施
    if (reportData.improvements && reportData.improvements.length > 0) {
      const improvementsList = document.getElementById('improvement-measures');
      for (const improvement of reportData.improvements) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${improvement.title}</strong> - ${improvement.description}`;
        improvementsList.appendChild(li);
      }
    }
  }

  // 填充附件资料
  function fillAttachments() {
    if (!reportData.attachments || reportData.attachments.length === 0) {
      document.getElementById('attachments').style.display = 'none';
      return;
    }

    const attachmentList = document.getElementById('attachment-list');
    for (const attachment of reportData.attachments) {
      const li = document.createElement('li');
      li.innerHTML = `<a href="${attachment.url}" target="_blank" class="attachment-link ${attachment.type}">${attachment.name}</a>`;
      attachmentList.appendChild(li);
    }
  }

  // 渲染测试用例分布图表 - 使用ECharts
  function renderTestCasesDistributionChart() {
    try {
      const container = document.getElementById('test-cases-distribution-container');
      if (!container) {
        console.error('找不到测试用例分布图表容器');
        return;
      }

      if (!reportData.testCases || !reportData.testCases.distribution || reportData.testCases.distribution.length === 0) {
        container.innerHTML = '<div class="error-message">没有测试用例分布数据</div>';
        return;
      }

      const distribution = reportData.testCases.distribution;
      const categories = distribution.map(item => item.category);
      const counts = distribution.map(item => item.count);

      // 初始化ECharts实例
      const chart = echarts.init(container);

      // 配置图表选项
      const option = {
        title: {
          text: '测试用例分布',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'horizontal',
          bottom: 'bottom',
          data: categories
        },
        series: [
          {
            name: '测试用例',
            type: 'pie',
            radius: '55%',
            center: ['50%', '50%'],
            data: distribution.map(item => ({
              name: item.category,
              value: item.count
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };

      // 使用配置项设置图表
      chart.setOption(option);

      // 添加点击事件
      chart.on('click', function(params) {
        showChartModal('测试用例分布', option);
      });

      // 添加右键菜单事件
      container.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showChartModal('测试用例分布', option);
      });

      console.log('测试用例分布图表渲染成功');
    } catch (error) {
      console.error('渲染测试用例分布图表时出错:', error);
      const container = document.getElementById('test-cases-distribution-container');
      if (container) {
        container.innerHTML = '<div class="error-message">渲染图表时出错: ' + error.message + '</div>';
      }
    }
  }

  // 渲染套件性能图表 - 使用ECharts
  function renderSuitePerformanceChart() {
    try {
      const container = document.getElementById('suite-performance-container');
      if (!container) {
        console.error('找不到套件性能图表容器');
        return;
      }

      if (!reportData.performanceAnalysis || !reportData.performanceAnalysis.suitePerformance || reportData.performanceAnalysis.suitePerformance.length === 0) {
        container.innerHTML = '<div class="error-message">没有套件性能数据</div>';
        return;
      }

      const suitePerformance = reportData.performanceAnalysis.suitePerformance;
      const suiteNames = suitePerformance.map(item => item.name);
      const durations = suitePerformance.map(item => item.duration);

      // 初始化ECharts实例
      const chart = echarts.init(container);

      // 配置图表选项
      const option = {
        title: {
          text: '套件执行时间',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function(params) {
            return `${params[0].name}<br>${params[0].marker}${params[0].seriesName}: ${formatDuration(params[0].value)}`;
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: suiteNames,
          axisLabel: {
            interval: 0,
            rotate: 30
          }
        },
        yAxis: {
          type: 'value',
          name: '执行时间 (秒)',
          axisLabel: {
            formatter: function(value) {
              return value + 's';
            }
          }
        },
        series: [
          {
            name: '执行时间',
            type: 'bar',
            data: durations,
            itemStyle: {
              color: function(params) {
                // 根据执行时间生成不同的颜色
                const value = params.value;
                if (value < 1) {
                  return '#2ecc71'; // 绿色，快
                } else if (value < 5) {
                  return '#f39c12'; // 黄色，中等
                } else {
                  return '#e74c3c'; // 红色，慢
                }
              }
            },
            label: {
              show: true,
              position: 'top',
              formatter: function(params) {
                return formatDuration(params.value);
              }
            }
          }
        ]
      };

      // 使用配置项设置图表
      chart.setOption(option);

      // 添加点击事件
      chart.on('click', function(params) {
        showChartModal('套件执行时间', option);
      });

      // 添加右键菜单事件
      container.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showChartModal('套件执行时间', option);
      });

      console.log('套件性能图表渲染成功');
    } catch (error) {
      console.error('渲染套件性能图表时出错:', error);
      const container = document.getElementById('suite-performance-container');
      if (container) {
        container.innerHTML = '<div class="error-message">渲染图表时出错: ' + error.message + '</div>';
      }
    }
  }

  // 渲染慢测试图表 - 使用ECharts
  function renderSlowTestsChart() {
    try {
      const container = document.getElementById('slow-tests-container');
      if (!container) {
        console.error('找不到慢测试图表容器');
        return;
      }

      if (!reportData.performanceAnalysis || !reportData.performanceAnalysis.slowTests || reportData.performanceAnalysis.slowTests.length === 0) {
        container.innerHTML = '<div class="error-message">没有慢测试数据</div>';
        return;
      }

      const slowTests = reportData.performanceAnalysis.slowTests;
      const testNames = slowTests.map(item => item.name);
      const durations = slowTests.map(item => item.duration);
      const expected = slowTests.map(item => item.expected);

      // 初始化ECharts实例
      const chart = echarts.init(container);

      // 配置图表选项
      const option = {
        title: {
          text: '慢测试分析',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function(params) {
            return `${params[0].name}<br>${params[0].marker}实际: ${formatDuration(params[0].value)}<br>${params[1].marker}预期: ${formatDuration(params[1].value)}`;
          }
        },
        legend: {
          data: ['实际耗时', '预期耗时'],
          bottom: 'bottom'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          name: '执行时间 (秒)',
          axisLabel: {
            formatter: function(value) {
              return value + 's';
            }
          }
        },
        yAxis: {
          type: 'category',
          data: testNames,
          axisLabel: {
            interval: 0
          }
        },
        series: [
          {
            name: '实际耗时',
            type: 'bar',
            data: durations,
            itemStyle: {
              color: '#e74c3c'
            },
            label: {
              show: true,
              position: 'right',
              formatter: function(params) {
                return formatDuration(params.value);
              }
            }
          },
          {
            name: '预期耗时',
            type: 'bar',
            data: expected,
            itemStyle: {
              color: '#2ecc71'
            },
            label: {
              show: true,
              position: 'right',
              formatter: function(params) {
                return formatDuration(params.value);
              }
            }
          }
        ]
      };

      // 使用配置项设置图表
      chart.setOption(option);

      // 添加点击事件
      chart.on('click', function(params) {
        showChartModal('慢测试分析', option);
      });

      // 添加右键菜单事件
      container.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showChartModal('慢测试分析', option);
      });

      console.log('慢测试图表渲染成功');
    } catch (error) {
      console.error('渲染慢测试图表时出错:', error);
      const container = document.getElementById('slow-tests-container');
      if (container) {
        container.innerHTML = '<div class="error-message">渲染图表时出错: ' + error.message + '</div>';
      }
    }
  }

  // 渲染风险矩阵图表 - 使用ECharts
  function renderRiskMatrixChart() {
    try {
      const container = document.getElementById('risk-matrix-container');
      if (!container) {
        console.error('找不到风险矩阵图表容器');
        return;
      }

      if (!reportData.riskAnalysis || !reportData.riskAnalysis.matrix || reportData.riskAnalysis.matrix.length === 0) {
        container.innerHTML = '<div class="error-message">没有风险矩阵数据</div>';
        return;
      }

      const matrix = reportData.riskAnalysis.matrix;
      const data = matrix.map(item => ({
        name: item.title,
        value: [item.probability, item.impact, item.count]
      }));

      // 初始化ECharts实例
      const chart = echarts.init(container);

      // 配置图表选项
      const option = {
        title: {
          text: '风险矩阵',
          left: 'center'
        },
        tooltip: {
          formatter: function(params) {
            return `${params.data.name}<br>影响: ${params.data.value[1]}<br>可能性: ${params.data.value[0]}<br>问题数: ${params.data.value[2]}`;
          }
        },
        grid: {
          left: '10%',
          right: '10%',
          bottom: '15%',
          top: '15%'
        },
        xAxis: {
          type: 'value',
          name: '可能性',
          min: 0,
          max: 5,
          splitNumber: 5,
          splitLine: {
            show: true
          }
        },
        yAxis: {
          type: 'value',
          name: '影响',
          min: 0,
          max: 5,
          splitNumber: 5,
          splitLine: {
            show: true
          }
        },
        series: [
          {
            name: '风险项',
            type: 'scatter',
            symbolSize: function(data) {
              return Math.sqrt(data[2]) * 15;
            },
            data: data,
            itemStyle: {
              color: function(params) {
                const impact = params.data.value[1];
                const probability = params.data.value[0];
                const risk = impact * probability;

                if (risk < 6) {
                  return '#2ecc71'; // 低风险，绿色
                } else if (risk < 15) {
                  return '#f39c12'; // 中风险，黄色
                } else {
                  return '#e74c3c'; // 高风险，红色
                }
              }
            },
            label: {
              show: true,
              formatter: function(params) {
                return params.data.name;
              },
              position: 'top'
            },
            emphasis: {
              label: {
                show: true,
                formatter: function(params) {
                  return `${params.data.name}\n影响: ${params.data.value[1]}\n可能性: ${params.data.value[0]}\n问题数: ${params.data.value[2]}`;
                },
                position: 'top'
              }
            }
          }
        ]
      };

      // 使用配置项设置图表
      chart.setOption(option);

      // 添加点击事件
      chart.on('click', function(params) {
        showChartModal('风险矩阵', option);
      });

      // 添加右键菜单事件
      container.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showChartModal('风险矩阵', option);
      });

      console.log('风险矩阵图表渲染成功');
    } catch (error) {
      console.error('渲染风险矩阵图表时出错:', error);
      const container = document.getElementById('risk-matrix-container');
      if (container) {
        container.innerHTML = '<div class="error-message">渲染图表时出错: ' + error.message + '</div>';
      }
    }
  }

  // 渲染测试用例优先级图表 - 使用ECharts
  function renderTestCasesPriorityChart() {
    try {
      const container = document.getElementById('test-cases-priority-container');
      if (!container) {
        console.error('找不到测试用例优先级图表容器');
        return;
      }

      if (!reportData.testCases || !reportData.testCases.priority) {
        container.innerHTML = '<div class="error-message">没有测试用例优先级数据</div>';
        return;
      }

      const priority = reportData.testCases.priority;
      const data = [
        { name: '高优先级', value: priority.high || 0 },
        { name: '中优先级', value: priority.medium || 0 },
        { name: '低优先级', value: priority.low || 0 }
      ];

      // 初始化ECharts实例
      const chart = echarts.init(container);

      // 配置图表选项
      const option = {
        title: {
          text: '测试用例优先级分布',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'horizontal',
          bottom: 'bottom',
          data: ['高优先级', '中优先级', '低优先级']
        },
        series: [
          {
            name: '优先级',
            type: 'pie',
            radius: ['30%', '60%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: priority.high || 0, name: '高优先级', itemStyle: { color: '#e74c3c' } },
              { value: priority.medium || 0, name: '中优先级', itemStyle: { color: '#f39c12' } },
              { value: priority.low || 0, name: '低优先级', itemStyle: { color: '#3498db' } }
            ]
          }
        ]
      };

      // 使用配置项设置图表
      chart.setOption(option);

      // 添加点击事件
      chart.on('click', function(params) {
        showChartModal('测试用例优先级分布', option);
      });

      // 添加右键菜单事件
      container.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showChartModal('测试用例优先级分布', option);
      });

      console.log('测试用例优先级图表渲染成功');
    } catch (error) {
      console.error('渲染测试用例优先级图表时出错:', error);
      const container = document.getElementById('test-cases-priority-container');
      if (container) {
        container.innerHTML = '<div class="error-message">渲染图表时出错: ' + error.message + '</div>';
      }
    }
  }

  // 渲染测试结果图表 - 使用ECharts
  function renderResultsChart() {
    try {
      const container = document.getElementById('results-chart-container');
      if (!container) {
        console.error('找不到结果图表容器');
        return;
      }

      const summary = reportData.summary;
      if (!summary) {
        container.innerHTML = '<div class="error-message">没有测试结果数据</div>';
        return;
      }

      const passed = summary.passed || 0;
      const failed = summary.failed || 0;
      const pending = summary.pending || 0;
      const total = summary.total || 0;

      if (total === 0) {
        container.innerHTML = '<div class="error-message">没有测试结果数据</div>';
        return;
      }

      // 初始化ECharts实例
      const chart = echarts.init(container);

      // 配置图表选项
      const option = {
        title: {
          text: '测试结果统计',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'horizontal',
          bottom: 'bottom',
          data: ['通过', '失败', '待定']
        },
        series: [
          {
            name: '测试结果',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: passed, name: '通过', itemStyle: { color: '#2ecc71' } },
              { value: failed, name: '失败', itemStyle: { color: '#e74c3c' } },
              { value: pending, name: '待定', itemStyle: { color: '#f39c12' } }
            ]
          }
        ]
      };

      // 使用配置项设置图表
      chart.setOption(option);

      // 添加点击事件
      chart.on('click', function(params) {
        showChartModal('测试结果统计', option);
      });

      // 添加右键菜单事件
      container.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showChartModal('测试结果统计', option);
      });

      console.log('测试结果图表渲染成功');
    } catch (error) {
      console.error('渲染测试结果图表时出错:', error);
      const container = document.getElementById('results-chart-container');
      if (container) {
        container.innerHTML = '<div class="error-message">渲染图表时出错: ' + error.message + '</div>';
      }
    }
  }

  // 渲染历史趋势图表 - 使用ECharts
  function renderHistoryTrendChart() {
    try {
      const container = document.getElementById('history-trend-container');
      if (!container) {
        console.error('找不到历史趋势图表容器');
        return;
      }

      if (!reportData.historyTrend || !reportData.historyTrend.dates || reportData.historyTrend.dates.length === 0) {
        container.innerHTML = '<div class="error-message">没有历史趋势数据</div>';
        return;
      }

      const trend = reportData.historyTrend;
      const dates = trend.dates;
      const passed = trend.passed;
      const failed = trend.failed;
      const pending = trend.pending || Array(dates.length).fill(0);
      const passRate = trend.passRate || Array(dates.length).fill(0).map((_, i) => {
        const total = (passed[i] || 0) + (failed[i] || 0) + (pending[i] || 0);
        return total > 0 ? Math.round((passed[i] / total) * 100) : 0;
      });

      // 初始化ECharts实例
      const chart = echarts.init(container);

      // 配置图表选项
      const option = {
        title: {
          text: '历史趋势',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['通过', '失败', '待定', '通过率'],
          bottom: 'bottom'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: dates
        },
        yAxis: [
          {
            type: 'value',
            name: '测试数量',
            position: 'left'
          },
          {
            type: 'value',
            name: '通过率 (%)',
            position: 'right',
            min: 0,
            max: 100,
            axisLabel: {
              formatter: '{value}%'
            }
          }
        ],
        series: [
          {
            name: '通过',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: passed,
            itemStyle: {
              color: '#2ecc71'
            }
          },
          {
            name: '失败',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: failed,
            itemStyle: {
              color: '#e74c3c'
            }
          },
          {
            name: '待定',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series'
            },
            data: pending,
            itemStyle: {
              color: '#f39c12'
            }
          },
          {
            name: '通过率',
            type: 'line',
            yAxisIndex: 1,
            data: passRate,
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: {
              width: 3,
              color: '#3498db'
            },
            itemStyle: {
              color: '#3498db'
            }
          }
        ]
      };

      // 使用配置项设置图表
      chart.setOption(option);

      // 添加点击事件
      chart.on('click', function(params) {
        showChartModal('历史趋势', option);
      });

      // 添加右键菜单事件
      container.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showChartModal('历史趋势', option);
      });

      console.log('历史趋势图表渲染成功');
    } catch (error) {
      console.error('渲染历史趋势图表时出错:', error);
      const container = document.getElementById('history-trend-container');
      if (container) {
        container.innerHTML = '<div class="error-message">渲染图表时出错: ' + error.message + '</div>';
      }
    }
  }

  // 渲染缺陷分类图表 - 使用ECharts
  function renderDefectCategoryChart() {
    try {
      const container = document.getElementById('defect-category-container');
      if (!container) {
        console.error('找不到缺陷分类图表容器');
        return;
      }

      if (!reportData.defectAnalysis || !reportData.defectAnalysis.categoryDistribution || reportData.defectAnalysis.categoryDistribution.length === 0) {
        container.innerHTML = '<div class="error-message">没有缺陷分类数据</div>';
        return;
      }

      const categoryDistribution = reportData.defectAnalysis.categoryDistribution;
      const categories = categoryDistribution.map(item => item.category);
      const counts = categoryDistribution.map(item => item.count);

      // 初始化ECharts实例
      const chart = echarts.init(container);

      // 配置图表选项
      const option = {
        title: {
          text: '缺陷分类统计',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'horizontal',
          bottom: 'bottom',
          data: categories
        },
        series: [
          {
            name: '缺陷分类',
            type: 'pie',
            radius: '55%',
            center: ['50%', '50%'],
            data: categoryDistribution.map(item => ({
              name: item.category,
              value: item.count
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };

      // 使用配置项设置图表
      chart.setOption(option);

      // 添加点击事件
      chart.on('click', function(params) {
        showChartModal('缺陷分类统计', option);
      });

      // 添加右键菜单事件
      container.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showChartModal('缺陷分类统计', option);
      });

      console.log('缺陷分类图表渲染成功');
    } catch (error) {
      console.error('渲染缺陷分类图表时出错:', error);
      const container = document.getElementById('defect-category-container');
      if (container) {
        container.innerHTML = '<div class="error-message">渲染图表时出错: ' + error.message + '</div>';
      }
    }
  }

  // 渲染缺陷模式图表 - 使用ECharts
  function renderDefectPatternChart() {
    try {
      const container = document.getElementById('defect-pattern-container');
      if (!container) {
        console.error('找不到缺陷模式图表容器');
        return;
      }

      if (!reportData.defectAnalysis || !reportData.defectAnalysis.patternDistribution || reportData.defectAnalysis.patternDistribution.length === 0) {
        container.innerHTML = '<div class="error-message">没有缺陷模式数据</div>';
        return;
      }

      const patternDistribution = reportData.defectAnalysis.patternDistribution;
      const patterns = patternDistribution.map(item => item.pattern);
      const counts = patternDistribution.map(item => item.count);

      // 初始化ECharts实例
      const chart = echarts.init(container);

      // 配置图表选项
      const option = {
        title: {
          text: '缺陷模式统计',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: patterns,
          axisLabel: {
            interval: 0,
            rotate: 30
          }
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '缺陷数量',
            type: 'bar',
            data: counts.map((value, index) => ({
              value: value,
              itemStyle: {
                color: `rgba(${Math.floor(Math.random() * 150) + 50}, ${Math.floor(Math.random() * 150) + 50}, ${Math.floor(Math.random() * 150) + 50}, 0.8)`
              }
            })),
            label: {
              show: true,
              position: 'top'
            }
          }
        ]
      };

      // 使用配置项设置图表
      chart.setOption(option);

      // 添加点击事件
      chart.on('click', function(params) {
        showChartModal('缺陷模式统计', option);
      });

      // 添加右键菜单事件
      container.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showChartModal('缺陷模式统计', option);
      });

      console.log('缺陷模式图表渲染成功');
    } catch (error) {
      console.error('渲染缺陷模式图表时出错:', error);
      const container = document.getElementById('defect-pattern-container');
      if (container) {
        container.innerHTML = '<div class="error-message">渲染图表时出错: ' + error.message + '</div>';
      }
    }
  }

  // 渲染覆盖率图表 - 使用ECharts
  function renderCoverageChart() {
    try {
      const container = document.getElementById('coverage-chart-container');
      if (!container) {
        console.error('找不到覆盖率图表容器');
        return;
      }

      if (!reportData.coverage) {
        container.innerHTML = '<div class="error-message">没有覆盖率数据</div>';
        return;
      }

      const coverage = reportData.coverage;
      const statements = coverage.statements || 0;
      const branches = coverage.branches || 0;
      const functions = coverage.functions || 0;
      const lines = coverage.lines || 0;

      // 初始化ECharts实例
      const chart = echarts.init(container);

      // 配置图表选项
      const option = {
        title: {
          text: '代码覆盖率',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          max: 100,
          axisLabel: {
            formatter: '{value}%'
          }
        },
        yAxis: {
          type: 'category',
          data: ['语句', '分支', '函数', '行']
        },
        series: [
          {
            name: '覆盖率',
            type: 'bar',
            data: [
              { value: statements, itemStyle: { color: '#3498db' } },
              { value: branches, itemStyle: { color: '#2ecc71' } },
              { value: functions, itemStyle: { color: '#9b59b6' } },
              { value: lines, itemStyle: { color: '#e67e22' } }
            ],
            label: {
              show: true,
              position: 'right',
              formatter: '{c}%'
            }
          }
        ]
      };

      // 使用配置项设置图表
      chart.setOption(option);

      // 添加点击事件
      chart.on('click', function(params) {
        showChartModal('代码覆盖率', option);
      });

      // 添加右键菜单事件
      container.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showChartModal('代码覆盖率', option);
      });

      console.log('覆盖率图表渲染成功');
    } catch (error) {
      console.error('渲染覆盖率图表时出错:', error);
      const container = document.getElementById('coverage-chart-container');
      if (container) {
        container.innerHTML = '<div class="error-message">渲染图表时出错: ' + error.message + '</div>';
      }
    }
  }
});