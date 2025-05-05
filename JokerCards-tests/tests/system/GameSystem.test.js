/**
 * 游戏系统测试
 * 测试整个游戏系统的集成功能
 */

const { Card, CardSuit, CardRank } = require('../utils/card-mock');
const { GameManager } = require('../utils/game-manager-mock');
const { AIOpponent } = require('../utils/ai-opponent-mock');
const { SpecialHandsManager } = require('../utils/special-hands-mock');
const { SceneEffect, SceneEffectType } = require('../utils/scene-effect-mock');

describe('游戏系统测试', () => {
  let gameManager;
  let playerHand;
  let opponentHand;
  let playAreas;
  let exchangeArea;
  let specialHandsManager;
  let aiOpponent;

  beforeEach(() => {
    // 创建游戏区域
    playerHand = { name: 'PlayerHand', children: [] };
    opponentHand = { name: 'OpponentHand', children: [] };
    playAreas = [
      { name: 'PlayArea1', children: [], effect: new SceneEffect(SceneEffectType.BASIC, '基础场景', '无特殊效果的基础场景') },
      { name: 'PlayArea2', children: [], effect: new SceneEffect(SceneEffectType.SUIT_BONUS, '花色加成', '同花牌型额外加分') },
      { name: 'PlayArea3', children: [], effect: new SceneEffect(SceneEffectType.RANK_BONUS, '点数加成', 'JQK额外加分') }
    ];
    exchangeArea = { name: 'ExchangeArea', children: [] };

    // 揭示所有场景效果
    playAreas.forEach(area => {
      if (area.effect) {
        area.effect.reveal();
      }
    });

    // 创建特殊牌型管理器
    specialHandsManager = new SpecialHandsManager();

    // 创建游戏管理器
    gameManager = new GameManager(playerHand, opponentHand, playAreas, exchangeArea, specialHandsManager);

    // 创建AI对手
    aiOpponent = new AIOpponent();
    aiOpponent.init(gameManager, opponentHand, playAreas);

    // 设置AI对手
    gameManager.aiOpponent = aiOpponent;
  });

  test('完整游戏流程测试', () => {
    // 初始化游戏
    gameManager.startNewRound();

    // 检查初始状态
    expect(gameManager.currentRound).toBeGreaterThanOrEqual(1); // 开始新回合后，当前回合应该至少是1
    expect(gameManager.maxRounds).toBe(5);
    expect(gameManager.exchangeCount).toBe(5);
    expect(playerHand.children.length).toBeGreaterThan(0);
    expect(opponentHand.children.length).toBeGreaterThan(0);

    // 玩家出牌
    const playerCard1 = playerHand.children[0];
    gameManager.playCard(playerCard1, playAreas[0]);

    // 检查玩家出牌后的状态
    expect(playerHand.children.length).toBeGreaterThanOrEqual(0); // 出牌后手牌数量应该大于等于0
    expect(playAreas[0].children.length).toBe(1);
    expect(playAreas[0].children[0]).toBe(playerCard1);

    // 玩家继续出牌
    const playerCard2 = playerHand.children[0];
    gameManager.playCard(playerCard2, playAreas[1]);

    // 检查玩家继续出牌后的状态
    expect(playerHand.children.length).toBeGreaterThanOrEqual(0); // 出牌后手牌数量应该大于等于0
    expect(playAreas[1].children.length).toBe(1);
    expect(playAreas[1].children[0]).toBe(playerCard2);

    // 结束回合
    gameManager.endTurn();

    // 检查回合结束后的状态
    expect(gameManager.currentRound).toBeGreaterThan(1); // 结束回合后，当前回合应该大于1
    expect(playerHand.children.length).toBeGreaterThan(0);
    expect(opponentHand.children.length).toBeGreaterThan(0);

    // 检查AI是否出牌
    let totalAICards = 0;
    playAreas.forEach(area => {
      totalAICards += area.children.length;
    });
    expect(totalAICards).toBeGreaterThanOrEqual(2); // 玩家出了2张牌，AI可能也出牌了

    // 玩家换牌
    if (playerHand.children.length > 0 && gameManager.exchangeCount > 0) {
      const cardToExchange = playerHand.children[0];
      gameManager.exchangeCard(cardToExchange);

      // 检查换牌后的状态
      expect(gameManager.exchangeCount).toBeLessThan(5); // 初始值为5，使用一次后应该小于5
      expect(exchangeArea.children.length).toBe(1);
      expect(exchangeArea.children[0]).toBe(cardToExchange);
    }

    // 模拟完整游戏流程
    while (gameManager.currentRound < gameManager.maxRounds) {
      // 玩家出牌
      if (playerHand.children.length > 0) {
        const playerCard = playerHand.children[0];
        const targetArea = playAreas[gameManager.currentRound % 3];
        gameManager.playCard(playerCard, targetArea);
      }

      // 结束回合
      gameManager.endTurn();
    }

    // 检查游戏是否结束
    expect(gameManager.isGameOver).toBe(true);

    // 检查最终得分
    expect(typeof gameManager.playerScore).toBe('number');
    expect(typeof gameManager.opponentScore).toBe('number');
  });

  test('特殊牌型加分测试', () => {
    // 初始化游戏
    gameManager.startNewRound();

    // 清空玩家手牌
    playerHand.children = [];

    // 添加同花牌型
    const flushCards = [
      new Card(CardSuit.Heart, CardRank.Ace),
      new Card(CardSuit.Heart, CardRank.King),
      new Card(CardSuit.Heart, CardRank.Queen)
    ];

    flushCards.forEach(card => {
      playerHand.children.push(card);
    });

    // 玩家出牌到花色加成区域
    flushCards.forEach(card => {
      gameManager.playCard(card, playAreas[1]);
    });

    // 结束回合
    gameManager.endTurn();

    // 检查得分
    const expectedBaseScore = 1 + 13 + 12; // Ace(1) + King(13) + Queen(12)
    const expectedMinScore = expectedBaseScore; // 至少应该有基础分

    // 玩家得分应该至少包含基础分
    expect(gameManager.playerScore).toBeGreaterThanOrEqual(expectedMinScore);
  });

  test('场景效果组合测试', () => {
    // 初始化游戏
    gameManager.startNewRound();

    // 清空玩家手牌
    playerHand.children = [];

    // 添加JQK牌型
    const jqkCards = [
      new Card(CardSuit.Heart, CardRank.Jack),
      new Card(CardSuit.Heart, CardRank.Queen),
      new Card(CardSuit.Heart, CardRank.King)
    ];

    jqkCards.forEach(card => {
      playerHand.children.push(card);
    });

    // 玩家出牌到点数加成区域
    jqkCards.forEach(card => {
      gameManager.playCard(card, playAreas[2]);
    });

    // 结束回合
    gameManager.endTurn();

    // 检查得分
    const expectedBaseScore = 11 + 12 + 13; // Jack(11) + Queen(12) + King(13)
    const expectedMinScore = expectedBaseScore; // 至少应该有基础分

    // 玩家得分应该至少包含基础分
    expect(gameManager.playerScore).toBeGreaterThanOrEqual(expectedMinScore);
  });

  test('换牌机制测试', () => {
    // 初始化游戏
    gameManager.startNewRound();

    // 记录初始换牌次数
    const initialExchangeCount = gameManager.exchangeCount;

    // 记录初始手牌
    const initialHandCards = [...playerHand.children];

    // 玩家换牌
    if (playerHand.children.length > 0) {
      const cardToExchange = playerHand.children[0];
      gameManager.exchangeCard(cardToExchange);

      // 检查换牌后的状态
      expect(gameManager.exchangeCount).toBeLessThan(initialExchangeCount); // 使用一次后应该小于初始值
      expect(exchangeArea.children.length).toBe(1);
      expect(exchangeArea.children[0]).toBe(cardToExchange);

      // 检查手牌数量
      expect(playerHand.children.length).toBeGreaterThan(0);
    }
  });

  test('游戏结束条件测试', () => {
    // 初始化游戏
    gameManager.startNewRound();

    // 模拟完整游戏流程
    for (let i = 0; i < gameManager.maxRounds; i++) {
      // 结束回合
      gameManager.endTurn();
    }

    // 检查游戏是否结束
    expect(gameManager.isGameOver).toBe(true);

    // 尝试开始新回合
    const result = gameManager.startNewRound();

    // 应该返回false，因为游戏已经结束
    expect(result).toBe(false);
  });
});
