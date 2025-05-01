# FoolCards 项目分析文档HTML生成工具

本工具用于将FoolCards项目的Markdown文档转换为HTML静态网页，以便更好地展示项目的结构图、流程图和功能图等。

## 功能特点

1. 将Markdown文档转换为HTML静态网页
2. 自动将ASCII图表转换为交互式Mermaid图表
3. 支持代码高亮显示
4. 响应式设计，适应不同屏幕尺寸
5. 分类展示不同类型的文档

## 目录结构

```
html/
├── css/                  # 样式文件
│   └── style.css         # 主样式文件
│
├── js/                   # JavaScript文件
│   └── md-converter.js   # Markdown转换工具
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

## 注意事项

1. ASCII图表转换为Mermaid图表的功能仅支持基本的格式，复杂的ASCII图表可能需要手动调整
2. 生成脚本需要Node.js环境
3. 如果修改了CSS或JavaScript文件，需要重新运行生成脚本以应用更改
