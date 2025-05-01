# FoolCards 游戏状态图

## 主要游戏状态

```mermaid
stateDiagram-v2
    [*] --> 初始状态
    初始状态 --> 加载状态: 游戏启动
    加载状态 --> 主菜单状态: 资源加载完成
    主菜单状态 --> 游戏准备: 点击"开始游戏"
    游戏准备 --> 游戏中: 初始化完成
    游戏中 --> 游戏结束: 达到5回合
    游戏结束 --> 结算状态: 显示结果
    结算状态 --> 游戏中: 选择"再来一局"
    结算状态 --> 主菜单状态: 选择"返回主菜单"

    state 游戏中 {
        [*] --> 回合开始
        回合开始 --> 玩家回合
        玩家回合 --> AI回合
        AI回合 --> 回合结束
        回合结束 --> 检查游戏结束
        检查游戏结束 --> [*]: 达到5回合
        检查游戏结束 --> 回合开始: 未达到5回合
    }
```

## 玩家回合状态详细流转

```mermaid
stateDiagram-v2
    [*] --> 玩家回合开始
    玩家回合开始 --> 等待玩家操作
    等待玩家操作 --> 选择卡牌
    选择卡牌 --> 选择场地
    选择场地 --> 确认选择
    确认选择 --> 打出卡牌
    打出卡牌 --> 检查特殊牌型
    检查特殊牌型 --> 应用场地效果
    应用场地效果 --> 计算临时分数
    计算临时分数 --> 是否继续
    是否继续 --> 交换卡牌: 选择继续
    是否继续 --> 玩家回合结束: 选择结束
    交换卡牌 --> 玩家回合结束
    玩家回合结束 --> [*]
```

## AI回合状态详细流转

```mermaid
stateDiagram-v2
    [*] --> AI回合开始
    AI回合开始 --> AI选择卡牌
    AI选择卡牌 --> AI选择场地
    AI选择场地 --> AI打出卡牌
    AI打出卡牌 --> 显示AI卡牌
    显示AI卡牌 --> 检查AI特殊牌型
    检查AI特殊牌型 --> 应用AI场地效果
    应用AI场地效果 --> 计算AI临时分数
    计算AI临时分数 --> AI回合结束
    AI回合结束 --> [*]
```

## 特殊牌型检测状态

```mermaid
stateDiagram-v2
    [*] --> 开始检测
    开始检测 --> 检测对子
    检测对子 --> 发现对子: 有对子
    检测对子 --> 检测顺子: 无对子
    检测顺子 --> 发现顺子: 有顺子
    检测顺子 --> 检测同花: 无顺子
    检测同花 --> 发现同花: 有同花
    检测同花 --> 检测葫芦: 无同花
    检测葫芦 --> 发现葫芦: 有葫芦
    检测葫芦 --> 无特殊牌型: 无葫芦

    发现对子 --> 应用牌型效果
    发现顺子 --> 应用牌型效果
    发现同花 --> 应用牌型效果
    发现葫芦 --> 应用牌型效果
    无特殊牌型 --> 检测结束
    应用牌型效果 --> 检测结束
    检测结束 --> [*]
```

## 游戏结束条件检测

```mermaid
stateDiagram-v2
    [*] --> 回合结束
    回合结束 --> 检查回合数
    检查回合数 --> 达到上限: 回合数 >= 5
    检查回合数 --> 未达到上限: 回合数 < 5
    达到上限 --> 游戏结束
    未达到上限 --> 开始新回合
    游戏结束 --> 显示结果
    开始新回合 --> [*]: 继续游戏
    显示结果 --> [*]: 结束游戏

    state 显示结果 {
        [*] --> 计算最终分数
        计算最终分数 --> 显示玩家分数
        显示玩家分数 --> 显示AI分数
        显示AI分数 --> 显示胜负结果
        显示胜负结果 --> 提供选项
        提供选项 --> [*]
    }
```

## 状态转换触发条件

```mermaid
flowchart TD
    subgraph 主游戏状态转换
        Initial["初始状态"] -->|游戏启动| Loading["加载状态"]
        Loading -->|资源加载完成| MainMenu["主菜单状态"]
        MainMenu -->|点击"开始游戏"| GamePrep["游戏准备"]
        GamePrep -->|初始化完成| GamePlaying["游戏中"]
        GamePlaying -->|达到5回合| GameOver["游戏结束"]
        GameOver -->|显示结果| Settlement["结算状态"]
        Settlement -->|选择"再来一局"| GamePrep
        Settlement -->|选择"返回主菜单"| MainMenu
    end

    subgraph 回合内状态转换
        RoundStart["回合开始"] -->|发牌完成| PlayerTurn["玩家回合"]
        PlayerTurn -->|玩家操作完成| AITurn["AI回合"]
        AITurn -->|AI操作完成| RoundEnd["回合结束"]
        RoundEnd -->|检查回合数| CheckRound["检查游戏结束"]
        CheckRound -->|未达到5回合| RoundStart
        CheckRound -->|达到5回合| EndGame["游戏结束"]
    end

    %% 样式定义
    classDef mainState fill:#bbf,stroke:#33f,stroke-width:2px;
    classDef roundState fill:#9cf,stroke:#36c,stroke-width:1px;
    classDef endState fill:#f99,stroke:#933,stroke-width:2px;

    %% 应用样式
    class Initial,Loading,MainMenu,GamePrep,GamePlaying,GameOver,Settlement mainState;
    class RoundStart,PlayerTurn,AITurn,RoundEnd,CheckRound roundState;
    class EndGame endState;
```

## 状态持久化

```mermaid
flowchart TD
    subgraph 持久化时机
        RoundEnd["回合结束"] -->|保存回合数据| SaveRoundData["保存当前回合分数\n更新总分数"]
        GameOver["游戏结束"] -->|保存游戏数据| SaveGameData["保存游戏结果\n更新历史记录"]
        SettingsChange["设置更改"] -->|保存设置| SaveSettings["保存用户设置"]
    end

    subgraph 持久化数据
        SaveRoundData --> RoundScores["回合分数数据"]
        SaveRoundData --> TotalScores["总分数数据"]
        SaveGameData --> GameResults["游戏结果数据"]
        SaveGameData --> HistoryRecords["历史记录数据"]
        SaveSettings --> UserSettings["用户设置数据"]
    end

    %% 样式定义
    classDef event fill:#bbf,stroke:#33f,stroke-width:2px;
    classDef action fill:#9cf,stroke:#36c,stroke-width:1px;
    classDef data fill:#9f9,stroke:#393,stroke-width:2px;

    %% 应用样式
    class RoundEnd,GameOver,SettingsChange event;
    class SaveRoundData,SaveGameData,SaveSettings action;
    class RoundScores,TotalScores,GameResults,HistoryRecords,UserSettings data;
```
