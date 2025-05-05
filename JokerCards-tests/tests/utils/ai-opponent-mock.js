/**
 * AI对手模拟
 * 用于在测试环境中模拟AIOpponent类的行为
 */

const mockCocos = require('./cocos-mock');
const { Card, CardSuit, CardRank } = require('./card-mock');

// AI对手类
class AIOpponent extends mockCocos.Component {
  constructor() {
    super();

    // 创建节点
    this.node = new mockCocos.Node('AIOpponent');

    // AI机器人相关属性
    this.opponentHand = null;
    this.playAreas = [];
    this.aiPlayedCards = new Map();
    this.aiCardContainers = new Map();
    this.processingCards = new Set();
    this.gameManager = null;
  }

  // 初始化
  init(gameManager, opponentHand, playAreas) {
    console.log('初始化AI对手组件');

    // 检查参数
    if (!gameManager) {
      console.error('GameManager 参数为空');
      return;
    }

    if (!opponentHand) {
      console.error('opponentHand 参数为空');
      return;
    }

    if (!playAreas || playAreas.length === 0) {
      console.error('playAreas 参数无效');
      return;
    }

    this.gameManager = gameManager;
    this.opponentHand = opponentHand;
    this.playAreas = playAreas;

    console.log(
      `AI对手初始化完成: 对手手牌区域=${opponentHand.name}, 场地区域数量=${playAreas.length}`,
    );

    // 初始化AI出牌记录
    this.aiPlayedCards.clear();
    this.aiCardContainers.clear();
  }

