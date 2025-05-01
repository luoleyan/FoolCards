# FoolCards 架构设计

## 整体架构

```mermaid
flowchart LR
    View["表现层 (View)"] <--> Logic["逻辑层 (Logic)"] <--> Data["数据层 (Data)"]

    %% 样式定义
    classDef viewLayer fill:#9cf,stroke:#36c,stroke-width:2px;
    classDef logicLayer fill:#f96,stroke:#933,stroke-width:2px;
    classDef dataLayer fill:#9f9,stroke:#393,stroke-width:2px;

    %% 应用样式
    class View viewLayer;
    class Logic logicLayer;
    class Data dataLayer;
```

## 分层详细结构

### 表现层 (View)

```mermaid
flowchart TD
    View["表现层 (View)"]
    View --> UIComponents["UI组件"]
    View --> Scenes["场景"]
    View --> Animations["动画效果"]
    View --> InputHandling["用户输入处理"]
    View --> VisualFeedback["视觉反馈"]

    %% 样式定义
    classDef main fill:#9cf,stroke:#36c,stroke-width:2px;
    classDef sub fill:#cdf,stroke:#36c,stroke-width:1px;

    %% 应用样式
    class View main;
    class UIComponents,Scenes,Animations,InputHandling,VisualFeedback sub;
```

### 逻辑层 (Logic)

```mermaid
flowchart TD
    Logic["逻辑层 (Logic)"]
    Logic --> GameManager["游戏管理器"]
    Logic --> CardLogic["卡牌逻辑"]
    Logic --> AreaLogic["场地逻辑"]
    Logic --> SpecialHandsLogic["特殊牌型逻辑"]
    Logic --> ScoreCalculation["分数计算"]
    Logic --> GameRules["游戏规则"]

    %% 样式定义
    classDef main fill:#f96,stroke:#933,stroke-width:2px;
    classDef sub fill:#fda,stroke:#933,stroke-width:1px;

    %% 应用样式
    class Logic main;
    class GameManager,CardLogic,AreaLogic,SpecialHandsLogic,ScoreCalculation,GameRules sub;
```

### 数据层 (Data)

```mermaid
flowchart TD
    Data["数据层 (Data)"]
    Data --> CardData["卡牌数据"]
    Data --> PlayerData["玩家数据"]
    Data --> GameState["游戏状态"]
    Data --> ConfigData["配置数据"]
    Data --> Storage["持久化存储"]

    %% 样式定义
    classDef main fill:#9f9,stroke:#393,stroke-width:2px;
    classDef sub fill:#cfc,stroke:#393,stroke-width:1px;

    %% 应用样式
    class Data main;
    class CardData,PlayerData,GameState,ConfigData,Storage sub;
```

## 核心模块

### 游戏管理模块

```mermaid
classDiagram
    class GameManager {
        +游戏初始化()
        +回合管理()
        +状态转换()
        +事件分发()
        +结果计算()
    }
```

### 卡牌系统

```mermaid
flowchart TD
    CardSystem["卡牌系统"]
    CardSystem --> CardDefinition["卡牌定义"]
    CardSystem --> CardBehavior["卡牌行为"]
    CardSystem --> CardEffect["卡牌效果"]
    CardSystem --> CardInteraction["卡牌交互"]
    CardSystem --> CardCombination["卡牌组合"]

    %% 样式定义
    classDef main fill:#f96,stroke:#933,stroke-width:2px;
    classDef sub fill:#fda,stroke:#933,stroke-width:1px;

    %% 应用样式
    class CardSystem main;
    class CardDefinition,CardBehavior,CardEffect,CardInteraction,CardCombination sub;
```

### 场地系统

