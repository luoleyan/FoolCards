/**
 * Markdown到HTML转换工具
 * 用于将项目中的Markdown文档转换为HTML静态网页
 */

// 检查必要的库是否已加载
function checkDependencies() {
  if (typeof marked === 'undefined') {
    console.error('错误: marked库未加载');
    return false;
  }

  if (typeof hljs === 'undefined') {
    console.warn('警告: highlight.js未加载，代码高亮将不可用');
    // 继续执行，但不使用代码高亮
  }

  if (typeof mermaid === 'undefined') {
    console.warn('警告: mermaid.js未加载，图表渲染将不可用');
    // 继续执行，但不使用图表渲染
  }

  return true;
}

// 配置marked库
function configureMarked() {
  if (typeof marked === 'undefined') return;

  const options = {
    renderer: new marked.Renderer(),
    pedantic: false,
    gfm: true,
    breaks: false,
    sanitize: false,
    smartypants: false,
    xhtml: false
  };

  // 如果highlight.js可用，添加代码高亮功能
  if (typeof hljs !== 'undefined') {
    options.highlight = function(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(lang, code).value;
        } catch (e) {
          console.error('代码高亮错误:', e);
        }
      }

      try {
        return hljs.highlightAuto(code).value;
      } catch (e) {
        console.error('自动代码高亮错误:', e);
        return code; // 出错时返回原始代码
      }
    };
  }

  marked.use(options);
}

// 初始化
checkDependencies();
configureMarked();

/**
 * 将ASCII图表转换为Mermaid图表
 * @param {string} asciiDiagram - ASCII格式的图表
 * @param {string} type - 图表类型 (flowchart, classDiagram, etc.)
 * @returns {string} - Mermaid格式的图表
 */
function convertAsciiToMermaid(asciiDiagram, type = 'flowchart TD') {
  // 这里是一个简单的转换示例，实际应用中可能需要更复杂的转换逻辑
  // 对于简单的框图，我们可以尝试识别常见的ASCII图表模式

  let mermaidCode = type + '\n';

  // 检测框和连接
  const lines = asciiDiagram.split('\n');
  const boxes = [];
  const connections = [];

  // 简单的框检测 (使用+---+格式)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测框
    if (line.includes('+') && line.includes('-')) {
      const boxMatch = line.match(/\+[-]+\+/);
      if (boxMatch && i + 2 < lines.length) {
        const contentLine = lines[i + 1];
        const contentMatch = contentLine.match(/\|(.*)\|/);
        if (contentMatch) {
          const content = contentMatch[1].trim();
          const id = 'box' + boxes.length;
          boxes.push({ id, content });
        }
      }
    }

    // 检测连接 (使用-->或<-->格式)
    if (line.includes('-->') || line.includes('<-->')) {
      // 简化处理，实际应用中需要更复杂的逻辑
      connections.push(line);
    }
  }

  // 生成Mermaid代码
  boxes.forEach(box => {
    mermaidCode += `  ${box.id}["${box.content}"]\n`;
  });

  connections.forEach(conn => {
    // 简化处理，实际应用中需要更复杂的逻辑
    mermaidCode += '  ' + conn.replace(/\+/g, '') + '\n';
  });

  return mermaidCode;
}

/**
 * 处理Markdown内容中的代码块，将ASCII图表转换为Mermaid图表
 * @param {string} markdown - 原始Markdown内容
 * @returns {string} - 处理后的Markdown内容
 */
function processMermaidBlocks(markdown) {
  // 查找```开头和结尾的代码块
  const codeBlockRegex = /```([\s\S]*?)```/g;

  return markdown.replace(codeBlockRegex, (match, codeContent) => {
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
 * 将Markdown文件转换为HTML
 * @param {string} markdownContent - Markdown内容
 * @returns {string} - 转换后的HTML内容
 */
function convertMarkdownToHtml(markdownContent) {
  // 检查marked库是否可用
  if (typeof marked === 'undefined') {
    console.error('错误: marked库未加载，无法转换Markdown');
    return '<p>错误: 无法转换Markdown，marked库未加载</p>';
  }

  try {
    // 处理Mermaid图表
    const processedMarkdown = processMermaidBlocks(markdownContent);

    // 使用marked转换为HTML
    return marked.parse(processedMarkdown);
  } catch (error) {
    console.error('转换Markdown时出错:', error);
    return '<p>转换Markdown时出错: ' + error.message + '</p>';
  }
}

/**
 * 加载Markdown文件并转换为HTML
 * @param {string} markdownFilePath - Markdown文件路径
 * @param {function} callback - 回调函数，接收转换后的HTML内容
 */
function loadAndConvertMarkdown(markdownFilePath, callback) {
  console.log('开始加载Markdown文件:', markdownFilePath);

  // 显示加载中状态
  callback('<div class="loading"><span class="dots">...</span></div>');

  // 添加随机参数防止缓存
  const cacheBuster = '?t=' + new Date().getTime();
  const url = markdownFilePath + cacheBuster;

  fetch(url)
    .then(response => {
      console.log('文件加载状态:', response.status, response.statusText);
      if (!response.ok) {
        throw new Error('无法加载Markdown文件: ' + markdownFilePath + ' (状态码: ' + response.status + ')');
      }
      return response.text();
    })
    .then(markdownContent => {
      console.log('Markdown内容已加载，长度:', markdownContent.length);
      if (!markdownContent || markdownContent.trim() === '') {
        throw new Error('Markdown文件内容为空');
      }

      try {
        const htmlContent = convertMarkdownToHtml(markdownContent);
        console.log('Markdown转换为HTML成功');
        callback(htmlContent);
      } catch (error) {
        console.error('转换Markdown时出错:', error);
        throw error;
      }
    })
    .catch(error => {
      console.error('加载或转换Markdown时出错:', error);
      callback('<div class="error-message">' +
        '<h3>加载文档时出错</h3>' +
        '<p>' + error.message + '</p>' +
        '<p>请检查控制台获取详细信息，或者刷新页面重试。</p>' +
        '</div>');
    });
}

/**
 * 初始化页面内容
 * @param {string} markdownFilePath - Markdown文件路径
 * @param {string} contentElementId - 内容元素ID
 */
function initializeContent(markdownFilePath, contentElementId = 'content') {
  const contentElement = document.getElementById(contentElementId);
  if (!contentElement) {
    console.error('找不到内容元素:', contentElementId);
    return;
  }

  loadAndConvertMarkdown(markdownFilePath, htmlContent => {
    contentElement.innerHTML = htmlContent;

    // 初始化Mermaid
    if (typeof mermaid !== 'undefined') {
      mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    }

    // 应用代码高亮
    if (typeof hljs !== 'undefined') {
      document.querySelectorAll('pre code').forEach(block => {
        hljs.highlightBlock(block);
      });
    }
  });
}
