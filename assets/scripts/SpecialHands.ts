import { _decorator, Component } from 'cc';
import { Card, CardSuit, CardRank } from './Card';
const { ccclass } = _decorator;

// 特殊牌型枚举，按分数从高到低排序
export enum SpecialHandType {
    NONE = 0,
    ROYAL_FLUSH = 1,    // 完美同色序列 (150分)
    PERFECT_STRAIGHT = 2, // 完美序列 (135分)
    STRAIGHT_FLUSH = 3, // 同色序列 (120分)
    FOUR_OF_A_KIND = 4, // 四骑士 (80分)
    FLUSH = 5,          // 同色 (60分)
    STRAIGHT = 6,       // 序列 (60分)
    FULL_HOUSE = 7,     // 满座 (55分)
    THREE_OF_A_KIND = 8,// 三贤者 (30分)
    TWO_PAIRS = 9,      // 双偶星 (30分)
    PAIR = 10           // 偶星 (15分)
}

// 特殊牌型类
export class SpecialHand {
    public type: SpecialHandType;
    public cards: Card[];
    public bonusPoints: number;
    public description: string;

    constructor(type: SpecialHandType, cards: Card[], bonusPoints: number, description: string) {
        this.type = type;
        this.cards = cards;
        this.bonusPoints = bonusPoints;
        this.description = description;
    }
}

// 特殊牌型管理器
export class SpecialHandsManager {
    private static instance: SpecialHandsManager;
    private specialHands: Map<SpecialHandType, SpecialHand>;

    private constructor() {
        this.specialHands = new Map();
        this.initializeSpecialHands();
    }

    public static getInstance(): SpecialHandsManager {
        if (!SpecialHandsManager.instance) {
            SpecialHandsManager.instance = new SpecialHandsManager();
        }
        return SpecialHandsManager.instance;
    }

    // 初始化所有特殊牌型及其得分
    private initializeSpecialHands() {
        // 按分数从高到低初始化
        this.specialHands.set(SpecialHandType.ROYAL_FLUSH, new SpecialHand(
            SpecialHandType.ROYAL_FLUSH,
            [],
            150,
            "完美同色序列：10-J-Q-K-A组成的同色序列"
        ));

        this.specialHands.set(SpecialHandType.PERFECT_STRAIGHT, new SpecialHand(
            SpecialHandType.PERFECT_STRAIGHT,
            [],
            135,
            "完美序列：10-J-Q-K-A组成的序列"
        ));

        this.specialHands.set(SpecialHandType.STRAIGHT_FLUSH, new SpecialHand(
            SpecialHandType.STRAIGHT_FLUSH,
            [],
            120,
            "同色序列：五张连续点数且同色的牌"
        ));

        this.specialHands.set(SpecialHandType.FOUR_OF_A_KIND, new SpecialHand(
            SpecialHandType.FOUR_OF_A_KIND,
            [],
            80,
            "四骑士：四张相同点数的牌"
        ));

        this.specialHands.set(SpecialHandType.FLUSH, new SpecialHand(
            SpecialHandType.FLUSH,
            [],
            60,
            "同色：五张相同花色的牌"
        ));

        this.specialHands.set(SpecialHandType.STRAIGHT, new SpecialHand(
            SpecialHandType.STRAIGHT,
            [],
            60,
            "序列：五张连续点数的牌"
        ));

        this.specialHands.set(SpecialHandType.FULL_HOUSE, new SpecialHand(
            SpecialHandType.FULL_HOUSE,
            [],
            55,
            "满座：三贤者加偶星"
        ));

        this.specialHands.set(SpecialHandType.THREE_OF_A_KIND, new SpecialHand(
            SpecialHandType.THREE_OF_A_KIND,
            [],
            30,
            "三贤者：三张相同点数的牌"
        ));

        this.specialHands.set(SpecialHandType.TWO_PAIRS, new SpecialHand(
            SpecialHandType.TWO_PAIRS,
            [],
            30,
            "双偶星：两对不同点数的偶星"
        ));

        this.specialHands.set(SpecialHandType.PAIR, new SpecialHand(
            SpecialHandType.PAIR,
            [],
            15,
            "偶星：两张相同点数的牌"
        ));
    }

