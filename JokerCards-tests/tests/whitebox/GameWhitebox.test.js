/**
 * 游戏白盒测试
 * 基于代码结构的测试，关注内部实现
 */

const { Card, CardSuit, CardRank } = require('../utils/card-mock');
const { GameManager } = require('../utils/game-manager-mock');
const { AIOpponent } = require('../utils/ai-opponent-mock');
const { SpecialHandsManager } = require('../utils/special-hands-mock');
const { SceneEffect, SceneEffectType } = require('../utils/scene-effect-mock');

describe('游戏白盒测试', () => {
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
    
    // 创建AI对手
    aiOpponent = new AIOpponent(opponentHand, playAreas, specialHandsManager);
    
    // 创建游戏管理器
    gameManager = new GameManager(playerHand, opponentHand, playAreas, exchangeArea, specialHandsManager);
    gameManager.aiOpponent = aiOpponent;
  });
  
  test('GameManager构造函数测试', () => {
    // 检查GameManager构造函数是否正确初始化属性
    expect(gameManager.playerHand).toBe(playerHand);
    expect(gameManager.opponentHand).toBe(opponentHand);
    expect(gameManager.playAreas).toBe(playAreas);
    expect(gameManager.exchangeArea).toBe(exchangeArea);
    expect(gameManager.specialHandsManager).toBe(specialHandsManager);
    expect(gameManager.currentRound).toBe(-1);
    expect(gameManager.maxRounds).toBe(5);
    expect(gameManager.exchangeCount).toBe(0);
    expect(gameManager.isGameOver).toBe(false);
    expect(gameManager.playerScore).toBe(0);
    expect(gameManager.opponentScore).toBe(0);
    expect(gameManager.gameResult).toBe('');
  });
  
  test('startNewRound方法测试', () => {
    // 测试startNewRound方法
    const result = gameManager.startNewRound();
    
    // 应该返回true
    expect(result).toBe(true);
    
    // 检查状态
    expect(gameManager.currentRound).toBe(0);
    expect(gameManager.exchangeCount).toBe(5);
    expect(playerHand.children.length).toBe(5);
    expect(opponentHand.children.length).toBe(5);
    
    // 测试游戏结束后调用startNewRound
    gameManager.isGameOver = true;
    const result2 = gameManager.startNewRound();
    
    // 应该返回false
    expect(result2).toBe(false);
  });
  
  test('playCard方法测试', () => {
    // 初始化游戏
    gameManager.startNewRound();
    
    // 测试playCard方法
    const playerCard = playerHand.children[0];
    const result = gameManager.playCard(playerCard, playAreas[0]);
    
    // 应该返回true
    expect(result).toBe(true);
    
    // 检查状态
    expect(playerHand.children.includes(playerCard)).toBe(false);
    expect(playAreas[0].children.includes(playerCard)).toBe(true);
    
    // 测试无效参数
    const result2 = gameManager.playCard(null, playAreas[0]);
    
    // 应该返回false
    expect(result2).toBe(false);
    
    // 测试游戏结束后调用playCard
    gameManager.isGameOver = true;
    const result3 = gameManager.playCard(playerHand.children[0], playAreas[0]);
    
    // 应该返回false
    expect(result3).toBe(false);
  });
  
  test('exchangeCard方法测试', () => {
    // 初始化游戏
    gameManager.startNewRound();
    
    // 测试exchangeCard方法
    const playerCard = playerHand.children[0];
    const initialExchangeCount = gameManager.exchangeCount;
    const result = gameManager.exchangeCard(playerCard);
    
    // 应该返回true
    expect(result).toBe(true);
    
    // 检查状态
    expect(playerHand.children.includes(playerCard)).toBe(false);
    expect(exchangeArea.children.includes(playerCard)).toBe(true);
    expect(gameManager.exchangeCount).toBe(initialExchangeCount - 1);
    
    // 测试无效参数
    const result2 = gameManager.exchangeCard(null);
    
    // 应该返回false
    expect(result2).toBe(false);
    
    // 测试换牌次数用完
    gameManager.exchangeCount = 0;
    const result3 = gameManager.exchangeCard(playerHand.children[0]);
    
    // 应该返回false
    expect(result3).toBe(false);
    
    // 测试游戏结束后调用exchangeCard
    gameManager.isGameOver = true;
    gameManager.exchangeCount = 5;
    const result4 = gameManager.exchangeCard(playerHand.children[0]);
    
    // 应该返回false
    expect(result4).toBe(false);
  });
  
  test('endTurn方法测试', () => {
    // 初始化游戏
    gameManager.startNewRound();
    
    // 玩家出牌
    const playerCard = playerHand.children[0];
    gameManager.playCard(playerCard, playAreas[0]);
    
    // 测试endTurn方法
    const initialRound = gameManager.currentRound;
    const result = gameManager.endTurn();
    
    // 应该返回true
    expect(result).toBe(true);
    
    // 检查状态
    expect(gameManager.currentRound).toBe(initialRound + 1);
    expect(playerHand.children.length).toBe(5);
    expect(opponentHand.children.length).toBe(5);
    expect(playAreas[0].children.length).toBe(0);
    expect(exchangeArea.children.length).toBe(0);
    
    // 测试游戏结束后调用endTurn
    gameManager.isGameOver = true;
    const result2 = gameManager.endTurn();
    
    // 应该返回false
    expect(result2).toBe(false);
  });
  
  test('calculateAreaScore方法测试', () => {
    // 初始化游戏
    gameManager.startNewRound();
    
    // 创建测试牌组
    const testCards = [
      new Card(CardSuit.Heart, CardRank.Ace),
      new Card(CardSuit.Heart, CardRank.King)
    ];
    
    // 清空游戏区域
    playAreas[0].children = [];
    
    // 添加测试牌组到游戏区域
    testCards.forEach(card => {
      playAreas[0].children.push(card);
    });
    
    // 测试calculateAreaScore方法
    const score = gameManager.calculateAreaScore(playAreas[0]);
    
    // 预期分数：Ace(1) + King(13) = 14
    expect(score).toBe(14);
    
    // 测试空区域
    playAreas[1].children = [];
    const emptyScore = gameManager.calculateAreaScore(playAreas[1]);
    
    // 预期分数：0
    expect(emptyScore).toBe(0);
    
    // 测试特殊牌型
    const straightFlush = [
      new Card(CardSuit.Spade, CardRank.Ace),
      new Card(CardSuit.Spade, CardRank.Two),
      new Card(CardSuit.Spade, CardRank.Three),
      new Card(CardSuit.Spade, CardRank.Four)
    ];
    
    playAreas[2].children = straightFlush;
    const specialScore = gameManager.calculateAreaScore(playAreas[2]);
    
    // 预期分数：基础分(1+2+3+4=10) + 特殊牌型加成(150) + 场景效果加成
    expect(specialScore).toBeGreaterThanOrEqual(10 + 150);
  });
  
  test('checkGameOver方法测试', () => {
    // 初始化游戏
    gameManager.startNewRound();
    
    // 测试未达到最大回合数
    gameManager.currentRound = gameManager.maxRounds - 1;
    gameManager.checkGameOver();
    
    // 游戏不应该结束
    expect(gameManager.isGameOver).toBe(false);
    
    // 测试达到最大回合数
    gameManager.currentRound = gameManager.maxRounds;
    gameManager.checkGameOver();
    
    // 游戏应该结束
    expect(gameManager.isGameOver).toBe(true);
    
    // 检查游戏结果
    expect(['玩家胜利', '对手胜利', '平局']).toContain(gameManager.gameResult);
  });
  
  test('determineGameResult方法测试', () => {
    // 初始化游戏
    gameManager.startNewRound();
    
    // 测试玩家胜利
    gameManager.playerScore = 100;
    gameManager.opponentScore = 50;
    gameManager.determineGameResult();
    
    // 应该是玩家胜利
    expect(gameManager.gameResult).toBe('玩家胜利');
    
    // 测试对手胜利
    gameManager.playerScore = 50;
    gameManager.opponentScore = 100;
    gameManager.determineGameResult();
    
    // 应该是对手胜利
    expect(gameManager.gameResult).toBe('对手胜利');
    
    // 测试平局
    gameManager.playerScore = 100;
    gameManager.opponentScore = 100;
    gameManager.determineGameResult();
    
    // 应该是平局
    expect(gameManager.gameResult).toBe('平局');
  });
});
