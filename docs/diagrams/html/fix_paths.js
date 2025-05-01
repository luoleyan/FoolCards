/**
 * FoolCards 项目分析文档路径修复脚本
 * 
 * 此脚本用于修复HTML文件中的路径问题
 */

const fs = require('fs');
const path = require('path');

// 文档类别和对应的目录
const categories = [
  { 
    name: 'structure', 
    title: '结构图', 
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
    files: [
      { name: 'entity_relationship', title: '实体关系图' }
    ]
  },
  { 
    name: 'flowcharts', 
    title: '流程图', 
    files: [
      { name: 'game_flow', title: '游戏主流程图' },
      { name: 'game_state', title: '游戏状态转换图' }
    ]
  },
  { 
    name: 'ui', 
    title: 'UI设计图', 
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
 * 修复HTML文件中的路径
 * @param {string} filePath - HTML文件路径
 * @param {string} categoryName - 类别名称
 */
function fixHtmlPaths(filePath, categoryName) {
  if (!checkFileExists(filePath)) {
    console.error(`文件 ${filePath} 不存在，跳过修复`);
    return;
  }
  
  try {
    // 读取HTML文件
    let html = fs.readFileSync(filePath, 'utf8');
    
    // 修复CSS和JavaScript路径
    html = html.replace(
      /<link rel="stylesheet" href="css\/style\.css">/g,
      '<link rel="stylesheet" href="../css/style.css">'
    );
    
    // 修复导航链接
    html = html.replace(
      /<a href="index\.html">FoolCards 项目分析<\/a>/g,
      '<a href="../index.html">FoolCards 项目分析</a>'
    );
    
    html = html.replace(
      /<li><a href="structure\.html">结构图<\/a><\/li>/g,
      '<li><a href="../structure.html">结构图</a></li>'
    );
    
    html = html.replace(
      /<li><a href="er\.html">实体关系图<\/a><\/li>/g,
      '<li><a href="../er.html">实体关系图</a></li>'
    );
    
    html = html.replace(
      /<li><a href="flowcharts\.html">流程图<\/a><\/li>/g,
      '<li><a href="../flowcharts.html">流程图</a></li>'
    );
    
    html = html.replace(
      /<li><a href="ui\.html">UI设计图<\/a><\/li>/g,
      '<li><a href="../ui.html">UI设计图</a></li>'
    );
    
    // 修复侧边栏链接
    html = html.replace(
      new RegExp(`<li><a href="${categoryName}\/([a-z_]+)\.html">([^<]+)<\/a><\/li>`, 'g'),
      '<li><a href="$1.html">$2</a></li>'
    );
    
    // 添加md-converter.js脚本
    if (!html.includes('md-converter.js')) {
      html = html.replace(
        /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/highlight\.js[^>]+><\/script>/,
        '$&\n  <script src="../js/md-converter.js"></script>'
      );
    }
    
    // 写入修复后的HTML文件
    fs.writeFileSync(filePath, html);
    console.log(`已修复: ${filePath}`);
  } catch (error) {
    console.error(`修复文件 ${filePath} 时出错:`, error);
  }
}

/**
 * 修复一个类别的所有HTML文件
 * @param {Object} category - 类别信息
 */
function fixCategory(category) {
  console.log(`\n修复类别: ${category.title} (${category.name})`);
  console.log('-'.repeat(50));
  
  // 检查目录是否存在
  const dirPath = path.join(__dirname, category.name);
  if (!checkFileExists(dirPath)) {
    console.error(`目录 ${dirPath} 不存在，跳过此类别`);
    return;
  }
  
  // 修复每个文件
  category.files.forEach(file => {
    const filePath = path.join(__dirname, category.name, `${file.name}.html`);
    fixHtmlPaths(filePath, category.name);
  });
}

/**
 * 主函数
 */
function main() {
  console.log('开始修复HTML文件中的路径...');
  
  // 修复每个类别
  categories.forEach(fixCategory);
  
  console.log('\n路径修复完成！');
}

// 执行主函数
main();
