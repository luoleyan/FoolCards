/**
 * FoolCards 项目分析文档HTML页面生成脚本
 *
 * 此脚本用于从模板生成HTML页面
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

// 读取模板文件
const templatePath = path.join(__dirname, 'page_template.html');
const template = fs.readFileSync(templatePath, 'utf8');

/**
 * 生成侧边栏链接
 * @param {Array} files - 文件列表
 * @param {string} category - 类别名称
 * @returns {string} - 侧边栏链接HTML
 */
function generateSidebarLinks(files, category) {
  return files.map(file =>
    `<li><a href="${file.name}.html">${file.title}</a></li>`
  ).join('\n        ');
}

/**
 * 从模板生成HTML页面
 * @param {Object} file - 文件信息
 * @param {Object} category - 类别信息
 */
function generatePage(file, category) {
  // 生成侧边栏链接
  const sidebarLinks = generateSidebarLinks(category.files, category.name);

  // 替换模板中的占位符
  let html = template
    .replace(/{{title}}/g, file.title)
    .replace(/{{sidebar_title}}/g, category.title)
    .replace(/{{sidebar_links}}/g, sidebarLinks)
    .replace(/{{markdown_path}}/g, `${category.dir}/${file.name}.md`);

  // 创建输出目录（如果不存在）
  const outputDir = path.join(__dirname, category.name);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 写入HTML文件
  const outputPath = path.join(outputDir, `${file.name}.html`);
  fs.writeFileSync(outputPath, html);
  console.log(`已生成: ${outputPath}`);
}

/**
 * 处理一个类别的所有文档
 * @param {Object} category - 类别信息
 */
function processCategory(category) {
  console.log(`处理类别: ${category.title}`);

  // 处理每个文件
  category.files.forEach(file => {
    generatePage(file, category);
  });
}

/**
 * 主函数
 */
function main() {
  console.log('开始生成HTML页面...');

  // 处理每个类别
  categories.forEach(processCategory);

  console.log('HTML页面生成完成！');
}

// 执行主函数
main();
