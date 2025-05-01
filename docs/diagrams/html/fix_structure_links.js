const fs = require('fs');
const path = require('path');

// 结构图页面目录
const structureDir = path.join(__dirname, 'structure');

// 获取所有HTML文件
const files = fs.readdirSync(structureDir).filter(file => file.endsWith('.html'));

// 修复每个文件中的链接
files.forEach(file => {
    const filePath = path.join(structureDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 查找侧边栏链接部分
    const sidebarRegex = /<aside class="sidebar">[\s\S]*?<ul>[\s\S]*?<\/ul>[\s\S]*?<\/aside>/;
    const sidebarMatch = content.match(sidebarRegex);
    
    if (sidebarMatch) {
        const oldSidebar = sidebarMatch[0];
        
        // 检查是否包含错误的链接路径
        if (oldSidebar.includes('href="structure/')) {
            // 创建新的侧边栏内容，修复链接
            const newSidebar = `    <aside class="sidebar">
      <h3>结构图</h3>
      <ul>
        <li><a href="ai_opponent.html">Ai Opponent</a></li>
        <li><a href="architecture.html">Architecture</a></li>
        <li><a href="class_diagram.html">Class Diagram</a></li>
        <li><a href="component_interaction.html">Component Interaction</a></li>
        <li><a href="error_handling.html">Error Handling</a></li>
        <li><a href="project_structure.html">Project Structure</a></li>
      </ul>
    </aside>`;
            
            // 替换侧边栏内容
            content = content.replace(oldSidebar, newSidebar);
            
            // 写回文件
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed links in ${file}`);
        } else {
            console.log(`Links in ${file} are already correct`);
        }
    } else {
        console.log(`Could not find sidebar in ${file}`);
    }
});

console.log('All structure page links fixed!');
