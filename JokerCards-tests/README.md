# JokerCards 游戏测试项目

这是JokerCards游戏的独立测试项目，包含各种类型的测试，如单元测试、功能测试、性能测试等。

## 项目结构

```
JokerCards-tests/         # 测试项目根目录
├── tests/                # 测试文件
│   ├── unit/             # 单元测试
│   ├── functional/       # 功能测试
│   ├── performance/      # 性能测试
│   ├── compatibility/    # 兼容性测试
│   ├── system/           # 系统测试
│   ├── blackbox/         # 黑盒测试
│   ├── whitebox/         # 白盒测试
│   ├── utils/            # 测试工具和辅助函数
│   ├── setup.js          # 测试设置文件
│   └── manual-test-guide.md  # 手动测试指南
├── package.json          # 测试项目依赖
├── jest.config.js        # Jest配置
├── .babelrc              # Babel配置
├── run-tests.js          # 测试运行脚本
└── README.md             # 本文件
```

## 安装

```bash
# 安装测试依赖
npm install
```

## 运行测试

```bash
# 运行所有测试
npm test

# 运行特定类型的测试
npm run test:unit        # 单元测试
npm run test:functional  # 功能测试
npm run test:performance # 性能测试
npm run test:system      # 系统测试
npm run test:blackbox    # 黑盒测试
npm run test:whitebox    # 白盒测试

# 生成测试覆盖率报告
npm run test:coverage
```

也可以使用测试运行脚本：

```bash
# 运行单元测试
node run-tests.js unit

# 运行功能测试
node run-tests.js functional

# 运行性能测试
node run-tests.js performance

# 运行系统测试
node run-tests.js system

# 运行黑盒测试
node run-tests.js blackbox

# 运行白盒测试
node run-tests.js whitebox

# 运行所有测试
node run-tests.js all

# 准备兼容性测试
node run-tests.js compatibility
```

## 测试类型说明

### 单元测试 (Unit Testing)
测试独立组件和函数的正确性，如Card类的基本功能。

### 功能测试 (Functional Testing)
测试游戏功能是否按照预期工作，如出牌、回合管理、分数计算等。

### 性能测试 (Performance Testing)
评估游戏在不同条件下的性能表现，如出牌、分数计算、AI出牌等操作的执行时间。

### 兼容性测试 (Compatibility Testing)
确保游戏在不同浏览器和设备上正常运行。

### 系统测试 (System Testing)
测试整个游戏系统的集成功能，模拟完整游戏流程。

### 黑盒测试 (Black Box Testing)
从用户角度测试游戏功能，不关注内部实现。

### 白盒测试 (White Box Testing)
基于代码结构的测试，关注内部实现。

## 手动测试

对于无法完全自动化的测试，请参考 `tests/manual-test-guide.md` 文件中的详细指南。

## 测试工具和辅助函数

测试项目使用以下工具和辅助函数：

- **Cocos Creator环境模拟**：模拟Cocos Creator的核心类和API
- **卡牌模拟类**：模拟Card类的行为
- **游戏管理器模拟类**：模拟GameManager类的行为
- **AI对手模拟类**：模拟AIOpponent类的行为
- **场景效果模拟类**：模拟SceneEffect类的行为
- **特殊牌型模拟类**：模拟SpecialHandsManager类的行为

这些工具位于 `tests/utils/` 目录下。
