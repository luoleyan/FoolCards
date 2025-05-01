/**
 * FoolCards 项目分析文档HTML生成脚本
 *
 * 此脚本用于将Markdown文档转换为HTML静态网页
 */

const fs = require('fs');
const path = require('path');
const marked = require('marked');
const hljs = require('highlight.js');

// 配置marked
marked.setOptions({
  renderer: new marked.Renderer(),
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  pedantic: false,
  gfm: true,
  breaks: false,
  sanitize: false,
  smartypants: false,
  xhtml: false
});

// 文档类别和对应的目录
const categories = [
  { name: 'structure', title: '结构图', dir: path.resolve(__dirname, '../structure') },
  { name: 'er', title: '实体关系图', dir: path.resolve(__dirname, '../er') },
  { name: 'flowcharts', title: '流程图', dir: path.resolve(__dirname, '../flowcharts') },
  { name: 'ui', title: 'UI设计图', dir: path.resolve(__dirname, '../ui') }
];

// HTML模板
const templatePath = path.join(__dirname, 'template.html');
const template = fs.readFileSync(templatePath, 'utf8');

/**
 * 将ASCII图表转换为Mermaid图表
 * @param {string} asciiDiagram - ASCII格式的图表
 * @param {string} type - 图表类型
 * @returns {string} - Mermaid格式的图表
 */
function convertAsciiToMermaid(asciiDiagram, type = 'flowchart TD') {
  // 简单的转换逻辑，实际应用中可能需要更复杂的转换
  let mermaidCode = type + '\n';

  // 处理ASCII图表中的框和连接
  const lines = asciiDiagram.split('\n');

  // 这里只是一个简单的示例，实际转换需要更复杂的逻辑
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 跳过空行
    if (!line) continue;

    // 处理连接线
    if (line.includes('-->') || line.includes('<--') || line.includes('<-->')) {
      mermaidCode += '  ' + line.replace(/[+|]/g, '') + '\n';
    }
    // 处理节点
    else if (line.includes('|') && !line.includes('+')) {
      const content = line.replace(/[|]/g, '').trim();
      if (content) {
        const id = 'node' + i;
        mermaidCode += `  ${id}["${content}"]\n`;
      }
    }
  }

  return mermaidCode;
}

/**
 * 处理Markdown内容中的代码块，将ASCII图表转换为Mermaid图表
 * @param {string} markdown - 原始Markdown内容
 * @returns {string} - 处理后的Markdown内容
 */
function processMermaidBlocks(markdown) {
  // 查找```开头和结尾的代码块
  const codeBlockRegex = /```(?:mermaid)?\s*([\s\S]*?)```/g;

  return markdown.replace(codeBlockRegex, (match, codeContent) => {
    // 检查是否已经是Mermaid图表
    if (match.startsWith('```mermaid')) {
      return `<div class="mermaid">\n${codeContent.trim()}\n</div>`;
    }

    // 检查是否是ASCII图表
    if (codeContent.includes('+---+') ||
        codeContent.includes('|') ||
        codeContent.includes('+-') ||
        codeContent.includes('->')) {

      // 尝试确定图表类型
      let type = 'flowchart TD';
      if (codeContent.includes('class') && codeContent.includes('{')) {
        type = 'classDiagram';
      } else if (codeContent.includes('entity') || codeContent.includes('ER')) {
        type = 'erDiagram';
      }

      // 转换为Mermaid图表
      const mermaidCode = convertAsciiToMermaid(codeContent, type);
      return `<div class="mermaid">\n${mermaidCode}\n</div>`;
    }

    // 如果不是ASCII图表，保持原样
    return match;
  });
}

/**
 * 修复Mermaid图表语法错误
 * @param {string} mermaidCode - Mermaid图表代码
 * @returns {string} - 修复后的Mermaid图表代码
 */
function fixMermaidSyntax(mermaidCode) {
  // 修复注释符号
  let fixedCode = mermaidCode.replace(/^%%\s+/gm, '    %% ');

  // 修复HTML实体
  fixedCode = fixedCode.replace(/&amp;/g, '&');

  // 修复分号缺失
  fixedCode = fixedCode.replace(/classDef\s+(\w+)\s+([^;]+)$/gm, 'classDef $1 $2');

  // 修复class语句缺少分号
  fixedCode = fixedCode.replace(/class\s+([^;]+)$/gm, 'class $1');

  // 添加缩进
  fixedCode = fixedCode.replace(/^(\w)/gm, '    $1');

  return fixedCode;
}

/**
 * 修复HTML内容中的Mermaid图表问题
 * @param {string} html - 原始HTML内容
 * @returns {string} - 修复后的HTML内容
 */
