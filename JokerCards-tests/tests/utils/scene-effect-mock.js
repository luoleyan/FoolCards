/**
 * 场景效果模拟
 * 用于在测试环境中模拟SceneEffect类的行为
 */

const mockCocos = require('./cocos-mock');
const { Card, CardSuit, CardRank } = require('./card-mock');

// 场景效果类型枚举
const SceneEffectType = {
  BASIC: 'BASIC',           // 基础场景
  SUIT_BONUS: 'SUIT_BONUS', // 花色加成
  RANK_BONUS: 'RANK_BONUS', // 点数加成
  CHAIN: 'CHAIN',           // 连锁效果
  SPECIAL: 'SPECIAL'        // 特殊效果
};

// 场景效果类
class SceneEffect extends mockCocos.Component {
  constructor(type, name, description = '') {
    super();
    
    // 创建节点
    this.node = new mockCocos.Node('SceneEffect');
    
    // 场景效果属性
    this.type = type || SceneEffectType.BASIC;
    this.name = name || '未命名场景';
    this.description = description || '无描述';
    this.isRevealed = false;
    this.publicCards = [];
  }
  
  // 揭示场景效果
  reveal() {
    console.log(`揭示场景效果: ${this.name} (${this.type})`);
    this.isRevealed = true;
  }
  
  // 应用场景效果
  applyEffect(cards, baseScore) {
    if (!this.isRevealed) {
      console.log(`场景效果 ${this.name} 尚未揭示，不应用效果`);
      return baseScore;
    }
    
    console.log(`应用场景效果 ${this.name} (${this.type})`);
    
    let finalScore = baseScore;
    
    // 根据场景效果类型应用不同的效果
    switch (this.type) {
      case SceneEffectType.BASIC:
        // 基础场景不提供额外加成
        break;
        
      case SceneEffectType.SUIT_BONUS:
        // 花色加成：同花牌型额外加分
        if (this.checkSameSuit(cards)) {
          finalScore += 20;
          console.log(`花色加成: +20分 (同花)`);
        }
        break;
        
      case SceneEffectType.RANK_BONUS:
        // 点数加成：JQK额外加分
        const hasJQK = cards.some(card => 
          card.rank === CardRank.Jack || 
          card.rank === CardRank.Queen || 
          card.rank === CardRank.King
        );
        
        if (hasJQK) {
          finalScore += 15;
          console.log(`点数加成: +15分 (JQK)`);
        }
        break;
        
      case SceneEffectType.CHAIN:
        // 连锁效果：顺子额外加分
        if (this.checkSequence(cards)) {
          finalScore += 25;
          console.log(`连锁效果: +25分 (顺子)`);
        }
        break;
        
      case SceneEffectType.SPECIAL:
        // 特殊效果：根据卡牌数量加分
        finalScore += cards.length * 5;
        console.log(`特殊效果: +${cards.length * 5}分 (卡牌数量)`);
        break;
        
      default:
        console.log(`未知的场景效果类型: ${this.type}`);
        break;
    }
    
    console.log(`最终分数: ${baseScore} -> ${finalScore}`);
    return finalScore;
  }
  
  // 检查是否同花
  checkSameSuit(cards) {
    if (cards.length < 2) return false;
    const suit = cards[0].suit;
    return cards.every(card => card.suit === suit);
  }
  
  // 检查是否顺子
  checkSequence(cards) {
    if (cards.length < 3) return false;
    // 简化的顺子检测
    return true;
  }
  
  // 获取场景效果描述
  getDescription() {
    return this.description;
  }
  
  // 获取场景效果名称
  getName() {
    return this.name;
  }
  
  // 获取场景效果类型
  getType() {
    return this.type;
  }
}

module.exports = {
  SceneEffect,
  SceneEffectType
};
