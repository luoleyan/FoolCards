// 自动检查所有页面是否有JavaScript错误
document.addEventListener('DOMContentLoaded', function() {
  const resultDiv = document.getElementById('results');
  const progressDiv = document.getElementById('progress');
  const startButton = document.getElementById('start-check');
  
  // 获取所有HTML文件的链接
  async function getAllHtmlLinks() {
    try {
      const response = await fetch('all_pages.html');
      const html = await response.text();
      
      // 创建一个临时的DOM元素来解析HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // 获取所有链接
      const links = Array.from(tempDiv.querySelectorAll('a[href]'))
        .map(link => link.getAttribute('href'))
        .filter(href => href.endsWith('.html'));
      
      return links;
    } catch (error) {
      console.error('获取链接失败:', error);
      return [];
    }
  }
  
  // 检查单个页面
  function checkPage(url) {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100px';
      iframe.style.border = '1px solid #ddd';
      iframe.style.borderRadius = '4px';
      iframe.style.marginBottom = '10px';
      document.getElementById('iframes').appendChild(iframe);
      
      // 设置超时
      const timeout = setTimeout(() => {
        iframe.remove();
        reject(new Error('加载超时'));
      }, 10000);
      
      // 捕获控制台错误
      const originalConsoleError = console.error;
      const errors = [];
      
      console.error = function(...args) {
        errors.push(args.join(' '));
        originalConsoleError.apply(console, args);
      };
      
      // 加载成功
      iframe.onload = function() {
        clearTimeout(timeout);
        console.error = originalConsoleError;
        
        try {
          // 检查是否有JavaScript错误
          const hasError = errors.length > 0 || 
                          iframe.contentWindow.document.querySelector('.error-message') !== null;
          
          if (hasError) {
            reject(new Error('页面包含错误: ' + errors.join(', ')));
          } else {
            resolve(iframe);
          }
        } catch (error) {
          iframe.remove();
          reject(error);
        }
      };
      
      // 加载失败
      iframe.onerror = function() {
        clearTimeout(timeout);
        console.error = originalConsoleError;
        iframe.remove();
        reject(new Error('页面加载失败'));
      };
      
      iframe.src = url;
    });
  }
  
  // 检查所有页面
  async function checkAllPages() {
    // 清空结果
    resultDiv.innerHTML = '';
    document.getElementById('iframes').innerHTML = '';
    
    // 获取所有链接
    const links = await getAllHtmlLinks();
    
    if (links.length === 0) {
      resultDiv.innerHTML = '<p style="color: red;">未找到任何HTML链接</p>';
      return;
    }
    
    let checkedCount = 0;
    let successCount = 0;
    let failedCount = 0;
    const failedPages = [];
    
    resultDiv.innerHTML = `<p>正在检查 ${links.length} 个页面...</p>`;
    
    // 逐个检查页面
    for (const link of links) {
      try {
        const iframe = await checkPage(link);
        successCount++;
        resultDiv.innerHTML += `<p style="color: green;">✓ ${link} 加载成功</p>`;
      } catch (error) {
        failedCount++;
        failedPages.push({ link, error: error.message });
        resultDiv.innerHTML += `<p style="color: red;">✗ ${link} 加载失败: ${error.message}</p>`;
      }
      
      checkedCount++;
      progressDiv.textContent = `进度: ${checkedCount}/${links.length}`;
    }
    
    // 显示最终结果
    resultDiv.innerHTML += `
      <h2>检查完成</h2>
      <p>总共检查: ${checkedCount} 个页面</p>
      <p style="color: green;">成功: ${successCount} 个页面</p>
      <p style="color: red;">失败: ${failedCount} 个页面</p>
    `;
    
    if (failedCount > 0) {
      resultDiv.innerHTML += `
        <h3>失败的页面:</h3>
        <ul>
          ${failedPages.map(page => `<li>${page.link}: ${page.error}</li>`).join('')}
        </ul>
      `;
    }
  }
  
  // 绑定按钮事件
  startButton.addEventListener('click', checkAllPages);
});
