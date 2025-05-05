/**
 * 性能分析器
 * 用于分析测试性能数据
 */

class PerformanceAnalyzer {
  /**
   * 分析测试结果中的性能数据
   * @param {Object} testResults - Jest测试结果对象
   * @returns {Object} 性能分析结果
   */
  analyzePerformance(testResults) {
    const testSuites = testResults.testResults || [];
    const performanceData = [];
    const slowTests = [];
    const fastTests = [];

    // 收集所有测试的性能数据
    for (const suite of testSuites) {
      if (!suite.testResults) {
        continue;
      }

      const suitePath = suite.testFilePath || 'Unknown';
      const suiteName = suitePath.split('/').pop().replace('.test.js', '');

      for (const test of suite.testResults) {
        const duration = test.duration ? test.duration / 1000 : 0;

        const testData = {
          suiteName,
          suitePath,
          testName: test.title || 'Unknown',
          duration,
          status: test.status || 'unknown',
        };

        performanceData.push(testData);

        // 收集慢测试和快测试
        if (duration > 0.5) {
          // 超过500ms的测试视为慢测试
          slowTests.push(testData);
        } else if (duration < 0.01) {
          // 小于10ms的测试视为快测试
          fastTests.push(testData);
        }
      }
    }

    // 按耗时排序
    performanceData.sort((a, b) => b.duration - a.duration);
    slowTests.sort((a, b) => b.duration - a.duration);
    fastTests.sort((a, b) => a.duration - b.duration);

    // 计算性能统计数据
    const totalDuration = performanceData.reduce((sum, test) => sum + test.duration, 0);
    const averageDuration = performanceData.length > 0 ? totalDuration / performanceData.length : 0;

    // 计算中位数
    const sortedDurations = [...performanceData].sort((a, b) => a.duration - b.duration);
    const medianDuration =
      sortedDurations.length > 0
        ? sortedDurations[Math.floor(sortedDurations.length / 2)].duration
        : 0;

    // 计算标准差
    const squaredDiffs = performanceData.map((test) =>
      Math.pow(test.duration - averageDuration, 2),
    );
    const variance =
      squaredDiffs.length > 0
        ? squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length
        : 0;
    const stdDeviation = Math.sqrt(variance);

    // 按测试套件分组
    const suitePerformance = {};
    for (const test of performanceData) {
      if (!suitePerformance[test.suiteName]) {
        suitePerformance[test.suiteName] = {
          suiteName: test.suiteName,
          suitePath: test.suitePath,
          totalDuration: 0,
          testCount: 0,
          averageDuration: 0,
          tests: [],
        };
      }

      suitePerformance[test.suiteName].totalDuration += test.duration;
      suitePerformance[test.suiteName].testCount += 1;
      suitePerformance[test.suiteName].tests.push(test);
    }

    // 计算每个套件的平均耗时
    for (const suite in suitePerformance) {
      suitePerformance[suite].averageDuration =
        suitePerformance[suite].testCount > 0
          ? suitePerformance[suite].totalDuration / suitePerformance[suite].testCount
          : 0;
    }

    // 转换为数组并排序
    const suitePerformanceArray = Object.values(suitePerformance).sort(
      (a, b) => b.totalDuration - a.totalDuration,
    );

    // 生成性能优化建议
    const recommendations = this._generateRecommendations(
      slowTests,
      suitePerformanceArray,
      averageDuration,
      medianDuration,
    );

    return {
      summary: {
        totalTests: performanceData.length,
        totalDuration,
        averageDuration,
        medianDuration,
        stdDeviation,
        slowTestCount: slowTests.length,
        fastTestCount: fastTests.length,
      },
      slowTests: slowTests.slice(0, 10), // 最慢的10个测试
      fastTests: fastTests.slice(0, 10), // 最快的10个测试
      suitePerformance: suitePerformanceArray,
      recommendations,
    };
  }

  /**
   * 生成性能优化建议
   * @param {Array} slowTests - 慢测试数组
   * @param {Array} suitePerformance - 测试套件性能数组
   * @param {number} averageDuration - 平均耗时
   * @param {number} medianDuration - 中位数耗时
   * @returns {Array} 建议数组
   * @private
   */
  _generateRecommendations(slowTests, suitePerformance, averageDuration, medianDuration) {
    const recommendations = [];

    // 如果有慢测试，建议优化
    if (slowTests.length > 0) {
      recommendations.push({
        type: '慢测试优化',
        description: `发现${slowTests.length}个慢测试，耗时超过500ms。`,
        recommendation: '建议优化这些测试，减少不必要的操作，或者将它们标记为慢测试。',
        impact: '高',
        targets: slowTests
          .slice(0, 5)
          .map((test) => `${test.suiteName}: ${test.testName} (${test.duration.toFixed(2)}s)`),
      });
    }

    // 如果平均耗时远大于中位数，说明有少数测试耗时过长
    if (averageDuration > medianDuration * 2) {
      recommendations.push({
        type: '异常值处理',
        description: '平均耗时显著高于中位数耗时，说明存在少数耗时极长的测试。',
        recommendation: '建议检查这些异常值测试，优化或隔离它们。',
        impact: '中',
        targets: [],
      });
    }

    // 如果有测试套件耗时过长，建议拆分
    const slowSuites = suitePerformance.filter((suite) => suite.totalDuration > 2); // 超过2秒的套件
    if (slowSuites.length > 0) {
      recommendations.push({
        type: '测试套件拆分',
        description: `发现${slowSuites.length}个耗时过长的测试套件。`,
        recommendation: '建议将这些测试套件拆分为更小的单元，或者并行运行它们。',
        impact: '中',
        targets: slowSuites
          .slice(0, 3)
          .map(
            (suite) =>
              `${suite.suiteName} (${suite.totalDuration.toFixed(2)}s, ${suite.testCount}个测试)`,
          ),
      });
    }

    // 通用性能优化建议
    recommendations.push({
      type: '模拟优化',
      description: '测试中的模拟对象可能影响性能。',
      recommendation: '建议优化模拟对象的创建和使用，减少不必要的模拟。',
      impact: '低',
      targets: [],
    });

    recommendations.push({
      type: '并行测试',
      description: '测试串行执行可能导致总耗时增加。',
      recommendation: '建议启用Jest的并行测试功能，提高测试执行效率。',
      impact: '中',
      targets: [],
    });

    return recommendations;
  }
}

module.exports = PerformanceAnalyzer;
