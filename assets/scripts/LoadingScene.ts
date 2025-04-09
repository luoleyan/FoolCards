import { _decorator, Component, Sprite, ProgressBar, Label, resources, director, SpriteFrame, Color, AssetManager } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LoadingScene')
export class LoadingScene extends Component {
    @property(Sprite)
    private background: Sprite = null;

    @property(ProgressBar)
    private progressBar: ProgressBar = null;

    @property(Label)
    private progressLabel: Label = null;

    private currentProgress = 0;
    private targetProgress = 0;
    private progressSpeed = 1.0; // 加快进度条动画速度
    private resourceUrls: string[] = [];
    private isPreloading = false;

    start() {
        // 初始化进度条和标签
        if (this.progressBar) {
            this.progressBar.progress = 0;

            // 确保进度条填充部分颜色正确
            const barSprite = this.progressBar.barSprite;
            if (barSprite) {
                barSprite.color = new Color(0, 113, 188, 255);
            }
        }

        if (this.progressLabel) {
            this.progressLabel.string = '0%';
        }

        // 设置加载背景
        this.setupBackground();

        // 初始化资源列表
        this.initResourcesList();

        // 延迟一帧开始加载，确保UI先显示出来
        this.scheduleOnce(() => {
            this.startPreloading();
        }, 0.1);
    }

    update(deltaTime: number) {
        // 平滑更新进度条
        if (this.currentProgress < this.targetProgress) {
            // 更加平滑的进度更新
            this.currentProgress = Math.min(
                this.currentProgress + deltaTime * this.progressSpeed,
                this.targetProgress
            );

            this.updateProgressUI();
        }
    }

    private updateProgressUI() {
        // 更新进度条显示
        if (this.progressBar) {
            this.progressBar.progress = this.currentProgress;
        }

        // 更新进度文本
        if (this.progressLabel) {
            const percentage = Math.floor(this.currentProgress * 100);
            this.progressLabel.string = `${percentage}%`;
        }
    }

    private setupBackground() {
        resources.load('background/loading_background/spriteFrame', SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error('Failed to load background sprite:', err);
                return;
            }
            if (this.background) {
                this.background.spriteFrame = spriteFrame;
            }
        });
    }

    private initResourcesList() {
        // 需要预加载的资源列表
        this.resourceUrls = [
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
            'cards/JOKER-B/spriteFrame',

            // 游戏场景资源
            'background/game_background/spriteFrame',
            'ui-assets/Buttons/BTN_BLUE_RECT_IN/spriteFrame',
            'ui-assets/Buttons/BTN_RED_RECT_IN/spriteFrame',
            'ui-assets/Gen UI/UI_COLORBAR (4)/spriteFrame'
        ];
    }

    private startPreloading() {
        if (this.isPreloading) return;
        this.isPreloading = true;

        const totalResources = this.resourceUrls.length;
        let loadedCount = 0;

        // 逐个加载资源以便可以更新进度
        const loadNextResource = (index: number) => {
            if (index >= totalResources) {
                // 所有资源加载完成
                this.targetProgress = 1.0;

                // 当进度条接近完成时，跳转到游戏场景
                this.scheduleOnce(() => {
                    director.loadScene('Game');
                }, 1.0);
                return;
            }

            const url = this.resourceUrls[index];
            resources.load(url, SpriteFrame, (err) => {
                loadedCount++;

                if (err) {
                    console.error(`Failed to load resource: ${url}`, err);
                } else {
                    // 更新目标进度，确保平滑过渡
                    this.targetProgress = loadedCount / totalResources;

                    // 每加载5个资源，输出一次日志
                    if (loadedCount % 5 === 0 || loadedCount === totalResources) {
                        console.log(`Loaded ${loadedCount}/${totalResources} resources`);
                    }
                }

                // 加载下一个资源
                loadNextResource(index + 1);
            });
        };

        // 开始加载第一个资源
        loadNextResource(0);
    }
} 