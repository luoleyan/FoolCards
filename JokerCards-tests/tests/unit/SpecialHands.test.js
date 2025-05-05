/**
 * SpecialHandsManager类单元测试
 * 测试特殊牌型管理器的功能
 */

const { Card, CardSuit, CardRank } = require('../utils/card-mock');
const { SpecialHandsManager, SpecialHandType } = require('../utils/special-hands-mock');

describe('SpecialHandsManager类单元测试', () => {
  let specialHandsManager;

  beforeEach(() => {
    specialHandsManager = new SpecialHandsManager();
  });

  test('检测同花顺', () => {
    // 创建同花顺
    const cards = [
      new Card(CardSuit.Spade, CardRank.Ace),
      new Card(CardSuit.Spade, CardRank.Two),
      new Card(CardSuit.Spade, CardRank.Three),
      new Card(CardSuit.Spade, CardRank.Four),
    ];

    expect(specialHandsManager.checkStraightFlush(cards)).toBe(true);
  });

  test('检测四条', () => {
    // 创建四条
    const cards = [
      new Card(CardSuit.Spade, CardRank.King),
      new Card(CardSuit.Heart, CardRank.King),
      new Card(CardSuit.Club, CardRank.King),
      new Card(CardSuit.Diamond, CardRank.King),
    ];

    expect(specialHandsManager.checkFourOfAKind(cards)).toBe(true);
  });

  test('检测葫芦', () => {
    // 创建葫芦
    const cards = [
      new Card(CardSuit.Spade, CardRank.Queen),
      new Card(CardSuit.Heart, CardRank.Queen),
      new Card(CardSuit.Club, CardRank.Queen),
      new Card(CardSuit.Spade, CardRank.Jack),
      new Card(CardSuit.Heart, CardRank.Jack),
    ];

    expect(specialHandsManager.checkFullHouse(cards)).toBe(true);
  });

  test('检测同花', () => {
    // 创建同花
    const cards = [
      new Card(CardSuit.Heart, CardRank.Ace),
      new Card(CardSuit.Heart, CardRank.Five),
      new Card(CardSuit.Heart, CardRank.Nine),
    ];

    expect(specialHandsManager.checkFlush(cards)).toBe(true);
  });

  test('检测顺子', () => {
    // 创建顺子
    const cards = [
      new Card(CardSuit.Spade, CardRank.Three),
      new Card(CardSuit.Heart, CardRank.Four),
      new Card(CardSuit.Diamond, CardRank.Five),
    ];

    expect(specialHandsManager.checkStraight(cards)).toBe(true);
  });

  test('检测三条', () => {
    // 创建三条
    const cards = [
      new Card(CardSuit.Spade, CardRank.Seven),
      new Card(CardSuit.Heart, CardRank.Seven),
      new Card(CardSuit.Club, CardRank.Seven),
    ];

    expect(specialHandsManager.checkThreeOfAKind(cards)).toBe(true);
  });

  test('检测两对', () => {
    // 创建两对
    const cards = [
      new Card(CardSuit.Spade, CardRank.Eight),
      new Card(CardSuit.Heart, CardRank.Eight),
      new Card(CardSuit.Spade, CardRank.Ten),
      new Card(CardSuit.Heart, CardRank.Ten),
    ];

    expect(specialHandsManager.checkTwoPair(cards)).toBe(true);
  });

  test('检测对子', () => {
    // 创建对子
    const cards = [
      new Card(CardSuit.Spade, CardRank.Nine),
      new Card(CardSuit.Heart, CardRank.Nine),
    ];

    expect(specialHandsManager.checkOnePair(cards)).toBe(true);
  });

  test('计算特殊牌型分数', () => {
    // 创建同花顺
    const straightFlush = [
      new Card(CardSuit.Spade, CardRank.Ace),
      new Card(CardSuit.Spade, CardRank.Two),
      new Card(CardSuit.Spade, CardRank.Three),
      new Card(CardSuit.Spade, CardRank.Four),
    ];

    // 创建四条
    const fourOfAKind = [
      new Card(CardSuit.Spade, CardRank.King),
      new Card(CardSuit.Heart, CardRank.King),
      new Card(CardSuit.Club, CardRank.King),
      new Card(CardSuit.Diamond, CardRank.King),
    ];

    // 创建普通牌组
    const normalCards = [
      new Card(CardSuit.Spade, CardRank.Two),
      new Card(CardSuit.Heart, CardRank.Five),
    ];

    // 检查分数计算
    expect(specialHandsManager.calculateSpecialHandScore(straightFlush)).toBe(150);
    expect(specialHandsManager.calculateSpecialHandScore(fourOfAKind)).toBe(80);
    expect(specialHandsManager.calculateSpecialHandScore(normalCards)).toBe(0);
  });

  test('计算基础分数', () => {
    // 创建测试牌组
    const cards = [
      new Card(CardSuit.Spade, CardRank.Ace), // 1分
      new Card(CardSuit.Heart, CardRank.Ten), // 10分
      new Card(CardSuit.Club, CardRank.Jack), // 11分
      new Card(CardSuit.Diamond, CardRank.Queen), // 12分
      new Card(CardSuit.Spade, CardRank.King), // 13分
    ];

    // 计算基础分数
    const score = specialHandsManager.calculateBaseScore(cards);

    // 预期分数：1 + 10 + 11 + 12 + 13 = 47
    expect(score).toBe(47);
  });
});
