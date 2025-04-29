# FoolCards 项目结构图

```
FoolCards/
│
├── assets/                      # 游戏资源目录
│   ├── docs/                    # 文档目录
│   │
│   ├── prefabs/                 # 预制体目录
│   │   ├── Card.prefab          # 卡牌预制体
│   │   ├── GameOverPopup.prefab # 游戏结束弹窗预制体
│   │   └── SceneEffect.prefab   # 场景效果预制体
│   │
│   ├── resources/               # 资源目录
│   │   ├── background/          # 背景图片
│   │   ├── cards/               # 卡牌图片
│   │   ├── menu/                # 菜单资源
│   │   └── ui-assets/           # UI资源
│   │       ├── Buttons/         # 按钮资源
│   │       ├── Cursors/         # 光标资源
│   │       ├── Gen UI/          # 通用UI资源
│   │       └── Symbols & Text/  # 符号和文本资源
│   │
│   ├── scenes/                  # 场景目录
│   │   ├── Game.scene           # 游戏主场景
│   │   ├── Loading.scene        # 加载场景
│   │   └── MainMenu.scene       # 主菜单场景
│   │
│   └── scripts/                 # 脚本目录
│       ├── Card.ts              # 卡牌类
│       ├── GameLauncher.ts      # 游戏启动器
│       ├── GameManager.ts       # 游戏管理器
│       ├── GameOverPopup.ts     # 游戏结束弹窗
│       ├── LoadingScene.ts      # 加载场景脚本
│       ├── MainMenu.ts          # 主菜单脚本
│       ├── PlatformAdapter.ts   # 平台适配器
│       ├── SceneEffect.ts       # 场景效果
│       ├── SpecialHands.ts      # 特殊牌型
│       └── SpecialHandsPopup.ts # 特殊牌型弹窗
│
├── docs/                        # 项目文档目录
│   └── diagrams/                # 项目图表目录
│       ├── structure/           # 结构图
│       ├── er/                  # ER图
│       ├── flowcharts/          # 流程图
│       └── ui/                  # UI设计图
│
├── .gitignore                   # Git忽略文件
├── LICENSE                      # MIT许可证
├── README.md                    # 项目说明文件
└── project.json                 # 项目配置文件
```

## 项目结构说明

### 主要目录

1. **assets/**: 包含所有游戏资源
   - **docs/**: 项目文档
   - **prefabs/**: 游戏中使用的预制体
   - **resources/**: 游戏资源（图片、音频等）
   - **scenes/**: 游戏场景
   - **scripts/**: 游戏脚本

2. **docs/**: 项目文档和图表
   - **diagrams/**: 项目相关图表
     - **structure/**: 项目结构图
     - **er/**: 实体关系图
     - **flowcharts/**: 流程图
     - **ui/**: UI设计图

### 主要脚本文件

1. **Card.ts**: 卡牌类，定义卡牌的属性和行为
2. **GameManager.ts**: 游戏管理器，负责游戏逻辑和状态管理
3. **SceneEffect.ts**: 场景效果，定义不同场景的特殊效果
4. **SpecialHands.ts**: 特殊牌型，定义和检测特殊牌型组合
5. **GameOverPopup.ts**: 游戏结束弹窗，显示游戏结果

### 场景文件

1. **MainMenu.scene**: 主菜单场景
2. **Loading.scene**: 加载场景
3. **Game.scene**: 游戏主场景

### 预制体

1. **Card.prefab**: 卡牌预制体
2. **GameOverPopup.prefab**: 游戏结束弹窗预制体
3. **SceneEffect.prefab**: 场景效果预制体
