# FoolCards 组件交互图

## 核心组件交互

```mermaid
flowchart TD
    GameLauncher["GameLauncher"] --> LoadingScene["LoadingScene"]
    LoadingScene --> MainMenu["MainMenu"]

    MainMenu --> GameManager["GameManager"]
    GameLauncher --> |初始化| PlatformAdapter["PlatformAdapter"]
    GameManager --> |平台适配| PlatformAdapter

    GameManager --> GameOverPopup["GameOverPopup"]

    GameManager --> Card["Card"]
    GameManager --> PlayArea1["PlayArea 1"]
    GameManager --> PlayArea2["PlayArea 2"]
    GameManager --> PlayArea3["PlayArea 3"]
    GameManager --> ExchangeArea["ExchangeArea"]

    Card --> SpecialHands["SpecialHands"]
    PlayArea1 --> SceneEffect["SceneEffect"]
    PlayArea2 --> SceneEffect
    PlayArea3 --> SceneEffect

    SpecialHands <--> SceneEffect

    %% 样式定义
    classDef launcher fill:#9f9,stroke:#393,stroke-width:2px;
    classDef manager fill:#f96,stroke:#933,stroke-width:2px;
    classDef scene fill:#ff9,stroke:#993,stroke-width:1px;
    classDef component fill:#9cf,stroke:#36c,stroke-width:1px;
    classDef popup fill:#f99,stroke:#933,stroke-width:1px;

    %% 应用样式
    class GameLauncher launcher;
    class GameManager manager;
    class LoadingScene,MainMenu scene;
    class Card,PlayArea1,PlayArea2,PlayArea3,ExchangeArea,SpecialHands,SceneEffect,PlatformAdapter component;
    class GameOverPopup popup;
```

## 数据流向

```mermaid
flowchart TD
    UserInput["用户输入/交互"] --> GameManagerProcess["GameManager处理"]
    GameManagerProcess --> UIUpdate["UI状态更新"]

    GameManagerProcess --> GameStateUpdate["游戏状态更新"]

    GameStateUpdate --> CardStateUpdate["卡牌状态更新"]
    CardStateUpdate --> EffectProcess["特殊效果处理"]
    EffectProcess --> ScoreCalculation["分数计算"]

    %% 样式定义
    classDef input fill:#bbf,stroke:#33f,stroke-width:2px;
    classDef process fill:#ff9,stroke:#993,stroke-width:1px;
    classDef output fill:#9cf,stroke:#36c,stroke-width:1px;

    %% 应用样式
    class UserInput input;
    class GameManagerProcess,GameStateUpdate,EffectProcess process;
    class UIUpdate,CardStateUpdate,ScoreCalculation output;
```

## 事件传递机制

```mermaid
flowchart TD
    SourceComponent["事件源组件"] -->|触发事件| EventSystem["事件系统"]

    EventSystem -->|分发事件| Listener1["监听者组件 1"]
    EventSystem -->|分发事件| Listener2["监听者组件 2"]
    EventSystem -->|分发事件| Listener3["监听者组件 3"]

    %% 样式定义
    classDef source fill:#f96,stroke:#933,stroke-width:2px;
    classDef system fill:#bbf,stroke:#33f,stroke-width:2px;
    classDef listener fill:#9cf,stroke:#36c,stroke-width:1px;

    %% 应用样式
    class SourceComponent source;
    class EventSystem system;
    class Listener1,Listener2,Listener3 listener;
```

## 主要事件类型

1. **游戏流程事件**：
   - 游戏开始
   - 回合开始/结束
   - 游戏结束

2. **卡牌事件**：
   - 卡牌选择
   - 卡牌打出
   - 卡牌效果触发

3. **场地事件**：
   - 场地选择
   - 场地效果触发
   - 场地分数更新

4. **特殊牌型事件**：
   - 特殊牌型检测
   - 特殊牌型效果触发

5. **UI事件**：
   - 按钮点击
   - 拖拽操作
   - 弹窗显示/隐藏

## 组件职责

1. **GameLauncher**：
   - 游戏初始化
   - 资源预加载
   - 场景切换管理

2. **GameManager**：
   - 游戏核心逻辑
   - 回合管理
   - 分数计算
   - 游戏状态控制
   - AI对手管理

3. **AIOpponent**：
   - AI出牌逻辑
   - 对手卡牌管理
   - AI卡牌显示
   - 卡牌排列管理

4. **Card**：
   - 卡牌数据
   - 卡牌视觉表现
   - 卡牌交互逻辑

5. **PlayArea**：
   - 场地状态管理
   - 卡牌放置逻辑
   - 场地效果触发

6. **SceneEffect**：
   - 场地特殊效果定义
   - 效果应用逻辑
   - 视觉效果展示

7. **SpecialHands**：
   - 特殊牌型检测
   - 特殊牌型效果应用
   - 特殊牌型视觉反馈

8. **GameOverPopup**：
   - 游戏结果展示
   - 结算界面交互
   - 重新开始/返回选项
