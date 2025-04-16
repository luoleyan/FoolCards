import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform, Vec3, EventTouch, input, Input, director, resources, Camera, Rect } from 'cc';
import { GameManager } from './GameManager';
import { SceneEffect } from './SceneEffect';
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
    private _originalIndex: number;

    // 静态变量，存储预加载的卡牌背面图像
    private static cardBackSprite: SpriteFrame = null;

    // 预加载卡牌背面图像
    public static preloadCardBack() {
        if (!Card.cardBackSprite) {
            console.log('Starting to preload card back sprite');
            resources.load('cards/Background/spriteFrame', SpriteFrame, (err, spriteFrame) => {
                if (err) {
                    console.error('Failed to preload card back sprite:', err);
                    return;
                }
                console.log('Card back sprite preloaded successfully');
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
        // 在组件启动时就预加载背面图片
        Card.preloadCardBack();
        
        // 添加触摸事件监听
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);

        console.log('Card touch events registered');
    }

    onDestroy() {
        // 移除触摸事件监听
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
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
        // 检查 cardSprite 是否存在
        if (!this.cardSprite) {
            console.error('Card sprite component is missing!');
            return;
        }

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
                // 再次检查 cardSprite 是否存在
                if (this.cardSprite) {
                    this.cardSprite.spriteFrame = spriteFrame;
                } else {
                    console.error('Card sprite component is missing after loading sprite frame!');
                }
            });
        } else {
            // 显示背面
            if (!this.cardSprite) {
                console.error('Card sprite component is missing when showing back!');
                return;
            }
            
            if (Card.cardBackSprite) {
                this.cardSprite.spriteFrame = Card.cardBackSprite;
            } else if (this.cardBack) {
                this.cardSprite.spriteFrame = this.cardBack;
            } else {
                console.error('No card back sprite available!');
            }
        }
    }

    // 显示卡牌正面
    public showCardFace() {
        // 检查组件是否存在
        if (!this.cardSprite) {
            console.error('Cannot show card face: sprite component is missing!');
            return;
        }
        this._isFaceUp = true;
        this.updateCardSprite();
    }

    // 显示卡牌背面
    public showCardBack() {
        // 检查组件是否存在
        if (!this.cardSprite) {
            console.error('Cannot show card back: sprite component is missing!');
            return;
        }
        this._isFaceUp = false;
        this.updateCardSprite();
    }

    // 同步显示卡牌背面
    public showCardBackSync() {
        // 检查组件是否存在
        if (!this.cardSprite) {
            console.error('Cannot show card back sync: sprite component is missing!');
            return;
        }
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
                return;
            }
            if (this.cardSprite) {
                this.cardSprite.spriteFrame = spriteFrame;
                Card.cardBackSprite = spriteFrame; // 保存以供后续使用
            }
        });
    }

    // 触摸开始事件
    private onTouchStart(event: EventTouch) {
        console.log('Touch start event triggered');
        
        // 获取父节点名称
        const parentName = this.node.parent ? this.node.parent.name : '';
        console.log('Parent node name:', parentName);
        
        // 如果是对手的卡牌，只显示背面
        if (parentName === 'OpponentHand') {
            this.showCardBackSync();
            return;
        }
        
        // 如果是玩家手牌，允许拖动
        if (parentName === 'PlayerHand') {
            console.log('Starting drag on player card');
            this._isDragging = true;
            this._originalPosition = this.node.position.clone();
            this._originalIndex = this.node.getSiblingIndex();

            // 计算拖拽偏移量
            const touchPos = event.getLocation();
            const camera = director.getScene().getComponentInChildren(Camera);
            
            if (camera) {
                // 将触摸位置转换为世界坐标
                const worldPos = camera.screenToWorld(new Vec3(touchPos.x, touchPos.y, 0));
                // 将世界坐标转换为节点本地坐标
                const localPos = this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
                
                // 计算偏移量（节点位置减去触摸位置）
                this._dragOffset = new Vec3(
                    this.node.position.x - localPos.x,
                    this.node.position.y - localPos.y,
                    0
                );
            } else {
                // 如果没有找到相机，使用简单的位置计算
                this._dragOffset = new Vec3(
                    this.node.position.x - touchPos.x,
                    this.node.position.y - touchPos.y,
                    0
                );
            }
        }
    }

    // 触摸移动事件
    private onTouchMove(event: EventTouch) {
        if (!this._isDragging) {
            return;
        }

        console.log('Touch move event triggered');
        const touchPos = event.getLocation();
        
        // 将触摸位置转换为节点本地坐标
        const camera = director.getScene().getComponentInChildren(Camera);
        if (camera) {
            const worldPos = camera.screenToWorld(new Vec3(touchPos.x, touchPos.y, 0));
            const localPos = this.node.parent.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
            
            // 应用拖拽偏移量
            this.node.setPosition(
                localPos.x + this._dragOffset.x,
                localPos.y + this._dragOffset.y,
                0
            );
        } else {
            // 如果没有找到相机，使用简单的位置计算
            this.node.setPosition(
                touchPos.x + this._dragOffset.x,
                touchPos.y + this._dragOffset.y,
                0
            );
        }
    }

    // 触摸结束事件
    private onTouchEnd(event: EventTouch) {
        console.log('Touch ended');
        
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
        
        // 检查是否与任何场地区域重叠
        const playAreas = gameManager.playAreas;
        console.log(`Found ${playAreas.length} play areas`);
        
        for (let i = 0; i < playAreas.length; i++) {
            const playArea = playAreas[i];
            if (!playArea) {
                console.log(`Play area ${i} is null`);
                continue;
            }
            
            // 获取场地区域的UITransform组件
            const areaTransform = playArea.getComponent(UITransform);
            if (!areaTransform) {
                console.log(`Play area ${i} has no UITransform component`);
                continue;
            }
            
            // 获取卡牌的UITransform组件
            const cardTransform = this.node.getComponent(UITransform);
            if (!cardTransform) {
                console.log('Card has no UITransform component');
                continue;
            }
            
            // 计算重叠
            const cardRect = cardTransform.getBoundingBoxToWorld();
            const areaRect = areaTransform.getBoundingBoxToWorld();
            
            console.log(`Checking overlap with play area ${i}:`);
            console.log(`Card rect: ${JSON.stringify(cardRect)}`);
            console.log(`Area rect: ${JSON.stringify(areaRect)}`);
            
            if (this.isOverlapping(cardRect, areaRect)) {
                console.log(`Card overlaps with play area ${i}`);
                
                // 检查场地区域是否已经翻开
                if (gameManager.isPlayAreaRevealed(i)) {
                    console.log(`Play area ${i} is revealed, playing card`);
                    this.playCardToArea(playArea, i, gameManager);
                    return;
                } else {
                    console.log(`Play area ${i} is not revealed yet`);
                    // 检查是否允许放置到未翻开区域
                    if (gameManager.canPlayToUnrevealedArea()) {
                        console.log(`Playing card to unrevealed area ${i}`);
                        // 先标记区域为已翻开
                        gameManager.markPlayAreaRevealed(i);
                        // 然后放置卡牌
                        this.playCardToArea(playArea, i, gameManager);
                        return;
                    }
                }
            }
        }
        
        // 如果没有与任何场地区域重叠，返回原位
        console.log('No overlap with any play area, returning to original position');
        this.node.setPosition(this._originalPosition);
        this.node.setSiblingIndex(this._originalIndex);
        this.showCardFace();
    }

    // 将卡牌放置到场地区域
    private playCardToArea(playArea: Node, areaIndex: number, gameManager: GameManager) {
        console.log('Starting playCardToArea');
        
        // 从玩家手牌中移除卡牌
        if (this.node.parent && this.node.parent.name === 'PlayerHand') {
            console.log('Removing card from player hand');
            this.node.removeFromParent();
        } else {
            console.error('Card is not in player hand');
            return;
        }
        
        // 获取场地区域的尺寸
        const areaTransform = playArea.getComponent(UITransform);
        if (!areaTransform) {
            console.error('Play area has no UITransform component');
            return;
        }

        // 计算卡牌在场地区域下方的位置
        const cardHeight = 180;  // 卡牌原始高度
        const bottomY = -(areaTransform.height / 2) - (cardHeight * 0.35);  // 增加向下的偏移量

        // 将卡牌添加到场地区域并设置位置
        console.log('Adding card to play area');
        playArea.addChild(this.node);
        this.node.setPosition(new Vec3(0, bottomY, 0));  // 放在场地正下方中心位置
        
        // 设置卡牌大小和缩放
        this.node.setScale(0.5, 0.5, 1);  // 缩小卡牌尺寸
        const cardTransform = this.node.getComponent(UITransform);
        if (cardTransform) {
            cardTransform.setContentSize(120, 180);  // 设置原始大小
        }
        
        // 确保卡牌显示正面
        console.log('Showing card face');
        this.showCardFace();
        
        // 获取场地区域中的所有卡牌
        console.log('Getting all cards in play area');
        const cards: Card[] = [];
        playArea.children.forEach(child => {
            const card = child.getComponent(Card);
            if (card) {
                cards.push(card);
            }
        });
        
        console.log(`Found ${cards.length} cards in play area`);
        
        // 计算并更新场地区域的分数
        console.log('Calculating area score');
        gameManager.calculateAreaScore(areaIndex, cards);
        
        // 重新排列玩家手牌
        console.log('Arranging player hand');
        gameManager.arrangePlayerHand();
        
        console.log('playCardToArea completed');
    }

    // 重新排列场地区域中的卡牌
    private arrangeCardsInPlayArea(playArea: Node) {
        const cards = playArea.children;
        const cardWidth = 120;  // 卡牌原始宽度
        const spacing = 20;     // 卡牌间距
        const totalWidth = (cards.length - 1) * (cardWidth + spacing);
        const startX = -totalWidth / 2;

        // 获取场地区域的尺寸
        const areaTransform = playArea.getComponent(UITransform);
        if (!areaTransform) {
            console.error('Play area has no UITransform component');
            return;
        }

        // 计算场地区域外部的底部位置
        const cardHeight = 180;  // 卡牌原始高度
        // 将卡牌放在场地区域下方 20 像素的位置
        const bottomY = -(areaTransform.height / 2) - cardHeight - 20;

        cards.forEach((cardNode, index) => {
            // 设置卡牌位置（x轴居中，y轴在场地区域下方）
            const x = startX + index * (cardWidth + spacing);
            cardNode.setPosition(new Vec3(x, bottomY, 0));
            
            // 确保卡牌大小和缩放正确
            cardNode.setScale(0.5, 0.5, 1);  // 缩小卡牌尺寸
            const cardTransform = cardNode.getComponent(UITransform);
            if (cardTransform) {
                cardTransform.setContentSize(120, 180);
            }
        });
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

    private isOverlapping(rect1: Rect, rect2: Rect): boolean {
        return !(rect1.x + rect1.width < rect2.x ||
                rect2.x + rect2.width < rect1.x ||
                rect1.y + rect1.height < rect2.y ||
                rect2.y + rect2.height < rect1.y);
    }
} 