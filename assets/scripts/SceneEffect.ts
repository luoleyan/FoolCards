import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform, Vec3, resources, Label, tween } from 'cc';
import { Card, CardSuit, CardRank } from './Card';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

export enum SceneEffectType {
    // 基础效果
    None = 'none',                      // 无特殊效果
    SixRounds = 'six_rounds',           // 本局6回合结束

    // 牌型相关效果
    JQKBonus = 'jqk_bonus',            // J、Q、K额外加15分
    FourCardSameColor = 'four_same_color', // 同色可由4张牌组成
    ThreeCardSequence = 'three_sequence',  // 序列可由3张牌组成
    FourCardSequence = 'four_sequence',    // 序列可由4张牌组成
    SkipOneSequence = 'skip_sequence',     // 序列可以相隔1个点数组成
    FourSuitsBonus = 'four_suits_bonus',   // 4种不同花色额外加50分
    A2358Bonus = 'a2358_bonus',           // A、2、3、5、8额外加15分
    KBonus = 'k_bonus',                   // K额外加25分
    EvenStarBonus = 'even_star_bonus',    // 包含偶星额外加15分
    NoTypeBonus = 'no_type_bonus',        // 无牌型时每张牌加15分

    // 花色相关效果
    ClubBonus = 'club_bonus',             // 每张梅花加15分
    SpadeBonus = 'spade_bonus',           // 每张黑桃加15分
    DiamondBonus = 'diamond_bonus',       // 每张方块加15分
    HeartBonus = 'heart_bonus',           // 每张红桃加15分
    EvenBonus = 'even_bonus',             // 每张偶数牌加15分
    OddBonus = 'odd_bonus',               // 每张奇数牌加15分

    // 连锁效果
    SequenceChain = 'sequence_chain',      // 有序列时其他区域各加30分
    SameColorChain = 'same_color_chain',   // 有同色时其他区域各加30分
    FourKnightsChain = 'four_knights_chain', // 有四骑士时其他区域各加30分

    // 特殊效果
    InitialJoker = 'initial_joker',        // 初始有1张大王牌
    TwentyOneBonus = 'twenty_one_bonus',   // 点数和为21点额外加50分
    DestroyPublicCard = 'destroy_public',  // 摧毁1张公共牌
    ExtraPublicCard = 'extra_public',      // 额外补充1张公共牌
    LeadingDraw = 'leading_draw',          // 领先玩家多抽1张牌
    ExtraExchange = 'extra_exchange',      // 补充2次换牌次数
    RandomPlay = 'random_play',            // 随机出1张牌
    ExtraPlay = 'extra_play',              // 获得1次额外出牌次数
    DrawCard = 'draw_card',                // 立即抽1张牌
    SequenceExchange = 'sequence_exchange', // 首次序列获得5次换牌机会
    SameColorExchange = 'same_color_exchange' // 首次同色获得5次换牌机会
}

@ccclass('SceneEffect')
export class SceneEffect extends Component {
    @property(Sprite)
    public effectSprite: Sprite = null;

    @property(Node)
    public publicCardContainer: Node = null;

    @property(SpriteFrame)
    public hiddenEffectSprite: SpriteFrame = null;

    @property(Sprite)
    private cardBack: Sprite = null;  // 卡牌背面

    @property(Label)
    private effectName: Label = null;  // 效果名称

    @property(Label)
    private effectDescription: Label = null;  // 效果描述

    private _effectType: SceneEffectType = SceneEffectType.None;
    private _isRevealed: boolean = false;
    private _publicCards: Card[] = [];
    private _cardWidth: number = 100;
    private _cardSpacing: number = 20;

    public get effectType(): SceneEffectType {
        return this._effectType;
    }

    public get isRevealed(): boolean {
        return this._isRevealed;
    }

    public get publicCards(): Card[] {
        return this._publicCards;
    }

    start() {
        // 初始化时隐藏效果
        this.hideEffect();
    }

    // 初始化场景效果
    public init(effectType: SceneEffectType) {
        this._effectType = effectType;
        this._isRevealed = false;
        this._publicCards = [];

        // 隐藏效果信息
        this.effectName.node.active = false;
        this.effectDescription.node.active = false;

        // 显示卡牌背面
        this.cardBack.node.active = true;
        this.hideEffect();
        this.generatePublicCards();
    }

