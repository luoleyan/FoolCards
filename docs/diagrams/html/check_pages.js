// 检查所有Mermaid图表页面是否正常渲染
document.addEventListener('DOMContentLoaded', function() {
  const resultDiv = document.getElementById('results');

  // 所有包含Mermaid图表的页面
  const mermaidPages = [
    { path: 'structure/project_structure.html', title: '项目结构图' },
    { path: 'structure/class_diagram.html', title: '类图' },
    { path: 'structure/component_interaction.html', title: '组件交互图' },
    { path: 'structure/architecture.html', title: '架构设计图' },
    { path: 'structure/ai_opponent.html', title: 'AI对手实现' },
    { path: 'structure/error_handling.html', title: '错误处理策略' },
    { path: 'er/entity_relationship.html', title: '实体关系图' },
    { path: 'flowcharts/game_flow.html', title: '游戏流程图' },
    { path: 'flowcharts/game_state.html', title: '游戏状态图' },
    { path: 'ui/ui_layout.html', title: 'UI布局' },
    { path: 'ui/game_wireframe.html', title: '游戏界面线框图' },
    { path: 'ui/menu_wireframe.html', title: '菜单界面线框图' },
    { path: 'ui/card_interaction.html', title: '卡牌交互流程' },
    { path: 'ui/ui_component_hierarchy.html', title: 'UI组件层次结构' },
    { path: 'ui/ui_style_guide.html', title: 'UI样式指南' },
    { path: 'ui/interaction_flow.html', title: '交互流程图' },
    { path: 'test_mermaid.html', title: 'Mermaid测试页面' }
  ];

  let checkedCount = 0;
  let successCount = 0;
  let failedCount = 0;
  const failedPages = [];

  resultDiv.innerHTML = `<p>正在检查 ${mermaidPages.length} 个Mermaid图表页面...</p>`;

  function checkPage(url) {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      // 设置超时
      const timeout = setTimeout(() => {
        document.body.removeChild(iframe);
        reject(new Error('加载超时'));
      }, 10000); // 增加超时时间，因为Mermaid渲染可能需要更长时间

      // 加载成功
      iframe.onload = function() {
        clearTimeout(timeout);

        try {
          // 检查是否有Mermaid错误消息
          const errorElements = iframe.contentWindow.document.querySelectorAll('.error-message');

          if (errorElements.length > 0) {
            // 获取错误信息
            const errorMessages = Array.from(errorElements).map(el => el.textContent).join('; ');
            reject(new Error(`Mermaid渲染错误: ${errorMessages}`));
          } else {
            // 检查是否有成功渲染的Mermaid图表
            const mermaidSvgs = iframe.contentWindow.document.querySelectorAll('.mermaid svg');

            if (mermaidSvgs.length > 0) {
              resolve({
                success: true,
                count: mermaidSvgs.length
              });
            } else {
              // 检查页面是否包含Mermaid图表
              const mermaidDivs = iframe.contentWindow.document.querySelectorAll('.mermaid');

              if (mermaidDivs.length > 0) {
                reject(new Error(`找到 ${mermaidDivs.length} 个Mermaid图表，但未渲染成功`));
              } else {
                resolve({
                  success: true,
                  count: 0,
                  message: '页面不包含Mermaid图表'
                });
              }
            }
          }
        } catch (error) {
          reject(error);
        } finally {
          document.body.removeChild(iframe);
        }
      };

      // 加载失败
      iframe.onerror = function() {
        clearTimeout(timeout);
        document.body.removeChild(iframe);
        reject(new Error('页面加载失败'));
      };

      iframe.src = url;
    });
  }

  async function checkAllPages() {
    for (const page of mermaidPages) {
      const absoluteUrl = new URL(page.path, window.location.href).href;

      try {
        const result = await checkPage(absoluteUrl);
        successCount++;

        if (result.count > 0) {
          resultDiv.innerHTML += `<p style="color: green;">✓ ${page.title} (${page.path}): 成功渲染 ${result.count} 个Mermaid图表</p>`;
        } else if (result.message) {
          resultDiv.innerHTML += `<p style="color: blue;">ℹ ${page.title} (${page.path}): ${result.message}</p>`;
        } else {
          resultDiv.innerHTML += `<p style="color: green;">✓ ${page.title} (${page.path}): 加载成功</p>`;
        }
      } catch (error) {
        failedCount++;
        failedPages.push({ path: page.path, title: page.title, error: error.message });
        resultDiv.innerHTML += `<p style="color: red;">✗ ${page.title} (${page.path}): ${error.message}</p>`;
      }

      checkedCount++;
      document.getElementById('progress').textContent = `进度: ${checkedCount}/${mermaidPages.length}`;
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
          ${failedPages.map(page => `<li><strong>${page.title}</strong> (${page.path}): ${page.error}</li>`).join('')}
        </ul>
      `;
    }
  }

  checkAllPages();
});
