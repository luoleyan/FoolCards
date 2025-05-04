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
    console.log("初始化AI对手组件");
    
    // 检查参数
    if (!gameManager) {
      console.error("GameManager 参数为空");
      return;
    }
    
    if (!opponentHand) {
      console.error("opponentHand 参数为空");
      return;
    }
    
    if (!playAreas || playAreas.length === 0) {
      console.error("playAreas 参数无效");
      return;
    }
    
    this.gameManager = gameManager;
    this.opponentHand = opponentHand;
    this.playAreas = playAreas;
    
    console.log(`AI对手初始化完成: 对手手牌区域=${opponentHand.name}, 场地区域数量=${playAreas.length}`);
    
    // 初始化AI出牌记录
    this.aiPlayedCards.clear();
    this.aiCardContainers.clear();
  }
  
  // AI机器人出牌逻辑
  playCards(maxCardsPerTurn) {
    console.log("AI机器人开始出牌");
    
    // 检查对手手牌区域是否存在
    if (!this.opponentHand) {
      console.error("对手手牌区域未设置");
      return;
    }
    
    console.log(`对手手牌区域: ${this.opponentHand.name}, 子节点数量: ${this.opponentHand.children.length}`);
    
    // 检查场地区域是否存在
    if (!this.playAreas || this.playAreas.length === 0) {
      console.error("场地区域未设置或为空");
      return;
    }
    
    console.log(`场地区域数量: ${this.playAreas.length}`);
    
    // 获取对手手牌
    const opponentCards = this.opponentHand.children
      .map(node => node.getComponent(Card))
      .filter(card => card !== null);
    
    console.log(`对手有效卡牌数量: ${opponentCards.length}`);
    
    if (opponentCards.length === 0) {
      console.log("AI没有手牌，无法出牌");
      return;
    }
    
    // 决定AI出牌数量（与玩家相同，最多maxCardsPerTurn张）
    const aiPlayCount = Math.min(maxCardsPerTurn, opponentCards.length);
    console.log(`AI将出${aiPlayCount}张牌`);
    
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
          console.log(`选择了卡牌: ${card.getFullName()}`);
        }
      }
    }
    
    console.log(`最终选择了 ${selectedCards.length} 张卡牌`);
    
    // 随机选择场地区域出牌
    for (let i = 0; i < selectedCards.length; i++) {
      const card = selectedCards[i];
      
      // 检查卡牌是否有效
      if (!card || !card.node) {
        console.error("无效的卡牌对象");
        continue;
      }
      
      const areaIndex = Math.floor(Math.random() * this.playAreas.length);
      console.log(`将卡牌 ${card.suit} ${card.rank} 放置到场地区域 ${areaIndex}`);
      
      // 记录AI出牌
      if (!this.aiPlayedCards.has(areaIndex)) {
        this.aiPlayedCards.set(areaIndex, []);
      }
      this.aiPlayedCards.get(areaIndex).push(card);
      
      // 显示AI出的牌
      this.showCardInPlayArea(card, areaIndex);
      
      // 从对手手牌中移除
      card.node.removeFromParent();
    }
    
    // 重新排列AI卡牌
    for (let i = 0; i < this.playAreas.length; i++) {
      this.arrangeAICardsInPlayArea(i);
    }
    
    console.log("AI出牌完成");
  }
  
  // 在场地区域显示AI出的牌
  showCardInPlayArea(card, areaIndex) {
    console.log(`显示AI卡牌 ${card.getFullName()} 在场地区域 ${areaIndex}`);
    
    // 获取场地区域
    const playArea = this.playAreas[areaIndex];
    if (!playArea) {
      console.error(`场地区域 ${areaIndex} 不存在`);
      return;
    }
    
    console.log(`场地区域 ${areaIndex} 名称: ${playArea.name}`);
    
    // 创建一个容器来显示AI出的牌
    const cardContainer = new mockCocos.Node('AICard');
    playArea.addChild(cardContainer);
    
    // 记录容器
    if (!this.aiCardContainers.has(areaIndex)) {
      this.aiCardContainers.set(areaIndex, []);
    }
    this.aiCardContainers.get(areaIndex).push(cardContainer);
    
    // 创建卡牌的克隆
    const cardClone = new mockCocos.Node('Card');
    cardContainer.addChild(cardClone);
    
    // 添加Card组件
    const cardComp = cardClone.addComponent(Card);
    
    // 初始化卡牌
    cardComp.init(card.suit, card.rank)
      .then(() => {
        console.log(`AI卡牌 ${card.getFullName()} 初始化完成，准备显示正面`);
        return cardComp.showCardFace();
      })
      .catch(error => {
        console.error('显示AI卡牌失败:', error);
      });
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
    const startX = -(containers.length - 1) * spacing / 2;
    
    // 重新排列卡牌
    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];
      container.setPosition(new mockCocos.Vec3(startX + i * spacing, 100, 0));
    }
  }
  
  // 移除所有卡牌容器
  removeAllCardContainers() {
    console.log("移除所有AI卡牌容器");
    
    for (const [areaIndex, containers] of this.aiCardContainers.entries()) {
      for (const container of containers) {
        container.removeFromParent();
      }
    }
    
    this.aiCardContainers.clear();
  }
  
  // 清除出牌记录
  clearPlayedCardsRecord() {
    console.log("清除AI出牌记录");
    this.aiPlayedCards.clear();
  }
  
  // 重新排列对手手牌
  arrangeOpponentHand() {
    if (!this.opponentHand) {
      console.error("对手手牌区域未设置");
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
    const startX = -(cards.length - 1) * spacing / 2;
    
    // 重新排列卡牌
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      card.setPosition(new mockCocos.Vec3(startX + i * spacing, 0, 0));
    }
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
  AIOpponent
};
