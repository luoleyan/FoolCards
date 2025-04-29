# FoolCards UI组件层次结构

## 游戏场景UI组件层次

```
Canvas (根节点)
│
├── Camera
│
├── Background (背景)
│
├── UILayer (UI层)
│   │
│   ├── TopBar (顶部栏)
│   │   ├── RoundInfo (回合信息)
│   │   │   ├── RoundLabel (回合标签)
│   │   │   ├── RoundCounter (回合计数器)
│   │   │   └── RoundProgress (回合进度)
│   │   │
│   │   └── ScoreInfo (分数信息)
│   │       ├── PlayerScoreLabel (玩家分数标签)
│   │       └── OpponentScoreLabel (对手分数标签)
│   │
│   ├── GameArea (游戏区域)
│   │   │
│   │   ├── OpponentHandArea (对手手牌区域)
│   │   │   └── [OpponentCard] (对手卡牌)
│   │   │
│   │   ├── PlayAreasContainer (场地区域容器)
│   │   │   │
│   │   │   ├── PlayArea1 (场地区域1)
│   │   │   │   ├── AreaBackground (区域背景)
│   │   │   │   ├── EffectIcon (效果图标)
│   │   │   │   ├── CardSlots (卡牌槽)
│   │   │   │   │   ├── CardSlot1 (卡牌槽1)
│   │   │   │   │   ├── CardSlot2 (卡牌槽2)
│   │   │   │   │   └── CardSlot3 (卡牌槽3)
│   │   │   │   └── ScoreLabel (分数标签)
│   │   │   │
│   │   │   ├── PlayArea2 (场地区域2)
│   │   │   │   ├── AreaBackground (区域背景)
│   │   │   │   ├── EffectIcon (效果图标)
│   │   │   │   ├── CardSlots (卡牌槽)
│   │   │   │   │   ├── CardSlot1 (卡牌槽1)
│   │   │   │   │   ├── CardSlot2 (卡牌槽2)
│   │   │   │   │   └── CardSlot3 (卡牌槽3)
│   │   │   │   └── ScoreLabel (分数标签)
│   │   │   │
│   │   │   └── PlayArea3 (场地区域3)
│   │   │       ├── AreaBackground (区域背景)
│   │   │       ├── EffectIcon (效果图标)
│   │   │       ├── CardSlots (卡牌槽)
│   │   │       │   ├── CardSlot1 (卡牌槽1)
│   │   │       │   ├── CardSlot2 (卡牌槽2)
│   │   │       │   └── CardSlot3 (卡牌槽3)
│   │   │       └── ScoreLabel (分数标签)
│   │   │
│   │   └── PlayerHandArea (玩家手牌区域)
│   │       └── [PlayerCard] (玩家卡牌)
│   │
│   ├── ControlArea (控制区域)
│   │   │
│   │   ├── ExchangeArea (换牌区域)
│   │   │   ├── ExchangeButton (换牌按钮)
│   │   │   └── ExchangeCountLabel (换牌次数标签)
│   │   │
│   │   ├── TimerArea (计时器区域)
│   │   │   ├── TimerIcon (计时器图标)
│   │   │   └── TimerLabel (计时器标签)
│   │   │
│   │   └── EndTurnButton (结束回合按钮)
│   │
│   └── MenuArea (菜单区域)
│       ├── BackButton (返回按钮)
│       └── SpecialHandsButton (特殊牌型按钮)
│
└── PopupLayer (弹窗层)
    │
    ├── GameOverPopup (游戏结束弹窗)
    │   ├── PopupBackground (弹窗背景)
    │   ├── TitleLabel (标题标签)
    │   ├── ScoreContainer (分数容器)
    │   │   ├── PlayerFinalScore (玩家最终分数)
    │   │   └── OpponentFinalScore (对手最终分数)
    │   └── ButtonContainer (按钮容器)
    │       ├── ReturnButton (返回按钮)
    │       └── PlayAgainButton (再玩一次按钮)
    │
    └── SpecialHandsPopup (特殊牌型弹窗)
        ├── PopupBackground (弹窗背景)
        ├── TitleLabel (标题标签)
        ├── HandsContainer (牌型容器)
        │   ├── HandItem1 (牌型项1)
        │   ├── HandItem2 (牌型项2)
        │   └── ... (更多牌型项)
        └── CloseButton (关闭按钮)
```

