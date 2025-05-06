/**
 * @file Card.ts
 * @description 卡牌类，负责卡牌的显示、交互和状态管理
 * @author LuoLeYan
 * @copyright Copyright (c) 2025, LuoLeYan
 */

import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform, Vec3, EventTouch, director, resources, Camera, Rect } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

/**
 * 卡牌花色枚举
 *
 * 定义游戏中使用的卡牌花色：
 * - Spade: 黑桃
 * - Heart: 红桃
 * - Club: 梅花
 * - Diamond: 方块
 * - Joker: 王牌
 */
export enum CardSuit {
    Spade = 'Spade',
    Heart = 'Heart',
    Club = 'Club',
    Diamond = 'Diamond',
    Joker = 'Joker'
}

/**
 * 卡牌点数枚举
 *
 * 定义游戏中使用的卡牌点数：
 * - Ace到King: 普通牌的点数
 * - JokerA和JokerB: 小王和大王
 */
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

/**
 * 卡牌类
 *
 * 负责卡牌的显示、交互和状态管理：
 * - 初始化卡牌花色和点数
 * - 加载和显示卡牌图像
 * - 处理卡牌的拖放交互
 * - 管理卡牌的正反面显示
 * - 提供卡牌信息查询接口
 */
@ccclass('Card')
export class Card extends Component {
    /** 卡牌精灵组件，用于显示卡牌图像 */
    @property(Sprite)
    public cardSprite: Sprite = null;

    /** 卡牌背面图像 */
    @property(SpriteFrame)
    public cardBack: SpriteFrame = null;

    /** 卡牌花色 */
    private _suit: CardSuit;

    /** 卡牌点数 */
    private _rank: CardRank;

    /** 卡牌是否正面朝上 */
    private _isFaceUp: boolean = false;

    /** 卡牌原始位置，用于拖拽后返回 */
    private _originalPosition: Vec3 = new Vec3();

    /** 卡牌是否正在拖拽中 */
    private _isDragging: boolean = false;

    /** 拖拽偏移量 */
    private _dragOffset: Vec3 = new Vec3();

    /** 卡牌原始索引，用于拖拽后恢复顺序 */
    private _originalIndex: number;

    /**
     * 状态标志，用于跟踪卡牌是否正在进行异步操作
     * 防止在异步加载过程中对卡牌进行操作导致错误
     */
    private _isProcessing: boolean = false;

    /**
     * 静态变量，存储预加载的卡牌背面图像
     * 所有卡牌共享同一个背面图像，提高性能
     */
    private static cardBackSprite: SpriteFrame = null;

    /**
     * 预加载卡牌背面图像
     *
     * 静态方法，用于预加载所有卡牌共用的背面图像：
     * - 检查是否已经预加载
     * - 从资源中加载卡牌背面图像
     * - 存储到静态变量中供所有卡牌使用
     *
     * @static
     */
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

    /**
     * 获取卡牌花色
     *
     * @returns 卡牌花色
     */
    public get suit(): CardSuit {
        return this._suit;
    }

    /**
     * 获取卡牌点数
     *
     * @returns 卡牌点数
     */
    public get rank(): CardRank {
        return this._rank;
    }

    /**
     * 获取卡牌是否正面朝上
     *
     * @returns 卡牌是否正面朝上
     */
    public get isFaceUp(): boolean {
        return this._isFaceUp;
    }

    /**
     * 组件启动时执行的初始化方法
     *
     * 负责初始化卡牌组件：
     * - 预加载卡牌背面图片
     * - 添加触摸事件监听
     */
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