```mermaid
flowchart TD
    AreaSystem["场地系统"]
    AreaSystem --> AreaDefinition["场地定义"]
    AreaSystem --> AreaEffect["场地效果"]
    AreaSystem --> CardPlacementRules["卡牌放置规则"]
    AreaSystem --> ScoreCalculation["分数计算"]
    AreaSystem --> SpecialEffectTrigger["特殊效果触发"]

    %% 样式定义
    classDef main fill:#f96,stroke:#933,stroke-width:2px;
    classDef sub fill:#fda,stroke:#933,stroke-width:1px;

    %% 应用样式
    class AreaSystem main;
    class AreaDefinition,AreaEffect,CardPlacementRules,ScoreCalculation,SpecialEffectTrigger sub;
```

### 特殊牌型系统

```mermaid
flowchart TD
    SpecialHandsSystem["特殊牌型系统"]
    SpecialHandsSystem --> HandDefinition["牌型定义"]
    SpecialHandsSystem --> HandDetection["牌型检测"]
    SpecialHandsSystem --> EffectApplication["效果应用"]
    SpecialHandsSystem --> BonusRules["加分规则"]
    SpecialHandsSystem --> VisualFeedback["视觉反馈"]

    %% 样式定义
    classDef main fill:#f96,stroke:#933,stroke-width:2px;
    classDef sub fill:#fda,stroke:#933,stroke-width:1px;

    %% 应用样式
    class SpecialHandsSystem main;
    class HandDefinition,HandDetection,EffectApplication,BonusRules,VisualFeedback sub;
```

### UI系统

```mermaid
flowchart TD
    UISystem["UI系统"]
    UISystem --> Layout["界面布局"]
    UISystem --> Controls["交互控件"]
    UISystem --> Animations["动画效果"]
    UISystem --> PopupManagement["弹窗管理"]
    UISystem --> FeedbackSystem["反馈系统"]

    %% 样式定义
    classDef main fill:#9cf,stroke:#36c,stroke-width:2px;
    classDef sub fill:#cdf,stroke:#36c,stroke-width:1px;

    %% 应用样式
    class UISystem main;
    class Layout,Controls,Animations,PopupManagement,FeedbackSystem sub;
```

## 数据流向

```mermaid
flowchart LR
    UserInput["用户输入"] --> UISystem["UI系统"]
    UISystem --> GameManager["游戏管理模块"]
    GameManager --> LogicProcessing["逻辑处理"]
    LogicProcessing --> DataUpdate["数据更新"]
    DataUpdate --> UIUpdate["UI更新"]
    UIUpdate --> VisualFeedback["视觉反馈"]

    %% 样式定义
    classDef input fill:#bbf,stroke:#33f,stroke-width:2px;
    classDef process fill:#f96,stroke:#933,stroke-width:1px;
    classDef output fill:#9cf,stroke:#36c,stroke-width:1px;
    classDef data fill:#9f9,stroke:#393,stroke-width:1px;

    %% 应用样式
    class UserInput input;
    class UISystem,GameManager,LogicProcessing process;
    class DataUpdate data;
    class UIUpdate,VisualFeedback output;
```

## 扩展性设计

1. **新卡牌类型**：
   - 通过扩展Card基类
   - 定义新的卡牌效果和行为

2. **新场地效果**：
   - 通过扩展SceneEffect类
   - 实现新的效果逻辑

3. **新特殊牌型**：
   - 在SpecialHands中添加新的检测方法
   - 定义新的加分规则

4. **新游戏模式**：
   - 通过扩展GameManager
   - 修改游戏规则和流程

## 技术栈

1. **引擎**：Cocos Creator 3.x
2. **语言**：TypeScript
3. **UI框架**：Cocos UI系统
4. **动画系统**：Cocos Animation
5. **资源管理**：Cocos Asset Bundle

## 性能考虑

1. **对象池**：
   - 卡牌对象重用
   - UI元素复用

2. **事件优化**：
   - 减少不必要的事件触发
   - 使用事件委托模式

3. **渲染优化**：
   - 合理使用图集
   - 控制同屏元素数量

4. **内存管理**：
   - 及时释放不需要的资源
   - 避免循环引用
