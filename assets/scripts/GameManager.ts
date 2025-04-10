import { _decorator, Component, Node, director, instantiate, Prefab, resources, SpriteFrame, Sprite, UITransform, Vec3, Camera, Label } from 'cc';
import { Card, CardSuit, CardRank } from './Card';
import { tween } from 'cc';
import { SpecialHandsManager, SpecialHand } from './SpecialHands';
import { SceneEffect, SceneEffectType } from './SceneEffect';
import { PlatformAdapter } from './PlatformAdapter';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Node)
    private playerHand: Node = null;  // 玩家手牌区域

    @property(Node)
    private opponentHand: Node = null;  // 对手手牌区域

    @property([Node])
    private playAreas: Node[] = [];  // 三个场地区域

    @property(Node)
    private exchangeArea: Node = null;  // 换牌区域

    @property(Sprite)
    private background: Sprite = null;  // 游戏背景

    @property(Prefab)
    private sceneEffectPrefab: Prefab = null;  // 场景效果预制体

    @property([SceneEffect])
    public sceneEffects: SceneEffect[] = [];

    @property([Label])
    private areaScoreLabels: Label[] = [];  // 每个场地的分数标签

    @property(Label)
    private exchangeCountLabel: Label = null;  // 换牌次数标签

    private deck: Card[] = [];  // 牌堆
    private _currentRound: number = 0;
    private maxRounds: number = 5;  // 最大回合数
    private exchangeCount: number = 12;  // 换牌次数
    private maxExchangeCount: number = 12;  // 最大换牌次数
    private _revealedEffects: number = 0;

    private specialHandsManager: SpecialHandsManager;
    private playerScore: number = 0;
    private opponentScore: number = 0;
    private areaScores: number[] = [0, 0, 0];  // 每个场地的分数
    private areaScoreDetails: string[] = ['', '', ''];  // 每个场地的分数详情

    private sameColorRequirement: number = 0;
    private sequenceRequirement: number = 0;
    private skipSequenceEnabled: boolean = false;
    private hasSequenceBeenUsed: boolean = false;
    private hasSameColorBeenUsed: boolean = false;

    private extraPlayCount: number = 0;

    start() {
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

        // 设置场地区域位置
        this.setupPlayAreasPosition();

        // 设置换牌区域位置
        this.setupExchangeAreaPosition();

        // 初始化换牌次数显示
        this.updateExchangeCountLabel();

        // 延迟两帧初始化游戏，确保所有组件都已加载
        this.scheduleOnce(() => {
            this.initGame();
        }, 0.1);

        // 初始化场景效果
        this.initSceneEffects();

        this.adaptToPlatform();
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
        this.exchangeCount = Math.min(this.exchangeCount + 2, this.maxExchangeCount);
        console.log(`新回合开始，当前换牌次数：${this.exchangeCount}`);

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
        if (this.exchangeCount <= 0) {
            console.log("没有换牌次数了");
            return;
        }

        // 减少换牌次数
        this.exchangeCount--;
        console.log(`剩余换牌次数：${this.exchangeCount}`);

        // 更新换牌次数显示
        this.updateExchangeCountLabel();

        // 从牌堆中随机抽取一张新牌
        if (this.deck.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.deck.length);
            const newCard = this.deck[randomIndex];
            this.deck.splice(randomIndex, 1);

            // 将旧牌放回牌堆
            this.deck.push(card);

            // 获取卡牌在玩家手牌中的索引
            const cardIndex = this.playerHand.children.indexOf(card.node);

            // 设置新卡牌的父节点和位置
            newCard.node.setParent(this.playerHand);
            newCard.node.setSiblingIndex(cardIndex);

            // 移除旧卡牌
            card.node.removeFromParent();

            // 播放换牌动画
            this.playExchangeAnimation(newCard, cardIndex);
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

        const sortedCards = [...cards].sort((a, b) => Number(a.rank) - Number(b.rank));
        const maxGap = this.skipSequenceEnabled ? 2 : 1;

        for (let i = 1; i < sortedCards.length; i++) {
            const gap = Number(sortedCards[i].rank) - Number(sortedCards[i - 1].rank);
            if (gap > maxGap) return false;
        }

        return true;
    }

    public isSameColor(cards: Card[]): boolean {
        if (cards.length < this.sameColorRequirement) return false;

        const firstSuit = cards[0].suit;
        return cards.every(card => card.suit === firstSuit);
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
        this.exchangeCount += count;
        this.updateExchangeCountLabel();
    }

    public getPlayerHandCards(): Card[] {
        return this.playerHand.children.map(node => node.getComponent(Card));
    }

    public playCard(card: Card, areaIndex: number) {
        if (areaIndex < 0 || areaIndex >= this.playAreas.length) {
            console.error("Invalid play area index");
            return;
        }

        const playArea = this.playAreas[areaIndex];
        if (playArea.children.length < 5) {
            card.node.removeFromParent();
            playArea.addChild(card.node);
            this.arrangePlayArea(playArea);
        }
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
            this.exchangeCountLabel.string = `换牌次数: ${this.exchangeCount}`;
        }
    }

    private arrangePlayerHand() {
        const cards = this.playerHand.children;
        if (!cards || cards.length === 0) return;

        // 卡牌宽度（考虑缩放）
        const cardWidth = 120 * 0.25;
        // 卡牌间距（设为卡牌宽度的230%，实现更松散的堆叠效果）
        const spacing = cardWidth * 2.3;
        
        // 计算总宽度
        const totalWidth = (cards.length - 1) * spacing;
        // 起始X坐标（居中）
        const startX = -totalWidth / 2;

        // 设置每张卡牌的位置
        cards.forEach((card, index) => {
            const x = startX + index * spacing;
            card.setPosition(x, 0, 0);
            
            // 确保卡牌可见
            card.active = true;
            
            // 确保显示卡牌正面
            const cardComponent = card.getComponent(Card);
            if (cardComponent) {
                cardComponent.showCardFace();
            }
        });

        // 确保玩家手牌区域可见
        this.playerHand.active = true;
    }

    private arrangePlayArea(playArea: Node) {
        const cards = playArea.children;
        const cardWidth = 120; // 卡牌宽度
        const spacing = 20; // 卡牌间距
        const totalWidth = (cards.length - 1) * (cardWidth + spacing);
        const startX = -totalWidth / 2;

        cards.forEach((card, index) => {
            const x = startX + index * (cardWidth + spacing);
            card.setPosition(x, 0, 0);
        });
    }

    private adaptToPlatform() {
        const platformAdapter = PlatformAdapter.getInstance();
        if (platformAdapter) {
            const scale = platformAdapter.getScreenScale();
            
            // 调整卡牌大小
            if (this.playerHand && this.opponentHand) {
                const cardWidth = 100 * scale;
                const cardHeight = 140 * scale;
                
                // 调整玩家手牌位置
                const playerHandTransform = this.playerHand.getComponent(UITransform);
                if (playerHandTransform) {
                    playerHandTransform.setContentSize(cardWidth * 5, cardHeight);
                }
                
                // 调整对手手牌位置
                const opponentHandTransform = this.opponentHand.getComponent(UITransform);
                if (opponentHandTransform) {
                    opponentHandTransform.setContentSize(cardWidth * 5, cardHeight);
                }
            }

            // 调整出牌区域
            if (this.playAreas.length > 0) {
                const playAreaTransform = this.playAreas[0].getComponent(UITransform);
                if (playAreaTransform) {
                    const originalSize = playAreaTransform.contentSize;
                    playAreaTransform.setContentSize(
                        originalSize.width * scale,
                        originalSize.height * scale
                    );
                }
            }

            // 调整交换区域
            if (this.exchangeArea) {
                const exchangeAreaTransform = this.exchangeArea.getComponent(UITransform);
                if (exchangeAreaTransform) {
                    const originalSize = exchangeAreaTransform.contentSize;
                    exchangeAreaTransform.setContentSize(
                        originalSize.width * scale,
                        originalSize.height * scale
                    );
                }
            }
        }
    }

    // 设置换牌区域位置
    private setupExchangeAreaPosition() {
        if (!this.playerHand || !this.exchangeArea) {
            console.error("PlayerHand or ExchangeArea not found");
            return;
        }

        // 获取玩家手牌区域的位置和大小
        const playerHandPos = this.playerHand.getPosition();
        const playerHandTransform = this.playerHand.getComponent(UITransform);
        const playerHandWidth = playerHandTransform.contentSize.width;

        // 设置换牌区域的位置（在玩家手牌区域的右侧）
        const exchangeAreaPos = new Vec3(
            playerHandPos.x + playerHandWidth / 2 + 100, // 在玩家手牌区域右侧100单位
            playerHandPos.y,
            0
        );

        this.exchangeArea.setPosition(exchangeAreaPos);
    }

    // 设置场地区域位置
    private setupPlayAreasPosition() {
        if (this.playAreas.length !== 3) {
            console.error("Need exactly 3 play areas");
            return;
        }

        // 获取屏幕宽度
        const screenWidth = 1920; // 标准屏幕宽度
        const screenScale = screenWidth / 1920; // 计算缩放比例

        // 计算场地区域之间的间距
        const areaWidth = 400 * screenScale; // 每个场地区域的宽度，考虑屏幕缩放
        const spacing = 30 * screenScale; // 场地区域之间的间距，考虑屏幕缩放
        const totalWidth = (areaWidth * 3) + (spacing * 2);
        const startX = -totalWidth / 2 + areaWidth / 2;

        // 设置每个场地区域的位置
        this.playAreas.forEach((area, index) => {
            const x = startX + index * (areaWidth + spacing);
            area.setPosition(new Vec3(x, 0, 0));
            
            // 确保场地可见
            area.active = true;
            
            // 设置场地的缩放
            area.setScale(screenScale, screenScale, 1);
        });

        // 设置对手手牌区域位置到场景顶部
        if (this.opponentHand) {
            // 获取场景高度
            const sceneHeight = 1080; // 假设场景高度为1080
            const topY = sceneHeight / 2 - 100; // 距离顶部100单位
            
            // 确保对手手牌区域可见
            this.opponentHand.active = true;
            
            // 设置位置
            this.opponentHand.setPosition(new Vec3(0, topY, 0));
            
            // 设置缩放以确保可见
            this.opponentHand.setScale(screenScale, screenScale, 1);
            
            // 确保所有子节点可见
            this.opponentHand.children.forEach(child => {
                child.active = true;
            });
            
            console.log(`Opponent hand area positioned at (0, ${topY}, 0)`);
        } else {
            console.error("Opponent hand area is null");
        }
    }

    // 更新指定场地的分数显示
    private updateAreaScoreLabel(areaIndex: number) {
        if (areaIndex >= 0 && areaIndex < this.areaScoreLabels.length) {
            const label = this.areaScoreLabels[areaIndex];
            if (label) {
                label.string = `分数: ${this.areaScores[areaIndex]}\n${this.areaScoreDetails[areaIndex]}`;
            }
        }
    }

    // 添加分数到指定场地
    public addScoreToArea(areaIndex: number, score: number, reason: string) {
        if (areaIndex >= 0 && areaIndex < this.areaScores.length) {
            this.areaScores[areaIndex] += score;
            this.areaScoreDetails[areaIndex] += `${reason}: +${score}\n`;
            this.updateAreaScoreLabel(areaIndex);
        }
    }

    // 计算并更新指定场地的分数
    public calculateAreaScore(areaIndex: number, cards: Card[]) {
        if (areaIndex < 0 || areaIndex >= this.playAreas.length) return;

        // 清空分数详情
        this.areaScoreDetails[areaIndex] = '';
        
        // 计算点数分数
        let pointScore = 0;
        cards.forEach(card => {
            const value = this.getCardValue(card.rank);
            pointScore += value;
        });
        this.addScoreToArea(areaIndex, pointScore, '点数');

        // 计算牌型分数
        if (this.isSequence(cards)) {
            this.addScoreToArea(areaIndex, 30, '顺子');
        }
        if (this.isSameColor(cards)) {
            this.addScoreToArea(areaIndex, 20, '同色');
        }

        // 应用场景效果
        this.sceneEffects[areaIndex]?.applyEffect(this, areaIndex);
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
} 