import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform, Vec3, EventTouch, input, Input, director, resources } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

// 定义花色枚举
export enum CardSuit {
    Spade = 'Spade',
    Heart = 'Heart',
    Club = 'Club',
    Diamond = 'Diamond',
    Joker = 'Joker'
}

// 定义点数枚举
export enum CardRank {
    Ace = 'A',
    Two = '2',
    Three = '3',
    Four = '4',
    Five = '5',
    Six = '6',
    Seven = '7',
    Eight = '8',
    Nine = '9',
    Ten = '10',
    Jack = 'J',
    Queen = 'Q',
    King = 'K',
    JokerA = 'A',
    JokerB = 'B'
}

@ccclass('Card')
export class Card extends Component {
    @property(Sprite)
    public cardSprite: Sprite = null;

    @property(SpriteFrame)
    public cardBack: SpriteFrame = null;

    private _suit: CardSuit;
    private _rank: CardRank;
    private _isFaceUp: boolean = false;
    private _originalPosition: Vec3 = new Vec3();
    private _isDragging: boolean = false;
    private _dragOffset: Vec3 = new Vec3();

    // 静态变量，存储预加载的卡牌背面图像
    private static cardBackSprite: SpriteFrame = null;

    // 预加载卡牌背面图像
    public static preloadCardBack() {
        if (!Card.cardBackSprite) {
            console.log('Starting to preload card back sprite');
            resources.load('cards/Background/spriteFrame', SpriteFrame, (err, spriteFrame) => {
                if (err) {
                    console.error('Failed to preload card back sprite from primary path:', err);
                    // 尝试备用路径
                    resources.load('cards/cardBack/spriteFrame', SpriteFrame, (err2, spriteFrame2) => {
                        if (err2) {
                            console.error('Failed to preload card back sprite from backup path:', err2);
                            return;
                        }
                        console.log('Card back sprite preloaded successfully from backup path');
                        Card.cardBackSprite = spriteFrame2;
                    });
                    return;
                }
                console.log('Card back sprite preloaded successfully from primary path');
                Card.cardBackSprite = spriteFrame;
            });
        } else {
            console.log('Card back sprite already preloaded');
        }
    }

    public get suit(): CardSuit {
        return this._suit;
    }

    public get rank(): CardRank {
        return this._rank;
    }

    public get isFaceUp(): boolean {
        return this._isFaceUp;
    }

    start() {
        // 添加触摸事件监听
        this.node.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    onDestroy() {
        // 移除触摸事件监听
        this.node.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    // 初始化卡牌
    public init(suit: CardSuit, rank: CardRank) {
        console.log(`Initializing card: ${suit} ${rank}`);
        if (!suit || !rank) {
            console.error(`Invalid card parameters: suit=${suit}, rank=${rank}`);
            return;
        }

        this._suit = suit;
        this._rank = rank;

        // 检查卡牌精灵是否存在
        if (!this.cardSprite) {
            console.error(`Card sprite is null for ${suit} ${rank}`);
            // 尝试获取或创建Sprite组件
            this.cardSprite = this.getComponent(Sprite);
            if (!this.cardSprite) {
                console.log("Adding Sprite component to Card");
                this.cardSprite = this.addComponent(Sprite);
            }
        }

        // 确保预加载背面图片
        if (!Card.cardBackSprite) {
            Card.preloadCardBack();
        }

        this.updateCardSprite();
    }

    // 更新卡牌图片
    private updateCardSprite() {
        if (this._isFaceUp) {
            // 加载正面图片
            let path = '';
            if (this._suit === CardSuit.Joker) {
                path = `cards/JOKER-${this._rank === CardRank.JokerA ? 'A' : 'B'}/spriteFrame`;
            } else {
                path = `cards/${this._suit}${this._rank}/spriteFrame`;
            }
            resources.load(path, SpriteFrame, (err, spriteFrame) => {
                if (err) {
                    console.error('Failed to load card sprite:', err);
                    return;
                }
                this.cardSprite.spriteFrame = spriteFrame;
            });
        } else {
            // 显示背面
            if (Card.cardBackSprite) {
                this.cardSprite.spriteFrame = Card.cardBackSprite;
            } else {
                this.cardSprite.spriteFrame = this.cardBack;
            }
        }
    }

    // 显示卡牌正面
    public showCardFace() {
        this._isFaceUp = true;
        this.updateCardSprite();
    }

    // 显示卡牌背面
    public showCardBack() {
        this._isFaceUp = false;
        this.updateCardSprite();
    }

    // 同步显示卡牌背面
    public showCardBackSync() {
        console.log('Attempting to show card back');
        this._isFaceUp = false;
        
        // 确保卡牌节点已设置正确的缩放
        if (this.node) {
            // 设置卡牌缩放为0.25，与玩家卡牌一致
            this.node.setScale(0.25, 0.25, 1);
            
            // 确保UITransform组件设置正确
            const uiTransform = this.node.getComponent(UITransform);
            if (uiTransform) {
                // 设置内容尺寸为120x180，与玩家卡牌一致
                uiTransform.setContentSize(120, 180);
            }
        }
        
        // 首先尝试使用预加载的卡牌背面
        if (Card.cardBackSprite) {
            console.log('Using preloaded card back sprite');
            this.cardSprite.spriteFrame = Card.cardBackSprite;
            return;
        }
        
        // 如果预加载的不可用，尝试使用属性中的卡牌背面
        if (this.cardBack) {
            console.log('Using card back from property');
            this.cardSprite.spriteFrame = this.cardBack;
            return;
        }
        
        // 如果都不可用，尝试立即加载
        console.log('Attempting to load card back sprite');
        resources.load('cards/Background/spriteFrame', SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error('Failed to load card back sprite:', err);
                // 尝试备用路径
                resources.load('cards/cardBack/spriteFrame', SpriteFrame, (err2, spriteFrame2) => {
                    if (err2) {
                        console.error('Failed to load card back sprite from backup path:', err2);
                        return;
                    }
                    console.log('Successfully loaded card back from backup path');
                    this.cardSprite.spriteFrame = spriteFrame2;
                });
                return;
            }
            console.log('Successfully loaded card back sprite');
            this.cardSprite.spriteFrame = spriteFrame;
        });
    }

