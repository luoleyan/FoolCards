/**
 * 将classDef和class语句转换为style语句的脚本
 * 
 * 此脚本会遍历所有HTML文件，将Mermaid图表中的classDef和class语句转换为style语句
 * 这是解决Mermaid语法错误的一种替代方案
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

// 获取所有HTML文件
async function getAllHtmlFiles(dir) {
  const files = await readdirAsync(dir, { withFileTypes: true });
  
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

// 将classDef和class语句转换为style语句
function convertClassDefToStyle(mermaidCode) {
  // 移除开始和结束标签
  let code = mermaidCode.replace(/<div class="mermaid">/g, '').replace(/<\/div>/g, '');
  
  // 分割成行
  const lines = code.split('\n');
  const fixedLines = [];
  
  // 存储classDef定义
  const classDefMap = {};
  
  // 存储class应用
  const classApplyMap = {};
  
  // 第一遍：收集所有classDef定义和class应用
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('classDef ')) {
      // 解析classDef语句
      // 格式: classDef className style
      const match = line.match(/classDef\s+(\w+)\s+(.*)/);
      if (match) {
        const className = match[1];
        const style = match[2].replace(/;$/, ''); // 移除末尾分号
        classDefMap[className] = style;
      }
    } else if (line.startsWith('class ')) {
      // 解析class语句
      // 格式: class nodeList className
      const match = line.match(/class\s+([\w,]+)\s+(\w+)/);
      if (match) {
        const nodeList = match[1].split(',');
        const className = match[2].replace(/;$/, ''); // 移除末尾分号
        
        for (const node of nodeList) {
          classApplyMap[node.trim()] = className;
        }
      }
    }
  }
  
  // 第二遍：生成新的代码，替换classDef和class语句为style语句
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('classDef ') || line.startsWith('class ')) {
      // 跳过classDef和class语句
      continue;
    } else if (line === '') {
      // 保留空行
      fixedLines.push('');
    } else {
      // 保留其他行
      fixedLines.push(line);
    }
  }
  
  // 添加style语句
  for (const node in classApplyMap) {
    const className = classApplyMap[node];
    const style = classDefMap[className];
    
    if (style) {
      fixedLines.push(`style ${node} ${style}`);
    }
  }
  
  // 重新格式化代码
  const formattedLines = [];
  formattedLines.push('<div class="mermaid">');
  
  for (const line of fixedLines) {
    if (line === '') {
      formattedLines.push('');
    } else {
      formattedLines.push(line);
    }
  }
  
  formattedLines.push('</div>');
  
  return formattedLines.join('\n');
}

// 修复HTML文件中的Mermaid图表
async function fixHtmlFile(filePath) {
  try {
    let content = await readFileAsync(filePath, 'utf8');
    let originalContent = content;
    let fixed = false;
    
    // 查找Mermaid图表
    const mermaidRegex = /<div class="mermaid">[\s\S]*?<\/div>/g;
    let match;
    let lastIndex = 0;
    let newContent = '';
    
    while ((match = mermaidRegex.exec(content)) !== null) {
      // 添加匹配之前的内容
      newContent += content.substring(lastIndex, match.index);
      
      // 转换classDef和class语句为style语句
      const mermaidCode = match[0];
      
      // 检查是否包含classDef或class语句
      if (mermaidCode.includes('classDef') || mermaidCode.includes('class ')) {
        const convertedCode = convertClassDefToStyle(mermaidCode);
        newContent += convertedCode;
        fixed = true;
      } else {
        // 不需要转换
        newContent += mermaidCode;
      }
      
      // 更新lastIndex
      lastIndex = match.index + match[0].length;
    }
    
    // 添加剩余内容
    if (lastIndex < content.length) {
      newContent += content.substring(lastIndex);
    }
    
    // 如果有修复，写入文件
    if (fixed) {
      await writeFileAsync(filePath, newContent, 'utf8');
      console.log(`[${filePath}] 已将classDef和class语句转换为style语句`);
      return true;
    } else {
      console.log(`[${filePath}] 未发现需要转换的classDef或class语句`);
      return false;
    }
  } catch (error) {
    console.error(`[${filePath}] 处理失败:`, error);
    return false;
  }
}

// 主函数
async function main() {
  try {
    const htmlDir = '.';
    const htmlFiles = await getAllHtmlFiles(htmlDir);
    
    console.log(`找到 ${htmlFiles.length} 个HTML文件`);
    
    let fixedCount = 0;
    
    for (const file of htmlFiles) {
      const fixed = await fixHtmlFile(file);
      if (fixed) {
        fixedCount++;
      }
    }
    
    console.log(`处理完成，转换了 ${fixedCount} 个文件中的classDef和class语句`);
  } catch (error) {
    console.error('执行失败:', error);
  }
}

main();