    // 检查一组牌是否构成特殊牌型
    public checkSpecialHand(cards: Card[]): SpecialHand | null {
        // 分离普通牌和王牌
        const jokers = cards.filter(card => card.getSuit() === CardSuit.Joker);
        const normalCards = cards.filter(card => card.getSuit() !== CardSuit.Joker);

        // 如果有王牌，尝试所有可能的牌型组合
        if (jokers.length > 0) {
            return this.getBestHandWithJokers(normalCards, jokers);
        }

        // 没有王牌，按正常逻辑检查牌型
        const sortedCards = [...cards].sort((a, b) => Number(a.getRank()) - Number(b.getRank()));
        return this.checkNormalHand(sortedCards);
    }

    // 检查普通牌型（无王牌）
    private checkNormalHand(cards: Card[]): SpecialHand | null {
        const possibleHands: SpecialHand[] = [];
        this.checkAndAddPossibleHand(cards, possibleHands);

        if (possibleHands.length > 0) {
            return possibleHands[0];
        }
        return null;
    }

    // 使用王牌获取最佳牌型组合
    private getBestHandWithJokers(normalCards: Card[], jokers: Card[]): SpecialHand {
        const possibleHands: SpecialHand[] = [];

        // 根据王牌数量尝试不同的组合
        if (jokers.length === 1) {
            this.tryOneJokerCombinations(normalCards, possibleHands);
        } else if (jokers.length === 2) {
            this.tryTwoJokersCombinations(normalCards, possibleHands);
        }

        // 如果没有找到任何牌型，返回最低分的牌型
        if (possibleHands.length === 0) {
            const hand = this.specialHands.get(SpecialHandType.PAIR);
            hand.cards = [...normalCards, ...jokers];
            return hand;
        }

        // 按得分从高到低排序
        possibleHands.sort((a, b) => b.bonusPoints - a.bonusPoints);

        // 返回得分最高的牌型，并设置实际的牌组
        const bestHand = possibleHands[0];
        bestHand.cards = [...normalCards, ...jokers];

        // 根据王牌类型添加额外分数
        this.addJokerBonusPoints(bestHand, jokers);

        return bestHand;
    }

    // 添加王牌额外分数
    private addJokerBonusPoints(hand: SpecialHand, jokers: Card[]): void {
        if (jokers.length === 1) {
            if (jokers[0].getRank() === CardRank.JokerA) {
                hand.bonusPoints += 10; // 只有小王，额外加10分
            } else if (jokers[0].getRank() === CardRank.JokerB) {
                hand.bonusPoints += 15; // 只有大王，额外加15分
            }
        } else if (jokers.length === 2) {
            hand.bonusPoints += 30; // 两张王牌，额外加30分
        }
    }

    // 尝试用一张王牌组成各种牌型
    private tryOneJokerCombinations(normalCards: Card[], possibleHands: SpecialHand[]) {
        // 尝试所有可能的花色和点数组合
        const suitKeys = Object.keys(CardSuit) as Array<keyof typeof CardSuit>;
        const rankKeys = Object.keys(CardRank) as Array<keyof typeof CardRank>;

        // 预计算一些常用值
        const sortedNormalCards = [...normalCards].sort((a, b) => Number(a.getRank()) - Number(b.getRank()));
        const normalRanks = sortedNormalCards.map(card => card.getRank());
        const normalSuits = sortedNormalCards.map(card => card.getSuit());

        for (const suitKey of suitKeys) {
            const suit = CardSuit[suitKey];
            if (suit === CardSuit.Joker) continue;

            for (const rankKey of rankKeys) {
                const rank = CardRank[rankKey];
                if (rank === CardRank.JokerA || rank === CardRank.JokerB) continue;

                // 创建临时卡牌并检查牌型
                const tempCards = [...sortedNormalCards];
                const virtualCard = new Card();
                virtualCard.init(suit, rank);
                tempCards.push(virtualCard);

                this.checkAndAddPossibleHand(tempCards, possibleHands);

                // 如果找到最高分牌型，立即返回
                if (possibleHands.length > 0 && possibleHands[0].bonusPoints >= 120) {
                    return;
                }
            }
        }
    }

