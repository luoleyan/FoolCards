/**
 * FoolCards 项目分析文档HTML文件检查脚本
 * 
 * 此脚本用于检查HTML文件是否存在
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

// 主页和分类页面
const mainPages = [
  { name: 'index', title: '主页' },
  { name: 'structure', title: '结构图' },
  { name: 'er', title: '实体关系图' },
  { name: 'flowcharts', title: '流程图' },
  { name: 'ui', title: 'UI设计图' },
  { name: 'changelog', title: '更新日志' }
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
 * 检查主页和分类页面
 */
function checkMainPages() {
  console.log('\n检查主页和分类页面:');
  console.log('-'.repeat(50));
  
  mainPages.forEach(page => {
    const filePath = path.join(__dirname, `${page.name}.html`);
    const exists = checkFileExists(filePath);
    console.log(`${page.title} (${page.name}.html): ${exists ? '存在' : '不存在'}`);
    
    if (exists) {
      try {
        const stats = fs.statSync(filePath);
        console.log(`  - 文件大小: ${stats.size} 字节`);
        console.log(`  - 修改时间: ${stats.mtime}`);
      } catch (error) {
        console.error(`  - 获取文件信息时出错:`, error);
      }
    }
  });
}

/**
 * 检查一个类别的所有HTML文件
 * @param {Object} category - 类别信息
 */
function checkCategory(category) {
  console.log(`\n检查类别: ${category.title} (${category.name})`);
  console.log('-'.repeat(50));
  
  // 检查目录是否存在
  const dirPath = path.join(__dirname, category.name);
  const dirExists = checkFileExists(dirPath);
  console.log(`目录 ${category.name}: ${dirExists ? '存在' : '不存在'}`);
  
  if (!dirExists) {
    console.log(`警告: 目录 ${category.name} 不存在，将跳过此类别的文件检查`);
    return;
  }
  
  // 检查每个文件
  let existCount = 0;
  let totalCount = category.files.length;
  
  category.files.forEach(file => {
    const filePath = path.join(__dirname, category.name, `${file.name}.html`);
    const exists = checkFileExists(filePath);
    console.log(`${file.title} (${file.name}.html): ${exists ? '存在' : '不存在'}`);
    
    if (exists) {
      existCount++;
      try {
        const stats = fs.statSync(filePath);
        console.log(`  - 文件大小: ${stats.size} 字节`);
        console.log(`  - 修改时间: ${stats.mtime}`);
      } catch (error) {
        console.error(`  - 获取文件信息时出错:`, error);
      }
    }
  });
  
  console.log(`\n总结: ${existCount}/${totalCount} 个文件存在`);
}

/**
 * 主函数
 */
function main() {
  console.log('开始检查HTML文件...');
  
  // 检查主页和分类页面
  checkMainPages();
  
  // 检查每个类别
  categories.forEach(checkCategory);
  
  console.log('\nHTML文件检查完成！');
}

// 执行主函数
main();
