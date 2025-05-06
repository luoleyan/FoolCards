/**
 * @file GameManager.ts
 * @description 游戏管理器，负责游戏核心逻辑、回合管理、分数计算等功能
 * @author LuoLeYan
 * @copyright Copyright (c) 2025, LuoLeYan
 */

import { _decorator, Component, Node, director, instantiate, Prefab, resources, SpriteFrame, Sprite, UITransform, Vec3, Label, Button, Layout, Color, Graphics } from 'cc';
import { Card, CardSuit, CardRank } from './Card';
import { tween } from 'cc';
import { SpecialHandsManager, SpecialHandType } from './SpecialHands';
import { SceneEffect, SceneEffectType } from './SceneEffect';
import { PlatformAdapter } from './PlatformAdapter';
import { SpecialHandsPopup } from './SpecialHandsPopup';
import { GameOverPopup } from './GameOverPopup';
import { AIOpponent } from './AIOpponent';
const { ccclass, property } = _decorator;

/**
 * 游戏管理器类
 *
 * 负责整个游戏的核心逻辑，包括：
 * - 游戏初始化与配置
 * - 回合管理与计时
 * - 卡牌创建、发放与管理
 * - 玩家与AI对手交互
 * - 场地区域管理
 * - 分数计算与显示
 * - 特殊效果应用
 * - 游戏结束判定
 */
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

    @property(Node)
    private gameOverPopup: Node = null;  // 游戏结束弹窗

    private deck: Card[] = [];  // 牌堆
    private _currentRound: number = 0;
    private maxRounds: number = 5;  // 最大回合数
    private maxExchangeCount: number = 12;  // 最大换牌次数
    private _revealedEffects: number = 0;

    public specialHandsManager: SpecialHandsManager;
    private playerScore: number = 0;
    private opponentScore: number = 0;
    private areaScores: number[] = [0, 0, 0];  // 每个场地的玩家分数
    private areaScoreDetails: string[] = ['', '', ''];  // 每个场地的分数详情
    private aiAreaScores: number[] = [0, 0, 0];  // 每个场地的AI对手分数

    private sameColorRequirement: number = 5;  // 默认需要5张同色牌
    private sequenceRequirement: number = 5;   // 默认需要5张牌组成序列
    private skipSequenceEnabled: boolean = false;
    private hasSequenceBeenUsed: boolean = false;
    private hasSameColorBeenUsed: boolean = false;

    private extraPlayCount: number = 0;

    // 记录已翻开的场地区域
    private revealedAreas: boolean[] = [];

    // 记录玩家是否在每个区域出过牌
    private playerPlayedInArea: boolean[] = [];

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

    // AI机器人组件
    private aiOpponent: AIOpponent = null;

    private _exchangeCount: number = 12;  // 换牌次数

    /**
     * 组件启动时执行的初始化方法
     *
     * 负责初始化游戏的各个组件和状态，包括：
     * - 初始化场地区域状态
     * - 设置特殊牌型管理器
     * - 加载游戏背景
     * - 设置UI元素和事件监听
     * - 启动游戏计时器
     * - 初始化游戏场景布局
     */
    start() {
        // 初始化已翻开的场地区域数组
        this.revealedAreas = new Array(this.playAreas.length).fill(false);

        // 初始化玩家出牌区域跟踪数组
        this.playerPlayedInArea = new Array(this.playAreas.length).fill(false);

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
            // 先移除可能存在的旧事件监听器，防止重复绑定
            this.endTurnButton.node.off(Button.EventType.CLICK);

            // 重新绑定点击事件
            this.endTurnButton.node.on(Button.EventType.CLICK, this.onEndTurnButtonClicked, this);

            // 确保按钮可交互
            this.endTurnButton.interactable = true;

            console.log("结束回合按钮事件已绑定");
        } else {
            console.error("结束回合按钮未找到");
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

            // 初始化AI对手
            this.initAIOpponent();

            // 初始化场地高亮边框
            this.initPlayAreaHighlights();

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

    /**
     * 初始化游戏
     *
     * 负责游戏开始时的初始化工作：
     * - 重置换牌次数
     * - 预加载卡牌资源
     * - 创建并洗牌
     * - 发放初始手牌
     * - 设置初始回合
     * - 揭示第一个场景效果
     * @private
     */
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

    /**
     * 创建游戏牌堆
     *
     * 创建包含所有花色和点数的卡牌，以及大小王：
     * - 4种花色（黑桃、红桃、梅花、方块）
     * - 13种点数（A-K）
     * - 2张王牌（大王、小王）
     *
     * @private
     */
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

    /**
     * 洗牌方法
     *
     * 使用Fisher-Yates洗牌算法随机打乱牌堆中的卡牌顺序
     *
     * @private
     */
    private shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
        console.log("Deck shuffled");
    }

    /**
     * 发放初始手牌
     *
     * 负责游戏开始时向玩家和AI对手发放初始手牌：
     * - 计算卡牌尺寸和间距
     * - 设置手牌区域位置和大小
     * - 使用动画效果发牌
     * - 确保玩家和对手手牌正确显示
     *
     * @private
     */
    private dealInitialCards() {
        // 卡牌宽度（实际宽度乘以缩放比例）
        const cardWidth = 120 * 0.25;
        // 卡牌高度（实际高度乘以缩放比例）
        const cardHeight = 180 * 0.25;
        // 卡牌间距（设为卡牌宽度的150%，减小间距使排列更紧凑）
        const cardSpacing = cardWidth * 1.5;

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

    /**
     * 带动画效果的发牌方法
     *
     * 使用动画效果向玩家和AI对手交替发牌：
     * - 从牌堆中取出卡牌
     * - 设置卡牌初始位置和动画
     * - 交替给玩家和对手发牌
     * - 发牌完成后执行回调函数
     *
     * @param cardCount 每位玩家发牌数量
     * @param cardSpacing 卡牌间距
     * @param deckPosition 牌堆位置
     * @param onComplete 发牌完成后的回调函数
     * @private
     */
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

    /**
     * 给玩家发牌的动画
     *
     * 创建从牌堆到玩家手牌区的动画效果：
     * - 设置卡牌父节点为玩家手牌区
     * - 计算卡牌最终位置
     * - 创建自下而上的移动动画
     * - 动画完成后显示卡牌正面
     *
     * @param card 要发给玩家的卡牌
     * @param index 卡牌在手牌中的索引位置
     * @param cardSpacing 卡牌间距
     * @private
     */
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

    /**
     * 给AI对手发牌的动画
     *
     * 创建从牌堆到对手手牌区的动画效果：
     * - 设置卡牌父节点为对手手牌区
     * - 设置卡牌尺寸和位置
     * - 创建自上而下的移动动画
     * - 动画完成后显示卡牌背面
     *
     * @param card 要发给对手的卡牌
     * @param index 卡牌在手牌中的索引位置
     * @private
     */
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
        const spacing = cardWidth * 1.5; // 减小间距使排列更紧凑
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

    /**
     * 执行理牌动画
     *
     * 创建卡牌收拢和展开的动画效果：
     * - 获取玩家和对手的所有卡牌
     * - 记录卡牌原始位置
     * - 执行卡牌收拢到中心的动画
     * - 执行卡牌展开到原位的动画
     *
     * @param _cardSpacing 卡牌间距（未使用）
     * @private
     */
    private performShuffleAnimation(_cardSpacing: number) {
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

    /**
     * 卡牌收拢动画
     *
     * 创建所有卡牌向中心收拢的动画效果：
     * - 计算动画完成计数
     * - 设置中心位置
     * - 为玩家和对手的卡牌创建向中心移动的动画
     * - 所有卡牌动画完成后执行回调
     *
     * @param playerCards 玩家卡牌节点数组
     * @param opponentCards 对手卡牌节点数组
     * @param duration 动画持续时间
     * @param onComplete 动画完成后的回调函数
     * @private
     */
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

    /**
     * 卡牌展开动画
     *
     * 创建所有卡牌从中心展开到原始位置的动画效果：
     * - 为玩家卡牌创建展开动画
     * - 为对手卡牌创建展开动画
     * - 使用弹性缓动效果增强视觉效果
     *
     * @param playerCards 玩家卡牌节点数组
     * @param opponentCards 对手卡牌节点数组
     * @param originalPositions 卡牌原始位置的Map
     * @param duration 动画持续时间
     * @private
     */
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

    /**
     * 检查并处理特殊牌型
     *
     * 检查玩家和对手的卡牌是否构成特殊牌型，并计算相应分数：
     * - 使用特殊牌型管理器检查玩家卡牌
     * - 使用特殊牌型管理器检查对手卡牌
     * - 为特殊牌型添加相应分数
     *
     * @param playerCards 玩家卡牌数组
     * @param opponentCards 对手卡牌数组
     * @private
     */
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

    /**
     * 初始化场地高亮边框
     *
     * 为所有场地区域初始化高亮效果的基础设置：
     * - 遍历所有场地区域
     * - 确保场地区域可见
     * - 保存场地区域的原始颜色
     * - 为后续高亮效果做准备
     *
     * @private
     */
    private initPlayAreaHighlights() {
        console.log("初始化场地高亮边框 - 直接使用场地区域");

        // 不再使用场地高亮管理器
        // 遍历所有场地区域，确保它们有正确的组件
        for (let i = 0; i < this.playAreas.length; i++) {
            const playArea = this.playAreas[i];
            if (!playArea) continue;

            // 确保场地区域可见
            playArea.active = true;

            // 检查是否有Sprite组件
            const sprite = playArea.getComponent(Sprite);
            if (sprite) {
                // 保存原始颜色
                playArea['originalColor'] = sprite.color.clone();
                console.log(`场地${i+1}原始颜色已保存`);
            } else {
                console.log(`场地${i+1}没有Sprite组件`);
            }
        }
    }

    /**
     * 重置所有场地的高亮效果
     *
     * 移除所有场地区域的高亮效果：
     * - 遍历所有场地区域
     * - 调用移除高亮方法
     * - 恢复场地区域的原始外观
     *
     * @private
     */
    private resetAllPlayAreaHighlights() {
        console.log("重置所有场地的高亮效果");
        // 遍历所有场地区域
        for (let i = 0; i < this.playAreas.length; i++) {
            this.removeHighlightFromPlayArea(i);
        }
    }

    /**
     * 开始新回合
     *
     * 处理游戏新回合的开始逻辑：
     * - 检查是否达到最大回合数
     * - 更新回合计数
     * - 揭示新的场景效果
     * - 补充换牌次数
     * - 清除AI上一回合的内部记录
     * - 重置场地高亮效果
     * - 发放新回合的卡牌
     *
     * @public
     */
    public startNewRound() {
        // 检查是否达到最大回合数
        if (this._currentRound >= this.maxRounds) {
            console.log(`游戏结束，达到最大回合数：${this.maxRounds}`);
            this.showGameOver();
            return;
        }

        // 更新回合数
        this._currentRound++;
        console.log(`开始第 ${this._currentRound}/${this.maxRounds} 回合`);

        // 检查是否需要揭示新的场景效果
        if (this._currentRound <= 3 && this._revealedEffects < this._currentRound) {
            this.revealNextSceneEffect();
        }

        // 补充换牌次数
        this._exchangeCount = Math.min(this._exchangeCount + 2, this.maxExchangeCount);
        console.log(`新回合开始，当前换牌次数：${this._exchangeCount}`);

        // 更新换牌次数显示
        this.updateExchangeCountLabel();

        // 在新回合开始时，只清除AI机器人上一回合的内部记录
        // 但不清除显示的卡牌，让它们像玩家打出的牌一样常驻在场地上
        if (this.aiOpponent) {
            this.aiOpponent.clearPlayedCardsRecord();
        }

        // 重置所有场地的高亮效果
        this.resetAllPlayAreaHighlights();

        // 卡牌宽度（实际宽度乘以缩放比例）
        const cardWidth = 120 * 0.25;
        // 卡牌间距（设为卡牌宽度的150%，减小间距使排列更紧凑）
        const cardSpacing = cardWidth * 1.5;

        // 获取当前玩家和对手的卡牌数量
        const playerCardCount = this.playerHand.children.length;
        const opponentCardCount = this.opponentHand.children.length;

        // 牌桌中心位置（假设为坐标原点）
        const deckPosition = new Vec3(0, 0, 0);

        // 动画发牌，每人发2张牌
        this.dealNewRoundCardsWithAnimation(playerCardCount, opponentCardCount, cardSpacing, deckPosition);
    }

    /**
     * 新回合带动画发牌
     *
     * 在新回合开始时向玩家和AI对手发放卡牌：
     * - 交替给玩家和对手发牌
     * - 考虑已有卡牌的位置
     * - 使用动画效果
     * - 发牌完成后检查特殊牌型
     *
     * @param playerStartIndex 玩家手牌起始索引
     * @param opponentStartIndex 对手手牌起始索引
     * @param cardSpacing 卡牌间距
     * @param deckPosition 牌堆位置
     * @private
     */
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

    /**
     * 换牌方法
     *
     * 处理玩家换牌的逻辑：
     * - 检查是否还有换牌次数
     * - 减少换牌次数
     * - 从牌堆中随机抽取新牌
     * - 将旧牌放回牌堆
     * - 播放换牌动画
     * - 重新排列手牌
     *
     * @param card 要换掉的卡牌
     * @public
     */
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

    /**
     * 播放换牌动画
     *
     * 创建新卡牌从牌堆到玩家手牌的动画效果：
     * - 设置卡牌初始位置
     * - 计算最终位置
     * - 创建移动动画
     *
     * @param newCard 新抽取的卡牌
     * @param index 卡牌在手牌中的索引位置
     * @private
     */
    private playExchangeAnimation(newCard: Card, index: number) {
        // 设置卡牌初始位置（在牌堆位置）
        newCard.node.setPosition(0, 0, 0);
        newCard.node.active = true;

        // 计算最终位置
        const cardWidth = 120 * 0.25;
        const cardSpacing = cardWidth * 1.5; // 减小间距使排列更紧凑
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

    /**
     * 返回主菜单
     *
     * 加载主菜单场景，退出当前游戏
     *
     * @public
     */
    public returnToMainMenu() {
        director.loadScene('MainMenu');
    }

    /**
     * 初始化场景效果
     *
     * 为游戏场地区域随机选择并初始化场景效果：
     * - 定义所有可用的场景效果类型
     * - 随机选择三个不同的效果
     * - 清空现有的场景效果
     * - 为每个场地区域创建场景效果
     *
     * @private
     */
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

    /**
     * 揭示下一个场景效果
     *
     * 揭示并应用下一个场景效果：
     * - 检查是否已揭示所有效果
     * - 获取下一个要揭示的效果
     * - 调用效果的揭示方法
     * - 应用场景效果
     *
     * @private
     */
    private revealNextSceneEffect() {
        // 检查是否已经揭示了所有效果
        if (this._revealedEffects >= this.sceneEffects.length) {
            console.log("所有场景效果已揭示");
            return;
        }

        // 获取下一个要揭示的效果
        const effect = this.sceneEffects[this._revealedEffects];

        // 检查效果是否有效
        if (!effect) {
            console.error(`场景效果 ${this._revealedEffects} 不存在`);
            return;
        }

        try {
            // 揭示效果
            effect.reveal();
            this._revealedEffects++;
            console.log(`揭示场景效果 ${this._revealedEffects}/${this.sceneEffects.length}`);

            // 应用场景效果
            effect.applyEffect(this, this._revealedEffects - 1);
        } catch (error) {
            console.error("揭示场景效果时发生错误:", error);
        }
    }

    /**
     * 获取当前生效的场景效果
     *
     * 返回所有已揭示的场景效果
     *
     * @returns 已揭示的场景效果数组
     * @public
     */
    public getActiveSceneEffects(): SceneEffect[] {
        return this.sceneEffects.filter(effect => effect.isRevealed);
    }

    /**
     * 设置同色牌型所需卡牌数量
     *
     * @param count 所需卡牌数量
     * @public
     */
    public setSameColorRequirement(count: number) {
        this.sameColorRequirement = count;
    }

    /**
     * 设置顺子牌型所需卡牌数量
     *
     * @param count 所需卡牌数量
     * @public
     */
    public setSequenceRequirement(count: number) {
        this.sequenceRequirement = count;
    }

    /**
     * 启用或禁用跳点顺子
     *
     * @param enabled 是否启用跳点顺子
     * @public
     */
    public enableSkipSequence(enabled: boolean) {
        this.skipSequenceEnabled = enabled;
    }

    /**
     * 检查卡牌是否构成顺子
     *
     * 根据当前游戏规则检查卡牌是否构成顺子：
     * - 检查卡牌数量是否满足要求
     * - 将卡牌按点数排序
     * - 根据是否允许跳顺进行不同的检查
     * - 普通顺子要求完全连续
     * - 跳顺允许最多跳过一个点数
     *
     * @param cards 要检查的卡牌数组
     * @returns 是否构成顺子
     * @public
     */
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

    /**
     * 检查卡牌是否构成同花
     *
     * 检查卡牌是否都是同一花色：
     * - 检查卡牌数组是否有效
     * - 过滤掉无效的卡牌
     * - 检查有效卡牌数量是否满足要求
     * - 检查所有卡牌是否都是同一花色
     *
     * @param cards 要检查的卡牌数组
     * @returns 是否构成同花
     * @public
     */
    public isSameColor(cards: Card[]): boolean {
        if (!cards || cards.length === 0) return false;  // 添加空数组检查

        // 过滤掉无效的卡牌
        const validCards = cards.filter(card => card && card.suit);
        if (validCards.length < this.sameColorRequirement) return false;

        const firstSuit = validCards[0].suit;
        return validCards.every(card => card.suit === firstSuit);
    }

    /**
     * 检查卡牌是否构成有效牌型
     *
     * 检查卡牌是否构成顺子或同花
     *
     * @param cards 要检查的卡牌数组
     * @returns 是否构成有效牌型
     * @public
     */
    public hasValidType(cards: Card[]): boolean {
        return this.isSequence(cards) || this.isSameColor(cards);
    }

    /**
     * 检查是否是首次构成顺子
     *
     * 检查卡牌是否构成顺子且之前未使用过顺子牌型
     *
     * @param cards 要检查的卡牌数组
     * @returns 是否是首次构成顺子
     * @public
     */
    public isFirstSequence(cards: Card[]): boolean {
        return this.isSequence(cards) && !this.hasSequenceBeenUsed;
    }

    /**
     * 检查是否是首次构成同花
     *
     * 检查卡牌是否构成同花且之前未使用过同花牌型
     *
     * @param cards 要检查的卡牌数组
     * @returns 是否是首次构成同花
     * @public
     */
    public isFirstSameColor(cards: Card[]): boolean {
        return this.isSameColor(cards) && !this.hasSameColorBeenUsed;
    }

    /**
     * 检查玩家是否领先
     *
     * 比较玩家和对手的分数，判断玩家是否领先
     *
     * @returns 玩家是否领先
     * @public
     */
    public isPlayerLeading(): boolean {
        return this.playerScore > this.opponentScore;
    }

    /**
     * 为玩家抽取额外卡牌
     *
     * 从牌堆中抽取一张卡牌并添加到玩家手牌
     *
     * @public
     */
    public drawExtraCard() {
        if (this.deck.length > 0) {
            const card = this.deck.pop();
            this.playerHand.addChild(card.node);
            this.arrangePlayerHand();
        }
    }

    /**
     * 增加换牌次数
     *
     * 增加玩家的换牌次数，但不超过最大换牌次数
     *
     * @param count 要增加的换牌次数
     * @public
     */
    public addExchangeCount(count: number) {
        this._exchangeCount = Math.min(this._exchangeCount + count, this.maxExchangeCount);
        this.updateExchangeCountLabel();
    }

    /**
     * 获取玩家手牌
     *
     * 返回玩家手牌区域中的所有卡牌
     *
     * @returns 玩家手牌数组
     * @public
     */
    public getPlayerHandCards(): Card[] {
        return this.playerHand.children.map(node => node.getComponent(Card));
    }

    /**
     * 玩家出牌方法
     *
     * 处理玩家出牌的核心逻辑：
     * - 检查卡牌和场地是否有效
     * - 获取场地效果和公共牌信息
     * - 创建卡牌容器并设置位置
     * - 记录出牌信息
     * - 计算场地分数
     * - 重新排列场地卡牌
     *
     * @param card 要打出的卡牌
     * @param areaIndex 目标场地索引
     * @public
     */
    public playCard(card: Card, areaIndex: number) {
        console.log('=================== 出牌日志开始 ===================');
        console.log('playCard 方法被调用');
        console.log('参数检查：', { areaIndex, card: card ? '有效' : '无效' });

        // 检查卡牌是否有效
        if (!card) {
            console.error("无效的卡牌对象");
            return;
        }

        // 检查卡牌节点是否有效
        if (!card.node) {
            console.error("卡牌节点不存在");
            return;
        }

        // 检查场地索引是否有效
        if (areaIndex < 0 || areaIndex >= this.playAreas.length) {
            console.error("无效的场地索引");
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

    /**
     * 增加额外出牌次数
     *
     * 增加玩家在当前回合的额外出牌次数
     *
     * @param count 要增加的出牌次数
     * @public
     */
    public addExtraPlayCount(count: number) {
        this.extraPlayCount += count;
    }

    /**
     * 玩家抽牌
     *
     * 从牌堆中抽取一张卡牌并添加到玩家手牌
     *
     * @public
     */
    public drawCard() {
        if (this.deck.length > 0) {
            const card = this.deck.pop();
            this.playerHand.addChild(card.node);
            this.arrangePlayerHand();
        }
    }

    /**
     * 更新换牌次数显示
     *
     * 更新UI上的换牌次数标签
     *
     * @private
     */
    private updateExchangeCountLabel() {
        if (this.exchangeCountLabel) {
            this.exchangeCountLabel.string = `换牌次数: ${this._exchangeCount}`;
        }
    }

    /**
     * 重新排列玩家手牌
     *
     * 调整玩家手牌的位置和显示：
     * - 获取所有卡牌并保持原有顺序
     * - 计算卡牌间距和位置
     * - 设置每张卡牌的位置
     * - 确保卡牌显示正面
     *
     * @public
     */
    public arrangePlayerHand() {
        const playerHand = this.playerHand;
        if (!playerHand) return;

        // 获取所有卡牌并保持原有顺序
        const cards = [...playerHand.children];

        // 计算卡牌间距
        const cardWidth = 120 * 0.25; // 卡牌宽度（考虑缩放）
        const spacing = cardWidth * 1.5; // 卡牌间距（设为卡牌宽度的150%，减小间距使排列更紧凑）
        const totalWidth = (cards.length - 1) * spacing;
        const startX = -totalWidth / 2;

        // 按照原有顺序排列卡牌
        cards.forEach((cardNode, index) => {
            const card = cardNode.getComponent(Card);
            if (card) {
                // 设置卡牌位置
                const x = startX + index * spacing;
                cardNode.setPosition(x, 0, 0);

                // 确保卡牌显示正面，并处理可能的错误
                card.showCardFace().catch(error => {
                    console.warn(`显示卡牌正面时出错: ${error.message}`);
                    // 错误已被记录，不需要进一步处理
                });
            }
        });

        // 确保玩家手牌区域可见
        playerHand.active = true;
    }

    /**
     * 重新排列场地区域的卡牌
     *
     * 调整场地区域中公共牌和玩家打出的牌的位置：
     * - 分别获取公共牌和玩家打出的牌
     * - 计算卡牌间距和位置
     * - 公共牌放在中间位置
     * - 玩家打出的牌放在底部
     *
     * @param playArea 要排列的场地区域节点
     * @public
     */
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
        const cardSpacingFactor = 0.2; // 减小场地区域卡牌间距
        const publicTotalWidth = (publicCards.length - 1) * (cardWidth * 0.25 + spacing * cardSpacingFactor);
        const publicStartX = -publicTotalWidth / 2;
        publicCards.forEach((container, index) => {
            const x = publicStartX + index * (cardWidth * 0.25 + spacing * cardSpacingFactor);
            container.setPosition(new Vec3(x, 0, 0)); // 公共牌放在中间位置
        });

        // 排列玩家打出的牌
        const playerTotalWidth = (playerCards.length - 1) * (cardWidth * 0.25 + spacing * cardSpacingFactor);
        const playerStartX = -playerTotalWidth / 2;
        playerCards.forEach((container, index) => {
            const x = playerStartX + index * (cardWidth * 0.25 + spacing * cardSpacingFactor);
            container.setPosition(new Vec3(x, bottomY, 0)); // 玩家牌放在底部
        });
    }

    /**
     * 适配不同平台
     *
     * 根据平台调整游戏UI元素的大小和位置：
     * - 获取平台适配器实例
     * - 获取屏幕缩放比例
     * - 调整卡牌大小
     * - 调整出牌区域
     * - 调整交换区域
     *
     * @private
     */
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

    /**
     * 设置换牌区域位置
     *
     * 计算并设置换牌区域的位置：
     * - 获取背景和换牌区域的尺寸
     * - 计算屏幕尺寸
     * - 设置换牌区域的缩放和位置
     * - 确保换牌区域可见
     *
     * @private
     */
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

    /**
     * 设置UI元素位置
     *
     * 计算并设置结束回合按钮和计时器的位置：
     * - 获取背景尺寸
     * - 设置结束回合按钮位置
     * - 设置计时器位置
     * - 确保UI元素可见
     *
     * @private
     */
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

                // 获取计时器高度用于定位
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

    /**
     * 设置场地区域位置
     *
     * 计算并设置三个场地区域的位置：
     * - 检查场地区域数量
     * - 获取屏幕缩放比例
     * - 计算场地区域间距和位置
     * - 设置场地区域位置和可见性
     *
     * @private
     */
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

    /**
     * 计算并更新指定场地的分数
     *
     * 计算玩家在指定场地的分数：
     * - 检查场地索引是否有效
     * - 检查玩家是否在该区域出过牌
     * - 获取场地中的所有卡牌
     * - 计算基础点数分数
     * - 计算牌型分数
     * - 应用场景效果加分
     * - 更新分数显示
     *
     * @param areaIndex 要计算分数的场地索引
     * @public
     */
    public calculateAreaScore(areaIndex: number) {
        if (areaIndex < 0 || areaIndex >= this.playAreas.length) return;

        const playArea = this.playAreas[areaIndex];
        if (!playArea) return;

        // 检查玩家是否在该区域出过牌，如果没有则不计算分数
        if (!this.playerPlayedInArea[areaIndex]) {
            // 重置该区域的分数和详情
            this.areaScores[areaIndex] = 0;
            this.areaScoreDetails[areaIndex] = '';
            // 更新分数显示
            this.updateAreaScoreLabel(areaIndex);
            return;
        }

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

    // 注释掉未使用的方法，如果将来需要可以取消注释
    /*
    // 重新计算场地区域的分数和牌型
    private recalculateAreaScoreAndHandType(areaIndex: number) {
        // 直接调用calculateAreaScore方法进行完整的分数计算
        this.calculateAreaScore(areaIndex);
    }
    */

    /**
     * 更新指定场地的分数显示
     *
     * 创建和更新场地分数显示UI：
     * - 检查场地索引是否有效
     * - 获取或创建分数显示容器
     * - 设置容器大小和位置
     * - 解析分数详情
     * - 创建分数项显示
     *
     * @param areaIndex 要更新分数显示的场地索引
     * @private
     */
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

    /**
     * 添加分数到指定场地
     *
     * 增加指定场地的分数并记录分数来源：
     * - 检查场地索引是否有效
     * - 增加场地分数
     * - 添加分数详情记录
     *
     * @param areaIndex 要添加分数的场地索引
     * @param score 要添加的分数
     * @param reason 分数来源原因
     * @public
     */
    public addScoreToArea(areaIndex: number, score: number, reason: string) {
        if (areaIndex >= 0 && areaIndex < this.areaScores.length) {
            this.areaScores[areaIndex] += score;
            // 添加换行确保每个原因单独一行
            this.areaScoreDetails[areaIndex] += `${reason}: +${score}\n`;
        }
    }

    /**
     * 获取卡牌点数
     *
     * 根据卡牌等级返回对应的点数值：
     * - A返回1点
     * - 数字牌返回对应数字
     * - J返回11点
     * - Q返回12点
     * - K返回13点
     *
     * @param rank 卡牌等级
     * @returns 卡牌点数值
     * @private
     */
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

    /**
     * 增加玩家总分
     *
     * 增加玩家的总分数
     *
     * @param score 要增加的分数
     * @public
     */
    public addScore(score: number) {
        this.playerScore += score;
    }

    /**
     * 增加对手总分
     *
     * 增加AI对手的总分数
     *
     * @param score 要增加的分数
     * @public
     */
    public addScoreToOtherAreas(score: number) {
        this.opponentScore += score;
    }

    /**
     * 返回主界面按钮点击事件处理
     *
     * 处理返回按钮点击事件，加载主菜单场景
     *
     * @private
     */
    private onBackButtonClicked() {
        // 切换到主菜单场景
        director.loadScene('MainMenu');
    }

    /**
     * 显示特殊牌型说明弹窗
     *
     * 显示特殊牌型说明弹窗，介绍游戏中的特殊牌型规则
     *
     * @private
     */
    private showSpecialHandsPopup() {
        if (this.specialHandsPopup) {
            const popup = this.specialHandsPopup.getComponent(SpecialHandsPopup);
            if (popup) {
                popup.showPopup();
            }
        }
    }

    /**
     * 检查场地区域是否已经翻开
     *
     * 检查指定场地区域是否已经被翻开
     *
     * @param areaIndex 要检查的场地索引
     * @returns 场地是否已翻开
     * @public
     */
    public isPlayAreaRevealed(areaIndex: number): boolean {
        return this.revealedAreas[areaIndex] === true;
    }

    /**
     * 标记场地区域为已翻开
     *
     * 将指定场地区域标记为已翻开状态：
     * - 检查场地索引是否有效
     * - 更新场地翻开状态
     * - 更新UI显示
     *
     * @param areaIndex 要标记的场地索引
     * @public
     */
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

    /**
     * 检查是否可以放置卡牌到未翻开的区域
     *
     * 根据游戏规则检查是否允许玩家将卡牌放置到未翻开的场地区域
     *
     * @returns 是否允许放置到未翻开区域
     * @public
     */
    public canPlayToUnrevealedArea(): boolean {
        // 这里可以实现游戏规则，比如：
        // 1. 第一张卡牌可以放在任何区域
        // 2. 或者特定条件下允许放在未翻开区域
        return true; // 默认允许
    }

    /**
     * 检查是否还能出牌
     *
     * 检查玩家在当前回合是否还能出牌：
     * - 如果有额外出牌次数，可以出牌
     * - 否则检查是否达到每回合出牌限制
     *
     * @returns 是否还能出牌
     * @public
     */
    public canPlayCard(): boolean {
        // 如果有额外出牌次数，返回true
        if (this.extraPlayCount > 0) {
            return true;
        }
        // 否则检查是否达到每回合出牌限制
        return this.cardsPlayedThisTurn < this.maxCardsPerTurn;
    }

    /**
     * 记录出牌
     *
     * 记录玩家打出的卡牌信息：
     * - 更新出牌次数计数
     * - 记录当前回合打出的牌
     * - 标记玩家已在该区域出牌
     * - 添加卡牌点击事件监听器
     *
     * @param card 打出的卡牌
     * @param areaIndex 打出到的场地索引
     * @public
     */
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

        // 标记玩家已在该区域出牌
        this.playerPlayedInArea[areaIndex] = true;

        // 添加点击事件监听器
        card.node.on(Node.EventType.TOUCH_START, () => {
            this.onCardClicked(card, areaIndex);
        });
    }

    /**
     * 处理卡牌点击事件
     *
     * 处理玩家点击已打出卡牌的事件：
     * - 检查是否是当前回合打出的牌
     * - 如果是，则回收卡牌
     *
     * @param card 被点击的卡牌
     * @param areaIndex 卡牌所在的场地索引
     * @private
     */
    private onCardClicked(card: Card, areaIndex: number) {
        // 检查是否是当前回合打出的牌
        const playedCards = this.currentTurnPlayedCards.get(areaIndex);
        if (playedCards && playedCards.includes(card)) {
            this.retrieveCard(card, areaIndex);
        }
    }

    /**
     * 回收卡牌
     *
     * 将已打出的卡牌回收到玩家手牌：
     * - 获取卡牌容器节点
     * - 重置卡牌变换
     * - 从场地区域移除卡牌
     * - 删除空的容器节点
     * - 更新出牌记录
     * - 将卡牌添加回玩家手牌
     * - 重新计算场地分数
     *
     * @param card 要回收的卡牌
     * @param areaIndex 卡牌所在的场地索引
     * @private
     */
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

        // 检查该区域是否还有玩家出的牌
        const remainingPlayerCards = this.playAreas[areaIndex].children
            .filter(child => child.name === 'PlayerCard')
            .length;

        // 如果没有玩家出的牌了，标记该区域为未出牌
        if (remainingPlayerCards === 0) {
            this.playerPlayedInArea[areaIndex] = false;
        }

        // 重新计算场地区域的分数
        this.calculateAreaScore(areaIndex);

        // 重新排列场地区域的卡牌
        this.arrangePlayArea(this.playAreas[areaIndex]);

        // 减少出牌次数
        this.cardsPlayedThisTurn--;
    }

    /**
     * 重置回合状态
     *
     * 重置玩家在当前回合的出牌状态：
     * - 重置已出牌数量
     * - 重置额外出牌次数
     * - 清空当前回合打出的牌记录
     * - 保留AI出牌记录以便展示
     *
     * @public
     */
    public resetCardPlayCount(): void {
        this.cardsPlayedThisTurn = 0;
        this.extraPlayCount = 0;
        this.currentTurnPlayedCards.clear(); // 清空当前回合打出的牌记录

        // 不清除AI出牌记录，因为需要在回合结束时展示
        // 在startNewRound方法中会清除AI出牌记录
    }

    /**
     * 更新计时器显示
     *
     * 根据剩余时间更新UI上的计时器显示：
     * - 计算分钟和秒数
     * - 格式化时间字符串
     * - 更新计时器标签
     *
     * @private
     */
    private updateTimerDisplay() {
        if (this.timerLabel) {
            const minutes = Math.floor(this.remainingTime / 60);
            const seconds = this.remainingTime % 60;
            // 使用三元运算符来添加前导零
            const secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
            this.timerLabel.string = `${minutes}:${secondsStr}`;
        }
    }

    /**
     * 开始回合计时器
     *
     * 启动回合计时器，每秒更新一次：
     * - 设置计时器状态为运行中
     * - 每秒调用一次updateTimer方法
     *
     * @private
     */
    private startTurnTimer() {
        this.isTimerRunning = true;
        this.schedule(this.updateTimer, 1);
    }

    /**
     * 停止回合计时器
     *
     * 停止回合计时器：
     * - 设置计时器状态为停止
     * - 取消计时器回调
     *
     * @private
     */
    private stopTurnTimer() {
        this.isTimerRunning = false;
        this.unschedule(this.updateTimer);
    }

    /**
     * 更新计时器
     *
     * 每秒更新回合计时器：
     * - 减少剩余时间
     * - 确保时间不为负数
     * - 更新计时器显示
     * - 检查是否时间归零
     * - 时间归零时自动结束回合
     *
     * @private
     */
    private updateTimer() {
        if (!this.isTimerRunning) return;

        this.remainingTime--;

        // 确保时间不会变成负数
        if (this.remainingTime < 0) {
            this.remainingTime = 0;
        }

        this.updateTimerDisplay();

        if (this.remainingTime <= 0) {
            console.log("计时器归零，结束回合");
            // 停止计时器，防止多次调用endTurn
            this.stopTurnTimer();
            // 结束回合
            this.endTurn();
        }
    }

    /**
     * 初始化AI对手
     *
     * 初始化游戏的AI对手组件：
     * - 检查是否已有AI对手组件
     * - 如果没有则添加AI对手组件
     * - 检查必要的节点引用
     * - 初始化AI对手的游戏环境
     *
     * @private
     */
    private initAIOpponent() {
        console.log("开始初始化AI对手");

        // 检查是否已经有AI对手组件
        this.aiOpponent = this.getComponent(AIOpponent);
        if (!this.aiOpponent) {
            // 如果没有，添加AI对手组件
            this.aiOpponent = this.addComponent(AIOpponent);
            console.log("添加了AIOpponent组件");
        }

        // 检查对手手牌区域和场地区域是否存在
        if (!this.opponentHand) {
            console.error("对手手牌区域未设置");
            return;
        }

        if (!this.playAreas || this.playAreas.length === 0) {
            console.error("场地区域未设置或为空");
            return;
        }

        console.log(`对手手牌区域: ${this.opponentHand.name}, 场地区域数量: ${this.playAreas.length}`);

        // 初始化AI对手
        this.aiOpponent.init(this, this.opponentHand, this.playAreas);
        console.log("AI对手初始化完成");
    }

    /**
     * 计算AI对手在指定场地的分数
     *
     * 计算AI对手在指定场地的分数：
     * - 获取AI在该区域出的牌
     * - 获取场地中的公共牌
     * - 计算基础点数分数
     * - 检查特殊牌型并计算分数
     * - 应用场景效果加分
     *
     * @param areaIndex 要计算分数的场地索引
     * @returns 计算得到的分数
     * @private
     */
    private calculateAIAreaScore(areaIndex: number): number {
        if (!this.aiOpponent) return 0;

        // 获取该区域的AI卡牌
        const aiPlayedCards = this.aiOpponent.getPlayedCards();
        const areaCards = aiPlayedCards.get(areaIndex) || [];

        // 如果AI没有在该区域出牌，则不计算分数
        if (areaCards.length === 0) return 0;

        // 获取场地中的公共牌
        const sceneEffect = this.sceneEffects[areaIndex];
        const publicCards = sceneEffect && sceneEffect.isRevealed ? sceneEffect.publicCards : [];

        // 合并AI出的牌和公共牌
        const allCards = [...publicCards, ...areaCards];

        // 计算基础点数
        let areaScore = 0;
        allCards.forEach(card => {
            areaScore += this.getCardValue(card.rank);
        });

        // 检查是否有特殊牌型
        const specialHand = this.specialHandsManager.checkSpecialHand(allCards);
        if (specialHand) {
            // 根据特殊牌型类型添加分数
            switch (specialHand.type) {
                case SpecialHandType.ROYAL_FLUSH:
                    areaScore += 150;
                    break;
                case SpecialHandType.PERFECT_STRAIGHT:
                    areaScore += 135;
                    break;
                case SpecialHandType.STRAIGHT_FLUSH:
                    areaScore += 120;
                    break;
                case SpecialHandType.FOUR_OF_A_KIND:
                    areaScore += 80;
                    break;
                case SpecialHandType.FLUSH:
                    areaScore += 60;
                    break;
                case SpecialHandType.STRAIGHT:
                    areaScore += 60;
                    break;
                case SpecialHandType.FULL_HOUSE:
                    areaScore += 55;
                    break;
                case SpecialHandType.THREE_OF_A_KIND:
                    areaScore += 30;
                    break;
                case SpecialHandType.TWO_PAIRS:
                    areaScore += 30;
                    break;
                case SpecialHandType.PAIR:
                    areaScore += 15;
                    break;
            }
        }

        // 应用场景效果（如果有）
        if (sceneEffect && sceneEffect.isRevealed) {
            // 根据场景效果类型添加额外分数
            // 这里只处理简单的花色和点数奖励，复杂的效果在applyEffect方法中处理
            const effectType = sceneEffect.effectType;

            // 处理花色奖励
            if (effectType === SceneEffectType.HeartBonus) {
                allCards.forEach(card => {
                    if (card.suit === CardSuit.Heart) {
                        areaScore += 15; // 红桃奖励
                    }
                });
            } else if (effectType === SceneEffectType.SpadeBonus) {
                allCards.forEach(card => {
                    if (card.suit === CardSuit.Spade) {
                        areaScore += 15; // 黑桃奖励
                    }
                });
            } else if (effectType === SceneEffectType.DiamondBonus) {
                allCards.forEach(card => {
                    if (card.suit === CardSuit.Diamond) {
                        areaScore += 15; // 方块奖励
                    }
                });
            } else if (effectType === SceneEffectType.ClubBonus) {
                allCards.forEach(card => {
                    if (card.suit === CardSuit.Club) {
                        areaScore += 15; // 梅花奖励
                    }
                });
            }

            // 处理点数奖励
            else if (effectType === SceneEffectType.EvenBonus) {
                allCards.forEach(card => {
                    if ([CardRank.Two, CardRank.Four, CardRank.Six, CardRank.Eight, CardRank.Ten].indexOf(card.rank) !== -1) {
                        areaScore += 15; // 偶数奖励
                    }
                });
            } else if (effectType === SceneEffectType.OddBonus) {
                allCards.forEach(card => {
                    if ([CardRank.Ace, CardRank.Three, CardRank.Five, CardRank.Seven, CardRank.Nine].indexOf(card.rank) !== -1) {
                        areaScore += 15; // 奇数奖励
                    }
                });
            } else if (effectType === SceneEffectType.JQKBonus) {
                allCards.forEach(card => {
                    if ([CardRank.Jack, CardRank.Queen, CardRank.King].indexOf(card.rank) !== -1) {
                        areaScore += 15; // JQK奖励
                    }
                });
            } else if (effectType === SceneEffectType.A2358Bonus) {
                allCards.forEach(card => {
                    if ([CardRank.Ace, CardRank.Two, CardRank.Three, CardRank.Five, CardRank.Eight].indexOf(card.rank) !== -1) {
                        areaScore += 15; // A2358奖励
                    }
                });
            } else if (effectType === SceneEffectType.KBonus) {
                allCards.forEach(card => {
                    if (card.rank === CardRank.King) {
                        areaScore += 25; // K奖励
                    }
                });
            }

            // 处理特殊牌型奖励
            else if (effectType === SceneEffectType.EvenStarBonus) {
                // 检查是否有特殊牌型
                if (specialHand && specialHand.type === SpecialHandType.PAIR) {
                    areaScore += 15; // 对子奖励
                }
                // 检查是否包含偶数牌（2、4、6、8、10）
                const hasEvenCard = allCards.some(card =>
                    [CardRank.Two, CardRank.Four, CardRank.Six, CardRank.Eight, CardRank.Ten].indexOf(card.rank) !== -1);
                if (hasEvenCard) {
                    areaScore += 15; // 偶数牌奖励
                }
            }
        }

        return areaScore;
    }

    /**
     * 比较场地分数并添加高亮效果
     *
     * 比较玩家和AI在各场地的分数，为玩家得分高的场地添加高亮效果：
     * - 遍历所有已揭示效果的场地
     * - 获取玩家和AI在该场地的分数
     * - 比较分数并决定是否添加高亮
     * - 记录需要高亮的场地
     *
     * @private
     */
    private compareAreaScoresAndHighlight() {
        console.log("=================== 回合结束场地分数比较 ===================");
        console.log("比较场地分数并添加高亮效果");

        // 记录需要高亮的场地
        const highlightedAreas: number[] = [];

        // 遍历所有已揭示效果的场地
        for (let i = 0; i < this.playAreas.length; i++) {
            // 检查场地效果是否已揭示
            if (this.sceneEffects[i] && this.sceneEffects[i].isRevealed) {
                // 获取场地效果信息
                const effectInfo = this.getEffectInfo(this.sceneEffects[i].effectType);

                // 获取玩家和AI在该场地的分数
                const playerScore = this.playerPlayedInArea[i] ? this.areaScores[i] : 0;
                const aiScore = this.aiAreaScores[i];

                console.log(`场地${i+1} (${effectInfo.name}) - 玩家: ${playerScore}分 (已出牌: ${this.playerPlayedInArea[i]}), AI: ${aiScore}分`);

                // 如果玩家分数大于AI分数，添加高亮效果
                if (playerScore > 0 && playerScore > aiScore) {
                    console.log(`场地${i+1}玩家分数大于AI，添加高亮效果`);
                    this.addHighlightToPlayArea(i);
                    highlightedAreas.push(i+1); // 记录需要高亮的场地编号（从1开始）
                } else {
                    console.log(`场地${i+1}玩家分数不大于AI，移除高亮效果`);
                    this.removeHighlightFromPlayArea(i);
                }
            } else {
                console.log(`场地${i+1}效果未揭示，不比较分数`);
            }
        }

        // 输出需要高亮的场地总结
        if (highlightedAreas.length > 0) {
            console.log(`本回合需要高亮的场地: ${highlightedAreas.join(', ')}`);
        } else {
            console.log("本回合没有需要高亮的场地");
        }

        console.log("=================== 回合结束场地分数比较 ===================");
    }

    /**
     * 为场地添加高亮边框和阴影
     *
     * 为指定场地添加高亮效果：
     * - 检查场地是否存在
     * - 保存场地原始颜色
     * - 设置高亮颜色（青绿色 #39C5BB）
     * - 如果没有Sprite组件，创建边框
     * - 添加脉动动画效果
     *
     * @param areaIndex 要添加高亮的场地索引
     * @private
     */
    private addHighlightToPlayArea(areaIndex: number) {
        const playArea = this.playAreas[areaIndex];
        if (!playArea) return;

        console.log(`为场地${areaIndex+1}添加高亮效果 - 直接修改背景颜色`);

        // 保存原始颜色（如果尚未保存）
        if (!playArea['originalColor']) {
            // 获取场地区域的背景颜色
            const originalColor = playArea.getComponent(Sprite)?.color || new Color(100, 100, 100, 255);
            playArea['originalColor'] = originalColor.clone();
        }

        // 设置高亮颜色 - 青绿色 (#39C5BB)
        const sprite = playArea.getComponent(Sprite);
        if (sprite) {
            sprite.color = new Color(57, 197, 187, 255);
            console.log(`场地${areaIndex+1}背景颜色已修改为高亮色`);
        } else {
            console.log(`场地${areaIndex+1}没有Sprite组件，尝试添加边框`);

            // 如果没有Sprite组件，尝试添加边框
            console.log(`为场地${areaIndex+1}创建边框`);

            // 移除旧的边框（如果存在）
            let borderNode = playArea.getChildByName('HighlightBorder');
            if (borderNode) {
                borderNode.destroy();
            }

            // 创建新的边框节点
            borderNode = new Node('HighlightBorder');
            playArea.addChild(borderNode);

            // 确保边框在最底层显示
            borderNode.setSiblingIndex(0);

            // 添加UITransform组件
            const areaTransform = playArea.getComponent(UITransform);
            if (areaTransform) {
                const borderTransform = borderNode.addComponent(UITransform);
                // 边框与场地区域大小相同
                borderTransform.setContentSize(
                    areaTransform.width,
                    areaTransform.height
                );

                // 添加Graphics组件来绘制边框
                const graphics = borderNode.addComponent(Graphics);

                // 设置线条颜色为青绿色 (#39C5BB)
                graphics.strokeColor = new Color(57, 197, 187, 255);
                graphics.fillColor = new Color(57, 197, 187, 50); // 半透明填充

                // 设置线条宽度
                graphics.lineWidth = 10;

                // 绘制矩形边框
                const x = -areaTransform.width / 2;
                const y = -areaTransform.height / 2;
                const width = areaTransform.width;
                const height = areaTransform.height;

                graphics.rect(x, y, width, height);
                graphics.stroke();
                graphics.fill();

                console.log(`创建了边框，尺寸: ${width}x${height}`);

                // 确保边框可见
                borderNode.active = true;
            }
        }

        // 添加脉动动画
        this.addPulsingAnimation(playArea);
    }

    /**
     * 添加脉动动画
     *
     * 为节点添加缩放脉动动画效果：
     * - 停止可能已存在的动画
     * - 重置节点缩放
     * - 创建循环的缩放动画
     *
     * @param node 要添加动画的节点
     * @private
     */
    private addPulsingAnimation(node: Node) {
        // 停止可能已经存在的动画
        tween(node).stop();

        // 重置缩放
        node.scale = new Vec3(1, 1, 1);

        // 创建脉动动画
        tween(node)
            .to(0.5, { scale: new Vec3(1.05, 1.05, 1) })
            .to(0.5, { scale: new Vec3(1, 1, 1) })
            .union()
            .repeatForever()
            .start();
    }

    /**
     * 移除场地的高亮效果
     *
     * 移除指定场地的高亮效果：
     * - 停止动画
     * - 恢复原始颜色
     * - 移除边框
     * - 重置缩放
     *
     * @param areaIndex 要移除高亮的场地索引
     * @private
     */
    private removeHighlightFromPlayArea(areaIndex: number) {
        const playArea = this.playAreas[areaIndex];
        if (!playArea) return;

        // 停止动画
        tween(playArea).stop();

        // 恢复原始颜色
        const sprite = playArea.getComponent(Sprite);
        if (sprite && playArea['originalColor']) {
            sprite.color = playArea['originalColor'];
            console.log(`场地${areaIndex+1}背景颜色已恢复为原始颜色`);
        }

        // 移除边框（如果存在）
        const borderNode = playArea.getChildByName('HighlightBorder');
        if (borderNode) {
            borderNode.destroy();
        }

        // 重置缩放
        playArea.scale = new Vec3(1, 1, 1);
    }

    /**
     * 结束当前回合
     *
     * 处理回合结束的逻辑：
     * - 停止计时器
     * - 重置回合状态
     * - 记录玩家出牌情况
     * - 让AI对手出牌
     * - 计算所有场地的分数
     * - 比较场地分数并添加高亮
     * - 开始新回合
     *
     * @public
     */
    public endTurn() {
        console.log("=================== 回合结束处理开始 ===================");
        console.log(`当前回合: ${this._currentRound}/${this.maxRounds}`);
        this.stopTurnTimer();

        // 重置回合状态
        this.resetCardPlayCount();

        // 记录玩家在各场地的出牌情况
        console.log("玩家在各场地的出牌情况:");
        for (let i = 0; i < this.playAreas.length; i++) {
            const hasPlayed = this.playerPlayedInArea[i];
            const cardCount = hasPlayed ? this.playAreas[i].children.filter(child => child.name === 'PlayerCard').length : 0;
            console.log(`- 场地${i+1}: ${hasPlayed ? '已出牌' : '未出牌'} (${cardCount}张)`);
        }

        // AI机器人出牌
        console.log("AI机器人开始出牌");
        if (this.aiOpponent) {
            this.aiOpponent.playCards(this.maxCardsPerTurn);
            // AI出牌信息现在直接由AIOpponent类显示，不需要再调用displayAIPlayedCards
        } else {
            console.error("AI对手组件未初始化");
        }

        // 计算所有场地的分数
        console.log("计算所有场地的分数:");
        for (let i = 0; i < this.playAreas.length; i++) {
            console.log(`计算场地${i+1}的分数:`);

            // 计算玩家分数
            const oldPlayerScore = this.areaScores[i];
            this.calculateAreaScore(i);
            console.log(`- 玩家分数: ${oldPlayerScore} -> ${this.areaScores[i]}`);

            // 计算AI对手分数
            const oldAIScore = this.aiAreaScores[i];
            this.aiAreaScores[i] = this.calculateAIAreaScore(i);
            console.log(`- AI分数: ${oldAIScore} -> ${this.aiAreaScores[i]}`);
        }

        // 比较场地分数并添加高亮效果
        this.compareAreaScoresAndHighlight();

        // 直接开始新回合，不需要延迟
        // 因为AI打出的牌会常驻显示在场地上
        this.startNewRound();

        // 重置并启动计时器
        this.startNewTurn();

        console.log("=================== 回合结束处理完成 ===================");
    }

    // 注意：displayAIPlayedCards方法已被移除，AI出牌信息现在直接由AIOpponent类显示

    /**
     * 清除所有场地区域中的AI出牌信息
     *
     * 在游戏结束时处理AI卡牌显示：
     * - 保留AI卡牌显示，不再清除
     * - 让玩家可以看到所有回合AI打出的牌
     * - 原清除代码已注释保留
     *
     * @private
     */
    private clearAllAICards() {
        console.log("游戏结束时不再清除AI卡牌，保留显示");
        // 注释掉清除AI卡牌的代码，让AI卡牌在游戏结束时保持显示
        // 这样玩家可以看到所有回合AI打出的牌

        // if (this.aiOpponent) {
        //     this.aiOpponent.removeAllCardContainers();
        //     console.log("已清除所有AI卡牌显示");
        // } else {
        //     console.error("AI对手组件未初始化，无法清除AI卡牌显示");
        // }
    }

    /**
     * 结束回合按钮点击事件处理
     *
     * 处理玩家点击结束回合按钮的事件：
     * - 停止计时器
     * - 调用结束回合方法
     * - 输出调试信息
     *
     * @public
     */
    public onEndTurnButtonClicked() {
        console.log("结束回合按钮被点击");

        // 确保计时器停止
        this.stopTurnTimer();

        // 调用结束回合方法
        this.endTurn();

        // 添加调试信息
        console.log("回合已结束，新回合开始");
    }

    /**
     * 开始新回合
     *
     * 初始化新回合的状态：
     * - 重置计时器
     * - 更新计时器显示
     * - 重置回合状态
     * - 保留AI出牌信息
     * - 开始计时
     *
     * @private
     */
    private startNewTurn() {
        // 重置计时器
        this.remainingTime = this.turnTimeLimit;
        this.updateTimerDisplay();

        // 重置回合状态
        this.resetCardPlayCount();

        // 注意：AI出牌信息现在由AIOpponent类管理
        // AI打出的牌会像玩家打出的牌一样常驻在场地上，不需要清除

        // 开始计时
        this.startTurnTimer();
    }

    /**
     * 获取场地效果信息
     *
     * 根据场地效果类型返回对应的名称和描述：
     * - 返回效果的中文名称
     * - 返回效果的详细描述
     *
     * @param effectType 场地效果类型
     * @returns 包含效果名称和描述的对象
     * @private
     */
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

    /**
     * 获取剩余换牌次数
     *
     * 返回玩家当前剩余的换牌次数
     *
     * @returns 剩余换牌次数
     * @public
     */
    public getExchangeCount(): number {
        return this._exchangeCount;
    }

    /**
     * 显示游戏结束弹窗
     *
     * 处理游戏结束时的逻辑：
     * - 计算玩家和AI对手的最终分数
     * - 详细记录每个场地的得分情况
     * - 输出详细的得分明细
     * - 确定游戏结果（胜利、失败或平局）
     * - 显示游戏结束弹窗
     * - 清理游戏资源
     *
     * @private
     */
    private showGameOver() {
        console.log("=================== 游戏结束分数计算 ===================");
        console.log(`基础分数 - 玩家: ${this.playerScore}, 对手: ${this.opponentScore}`);

        // 计算最终分数（包括所有场地分数）
        let finalPlayerScore = this.playerScore;
        let finalOpponentScore = this.opponentScore;

        // 计算AI对手的分数 - 从每个场地区域获取AI卡牌并计算分数
        if (this.aiOpponent) {
            console.log("\n【AI对手得分明细】");
            const aiPlayedCards = this.aiOpponent.getPlayedCards();

            // 遍历每个场地区域
            for (let i = 0; i < this.playAreas.length; i++) {
                // 获取该区域的AI卡牌
                const areaCards = aiPlayedCards.get(i) || [];

                console.log(`\n场地${i+1}:`);
                if (areaCards.length > 0) {
                    // 获取场地中的公共牌
                    const sceneEffect = this.sceneEffects[i];
                    const publicCards = sceneEffect && sceneEffect.isRevealed ? sceneEffect.publicCards : [];

                    // 输出该区域AI出的牌
                    console.log(`- AI出牌(${areaCards.length}张):`);
                    areaCards.forEach(card => {
                        console.log(`  * ${card.getSuit()} ${card.getRank()}`);
                    });

                    // 如果有公共牌，输出公共牌
                    if (publicCards.length > 0) {
                        console.log(`- 公共牌(${publicCards.length}张):`);
                        publicCards.forEach(card => {
                            console.log(`  * ${card.getSuit()} ${card.getRank()}`);
                        });
                    }

                    // 合并AI出的牌和公共牌
                    const allCards = [...publicCards, ...areaCards];

                    // 计算基础点数
                    let areaScore = 0;
                    let pointScore = 0;
                    allCards.forEach(card => {
                        const value = this.getCardValue(card.rank);
                        pointScore += value;
                    });
                    areaScore += pointScore;
                    console.log(`- 基础点数: ${pointScore}分`);

                    // 检查是否有特殊牌型
                    const specialHand = this.specialHandsManager.checkSpecialHand(allCards);
                    if (specialHand) {
                        let specialHandScore = 0;
                        let specialHandName = "";

                        // 根据特殊牌型类型添加分数
                        switch (specialHand.type) {
                            case SpecialHandType.ROYAL_FLUSH:
                                specialHandScore = 150;
                                specialHandName = "完美同色序列";
                                break;
                            case SpecialHandType.PERFECT_STRAIGHT:
                                specialHandScore = 135;
                                specialHandName = "完美序列";
                                break;
                            case SpecialHandType.STRAIGHT_FLUSH:
                                specialHandScore = 120;
                                specialHandName = "同色序列";
                                break;
                            case SpecialHandType.FOUR_OF_A_KIND:
                                specialHandScore = 80;
                                specialHandName = "四骑士";
                                break;
                            case SpecialHandType.FLUSH:
                                specialHandScore = 60;
                                specialHandName = "同色";
                                break;
                            case SpecialHandType.STRAIGHT:
                                specialHandScore = 60;
                                specialHandName = "序列";
                                break;
                            case SpecialHandType.FULL_HOUSE:
                                specialHandScore = 55;
                                specialHandName = "满座";
                                break;
                            case SpecialHandType.THREE_OF_A_KIND:
                                specialHandScore = 30;
                                specialHandName = "三贤者";
                                break;
                            case SpecialHandType.TWO_PAIRS:
                                specialHandScore = 30;
                                specialHandName = "双偶星";
                                break;
                            case SpecialHandType.PAIR:
                                specialHandScore = 15;
                                specialHandName = "偶星";
                                break;
                        }

                        areaScore += specialHandScore;
                        console.log(`- 特殊牌型(${specialHandName}): ${specialHandScore}分`);
                    } else {
                        console.log(`- 特殊牌型: 无`);
                    }

                    // 应用场景效果（如果有）
                    if (sceneEffect && sceneEffect.isRevealed) {
                        // 获取场景效果信息
                        const effectInfo = this.getEffectInfo(sceneEffect.effectType);
                        console.log(`- 场地效果: ${effectInfo.name} (${effectInfo.description})`);

                        // 这里只处理简单的花色和点数奖励
                        const effectType = sceneEffect.effectType;
                        let effectScore = 0;

                        // 处理花色奖励
                        if (effectType === SceneEffectType.HeartBonus) {
                            const heartCount = allCards.filter(card => card.suit === CardSuit.Heart).length;
                            if (heartCount > 0) {
                                effectScore += heartCount * 15;
                                console.log(`  * 红桃奖励: +${heartCount * 15}分 (${heartCount}张红桃)`);
                            }
                        } else if (effectType === SceneEffectType.SpadeBonus) {
                            const spadeCount = allCards.filter(card => card.suit === CardSuit.Spade).length;
                            if (spadeCount > 0) {
                                effectScore += spadeCount * 15;
                                console.log(`  * 黑桃奖励: +${spadeCount * 15}分 (${spadeCount}张黑桃)`);
                            }
                        } else if (effectType === SceneEffectType.DiamondBonus) {
                            const diamondCount = allCards.filter(card => card.suit === CardSuit.Diamond).length;
                            if (diamondCount > 0) {
                                effectScore += diamondCount * 15;
                                console.log(`  * 方块奖励: +${diamondCount * 15}分 (${diamondCount}张方块)`);
                            }
                        } else if (effectType === SceneEffectType.ClubBonus) {
                            const clubCount = allCards.filter(card => card.suit === CardSuit.Club).length;
                            if (clubCount > 0) {
                                effectScore += clubCount * 15;
                                console.log(`  * 梅花奖励: +${clubCount * 15}分 (${clubCount}张梅花)`);
                            }
                        }

                        // 处理点数奖励
                        else if (effectType === SceneEffectType.EvenBonus) {
                            const evenCount = allCards.filter(card =>
                                [CardRank.Two, CardRank.Four, CardRank.Six, CardRank.Eight, CardRank.Ten].indexOf(card.rank) !== -1).length;
                            if (evenCount > 0) {
                                effectScore += evenCount * 15;
                                console.log(`  * 偶数奖励: +${evenCount * 15}分 (${evenCount}张偶数牌)`);
                            }
                        } else if (effectType === SceneEffectType.OddBonus) {
                            const oddCount = allCards.filter(card =>
                                [CardRank.Ace, CardRank.Three, CardRank.Five, CardRank.Seven, CardRank.Nine].indexOf(card.rank) !== -1).length;
                            if (oddCount > 0) {
                                effectScore += oddCount * 15;
                                console.log(`  * 奇数奖励: +${oddCount * 15}分 (${oddCount}张奇数牌)`);
                            }
                        } else if (effectType === SceneEffectType.JQKBonus) {
                            const jqkCount = allCards.filter(card =>
                                [CardRank.Jack, CardRank.Queen, CardRank.King].indexOf(card.rank) !== -1).length;
                            if (jqkCount > 0) {
                                effectScore += jqkCount * 15;
                                console.log(`  * JQK奖励: +${jqkCount * 15}分 (${jqkCount}张JQK)`);
                            }
                        } else if (effectType === SceneEffectType.A2358Bonus) {
                            const a2358Count = allCards.filter(card =>
                                [CardRank.Ace, CardRank.Two, CardRank.Three, CardRank.Five, CardRank.Eight].indexOf(card.rank) !== -1).length;
                            if (a2358Count > 0) {
                                effectScore += a2358Count * 15;
                                console.log(`  * A2358奖励: +${a2358Count * 15}分 (${a2358Count}张A2358)`);
                            }
                        } else if (effectType === SceneEffectType.KBonus) {
                            const kCount = allCards.filter(card => card.rank === CardRank.King).length;
                            if (kCount > 0) {
                                effectScore += kCount * 25;
                                console.log(`  * K奖励: +${kCount * 25}分 (${kCount}张K)`);
                            }
                        }

                        // 处理特殊牌型奖励
                        else if (effectType === SceneEffectType.EvenStarBonus) {
                            if (specialHand && specialHand.type === SpecialHandType.PAIR) {
                                effectScore += 15;
                                console.log(`  * 偶星奖励(对子): +15分`);
                            }
                            const hasEvenCard = allCards.some(card =>
                                [CardRank.Two, CardRank.Four, CardRank.Six, CardRank.Eight, CardRank.Ten].indexOf(card.rank) !== -1);
                            if (hasEvenCard) {
                                effectScore += 15;
                                console.log(`  * 偶星奖励(偶数牌): +15分`);
                            }
                        }

                        areaScore += effectScore;
                    }

                    // 将该区域的分数加到对手总分中
                    finalOpponentScore += areaScore;
                    console.log(`- 场地${i+1}总分: ${areaScore}分`);
                } else {
                    console.log(`- AI未在此区域出牌`);
                }
            }
        }

        // 将场地分数加到玩家总分中
        console.log("\n【玩家得分明细】");
        for (let i = 0; i < this.areaScores.length; i++) {
            console.log(`\n场地${i+1}:`);

            // 只计算玩家出过牌的区域分数
            if (this.playerPlayedInArea[i]) {
                // 获取该区域的玩家卡牌
                const playerCards = this.playAreas[i].children
                    .filter(child => child.name === 'PlayerCard')
                    .map(container => container.getComponentInChildren(Card))
                    .filter(card => card !== null);

                // 获取该区域的公共牌
                const sceneEffect = this.sceneEffects[i];
                const publicCards = sceneEffect && sceneEffect.isRevealed ? sceneEffect.publicCards : [];

                // 输出该区域玩家出的牌
                console.log(`- 玩家出牌(${playerCards.length}张):`);
                playerCards.forEach(card => {
                    console.log(`  * ${card.getSuit()} ${card.getRank()}`);
                });

                // 输出该区域的公共牌
                console.log(`- 公共牌(${publicCards.length}张):`);
                publicCards.forEach(card => {
                    console.log(`  * ${card.getSuit()} ${card.getRank()}`);
                });

                // 输出分数详情
                console.log(`- 分数详情:`);
                const details = this.areaScoreDetails[i].split('\n');
                details.forEach(detail => {
                    if (detail.trim() !== '') {
                        console.log(`  * ${detail}`);
                    }
                });

                console.log(`- 场地${i+1}总分: ${this.areaScores[i]}分 (玩家已出牌)`);
                finalPlayerScore += this.areaScores[i];
            } else {
                console.log(`- 玩家未在此区域出牌，不计分`);
            }
        }

        console.log("\n【最终得分】");
        console.log(`- 玩家: ${finalPlayerScore}分`);
        console.log(`- 对手: ${finalOpponentScore}分`);
        console.log("=================== 游戏结束分数计算 ===================");

        // 确定游戏结果
        let result = "平局！";
        if (finalPlayerScore > finalOpponentScore) {
            result = "玩家获胜！";
        } else if (finalPlayerScore < finalOpponentScore) {
            result = "对手获胜！";
        }
        console.log(`游戏结果: ${result}`);

        // 如果有游戏结束弹窗，显示它
        if (this.gameOverPopup) {
            const gameOverPopupComp = this.gameOverPopup.getComponent(GameOverPopup);
            if (gameOverPopupComp) {
                gameOverPopupComp.showPopup(finalPlayerScore, finalOpponentScore);
            } else {
                console.error("GameOverPopup组件未找到");
            }
        } else {
            console.error("游戏结束弹窗未设置");
            // 如果没有弹窗，直接返回主菜单
            this.scheduleOnce(() => {
                director.loadScene('MainMenu');
            }, 2);
        }

        // 清理AI卡牌 - 移到最后，确保分数计算完成后再清理
        console.log("清理AI机器人卡牌");
        this.clearAllAICards();

        // 停止所有计时器和动画
        this.stopTurnTimer();
        this.unscheduleAllCallbacks();
    }
}
