/**
 * 游戏性能测试
 * 测试游戏在不同条件下的性能表现
 */

const { Card, CardSuit, CardRank } = require('../utils/card-mock');
const { GameManager } = require('../utils/game-manager-mock');
const { AIOpponent } = require('../utils/ai-opponent-mock');
const { SpecialHandsManager } = require('../utils/special-hands-mock');
const { SceneEffect, SceneEffectType } = require('../utils/scene-effect-mock');

describe('游戏性能测试', () => {
  let gameManager;
  let playerHand;
  let opponentHand;
  let playAreas;
  let exchangeArea;
  let specialHandsManager;

  beforeEach(() => {
    // 创建游戏区域
    playerHand = { name: 'PlayerHand', children: [] };
    opponentHand = { name: 'OpponentHand', children: [] };
    playAreas = [
      { name: 'PlayArea1', children: [] },
      { name: 'PlayArea2', children: [] },
      { name: 'PlayArea3', children: [] },
    ];
    exchangeArea = { name: 'ExchangeArea', children: [] };

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
  });

  test('测试卡牌初始化性能', () => {
    const startTime = process.hrtime();

    // 创建大量卡牌
    const numCards = 100;
    const cards = [];

    for (let i = 0; i < numCards; i++) {
      const suit = i % 4;
      const rank = (i % 13) + 1;
      cards.push(new Card(suit, rank));
    }

    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;

    console.log(`创建 ${numCards} 张卡牌耗时: ${duration.toFixed(2)}ms`);

    // 性能断言：创建100张卡牌应该在500ms内完成
    expect(duration).toBeLessThan(500);
  });

  test('测试游戏回合初始化性能', () => {
    const startTime = process.hrtime();

    // 初始化多个游戏回合
    const numRounds = 10;

    for (let i = 0; i < numRounds; i++) {
      gameManager.startNewRound();
    }

    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;

    console.log(`初始化 ${numRounds} 个游戏回合耗时: ${duration.toFixed(2)}ms`);

    // 性能断言：初始化10个游戏回合应该在800ms内完成
    expect(duration).toBeLessThan(800);
  });

  test('测试AI决策性能', () => {
    // 创建AI对手
    const aiOpponent = new AIOpponent();

    // 初始化AI对手
    aiOpponent.init(gameManager, opponentHand, playAreas);

    // 添加卡牌到对手手牌
    for (let i = 0; i < 20; i++) {
      const suit = i % 4;
      const rank = (i % 13) + 1;
      opponentHand.children.push(new Card(suit, rank));
    }

    const startTime = process.hrtime();

    // 执行多次AI决策
    const numDecisions = 10;

    for (let i = 0; i < numDecisions; i++) {
      // 每次决策前重置手牌
      opponentHand.children = [...opponentHand.children];
      playAreas.forEach((area) => (area.children = []));

      // AI出牌（设置最大出牌数为3）
      aiOpponent.playCards(3);

      // 清除出牌记录
      aiOpponent.clearPlayedCardsRecord();
    }

    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;

    console.log(`执行 ${numDecisions} 次AI决策耗时: ${duration.toFixed(2)}ms`);

    // 性能断言：执行10次AI决策应该在2000ms内完成
    expect(duration).toBeLessThan(2000);
  });

  test('测试特殊牌型检测性能', () => {
    // 创建各种牌型
    const handTypes = [
      // 同花顺
      [
        new Card(CardSuit.Spade, CardRank.Ace),
        new Card(CardSuit.Spade, CardRank.Two),
        new Card(CardSuit.Spade, CardRank.Three),
        new Card(CardSuit.Spade, CardRank.Four),
        new Card(CardSuit.Spade, CardRank.Five),
      ],
      // 四条
      [
        new Card(CardSuit.Spade, CardRank.King),
        new Card(CardSuit.Heart, CardRank.King),
        new Card(CardSuit.Club, CardRank.King),
        new Card(CardSuit.Diamond, CardRank.King),
        new Card(CardSuit.Spade, CardRank.Ace),
      ],
      // 葫芦
      [
        new Card(CardSuit.Spade, CardRank.Queen),
        new Card(CardSuit.Heart, CardRank.Queen),
        new Card(CardSuit.Club, CardRank.Queen),
        new Card(CardSuit.Spade, CardRank.Jack),
        new Card(CardSuit.Heart, CardRank.Jack),
      ],
      // 同花
      [
        new Card(CardSuit.Heart, CardRank.Ace),
        new Card(CardSuit.Heart, CardRank.Five),
        new Card(CardSuit.Heart, CardRank.Nine),
        new Card(CardSuit.Heart, CardRank.Jack),
        new Card(CardSuit.Heart, CardRank.King),
      ],
      // 顺子
      [
        new Card(CardSuit.Spade, CardRank.Three),
        new Card(CardSuit.Heart, CardRank.Four),
        new Card(CardSuit.Diamond, CardRank.Five),
        new Card(CardSuit.Club, CardRank.Six),
        new Card(CardSuit.Spade, CardRank.Seven),
      ],
    ];

    const startTime = process.hrtime();

    // 执行多次特殊牌型检测
    const numChecks = 1000;

    for (let i = 0; i < numChecks; i++) {
      // 随机选择一种牌型
      const handIndex = i % handTypes.length;
      const hand = handTypes[handIndex];

      // 检测特殊牌型
      specialHandsManager.calculateSpecialHandScore(hand);
    }

    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;

    console.log(`执行 ${numChecks} 次特殊牌型检测耗时: ${duration.toFixed(2)}ms`);

    // 性能断言：执行1000次特殊牌型检测应该在5000ms内完成
    expect(duration).toBeLessThan(5000);
  });

  test('测试场景效果应用性能', () => {
    // 创建各种场景效果
    const effects = [
      new SceneEffect(SceneEffectType.BASIC, '基础场景', '无特殊效果的基础场景'),
      new SceneEffect(SceneEffectType.SUIT_BONUS, '花色加成', '同花牌型额外加分'),
      new SceneEffect(SceneEffectType.RANK_BONUS, '点数加成', 'JQK额外加分'),
      new SceneEffect(SceneEffectType.CHAIN, '连锁效果', '顺子额外加分'),
      new SceneEffect(SceneEffectType.SPECIAL, '特殊效果', '根据卡牌数量加分'),
    ];

    // 揭示所有场景效果
    effects.forEach((effect) => effect.reveal());

    // 创建测试牌组
    const cards = [
      new Card(CardSuit.Heart, CardRank.Jack),
      new Card(CardSuit.Heart, CardRank.Queen),
      new Card(CardSuit.Heart, CardRank.King),
    ];

    const baseScore = 36; // Jack(11) + Queen(12) + King(13)

    const startTime = process.hrtime();

    // 执行多次场景效果应用
    const numApplications = 1000;

    for (let i = 0; i < numApplications; i++) {
      // 随机选择一种场景效果
      const effectIndex = i % effects.length;
      const effect = effects[effectIndex];

      // 应用场景效果
      effect.applyEffect(cards, baseScore);
    }

    const endTime = process.hrtime(startTime);
    const duration = endTime[0] * 1000 + endTime[1] / 1000000;

    console.log(`执行 ${numApplications} 次场景效果应用耗时: ${duration.toFixed(2)}ms`);

    // 性能断言：执行1000次场景效果应用应该在5000ms内完成
    expect(duration).toBeLessThan(5000);
  });
});
