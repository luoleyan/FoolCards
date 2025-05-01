const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');

const readFileAsync = promisify(fs.readFile);
const execAsync = promisify(exec);

// 获取所有HTML文件
async function getAllHtmlFiles(dir) {
  const files = await promisify(fs.readdir)(dir, { withFileTypes: true });
  
  const htmlFiles = [];
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      const subDirFiles = await getAllHtmlFiles(fullPath);
      htmlFiles.push(...subDirFiles);
    } else if (file.name.endsWith('.html')) {
      htmlFiles.push(fullPath);
    }
  }
  
  return htmlFiles;
}

// 主函数
async function main() {
  try {
    const htmlDir = 'html';
    const htmlFiles = await getAllHtmlFiles(htmlDir);
    
    console.log(`找到 ${htmlFiles.length} 个HTML文件`);
    
    // 创建一个简单的HTML文件，列出所有页面的链接
    let linksHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>所有页面链接 - FoolCards 项目分析文档</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    ul {
      list-style-type: none;
      padding: 0;
    }
    li {
      margin-bottom: 10px;
      padding: 5px;
      border-bottom: 1px solid #f0f0f0;
    }
    a {
      color: #3498db;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h1>所有页面链接</h1>
  <p>点击下面的链接可以打开对应的页面：</p>
  <ul>
`;
    
    // 添加所有页面的链接
    for (const file of htmlFiles) {
      const relativePath = file.replace(/\\/g, '/').replace('html/', '');
      linksHtml += `    <li><a href="${relativePath}" target="_blank">${relativePath}</a></li>\n`;
    }
    
    linksHtml += `
  </ul>
</body>
</html>
`;
    
    // 保存链接页面
    await promisify(fs.writeFile)(path.join(htmlDir, 'all_pages.html'), linksHtml, 'utf8');
    
    console.log('已生成所有页面的链接页面: html/all_pages.html');
    console.log('请在浏览器中打开此页面，并点击链接检查每个页面是否正常工作');
  } catch (error) {
    console.error('执行失败:', error);
  }
}

main();
