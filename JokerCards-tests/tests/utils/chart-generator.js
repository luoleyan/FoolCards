/**
 * 图表生成工具
 * 用于生成测试结果图表
 */

class ChartGenerator {
  /**
   * 生成测试结果饼图数据
   * @param {Object} summary - 测试摘要数据
   * @returns {Object} 图表数据
   */
  static generateResultsPieChartData(summary) {
    return {
      type: 'doughnut',
      data: {
        labels: ['通过', '失败', '待定'],
        datasets: [{
          data: [
            summary.passed,
            summary.failed,
            summary.pending
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
    };
  }
  
  /**
   * 生成覆盖率柱状图数据
   * @param {Object} coverage - 覆盖率数据
   * @returns {Object} 图表数据
   */
  static generateCoverageBarChartData(coverage) {
    return {
      type: 'bar',
      data: {
        labels: ['语句', '分支', '函数', '行'],
        datasets: [{
          label: '覆盖率 (%)',
          data: [
            coverage.statements,
            coverage.branches,
            coverage.functions,
            coverage.lines
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
    };
  }
  
  /**
   * 生成测试持续时间柱状图数据
   * @param {Array} suites - 测试套件数组
   * @returns {Object} 图表数据
   */
  static generateDurationBarChartData(suites) {
    // 提取套件名称和持续时间
    const suiteNames = suites.map(suite => {
      // 获取文件名
      const fileName = suite.name.split('/').pop();
      return fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName;
    });
    
    // 计算每个套件的总持续时间
    const suiteDurations = suites.map(suite => {
      return suite.tests.reduce((total, test) => total + parseFloat(test.duration), 0);
    });
    
    return {
      type: 'bar',
      data: {
        labels: suiteNames,
        datasets: [{
          label: '执行时间 (秒)',
          data: suiteDurations,
          backgroundColor: '#9b59b6'
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
            text: '测试套件执行时间'
          }
        }
      }
    };
  }
  
  /**
   * 生成测试通过率趋势线图数据
   * @param {Array} historicalData - 历史测试数据
   * @returns {Object} 图表数据
   */
  static generatePassRateTrendChartData(historicalData) {
    // 提取日期和通过率
    const dates = historicalData.map(data => data.date);
    const passRates = historicalData.map(data => {
      const total = data.passed + data.failed + data.pending;
      return total > 0 ? (data.passed / total) * 100 : 0;
    });
    
    return {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: '通过率 (%)',
          data: passRates,
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          tension: 0.1,
          fill: true
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
            text: '测试通过率趋势'
          }
        }
      }
    };
  }
  
  /**
   * 生成测试类型分布饼图数据
   * @param {Object} testCounts - 各类型测试数量
   * @returns {Object} 图表数据
   */
  static generateTestTypeDistributionChartData(testCounts) {
    return {
      type: 'pie',
      data: {
        labels: Object.keys(testCounts).map(key => {
          switch (key) {
            case 'unit': return '单元测试';
            case 'functional': return '功能测试';
            case 'performance': return '性能测试';
            case 'system': return '系统测试';
            case 'blackbox': return '黑盒测试';
            case 'whitebox': return '白盒测试';
            default: return key;
          }
        }),
        datasets: [{
          data: Object.values(testCounts),
          backgroundColor: [
            '#3498db',
            '#2ecc71',
            '#f39c12',
            '#e74c3c',
            '#9b59b6',
            '#1abc9c'
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
            text: '测试类型分布'
          }
        }
      }
    };
  }
}

module.exports = ChartGenerator;
