/**
 * 测试缺陷分析器
 * 用于分析测试失败的原因和模式
 */

class TestDefectAnalyzer {
  /**
   * 分析测试结果中的缺陷
   * @param {Object} testResults - Jest测试结果对象
   * @returns {Object} 缺陷分析结果
   */
  analyzeDefects(testResults) {
    const testSuites = testResults.testResults || [];
    const defects = [];
    const defectCategories = {};
    const defectPatterns = {};

    // 收集所有失败的测试
    for (const suite of testSuites) {
      if (!suite.testResults) {
        continue;
      }

      const suitePath = suite.testFilePath || 'Unknown';
      const suiteName = suitePath.split('/').pop().replace('.test.js', '');

      for (const test of suite.testResults) {
        if (test.status === 'failed') {
          const defect = {
            suiteName,
            suitePath,
            testName: test.title || 'Unknown',
            failureMessages: test.failureMessages || [],
            duration: test.duration ? (test.duration / 1000).toFixed(2) : '0.00',
          };

          // 分析失败原因
          defect.category = this._categorizeDefect(defect.failureMessages);
          defect.pattern = this._identifyPattern(defect.failureMessages);

          // 更新分类统计
          defectCategories[defect.category] = (defectCategories[defect.category] || 0) + 1;
          defectPatterns[defect.pattern] = (defectPatterns[defect.pattern] || 0) + 1;

          defects.push(defect);
        }
      }
    }

    // 计算缺陷分布
    const totalDefects = defects.length;
    const categoryDistribution = Object.entries(defectCategories).map(([category, count]) => ({
      category,
      count,
      percentage: totalDefects > 0 ? ((count / totalDefects) * 100).toFixed(2) : '0.00',
    }));

    const patternDistribution = Object.entries(defectPatterns).map(([pattern, count]) => ({
      pattern,
      count,
      percentage: totalDefects > 0 ? ((count / totalDefects) * 100).toFixed(2) : '0.00',
    }));

    // 生成建议
    const recommendations = this._generateRecommendations(
      defects,
      categoryDistribution,
      patternDistribution,
    );

    return {
      totalDefects,
      defects,
      categoryDistribution,
      patternDistribution,
      recommendations,
    };
  }

  /**
   * 对缺陷进行分类
   * @param {Array} failureMessages - 失败信息数组
   * @returns {string} 缺陷类别
   * @private
   */
  _categorizeDefect(failureMessages) {
    if (!failureMessages || failureMessages.length === 0) {
      return '未知错误';
    }

    const message = failureMessages.join(' ');

    if (message.includes('TypeError') || message.includes('ReferenceError')) {
      return '类型错误';
    } else if (message.includes('AssertionError') || message.includes('expect(')) {
      return '断言失败';
    } else if (message.includes('timeout')) {
      return '超时错误';
    } else if (message.includes('SyntaxError')) {
      return '语法错误';
    } else if (message.includes('null') || message.includes('undefined')) {
      return '空值错误';
    } else if (
      message.includes('async') ||
      message.includes('await') ||
      message.includes('Promise')
    ) {
      return '异步错误';
    } else if (message.includes('mock') || message.includes('spy')) {
      return '模拟错误';
    } else {
      return '其他错误';
    }
  }

  /**
   * 识别缺陷模式
   * @param {Array} failureMessages - 失败信息数组
   * @returns {string} 缺陷模式
   * @private
   */
  _identifyPattern(failureMessages) {
    if (!failureMessages || failureMessages.length === 0) {
      return '未知模式';
    }

    const message = failureMessages.join(' ');

    if (message.includes('expected') && message.includes('received')) {
      if (message.includes('toBe') || message.includes('toEqual')) {
        return '值不匹配';
      } else if (message.includes('toContain')) {
        return '缺少元素';
      } else if (message.includes('toBeTruthy') || message.includes('toBeFalsy')) {
        return '布尔值错误';
      } else if (message.includes('toBeGreaterThan') || message.includes('toBeLessThan')) {
        return '范围错误';
      }
    }

    if (message.includes('is not a function') || message.includes('is not defined')) {
      return '函数调用错误';
    } else if (
      message.includes('Cannot read property') ||
      message.includes('undefined is not an object')
    ) {
      return '属性访问错误';
    } else if (message.includes('timeout')) {
      return '执行超时';
    } else if (message.includes('rejected')) {
      return 'Promise拒绝';
    }

    return '其他模式';
  }

  /**
   * 生成修复建议
   * @param {Array} defects - 缺陷数组
   * @param {Array} categoryDistribution - 缺陷类别分布
   * @param {Array} patternDistribution - 缺陷模式分布
   * @returns {Array} 建议数组
   * @private
   */
  _generateRecommendations(defects, categoryDistribution, patternDistribution) {
    const recommendations = [];

    // 根据缺陷类别生成建议
    for (const { category, count, percentage } of categoryDistribution) {
      let recommendation = '';

      switch (category) {
        case '类型错误':
          recommendation = '检查变量类型，确保函数调用前变量已定义并且类型正确。';
          break;
        case '断言失败':
          recommendation = '检查测试期望值是否合理，可能是代码行为发生了变化或测试用例需要更新。';
          break;
        case '超时错误':
          recommendation = '检查异步操作是否正确完成，可能需要增加超时时间或优化代码性能。';
          break;
        case '语法错误':
          recommendation = '检查代码语法，修复语法错误。';
          break;
        case '空值错误':
          recommendation = '添加空值检查，确保在访问对象属性或调用方法前对象已正确初始化。';
          break;
        case '异步错误':
          recommendation = '检查异步代码，确保Promise正确解析，async/await正确使用。';
          break;
        case '模拟错误':
          recommendation = '检查模拟对象的设置，确保模拟行为与预期一致。';
          break;
        default:
          recommendation = '详细分析错误信息，找出失败原因。';
      }

      recommendations.push({
        category,
        count,
        percentage,
        recommendation,
      });
    }

    // 根据缺陷模式生成建议
    const patternRecommendations = [];
    for (const { pattern, count, percentage } of patternDistribution) {
      let recommendation = '';

      switch (pattern) {
        case '值不匹配':
          recommendation = '检查代码逻辑，确保函数返回值符合预期。';
          break;
        case '缺少元素':
          recommendation = '检查数组或集合操作，确保元素正确添加或移除。';
          break;
        case '布尔值错误':
          recommendation = '检查条件判断逻辑，确保布尔值计算正确。';
          break;
        case '范围错误':
          recommendation = '检查数值计算，确保结果在预期范围内。';
          break;
        case '函数调用错误':
          recommendation = '检查函数名称和导入，确保函数存在且可调用。';
          break;
        case '属性访问错误':
          recommendation = '添加属性存在性检查，避免访问undefined或null的属性。';
          break;
        case '执行超时':
          recommendation = '优化代码性能，或增加测试超时时间。';
          break;
        case 'Promise拒绝':
          recommendation = '处理Promise拒绝情况，添加错误处理逻辑。';
          break;
        default:
          recommendation = '详细分析错误模式，找出共同的失败原因。';
      }

      patternRecommendations.push({
        pattern,
        count,
        percentage,
        recommendation,
      });
    }

    return {
      categoryRecommendations: recommendations,
      patternRecommendations,
    };
  }
}

module.exports = TestDefectAnalyzer;
