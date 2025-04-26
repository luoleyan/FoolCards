import { _decorator, Component, Node, director, instantiate, Prefab, resources, SpriteFrame, Sprite, UITransform, Vec3, Camera, Label, Button, Layout, Color } from 'cc';
import { Card, CardSuit, CardRank } from './Card';
import { tween } from 'cc';
import { SpecialHandsManager, SpecialHand, SpecialHandType } from './SpecialHands';
import { SceneEffect, SceneEffectType } from './SceneEffect';
import { PlatformAdapter } from './PlatformAdapter';
import { SpecialHandsPopup } from './SpecialHandsPopup';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Node)
    private playerHand: Node = null;  // 玩家手牌区域

    @property(Node)
    private opponentHand: Node = null;  // 对手手牌区域

    @property([Node])
    public playAreas: Node[] = [];  // 三个场地区域

    @property(Node)
    public exchangeArea: Node = null;  // 换牌区域

    @property(Sprite)
    private background: Sprite = null;  // 游戏背景

    @property(Prefab)
    private sceneEffectPrefab: Prefab = null;  // 场景效果预制体

    @property([SceneEffect])
    public sceneEffects: SceneEffect[] = [];

    @property([Label])
    private areaScoreLabels: Label[] = [];  // 每个场地的分数标签

    @property([Node])
    private scoreItemPrefabs: Node[] = [];  // 分数项的预制体节点

    @property(Label)
    private exchangeCountLabel: Label = null;  // 换牌次数标签

    @property(Button)
    private backButton: Button = null;  // 返回主界面按钮

    @property(Node)
    private specialHandsPopup: Node = null;

    @property(Button)
    private specialHandsButton: Button = null;

    @property(Button)
    private endTurnButton: Button = null;  // 结束回合按钮

    private deck: Card[] = [];  // 牌堆
    private _currentRound: number = 0;
    private maxRounds: number = 5;  // 最大回合数
    private maxExchangeCount: number = 12;  // 最大换牌次数
    private _revealedEffects: number = 0;

    private specialHandsManager: SpecialHandsManager;
    private playerScore: number = 0;
    private opponentScore: number = 0;
    private areaScores: number[] = [0, 0, 0];  // 每个场地的分数
    private areaScoreDetails: string[] = ['', '', ''];  // 每个场地的分数详情

    private sameColorRequirement: number = 5;  // 默认需要5张同色牌
    private sequenceRequirement: number = 5;   // 默认需要5张牌组成序列
    private skipSequenceEnabled: boolean = false;
    private hasSequenceBeenUsed: boolean = false;
    private hasSameColorBeenUsed: boolean = false;

    private extraPlayCount: number = 0;

    // 记录已翻开的场地区域
    private revealedAreas: boolean[] = [];

    // 每回合出牌次数限制
    private maxCardsPerTurn: number = 2;
    private cardsPlayedThisTurn: number = 0;

    // 回合计时相关
    private turnTimeLimit: number = 60;  // 每回合60秒
    private remainingTime: number = 60;  // 剩余时间
    private isTimerRunning: boolean = false;

    @property(Label)
    private timerLabel: Label = null;    // 显示倒计时的标签

    private currentTurnPlayedCards: Map<number, Card[]> = new Map(); // 记录每个场地区域当前回合打出的牌

    private _exchangeCount: number = 12;  // 换牌次数

    start() {
        // 初始化已翻开的场地区域数组
        this.revealedAreas = new Array(this.playAreas.length).fill(false);

        // 初始化特殊牌型管理器
        this.specialHandsManager = SpecialHandsManager.getInstance();

        // 设置游戏背景
        this.setupBackground();

        // 检查必要的节点
        if (!this.playerHand || !this.opponentHand || this.playAreas.length !== 3 || !this.exchangeArea) {
            console.error("Some required nodes are not set. Please check all required nodes in the inspector.");
            return;
        }

        // 确保手牌区域可见
        this.playerHand.active = true;
        this.opponentHand.active = true;

        // 设置返回按钮点击事件
        if (this.backButton) {
            this.backButton.node.on(Button.EventType.CLICK, this.onBackButtonClicked, this);
        }

        // 设置特殊牌型说明按钮点击事件
        if (this.specialHandsButton) {
            this.specialHandsButton.node.on(Button.EventType.CLICK, this.showSpecialHandsPopup, this);
        }

        // 设置结束回合按钮点击事件
        if (this.endTurnButton) {
            this.endTurnButton.node.on(Button.EventType.CLICK, this.onEndTurnButtonClicked, this);
        }

        // 初始化出牌次数
        this.cardsPlayedThisTurn = 0;

        // 初始化计时器
        this.remainingTime = this.turnTimeLimit;
        this.updateTimerDisplay();
        this.startTurnTimer();

        // 延迟一帧初始化游戏，确保所有组件都已加载
        this.scheduleOnce(() => {
            // 设置场地区域位置
            this.setupPlayAreasPosition();

            // 设置换牌区域位置
            this.setupExchangeAreaPosition();

            // 设置UI元素位置（结束回合按钮和计时器）
            this.setupUIElementsPosition();

            // 初始化换牌次数显示
            this.updateExchangeCountLabel();

            // 初始化场景效果
            this.initSceneEffects();

            // 初始化游戏
            this.initGame();

            // 适配平台
            this.adaptToPlatform();
        }, 0);
    }

    // 设置游戏背景
    private setupBackground() {
        // 加载游戏背景图片
        resources.load('background/game_background/spriteFrame', SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error('Failed to load game background:', err);
                // 尝试加载其他可能的路径
                resources.load('game_background/spriteFrame', SpriteFrame, (err2, spriteFrame2) => {
                    if (err2) {
                        console.error('Also failed to load from alternate path:', err2);
                        return;
                    }
                    if (this.background) {
                        this.background.spriteFrame = spriteFrame2;
                    }
                });
                return;
            }
            if (this.background) {
                this.background.spriteFrame = spriteFrame;
            }
        });
    }

    private initGame() {
        // 重置换牌次数
        this._exchangeCount = this.maxExchangeCount;
        this.updateExchangeCountLabel();

        // 预加载卡牌背面图片
        Card.preloadCardBack();

        // 创建牌堆
        this.createDeck();
        // 洗牌
        this.shuffleDeck();
        // 发初始手牌
        this.dealInitialCards();
        // 设置当前回合为1
        this._currentRound = 1;

        // 揭示第一个场景效果
        this.revealNextSceneEffect();
    }

    // 创建牌堆
    private createDeck() {
        this.deck = [];

        console.log("Creating deck...");

        // 创建普通牌
        const suits = [CardSuit.Spade, CardSuit.Heart, CardSuit.Club, CardSuit.Diamond];
        const ranks = [
            CardRank.Ace, CardRank.Two, CardRank.Three, CardRank.Four, CardRank.Five,
            CardRank.Six, CardRank.Seven, CardRank.Eight, CardRank.Nine, CardRank.Ten,
            CardRank.Jack, CardRank.Queen, CardRank.King
        ];

        for (const suit of suits) {
            for (const rank of ranks) {
                // 直接创建节点而不使用预制体
                const cardNode = new Node('Card');
                // 设置卡牌节点的大小为原来的四分之一
                cardNode.setScale(0.25, 0.25, 1);
                // 添加UITransform组件并设置尺寸
                const uiTransform = cardNode.addComponent(UITransform);
                uiTransform.setContentSize(120, 180);

                // 添加Sprite组件
                const spriteComp = cardNode.addComponent(Sprite);
                // 添加Card组件
                const cardComp = cardNode.addComponent(Card);
                // 设置Card的Sprite引用
                cardComp.cardSprite = spriteComp;
                // 初始化卡牌
                cardComp.init(suit, rank);

                this.deck.push(cardComp);
            }
        }

        // 添加大小王
        const jokerANode = new Node('JokerA');
        jokerANode.setScale(0.25, 0.25, 1);
        const jokerATransform = jokerANode.addComponent(UITransform);
        jokerATransform.setContentSize(120, 180);
        const jokerASprite = jokerANode.addComponent(Sprite);
        const jokerACard = jokerANode.addComponent(Card);
        jokerACard.cardSprite = jokerASprite;
        jokerACard.init(CardSuit.Joker, CardRank.JokerA);
        this.deck.push(jokerACard);

        const jokerBNode = new Node('JokerB');
        jokerBNode.setScale(0.25, 0.25, 1);
        const jokerBTransform = jokerBNode.addComponent(UITransform);
        jokerBTransform.setContentSize(120, 180);
        const jokerBSprite = jokerBNode.addComponent(Sprite);
        const jokerBCard = jokerBNode.addComponent(Card);
        jokerBCard.cardSprite = jokerBSprite;
        jokerBCard.init(CardSuit.Joker, CardRank.JokerB);
        this.deck.push(jokerBCard);

        console.log(`Deck created with ${this.deck.length} cards`);
    }

    // 洗牌
    private shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
        console.log("Deck shuffled");
    }

    // 发初始手牌
    private dealInitialCards() {
        // 卡牌宽度（实际宽度乘以缩放比例）
        const cardWidth = 120 * 0.25;
        // 卡牌高度（实际高度乘以缩放比例）
        const cardHeight = 180 * 0.25;
        // 卡牌间距（设为卡牌宽度的230%，实现更松散的堆叠效果）
        const cardSpacing = cardWidth * 2.3;

        // 获取背景节点的实际显示尺寸
        if (!this.background || !this.background.node) {
            console.error("Background node not found");
            return;
        }

        const backgroundTransform = this.background.node.getComponent(UITransform);
        if (!backgroundTransform) {
            console.error("Background UITransform not found");
            return;
        }

        const backgroundSize = backgroundTransform.contentSize;
        console.log(`Background display size: ${backgroundSize.width} x ${backgroundSize.height}`);

        // 计算顶部和底部的位置，确保卡牌完全显示在背景内
        // 顶部位置：背景高度的一半减去卡牌高度（考虑缩放和卡牌的实际显示）
        const topY = backgroundSize.height / 2 - cardHeight * 2.5;
        // 底部位置：背景高度的一半的负值加上卡牌高度（考虑缩放和卡牌的实际显示）
        const bottomY = -backgroundSize.height / 2 + cardHeight * 2.5;

        console.log(`Card positions: topY: ${topY}, bottomY: ${bottomY}`);

        // 设置对手手牌区域位置（顶部居中）
        if (this.opponentHand) {
            // 设置对手手牌区域的位置
            this.opponentHand.setPosition(0, topY, 0);

            // 确保对手手牌区域可见
            this.opponentHand.active = true;

            // 设置对手手牌区域的大小
            const opponentHandTransform = this.opponentHand.getComponent(UITransform);
            if (opponentHandTransform) {
                // 设置足够的宽度来容纳所有卡牌
                const totalWidth = cardSpacing * 4 + cardWidth; // 5张牌的总宽度
                opponentHandTransform.setContentSize(totalWidth, cardHeight);
                console.log(`Opponent hand area size set to: ${totalWidth} x ${cardHeight}`);
            }

            // 设置对手手牌区域的缩放
            this.opponentHand.setScale(1, 1, 1);

            // 确保所有子节点可见
            this.opponentHand.children.forEach(child => {
                child.active = true;
                // 设置子节点的缩放
                child.setScale(0.25, 0.25, 1);
            });

            console.log(`Opponent hand area positioned at: (0, ${topY}, 0)`);
        } else {
            console.error("Opponent hand area is null");
        }

        // 设置玩家手牌区域位置（底部居中）
        if (this.playerHand) {
            this.playerHand.setPosition(0, bottomY, 0);
            // 确保玩家手牌区域可见
            this.playerHand.active = true;

            // 设置玩家手牌区域的大小
            const playerHandTransform = this.playerHand.getComponent(UITransform);
            if (playerHandTransform) {
                // 设置足够的宽度来容纳所有卡牌
                const totalWidth = cardSpacing * 4 + cardWidth; // 5张牌的总宽度
                playerHandTransform.setContentSize(totalWidth, cardHeight);
                console.log(`Player hand area size set to: ${totalWidth} x ${cardHeight}`);
            }

            // 设置玩家手牌区域的缩放
            this.playerHand.setScale(1, 1, 1);

            // 确保所有子节点可见
            this.playerHand.children.forEach(child => {
                child.active = true;
                // 设置子节点的缩放
                child.setScale(0.25, 0.25, 1);
            });
        }

        // 牌桌中心位置（假设为坐标原点）
        const deckPosition = new Vec3(0, 0, 0);

        // 动画发牌，交替给玩家和对手发牌
        this.dealCardsWithAnimation(5, cardSpacing, deckPosition, () => {
            // 发牌完成后执行理牌动画
            this.performShuffleAnimation(cardSpacing);
        });
    }

    // 带动画的发牌
    private dealCardsWithAnimation(cardCount: number, cardSpacing: number, deckPosition: Vec3, onComplete?: () => void) {
        let dealIndex = 0;
        let playerCardCount = 0;
        let opponentCardCount = 0;

        // 定时器，每隔一段时间发一张牌
        this.schedule(() => {
            // 交替给玩家和对手发牌
            const isPlayerTurn = dealIndex % 2 === 0;
            const card = this.deck.pop();

            if (card) {
                // 设置卡牌初始位置为牌堆位置
                card.node.setPosition(deckPosition);
                card.node.active = true;

                // 确保卡牌缩放为0.25，与玩家卡牌一致
                card.node.setScale(0.25, 0.25, 1);

                // 确保UITransform组件设置正确
                const uiTransform = card.node.getComponent(UITransform);
                if (uiTransform) {
                    // 设置内容尺寸为120x180，与玩家卡牌一致
                    uiTransform.setContentSize(120, 180);
                }

                if (isPlayerTurn) {
                    // 给玩家发牌，自下而上动画
                    this.animateCardToPlayer(card, playerCardCount, cardSpacing);
                    playerCardCount++;
                } else {
                    // 给对手发牌，自上而下动画，确保只显示背面
                    this.animateCardToOpponent(card, opponentCardCount);
                    opponentCardCount++;
                }
            }

            dealIndex++;

            // 检查是否是最后一张牌
            if (dealIndex >= cardCount * 2 && onComplete) {
                // 延迟一段时间后调用回调，等待最后一张牌的动画完成
                this.scheduleOnce(() => {
                    onComplete();
                }, 0.5);
            }
        }, 0.3, cardCount * 2 - 1); // 每0.3秒发一张牌，总共发 cardCount*2 张牌
    }

    // 给玩家发牌的动画（自下而上）
    private animateCardToPlayer(card: Card, index: number, cardSpacing: number) {
        // 设置卡牌父节点为玩家手牌区
        card.node.setParent(this.playerHand);

        // 计算相对于玩家手牌区域中心的偏移位置
        const totalWidth = (this.playerHand.children.length - 1) * cardSpacing;
        const startX = -totalWidth / 2 + index * cardSpacing;

        // 最终位置
        const finalPosition = new Vec3(startX, 0, 0);

        // 动画起始位置（在玩家区域下方）
        const startPosition = new Vec3(startX, -200, 0);
        card.node.setPosition(startPosition);

        // 创建并执行动画
        tween(card.node)
            .to(0.3, { position: finalPosition }, { easing: 'cubicOut' })
            .call(() => {
                // 确保显示卡牌正面
                card.showCardFace();

                // 添加触摸事件监听器，确保点击时也显示正面
                card.node.on(Node.EventType.TOUCH_START, () => {
                    card.showCardFace();
                });
            })
            .start();
    }

    // 给对手发牌的动画（自上而下）
    private animateCardToOpponent(card: Card, index: number) {
        console.log(`Animating card to opponent, index: ${index}`);

        // 设置父节点为对手手牌区域
        card.node.setParent(this.opponentHand);
        console.log('Card parent set to opponent hand');

        // 设置卡牌缩放为0.25，与玩家卡牌一致
        card.node.setScale(0.25, 0.25, 1);

        // 确保UITransform组件设置正确
        const uiTransform = card.node.getComponent(UITransform);
        if (uiTransform) {
            // 设置内容尺寸为120x180，与玩家卡牌一致
            uiTransform.setContentSize(120, 180);
        }

        // 计算最终位置
        const cardWidth = 120 * 0.25;
        const spacing = cardWidth * 2.3;
        const totalWidth = (this.opponentHand.children.length - 1) * spacing;
        const startX = -totalWidth / 2;
        const finalX = startX + index * spacing;

        console.log(`Card position calculated: startX=${startX}, finalX=${finalX}, totalWidth=${totalWidth}`);

        // 设置初始位置（从牌堆位置开始）
        const deckPosition = new Vec3(0, 0, 0);
        card.node.setPosition(deckPosition);

        // 确保卡牌节点可见
        card.node.active = true;
        console.log('Card node activated');

        // 确保对手手牌区域可见
        this.opponentHand.active = true;
        console.log('Opponent hand area activated');

        // 创建移动动画
        tween(card.node)
            .to(0.3, { position: new Vec3(finalX, 0, 0) }, {
                easing: 'cubicOut'
            })
            .call(() => {
                console.log('Card animation completed');
                // 确保卡牌可见
                card.node.active = true;

                // 确保显示卡牌背面
                card.showCardBackSync();

                // 添加触摸事件监听器，确保点击时也显示背面
                card.node.on(Node.EventType.TOUCH_START, () => {
                    card.showCardBackSync();
                });

                // 打印最终位置
                console.log(`Card final position: ${card.node.position.toString()}`);

                // 确保卡牌在正确的层级
                card.node.setSiblingIndex(index);
            })
            .start();
    }

    // 执行理牌动画
    private performShuffleAnimation(cardSpacing: number) {
        console.log("Starting shuffle animation");

        // 获取所有玩家和对手的卡牌
        const playerCards = this.playerHand.children.slice();
        const opponentCards = this.opponentHand.children.slice();

        // 存储原始位置
        const originalPositions = new Map<Node, Vec3>();
        [...playerCards, ...opponentCards].forEach(card => {
            originalPositions.set(card, card.position.clone());
        });

        // 动画持续时间
        const gatherDuration = 0.5;  // 收拢时间
        const spreadDuration = 0.8;  // 展开时间
        const delayBetween = 0.3;    // 中间停顿时间

        // 第一阶段：收拢卡牌到中心
        this.animateCardGathering(playerCards, opponentCards, gatherDuration, () => {
            // 第二阶段：延迟后展开卡牌
            this.scheduleOnce(() => {
                this.animateCardSpreading(playerCards, opponentCards, originalPositions, spreadDuration);
            }, delayBetween);
        });
    }

    // 卡牌收拢动画
    private animateCardGathering(playerCards: Node[], opponentCards: Node[], duration: number, onComplete?: () => void) {
        let completedCount = 0;
        const totalCount = playerCards.length + opponentCards.length;

        // 中心位置
        const centerPosition = new Vec3(0, 0, 0);

        // 玩家卡牌收拢动画
        playerCards.forEach(card => {
            tween(card)
                .to(duration, { position: centerPosition }, { easing: 'cubicInOut' })
                .call(() => {
                    completedCount++;
                    if (completedCount >= totalCount && onComplete) {
                        onComplete();
                    }
                })
                .start();
        });

        // 对手卡牌收拢动画
        opponentCards.forEach(card => {
            tween(card)
                .to(duration, { position: centerPosition }, { easing: 'cubicInOut' })
                .call(() => {
                    completedCount++;
                    if (completedCount >= totalCount && onComplete) {
                        onComplete();
                    }
                })
                .start();
        });
    }

    // 卡牌展开动画
    private animateCardSpreading(playerCards: Node[], opponentCards: Node[], originalPositions: Map<Node, Vec3>, duration: number) {
        // 玩家卡牌展开动画
        playerCards.forEach(card => {
            const finalPosition = originalPositions.get(card);
            tween(card)
                .to(duration, { position: finalPosition }, { easing: 'backOut' })
                .start();
        });

        // 对手卡牌展开动画
        opponentCards.forEach(card => {
            const finalPosition = originalPositions.get(card);
            tween(card)
                .to(duration, { position: finalPosition }, { easing: 'backOut' })
                .start();
        });
    }

    // 检查并处理特殊牌型
    private checkAndProcessSpecialHands(playerCards: Card[], opponentCards: Card[]) {
        // 检查玩家的特殊牌型
        const playerSpecialHand = this.specialHandsManager.checkSpecialHand(playerCards);
        if (playerSpecialHand) {
            this.playerScore += playerSpecialHand.bonusPoints;
            console.log(`玩家获得特殊牌型：${playerSpecialHand.description}，获得${playerSpecialHand.bonusPoints}分`);
        }

        // 检查对手的特殊牌型
        const opponentSpecialHand = this.specialHandsManager.checkSpecialHand(opponentCards);
        if (opponentSpecialHand) {
            this.opponentScore += opponentSpecialHand.bonusPoints;
            console.log(`对手获得特殊牌型：${opponentSpecialHand.description}，获得${opponentSpecialHand.bonusPoints}分`);
        }
    }

    // 开始新回合
    public startNewRound() {
        if (this._currentRound >= this.maxRounds) {
            console.log('游戏结束');
            return;
        }

        // 更新回合数
        this._currentRound++;

        // 检查是否需要揭示新的场景效果
        if (this._currentRound <= 3 && this._revealedEffects < this._currentRound) {
            this.revealNextSceneEffect();
        }

        // 补充换牌次数
        this._exchangeCount = Math.min(this._exchangeCount + 2, this.maxExchangeCount);
        console.log(`新回合开始，当前换牌次数：${this._exchangeCount}`);

        // 更新换牌次数显示
        this.updateExchangeCountLabel();

        // 卡牌宽度（实际宽度乘以缩放比例）
        const cardWidth = 120 * 0.25;
        // 卡牌间距（设为卡牌宽度的230%，实现更松散的堆叠效果）
        const cardSpacing = cardWidth * 2.3;

        // 获取当前玩家和对手的卡牌数量
        const playerCardCount = this.playerHand.children.length;
        const opponentCardCount = this.opponentHand.children.length;

        // 牌桌中心位置（假设为坐标原点）
        const deckPosition = new Vec3(0, 0, 0);

        // 动画发牌，每人发2张牌
        this.dealNewRoundCardsWithAnimation(playerCardCount, opponentCardCount, cardSpacing, deckPosition);
    }

    // 新回合带动画发牌
    private dealNewRoundCardsWithAnimation(playerStartIndex: number, opponentStartIndex: number, cardSpacing: number, deckPosition: Vec3) {
        let dealIndex = 0;

        // 定时器，每隔一段时间发一张牌
        this.schedule(() => {
            // 交替给玩家和对手发牌
            const isPlayerTurn = dealIndex % 2 === 0;
            const card = this.deck.pop();

            if (card) {
                // 如果是对手的牌，立即显示背面（在任何属性设置之前，使用同步方法）
                if (!isPlayerTurn) {
                    card.showCardBackSync();
                }

                // 设置卡牌初始位置为牌堆位置
                card.node.setPosition(deckPosition);
                card.node.active = true;

                if (isPlayerTurn) {
                    // 给玩家发牌，自下而上动画
                    const index = playerStartIndex + Math.floor(dealIndex / 2);
                    this.animateCardToPlayer(card, index, cardSpacing);
                } else {
                    // 给对手发牌，自上而下动画
                    const index = opponentStartIndex + Math.floor(dealIndex / 2);
                    this.animateCardToOpponent(card, index);
                }
            }

            dealIndex++;

            // 检查是否是最后一张牌
            if (dealIndex >= 4) { // 每人发2张牌，总共4张
                // 获取所有玩家和对手的卡牌
                const playerCards = this.playerHand.children.map(node => node.getComponent(Card));
                const opponentCards = this.opponentHand.children.map(node => node.getComponent(Card));

                // 检查特殊牌型
                this.checkAndProcessSpecialHands(playerCards, opponentCards);
            }
        }, 0.3, 4 - 1); // 每0.3秒发一张牌，总共发4张牌（每人2张）
    }

    // 换牌方法
    public exchangeCard(card: Card) {
        // 检查是否还有换牌次数
        if (this._exchangeCount <= 0) {
            console.log("没有换牌次数了");
            return;
        }

        // 减少换牌次数
        this._exchangeCount--;
        console.log(`剩余换牌次数：${this._exchangeCount}`);

        // 更新换牌次数显示
        this.updateExchangeCountLabel();

        // 从牌堆中随机抽取一张新牌
        if (this.deck.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.deck.length);
            const newCard = this.deck[randomIndex];
            this.deck.splice(randomIndex, 1);

            // 记录换牌信息
            console.log('=== 换牌详情 ===');
            console.log(`换出: ${card.getFullName()}`);
            console.log(`换入: ${newCard.getFullName()}`);
            console.log('===============');

            // 将旧牌放回牌堆
            this.deck.push(card);

            // 获取卡牌在玩家手牌中的索引
            const cardIndex = this.playerHand.children.indexOf(card.node);

            // 设置新卡牌的父节点和位置
            newCard.node.setParent(this.playerHand);
            newCard.node.setSiblingIndex(cardIndex);

            // 确保新卡牌显示正面
            newCard.showCardFace();

            // 移除旧卡牌
            card.node.removeFromParent();

            // 播放换牌动画
            this.playExchangeAnimation(newCard, cardIndex);

            // 重新排列手牌
            this.arrangePlayerHand();
        } else {
            console.log("牌堆已空，无法换牌");
        }
    }

    // 播放换牌动画
    private playExchangeAnimation(newCard: Card, index: number) {
        // 设置卡牌初始位置（在牌堆位置）
        newCard.node.setPosition(0, 0, 0);
        newCard.node.active = true;

        // 计算最终位置
        const cardWidth = 120 * 0.25;
        const cardSpacing = cardWidth * 2.3;
        const totalWidth = (this.playerHand.children.length - 1) * cardSpacing;
        const finalX = -totalWidth / 2 + index * cardSpacing;

        // 创建并执行动画
        tween(newCard.node)
            .to(0.3, { position: new Vec3(finalX, 0, 0) }, { easing: 'cubicOut' })
            .call(() => {
                console.log(`Card exchanged at index ${index}`);
            })
            .start();
    }

    // 返回主菜单
    public returnToMainMenu() {
        director.loadScene('MainMenu');
    }

    // 初始化场景效果
    private initSceneEffects() {
        // 获取所有可用的场景效果类型
        const allEffects = [
            SceneEffectType.JQKBonus,
            SceneEffectType.FourCardSameColor,
            SceneEffectType.ThreeCardSequence,
            SceneEffectType.FourCardSequence,
            SceneEffectType.SkipOneSequence,
            SceneEffectType.FourSuitsBonus,
            SceneEffectType.A2358Bonus,
            SceneEffectType.KBonus,
            SceneEffectType.EvenStarBonus,
            SceneEffectType.NoTypeBonus,
            SceneEffectType.ClubBonus,
            SceneEffectType.SpadeBonus,
            SceneEffectType.DiamondBonus,
            SceneEffectType.HeartBonus,
            SceneEffectType.EvenBonus,
            SceneEffectType.OddBonus,
            SceneEffectType.SequenceChain,
            SceneEffectType.SameColorChain,
            SceneEffectType.FourKnightsChain,
            SceneEffectType.TwentyOneBonus,
            SceneEffectType.DestroyPublicCard,
            SceneEffectType.ExtraPublicCard,
            SceneEffectType.LeadingDraw,
            SceneEffectType.ExtraExchange,
            SceneEffectType.RandomPlay,
            SceneEffectType.ExtraPlay,
            SceneEffectType.DrawCard,
            SceneEffectType.SequenceExchange,
            SceneEffectType.SameColorExchange
        ];

        // 随机选择三个不同的效果
        const selectedEffects: SceneEffectType[] = [];
        const availableIndices = [...Array(allEffects.length).keys()];

        while (selectedEffects.length < 3 && availableIndices.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableIndices.length);
            const effectIndex = availableIndices.splice(randomIndex, 1)[0];
            selectedEffects.push(allEffects[effectIndex]);
        }

        // 清空现有的场景效果
        this.sceneEffects.forEach(effect => {
            if (effect && effect.node) {
                effect.node.destroy();
            }
        });
        this.sceneEffects = [];

        // 为每个场地区域创建场景效果
        for (let i = 0; i < this.playAreas.length; i++) {
            if (i < selectedEffects.length) {
                const effectNode = instantiate(this.sceneEffectPrefab);
                const effect = effectNode.getComponent(SceneEffect);

                // 设置场景效果的父节点为对应的场地区域
                effectNode.setParent(this.playAreas[i]);
                effectNode.setPosition(Vec3.ZERO);

                // 初始化场景效果
                effect.init(selectedEffects[i], this.playAreas[i]);
                this.sceneEffects.push(effect);
            }
        }
    }

    // 揭示下一个场景效果
    private revealNextSceneEffect() {
        if (this._revealedEffects < this.sceneEffects.length) {
            const effect = this.sceneEffects[this._revealedEffects];
            effect.reveal();
            this._revealedEffects++;

            // 应用场景效果
            effect.applyEffect(this, this._revealedEffects - 1);
        }
    }

    // 获取当前生效的场景效果
    public getActiveSceneEffects(): SceneEffect[] {
        return this.sceneEffects.filter(effect => effect.isRevealed);
    }

    // 牌型相关方法
    public setSameColorRequirement(count: number) {
        this.sameColorRequirement = count;
    }

    public setSequenceRequirement(count: number) {
        this.sequenceRequirement = count;
    }

    public enableSkipSequence(enabled: boolean) {
        this.skipSequenceEnabled = enabled;
    }

    public isSequence(cards: Card[]): boolean {
        if (cards.length < this.sequenceRequirement) return false;

        // 将牌按点数排序
        const sortedCards = [...cards].sort((a, b) => Number(a.rank) - Number(b.rank));

        // 如果允许跳顺（间隔为2）
        if (this.skipSequenceEnabled) {
            let totalGap = 0;
        for (let i = 1; i < sortedCards.length; i++) {
            const gap = Number(sortedCards[i].rank) - Number(sortedCards[i - 1].rank);
                if (gap > 2) return false;  // 如果任何间隔大于2，不是顺子
                totalGap += gap - 1;  // 累计额外间隔
            }
            // 总的额外间隔不能超过1，确保最多只能跳过一个数
            return totalGap <= 1;
        } else {
            // 普通顺子：必须完全连续
            for (let i = 1; i < sortedCards.length; i++) {
                const gap = Number(sortedCards[i].rank) - Number(sortedCards[i - 1].rank);
                if (gap !== 1) return false;
            }
        return true;
        }
    }

    public isSameColor(cards: Card[]): boolean {
        if (!cards || cards.length === 0) return false;  // 添加空数组检查

        // 过滤掉无效的卡牌
        const validCards = cards.filter(card => card && card.suit);
        if (validCards.length < this.sameColorRequirement) return false;

        const firstSuit = validCards[0].suit;
        return validCards.every(card => card.suit === firstSuit);
    }

    public hasValidType(cards: Card[]): boolean {
        return this.isSequence(cards) || this.isSameColor(cards);
    }

    public isFirstSequence(cards: Card[]): boolean {
        return this.isSequence(cards) && !this.hasSequenceBeenUsed;
    }

    public isFirstSameColor(cards: Card[]): boolean {
        return this.isSameColor(cards) && !this.hasSameColorBeenUsed;
    }

    // 游戏机制相关方法
    public isPlayerLeading(): boolean {
        return this.playerScore > this.opponentScore;
    }

    public drawExtraCard() {
        if (this.deck.length > 0) {
            const card = this.deck.pop();
            this.playerHand.addChild(card.node);
            this.arrangePlayerHand();
        }
    }

    public addExchangeCount(count: number) {
        this._exchangeCount = Math.min(this._exchangeCount + count, this.maxExchangeCount);
        this.updateExchangeCountLabel();
    }

    public getPlayerHandCards(): Card[] {
        return this.playerHand.children.map(node => node.getComponent(Card));
    }

    public playCard(card: Card, areaIndex: number) {
        console.log('=================== 出牌日志开始 ===================');
        console.log('playCard 方法被调用');
        console.log('参数检查：', { areaIndex, card: card ? '有效' : '无效' });

        if (areaIndex < 0 || areaIndex >= this.playAreas.length) {
            console.error("Invalid play area index");
            return;
        }

        const playArea = this.playAreas[areaIndex];

        // 从场地的SceneEffect组件中获取公共牌和场地效果信息
        const sceneEffect = this.sceneEffects[areaIndex];
        const publicCards = sceneEffect && sceneEffect.isRevealed ? sceneEffect.publicCards : [];

        console.log('场地检查：', {
            playArea: playArea ? '有效' : '无效',
            totalChildren: playArea ? playArea.children.length : 0,
            publicCardsCount: publicCards.length,
            isSceneEffectRevealed: sceneEffect ? sceneEffect.isRevealed : false
        });

        // 记录场地效果信息
        console.log(`场地效果信息：`);
        if (sceneEffect) {
            console.log(`- 场地效果是否已揭示：${sceneEffect.isRevealed}`);
            if (sceneEffect.isRevealed) {
                const effectInfo = this.getEffectInfo(sceneEffect.effectType);
                console.log(`- 场地效果类型：${SceneEffectType[sceneEffect.effectType]}`);
                console.log(`- 场地效果名称：${effectInfo.name}`);
                console.log(`- 场地效果描述：${effectInfo.description}`);
            } else {
                console.log('- 场地效果尚未揭示');
            }
        } else {
            console.log('- 该场地没有场地效果');
        }

        // 记录玩家在该场地已出的卡牌信息
        const playerCards = playArea.children
            .filter(child => child.name === 'PlayerCard')
            .map(container => container.getComponentInChildren(Card))
            .filter(card => card !== null);

        console.log('\n玩家在该场地已出卡牌：');
        if (playerCards.length > 0) {
            playerCards.forEach((card, index) => {
                console.log(`${index + 1}. ${card.getRank()} ${card.getSuit()}`);
            });
        } else {
            console.log('- 暂无已出卡牌');
        }

        // 记录现有的公共牌信息
        console.log('\n当前场地公共牌信息：');
        console.log(`- 现有公共牌数量：${publicCards.length}`);
        publicCards.forEach((publicCard, index) => {
            if (publicCard) {
                console.log(`  ${index + 1}. ${publicCard.getRank()} ${publicCard.getSuit()}`);
            }
        });

        // 获取玩家打出的牌容器数量
        const playerCardContainers = playArea.children.filter(child => child.name === 'PlayerCard');

        if (playerCardContainers.length < 4) {
            console.log('开始处理出牌');

            // 从原位置移除卡牌
            card.node.removeFromParent();

            // 创建卡牌容器，使用PlayerCard作为名称以区分
            const cardContainer = new Node('PlayerCard');
            playArea.addChild(cardContainer);

            // 设置容器位置在场地区域下方
            const areaTransform = playArea.getComponent(UITransform);
            if (!areaTransform) {
                console.error('Play area has no UITransform component');
                return;
            }

            // 计算容器位置
            const cardHeight = 180;  // 卡牌原始高度
            const cardWidth = 120;   // 卡牌原始宽度
            const spacing = 5;      // 卡牌间距
            const bottomY = -(areaTransform.height / 2) - (cardHeight * 0.35);  // 垂直位置

            // 计算水平位置（基于已有的玩家卡牌数量）
            const totalWidth = playerCardContainers.length * (cardWidth * 0.25 + spacing);  // 修改为0.25
            const startX = -(totalWidth / 2);
            const newX = startX + (playerCardContainers.length * (cardWidth * 0.25 + spacing));  // 修改为0.25

            // 设置容器位置
            cardContainer.setPosition(new Vec3(newX, bottomY, 0));

            // 将卡牌添加到容器中
            cardContainer.addChild(card.node);

            // 设置卡牌在容器中的位置和大小
            card.node.setPosition(Vec3.ZERO);
            card.node.setScale(0.5, 0.5, 1);

            const cardTransform = card.node.getComponent(UITransform);
            if (cardTransform) {
                cardTransform.setContentSize(120, 180);
            }

            // 确保卡牌显示正面
            card.showCardFace();

            // 记录出牌信息
            console.log(`出牌信息：`);
            console.log(`- 卡牌：${card.getRank()} ${card.getSuit()}`);
            console.log(`- 场地：${areaIndex + 1}号场地`);

            // 获取更新后的公共牌信息（仍然从SceneEffect中获取）
            const updatedPublicCards = sceneEffect && sceneEffect.isRevealed ? sceneEffect.publicCards : [];
            console.log(`- 更新后场地公共牌数量：${updatedPublicCards.length}`);
            console.log(`- 更新后场地公共牌：`);
            updatedPublicCards.forEach((publicCard, index) => {
                if (publicCard) {
                    console.log(`  ${index + 1}. ${publicCard.getRank()} ${publicCard.getSuit()}`);
                }
            });

            // 记录出牌
            this.recordCardPlayed(card, areaIndex);

            // 重新计算场地区域的分数
            this.calculateAreaScore(areaIndex);

            // 重新排列场地区域的卡牌
            this.arrangePlayArea(playArea);

            console.log('出牌处理完成');
        } else {
            console.log('场地已满（已有4张卡牌），无法出牌');
            // 将卡牌返回到玩家手牌区域
            this.playerHand.addChild(card.node);
            // 重新排列玩家手牌
            this.arrangePlayerHand();
        }
        console.log('=================== 出牌日志结束 ===================');
    }

    public addExtraPlayCount(count: number) {
        this.extraPlayCount += count;
    }

    public drawCard() {
        if (this.deck.length > 0) {
            const card = this.deck.pop();
            this.playerHand.addChild(card.node);
            this.arrangePlayerHand();
        }
    }

    private updateExchangeCountLabel() {
        if (this.exchangeCountLabel) {
            this.exchangeCountLabel.string = `换牌次数: ${this._exchangeCount}`;
        }
    }

    // 重新排列玩家手牌
    public arrangePlayerHand() {
        const playerHand = this.playerHand;
        if (!playerHand) return;

        // 获取所有卡牌并保持原有顺序
        const cards = [...playerHand.children];

        // 计算卡牌间距
        const cardWidth = 120 * 0.25; // 卡牌宽度（考虑缩放）
        const spacing = cardWidth * 2.3; // 卡牌间距（设为卡牌宽度的230%，实现更松散的堆叠效果）
        const totalWidth = (cards.length - 1) * spacing;
        const startX = -totalWidth / 2;

        // 按照原有顺序排列卡牌
        cards.forEach((cardNode, index) => {
            const card = cardNode.getComponent(Card);
            if (card) {
                // 设置卡牌位置
                const x = startX + index * spacing;
                cardNode.setPosition(x, 0, 0);

                // 确保卡牌显示正面
                card.showCardFace();
            }
        });

        // 确保玩家手牌区域可见
        playerHand.active = true;
    }

    // 修改arrangePlayArea方法以区分公共牌和玩家打出的牌
    public arrangePlayArea(playArea: Node) {
        // 分别获取公共牌和玩家打出的牌
        const publicCards = playArea.children.filter(child => child.name === 'PublicCard');
        const playerCards = playArea.children.filter(child => child.name === 'PlayerCard');

        const cardWidth = 120 * 0.5;
        const spacing = 46;  // 修改为46

        // 获取场地区域的UITransform
        const areaTransform = playArea.getComponent(UITransform);
        if (!areaTransform) {
            console.error('Play area has no UITransform component');
            return;
        }

        // 计算底部位置
        const cardHeight = 180;
        const bottomY = -(areaTransform.height / 2) - (cardHeight * 0.35);

        // 排列公共牌（如果有）
        const publicTotalWidth = (publicCards.length - 1) * (cardWidth * 0.25 + spacing);  // 保持0.25
        const publicStartX = -publicTotalWidth / 2;
        publicCards.forEach((container, index) => {
            const x = publicStartX + index * (cardWidth * 0.25 + spacing);  // 保持0.25
            container.setPosition(new Vec3(x, 0, 0)); // 公共牌放在中间位置
        });

        // 排列玩家打出的牌
        const playerTotalWidth = (playerCards.length - 1) * (cardWidth * 0.25 + spacing);  // 保持0.25
        const playerStartX = -playerTotalWidth / 2;
        playerCards.forEach((container, index) => {
            const x = playerStartX + index * (cardWidth * 0.25 + spacing);  // 保持0.25
            container.setPosition(new Vec3(x, bottomY, 0)); // 玩家牌放在底部
        });
    }

    private adaptToPlatform() {
        const platformAdapter = PlatformAdapter.getInstance();
        if (!platformAdapter) {
            console.warn("PlatformAdapter instance not ready yet");
            return;
        }

        const scale = platformAdapter.getScreenScale();

        // 调整卡牌大小
        if (this.playerHand && this.opponentHand) {
            const cardWidth = 120 * scale;  // 使用与玩家手牌相同的宽度
            const cardHeight = 180 * scale; // 使用与玩家手牌相同的高度

            // 调整玩家手牌位置
            const playerHandTransform = this.playerHand.getComponent(UITransform);
            if (playerHandTransform) {
                playerHandTransform.setContentSize(cardWidth * 5, cardHeight);
            }

            // 调整对手手牌位置，使用与玩家手牌相同的尺寸
            const opponentHandTransform = this.opponentHand.getComponent(UITransform);
            if (opponentHandTransform) {
                opponentHandTransform.setContentSize(cardWidth * 5, cardHeight);
            }
        }

        // 调整出牌区域
        if (this.playAreas.length > 0) {
            this.playAreas.forEach(area => {
                const playAreaTransform = area.getComponent(UITransform);
                if (playAreaTransform) {
                    const originalSize = playAreaTransform.contentSize;
                    playAreaTransform.setContentSize(
                        originalSize.width * scale,
                        originalSize.height * scale
                    );
                }
                // 设置缩放以确保可见
                area.setScale(scale, scale, 1);
            });
        }

        // 调整交换区域
        if (this.exchangeArea) {
            const exchangeAreaTransform = this.exchangeArea.getComponent(UITransform);
            if (exchangeAreaTransform) {
                // 设置交换区域的大小为卡牌大小的1.5倍
                const exchangeAreaWidth = 120 * scale * 1.5;
                const exchangeAreaHeight = 180 * scale * 1.5;
                exchangeAreaTransform.setContentSize(exchangeAreaWidth, exchangeAreaHeight);
            }
            // 设置缩放以确保可见
            this.exchangeArea.setScale(scale, scale, 1);
            // 确保节点可见
            this.exchangeArea.active = true;
        }

        // 重新设置换牌区域位置
        this.setupExchangeAreaPosition();
    }

    // 设置换牌区域位置
    private setupExchangeAreaPosition() {
        if (!this.exchangeArea || !this.background) {
            console.error("ExchangeArea or Background not found");
            return;
        }

        // 获取背景节点的UITransform组件
        const backgroundTransform = this.background.node.getComponent(UITransform);
        const exchangeAreaTransform = this.exchangeArea.getComponent(UITransform);

        if (!backgroundTransform || !exchangeAreaTransform) {
            console.error("Required UITransform components not found");
            return;
        }

        // 计算屏幕尺寸
        const screenWidth = backgroundTransform.width;
        const screenHeight = backgroundTransform.height;

        // 计算右下角位置，留出极小边距
        const margin = 5; // 非常小的边距

        // 设置一个明显的缩放，确保可见
        this.exchangeArea.setScale(1.2, 1.2, 1);

        // 计算位置 - 向左下方向移动
        const exchangeX = screenWidth / 2 - exchangeAreaTransform.width / 2 - margin - 120; // 进一步向左移动，增加额外空间
        const exchangeY = -screenHeight / 2 + exchangeAreaTransform.height / 2 + margin - 10; // 向下移动，减小底部边距

        // 设置换牌区域的位置
        this.exchangeArea.setPosition(new Vec3(exchangeX, exchangeY, 0));

        // 确保换牌区域可见
        this.exchangeArea.active = true;

        console.log('Exchange area position set to:', this.exchangeArea.position.toString());
    }

    // 设置UI元素位置（结束回合按钮和计时器）
    private setupUIElementsPosition() {
        if (!this.background) {
            console.error("Background not found");
            return;
        }

        // 获取背景节点的UITransform组件
        const backgroundTransform = this.background.node.getComponent(UITransform);
        if (!backgroundTransform) {
            console.error("Background UITransform not found");
            return;
        }

        // 获取屏幕尺寸
        const screenWidth = backgroundTransform.width;
        const screenHeight = backgroundTransform.height;

        // 设置结束回合按钮位置
        if (this.endTurnButton && this.endTurnButton.node) {
            // 获取按钮尺寸
            const buttonTransform = this.endTurnButton.node.getComponent(UITransform);
            if (!buttonTransform) {
                console.error("End turn button UITransform not found");
                return;
            }

            const buttonWidth = buttonTransform.width;
            const buttonHeight = buttonTransform.height;

            // 计算右下角位置，使按钮紧贴右下角
            const margin = 5; // 非常小的边距，几乎紧贴边缘
            const buttonX = screenWidth / 2 - buttonWidth / 2 - margin; // 右侧边缘减去极小边距
            const buttonY = -screenHeight / 2 + buttonHeight / 2 + margin; // 底部边缘加上极小边距

            // 设置按钮位置
            this.endTurnButton.node.setPosition(new Vec3(buttonX, buttonY, 0));

            // 确保按钮可见
            this.endTurnButton.node.active = true;

            console.log('End turn button position set to:', this.endTurnButton.node.position.toString());

            // 设置计时器位置
            if (this.timerLabel && this.timerLabel.node) {
                // 获取计时器尺寸
                const timerTransform = this.timerLabel.node.getComponent(UITransform);
                if (!timerTransform) {
                    console.error("Timer label UITransform not found");
                    return;
                }

                const timerWidth = timerTransform.width;
                const timerHeight = timerTransform.height;

                // 获取结束回合按钮的位置
                const buttonPos = this.endTurnButton.node.position;

                // 计时器放在结束回合按钮正上方，X坐标相同
                const timerX = buttonPos.x; // 与结束回合按钮相同的X坐标
                const timerY = buttonPos.y + buttonHeight / 2 + timerHeight / 2 + 0; // 在结束回合按钮上方，无间距

                // 设置计时器位置
                this.timerLabel.node.setPosition(new Vec3(timerX, timerY, 0));

                // 确保计时器可见
                this.timerLabel.node.active = true;

                console.log('Timer position set to:', this.timerLabel.node.position.toString());
            }
        }
    }

    // 设置场地区域位置
    private setupPlayAreasPosition() {
        if (this.playAreas.length !== 3) {
            console.error("需要设置3个出牌区域");
            return;
        }

        const platformAdapter = PlatformAdapter.getInstance();
        if (!platformAdapter) {
            console.warn("PlatformAdapter instance not ready yet");
            return;
        }

        // 获取屏幕缩放比例
        const screenScale = platformAdapter.getScreenScale();

        // 设置出牌区域位置，根据屏幕缩放调整间距
        const baseSpacing = 200; // 基础间距
        const playAreaSpacing = baseSpacing * screenScale; // 根据屏幕缩放调整间距
        const startX = -playAreaSpacing; // 从左侧开始

        this.playAreas.forEach((area, index) => {
            // 确保出牌区域可见
            area.active = true;

            // 设置位置
            area.setPosition(new Vec3(startX + index * playAreaSpacing, 0, 0));

            // 移除旧的分数标签（如果存在）
            const oldLabel = area.getChildByName('ScoreLabel');
            if (oldLabel) {
                oldLabel.destroy();
            }

            // 确保所有子节点可见
            area.children.forEach(child => {
                child.active = true;
            });

            console.log(`Play area ${index} positioned at (${startX + index * playAreaSpacing}, 0, 0) with scale ${screenScale}`);
        });
    }

    // 计算并更新指定场地的分数
    public calculateAreaScore(areaIndex: number) {
        if (areaIndex < 0 || areaIndex >= this.playAreas.length) return;

        const playArea = this.playAreas[areaIndex];
        if (!playArea) return;

        // 重置该区域的分数和详情
        this.areaScores[areaIndex] = 0;
        this.areaScoreDetails[areaIndex] = '';

        // 获取场地中的所有卡牌（包括公共牌和玩家打出的牌）
        const sceneEffect = this.sceneEffects[areaIndex];
        const publicCards = sceneEffect && sceneEffect.isRevealed ? sceneEffect.publicCards : [];
        const playerCards = playArea.children
            .filter(child => child.name === 'PlayerCard')
            .map(container => container.getComponentInChildren(Card))
            .filter(card => card !== null);

        const allCards = [...publicCards, ...playerCards];

        // 如果没有卡牌，直接返回
        if (allCards.length === 0) return;

        // 1. 计算基础点数分数
        let pointScore = 0;
        allCards.forEach(card => {
            const value = this.getCardValue(card.rank);
            pointScore += value;
        });
        this.addScoreToArea(areaIndex, pointScore, '点数');

        // 2. 计算牌型分数
        if (this.isSequence(allCards)) {
            this.addScoreToArea(areaIndex, 30, '顺子');
        }
        if (this.isSameColor(allCards)) {
            this.addScoreToArea(areaIndex, 20, '同色');
        }

        // 检查特殊牌型
        const specialHand = this.specialHandsManager.checkSpecialHand(allCards);
        if (specialHand) {
            console.log('检测到特殊牌型:', specialHand);
            // 根据特殊牌型类型添加相应的分数
            switch (specialHand.type) {
                case SpecialHandType.ROYAL_FLUSH:
                    this.addScoreToArea(areaIndex, 150, '完美同色序列');
                    break;
                case SpecialHandType.PERFECT_STRAIGHT:
                    this.addScoreToArea(areaIndex, 135, '完美序列');
                    break;
                case SpecialHandType.STRAIGHT_FLUSH:
                    this.addScoreToArea(areaIndex, 120, '同色序列');
                    break;
                case SpecialHandType.FOUR_OF_A_KIND:
                    this.addScoreToArea(areaIndex, 80, '四骑士');
                    break;
                case SpecialHandType.FLUSH:
                    this.addScoreToArea(areaIndex, 60, '同色');
                    break;
                case SpecialHandType.STRAIGHT:
                    this.addScoreToArea(areaIndex, 60, '序列');
                    break;
                case SpecialHandType.FULL_HOUSE:
                    this.addScoreToArea(areaIndex, 55, '满座');
                    break;
                case SpecialHandType.THREE_OF_A_KIND:
                    this.addScoreToArea(areaIndex, 30, '三贤者');
                    break;
                case SpecialHandType.TWO_PAIRS:
                    this.addScoreToArea(areaIndex, 30, '双偶星');
                    break;
                case SpecialHandType.PAIR:
                    this.addScoreToArea(areaIndex, 15, '偶星');
                    break;
            }
        }

        // 3. 应用场景效果加分
        if (sceneEffect && sceneEffect.isRevealed) {
            sceneEffect.applyEffect(this, areaIndex);
        }

        // 4. 更新分数显示
        this.updateAreaScoreLabel(areaIndex);

        // 打印分数计算日志
        console.log(`场地${areaIndex + 1}分数计算结果：`);
        console.log(`- 总分：${this.areaScores[areaIndex]}`);
        console.log(`- 详情：\n${this.areaScoreDetails[areaIndex]}`);
    }

    // 重新计算场地区域的分数和牌型
    private recalculateAreaScoreAndHandType(areaIndex: number) {
        // 直接调用calculateAreaScore方法进行完整的分数计算
        this.calculateAreaScore(areaIndex);
    }

    // 更新指定场地的分数显示
    private updateAreaScoreLabel(areaIndex: number) {
        if (areaIndex >= 0 && areaIndex < this.areaScoreLabels.length) {
            const playArea = this.playAreas[areaIndex];
            if (!playArea) return;

            // 确保场地区域可见
            playArea.active = true;

            // 获取或创建分数显示容器
            let scoreContainer = playArea.getChildByName('ScoreContainer');
            if (!scoreContainer) {
                scoreContainer = new Node('ScoreContainer');
                playArea.addChild(scoreContainer);
            }

            // 确保容器有Layout组件
            let layout = scoreContainer.getComponent(Layout);
            if (!layout) {
                layout = scoreContainer.addComponent(Layout);
                layout.type = Layout.Type.HORIZONTAL;
                layout.spacingX = 15;
                layout.resizeMode = Layout.ResizeMode.NONE;
                layout.paddingLeft = 5;
                layout.paddingRight = 5;
            }

            // 设置容器大小和位置
            const containerTransform = scoreContainer.getComponent(UITransform);
            if (!containerTransform) {
                scoreContainer.addComponent(UITransform);
            }
            containerTransform.setContentSize(180, 18);

            // 获取场地区域的尺寸
            const playAreaTransform = playArea.getComponent(UITransform);
            if (playAreaTransform) {
                // 将分数容器定位到场地区域底部，并向左偏移20个单位
                scoreContainer.setPosition(-20, -playAreaTransform.height / 2 + 40, 0);
            }

            // 解析分数详情
            const details = this.areaScoreDetails[areaIndex].split('\n');
            let points = 0;
            let handType = 0;
            let special = 0;
            let specialHandName = '牌型';  // 默认显示"牌型"

            details.forEach(line => {
                if (line.includes('点数')) {
                    points = parseInt(line.split('+')[1]);
                } else if (line.includes('完美同色序列')) {
                    handType += parseInt(line.split('+')[1]);
                    specialHandName = '皇同序';
                } else if (line.includes('完美序列')) {
                    handType += parseInt(line.split('+')[1]);
                    specialHandName = '完美序';
                } else if (line.includes('同色序列')) {
                    handType += parseInt(line.split('+')[1]);
                    specialHandName = '同色序';
                } else if (line.includes('四骑士')) {
                    handType += parseInt(line.split('+')[1]);
                    specialHandName = '四骑士';
                } else if (line.includes('满座')) {
                    handType += parseInt(line.split('+')[1]);
                    specialHandName = '满座';
                } else if (line.includes('三贤者')) {
                    handType += parseInt(line.split('+')[1]);
                    specialHandName = '三贤者';
                } else if (line.includes('双偶星')) {
                    handType += parseInt(line.split('+')[1]);
                    specialHandName = '双偶星';
                } else if (line.includes('偶星')) {
                    handType += parseInt(line.split('+')[1]);
                    specialHandName = '偶星';
                } else if (line.includes('同色')) {
                    handType += parseInt(line.split('+')[1]);
                    if (specialHandName === '牌型') specialHandName = '同色';
                } else if (line.includes('顺子')) {
                    handType += parseInt(line.split('+')[1]);
                    if (specialHandName === '牌型') specialHandName = '顺子';
                } else if (line.includes('奖励') || line.includes('效果')) {
                    special += parseInt(line.split('+')[1]);
                }
            });

            const total = points + handType + special;

            // 清除现有的分数显示节点
            scoreContainer.removeAllChildren();

            // 创建四个分数项
            const scoreData = [
                { label: '点数', value: points },
                { label: specialHandName, value: handType },
                { label: '特殊', value: special },
                { label: '总分', value: total }
            ];

            scoreData.forEach(data => {
                // 创建分数项容器
                const itemNode = new Node('ScoreItem');
                itemNode.parent = scoreContainer;

                // 设置分数项容器大小
                const itemTransform = itemNode.addComponent(UITransform);
                itemTransform.setContentSize(40, 18);

                // 创建垂直布局
                const itemLayout = itemNode.addComponent(Layout);
                itemLayout.type = Layout.Type.VERTICAL;
                itemLayout.spacingY = -16;
                itemLayout.resizeMode = Layout.ResizeMode.NONE;

                // 创建标签节点
                const labelNode = new Node('Label');
                const labelComp = labelNode.addComponent(Label);
                labelComp.string = data.label;
                labelComp.horizontalAlign = Label.HorizontalAlign.CENTER;
                labelComp.fontSize = 18;
                labelComp.color = new Color(255, 255, 255, 255);
                labelNode.parent = itemNode;

                // 设置标签节点大小
                const labelTransform = labelNode.addComponent(UITransform);
                labelTransform.setContentSize(40, 9);

                // 创建数值节点
                const valueNode = new Node('Value');
                const valueComp = valueNode.addComponent(Label);
                valueComp.string = data.value.toString();
                valueComp.horizontalAlign = Label.HorizontalAlign.CENTER;
                valueComp.fontSize = 20;
                valueComp.color = new Color(255, 255, 255, 255);
                valueNode.parent = itemNode;

                // 设置数值节点大小
                const valueTransform = valueNode.addComponent(UITransform);
                valueTransform.setContentSize(40, 9);
            });
        }
    }

    // 添加分数到指定场地
    public addScoreToArea(areaIndex: number, score: number, reason: string) {
        if (areaIndex >= 0 && areaIndex < this.areaScores.length) {
            this.areaScores[areaIndex] += score;
            // 添加换行确保每个原因单独一行
            this.areaScoreDetails[areaIndex] += `${reason}: +${score}\n`;
        }
    }

    // 获取卡牌点数
    private getCardValue(rank: CardRank): number {
        switch (rank) {
            case CardRank.Ace: return 1;
            case CardRank.Two: return 2;
            case CardRank.Three: return 3;
            case CardRank.Four: return 4;
            case CardRank.Five: return 5;
            case CardRank.Six: return 6;
            case CardRank.Seven: return 7;
            case CardRank.Eight: return 8;
            case CardRank.Nine: return 9;
            case CardRank.Ten: return 10;
            case CardRank.Jack: return 11;
            case CardRank.Queen: return 12;
            case CardRank.King: return 13;
            default: return 0;
        }
    }

    // 分数相关方法
    public addScore(score: number) {
        this.playerScore += score;
    }

    public addScoreToOtherAreas(score: number) {
        this.opponentScore += score;
    }

    // 返回主界面按钮点击事件处理
    private onBackButtonClicked() {
        // 切换到主菜单场景
        director.loadScene('MainMenu');
    }

    private showSpecialHandsPopup() {
        if (this.specialHandsPopup) {
            const popup = this.specialHandsPopup.getComponent(SpecialHandsPopup);
            if (popup) {
                popup.showPopup();
            }
        }
    }

    // 检查场地区域是否已经翻开
    public isPlayAreaRevealed(areaIndex: number): boolean {
        return this.revealedAreas[areaIndex] === true;
    }

    // 标记场地区域为已翻开
    public markPlayAreaRevealed(areaIndex: number): void {
        if (areaIndex >= 0 && areaIndex < this.revealedAreas.length) {
            this.revealedAreas[areaIndex] = true;

            // 更新UI显示
            if (this.playAreas[areaIndex]) {
                // 可以添加一些视觉效果，比如高亮或动画
                console.log(`Play area ${areaIndex} has been revealed`);

                // 如果有特殊效果，可以在这里添加
                // 暂时注释掉，等待SceneEffect类实现playRevealEffect方法
                // if (this.sceneEffects[areaIndex]) {
                //     if (typeof this.sceneEffects[areaIndex].playRevealEffect === 'function') {
                //         this.sceneEffects[areaIndex].playRevealEffect(this.playAreas[areaIndex]);
                //     }
                // }
            }
        }
    }

    // 检查是否可以放置卡牌到未翻开的区域
    public canPlayToUnrevealedArea(): boolean {
        // 这里可以实现游戏规则，比如：
        // 1. 第一张卡牌可以放在任何区域
        // 2. 或者特定条件下允许放在未翻开区域
        return true; // 默认允许
    }

    // 检查是否还能出牌
    public canPlayCard(): boolean {
        // 如果有额外出牌次数，返回true
        if (this.extraPlayCount > 0) {
            return true;
        }
        // 否则检查是否达到每回合出牌限制
        return this.cardsPlayedThisTurn < this.maxCardsPerTurn;
    }

    // 记录出牌
    public recordCardPlayed(card: Card, areaIndex: number): void {
        // 如果有额外出牌次数，优先使用
        if (this.extraPlayCount > 0) {
            this.extraPlayCount--;
        } else {
            this.cardsPlayedThisTurn++;
        }

        // 记录当前回合打出的牌
        if (!this.currentTurnPlayedCards.has(areaIndex)) {
            this.currentTurnPlayedCards.set(areaIndex, []);
        }
        this.currentTurnPlayedCards.get(areaIndex)?.push(card);

        // 添加点击事件监听器
        card.node.on(Node.EventType.TOUCH_START, () => {
            this.onCardClicked(card, areaIndex);
        });
    }

    // 处理卡牌点击事件
    private onCardClicked(card: Card, areaIndex: number) {
        // 检查是否是当前回合打出的牌
        const playedCards = this.currentTurnPlayedCards.get(areaIndex);
        if (playedCards && playedCards.includes(card)) {
            this.retrieveCard(card, areaIndex);
        }
    }

    // 回收卡牌
    private retrieveCard(card: Card, areaIndex: number) {
        // 获取卡牌的容器节点
        const cardContainer = card.node.parent;

        // 从场地区域移除卡牌前，先重置其所有变换
        card.node.setScale(1.45, 1.45, 1);  // 进一步增加回收卡牌的缩放
        const cardTransform = card.node.getComponent(UITransform);
        if (cardTransform) {
            cardTransform.setContentSize(120, 180);  // 重置为原始尺寸
        }

        // 从场地区域移除卡牌
        card.node.removeFromParent();

        // 删除空的容器节点
        if (cardContainer) {
            cardContainer.destroy();
        }

        // 从当前回合打出的牌列表中移除
        const playedCards = this.currentTurnPlayedCards.get(areaIndex);
        if (playedCards) {
            const index = playedCards.indexOf(card);
            if (index > -1) {
                playedCards.splice(index, 1);
            }
        }

        // 将卡牌添加回玩家手牌并设置正确的缩放
        this.playerHand.addChild(card.node);
        card.node.setScale(1.45, 1.45, 1);  // 进一步增加回收卡牌的缩放

        // 重新排列玩家手牌
        this.arrangePlayerHand();

        // 重新计算场地区域的分数
        this.calculateAreaScore(areaIndex);

        // 重新排列场地区域的卡牌
        this.arrangePlayArea(this.playAreas[areaIndex]);

        // 减少出牌次数
        this.cardsPlayedThisTurn--;
    }

    // 重置回合状态
    public resetCardPlayCount(): void {
        this.cardsPlayedThisTurn = 0;
        this.extraPlayCount = 0;
        this.currentTurnPlayedCards.clear(); // 清空当前回合打出的牌记录
    }

    // 更新计时器显示
    private updateTimerDisplay() {
        if (this.timerLabel) {
            const minutes = Math.floor(this.remainingTime / 60);
            const seconds = this.remainingTime % 60;
            // 使用三元运算符来添加前导零
            const secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
            this.timerLabel.string = `${minutes}:${secondsStr}`;
        }
    }

    // 开始回合计时器
    private startTurnTimer() {
        this.isTimerRunning = true;
        this.schedule(this.updateTimer, 1);
    }

    // 停止回合计时器
    private stopTurnTimer() {
        this.isTimerRunning = false;
        this.unschedule(this.updateTimer);
    }

    // 更新计时器
    private updateTimer() {
        if (!this.isTimerRunning) return;

        this.remainingTime--;
        this.updateTimerDisplay();

        if (this.remainingTime <= 0) {
            this.endTurn();
        }
    }

    // 结束当前回合
    public endTurn() {
        console.log("结束当前回合");
        this.stopTurnTimer();

        // 重置回合状态
        this.resetCardPlayCount();

        // 计算所有场地的分数
        for (let i = 0; i < this.playAreas.length; i++) {
            this.calculateAreaScore(i);
        }

        // 开始新回合
        this.startNewRound();
    }

    // 结束回合按钮点击事件处理
    public onEndTurnButtonClicked() {
        console.log("结束回合按钮被点击");
        this.endTurn();
    }

    // 开始新回合
    private startNewTurn() {
        // 重置计时器
        this.remainingTime = this.turnTimeLimit;
        this.updateTimerDisplay();

        // 重置回合状态
        this.resetCardPlayCount();

        // 开始计时
        this.startTurnTimer();
    }

    // 获取场地效果信息
    private getEffectInfo(effectType: SceneEffectType): { name: string, description: string } {
        switch (effectType) {
            case SceneEffectType.JQKBonus:
                return { name: 'JQK奖励', description: 'J、Q、K额外加15分' };
            case SceneEffectType.FourCardSameColor:
                return { name: '四色同花', description: '同色可由4张牌组成' };
            case SceneEffectType.ThreeCardSequence:
                return { name: '三张顺子', description: '序列可由3张牌组成' };
            case SceneEffectType.FourCardSequence:
                return { name: '四张顺子', description: '序列可由4张牌组成' };
            case SceneEffectType.SkipOneSequence:
                return { name: '跳点顺子', description: '序列可以相隔1个点数组成' };
            case SceneEffectType.FourSuitsBonus:
                return { name: '四色奖励', description: '4种不同花色额外加50分' };
            case SceneEffectType.A2358Bonus:
                return { name: 'A2358奖励', description: 'A、2、3、5、8额外加15分' };
            case SceneEffectType.KBonus:
                return { name: 'K奖励', description: 'K额外加25分' };
            case SceneEffectType.EvenStarBonus:
                return { name: '偶星奖励', description: '包含偶星额外加15分' };
            case SceneEffectType.NoTypeBonus:
                return { name: '无型奖励', description: '无牌型时每张牌加15分' };
            case SceneEffectType.ClubBonus:
                return { name: '梅花奖励', description: '每张梅花加15分' };
            case SceneEffectType.SpadeBonus:
                return { name: '黑桃奖励', description: '每张黑桃加15分' };
            case SceneEffectType.DiamondBonus:
                return { name: '方块奖励', description: '每张方块加15分' };
            case SceneEffectType.HeartBonus:
                return { name: '红桃奖励', description: '每张红桃加15分' };
            case SceneEffectType.EvenBonus:
                return { name: '偶数奖励', description: '每张偶数牌加15分' };
            case SceneEffectType.OddBonus:
                return { name: '奇数奖励', description: '每张奇数牌加15分' };
            case SceneEffectType.SequenceChain:
                return { name: '顺子连锁', description: '有序列时其他区域各加30分' };
            case SceneEffectType.SameColorChain:
                return { name: '同色连锁', description: '有同色时其他区域各加30分' };
            case SceneEffectType.FourKnightsChain:
                return { name: '四骑士连锁', description: '有四骑士时其他区域各加30分' };
            case SceneEffectType.TwentyOneBonus:
                return { name: '21点奖励', description: '点数和为21点额外加50分' };
            case SceneEffectType.DestroyPublicCard:
                return { name: '摧毁公共牌', description: '摧毁1张公共牌' };
            case SceneEffectType.ExtraPublicCard:
                return { name: '额外公共牌', description: '额外补充1张公共牌' };
            case SceneEffectType.LeadingDraw:
                return { name: '领先抽牌', description: '领先玩家多抽1张牌' };
            case SceneEffectType.ExtraExchange:
                return { name: '额外换牌', description: '补充2次换牌次数' };
            case SceneEffectType.RandomPlay:
                return { name: '随机出牌', description: '随机出1张牌' };
            case SceneEffectType.ExtraPlay:
                return { name: '额外出牌', description: '获得1次额外出牌次数' };
            case SceneEffectType.DrawCard:
                return { name: '抽牌', description: '立即抽1张牌' };
            case SceneEffectType.SequenceExchange:
                return { name: '顺子换牌', description: '首次序列获得5次换牌机会' };
            case SceneEffectType.SameColorExchange:
                return { name: '同色换牌', description: '首次同色获得5次换牌机会' };
            default:
                return { name: '未知效果', description: '未知效果' };
        }
    }

    // 获取剩余换牌次数
    public getExchangeCount(): number {
        return this._exchangeCount;
    }
}
