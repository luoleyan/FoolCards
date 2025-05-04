/**
 * Card类单元测试
 * 测试Card组件的基本功能
 */

const { Card, CardSuit, CardRank } = require('../utils/card-mock');

describe('Card类单元测试', () => {
  let card;

  beforeEach(() => {
    card = new Card();
  });

  test('初始化卡牌', async () => {
    await card.init(CardSuit.Spade, CardRank.Ace);
    expect(card.suit).toBe(CardSuit.Spade);
    expect(card.rank).toBe(CardRank.Ace);
  });

  test('获取卡牌全名', async () => {
    await card.init(CardSuit.Heart, CardRank.King);
    expect(card.getFullName()).toBe('Heart K');
  });

  test('显示卡牌正面', async () => {
    await card.init(CardSuit.Club, CardRank.Queen);
    await card.showCardFace();
    expect(card._isFaceUp).toBe(true);
  });

  test('显示卡牌背面', async () => {
    await card.init(CardSuit.Diamond, CardRank.Jack);
    await card.showCardFace();
    expect(card._isFaceUp).toBe(true);
    await card.showCardBack();
    expect(card._isFaceUp).toBe(false);
  });

  test('万能牌转换', async () => {
    await card.init(CardSuit.Joker, CardRank.JokerA);
    expect(card.suit).toBe(CardSuit.Joker);
    expect(card.rank).toBe(CardRank.JokerA);

    // 转换万能牌
    card.changeCardInfo(CardSuit.Heart, CardRank.Ace);
    expect(card.suit).toBe(CardSuit.Heart);
    expect(card.rank).toBe(CardRank.Ace);
  });

  test('非万能牌不能转换', async () => {
    await card.init(CardSuit.Spade, CardRank.Ace);

    // 尝试转换非万能牌
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    card.changeCardInfo(CardSuit.Heart, CardRank.King);

    // 验证警告信息
    expect(consoleSpy).toHaveBeenCalledWith('Only Joker cards can be transformed');

    // 验证卡牌信息未变
    expect(card.suit).toBe(CardSuit.Spade);
    expect(card.rank).toBe(CardRank.Ace);

    consoleSpy.mockRestore();
  });

  test('矩形重叠检测', () => {
    const rect1 = { x: 0, y: 0, width: 100, height: 100 };
    const rect2 = { x: 50, y: 50, width: 100, height: 100 };
    const rect3 = { x: 200, y: 200, width: 100, height: 100 };

    expect(card.isOverlapping(rect1, rect2)).toBe(true);
    expect(card.isOverlapping(rect1, rect3)).toBe(false);
  });
});