    // 生成公共牌
    private generatePublicCards() {
        // 清空现有公共牌
        this._publicCards.forEach(card => card.node.destroy());
        this._publicCards = [];

        // 生成两张随机公共牌
        for (let i = 0; i < 2; i++) {
            const cardNode = new Node('PublicCard');
            const card = cardNode.addComponent(Card);
            const sprite = cardNode.addComponent(Sprite);
            card.cardSprite = sprite;

            // 随机生成卡牌
            const suit = this.getRandomSuit();
            const rank = this.getRandomRank();
            card.init(suit, rank);
            card.showCardBackSync();

            // 设置卡牌位置
            const transform = cardNode.addComponent(UITransform);
            transform.setContentSize(this._cardWidth, this._cardWidth * 1.4);

            // 计算卡牌位置
            const x = (i - 0.5) * (this._cardWidth + this._cardSpacing);
            cardNode.setPosition(new Vec3(x, 0, 0));

            // 添加到容器
            this.publicCardContainer.addChild(cardNode);
            this._publicCards.push(card);
        }

        // 如果是初始大王牌效果，添加一张大王牌
        if (this._effectType === SceneEffectType.InitialJoker) {
            const jokerNode = new Node('Joker');
            const joker = jokerNode.addComponent(Card);
            const sprite = jokerNode.addComponent(Sprite);
            joker.cardSprite = sprite;
            joker.init(CardSuit.Joker, CardRank.JokerB);
            joker.showCardBackSync();

            const transform = jokerNode.addComponent(UITransform);
            transform.setContentSize(this._cardWidth, this._cardWidth * 1.4);

            jokerNode.setPosition(new Vec3(0, 0, 0));
            this.publicCardContainer.addChild(jokerNode);
            this._publicCards.push(joker);
        }
    }

    // 揭示场景效果
    public reveal() {
        if (this._isRevealed) return;
        this._isRevealed = true;

        // 播放揭示动画
        this.playRevealAnimation();
    }

    // 播放揭示动画
    private playRevealAnimation() {
        // 1. 卡牌翻转动画
        tween(this.cardBack.node)
            .to(0.5, { scale: new Vec3(0, 1, 1) }, { easing: 'cubicInOut' })
            .call(() => {
                // 隐藏卡牌背面，显示效果信息
                this.cardBack.node.active = false;
                this.effectName.node.active = true;
                this.effectDescription.node.active = true;

                // 设置效果信息
                this.setEffectInfo();

                // 2. 效果信息展开动画
                this.effectName.node.scale = new Vec3(0, 0, 1);
                this.effectDescription.node.scale = new Vec3(0, 0, 1);

                tween(this.effectName.node)
                    .delay(0.1)
                    .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                    .start();

                tween(this.effectDescription.node)
                    .delay(0.2)
                    .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                    .start();
            })
            .start();
    }

    // 设置效果信息
    private setEffectInfo() {
        // 设置效果名称和描述
        const effectInfo = this.getEffectInfo();
        this.effectName.string = effectInfo.name;
        this.effectDescription.string = effectInfo.description;
    }

