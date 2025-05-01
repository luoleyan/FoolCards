/**
 * 修复Mermaid图表语法错误的脚本
 *
 * 此脚本会遍历所有HTML文件，修复Mermaid图表的语法错误
 * 主要修复以下问题：
 * 1. 将startOnLoad设置为false，使用mermaid.run()代替手动渲染
 * 2. 修复classDef和class语句中的分号
 * 3. 修复注释语法，确保%%后没有空格
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

// 新的Mermaid初始化代码
const newMermaidInit = `  <script>
    // 初始化Mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      },
      er: {
        useMaxWidth: true
      },
      sequence: {
        useMaxWidth: true
      },
      classDiagram: {
        useMaxWidth: true
      },
      stateDiagram: {
        useMaxWidth: true
      }
    });

    // 处理页面加载完成后的操作
    document.addEventListener('DOMContentLoaded', function() {
      // 查找所有代码块并应用语法高亮
      if (typeof hljs !== 'undefined') {
        document.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightBlock(block);
        });
      } else {
        console.warn('highlight.js未加载，代码高亮功能不可用');
      }

      // 使用mermaid.run()而不是手动渲染
      try {
        mermaid.run({
          querySelector: '.mermaid'
        }).catch(error => {
          console.error('Mermaid运行错误:', error);
          document.querySelectorAll('.mermaid').forEach(el => {
            el.innerHTML = '<div class="error-message"><h3>图表渲染错误</h3><p>' + error.message + '</p></div>';
          });
        });
      } catch (error) {
        console.error('Mermaid处理错误:', error);
        document.querySelectorAll('.mermaid').forEach(el => {
          el.innerHTML = '<div class="error-message"><h3>图表处理错误</h3><p>' + error.message + '</p></div>';
        });
      }
    });
  </script>`;

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

// 修复Mermaid图表语法错误
function fixMermaidSyntax(mermaidCode) {
  // 首先，确保每行都有正确的缩进和换行
  let lines = mermaidCode.split('\n');
  let fixedLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // 跳过空行
    if (line === '') {
      fixedLines.push('');
      continue;
    }

    // 确保每行都有适当的缩进
    if (!line.startsWith('    ')) {
      line = '    ' + line;
    }

    // 修复注释语法
    if (line.includes('%%')) {
      line = line.replace(/%%\s+/, '%%');
    }

    // 修复classDef语法
    if (line.includes('classDef')) {
      // 移除末尾分号
      line = line.replace(/;$/, '');
    }

    // 修复class语法
    if (line.match(/^\s*class\s+/)) {
      // 移除末尾分号
      line = line.replace(/;$/, '');
    }

    fixedLines.push(line);
  }

  let fixedCode = fixedLines.join('\n');

  // 修复HTML实体
  fixedCode = fixedCode.replace(/&amp;/g, '&');

  return fixedCode;
}

// 检查并修复HTML文件中的Mermaid图表
async function fixMermaidInHtmlFile(filePath) {
  try {
    let content = await readFileAsync(filePath, 'utf8');
    let originalContent = content;
    let fixed = false;

    // 检查是否包含Mermaid
    if (!content.includes('mermaid.min.js') && !content.includes('class="mermaid"')) {
      console.log(`[${filePath}] 不包含Mermaid，跳过`);
      return false;
    }

    // 修复Mermaid初始化代码
    const initRegex = /<script>\s*\/\/ 初始化Mermaid[\s\S]*?document\.querySelectorAll\('\.mermaid'\)\.forEach[\s\S]*?<\/script>/;
    if (initRegex.test(content)) {
      content = content.replace(initRegex, newMermaidInit);
      fixed = true;
      console.log(`[${filePath}] 已修复Mermaid初始化代码`);
    }

    // 查找Mermaid图表
    const mermaidRegex = /<div class="mermaid">([\s\S]*?)<\/div>/g;
    let match;

    while ((match = mermaidRegex.exec(content)) !== null) {
      const mermaidCode = match[1];
      const fixedMermaidCode = fixMermaidSyntax(mermaidCode);

      if (mermaidCode !== fixedMermaidCode) {
        content = content.replace(match[0], `<div class="mermaid">${fixedMermaidCode}</div>`);
        fixed = true;
        console.log(`[${filePath}] 已修复Mermaid图表语法`);
      }
    }

    // 如果有修复，写入文件
    if (fixed) {
      await writeFileAsync(filePath, content, 'utf8');
      console.log(`[${filePath}] 已保存修改后的文件`);
      return true;
    } else {
      console.log(`[${filePath}] 未发现需要修复的问题`);
      return false;
    }
  } catch (error) {
    console.error(`[${filePath}] 检查失败:`, error);
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
      const fixed = await fixMermaidInHtmlFile(file);
      if (fixed) {
        fixedCount++;
      }
    }

    console.log(`检查完成，修复了 ${fixedCount} 个文件中的Mermaid图表语法错误`);
  } catch (error) {
    console.error('执行失败:', error);
  }
}

main();
