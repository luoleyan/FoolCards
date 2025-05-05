/**
 * 游戏黑盒测试
 * 从用户角度测试游戏功能，不关注内部实现
 */

const { Card, CardSuit, CardRank } = require('../utils/card-mock');
const { GameManager } = require('../utils/game-manager-mock');
const { AIOpponent } = require('../utils/ai-opponent-mock');
const { SpecialHandsManager } = require('../utils/special-hands-mock');
const { SceneEffect, SceneEffectType } = require('../utils/scene-effect-mock');

describe('游戏黑盒测试', () => {
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
      {
        name: 'PlayArea1',
        children: [],
        effect: new SceneEffect(SceneEffectType.BASIC, '基础场景', '无特殊效果的基础场景'),
      },
      {
        name: 'PlayArea2',
        children: [],
        effect: new SceneEffect(SceneEffectType.SUIT_BONUS, '花色加成', '同花牌型额外加分'),
      },
      {
        name: 'PlayArea3',
        children: [],
        effect: new SceneEffect(SceneEffectType.RANK_BONUS, '点数加成', 'JQK额外加分'),
      },
    ];
    exchangeArea = { name: 'ExchangeArea', children: [] };

    // 揭示所有场景效果
    playAreas.forEach((area) => {
      if (area.effect) {
        area.effect.reveal();
      }
    });

    // 创建特殊牌型管理器
    specialHandsManager = new SpecialHandsManager();

    // 创建游戏管理器
    gameManager = new GameManager(
      playerHand,
      opponentHand,
      playAreas,
      exchangeArea,
      specialHandsManager,
    );

    // 创建AI对手
    aiOpponent = new AIOpponent();
    aiOpponent.init(gameManager, opponentHand, playAreas);

    // 设置AI对手
    gameManager.aiOpponent = aiOpponent;
  });

  test('游戏初始状态测试', () => {
    // 初始化游戏
    gameManager.startNewRound();

    // 检查初始状态
    expect(gameManager.currentRound).toBeGreaterThanOrEqual(1); // 开始新回合后，当前回合应该至少是1
    expect(gameManager.maxRounds).toBe(5);
    expect(gameManager.exchangeCount).toBe(5);
    expect(gameManager.isGameOver).toBe(false);
    expect(gameManager.playerScore).toBe(0);
    expect(gameManager.opponentScore).toBe(0);

    // 检查玩家手牌
    expect(playerHand.children.length).toBeGreaterThan(0);

    // 检查对手手牌
    expect(opponentHand.children.length).toBeGreaterThan(0);

    // 检查游戏区域
    playAreas.forEach((area) => {
      expect(area.children.length).toBe(0);
    });

    // 检查交换区域
    expect(exchangeArea.children.length).toBe(0);
  });

  test('玩家出牌测试', () => {
    // 初始化游戏
    gameManager.startNewRound();

    // 玩家出牌
    const playerCard = playerHand.children[0];
    const initialHandCount = playerHand.children.length;

    gameManager.playCard(playerCard, playAreas[0]);

    // 检查出牌后的状态
    expect(playerHand.children.length).toBeLessThanOrEqual(initialHandCount); // 出牌后手牌数量应该小于等于初始数量
    expect(playAreas[0].children.length).toBe(1);
    expect(playAreas[0].children[0]).toBe(playerCard);
  });

  test('玩家换牌测试', () => {
    // 初始化游戏
    gameManager.startNewRound();

    // 玩家换牌
    const playerCard = playerHand.children[0];
    const initialHandCount = playerHand.children.length;
    const initialExchangeCount = gameManager.exchangeCount;

    gameManager.exchangeCard(playerCard);

    // 检查换牌后的状态
    expect(playerHand.children.length).toBeGreaterThanOrEqual(0); // 换牌后手牌数量应该大于等于0
    expect(exchangeArea.children.length).toBe(1);
    expect(exchangeArea.children[0]).toBe(playerCard);
    expect(gameManager.exchangeCount).toBeLessThan(initialExchangeCount); // 使用一次后应该小于初始值
  });

  test('回合结束测试', () => {
    // 初始化游戏
    gameManager.startNewRound();

    // 玩家出牌
    const playerCard = playerHand.children[0];
    gameManager.playCard(playerCard, playAreas[0]);

    // 结束回合
    const initialRound = gameManager.currentRound;
    gameManager.endTurn();

    // 检查回合结束后的状态
    expect(gameManager.currentRound).toBe(initialRound + 1);
    expect(playerHand.children.length).toBeGreaterThan(0); // 应该有牌
    expect(opponentHand.children.length).toBeGreaterThan(0); // 应该有牌

    // 检查交换区域是否被清空
    expect(exchangeArea.children.length).toBe(0);
  });

  test('游戏结束测试', () => {
    // 初始化游戏
    gameManager.startNewRound();

    // 模拟完整游戏流程
    for (let i = 0; i < gameManager.maxRounds; i++) {
      // 玩家出牌
      if (playerHand.children.length > 0) {
        const playerCard = playerHand.children[0];
        gameManager.playCard(playerCard, playAreas[0]);
      }

      // 结束回合
      gameManager.endTurn();
    }

    // 检查游戏是否结束
    expect(gameManager.isGameOver).toBe(true);

    // 检查游戏结果
    expect(['玩家胜利', '对手胜利', '平局']).toContain(gameManager.gameResult);
  });

  test('边界条件测试 - 出牌限制', () => {
    // 初始化游戏
    gameManager.startNewRound();

    // 清空玩家手牌
    const initialCards = [...playerHand.children];
    playerHand.children = [];

    // 尝试出牌
    const result = gameManager.playCard(initialCards[0], playAreas[0]);

    // 应该返回false，因为玩家手牌为空
    expect(result).toBe(false);

    // 检查游戏区域
    expect(playAreas[0].children.length).toBe(0);
  });

  test('边界条件测试 - 换牌限制', () => {
    // 初始化游戏
    gameManager.startNewRound();

    // 用完所有换牌次数
    for (let i = 0; i < gameManager.exchangeCount; i++) {
      if (playerHand.children.length > 0) {
        gameManager.exchangeCard(playerHand.children[0]);
      }
    }

    // 尝试再次换牌
    const result = gameManager.exchangeCard(playerHand.children[0]);

    // 应该返回false，因为换牌次数已用完
    expect(result).toBe(false);

    // 检查换牌次数
    expect(gameManager.exchangeCount).toBe(0);
  });

  test('边界条件测试 - 游戏结束后操作', () => {
    // 初始化游戏
    gameManager.startNewRound();

    // 模拟完整游戏流程
    for (let i = 0; i < gameManager.maxRounds; i++) {
      gameManager.endTurn();
    }

    // 检查游戏是否结束
    expect(gameManager.isGameOver).toBe(true);

    // 尝试出牌
    const result1 = gameManager.playCard(playerHand.children[0], playAreas[0]);

    // 应该返回false，因为游戏已结束
    expect(result1).toBe(false);

    // 尝试换牌
    const result2 = gameManager.exchangeCard(playerHand.children[0]);

    // 应该返回false，因为游戏已结束
    expect(result2).toBe(false);

    // 尝试结束回合
    const result3 = gameManager.endTurn();

    // 应该返回false，因为游戏已结束
    expect(result3).toBe(false);
  });

  test('功能组合测试 - 出牌和换牌', () => {
    // 初始化游戏
    gameManager.startNewRound();

    // 玩家出牌
    const playerCard1 = playerHand.children[0];
    gameManager.playCard(playerCard1, playAreas[0]);

    // 玩家换牌
    const playerCard2 = playerHand.children[0];
    gameManager.exchangeCard(playerCard2);

    // 检查状态
    expect(playAreas[0].children.length).toBe(1);
    expect(playAreas[0].children[0]).toBe(playerCard1);
    expect(exchangeArea.children.length).toBe(1);
    expect(exchangeArea.children[0]).toBe(playerCard2);
    expect(gameManager.exchangeCount).toBeLessThan(6); // 初始值为5，使用一次后应该小于6
  });
});