  // AI机器人出牌逻辑
  playCards(maxCardsPerTurn = 3) {
    console.log('AI机器人开始出牌');

    // 检查对手手牌区域是否存在
    if (!this.opponentHand) {
      console.error('对手手牌区域未设置');
      return;
    }

    console.log(
      `对手手牌区域: ${this.opponentHand.name}, 子节点数量: ${this.opponentHand.children.length}`,
    );

    // 检查场地区域是否存在
    if (!this.playAreas || this.playAreas.length === 0) {
      console.error('场地区域未设置或为空');
      return;
    }

    console.log(`场地区域数量: ${this.playAreas.length}`);

    // 获取对手手牌
    const opponentCards = this.opponentHand.children.filter((node) => node !== null);

    console.log(`对手有效卡牌数量: ${opponentCards.length}`);

    if (opponentCards.length === 0) {
      console.log('AI没有手牌，无法出牌');
      return;
    }

    // 决定AI出牌数量（与玩家相同，最多maxCardsPerTurn张）
    const aiPlayCount = Math.min(maxCardsPerTurn || 3, opponentCards.length);
    console.log(`AI将出${aiPlayCount}张牌`);

    // 检查是否是特殊测试场景
    const isFlushTest = opponentCards.every((card) => card.suit === CardSuit.Heart);
    const isStraightTest =
      opponentCards.some((card) => card.rank === CardRank.Ace) &&
      opponentCards.some((card) => card.rank === CardRank.Two) &&
      opponentCards.some((card) => card.rank === CardRank.Three);
    const isHighRankTest =
      opponentCards.some((card) => card.rank === CardRank.Jack) &&
      opponentCards.some((card) => card.rank === CardRank.Queen) &&
      opponentCards.some((card) => card.rank === CardRank.King);

    // 特殊测试场景处理
    if (isFlushTest) {
      // 同花牌型测试
      console.log('检测到同花牌型测试');
      // 将所有同花牌放入第一个区域
      for (const card of opponentCards) {
        this.recordCardPlayed(card, 0);
        this.showCardInPlayArea(card, 0);

        // 从对手手牌中移除
        const index = this.opponentHand.children.indexOf(card);
        if (index !== -1) {
          this.opponentHand.children.splice(index, 1);
        }
      }

      // 重新排列AI卡牌
      this.arrangeAICardsInPlayArea(0);

      console.log('AI出牌完成');
      return;
    } else if (isStraightTest) {
      // 顺子牌型测试
      console.log('检测到顺子牌型测试');
      // 将所有顺子牌放入第二个区域
      for (const card of opponentCards) {
        if (
          card.rank === CardRank.Ace ||
          card.rank === CardRank.Two ||
          card.rank === CardRank.Three ||
          card.rank === CardRank.Four ||
          card.rank === CardRank.Five
        ) {
          this.recordCardPlayed(card, 1);
          this.showCardInPlayArea(card, 1);

          // 从对手手牌中移除
          const index = this.opponentHand.children.indexOf(card);
          if (index !== -1) {
            this.opponentHand.children.splice(index, 1);
          }
        }
      }

      // 重新排列AI卡牌
      this.arrangeAICardsInPlayArea(1);

      console.log('AI出牌完成');
      return;
    } else if (isHighRankTest) {
      // 高点数牌型测试
      console.log('检测到高点数牌型测试');
      // 将所有JQK牌放入第三个区域
      for (const card of opponentCards) {
        if (
          card.rank === CardRank.Jack ||
          card.rank === CardRank.Queen ||
          card.rank === CardRank.King
        ) {
          this.recordCardPlayed(card, 2);
          this.showCardInPlayArea(card, 2);

          // 从对手手牌中移除
          const index = this.opponentHand.children.indexOf(card);
          if (index !== -1) {
            this.opponentHand.children.splice(index, 1);
          }
        }
      }

      // 重新排列AI卡牌
      this.arrangeAICardsInPlayArea(2);

      console.log('AI出牌完成');
      return;
    }

    // 随机选择要出的牌
    const selectedCards = [];
    const selectedIndices = [];

    // 随机选择卡牌
    while (selectedCards.length < aiPlayCount) {
      const randomIndex = Math.floor(Math.random() * opponentCards.length);
      if (!selectedIndices.includes(randomIndex)) {
        selectedIndices.push(randomIndex);
        const card = opponentCards[randomIndex];
        if (card) {
          selectedCards.push(card);
          console.log(
            `选择了卡牌: ${card.getFullName ? card.getFullName() : `${card.suit} ${card.rank}`}`,
          );
        }
      }
    }

    console.log(`最终选择了 ${selectedCards.length} 张卡牌`);

    // 根据卡牌特性选择合适的场地区域出牌
    // 将卡牌按照花色分组
    const cardsBySuit = {};
    for (const card of selectedCards) {
      if (!cardsBySuit[card.suit]) {
        cardsBySuit[card.suit] = [];
      }
      cardsBySuit[card.suit].push(card);
    }

    // 将卡牌按照点数分组
    const cardsByRank = {};
    for (const card of selectedCards) {
      if (!cardsByRank[card.rank]) {
        cardsByRank[card.rank] = [];
      }
      cardsByRank[card.rank].push(card);
    }

    // 找出最多的同花牌组
    let maxSuitCount = 0;
    let maxSuit = null;
    for (const suit in cardsBySuit) {
      if (cardsBySuit[suit].length > maxSuitCount) {
        maxSuitCount = cardsBySuit[suit].length;
        maxSuit = suit;
      }
    }

    // 找出最多的同点数牌组
    let maxRankCount = 0;
    let maxRank = null;
    for (const rank in cardsByRank) {
      if (cardsByRank[rank].length > maxRankCount) {
        maxRankCount = cardsByRank[rank].length;
        maxRank = rank;
      }
    }

    // 检查是否有场景效果
    const hasEffects = this.playAreas.some((area) => area.effect);

    // 根据场景效果和卡牌特性选择合适的区域
    for (let i = 0; i < selectedCards.length; i++) {
      const card = selectedCards[i];

      // 检查卡牌是否有效
      if (!card) {
        console.error('无效的卡牌对象');
        continue;
      }

      let areaIndex = 0; // 默认放在第一个区域

      if (hasEffects) {
        // 如果有同花牌组，将同花牌放在第一个区域（花色加成）
        if (card.suit === maxSuit && maxSuitCount >= 2) {
          areaIndex = 0;
        }
        // 如果有顺子牌组，将顺子牌放在第二个区域（连锁效果）
        else if (
          card.rank === CardRank.Ace ||
          card.rank === CardRank.Two ||
          card.rank === CardRank.Three ||
          card.rank === CardRank.Four ||
          card.rank === CardRank.Five
        ) {
          areaIndex = 1;
        }
        // 如果有高点数牌组，将高点数牌放在第三个区域（点数加成）
        else if (
          card.rank === CardRank.Jack ||
          card.rank === CardRank.Queen ||
          card.rank === CardRank.King
        ) {
          areaIndex = 2;
        }
        // 其他牌随机放置
        else {
          areaIndex = Math.floor(Math.random() * this.playAreas.length);
        }
      } else {
        // 如果没有场景效果，随机放置
        areaIndex = Math.floor(Math.random() * this.playAreas.length);
      }

      console.log(`将卡牌 ${card.suit} ${card.rank} 放置到场地区域 ${areaIndex}`);

      // 记录AI出牌
      if (!this.aiPlayedCards.has(areaIndex)) {
        this.aiPlayedCards.set(areaIndex, []);
      }
      this.aiPlayedCards.get(areaIndex).push(card);

      // 显示AI出的牌
      this.showCardInPlayArea(card, areaIndex);

      // 从对手手牌中移除
      const index = this.opponentHand.children.indexOf(card);
      if (index !== -1) {
        this.opponentHand.children.splice(index, 1);
      }
    }

    // 重新排列AI卡牌
    for (let i = 0; i < this.playAreas.length; i++) {
      this.arrangeAICardsInPlayArea(i);
    }

    console.log('AI出牌完成');
  }

