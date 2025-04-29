# FoolCards 项目图表文档

本目录包含FoolCards项目的各种图表和设计文档，用于帮助开发者理解项目结构、数据流和游戏逻辑。

## 目录结构

```
diagrams/
├── structure/             # 项目结构相关图表
│   ├── project_structure.md   # 项目文件结构图
│   ├── class_diagram.md       # 类图
│   ├── component_interaction.md # 组件交互图
│   └── architecture.md        # 架构设计图
│
├── er/                    # 实体关系图
│   └── entity_relationship.md  # 游戏实体关系图
│
├── flowcharts/            # 流程图
│   ├── game_flow.md           # 游戏主流程图
│   └── game_state.md          # 游戏状态转换图
│
├── ui/                    # UI设计图
│   ├── ui_layout.md           # UI布局设计
│   ├── card_interaction.md    # 卡牌交互流程
│   ├── game_wireframe.md      # 游戏界面线框图
│   ├── menu_wireframe.md      # 主菜单界面线框图
│   ├── ui_style_guide.md      # UI样式指南
│   ├── ui_component_hierarchy.md # UI组件层次结构
│   └── interaction_flow.md    # 交互流程图
│
└── README.md              # 本文档
```

## 图表类型说明

### 结构图 (structure/)

- **项目结构图** (project_structure.md)：展示项目的文件和目录结构，帮助开发者快速了解代码组织方式。
- **类图** (class_diagram.md)：展示项目中的主要类及其关系，包括属性和方法。
- **组件交互图** (component_interaction.md)：展示游戏中各组件之间的交互关系和数据流向。
- **架构设计图** (architecture.md)：展示游戏的整体架构设计，包括分层结构和核心模块。

### 实体关系图 (er/)

- **实体关系图** (entity_relationship.md)：展示游戏中的主要实体（如玩家、卡牌、场地等）及其关系。

### 流程图 (flowcharts/)

- **游戏流程图** (game_flow.md)：展示游戏的主要流程，从启动到结束的完整流程。
- **游戏状态图** (game_state.md)：展示游戏中的各种状态及其转换条件。

### UI设计图 (ui/)

- **UI布局设计** (ui_layout.md)：展示游戏界面的布局设计，包括各UI元素的位置和功能。
- **卡牌交互流程** (card_interaction.md)：展示玩家与卡牌交互的流程和效果。
- **游戏界面线框图** (game_wireframe.md)：详细的游戏界面线框设计，包括所有UI元素的布局和功能说明。
- **主菜单界面线框图** (menu_wireframe.md)：主菜单和相关界面的线框设计。
- **UI样式指南** (ui_style_guide.md)：定义游戏UI的颜色、字体、按钮样式等设计规范。
- **UI组件层次结构** (ui_component_hierarchy.md)：展示游戏UI组件的层次结构和组织方式。
- **交互流程图** (interaction_flow.md)：详细展示游戏中各种交互操作的流程。

## 图表更新指南

1. **添加新图表**：
   - 将新图表放在对应的子目录中
   - 使用Markdown格式，可以嵌入ASCII图表或链接到外部图片
   - 更新本README文件，添加新图表的描述

2. **更新现有图表**：
   - 直接编辑对应的Markdown文件
   - 保持图表的清晰和一致性
   - 在文件顶部添加最后更新日期

3. **图表命名规范**：
   - 使用小写字母和下划线
   - 名称应清晰描述图表内容
   - 使用.md扩展名（Markdown格式）

## 图表使用工具

- ASCII图表可以使用在线工具如[ASCIIFlow](http://asciiflow.com/)创建
- 也可以使用专业工具如Draw.io、Lucidchart等创建图表，然后导出为图片或转换为ASCII
- 对于复杂图表，建议使用专业工具创建，然后将图片文件保存在相应目录，并在Markdown中引用

## 注意事项

- 保持图表简洁明了，避免过于复杂的设计
- 确保图表与实际代码保持同步，定期更新
- 添加足够的注释和说明，帮助其他开发者理解
- 对于重要的更改，在提交时添加详细的说明
