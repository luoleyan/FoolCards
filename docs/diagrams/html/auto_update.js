/**
 * FoolCards 项目图表自动更新脚本
 * 
 * 此脚本用于在代码更新时自动更新相关图表
 * 使用方法：node auto_update.js [options]
 * 
 * 选项:
 *   --watch: 监视文件变化并自动更新图表
 *   --all: 更新所有图表
 *   --structure: 只更新结构图
 *   --er: 只更新实体关系图
 *   --flowcharts: 只更新流程图
 *   --ui: 只更新UI设计图
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const chokidar = require('chokidar');

// 项目根目录
const rootDir = path.resolve(__dirname, '../../..');
// 文档目录
const docsDir = path.resolve(rootDir, 'docs');
// 图表目录
const diagramsDir = path.resolve(docsDir, 'diagrams');
// HTML目录
const htmlDir = path.resolve(diagramsDir, 'html');

// 文档类别和对应的目录
const categories = [
  { name: 'structure', title: '结构图', dir: path.resolve(diagramsDir, 'structure') },
  { name: 'er', title: '实体关系图', dir: path.resolve(diagramsDir, 'er') },
  { name: 'flowcharts', title: '流程图', dir: path.resolve(diagramsDir, 'flowcharts') },
  { name: 'ui', title: 'UI设计图', dir: path.resolve(diagramsDir, 'ui') }
];

// 代码目录与图表的映射关系
const codeToChartMapping = {
  'assets/scripts': ['structure', 'flowcharts'],
  'assets/prefabs': ['structure', 'ui'],
  'assets/scenes': ['structure', 'ui'],
  'assets/resources': ['ui']
};

/**
 * 生成HTML文件
 * @param {string[]} categoryNames - 要更新的类别名称数组
 */
function generateHtml(categoryNames = []) {
  console.log('开始生成HTML文件...');
  
  // 如果没有指定类别，则更新所有类别
  if (categoryNames.length === 0) {
    categoryNames = categories.map(cat => cat.name);
  }
  
  // 构建命令
  const command = `cd "${htmlDir}" && node generate.js ${categoryNames.join(' ')}`;
  
  // 执行命令
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`执行命令时出错: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`命令错误输出: ${stderr}`);
      return;
    }
    console.log(`命令输出: ${stdout}`);
    console.log('HTML文件生成完成!');
  });
}

/**
 * 监视文件变化
 */
function watchFiles() {
  console.log('开始监视文件变化...');
  
  // 监视Markdown文件变化
  const mdWatcher = chokidar.watch(`${diagramsDir}/**/*.md`, {
    ignored: /(^|[\/\\])\../,
    persistent: true
  });
  
  mdWatcher.on('change', path => {
    console.log(`文件 ${path} 已更改`);
    // 确定文件所属类别
    const relativePath = path.replace(diagramsDir, '').substring(1);
    const category = relativePath.split(path.sep)[0];
    
    // 更新对应类别的HTML文件
    generateHtml([category]);
  });
  
  // 监视代码文件变化
  const codeWatcher = chokidar.watch([
    `${rootDir}/assets/scripts/**/*.ts`,
    `${rootDir}/assets/prefabs/**/*.prefab`,
    `${rootDir}/assets/scenes/**/*.scene`
  ], {
    ignored: /(^|[\/\\])\../,
    persistent: true
  });
  
  codeWatcher.on('change', path => {
    console.log(`代码文件 ${path} 已更改`);
    // 确定文件所属目录
    const relativePath = path.replace(rootDir, '').substring(1);
    const codeDir = relativePath.split(path.sep)[0] + '/' + relativePath.split(path.sep)[1];
    
    // 获取需要更新的图表类别
    const categoriesToUpdate = codeToChartMapping[codeDir] || [];
    
    if (categoriesToUpdate.length > 0) {
      console.log(`需要更新的图表类别: ${categoriesToUpdate.join(', ')}`);
      generateHtml(categoriesToUpdate);
    }
  });
  
  console.log('文件监视已启动，按Ctrl+C停止');
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  
  // 解析命令行参数
  if (args.includes('--watch')) {
    watchFiles();
  } else if (args.includes('--all')) {
    generateHtml();
  } else {
    const categoriesToUpdate = [];
    
    if (args.includes('--structure')) categoriesToUpdate.push('structure');
    if (args.includes('--er')) categoriesToUpdate.push('er');
    if (args.includes('--flowcharts')) categoriesToUpdate.push('flowcharts');
    if (args.includes('--ui')) categoriesToUpdate.push('ui');
    
    if (categoriesToUpdate.length > 0) {
      generateHtml(categoriesToUpdate);
    } else {
      // 如果没有指定参数，显示帮助信息
      console.log(`
FoolCards 项目图表自动更新脚本

使用方法: node auto_update.js [options]

选项:
  --watch: 监视文件变化并自动更新图表
  --all: 更新所有图表
  --structure: 只更新结构图
  --er: 只更新实体关系图
  --flowcharts: 只更新流程图
  --ui: 只更新UI设计图
      `);
    }
  }
}

// 执行主函数
main();