    // 触摸开始事件
    private onTouchStart(event: EventTouch) {
        // 只允许玩家手牌被拖动
        if (this.node.parent.name !== 'PlayerHand') {
            return;
        }

        this._isDragging = true;
        this._originalPosition = this.node.position.clone();

        // 计算拖拽偏移量
        const touchPos = event.getLocation();
        const nodePos = this.node.getPosition();
        this._dragOffset = new Vec3(
            nodePos.x - touchPos.x,
            nodePos.y - touchPos.y,
            0
        );

        // 将卡牌提升到最上层
        this.node.setSiblingIndex(this.node.parent.children.length - 1);
    }

    // 触摸移动事件
    private onTouchMove(event: EventTouch) {
        if (!this._isDragging) {
            return;
        }

        const touchPos = event.getLocation();
        this.node.setPosition(
            touchPos.x + this._dragOffset.x,
            touchPos.y + this._dragOffset.y,
            0
        );
    }

    // 触摸结束事件
    private onTouchEnd(event: EventTouch) {
        if (!this._isDragging) {
            return;
        }

        this._isDragging = false;

        // 获取游戏管理器
        const gameManager = director.getScene().getComponentInChildren(GameManager);
        if (!gameManager) {
            console.error('GameManager not found');
            return;
        }

        // 检查是否拖入换牌区域
        const touchPos = event.getLocation();
        const exchangeArea = gameManager['exchangeArea'];
        if (exchangeArea) {
            const exchangeTransform = exchangeArea.getComponent(UITransform);
            const worldPos = exchangeArea.getWorldPosition();
            const localPos = new Vec3(
                touchPos.x - worldPos.x,
                touchPos.y - worldPos.y,
                0
            );

            if (Math.abs(localPos.x) <= exchangeTransform.contentSize.width / 2 &&
                Math.abs(localPos.y) <= exchangeTransform.contentSize.height / 2) {
                // 触发换牌
                gameManager.exchangeCard(this);
                return;
            }
        }

        // 如果没有拖入换牌区域，返回原位
        this.node.setPosition(this._originalPosition);
    }

    // 触摸取消事件
    private onTouchCancel(event: EventTouch) {
        if (!this._isDragging) {
            return;
        }

        this._isDragging = false;
        this.node.setPosition(this._originalPosition);
    }

    // 获取卡牌完整名称
    public getFullName(): string {
        if (this._suit === CardSuit.Joker) {
            return `${this._suit}-${this._rank}`;
        }
        return `${this._suit}${this._rank}`;
    }

    public getSuit(): CardSuit {
        return this.suit;
    }

    public getRank(): CardRank {
        return this.rank;
    }
} 