    // 尝试用两张王牌组成各种牌型
    private tryTwoJokersCombinations(normalCards: Card[], possibleHands: SpecialHand[]) {
        // 预计算一些常用值
        const sortedNormalCards = [...normalCards].sort((a, b) => Number(a.getRank()) - Number(b.getRank()));
        const normalRanks = sortedNormalCards.map(card => card.getRank());
        const normalSuits = sortedNormalCards.map(card => card.getSuit());

        // 按分数从高到低检查各种牌型
        const checkOrder = [
            { method: this.checkRoyalFlushWithTwoJokers, score: 150 },
            { method: this.checkPerfectStraightWithTwoJokers, score: 135 },
            { method: this.checkStraightFlushWithTwoJokers, score: 120 },
            { method: this.checkFourOfAKindWithTwoJokers, score: 80 }
        ];

        // 先检查高分牌型
        for (const { method, score } of checkOrder) {
            if (method.call(this, sortedNormalCards, normalRanks, normalSuits)) {
                const hand = this.specialHands.get(this.getHandTypeByScore(score));
                hand.cards = sortedNormalCards;
                possibleHands.push(hand);
                return;
            }
        }

        // 检查低分牌型
        if (this.checkFlushWithTwoJokers(sortedNormalCards, normalSuits)) {
            possibleHands.push(this.specialHands.get(SpecialHandType.FLUSH));
            return;
        }
        if (this.checkStraightWithTwoJokers(sortedNormalCards, normalRanks)) {
            possibleHands.push(this.specialHands.get(SpecialHandType.STRAIGHT));
            return;
        }
        if (this.checkFullHouseWithTwoJokers(sortedNormalCards, normalRanks)) {
            possibleHands.push(this.specialHands.get(SpecialHandType.FULL_HOUSE));
            return;
        }
        if (this.checkThreeOfAKindWithTwoJokers(sortedNormalCards, normalRanks)) {
            possibleHands.push(this.specialHands.get(SpecialHandType.THREE_OF_A_KIND));
            return;
        }
        if (this.checkTwoPairsWithTwoJokers(sortedNormalCards, normalRanks)) {
            possibleHands.push(this.specialHands.get(SpecialHandType.TWO_PAIRS));
            return;
        }
        if (this.checkPairWithTwoJokers(sortedNormalCards, normalRanks)) {
            possibleHands.push(this.specialHands.get(SpecialHandType.PAIR));
        }
    }

    // 根据分数获取牌型
    private getHandTypeByScore(score: number): SpecialHandType {
        switch (score) {
            case 150: return SpecialHandType.ROYAL_FLUSH;
            case 135: return SpecialHandType.PERFECT_STRAIGHT;
            case 120: return SpecialHandType.STRAIGHT_FLUSH;
            case 80: return SpecialHandType.FOUR_OF_A_KIND;
            case 60: return SpecialHandType.FLUSH;
            case 55: return SpecialHandType.FULL_HOUSE;
            case 30: return SpecialHandType.THREE_OF_A_KIND;
            case 15: return SpecialHandType.PAIR;
            default: return SpecialHandType.NONE;
        }
    }

