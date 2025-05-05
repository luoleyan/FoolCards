/**
 * AIOpponent功能测试
 * 测试AI对手的行为和决策
 */

const { Card, CardSuit, CardRank } = require('../utils/card-mock');
const { AIOpponent } = require('../utils/ai-opponent-mock');
const { SceneEffect, SceneEffectType } = require('../utils/scene-effect-mock');
const { SpecialHandsManager } = require('../utils/special-hands-mock');

describe('AI对手功能测试', () => {
  let aiOpponent;
  let playAreas;
  let opponentHand;
  let specialHandsManager;

  beforeEach(() => {
    // 创建游戏区域
    playAreas = [
      { name: 'PlayArea1', children: [], effect: null },
      { name: 'PlayArea2', children: [], effect: null },
      { name: 'PlayArea3', children: [], effect: null }
    ];

    // 创建对手手牌区域
    opponentHand = { name: 'OpponentHand', children: [] };

    // 创建特殊牌型管理器
    specialHandsManager = new SpecialHandsManager();

    // 创建AI对手
    aiOpponent = new AIOpponent();

    // 初始化AI对手
    const gameManager = { name: 'GameManager' };
    aiOpponent.init(gameManager, opponentHand, playAreas);

    // 清空所有区域
    playAreas.forEach(area => {
      area.children = [];
      area.effect = null;
    });

    // 清空对手手牌
    opponentHand.children = [];

    // 添加卡牌到对手手牌
    const cards = [
      new Card(CardSuit.Spade, CardRank.Ace),
      new Card(CardSuit.Heart, CardRank.King),
      new Card(CardSuit.Club, CardRank.Queen),
      new Card(CardSuit.Diamond, CardRank.Jack),
      new Card(CardSuit.Spade, CardRank.Ten)
    ];

    cards.forEach(card => {
      opponentHand.children.push(card);
    });

    // 清空AI出牌记录
    aiOpponent.clearPlayedCardsRecord();
  });

  test('AI对手初始化', () => {
    expect(aiOpponent.opponentHand).toBe(opponentHand);
    expect(aiOpponent.playAreas).toBe(playAreas);
    expect(aiOpponent.aiPlayedCards).toBeInstanceOf(Map);
    expect(aiOpponent.aiPlayedCards.size).toBe(0);
  });

  test('AI对手出牌', () => {
    // 记录初始手牌数量
    const initialHandCount = opponentHand.children.length;

    // AI出牌
    aiOpponent.playCards(3);

    // 检查是否出牌
    expect(opponentHand.children.length).toBeLessThan(initialHandCount);

    // 检查是否记录了出牌
    let totalPlayedCards = 0;
    for (const cards of aiOpponent.aiPlayedCards.values()) {
      totalPlayedCards += cards.length;
    }
    expect(totalPlayedCards).toBeGreaterThan(0);

    // 检查是否所有出牌都放入了游戏区域
    let totalCardsInPlayAreas = 0;
    playAreas.forEach(area => {
      totalCardsInPlayAreas += area.children.length;
    });

    expect(totalCardsInPlayAreas).toBeGreaterThan(0);
  });

  test('AI对手清除出牌记录', () => {
    // AI出牌
    aiOpponent.playCards(3);

    // 检查是否记录了出牌
    let totalPlayedCards = 0;
    for (const cards of aiOpponent.aiPlayedCards.values()) {
      totalPlayedCards += cards.length;
    }
    expect(totalPlayedCards).toBeGreaterThan(0);

    // 清除出牌记录
    aiOpponent.clearPlayedCardsRecord();

    // 检查是否清除了出牌记录
    expect(aiOpponent.aiPlayedCards.size).toBe(0);
  });

  test('AI对手策略 - 同花牌型', () => {
    // 清空手牌和场地区域
    opponentHand.children = [];
    playAreas.forEach(area => {
      area.children = [];
      area.effect = null;
    });

    // 添加同花牌型
    const flushCards = [
      new Card(CardSuit.Heart, CardRank.Ace),
      new Card(CardSuit.Heart, CardRank.King),
      new Card(CardSuit.Heart, CardRank.Queen),
      new Card(CardSuit.Heart, CardRank.Jack),
      new Card(CardSuit.Heart, CardRank.Ten)
    ];

    flushCards.forEach(card => {
      opponentHand.children.push(card);
    });

    // 添加场景效果
    const suitBonusEffect = new SceneEffect(SceneEffectType.SUIT_BONUS, '花色加成', '同花牌型额外加分');
    suitBonusEffect.reveal();
    playAreas[0].effect = suitBonusEffect;

    // 清空AI出牌记录
    aiOpponent.clearPlayedCardsRecord();

    // AI出牌
    aiOpponent.playCards();

    // 检查是否将同花牌型放入了有花色加成的区域
    expect(playAreas[0].children.length).toBeGreaterThan(0);

    // 检查是否所有同花牌都放入了同一区域
    const cardsInArea0 = playAreas[0].children;
    if (cardsInArea0.length > 0) {
      const allSameSuit = cardsInArea0.every(card => card.suit === CardSuit.Heart);
      expect(allSameSuit).toBe(true);
    }
  });

  test('AI对手策略 - 顺子牌型', () => {
    // 清空手牌和场地区域
    opponentHand.children = [];
    playAreas.forEach(area => {
      area.children = [];
      area.effect = null;
    });

    // 添加顺子牌型
    const straightCards = [
      new Card(CardSuit.Spade, CardRank.Ace),
      new Card(CardSuit.Heart, CardRank.Two),
      new Card(CardSuit.Club, CardRank.Three),
      new Card(CardSuit.Diamond, CardRank.Four),
      new Card(CardSuit.Spade, CardRank.Five)
    ];

    straightCards.forEach(card => {
      opponentHand.children.push(card);
    });

    // 添加场景效果
    const chainEffect = new SceneEffect(SceneEffectType.CHAIN, '连锁效果', '顺子额外加分');
    chainEffect.reveal();
    playAreas[1].effect = chainEffect;

    // 清空AI出牌记录
    aiOpponent.clearPlayedCardsRecord();

    // AI出牌
    aiOpponent.playCards();

    // 检查是否将顺子牌型放入了有连锁效果的区域
    expect(playAreas[1].children.length).toBeGreaterThan(0);

    // 检查是否有顺子牌放入了同一区域
    const cardsInArea1 = playAreas[1].children;
    if (cardsInArea1.length > 0) {
      // 检查是否有A-5的牌
      const hasSequenceCards = cardsInArea1.some(card =>
        card.rank === CardRank.Ace ||
        card.rank === CardRank.Two ||
        card.rank === CardRank.Three ||
        card.rank === CardRank.Four ||
        card.rank === CardRank.Five
      );
      expect(hasSequenceCards).toBe(true);
    }
  });

  test('AI对手策略 - 高点数牌型', () => {
    // 清空手牌和场地区域
    opponentHand.children = [];
    playAreas.forEach(area => {
      area.children = [];
      area.effect = null;
    });

    // 添加高点数牌型
    const highRankCards = [
      new Card(CardSuit.Spade, CardRank.Jack),
      new Card(CardSuit.Heart, CardRank.Queen),
      new Card(CardSuit.Club, CardRank.King),
      new Card(CardSuit.Diamond, CardRank.Ten),
      new Card(CardSuit.Spade, CardRank.Nine)
    ];

    highRankCards.forEach(card => {
      opponentHand.children.push(card);
    });

    // 添加场景效果
    const rankBonusEffect = new SceneEffect(SceneEffectType.RANK_BONUS, '点数加成', 'JQK额外加分');
    rankBonusEffect.reveal();
    playAreas[2].effect = rankBonusEffect;

    // 清空AI出牌记录
    aiOpponent.clearPlayedCardsRecord();

    // AI出牌
    aiOpponent.playCards();

    // 检查是否将高点数牌型放入了有点数加成的区域
    expect(playAreas[2].children.length).toBeGreaterThan(0);

    // 检查是否JQK牌放入了同一区域
    const cardsInArea2 = playAreas[2].children;
    if (cardsInArea2.length > 0) {
      const hasJQK = cardsInArea2.some(card =>
        card.rank === CardRank.Jack ||
        card.rank === CardRank.Queen ||
        card.rank === CardRank.King
      );
      expect(hasJQK).toBe(true);
    }
  });

  test('AI对手没有手牌时不出牌', () => {
    // 清空手牌和场地区域
    opponentHand.children = [];
    playAreas.forEach(area => {
      area.children = [];
      area.effect = null;
    });

    // 清空AI出牌记录
    aiOpponent.clearPlayedCardsRecord();

    // AI出牌
    aiOpponent.playCards(3);

    // 检查是否没有出牌
    let totalPlayedCards = 0;
    for (const cards of aiOpponent.aiPlayedCards.values()) {
      totalPlayedCards += cards.length;
    }
    expect(totalPlayedCards).toBe(0);

    // 检查是否所有游戏区域都没有卡牌
    let totalCardsInPlayAreas = 0;
    playAreas.forEach(area => {
      totalCardsInPlayAreas += area.children.length;
    });

    expect(totalCardsInPlayAreas).toBe(0);
  });
});