function fixMermaidIssues(html) {
  // 修复Mermaid图表中的pre和code标签
  if (html.includes('mermaid') && (html.includes('<pre><code>') || html.includes('</code></pre>'))) {
    console.log('修复Mermaid图表中的pre和code标签');

    // 修复Mermaid图表中的pre和code标签
    const mermaidRegex = /<div class="mermaid">([\s\S]*?)<\/div>/g;
    html = html.replace(mermaidRegex, (match, mermaidContent) => {
      // 移除pre和code标签
      let fixedMermaidContent = mermaidContent
        .replace(/<pre><code>/g, '')
        .replace(/<\/code><\/pre>/g, '')
        .replace(/<\/code><\/pre/g, '')
        .replace(/<pre><code/g, '')
        .replace(/<\/code></g, '<')
        .replace(/><code>/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

      // 修复Mermaid语法错误
      fixedMermaidContent = fixMermaidSyntax(fixedMermaidContent);

      return `<div class="mermaid">${fixedMermaidContent}</div>`;
    });
  }

  // 修复未闭合的script标签
  const scriptTagMatches = html.match(/<script[^>]*>/g) || [];
  const closingScriptTagMatches = html.match(/<\/script>/g) || [];

  if (scriptTagMatches.length > closingScriptTagMatches.length) {
    console.log('修复未闭合的script标签');

    // 查找未闭合的script标签
    const scriptRegex = /<script[^>]*>(?:(?!<\/script>).)*?(?=<\/head>|<body>)/gs;
    html = html.replace(scriptRegex, (match) => {
      if (!match.includes('</script>')) {
        return match + '\n  </script>';
      }
      return match;
    });
  }

  return html;
}

/**
 * 将Markdown文件转换为HTML
 * @param {string} markdownPath - Markdown文件路径
 * @param {string} outputPath - 输出HTML文件路径
 * @param {string} title - 页面标题
 * @param {string} sidebarTitle - 侧边栏标题
 * @param {string} sidebarContent - 侧边栏内容
 */
function convertMarkdownToHtml(markdownPath, outputPath, title, sidebarTitle, sidebarContent) {
  try {
    // 读取Markdown文件
    const markdown = fs.readFileSync(markdownPath, 'utf8');

    // 处理Mermaid图表
    const processedMarkdown = processMermaidBlocks(markdown);

    // 转换为HTML
    const content = marked.parse(processedMarkdown);

    // 替换模板中的占位符
    let html = template
      .replace(/{{title}}/g, title)
      .replace(/{{sidebar_title}}/g, sidebarTitle)
      .replace(/{{sidebar_content}}/g, sidebarContent)
      .replace(/{{content}}/g, content);

    // 修复Mermaid图表和其他HTML问题
    html = fixMermaidIssues(html);

    // 修复CSS和JavaScript路径问题
    const categoryName = path.basename(path.dirname(outputPath));
    if (outputPath.includes(path.sep + categoryName + path.sep)) {
      // 如果是子目录中的文件，需要修改CSS和JavaScript路径
      // 修复CSS路径
      html = html.replace('href="css/style.css"', 'href="../css/style.css"');

      // 修复highlight.js的CSS路径
      html = html.replace('href="https://cdn.jsdelivr.net/npm/highlight.js@11.8.0/styles/github.min.css"',
                         'href="https://cdn.jsdelivr.net/npm/highlight.js@11.8.0/styles/github.min.css"');

      // 修复导航链接
      html = html.replace('href="index.html"', 'href="../index.html"');
      html = html.replace('href="structure.html"', 'href="../structure.html"');
      html = html.replace('href="er.html"', 'href="../er.html"');
      html = html.replace('href="flowcharts.html"', 'href="../flowcharts.html"');
      html = html.replace('href="ui.html"', 'href="../ui.html"');

      // 修复highlight.js的初始化
      html = html.replace('hljs.highlightBlock(block);', 'if (typeof hljs !== "undefined") { hljs.highlightBlock(block); }');
    }

    // 创建输出目录（如果不存在）
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 写入HTML文件
    fs.writeFileSync(outputPath, html);
    console.log(`已生成: ${outputPath}`);
  } catch (error) {
    console.error(`转换 ${markdownPath} 时出错:`, error);
  }
}

/**
 * 生成侧边栏内容
 * @param {string} category - 文档类别
 * @param {Array} files - 文件列表
 * @returns {string} - 侧边栏HTML内容
 */
function generateSidebarContent(category, files) {
  let content = '';

  files.forEach(file => {
    const name = path.basename(file, '.md');
    const title = name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    content += `<li><a href="${category}/${name}.html">${title}</a></li>\n`;
  });

  return content;
}

/**
 * 处理一个类别的所有文档
 * @param {Object} category - 类别信息
 */
function processCategory(category) {
  const { name, title, dir } = category;

  console.log(`处理类别: ${title} (${name}), 目录: ${dir}`);

  // 检查目录是否存在
  if (!fs.existsSync(dir)) {
    console.error(`错误: 目录 ${dir} 不存在，跳过此类别`);

    // 创建一个空的HTML文件，以便用户可以看到一些内容
    const outputDir = path.join(__dirname, name);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 使用我们之前创建的静态HTML文件
    console.log(`使用静态HTML文件代替...`);
    return;
  }

  try {
    // 获取该类别下的所有Markdown文件
    const files = fs.readdirSync(dir)
      .filter(file => file.endsWith('.md'))
      .map(file => path.join(dir, file));

    console.log(`找到 ${files.length} 个Markdown文件`);

    if (files.length === 0) {
      console.warn(`警告: 目录 ${dir} 中没有找到Markdown文件`);
      return;
    }

    // 生成侧边栏内容
    const sidebarContent = generateSidebarContent(name, files.map(file => path.basename(file)));

    // 处理每个文件
    files.forEach(file => {
      const baseName = path.basename(file, '.md');
      const pageTitle = baseName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      const outputPath = path.join(__dirname, name, baseName + '.html');

      console.log(`处理文件: ${file} -> ${outputPath}`);
      convertMarkdownToHtml(file, outputPath, pageTitle, title, sidebarContent);
    });
  } catch (error) {
    console.error(`处理类别 ${name} 时出错:`, error);
  }
}

/**
 * 主函数
 */
function main() {
  console.log('开始生成HTML静态网页...');

  // 处理每个类别
  categories.forEach(processCategory);

  console.log('HTML静态网页生成完成！');
}

// 执行主函数
main();