    // 检查两张王牌是否可以组成完美同色序列
    private checkRoyalFlushWithTwoJokers(cards: Card[], ranks: CardRank[], suits: CardSuit[]): boolean {
        if (cards.length < 3) return false;

        // 检查是否有3张相同花色的牌
        const suitCounts = new Map<CardSuit, number>();
        for (const suit of suits) {
            suitCounts.set(suit, (suitCounts.get(suit) || 0) + 1);
        }

        // 检查每种花色
        for (const [suit, count] of suitCounts.entries()) {
            if (count >= 3) {
                // 检查这些牌中有多少是10, J, Q, K, A
                const royalRanks = [CardRank.Ten, CardRank.Jack, CardRank.Queen, CardRank.King, CardRank.Ace];
                const royalCount = ranks.filter(rank => royalRanks.indexOf(rank) !== -1).length;

                // 如果有至少3张皇家牌，两张王牌可以补齐剩下的2张
                if (royalCount >= 3) {
                    return true;
                }
            }
        }
        return false;
    }

    // 检查两张王牌是否可以组成完美序列
    private checkPerfectStraightWithTwoJokers(cards: Card[], ranks: CardRank[]): boolean {
        if (cards.length < 3) return false;

        // 检查是否有3张10, J, Q, K, A中的牌
        const royalRanks = [CardRank.Ten, CardRank.Jack, CardRank.Queen, CardRank.King, CardRank.Ace];
        const royalCount = ranks.filter(rank => royalRanks.indexOf(rank) !== -1).length;

        // 如果有至少3张皇家牌，两张王牌可以补齐剩下的2张
        return royalCount >= 3;
    }

