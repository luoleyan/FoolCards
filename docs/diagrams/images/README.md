# FoolCards 项目图片资源

本目录用于存储FoolCards项目的各种图表和设计图片，包括但不限于：

1. 项目结构图
2. 类图
3. ER图
4. 流程图
5. UI设计图
6. 线框图
7. 原型图

## 目录结构

```
images/
├── structure/             # 项目结构相关图片
│   ├── project_structure.png   # 项目文件结构图
│   ├── class_diagram.png       # 类图
│   └── component_interaction.png # 组件交互图
│
├── er/                    # 实体关系图
│   └── entity_relationship.png  # 游戏实体关系图
│
├── flowcharts/            # 流程图
│   ├── game_flow.png           # 游戏主流程图
│   └── game_state.png          # 游戏状态转换图
│
├── ui/                    # UI设计图
│   ├── game_wireframe.png      # 游戏界面线框图
│   ├── menu_wireframe.png      # 主菜单界面线框图
│   ├── ui_components.png       # UI组件设计
│   └── ui_mockups/             # UI界面模拟图
│       ├── main_menu.png       # 主菜单界面
│       ├── game_screen.png     # 游戏主界面
│       ├── game_over.png       # 游戏结束界面
│       └── settings.png        # 设置界面
│
└── README.md              # 本文档
```

## 图片命名规范

1. 使用小写字母和下划线
2. 名称应清晰描述图片内容
3. 使用适当的文件扩展名（.png, .jpg, .svg等）
4. 版本更新时，可以在文件名后添加版本号（如project_structure_v2.png）

## 图片格式指南

1. **结构图和流程图**：
   - 推荐使用SVG格式（可缩放矢量图形）
   - 如果使用位图，建议使用PNG格式，分辨率至少300dpi

2. **UI设计图**：
   - 模拟图和线框图推荐使用PNG格式
   - 保持适当的分辨率，确保清晰可读
   - 对于复杂的UI设计，可以提供分层的PSD或Figma源文件

3. **图标和小型图形**：
   - 使用PNG格式，保留透明背景
   - 考虑提供多种尺寸以适应不同的显示需求

## 图片更新指南

1. 更新图片时，保留原始文件的备份
2. 在README.md中记录重要的更新
3. 如果图片有重大变更，考虑创建新文件而不是覆盖旧文件
4. 确保更新后的图片与当前代码保持一致

## 工具推荐

1. **结构图和流程图**：
   - [Draw.io](https://app.diagrams.net/)（免费，支持多种图表类型）
   - [Lucidchart](https://www.lucidchart.com/)（专业图表工具）
   - [PlantUML](https://plantuml.com/)（基于文本的UML图表生成）

2. **UI设计**：
   - [Figma](https://www.figma.com/)（协作设计工具）
   - [Adobe XD](https://www.adobe.com/products/xd.html)（UI/UX设计工具）
   - [Sketch](https://www.sketch.com/)（Mac专用设计工具）

3. **图片编辑**：
   - [Adobe Photoshop](https://www.adobe.com/products/photoshop.html)（专业图片编辑）
   - [GIMP](https://www.gimp.org/)（免费开源图片编辑）
   - [Inkscape](https://inkscape.org/)（免费矢量图形编辑）

## 注意事项

1. 避免上传过大的图片文件，建议进行适当压缩
2. 确保图片内容清晰可读
3. 对于包含敏感信息的图片，确保在上传前进行适当处理
4. 尽量使用对比度高的配色方案，提高可读性