## 主菜单场景UI组件层次

```
Canvas (根节点)
│
├── Camera
│
├── Background (背景)
│
└── UILayer (UI层)
    │
    ├── TitleArea (标题区域)
    │   └── GameTitle (游戏标题)
    │
    └── MenuArea (菜单区域)
        ├── StartButton (开始按钮)
        ├── SettingsButton (设置按钮)
        └── ExitButton (退出按钮)
```

## 加载场景UI组件层次

```
Canvas (根节点)
│
├── Camera
│
├── Background (背景)
│
└── UILayer (UI层)
    │
    ├── LoadingText (加载文本)
    │
    ├── ProgressBarContainer (进度条容器)
    │   ├── ProgressBarBackground (进度条背景)
    │   └── ProgressBarFill (进度条填充)
    │
    └── ProgressPercentage (进度百分比)
```

## 设置弹窗UI组件层次

```
SettingsPopup (设置弹窗)
│
├── PopupBackground (弹窗背景)
│
├── TitleLabel (标题标签)
│
├── SettingsContainer (设置容器)
│   │
│   ├── MusicVolumeControl (音乐音量控制)
│   │   ├── Label (标签)
│   │   └── Slider (滑块)
│   │
│   ├── SoundVolumeControl (音效音量控制)
│   │   ├── Label (标签)
│   │   └── Slider (滑块)
│   │
│   ├── FullscreenToggle (全屏切换)
│   │   ├── Label (标签)
│   │   └── Checkbox (复选框)
│   │
│   └── LanguageSelector (语言选择器)
│       ├── Label (标签)
│       └── Dropdown (下拉菜单)
│
└── ConfirmButton (确认按钮)
```

## 组件属性说明

### 通用属性

- **位置 (Position)**: 组件在父节点中的相对位置
- **大小 (Size)**: 组件的宽度和高度
- **锚点 (Anchor)**: 组件的定位锚点
- **缩放 (Scale)**: 组件的缩放比例
- **旋转 (Rotation)**: 组件的旋转角度
- **颜色 (Color)**: 组件的颜色
- **不透明度 (Opacity)**: 组件的不透明度

### 特定组件属性

#### 按钮 (Button)
- **正常状态 (Normal)**: 按钮的默认外观
- **按下状态 (Pressed)**: 按钮被按下时的外观
- **悬停状态 (Hover)**: 鼠标悬停在按钮上时的外观
- **禁用状态 (Disabled)**: 按钮被禁用时的外观
- **点击事件 (Click Event)**: 按钮被点击时触发的事件

#### 标签 (Label)
- **文本 (Text)**: 标签显示的文本内容
- **字体 (Font)**: 标签使用的字体
- **字体大小 (Font Size)**: 标签的字体大小
- **对齐方式 (Alignment)**: 文本的对齐方式
- **行高 (Line Height)**: 多行文本的行高

#### 进度条 (Progress Bar)
- **进度值 (Progress)**: 当前进度值 (0-1)
- **填充方向 (Fill Direction)**: 进度条的填充方向
- **背景图片 (Background Sprite)**: 进度条的背景图片
- **填充图片 (Fill Sprite)**: 进度条的填充图片

#### 滑块 (Slider)
- **最小值 (Min Value)**: 滑块的最小值
- **最大值 (Max Value)**: 滑块的最大值
- **当前值 (Current Value)**: 滑块的当前值
- **步长 (Step)**: 滑块的步长
- **值改变事件 (Value Changed Event)**: 滑块值改变时触发的事件

## 响应式布局策略

### 桌面端 (> 1024px)
- 所有元素完整显示
- 水平布局优先
- 使用固定大小和位置

### 平板端 (768px - 1024px)
- 保持基本布局不变
- 适当缩小元素大小
- 调整元素间距

### 移动端 (< 768px)
- 垂直布局优先
- 手牌区域可滚动
- 简化部分UI元素
- 增大交互元素的触摸区域
