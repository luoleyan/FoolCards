/**
 * 测试运行脚本
 * 用于运行不同类型的测试
 */

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const TestResultsProcessor = require('./tests/utils/test-results-processor');

// 测试类型
const TEST_TYPES = {
  UNIT: 'unit',
  FUNCTIONAL: 'functional',
  PERFORMANCE: 'performance',
  SYSTEM: 'system',
  BLACKBOX: 'blackbox',
  WHITEBOX: 'whitebox',
  ALL: 'all'
};

// 运行测试
function runTests(type, options = {}) {
  console.log(`=== 运行${getTestTypeName(type)}测试 ===`);

  try {
    let command;

    if (type === TEST_TYPES.ALL) {
      command = 'npx jest';
    } else {
      command = `npx jest tests/${type}`;
    }

    // 添加覆盖率报告
    command += ' --coverage --json --outputFile=test-results/raw-results.json';

    // 执行命令
    execSync(command, { stdio: 'inherit' });

    // 生成测试报告
    generateTestReport(type, options);

    console.log(`\n✅ ${getTestTypeName(type)}测试完成\n`);
    return true;
  } catch (error) {
    console.error(`\n❌ ${getTestTypeName(type)}测试失败: ${error.message}\n`);

    // 尝试生成失败报告
    try {
      generateTestReport(type, options);
    } catch (reportError) {
      console.error(`无法生成测试报告: ${reportError.message}`);
    }

    return false;
  }
}

// 运行兼容性测试
function runCompatibilityTest() {
  console.log('=== 运行兼容性测试 ===');

  try {
    // 检查兼容性测试文件是否存在
    const compatibilityTestFile = path.join(__dirname, 'tests', 'compatibility', 'browser-compatibility.js');
    if (!fs.existsSync(compatibilityTestFile)) {
      console.error(`\n❌ 兼容性测试文件不存在: ${compatibilityTestFile}\n`);
      return false;
    }

    console.log(`\n✅ 兼容性测试文件已准备就绪: ${compatibilityTestFile}`);
    console.log('请在浏览器中打开游戏，并在控制台中运行以下代码来执行兼容性测试:');
    console.log('\n  runCompatibilityTest();\n');
    console.log('或者使用以下代码显示兼容性测试报告:');
    console.log('\n  displayCompatibilityReport(runCompatibilityTest());\n');

    return true;
  } catch (error) {
    console.error(`\n❌ 准备兼容性测试失败: ${error.message}\n`);
    return false;
  }
}

// 获取测试类型名称
function getTestTypeName(type) {
  switch (type) {
    case TEST_TYPES.UNIT:
      return '单元';
    case TEST_TYPES.FUNCTIONAL:
      return '功能';
    case TEST_TYPES.PERFORMANCE:
      return '性能';
    case TEST_TYPES.SYSTEM:
      return '系统';
    case TEST_TYPES.BLACKBOX:
      return '黑盒';
    case TEST_TYPES.WHITEBOX:
      return '白盒';
    case TEST_TYPES.ALL:
      return '所有';
    default:
      return type;
  }
}

// 生成测试报告
function generateTestReport(type, options = {}) {
  console.log(`\n生成${getTestTypeName(type)}测试报告...\n`);

  try {
    // 读取测试结果
    const resultsPath = path.join(__dirname, 'test-results', 'raw-results.json');
    if (!fs.existsSync(resultsPath)) {
      console.warn(`测试结果文件不存在: ${resultsPath}`);
      return;
    }

    const testResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

    // 处理测试结果并生成报告
    const processor = new TestResultsProcessor();
    processor.process(testResults, {
      testType: type,
      generatePdf: options.generatePdf || false
    });

    console.log(`\n✅ ${getTestTypeName(type)}测试报告生成完成\n`);

    // 如果需要生成PDF，提示用户
    if (options.generatePdf) {
      console.log('PDF报告将在浏览器中生成，请在报告页面中点击"导出PDF"按钮。');
    }
  } catch (error) {
    console.error(`\n❌ 生成测试报告失败: ${error.message}\n`);
    console.error(error.stack);
  }
}

// 显示帮助信息
function showHelp() {
  console.log('使用方法: node run-tests.js [测试类型] [选项]');
  console.log('\n可用的测试类型:');
  console.log(`  ${TEST_TYPES.UNIT}         - 运行单元测试`);
  console.log(`  ${TEST_TYPES.FUNCTIONAL}   - 运行功能测试`);
  console.log(`  ${TEST_TYPES.PERFORMANCE}  - 运行性能测试`);
  console.log(`  ${TEST_TYPES.SYSTEM}       - 运行系统测试`);
  console.log(`  ${TEST_TYPES.BLACKBOX}     - 运行黑盒测试`);
  console.log(`  ${TEST_TYPES.WHITEBOX}     - 运行白盒测试`);
  console.log(`  compatibility - 准备兼容性测试`);
  console.log(`  ${TEST_TYPES.ALL}          - 运行所有测试`);
  console.log('\n可用的选项:');
  console.log('  --pdf, -p    - 生成PDF报告');
  console.log('\n示例:');
  console.log('  node run-tests.js unit     # 运行单元测试');
  console.log('  node run-tests.js all      # 运行所有测试');
  console.log('  node run-tests.js unit -p  # 运行单元测试并生成PDF报告');
}

// 主函数
function main() {
  // 获取命令行参数
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    return;
  }

  // 解析参数
  let testType = null;
  let generatePdf = false;

  for (const arg of args) {
    if (arg === '--pdf' || arg === '-p') {
      generatePdf = true;
    } else if (arg === 'compatibility') {
      testType = arg;
    } else if (Object.values(TEST_TYPES).includes(arg.toLowerCase())) {
      testType = arg.toLowerCase();
    } else if (arg.startsWith('-')) {
      console.warn(`\n⚠️ 未知的选项: ${arg}\n`);
    } else {
      console.error(`\n❌ 未知的测试类型: ${arg}\n`);
      showHelp();
      return;
    }
  }

  // 如果没有指定测试类型，默认运行所有测试
  if (!testType) {
    testType = TEST_TYPES.ALL;
  }

  // 运行测试
  if (testType === 'compatibility') {
    runCompatibilityTest();
  } else {
    runTests(testType, { generatePdf });
  }
}

// 执行主函数
main();