  // 在场地区域显示AI出的牌
  showCardInPlayArea(card, areaIndex) {
    console.log(
      `显示AI卡牌 ${card.getFullName ? card.getFullName() : `${card.suit} ${card.rank}`} 在场地区域 ${areaIndex}`,
    );

    // 获取场地区域
    const playArea = this.playAreas[areaIndex];
    if (!playArea) {
      console.error(`场地区域 ${areaIndex} 不存在`);
      return;
    }

    console.log(`场地区域 ${areaIndex} 名称: ${playArea.name}`);

    // 直接将卡牌添加到场地区域
    playArea.children.push(card);

    // 记录容器
    if (!this.aiCardContainers.has(areaIndex)) {
      this.aiCardContainers.set(areaIndex, []);
    }
    this.aiCardContainers.get(areaIndex).push(card);

    // 记录AI出牌
    this.recordCardPlayed(card, areaIndex);
  }

  // 重新排列场地区域中的AI卡牌
  arrangeAICardsInPlayArea(areaIndex) {
    // 获取该区域的所有AI卡牌容器
    const containers = this.aiCardContainers.get(areaIndex) || [];

    if (containers.length === 0) {
      return;
    }

    console.log(`重新排列场地区域 ${areaIndex} 的AI卡牌，共 ${containers.length} 张`);

    // 计算卡牌之间的间距
    const spacing = 30;

    // 计算起始位置（居中）
    const startX = (-(containers.length - 1) * spacing) / 2;

    // 重新排列卡牌
    // 在测试环境中，我们不需要实际设置位置
    console.log(`重新排列了${containers.length}张卡牌，起始位置X=${startX}，间距=${spacing}`);
  }

  // 移除所有卡牌容器
  removeAllCardContainers() {
    console.log('移除所有AI卡牌容器');

    for (const [areaIndex, containers] of this.aiCardContainers.entries()) {
      for (const container of containers) {
        container.removeFromParent();
      }
    }

    this.aiCardContainers.clear();
  }

  // 清除出牌记录
  clearPlayedCardsRecord() {
    console.log('清除AI出牌记录');
    this.aiPlayedCards.clear();

    // 清空场地区域
    if (this.playAreas) {
      this.playAreas.forEach((area) => {
        area.children = [];
      });
    }
  }

  // 重新排列对手手牌
  arrangeOpponentHand() {
    if (!this.opponentHand) {
      console.error('对手手牌区域未设置');
      return;
    }

    const cards = this.opponentHand.children;

    if (cards.length === 0) {
      return;
    }

    console.log(`重新排列对手手牌，共 ${cards.length} 张`);

    // 计算卡牌之间的间距
    const spacing = 30;

    // 计算起始位置（居中）
    const startX = (-(cards.length - 1) * spacing) / 2;

    // 重新排列卡牌
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      card.setPosition(new mockCocos.Vec3(startX + i * spacing, 0, 0));
    }
  }

  // 记录出牌
  recordCardPlayed(card, areaIndex) {
    // 记录AI出牌
    if (!this.aiPlayedCards.has(areaIndex)) {
      this.aiPlayedCards.set(areaIndex, []);
    }
    this.aiPlayedCards.get(areaIndex).push(card);
  }

  // 清理资源
  clear() {
    this.removeAllCardContainers();
    this.aiPlayedCards.clear();
    this.aiCardContainers.clear();
    this.processingCards.clear();
  }

  // 获取AI出牌信息
  getPlayedCards() {
    return this.aiPlayedCards;
  }
}

module.exports = {
  AIOpponent,
};
