# FoolCards 项目图表自动更新工具

本工具用于在代码更新时自动更新相关图表，确保文档与代码保持同步。

## 功能特点

1. **自动监视文件变化**：监视Markdown文件和代码文件的变化，自动更新相关图表
2. **选择性更新**：可以选择只更新特定类别的图表
3. **命令行界面**：提供简单的命令行界面，方便使用
4. **批处理支持**：提供Windows批处理文件，方便Windows用户使用

## 安装依赖

在使用本工具前，需要安装必要的依赖：

```bash
cd docs/diagrams/html
npm install
```

## 使用方法

### 使用npm脚本

```bash
# 生成所有HTML文件
npm run generate

# 监视文件变化并自动更新图表
npm run watch

# 更新所有图表
npm run update-all

# 只更新结构图
npm run update-structure

# 只更新实体关系图
npm run update-er

# 只更新流程图
npm run update-flowcharts

# 只更新UI设计图
npm run update-ui
```

### 使用批处理文件（Windows）

```bash
# 生成所有HTML文件
auto_update.bat

# 监视文件变化并自动更新图表
auto_update.bat --watch

# 更新所有图表
auto_update.bat --all

# 只更新结构图
auto_update.bat --structure

# 只更新实体关系图
auto_update.bat --er

# 只更新流程图
auto_update.bat --flowcharts

# 只更新UI设计图
auto_update.bat --ui
```

### 直接使用Node.js

```bash
# 生成所有HTML文件
node generate.js

# 监视文件变化并自动更新图表
node auto_update.js --watch

# 更新所有图表
node auto_update.js --all

# 只更新结构图
node auto_update.js --structure

# 只更新实体关系图
node auto_update.js --er

# 只更新流程图
node auto_update.js --flowcharts

# 只更新UI设计图
node auto_update.js --ui
```

## 代码与图表的映射关系

本工具会根据代码文件的变化，自动更新相关的图表。以下是代码目录与图表类别的映射关系：

| 代码目录 | 相关图表类别 |
|---------|------------|
| assets/scripts | 结构图、流程图 |
| assets/prefabs | 结构图、UI设计图 |
| assets/scenes | 结构图、UI设计图 |
| assets/resources | UI设计图 |

## 注意事项

1. 监视模式会持续运行，直到手动停止（按Ctrl+C）
2. 在大型项目中，可能需要调整监视的文件范围，以提高性能
3. 如果遇到问题，请检查控制台输出的错误信息

## 自定义配置

如果需要自定义配置，可以编辑`auto_update.js`文件中的以下部分：

1. `categories`：图表类别和对应的目录
2. `codeToChartMapping`：代码目录与图表类别的映射关系
