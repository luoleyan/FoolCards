/**
 * FoolCards 项目分析文档文件检查脚本
 *
 * 此脚本用于检查Markdown文件是否存在
 */

const fs = require('fs');
const path = require('path');

// 文档类别和对应的目录
const categories = [
  {
    name: 'structure',
    title: '结构图',
    dir: path.resolve(__dirname, '../structure'),
    files: [
      { name: 'project_structure', title: '项目结构图' },
      { name: 'class_diagram', title: '类图' },
      { name: 'component_interaction', title: '组件交互图' },
      { name: 'architecture', title: '架构设计图' },
      { name: 'ai_opponent', title: 'AI对手实现' },
      { name: 'error_handling', title: '错误处理策略' }
    ]
  },
  {
    name: 'er',
    title: '实体关系图',
    dir: path.resolve(__dirname, '../er'),
    files: [
      { name: 'entity_relationship', title: '实体关系图' }
    ]
  },
  {
    name: 'flowcharts',
    title: '流程图',
    dir: path.resolve(__dirname, '../flowcharts'),
    files: [
      { name: 'game_flow', title: '游戏主流程图' },
      { name: 'game_state', title: '游戏状态转换图' }
    ]
  },
  {
    name: 'ui',
    title: 'UI设计图',
    dir: path.resolve(__dirname, '../ui'),
    files: [
      { name: 'ui_layout', title: 'UI布局设计' },
      { name: 'card_interaction', title: '卡牌交互流程' },
      { name: 'game_wireframe', title: '游戏界面线框图' },
      { name: 'menu_wireframe', title: '主菜单界面线框图' },
      { name: 'ui_style_guide', title: 'UI样式指南' },
      { name: 'ui_component_hierarchy', title: 'UI组件层次结构' },
      { name: 'interaction_flow', title: '交互流程图' }
    ]
  }
];

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {boolean} - 文件是否存在
 */
function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error(`检查文件 ${filePath} 时出错:`, error);
    return false;
  }
}

/**
 * 检查一个类别的所有文档
 * @param {Object} category - 类别信息
 */
function checkCategory(category) {
  console.log(`\n检查类别: ${category.title} (${category.name})`);
  console.log('-'.repeat(50));

  // 检查目录是否存在
  const dirPath = path.resolve(__dirname, category.dir);
  const dirExists = checkFileExists(dirPath);
  console.log(`目录 ${category.dir}: ${dirExists ? '存在' : '不存在'}`);

  if (!dirExists) {
    console.log(`警告: 目录 ${category.dir} 不存在，将跳过此类别的文件检查`);
    return;
  }

  // 检查每个文件
  category.files.forEach(file => {
    const filePath = path.join(category.dir, `${file.name}.md`);
    const fileExists = checkFileExists(filePath);
    console.log(`文件 ${file.name}.md: ${fileExists ? '存在' : '不存在'}`);

    // 检查对应的HTML文件是否存在
    const htmlPath = path.join(__dirname, category.name, `${file.name}.html`);
    const htmlExists = checkFileExists(htmlPath);
    console.log(`  - HTML文件: ${htmlExists ? '存在' : '不存在'}`);

    if (fileExists) {
      // 检查文件内容
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const contentLength = content.length;
        const firstLine = content.split('\n')[0];
        console.log(`  - 内容长度: ${contentLength} 字节`);
        console.log(`  - 第一行: ${firstLine}`);
      } catch (error) {
        console.error(`  - 读取文件内容时出错:`, error);
      }
    } else if (htmlExists) {
      console.log(`  - 注意: Markdown文件不存在，但HTML文件已生成`);
    }
  });
}

/**
 * 主函数
 */
function main() {
  console.log('开始检查Markdown文件...');

  // 检查每个类别
  categories.forEach(checkCategory);

  console.log('\n文件检查完成！');
}

// 执行主函数
main();