    // 检查两张王牌是否可以组成同色序列
    private checkStraightFlushWithTwoJokers(cards: Card[], ranks: CardRank[], suits: CardSuit[]): boolean {
        if (cards.length < 3) return false;

        // 检查是否有3张相同花色的牌
        const suitCounts = new Map<CardSuit, number>();
        for (const suit of suits) {
            suitCounts.set(suit, (suitCounts.get(suit) || 0) + 1);
        }

        // 检查每种花色
        for (const [suit, count] of suitCounts.entries()) {
            if (count >= 3) {
                // 检查这些牌是否可以形成序列
                const sortedRanks = [...ranks].sort((a, b) => Number(a) - Number(b));

                // 检查是否有3张连续点数的牌
                for (let i = 0; i <= sortedRanks.length - 3; i++) {
                    // 检查这3张牌之间的空缺总数是否不超过2
                    const gaps = Number(sortedRanks[i + 2]) - Number(sortedRanks[i]) - 2;
                    if (gaps <= 2) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // 检查两张王牌是否可以组成四骑士
    private checkFourOfAKindWithTwoJokers(cards: Card[], ranks: CardRank[]): boolean {
        if (cards.length < 2) return false;

        // 检查是否有2张相同点数的牌
        const rankCounts = new Map<CardRank, number>();
        for (const rank of ranks) {
            rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
        }

        // 如果有任何点数出现2次，加上两张王牌可以组成四骑士
        for (const count of rankCounts.values()) {
            if (count >= 2) {
                return true;
            }
        }
        return false;
    }

    // 检查两张王牌是否可以组成同色
    private checkFlushWithTwoJokers(cards: Card[], suits: CardSuit[]): boolean {
        if (cards.length < 3) return false;

        // 检查是否有3张或更多相同花色的牌
        const suitCounts = new Map<CardSuit, number>();
        for (const suit of suits) {
            suitCounts.set(suit, (suitCounts.get(suit) || 0) + 1);
        }

        // 如果有任何花色出现3次或更多，加上两张王牌可以组成同色
        for (const count of suitCounts.values()) {
            if (count >= 3) {
                return true;
            }
        }
        return false;
    }

    // 检查两张王牌是否可以组成序列
    private checkStraightWithTwoJokers(cards: Card[], ranks: CardRank[]): boolean {
        if (cards.length < 3) return false;

        // 获取所有点数，并按从小到大排序
        const sortedRanks = [...ranks].sort((a, b) => Number(a) - Number(b));

        // 移除重复的点数
        const uniqueRanks = Array.from(new Set(sortedRanks));

        // 检查是否有3张连续点数的牌
        for (let i = 0; i <= uniqueRanks.length - 3; i++) {
            // 检查这3张牌之间的空缺总数是否不超过2
            const gaps = Number(uniqueRanks[i + 2]) - Number(uniqueRanks[i]) - 2;
            if (gaps <= 2) {
                return true;
            }
        }
        return false;
    }

    // 检查两张王牌是否可以组成满座
    private checkFullHouseWithTwoJokers(cards: Card[], ranks: CardRank[]): boolean {
        if (cards.length < 2) return false;

        // 两张王牌加上至少一对普通牌就可以组成满座
        const rankCounts = new Map<CardRank, number>();
        for (const rank of ranks) {
            rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
        }

        // 检查是否有任何对子
        for (const count of rankCounts.values()) {
            if (count >= 2) {
                return true;
            }
        }
        return false;
    }

    // 检查两张王牌是否可以组成三贤者
    private checkThreeOfAKindWithTwoJokers(cards: Card[], ranks: CardRank[]): boolean {
        if (cards.length < 1) return false;

        // 检查是否有至少一张相同点数的牌
        const rankCounts = new Map<CardRank, number>();
        for (const rank of ranks) {
            rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
        }

        // 如果有任何点数出现1次或更多，加上两张王牌可以组成三贤者
        for (const count of rankCounts.values()) {
            if (count >= 1) {
                return true;
            }
        }
        return false;
    }

    // 检查两张王牌是否可以组成双偶星
    private checkTwoPairsWithTwoJokers(cards: Card[], ranks: CardRank[]): boolean {
        if (cards.length < 1) return false;

        // 检查是否有至少一张相同点数的牌
        const rankCounts = new Map<CardRank, number>();
        for (const rank of ranks) {
            rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
        }

        // 如果有任何点数出现1次或更多，加上两张王牌可以组成双偶星
        for (const count of rankCounts.values()) {
            if (count >= 1) {
                return true;
            }
        }
        return false;
    }

    // 检查两张王牌是否可以组成偶星
    private checkPairWithTwoJokers(cards: Card[], ranks: CardRank[]): boolean {
        // 只要有普通牌，两张王牌就可以组成偶星
        return cards.length > 0;
    }

    // 检查并添加可能的牌型到列表
    private checkAndAddPossibleHand(cards: Card[], possibleHands: SpecialHand[]) {
        // 预计算一些常用值
        const sortedCards = [...cards].sort((a, b) => Number(a.getRank()) - Number(b.getRank()));
        const ranks = sortedCards.map(card => card.getRank());
        const suits = sortedCards.map(card => card.getSuit());

        // 按分数从高到低检查各种牌型
        const checkOrder = [
            { method: this.isRoyalFlush, type: SpecialHandType.ROYAL_FLUSH },
            { method: this.isPerfectStraight, type: SpecialHandType.PERFECT_STRAIGHT },
            { method: this.isStraightFlush, type: SpecialHandType.STRAIGHT_FLUSH },
            { method: this.isFourOfAKind, type: SpecialHandType.FOUR_OF_A_KIND },
            { method: this.isFlush, type: SpecialHandType.FLUSH },
            { method: this.isStraight, type: SpecialHandType.STRAIGHT },
            { method: this.isFullHouse, type: SpecialHandType.FULL_HOUSE },
            { method: this.isThreeOfAKind, type: SpecialHandType.THREE_OF_A_KIND },
            { method: this.isTwoPairs, type: SpecialHandType.TWO_PAIRS },
            { method: this.isPair, type: SpecialHandType.PAIR }
        ];

        for (const { method, type } of checkOrder) {
            if (method.call(this, sortedCards)) {
                const hand = this.specialHands.get(type);
                hand.cards = sortedCards;
                possibleHands.push(hand);

                // 对于高分牌型，找到就返回
                if (hand.bonusPoints >= 120) {
                    return;
                }
            }
        }
    }

    // 检查是否为完美同色序列
    private isRoyalFlush(cards: Card[]): boolean {
        if (cards.length < 5) return false;

        const suit = cards[0].getSuit();
        if (!cards.every(card => card.getSuit() === suit)) return false;

        const requiredRanks = [CardRank.Ten, CardRank.Jack, CardRank.Queen, CardRank.King, CardRank.Ace];
        return requiredRanks.every(rank => cards.some(card => card.getRank() === rank));
    }

    // 检查是否为完美序列
    private isPerfectStraight(cards: Card[]): boolean {
        if (cards.length < 5) return false;

        const requiredRanks = [CardRank.Ten, CardRank.Jack, CardRank.Queen, CardRank.King, CardRank.Ace];
        return requiredRanks.every(rank => cards.some(card => card.getRank() === rank));
    }

    // 检查是否为同色序列
    private isStraightFlush(cards: Card[]): boolean {
        if (cards.length < 5) return false;

        const suit = cards[0].getSuit();
        if (!cards.every(card => card.getSuit() === suit)) return false;

        return this.isStraight(cards);
    }

    // 检查是否为四骑士
    private isFourOfAKind(cards: Card[]): boolean {
        const rankCount = new Map<CardRank, number>();
        for (const card of cards) {
            const rank = card.getRank();
            const count = (rankCount.get(rank) || 0) + 1;
            rankCount.set(rank, count);
            if (count >= 4) return true;
        }
        return false;
    }

    // 检查是否为满座
    private isFullHouse(cards: Card[]): boolean {
        const rankCount = new Map<CardRank, number>();
        let hasThree = false;
        let hasTwo = false;

        for (const card of cards) {
            const rank = card.getRank();
            const count = (rankCount.get(rank) || 0) + 1;
            rankCount.set(rank, count);

            if (count === 3) hasThree = true;
            if (count === 2) hasTwo = true;
        }

        return hasThree && hasTwo;
    }

    // 检查是否为同色
    private isFlush(cards: Card[]): boolean {
        if (cards.length < 5) return false;
        const suit = cards[0].getSuit();
        return cards.every(card => card.getSuit() === suit);
    }

    // 检查是否为序列
    private isStraight(cards: Card[]): boolean {
        if (cards.length < 5) return false;

        const hasAce = cards.some(card => card.getRank() === CardRank.Ace);
        const sortedRanks = cards.map(card => Number(card.getRank())).sort((a, b) => a - b);

        // 检查是否为连续
        let isConsecutive = true;
        for (let i = 1; i < sortedRanks.length; i++) {
            if (sortedRanks[i] !== sortedRanks[i - 1] + 1) {
                isConsecutive = false;
                break;
            }
        }

        // 如果包含A，检查是否为A-2-3-4-5
        if (!isConsecutive && hasAce) {
            const lowStraight = [CardRank.Ace, CardRank.Two, CardRank.Three, CardRank.Four, CardRank.Five];
            return lowStraight.every(rank => sortedRanks.indexOf(Number(rank)) !== -1);
        }

        return isConsecutive;
    }

    // 检查是否为三贤者
    private isThreeOfAKind(cards: Card[]): boolean {
        const rankCount = new Map<CardRank, number>();
        for (const card of cards) {
            const rank = card.getRank();
            const count = (rankCount.get(rank) || 0) + 1;
            rankCount.set(rank, count);
            if (count >= 3) return true;
        }
        return false;
    }

    // 检查是否为双偶星
    private isTwoPairs(cards: Card[]): boolean {
        const rankCount = new Map<CardRank, number>();
        let pairCount = 0;

        for (const card of cards) {
            const rank = card.getRank();
            const count = (rankCount.get(rank) || 0) + 1;
            rankCount.set(rank, count);

            if (count === 2) pairCount++;
            if (pairCount >= 2) return true;
        }

        return false;
    }

    // 检查是否为偶星
    private isPair(cards: Card[]): boolean {
        const rankCount = new Map<CardRank, number>();
        for (const card of cards) {
            const rank = card.getRank();
            const count = (rankCount.get(rank) || 0) + 1;
            rankCount.set(rank, count);
            if (count >= 2) return true;
        }
        return false;
    }
} 