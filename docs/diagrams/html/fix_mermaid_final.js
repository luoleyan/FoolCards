/**
 * 最终版Mermaid图表修复脚本
 * 
 * 此脚本会遍历所有HTML文件，修复Mermaid图表的语法错误
 * 主要修复以下问题：
 * 1. 确保classDef语句之间有注释行分隔
 * 2. 确保每个语句都有正确的缩进
 * 3. 确保图表代码的格式正确
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

// 修复Mermaid图表语法
function fixMermaidSyntax(mermaidCode) {
  // 移除开始和结束标签
  let code = mermaidCode.replace(/<div class="mermaid">/g, '').replace(/<\/div>/g, '');
  
  // 分割成行
  const lines = code.split('\n');
  const fixedLines = [];
  
  // 跟踪当前图表类型和状态
  let chartType = '';
  let inClassDef = false;
  let lastLineWasClassDef = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // 跳过空行
    if (line === '') {
      fixedLines.push('');
      continue;
    }
    
    // 检测图表类型
    if (line.startsWith('flowchart') || line.startsWith('graph')) {
      chartType = 'flowchart';
      fixedLines.push(line);
    } else if (line.startsWith('erDiagram')) {
      chartType = 'er';
      fixedLines.push(line);
    } else if (line.startsWith('classDiagram')) {
      chartType = 'class';
      fixedLines.push(line);
    } else if (line.startsWith('stateDiagram')) {
      chartType = 'state';
      fixedLines.push(line);
    } else if (line.startsWith('classDef')) {
      // 如果上一行也是classDef，添加一个注释行分隔
      if (lastLineWasClassDef) {
        fixedLines.push('%% 分隔classDef语句');
      }
      
      // 移除末尾分号
      line = line.replace(/;$/, '');
      fixedLines.push(line);
      
      lastLineWasClassDef = true;
    } else {
      fixedLines.push(line);
      lastLineWasClassDef = line.startsWith('class ');
    }
  }
  
  // 重新格式化代码，添加适当的缩进
  const formattedLines = [];
  formattedLines.push('<div class="mermaid">');
  
  for (let i = 0; i < fixedLines.length; i++) {
    const line = fixedLines[i];
    
    if (line === '') {
      formattedLines.push('');
    } else if (line.startsWith('flowchart') || line.startsWith('graph') || 
               line.startsWith('erDiagram') || line.startsWith('classDiagram') || 
               line.startsWith('stateDiagram')) {
      formattedLines.push(line);
    } else if (line.startsWith('%% ')) {
      formattedLines.push('    ' + line);
    } else {
      formattedLines.push('    ' + line);
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
      
      // 修复Mermaid图表语法
      const mermaidCode = match[0];
      const fixedMermaidCode = fixMermaidSyntax(mermaidCode);
      
      // 添加修复后的Mermaid图表
      newContent += fixedMermaidCode;
      
      // 更新lastIndex
      lastIndex = match.index + match[0].length;
      
      // 标记为已修复
      fixed = true;
    }
    
    // 添加剩余内容
    if (lastIndex < content.length) {
      newContent += content.substring(lastIndex);
    }
    
    // 如果有修复，写入文件
    if (fixed) {
      await writeFileAsync(filePath, newContent, 'utf8');
      console.log(`[${filePath}] 已修复Mermaid图表语法`);
      return true;
    } else {
      console.log(`[${filePath}] 未发现需要修复的Mermaid图表`);
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
    
    console.log(`处理完成，修复了 ${fixedCount} 个文件中的Mermaid图表语法`);
  } catch (error) {
    console.error('执行失败:', error);
  }
}

main();
