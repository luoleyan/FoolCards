/**
 * 修复Mermaid图表格式的脚本
 * 
 * 此脚本会遍历所有HTML文件，修复Mermaid图表的格式问题
 * 主要修复以下问题：
 * 1. 确保每个语句都有正确的缩进
 * 2. 确保classDef语句之间有换行符
 * 3. 确保图表代码的开始和结束标签有正确的缩进
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

// 修复Mermaid图表格式
function fixMermaidFormat(mermaidCode) {
  // 分割成行
  const lines = mermaidCode.split('\n');
  const fixedLines = [];
  
  // 基本缩进级别
  const baseIndent = '        ';
  const contentIndent = baseIndent + '  ';
  
  // 添加开始标签（带基本缩进）
  fixedLines.push(baseIndent + '<div class="mermaid">');
  
  // 处理图表代码
  let chartType = '';
  let inClass = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // 跳过空行和开始/结束标签
    if (line === '' || line === '<div class="mermaid">' || line === '</div>') {
      continue;
    }
    
    // 检测图表类型
    if (line.startsWith('flowchart') || line.startsWith('graph')) {
      chartType = 'flowchart';
      fixedLines.push(contentIndent + line);
    } else if (line.startsWith('erDiagram')) {
      chartType = 'er';
      fixedLines.push(contentIndent + line);
    } else if (line.startsWith('classDiagram')) {
      chartType = 'class';
      fixedLines.push(contentIndent + line);
    } else if (line.startsWith('stateDiagram')) {
      chartType = 'state';
      fixedLines.push(contentIndent + line);
    } else if (line.startsWith('classDef')) {
      // 确保classDef语句之前有一个空行（如果不是第一行）
      if (i > 0 && !lines[i-1].trim().startsWith('classDef') && !lines[i-1].trim() === '') {
        fixedLines.push('');
      }
      
      // 移除末尾分号
      line = line.replace(/;$/, '');
      fixedLines.push(contentIndent + line);
      
      // 确保classDef语句之后有一个空行
      if (i < lines.length - 1 && !lines[i+1].trim().startsWith('classDef') && !lines[i+1].trim() === '') {
        fixedLines.push('');
      }
    } else if (line.startsWith('class ')) {
      // 确保class语句之前有一个空行（如果不是第一行）
      if (i > 0 && !lines[i-1].trim().startsWith('class ') && !lines[i-1].trim() === '') {
        fixedLines.push('');
      }
      
      // 移除末尾分号
      line = line.replace(/;$/, '');
      fixedLines.push(contentIndent + line);
    } else {
      // 其他行
      fixedLines.push(contentIndent + line);
    }
  }
  
  // 添加结束标签（带基本缩进）
  fixedLines.push(baseIndent + '</div>');
  
  return fixedLines.join('\n');
}

// 修复HTML文件中的Mermaid图表
async function fixHtmlFile(filePath) {
  try {
    let content = await readFileAsync(filePath, 'utf8');
    let originalContent = content;
    let fixed = false;
    
    // 查找Mermaid图表
    const mermaidRegex = /<div class="mermaid">([\s\S]*?)<\/div>/g;
    let match;
    let lastIndex = 0;
    let newContent = '';
    
    while ((match = mermaidRegex.exec(content)) !== null) {
      // 添加匹配之前的内容
      newContent += content.substring(lastIndex, match.index);
      
      // 修复Mermaid图表格式
      const mermaidCode = match[0];
      const fixedMermaidCode = fixMermaidFormat(mermaidCode);
      
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
      console.log(`[${filePath}] 已修复Mermaid图表格式`);
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
    
    console.log(`处理完成，修复了 ${fixedCount} 个文件中的Mermaid图表格式`);
  } catch (error) {
    console.error('执行失败:', error);
  }
}

main();