    // 获取效果信息
    private getEffectInfo(): { name: string, description: string } {
        switch (this._effectType) {
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

    // 隐藏场景效果
    public hideEffect() {
        this.effectSprite.spriteFrame = this.hiddenEffectSprite;
    }

    // 获取随机花色
    private getRandomSuit(): CardSuit {
        const suits = [
            CardSuit.Spade,
            CardSuit.Heart,
            CardSuit.Club,
            CardSuit.Diamond
        ];
        return suits[Math.floor(Math.random() * suits.length)];
    }

    // 获取随机点数
    private getRandomRank(): CardRank {
        const ranks = [
            CardRank.Ace,
            CardRank.Two,
            CardRank.Three,
            CardRank.Four,
            CardRank.Five,
            CardRank.Six,
            CardRank.Seven,
            CardRank.Eight,
            CardRank.Nine,
            CardRank.Ten,
            CardRank.Jack,
            CardRank.Queen,
            CardRank.King
        ];
        return ranks[Math.floor(Math.random() * ranks.length)];
    }

    // 应用场景效果
    public applyEffect(gameManager: GameManager) {
        if (!this._isRevealed) return;

        switch (this._effectType) {
            case SceneEffectType.JQKBonus:
                // J、Q、K额外加15分
                this._publicCards.forEach(card => {
                    if ([CardRank.Jack, CardRank.Queen, CardRank.King].indexOf(card.rank) !== -1) {
                        gameManager.addScore(15);
                    }
                });
                break;

            case SceneEffectType.FourCardSameColor:
                // 同色可由4张牌组成
                gameManager.setSameColorRequirement(4);
                break;

            case SceneEffectType.ThreeCardSequence:
                // 序列可由3张牌组成
                gameManager.setSequenceRequirement(3);
                break;

            case SceneEffectType.FourCardSequence:
                // 序列可由4张牌组成
                gameManager.setSequenceRequirement(4);
                break;

            case SceneEffectType.SkipOneSequence:
                // 序列可以相隔1个点数组成
                gameManager.enableSkipSequence(true);
                break;

            case SceneEffectType.FourSuitsBonus:
                // 4种不同花色额外加50分
                const suits = new Set(this._publicCards.map(card => card.suit));
                if (suits.size === 4) {
                    gameManager.addScore(50);
                }
                break;

            case SceneEffectType.A2358Bonus:
                // A、2、3、5、8额外加15分
                this._publicCards.forEach(card => {
                    if ([CardRank.Ace, CardRank.Two, CardRank.Three, CardRank.Five, CardRank.Eight].indexOf(card.rank) !== -1) {
                        gameManager.addScore(15);
                    }
                });
                break;

            case SceneEffectType.KBonus:
                // K额外加25分
                this._publicCards.forEach(card => {
                    if (card.rank === CardRank.King) {
                        gameManager.addScore(25);
                    }
                });
                break;

            case SceneEffectType.EvenStarBonus:
                // 包含偶星额外加15分
                if (this._publicCards.some(card => card.rank === CardRank.Two || card.rank === CardRank.Four ||
                    card.rank === CardRank.Six || card.rank === CardRank.Eight || card.rank === CardRank.Ten)) {
                    gameManager.addScore(15);
                }
                break;

            case SceneEffectType.NoTypeBonus:
                // 无牌型时每张牌加15分
                if (!gameManager.hasValidType(this._publicCards)) {
                    this._publicCards.forEach(() => gameManager.addScore(15));
                }
                break;

            case SceneEffectType.ClubBonus:
                // 每张梅花加15分
                this._publicCards.forEach(card => {
                    if (card.suit === CardSuit.Club) {
                        gameManager.addScore(15);
                    }
                });
                break;

            case SceneEffectType.SpadeBonus:
                // 每张黑桃加15分
                this._publicCards.forEach(card => {
                    if (card.suit === CardSuit.Spade) {
                        gameManager.addScore(15);
                    }
                });
                break;

            case SceneEffectType.DiamondBonus:
                // 每张方块加15分
                this._publicCards.forEach(card => {
                    if (card.suit === CardSuit.Diamond) {
                        gameManager.addScore(15);
                    }
                });
                break;

            case SceneEffectType.HeartBonus:
                // 每张红桃加15分
                this._publicCards.forEach(card => {
                    if (card.suit === CardSuit.Heart) {
                        gameManager.addScore(15);
                    }
                });
                break;

            case SceneEffectType.EvenBonus:
                // 每张偶数牌加15分
                this._publicCards.forEach(card => {
                    if ([CardRank.Two, CardRank.Four, CardRank.Six, CardRank.Eight, CardRank.Ten].indexOf(card.rank) !== -1) {
                        gameManager.addScore(15);
                    }
                });
                break;

            case SceneEffectType.OddBonus:
                // 每张奇数牌加15分
                this._publicCards.forEach(card => {
                    if ([CardRank.Ace, CardRank.Three, CardRank.Five, CardRank.Seven, CardRank.Nine].indexOf(card.rank) !== -1) {
                        gameManager.addScore(15);
                    }
                });
                break;

            case SceneEffectType.SequenceChain:
                // 有序列时其他区域各加30分
                if (gameManager.isSequence(this._publicCards)) {
                    gameManager.addScoreToOtherAreas(30);
                }
                break;

            case SceneEffectType.SameColorChain:
                // 有同色时其他区域各加30分
                if (gameManager.isSameColor(this._publicCards)) {
                    gameManager.addScoreToOtherAreas(30);
                }
                break;

            case SceneEffectType.FourKnightsChain:
                // 有四骑士时其他区域各加30分
                if (this._publicCards.filter(card =>
                    [CardRank.Jack, CardRank.Queen, CardRank.King].indexOf(card.rank) !== -1).length >= 4) {
                    gameManager.addScoreToOtherAreas(30);
                }
                break;

            case SceneEffectType.TwentyOneBonus:
                // 点数和为21点额外加50分
                const sum = this._publicCards.reduce((total, card) => {
                    const value = this.getCardValue(card.rank);
                    return total + value;
                }, 0);
                if (sum === 21) {
                    gameManager.addScore(50);
                }
                break;

            case SceneEffectType.DestroyPublicCard:
                // 摧毁1张公共牌
                if (this._publicCards.length > 0) {
                    const randomIndex = Math.floor(Math.random() * this._publicCards.length);
                    const card = this._publicCards[randomIndex];
                    card.node.destroy();
                    this._publicCards.splice(randomIndex, 1);
                }
                break;

            case SceneEffectType.ExtraPublicCard:
                // 额外补充1张公共牌
                this.generatePublicCards();
                break;

            case SceneEffectType.LeadingDraw:
                // 领先玩家多抽1张牌
                if (gameManager.isPlayerLeading()) {
                    gameManager.drawExtraCard();
                }
                break;

            case SceneEffectType.ExtraExchange:
                // 补充2次换牌次数
                gameManager.addExchangeCount(2);
                break;

            case SceneEffectType.RandomPlay:
                // 随机出1张牌
                const handCards = gameManager.getPlayerHandCards();
                if (handCards.length > 0) {
                    const randomIndex = Math.floor(Math.random() * handCards.length);
                    gameManager.playCard(handCards[randomIndex]);
                }
                break;

            case SceneEffectType.ExtraPlay:
                // 获得1次额外出牌次数
                gameManager.addExtraPlayCount(1);
                break;

            case SceneEffectType.DrawCard:
                // 立即抽1张牌
                gameManager.drawCard();
                break;

            case SceneEffectType.SequenceExchange:
                // 首次序列获得5次换牌机会
                if (gameManager.isFirstSequence(this._publicCards)) {
                    gameManager.addExchangeCount(5);
                }
                break;

            case SceneEffectType.SameColorExchange:
                // 首次同色获得5次换牌机会
                if (gameManager.isFirstSameColor(this._publicCards)) {
                    gameManager.addExchangeCount(5);
                }
                break;
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
} 