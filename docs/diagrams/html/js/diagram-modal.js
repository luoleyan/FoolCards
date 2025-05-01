/**
 * 图表模态框功能
 * 允许用户点击图表查看大图
 */
document.addEventListener('DOMContentLoaded', function() {
  // 创建模态框元素
  const modal = document.createElement('div');
  modal.className = 'diagram-modal';
  modal.innerHTML = `
    <div class="diagram-modal-content">
      <span class="diagram-close">&times;</span>
      <h3 class="diagram-title"></h3>
      <div class="mermaid-large"></div>
      <div class="diagram-controls">
        <button id="zoom-in">放大</button>
        <button id="zoom-out">缩小</button>
        <button id="reset-zoom">重置</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // 获取模态框元素
  const modalContent = modal.querySelector('.diagram-modal-content');
  const closeBtn = modal.querySelector('.diagram-close');
  const diagramTitle = modal.querySelector('.diagram-title');
  const mermaidLarge = modal.querySelector('.mermaid-large');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const resetZoomBtn = document.getElementById('reset-zoom');

  // 当前缩放级别
  let currentZoom = 1;

  // 为所有Mermaid图表添加点击事件
  document.querySelectorAll('.mermaid').forEach((diagram, index) => {
    // 跳过已经在模态框中的图表
    if (diagram.closest('.diagram-modal')) return;
    
    // 为每个图表添加唯一ID（如果没有）
    if (!diagram.id) {
      diagram.id = 'mermaid-diagram-' + index;
    }
    
    // 添加点击事件
    diagram.addEventListener('click', function() {
      // 获取图表的前一个h2标题作为模态框标题
      let title = "图表详情";
      let prevElement = diagram.previousElementSibling;
      
      // 向上查找最近的标题元素
      while (prevElement) {
        if (prevElement.tagName === 'H2' || prevElement.tagName === 'H3' || 
            prevElement.tagName === 'H1') {
          title = prevElement.textContent;
          break;
        }
        prevElement = prevElement.previousElementSibling;
      }
      
      // 设置模态框标题
      diagramTitle.textContent = title;
      
      // 复制图表内容到模态框
      mermaidLarge.innerHTML = diagram.innerHTML;
      
      // 重新渲染模态框中的图表
      if (typeof mermaid !== 'undefined') {
        try {
          // 使用mermaid API重新渲染图表
          mermaid.init(undefined, mermaidLarge);
        } catch (error) {
          console.error('Mermaid渲染错误:', error);
        }
      }
      
      // 显示模态框
      modal.classList.add('show');
      
      // 重置缩放
      currentZoom = 1;
      mermaidLarge.style.transform = `scale(${currentZoom})`;
    });
  });
  
  // 关闭模态框
  closeBtn.addEventListener('click', function() {
    modal.classList.remove('show');
  });
  
  // 点击模态框背景关闭
  modal.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.classList.remove('show');
    }
  });
  
  // ESC键关闭模态框
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.classList.contains('show')) {
      modal.classList.remove('show');
    }
  });
  
  // 缩放功能
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', function() {
      currentZoom += 0.1;
      mermaidLarge.style.transform = `scale(${currentZoom})`;
    });
  }
  
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', function() {
      currentZoom = Math.max(0.5, currentZoom - 0.1);
      mermaidLarge.style.transform = `scale(${currentZoom})`;
    });
  }
  
  if (resetZoomBtn) {
    resetZoomBtn.addEventListener('click', function() {
      currentZoom = 1;
      mermaidLarge.style.transform = `scale(${currentZoom})`;
    });
  }
});
