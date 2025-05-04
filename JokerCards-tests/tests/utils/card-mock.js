/**
 * 卡牌类模拟
 * 用于在测试环境中模拟Card类的行为
 */

const mockCocos = require('./cocos-mock');

// 花色枚举
const CardSuit = {
  Spade: 'Spade',
  Heart: 'Heart',
  Club: 'Club',
  Diamond: 'Diamond',
  Joker: 'Joker'
};

// 点数枚举
const CardRank = {
  Ace: 'A',
  Two: '2',
  Three: '3',
  Four: '4',
  Five: '5',
  Six: '6',
  Seven: '7',
  Eight: '8',
  Nine: '9',
  Ten: '10',
  Jack: 'J',
  Queen: 'Q',
  King: 'K',
  JokerA: 'A',
  JokerB: 'B'
};

// 卡牌类
class Card extends mockCocos.Component {
  constructor(suit, rank) {
    super();
    
    // 创建节点
    this.node = new mockCocos.Node('Card');
    
    // 添加UI变换组件
    this.transform = this.node.addComponent(mockCocos.UITransform);
    this.transform.setContentSize(120, 180);
    
    // 添加精灵组件
    this.cardSprite = this.node.addComponent(mockCocos.Sprite);
    
    // 卡牌背面精灵帧
    this.cardBack = new mockCocos.SpriteFrame();
    
    // 卡牌属性
    this._suit = suit || null;
    this._rank = rank || null;
    this._isFaceUp = false;
    this._originalPosition = new mockCocos.Vec3();
    this._isDragging = false;
    this._dragOffset = new mockCocos.Vec3();
    this._originalIndex = 0;
    this._isProcessing = false;
    
    // 如果提供了花色和点数，初始化卡牌
    if (suit && rank) {
      this.init(suit, rank);
    }
  }
  
  // 获取花色
  get suit() {
    return this._suit;
  }
  
  // 获取点数
  get rank() {
    return this._rank;
  }
  
  // 初始化卡牌
  init(suit, rank) {
    console.log(`Initializing card: ${suit} ${rank}`);
    if (!suit || !rank) {
      console.error(`Invalid card parameters: suit=${suit}, rank=${rank}`);
      return Promise.reject(new Error('Invalid card parameters'));
    }
    
    this._isProcessing = true;
    this._suit = suit;
    this._rank = rank;
    
    // 如果是万能牌，不需要加载新资源
    if (suit === CardSuit.Joker) {
      console.log('Initializing Joker card without loading new resources');
      this._isProcessing = false;
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      // 模拟更新卡牌精灵
      setTimeout(() => {
        this._isProcessing = false;
        resolve();
      }, 10);
    });
  }
  
  // 显示卡牌正面
  showCardFace() {
    this._isFaceUp = true;
    return Promise.resolve();
  }
  
  // 显示卡牌背面
  showCardBack() {
    this._isFaceUp = false;
    return Promise.resolve();
  }
  
  // 获取卡牌全名
  getFullName() {
    return `${this._suit} ${this._rank}`;
  }
  
  // 获取卡牌描述
  getCardDescription(suit, rank) {
    return `${suit} ${rank}`;
  }
  
  // 获取万能牌描述
  getJokerDescription(suit, rank) {
    return `${suit === CardSuit.Joker ? '小王' : '大王'} (${suit}-${rank})`;
  }
  
  // 更改卡牌信息（仅用于万能牌转换）
  changeCardInfo(suit, rank) {
    // 只允许万能牌进行转换
    if (this._suit !== CardSuit.Joker) {
      console.warn('Only Joker cards can be transformed');
      return;
    }
    
    // 记录原始的万能牌信息
    const originalSuit = this._suit;
    const originalRank = this._rank;
    
    // 更新卡牌信息
    this._suit = suit;
    this._rank = rank;
    
    console.log('=== 万能牌转换详情 ===');
    console.log(`原始牌: ${this.getJokerDescription(originalSuit, originalRank)}`);
    console.log(`替换为: ${this.getCardDescription(suit, rank)}`);
    console.log('==================');
  }
  
  // 检查矩形是否重叠
  isOverlapping(rect1, rect2) {
    return !(
      rect1.x + rect1.width < rect2.x ||
      rect1.x > rect2.x + rect2.width ||
      rect1.y + rect1.height < rect2.y ||
      rect1.y > rect2.y + rect2.height
    );
  }
  
  // 返回原始位置
  returnToOriginalPosition() {
    this.node.setPosition(this._originalPosition);
  }
  
  // 触摸事件处理
  onTouchStart(event) {
    this._isDragging = true;
    this._originalPosition = new mockCocos.Vec3(this.node.position.x, this.node.position.y, this.node.position.z);
    
    // 计算拖拽偏移
    const touchPos = event.getUILocation();
    const nodePos = this.node.getWorldPosition();
    this._dragOffset.x = nodePos.x - touchPos.x;
    this._dragOffset.y = nodePos.y - touchPos.y;
    
    // 记录原始索引
    if (this.node.parent) {
      this._originalIndex = this.node.parent.children.indexOf(this.node);
    }
  }
  
  onTouchMove(event) {
    if (!this._isDragging) return;
    
    // 更新位置
    const touchPos = event.getUILocation();
    const newPos = new mockCocos.Vec3(
      touchPos.x + this._dragOffset.x,
      touchPos.y + this._dragOffset.y,
      this.node.position.z
    );
    this.node.setPosition(newPos);
  }
  
  onTouchEnd(event) {
    if (!this._isDragging) return;
    this._isDragging = false;
    
    // 处理放置逻辑
    this.handleCardPlacement();
  }
  
  onTouchCancel(event) {
    if (!this._isDragging) return;
    this._isDragging = false;
    
    // 返回原始位置
    this.returnToOriginalPosition();
  }
  
  // 处理卡牌放置
  handleCardPlacement() {
    // 在测试环境中，这个方法不做任何实际操作
    console.log('Card placement handled in mock environment');
  }
}

module.exports = {
  Card,
  CardSuit,
  CardRank
};
