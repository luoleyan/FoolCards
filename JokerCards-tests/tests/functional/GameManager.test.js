/**
 * GameManager功能测试
 * 测试游戏管理器的核心功能
 */

const { Card, CardSuit, CardRank } = require('../utils/card-mock');
const { GameManager } = require('../utils/game-manager-mock');
const { AIOpponent } = require('../utils/ai-opponent-mock');

describe('GameManager功能测试', () => {
  let gameManager;
  let cards = [];

  beforeEach(() => {
    gameManager = new GameManager();

    // 创建AI对手
    const aiOpponent = new AIOpponent();
    aiOpponent.init(gameManager, gameManager.opponentHand, gameManager.playAreas);
    gameManager.aiOpponent = aiOpponent;

    // 创建测试卡牌
    cards = [
      new Card(CardSuit.Spade, CardRank.Ace),
      new Card(CardSuit.Heart, CardRank.King),
      new Card(CardSuit.Club, CardRank.Queen),
      new Card(CardSuit.Diamond, CardRank.Jack),
      new Card(CardSuit.Spade, CardRank.Ten),
    ];

    // 将卡牌添加到玩家手牌
    cards.forEach((card) => {
      gameManager.playerHand.addChild(card.node);
    });
  });

  test('开始新回合', () => {
    expect(gameManager.currentRound).toBe(0);
    gameManager.startNewRound();
    expect(gameManager.currentRound).toBe(1);
    expect(gameManager.exchangeCount).toBe(5);
  });

  test('出牌功能', () => {
    const card = cards[0];
    const result = gameManager.playCard(card, gameManager.playAreas[0]);
    expect(result).toBe(true);
    expect(gameManager.playAreas[0].children).toContain(card);
    expect(gameManager.playerPlayedInArea[0]).toBe(true);
    expect(gameManager.cardsPlayedThisTurn).toBe(1);
  });

  test('回合出牌限制', () => {
    // 出三张牌
    gameManager.playCard(cards[0], gameManager.playAreas[0]);
    gameManager.playCard(cards[1], gameManager.playAreas[1]);
    gameManager.playCard(cards[2], gameManager.playAreas[2]);

    expect(gameManager.cardsPlayedThisTurn).toBe(3);
    expect(gameManager.canPlayCard()).toBe(false);

    // 添加额外出牌次数
    gameManager.extraPlayCount = 1;
    expect(gameManager.canPlayCard()).toBe(true);

    // 使用额外出牌次数
    gameManager.playCard(cards[3], gameManager.playAreas[0]);
    expect(gameManager.extraPlayCount).toBe(0);
    expect(gameManager.canPlayCard()).toBe(false);
  });

  test('结束回合', () => {
    gameManager.playCard(cards[0], gameManager.playAreas[0]);
    gameManager.playCard(cards[1], gameManager.playAreas[1]);

    expect(gameManager.cardsPlayedThisTurn).toBe(2);
    gameManager.endTurn();

    expect(gameManager.cardsPlayedThisTurn).toBe(0);
    expect(gameManager.currentRound).toBe(1);
    expect(gameManager.currentTurnPlayedCards.size).toBe(0);
  });

  test('分数计算', () => {
    // 在同一区域放置同花牌
    const card1 = new Card(CardSuit.Spade, CardRank.Ace);
    const card2 = new Card(CardSuit.Spade, CardRank.King);

    gameManager.playCard(card1, gameManager.playAreas[0]);
    gameManager.playCard(card2, gameManager.playAreas[0]);

    // 检查分数计算
    expect(gameManager.areaScores[0]).toBeGreaterThan(0);
    // 同花应该有额外加分
    expect(gameManager.areaScores[0]).toBeGreaterThan(14); // 1 + 13 = 14 (基础分)
  });

  test('换牌功能', () => {
    // 初始换牌次数
    const initialExchangeCount = gameManager.exchangeCount;
    expect(initialExchangeCount).toBeGreaterThan(0);

    // 执行换牌
    const card = cards[0];
    const exchangeResult = gameManager.exchangeCard(card);

    // 检查换牌结果
    expect(exchangeResult).toBe(true);
    expect(gameManager.exchangeCount).toBe(initialExchangeCount - 1);

    // 用完所有换牌次数
    for (let i = 0; i < initialExchangeCount - 1; i++) {
      if (i + 1 < cards.length) {
        gameManager.exchangeCard(cards[i + 1]);
      }
    }

    // 检查换牌次数是否为0
    expect(gameManager.exchangeCount).toBe(0);

    // 尝试再次换牌，应该失败
    const finalExchangeResult = gameManager.exchangeCard(cards[4]);
    expect(finalExchangeResult).toBe(false);
  });

  test('游戏结束', () => {
    // 设置当前回合为最大回合数
    gameManager.currentRound = gameManager.maxRounds;

    // 监视showGameOver方法
    const showGameOverSpy = jest.spyOn(gameManager, 'showGameOver');

    // 开始新回合，应该触发游戏结束
    gameManager.startNewRound();

    // 验证showGameOver被调用
    expect(showGameOverSpy).toHaveBeenCalled();
    expect(gameManager.isGameOver).toBe(true);
  });
});
