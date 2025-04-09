import { _decorator, Component, director, resources, SpriteFrame, Sprite, Label, ProgressBar } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameLauncher')
export class GameLauncher extends Component {
    @property(Sprite)
    private loadingBackground: Sprite = null;

    @property(ProgressBar)
    private progressBar: ProgressBar = null;

    @property(Label)
    private progressLabel: Label = null;

    private totalResources = 0;
    private loadedResources = 0;

    start() {
        this.initLoadingScreen();
        this.preloadResources();
    }

    private initLoadingScreen() {
        // 设置加载背景
        resources.load('menu/main_menu/spriteFrame', SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error('Failed to load background sprite:', err);
                return;
            }
            if (this.loadingBackground) {
                this.loadingBackground.spriteFrame = spriteFrame;
            }
        });

        // 初始化进度条
        if (this.progressBar) {
            this.progressBar.progress = 0;
        }
        if (this.progressLabel) {
            this.progressLabel.string = '0%';
        }
    }

    private preloadResources() {
        // 需要预加载的资源列表
        const resourcesToLoad = [
            // 菜单资源
            'menu/main_menu/spriteFrame',
            'ui-assets/Buttons/BTN_BLUE_RECT_IN/spriteFrame',

            // 卡牌资源
            'cards/SpadeA/spriteFrame',
            'cards/Spade2/spriteFrame',
            'cards/Spade3/spriteFrame',
            'cards/Spade4/spriteFrame',
            'cards/Spade5/spriteFrame',
            'cards/Spade6/spriteFrame',
            'cards/Spade7/spriteFrame',
            'cards/Spade8/spriteFrame',
            'cards/Spade9/spriteFrame',
            'cards/Spade10/spriteFrame',
            'cards/SpadeJ/spriteFrame',
            'cards/SpadeQ/spriteFrame',
            'cards/SpadeK/spriteFrame',

            'cards/HeartA/spriteFrame',
            'cards/Heart2/spriteFrame',
            'cards/Heart3/spriteFrame',
            'cards/Heart4/spriteFrame',
            'cards/Heart5/spriteFrame',
            'cards/Heart6/spriteFrame',
            'cards/Heart7/spriteFrame',
            'cards/Heart8/spriteFrame',
            'cards/Heart9/spriteFrame',
            'cards/Heart10/spriteFrame',
            'cards/HeartJ/spriteFrame',
            'cards/HeartQ/spriteFrame',
            'cards/HeartK/spriteFrame',

            'cards/ClubA/spriteFrame',
            'cards/Club2/spriteFrame',
            'cards/Club3/spriteFrame',
            'cards/Club4/spriteFrame',
            'cards/Club5/spriteFrame',
            'cards/Club6/spriteFrame',
            'cards/Club7/spriteFrame',
            'cards/Club8/spriteFrame',
            'cards/Club9/spriteFrame',
            'cards/Club10/spriteFrame',
            'cards/ClubJ/spriteFrame',
            'cards/ClubQ/spriteFrame',
            'cards/ClubK/spriteFrame',

            'cards/DiamondA/spriteFrame',
            'cards/Diamond2/spriteFrame',
            'cards/Diamond3/spriteFrame',
            'cards/Diamond4/spriteFrame',
            'cards/Diamond5/spriteFrame',
            'cards/Diamond6/spriteFrame',
            'cards/Diamond7/spriteFrame',
            'cards/Diamond8/spriteFrame',
            'cards/Diamond9/spriteFrame',
            'cards/Diamond10/spriteFrame',
            'cards/DiamondJ/spriteFrame',
            'cards/DiamondQ/spriteFrame',
            'cards/DiamondK/spriteFrame',

            'cards/JOKER-A/spriteFrame',
            'cards/JOKER-B/spriteFrame'
        ];

        this.totalResources = resourcesToLoad.length;
        this.loadedResources = 0;

        // 开始预加载资源
        resourcesToLoad.forEach(resourcePath => {
            resources.load(resourcePath, SpriteFrame, (err) => {
                if (err) {
                    console.error(`Failed to load resource: ${resourcePath}`, err);
                }
                this.onResourceLoaded();
            });
        });
    }

    private onResourceLoaded() {
        this.loadedResources++;
        const progress = this.loadedResources / this.totalResources;

        // 更新进度条
        if (this.progressBar) {
            this.progressBar.progress = progress;
        }

        // 更新进度文本
        if (this.progressLabel) {
            this.progressLabel.string = `${Math.floor(progress * 100)}%`;
        }

        // 所有资源加载完成后切换到主菜单
        if (this.loadedResources >= this.totalResources) {
            setTimeout(() => {
                director.loadScene('MainMenu');
            }, 500); // 延迟500ms切换场景，让玩家看到加载完成
        }
    }
} 