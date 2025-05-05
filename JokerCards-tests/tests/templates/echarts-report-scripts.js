// 测试报告脚本 - ECharts版本
document.addEventListener('DOMContentLoaded', () => {
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
    document.getElementById('test-status').className = summary.success
      ? 'value passed'
      : 'value failed';
  }

  // 填充测试元数据
  function fillTestMetadata() {
    if (!reportData.metadata) {
      document.getElementById('test-metadata').style.display = 'none';
      return;
    }

    const metadata = reportData.metadata;

    document.getElementById('test-purpose').textContent = metadata.purpose || 'N/A';
    document.getElementById('test-scope').textContent = metadata.scope || 'N/A';
    document.getElementById('test-methods').textContent = metadata.methods || 'N/A';

    if (metadata.environment) {
      document.getElementById('test-hardware').textContent = metadata.environment.hardware || 'N/A';
      document.getElementById('test-software').textContent = metadata.environment.software || 'N/A';
      document.getElementById('test-dependencies').textContent =
        metadata.environment.dependencies || 'N/A';
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
          left: 'center',
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)',
        },
        legend: {
          orient: 'horizontal',
          bottom: 'bottom',
          data: ['通过', '失败', '待定'],
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
              borderWidth: 2,
            },
            label: {
              show: false,
              position: 'center',
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold',
              },
            },
            labelLine: {
              show: false,
            },
            data: [
              { value: passed, name: '通过', itemStyle: { color: '#2ecc71' } },
              { value: failed, name: '失败', itemStyle: { color: '#e74c3c' } },
              { value: pending, name: '待定', itemStyle: { color: '#f39c12' } },
            ],
          },
        ],
      };

      // 使用配置项设置图表
      chart.setOption(option);

      // 添加点击事件
      chart.on('click', (params) => {
        showChartModal('测试结果统计', option);
      });

      // 添加右键菜单事件
      container.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showChartModal('测试结果统计', option);
      });

      console.log('测试结果图表渲染成功');
    } catch (error) {
      console.error('渲染测试结果图表时出错:', error);
      const container = document.getElementById('results-chart-container');
      if (container) {
        container.innerHTML = `<div class="error-message">渲染图表时出错: ${error.message}</div>`;
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

      if (
        !reportData.historyTrend ||
        !reportData.historyTrend.dates ||
        reportData.historyTrend.dates.length === 0
      ) {
        container.innerHTML = '<div class="error-message">没有历史趋势数据</div>';
        return;
      }

      const trend = reportData.historyTrend;
      const dates = trend.dates;
      const passed = trend.passed;
      const failed = trend.failed;
      const pending = trend.pending || Array(dates.length).fill(0);
      const passRate =
        trend.passRate ||
        Array(dates.length)
          .fill(0)
          .map((_, i) => {
            const total = (passed[i] || 0) + (failed[i] || 0) + (pending[i] || 0);
            return total > 0 ? Math.round((passed[i] / total) * 100) : 0;
          });

      // 初始化ECharts实例
      const chart = echarts.init(container);

      // 配置图表选项
      const option = {
        title: {
          text: '历史趋势',
          left: 'center',
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
        },
        legend: {
          data: ['通过', '失败', '待定', '通过率'],
          bottom: 'bottom',
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: dates,
        },
        yAxis: [
          {
            type: 'value',
            name: '测试数量',
            position: 'left',
          },
          {
            type: 'value',
            name: '通过率 (%)',
            position: 'right',
            min: 0,
            max: 100,
            axisLabel: {
              formatter: '{value}%',
            },
          },
        ],
        series: [
          {
            name: '通过',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series',
            },
            data: passed,
            itemStyle: {
              color: '#2ecc71',
            },
          },
          {
            name: '失败',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series',
            },
            data: failed,
            itemStyle: {
              color: '#e74c3c',
            },
          },
          {
            name: '待定',
            type: 'bar',
            stack: 'total',
            emphasis: {
              focus: 'series',
            },
            data: pending,
            itemStyle: {
              color: '#f39c12',
            },
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
              color: '#3498db',
            },
            itemStyle: {
              color: '#3498db',
            },
          },
        ],
      };

      // 使用配置项设置图表
      chart.setOption(option);

      // 添加点击事件
      chart.on('click', (params) => {
        showChartModal('历史趋势', option);
      });

      // 添加右键菜单事件
      container.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showChartModal('历史趋势', option);
      });

      console.log('历史趋势图表渲染成功');
    } catch (error) {
      console.error('渲染历史趋势图表时出错:', error);
      const container = document.getElementById('history-trend-container');
      if (container) {
        container.innerHTML = `<div class="error-message">渲染图表时出错: ${error.message}</div>`;
      }
    }
  }

  // 显示图表模态框
  function showChartModal(title, option) {
    const modal = document.getElementById('image-modal');
    const container = document.getElementById('modal-chart-container');

    // 显示模态框
    modal.style.display = 'block';

    // 初始化ECharts实例
    const chart = echarts.init(container);

    // 更新标题
    option.title = {
      text: title,
      left: 'center',
    };

    // 使用配置项设置图表
    chart.setOption(option);

    // 调整大小
    chart.resize();
  }

  // 设置模态框事件
  function setupModalEvents() {
    const modal = document.getElementById('image-modal');
    const closeButton = document.querySelector('.close-button');
    const saveButton = document.getElementById('save-image-button');

    // 关闭按钮点击事件
    closeButton.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });

    // 保存图表按钮点击事件
    saveButton.addEventListener('click', () => {
      const container = document.getElementById('modal-chart-container');
      const chart = echarts.getInstanceByDom(container);

      if (chart) {
        // 获取图表的数据URL
        const url = chart.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#fff',
        });

        // 创建下载链接
        const link = document.createElement('a');
        link.download = `chart-${new Date().getTime()}.png`;
        link.href = url;
        link.click();
      }
    });
  }

  // 设置打印按钮
  function setupPrintButton() {
    const printButton = document.getElementById('print-report-button');
    if (printButton) {
      printButton.addEventListener('click', () => {
        window.print();
      });
    }
  }

  // 设置导出PDF按钮
  function setupExportPdfButton() {
    const exportButton = document.getElementById('export-pdf-button');
    if (exportButton) {
      exportButton.addEventListener('click', () => {
        alert('PDF导出功能尚未实现');
      });
    }
  }

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

      // 渲染测试结果图表
      renderResultsChart();

      // 渲染历史趋势图表
      if (reportData.historyTrend && reportData.historyTrend.dates) {
        renderHistoryTrendChart();
      } else {
        document.getElementById('history-trend').style.display = 'none';
      }

      // 设置模态框事件
      setupModalEvents();

      // 设置打印按钮
      setupPrintButton();

      // 设置导出PDF按钮
      setupExportPdfButton();

      console.log('报告初始化完成');
    } catch (error) {
      console.error('初始化报告时发生错误:', error);
      document.body.innerHTML = `
        <div class="error-container">
          <h1>报告加载失败</h1>
          <p>初始化报告时发生错误: ${error.message}</p>
          <p>请刷新页面重试或联系技术支持。</p>
          <pre>${error.stack}</pre>
        </div>
      `;
    }
  }

  // 初始化报告
  initReport();
});
