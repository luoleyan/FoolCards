# FoolCards 项目分析文档HTML生成工具

本工具用于将FoolCards项目的Markdown文档转换为HTML静态网页，以便更好地展示项目的结构图、流程图和功能图等。

## 功能特点

1. 将Markdown文档转换为HTML静态网页
2. 自动将ASCII图表转换为交互式Mermaid图表
3. 支持代码高亮显示
4. 响应式设计，适应不同屏幕尺寸
5. 分类展示不同类型的文档
6. 支持点击图表查看大图
7. 支持右键菜单保存图表为图片文件

## 目录结构

```bash
html/
├── css/                  # 样式文件
│   ├── style.css         # 主样式文件
│   └── modal.css         # 模态框和图表交互样式
│
├── js/                   # JavaScript文件
│   ├── md-converter.js   # Markdown转换工具
│   └── diagram-modal.js  # 图表查看和保存功能
│
├── images/               # 图片资源
│
├── template.html         # HTML模板
├── index.html            # 主页
├── structure.html        # 结构图页面
├── er.html               # 实体关系图页面
├── flowcharts.html       # 流程图页面
├── ui.html               # UI设计图页面
├── changelog.html        # 更新日志页面
│
├── structure/            # 结构图HTML文件
├── er/                   # 实体关系图HTML文件
├── flowcharts/           # 流程图HTML文件
├── ui/                   # UI设计图HTML文件
│
├── generate.js           # 生成脚本
├── generate.bat          # Windows批处理脚本
├── package.json          # 依赖配置
└── README.md             # 本文档
```

## 使用方法

### 方法一：使用批处理脚本（Windows）

1. 确保已安装Node.js
2. 双击运行`generate.bat`
3. 等待生成完成
4. 用浏览器打开`index.html`查看文档

### 方法二：使用npm命令

1. 确保已安装Node.js
2. 打开命令行，进入html目录
3. 安装依赖：`npm install`
4. 运行生成脚本：`npm run generate`
5. 用浏览器打开`index.html`查看文档

### 方法三：直接使用Node.js

1. 确保已安装Node.js
2. 打开命令行，进入html目录
3. 安装依赖：`npm install marked highlight.js`
4. 运行生成脚本：`node generate.js`
5. 用浏览器打开`index.html`查看文档

## 手动查看文档

如果不想运行生成脚本，也可以直接用浏览器打开`index.html`查看已生成的文档。

## 添加新文档

1. 在相应的目录（structure、er、flowcharts、ui）中添加Markdown文档
2. 运行生成脚本，自动生成对应的HTML文件
3. 文档会自动添加到相应的分类页面中

## 技术栈

- HTML5
- CSS3
- JavaScript
- [Marked.js](https://marked.js.org/) - Markdown解析器
- [Mermaid.js](https://mermaid.js.org/) - 图表生成库
- [Highlight.js](https://highlightjs.org/) - 代码高亮库
- [html2canvas](https://html2canvas.hertzen.com/) - HTML转图片库

## 图表交互功能

### 查看大图

1. 点击任何Mermaid图表可以在模态框中查看大图
2. 大图模式下可以使用右下角的控制按钮进行放大、缩小和重置操作
3. 点击关闭按钮、点击模态框外部区域或按ESC键可以关闭大图

### 保存图表为图片

1. 在大图模式下，点击右下角的"保存图片"按钮可以将图表保存为PNG图片
2. 在大图模式下，右键点击图表，在弹出的菜单中选择"保存图片"也可以保存图表
3. 保存的图片文件名会根据图表标题自动生成

## 注意事项

1. ASCII图表转换为Mermaid图表的功能仅支持基本的格式，复杂的ASCII图表可能需要手动调整
2. 生成脚本需要Node.js环境
3. 如果修改了CSS或JavaScript文件，需要重新运行生成脚本以应用更改
4. 保存图片功能依赖html2canvas库，该库会在需要时自动加载
5. 如果html2canvas库加载失败，系统会尝试直接保存SVG格式的图表
6. 大型图表在查看和保存时已经过优化，确保完整显示和导出
7. 缩放功能直接应用于SVG元素，提供更好的查看体验