    /**
     * 组件销毁时执行的清理方法
     *
     * 负责清理卡牌组件：
     * - 移除触摸事件监听
     * - 防止内存泄漏
     */
    onDestroy() {
        // 移除触摸事件监听
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    /**
     * 更改卡牌的花色和点数（仅用于万能牌转换）
     *
     * 允许将万能牌（大小王）转换为指定的普通牌：
     * - 检查是否为万能牌
     * - 记录原始万能牌信息
     * - 更新卡牌信息
     * - 记录转换日志
     *
     * @param suit 目标花色
     * @param rank 目标点数
     * @public
     */
    public changeCardInfo(suit: CardSuit, rank: CardRank) {
        // 只允许万能牌进行转换
        if (this._suit !== CardSuit.Joker) {
            console.warn('Only Joker cards can be transformed');
            return;
        }

        // 记录原始的万能牌信息
        const originalSuit = this._suit;
        const originalRank = this._rank;

        // 更新卡牌信息
        this._suit = suit;
        this._rank = rank;

        // 详细的换牌日志
        console.log('=== 万能牌转换详情 ===');
        console.log(`原始牌: ${this.getJokerDescription(originalSuit, originalRank)}`);
        console.log(`替换为: ${this.getCardDescription(suit, rank)}`);
        console.log('==================');
    }

    /**
     * 获取万能牌描述
     *
     * 根据花色和点数生成万能牌的中文描述
     *
     * @param suit 万能牌花色
     * @param rank 万能牌点数
     * @returns 万能牌的中文描述
     * @private
     */
    private getJokerDescription(suit: CardSuit, rank: CardRank): string {
        return `${suit === CardSuit.Joker ? '小王' : '大王'} (${suit}-${rank})`;
    }

    /**
     * 获取普通牌描述
     *
     * 根据花色和点数生成普通牌的中文描述
     *
     * @param suit 卡牌花色
     * @param rank 卡牌点数
     * @returns 卡牌的中文描述
     * @private
     */
    private getCardDescription(suit: CardSuit, rank: CardRank): string {
        const suitNames = {
            [CardSuit.Spade]: '黑桃',
            [CardSuit.Heart]: '红心',
            [CardSuit.Club]: '梅花',
            [CardSuit.Diamond]: '方块',
            [CardSuit.Joker]: '王牌'
        };

        const rankNames = {
            [CardRank.Ace]: 'A',
            [CardRank.Two]: '2',
            [CardRank.Three]: '3',
            [CardRank.Four]: '4',
            [CardRank.Five]: '5',
            [CardRank.Six]: '6',
            [CardRank.Seven]: '7',
            [CardRank.Eight]: '8',
            [CardRank.Nine]: '9',
            [CardRank.Ten]: '10',
            [CardRank.Jack]: 'J',
            [CardRank.Queen]: 'Q',
            [CardRank.King]: 'K'
        };

        // 如果是王牌，返回特殊描述
        if (suit === CardSuit.Joker) {
            return rank === CardRank.JokerA ? '小王' : '大王';
        }

        return `${suitNames[suit]}${rankNames[rank]} (${suit}-${rank})`;
    }

    /**
     * 初始化卡牌
     *
     * 设置卡牌的花色和点数，并加载对应的图像：
     * - 验证参数有效性
     * - 设置卡牌花色和点数
     * - 确保卡牌精灵组件存在
     * - 加载对应的卡牌图像
     *
     * @param suit 卡牌花色
     * @param rank 卡牌点数
     * @returns 初始化完成的Promise
     * @public
     */
    public init(suit: CardSuit, rank: CardRank) {
        console.log(`Initializing card: ${suit} ${rank}`);
        if (!suit || !rank) {
            console.error(`Invalid card parameters: suit=${suit}, rank=${rank}`);
            return Promise.reject(new Error('Invalid card parameters'));
        }

        // 设置处理标志，防止在异步操作过程中被销毁
        this._isProcessing = true;

        this._suit = suit;
        this._rank = rank;

        // 检查卡牌精灵是否存在
        if (!this.cardSprite) {
            console.log('Getting or creating Sprite component');
            this.cardSprite = this.getComponent(Sprite);
            if (!this.cardSprite) {
                this.cardSprite = this.addComponent(Sprite);
            }
        }

        // 如果是万能牌，不需要加载新资源
        if (suit === CardSuit.Joker) {
            console.log('Initializing Joker card without loading new resources');
            this._isProcessing = false;
            return Promise.resolve();
        }

        // 确保预加载背面图片
        if (!Card.cardBackSprite) {
            Card.preloadCardBack();
        }

        return new Promise<void>((resolve, reject) => {
            // 再次检查节点是否有效
            if (!this.node || !this.isValid) {
                console.error('Card node became invalid during initialization');
                this._isProcessing = false;
                reject(new Error('Card node is invalid'));
                return;
            }

            this.updateCardSprite()
                .then(() => {
                    console.log(`Card ${suit} ${rank} initialized successfully`);
                    // 清除处理标志
                    this._isProcessing = false;
                    resolve();
                })
                .catch((error) => {
                    console.error(`Failed to initialize card ${suit} ${rank}:`, error);
                    // 清除处理标志
                    this._isProcessing = false;
                    reject(error);
                });
        });
    }

    /**
     * 更新卡牌图片
     *
     * 根据卡牌的花色、点数和正反面状态加载对应的图像：
     * - 检查节点和组件有效性
     * - 根据卡牌正反面状态加载不同图像
     * - 处理万能牌的特殊图像加载
     * - 处理卡牌背面图像的加载和缓存
     *
     * @returns 图像加载完成的Promise
     * @private
     */
    private updateCardSprite(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // 首先检查节点是否有效
            if (!this.node || !this.isValid) {
                console.error('Card node is invalid in updateCardSprite');
                reject(new Error('Card node is invalid'));
                return;
            }

            if (!this.cardSprite) {
                reject(new Error('Card sprite component is missing!'));
                return;
            }

            // 设置处理标志
            this._isProcessing = true;

            if (this._isFaceUp) {
                // 如果是万能牌，加载对应的万能牌图像
                if (this._suit === CardSuit.Joker) {
                    const jokerPath = `cards/JOKER-${this._rank}/spriteFrame`;
                    resources.load(jokerPath, SpriteFrame, (err, spriteFrame) => {
                        // 再次检查节点是否有效
                        if (!this.node || !this.isValid) {
                            console.error('Card node became invalid during joker sprite loading');
                            this._isProcessing = false;
                            reject(new Error('Card node is invalid'));
                            return;
                        }

                        if (err) {
                            console.error('Failed to load joker sprite:', err);
                            this._isProcessing = false;
                            reject(err);
                            return;
                        }
                        // 如果Sprite组件丢失，尝试重新添加
                        if (!this.cardSprite) {
                            console.warn('Card sprite component is missing after loading joker sprite, trying to recreate it');

                            // 再次检查节点是否有效
                            if (!this.node || !this.isValid) {
                                console.error('Card node is invalid, cannot recreate sprite component');
                                this._isProcessing = false;
                                reject(new Error('Card node is invalid'));
                                return;
                            }

                            try {
                                this.cardSprite = this.getComponent(Sprite);
                                if (!this.cardSprite) {
                                    this.cardSprite = this.addComponent(Sprite);
                                    console.log('Created new Sprite component for joker card');
                                }
                            } catch (error) {
                                console.error('Error recreating sprite component for joker:', error);
                                this._isProcessing = false;
                                reject(error);
                                return;
                            }
                        }

                        this.cardSprite.spriteFrame = spriteFrame;
                        this._isProcessing = false;
                        resolve();
                    });
                    return;
                }

                // 加载普通卡牌正面图片
                let path = `cards/${this._suit}${this._rank}/spriteFrame`;
                resources.load(path, SpriteFrame, (err, spriteFrame) => {
                    // 再次检查节点是否有效
                    if (!this.node || !this.isValid) {
                        console.error('Card node became invalid during card sprite loading');
                        this._isProcessing = false;
                        reject(new Error('Card node is invalid'));
                        return;
                    }

                    if (err) {
                        console.error('Failed to load card sprite:', err);
                        this._isProcessing = false;
                        reject(err);
                        return;
                    }
                    // 如果Sprite组件丢失，尝试重新添加
                    if (!this.cardSprite) {
                        console.warn('Card sprite component is missing after loading card sprite, trying to recreate it');
                        // 检查节点是否有效
                        if (!this.node || !this.isValid) {
                            console.error('Card node is invalid, cannot recreate sprite component');
                            this._isProcessing = false;
                            reject(new Error('Card node is invalid'));
                            return;
                        }

                        try {
                            this.cardSprite = this.getComponent(Sprite);
                            if (!this.cardSprite) {
                                this.cardSprite = this.addComponent(Sprite);
                                console.log('Created new Sprite component for normal card');
                            }
                        } catch (error) {
                            console.error('Error recreating sprite component:', error);
                            this._isProcessing = false;
                            reject(error);
                            return;
                        }
                    }

                    // 再次检查cardSprite是否有效
                    if (!this.cardSprite) {
                        console.error('Failed to recreate sprite component');
                        this._isProcessing = false;
                        reject(new Error('Failed to recreate sprite component'));
                        return;
                    }

                    this.cardSprite.spriteFrame = spriteFrame;
                    this._isProcessing = false;
                    resolve();
                });
            } else {
                // 显示背面
                if (Card.cardBackSprite) {
                    this.cardSprite.spriteFrame = Card.cardBackSprite;
                    this._isProcessing = false;
                    resolve();
                } else if (this.cardBack) {
                    this.cardSprite.spriteFrame = this.cardBack;
                    this._isProcessing = false;
                    resolve();
                } else {
                    resources.load('cards/Background/spriteFrame', SpriteFrame, (err, spriteFrame) => {
                        // 再次检查节点是否有效
                        if (!this.node || !this.isValid) {
                            console.error('Card node became invalid during card back loading');
                            this._isProcessing = false;
                            reject(new Error('Card node is invalid'));
                            return;
                        }

                        if (err) {
                            console.error('Failed to load card back sprite:', err);
                            this._isProcessing = false;
                            reject(err);
                            return;
                        }
                        // 如果Sprite组件丢失，尝试重新添加
                        if (!this.cardSprite) {
                            console.warn('Card sprite component is missing when showing back, trying to recreate it');

                            // 再次检查节点是否有效
                            if (!this.node || !this.isValid) {
                                console.error('Card node is invalid, cannot recreate sprite component for back');
                                this._isProcessing = false;
                                reject(new Error('Card node is invalid'));
                                return;
                            }

                            try {
                                this.cardSprite = this.getComponent(Sprite);
                                if (!this.cardSprite) {
                                    this.cardSprite = this.addComponent(Sprite);
                                    console.log('Created new Sprite component for card back');
                                }
                            } catch (error) {
                                console.error('Error recreating sprite component for back:', error);
                                this._isProcessing = false;
                                reject(error);
                                return;
                            }
                        }

                        this.cardSprite.spriteFrame = spriteFrame;
                        Card.cardBackSprite = spriteFrame;
                        this._isProcessing = false;
                        resolve();
                    });
                }
            }
        });
    }

    /**
     * 显示卡牌正面
     *
     * 将卡牌翻转为正面朝上状态，并加载对应的图像：
     * - 检查节点有效性
     * - 处理异步操作冲突
     * - 确保卡牌精灵组件存在
     * - 设置卡牌为正面朝上
     * - 加载对应的卡牌图像
     *
     * @returns 操作完成的Promise
     * @public
     */
    public showCardFace(): Promise<void> {
        // 检查节点是否有效
        if (!this.node || !this.isValid) {
            console.error('Card node is invalid in showCardFace');
            return Promise.reject(new Error('Card node is invalid'));
        }

        // 如果卡牌已经是正面朝上，直接返回成功
        if (this._isFaceUp) {
            console.log('Card is already face up, no action needed');
            return Promise.resolve();
        }

        // 如果正在处理中，返回一个等待的Promise
        if (this._isProcessing) {
            console.warn('Card is already being processed in showCardFace, waiting...');
            // 创建一个延迟检查的Promise，每100ms检查一次处理状态
            return new Promise<void>((resolve, reject) => {
                const checkInterval = 100; // 毫秒
                const maxWaitTime = 3000; // 最长等待3秒
                let waitedTime = 0;

                const checkProcessing = () => {
                    if (!this._isProcessing) {
                        // 处理完成，现在可以显示卡牌正面
                        if (this._isFaceUp) {
                            // 如果已经是正面朝上，直接返回成功
                            resolve();
                        } else {
                            // 递归调用自身，但不会再次进入等待逻辑
                            this.showCardFace()
                                .then(resolve)
                                .catch(reject);
                        }
                    } else if (waitedTime >= maxWaitTime) {
                        // 超时，返回错误
                        reject(new Error('Timeout waiting for card processing to complete'));
                    } else {
                        // 继续等待
                        waitedTime += checkInterval;
                        setTimeout(checkProcessing, checkInterval);
                    }
                };

                // 开始检查
                setTimeout(checkProcessing, checkInterval);
            });
        }

        // 设置处理标志
        this._isProcessing = true;

        // 如果Sprite组件丢失，尝试重新添加
        if (!this.cardSprite) {
            console.warn('Card sprite component is missing, trying to recreate it');
            try {
                this.cardSprite = this.getComponent(Sprite);
                if (!this.cardSprite) {
                    this.cardSprite = this.addComponent(Sprite);
                    console.log('Created new Sprite component for card');
                }
            } catch (error) {
                console.error('Error recreating sprite component in showCardFace:', error);
                this._isProcessing = false;
                return Promise.reject(error);
            }
        }

        // 再次检查cardSprite是否有效
        if (!this.cardSprite) {
            console.error('Failed to recreate sprite component in showCardFace');
            this._isProcessing = false;
            return Promise.reject(new Error('Failed to recreate sprite component'));
        }

        this._isFaceUp = true;

        // 使用updateCardSprite并确保在完成时清除处理标志
        return this.updateCardSprite()
            .catch(error => {
                this._isProcessing = false;
                return Promise.reject(error);
            });
    }

    /**
     * 显示卡牌背面
     *
     * 将卡牌翻转为背面朝上状态，并加载背面图像：
     * - 检查节点有效性
     * - 处理异步操作冲突
     * - 确保卡牌精灵组件存在
     * - 设置卡牌为背面朝上
     * - 加载卡牌背面图像
     *
     * @returns 操作完成的Promise
     * @public
     */
    public showCardBack(): Promise<void> {
        // 检查节点是否有效
        if (!this.node || !this.isValid) {
            console.error('Card node is invalid in showCardBack');
            return Promise.reject(new Error('Card node is invalid'));
        }

        // 如果卡牌已经是背面朝上，直接返回成功
        if (!this._isFaceUp) {
            console.log('Card is already face down, no action needed');
            return Promise.resolve();
        }

        // 如果正在处理中，返回一个等待的Promise
        if (this._isProcessing) {
            console.warn('Card is already being processed in showCardBack, waiting...');
            // 创建一个延迟检查的Promise，每100ms检查一次处理状态
            return new Promise<void>((resolve, reject) => {
                const checkInterval = 100; // 毫秒
                const maxWaitTime = 3000; // 最长等待3秒
                let waitedTime = 0;

                const checkProcessing = () => {
                    if (!this._isProcessing) {
                        // 处理完成，现在可以显示卡牌背面
                        if (!this._isFaceUp) {
                            // 如果已经是背面朝上，直接返回成功
                            resolve();
                        } else {
                            // 递归调用自身，但不会再次进入等待逻辑
                            this.showCardBack()
                                .then(resolve)
                                .catch(reject);
                        }
                    } else if (waitedTime >= maxWaitTime) {
                        // 超时，返回错误
                        reject(new Error('Timeout waiting for card processing to complete'));
                    } else {
                        // 继续等待
                        waitedTime += checkInterval;
                        setTimeout(checkProcessing, checkInterval);
                    }
                };

                // 开始检查
                setTimeout(checkProcessing, checkInterval);
            });
        }

        if (!this.cardSprite) {
            return Promise.reject(new Error('Cannot show card back: sprite component is missing!'));
        }

        // 设置处理标志
        this._isProcessing = true;

        this._isFaceUp = false;

        // 使用updateCardSprite并确保在完成时清除处理标志
        return this.updateCardSprite()
            .catch(error => {
                this._isProcessing = false;
                return Promise.reject(error);
            });
    }

    /**
     * 同步显示卡牌背面
     *
     * 立即将卡牌设置为背面朝上状态，不使用异步操作：
     * - 检查节点有效性
     * - 处理异步操作冲突
     * - 确保卡牌精灵组件存在
     * - 设置卡牌为背面朝上
     * - 设置卡牌尺寸和缩放
     * - 使用预加载的背面图像
     *
     * 主要用于对手卡牌的显示，不需要等待异步操作完成
     *
     * @public
     */
    public showCardBackSync() {
        // 检查节点是否有效
        if (!this.node || !this.isValid) {
            console.error('Card node is invalid in showCardBackSync');
            return;
        }

        // 如果正在处理中，直接返回
        if (this._isProcessing) {
            console.warn('Card is already being processed in showCardBackSync');
            return;
        }

        // 设置处理标志
        this._isProcessing = true;

        try {
            // 如果Sprite组件丢失，尝试重新添加
            if (!this.cardSprite) {
                console.warn('Card sprite component is missing in showCardBackSync, trying to recreate it');
                this.cardSprite = this.getComponent(Sprite);
                if (!this.cardSprite) {
                    this.cardSprite = this.addComponent(Sprite);
                    console.log('Created new Sprite component for card back sync');
                }
            }

            this._isFaceUp = false;

            // 设置卡牌缩放和尺寸
            if (this.node) {
                this.node.setScale(0.25, 0.25, 1);
                const uiTransform = this.node.getComponent(UITransform);
                if (uiTransform) {
                    uiTransform.setContentSize(120, 180);
                }
            }

            // 使用预加载的背面图片
            if (Card.cardBackSprite) {
                this.cardSprite.spriteFrame = Card.cardBackSprite;
                this._isProcessing = false;
            } else if (this.cardBack) {
                this.cardSprite.spriteFrame = this.cardBack;
                this._isProcessing = false;
            } else {
                resources.load('cards/Background/spriteFrame', SpriteFrame, (err, spriteFrame) => {
                    // 再次检查节点是否有效
                    if (!this.node || !this.isValid) {
                        console.error('Card node became invalid during card back loading in showCardBackSync');
                        this._isProcessing = false;
                        return;
                    }

                    if (err) {
                        console.error('Failed to load card back sprite:', err);
                        this._isProcessing = false;
                        return;
                    }

                    // 再次检查Sprite组件是否存在
                    if (!this.cardSprite) {
                        console.warn('Card sprite component is missing after loading back sprite, trying to recreate it');

                        // 再次检查节点是否有效
                        if (!this.node || !this.isValid) {
                            console.error('Card node is invalid, cannot recreate sprite component in showCardBackSync');
                            this._isProcessing = false;
                            return;
                        }

                        try {
                            this.cardSprite = this.getComponent(Sprite);
                            if (!this.cardSprite) {
                                this.cardSprite = this.addComponent(Sprite);
                                console.log('Created new Sprite component for card back after loading');
                            }
                        } catch (error) {
                            console.error('Error recreating sprite component in showCardBackSync:', error);
                            this._isProcessing = false;
                            return;
                        }
                    }

                    this.cardSprite.spriteFrame = spriteFrame;
                    Card.cardBackSprite = spriteFrame;
                    this._isProcessing = false;
                });
            }
        } catch (error) {
            console.error('Error in showCardBackSync:', error);
            this._isProcessing = false;
        }
    }

    /**
     * 触摸开始事件处理
     *
     * 处理卡牌被触摸开始的事件：
     * - 检查卡牌所在的区域（玩家手牌或对手手牌）
     * - 对手手牌只显示背面
     * - 玩家手牌开始拖拽操作
     * - 记录原始位置和索引
     * - 计算拖拽偏移量
     *
     * @param event 触摸事件对象
     * @private
     */
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

    /**
     * 触摸移动事件处理
     *
     * 处理卡牌被拖拽移动的事件：
     * - 检查是否处于拖拽状态
     * - 获取触摸位置
     * - 将触摸位置转换为节点坐标
     * - 应用拖拽偏移量
     * - 更新卡牌位置
     *
     * @param event 触摸事件对象
     * @private
     */
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

    /**
     * 触摸结束事件处理
     *
     * 处理卡牌拖拽结束的事件：
     * - 检查是否处于拖拽状态
     * - 获取游戏管理器
     * - 检查是否与换牌区域重叠
     * - 检查是否与场地区域重叠
     * - 根据重叠情况执行相应操作（换牌、出牌）
     * - 如果没有有效操作，返回原位
     *
     * @param event 触摸事件对象
     * @private
     */
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

        // 获取卡牌的UITransform组件
        const cardTransform = this.node.getComponent(UITransform);
        if (!cardTransform) {
            console.log('Card has no UITransform component');
            this.returnToOriginalPosition();
            return;
        }

        // 首先检查是否与换牌区域重叠
        if (gameManager.exchangeArea) {
            const exchangeAreaTransform = gameManager.exchangeArea.getComponent(UITransform);
            if (exchangeAreaTransform) {
                const cardRect = cardTransform.getBoundingBoxToWorld();
                const exchangeAreaRect = exchangeAreaTransform.getBoundingBoxToWorld();

                if (this.isOverlapping(cardRect, exchangeAreaRect)) {
                    console.log('Card overlaps with exchange area');
                    // 检查是否还有换牌次数
                    if (gameManager.getExchangeCount() > 0) {
                        // 调用换牌方法
                        gameManager.exchangeCard(this);
                    } else {
                        console.log('No exchange count left, returning card to original position');
                        this.returnToOriginalPosition();
                    }
                    return;
                }
            }
        }

        // 检查是否还能出牌
        if (!gameManager.canPlayCard()) {
            console.log('Cannot play more cards this turn');
            this.returnToOriginalPosition();
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
                    // 使用 GameManager 的 playCard 方法
                    gameManager.playCard(this, i);
                    return;
                } else {
                    console.log(`Play area ${i} is not revealed yet`);
                    // 检查是否允许放置到未翻开区域
                    if (gameManager.canPlayToUnrevealedArea()) {
                        console.log(`Playing card to unrevealed area ${i}`);
                        // 先标记区域为已翻开
                        gameManager.markPlayAreaRevealed(i);
                        // 使用 GameManager 的 playCard 方法
                        gameManager.playCard(this, i);
                        return;
                    }
                }
            }
        }

        // 如果没有与任何区域重叠，返回原位
        console.log('No overlap with any area, returning to original position');
        this.returnToOriginalPosition();
    }

    /**
     * 返回原始位置的辅助方法
     *
     * 将卡牌返回到拖拽前的原始位置：
     * - 恢复卡牌的原始位置
     * - 恢复卡牌在父节点中的原始索引
     *
     * @private
     */
    private returnToOriginalPosition() {
        this.node.setPosition(this._originalPosition);
        this.node.setSiblingIndex(this._originalIndex);
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

        // 创建一个新的节点作为卡牌容器
        const cardContainer = new Node('CardContainer');
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
        const spacing = 80;      // 增加卡牌之间的间距到80
        const bottomY = -(areaTransform.height / 2) - (cardHeight * 0.35);  // 垂直位置

        // 计算水平位置（基于已有的卡牌数量）
        const existingContainers = playArea.children.filter(child => child.name === 'CardContainer');
        const cardIndex = existingContainers.length - 1;  // 减1是因为我们刚刚添加了新的容器

        // 计算水平偏移
        const totalWidth = cardIndex * (cardWidth * 0.5 + spacing);  // 考虑缩放后的卡牌宽度
        const startX = -(totalWidth / 2);  // 居中起始位置
        const newX = startX + (cardIndex * (cardWidth * 0.5 + spacing));  // 考虑缩放后的间距

        // 设置容器位置
        cardContainer.setPosition(new Vec3(newX, bottomY, 0));

        // 将卡牌添加到容器中
        cardContainer.addChild(this.node);

        // 设置卡牌在容器中的位置和大小
        this.node.setPosition(Vec3.ZERO);  // 相对于容器的位置为原点
        this.node.setScale(0.5, 0.5, 1);   // 缩小卡牌尺寸

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
            const card = child.getComponentInChildren(Card);
            if (card) {
                cards.push(card);
            }
        });

        console.log(`Found ${cards.length} cards in play area`);

        // 计算并更新场地区域的分数
        console.log('Calculating area score');
        gameManager.calculateAreaScore(areaIndex);

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

    /**
     * 触摸取消事件处理
     *
     * 处理卡牌拖拽被取消的事件：
     * - 检查是否处于拖拽状态
     * - 重置拖拽状态
     * - 将卡牌返回原始位置
     *
     * @param event 触摸事件对象
     * @private
     */
    private onTouchCancel(event: EventTouch) {
        if (!this._isDragging) {
            return;
        }

        this._isDragging = false;
        this.node.setPosition(this._originalPosition);
    }

    /**
     * 获取卡牌完整名称
     *
     * 返回卡牌的完整名称，用于标识和调试：
     * - 万能牌返回格式为"Joker-A"或"Joker-B"
     * - 普通牌返回格式为"Spade2"、"HeartA"等
     *
     * @returns 卡牌完整名称
     * @public
     */
    public getFullName(): string {
        if (this._suit === CardSuit.Joker) {
            return `${this._suit}-${this._rank}`;
        }
        return `${this._suit}${this._rank}`;
    }

    /**
     * 获取卡牌花色
     *
     * @returns 卡牌花色
     * @public
     */
    public getSuit(): CardSuit {
        return this._suit;
    }

    /**
     * 获取卡牌点数
     *
     * @returns 卡牌点数
     * @public
     */
    public getRank(): CardRank {
        return this._rank;
    }

    /**
     * 检查两个矩形是否重叠
     *
     * 用于检测卡牌与场地区域或换牌区域的重叠：
     * - 检查两个矩形在x轴和y轴上的投影是否重叠
     *
     * @param rect1 第一个矩形
     * @param rect2 第二个矩形
     * @returns 是否重叠
     * @private
     */
    private isOverlapping(rect1: Rect, rect2: Rect): boolean {
        return !(rect1.x + rect1.width < rect2.x ||
                rect2.x + rect2.width < rect1.x ||
                rect1.y + rect1.height < rect2.y ||
                rect2.y + rect2.height < rect1.y);
    }
}