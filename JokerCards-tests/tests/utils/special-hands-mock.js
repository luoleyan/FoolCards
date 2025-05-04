/**
 * 特殊牌型管理器模拟
 * 用于在测试环境中模拟SpecialHandsManager类的行为
 */

const { Card, CardSuit, CardRank } = require('./card-mock');

// 特殊牌型类型枚举
const SpecialHandType = {
  STRAIGHT_FLUSH: 'STRAIGHT_FLUSH',   // 同花顺
  FOUR_OF_A_KIND: 'FOUR_OF_A_KIND',   // 四条
  FULL_HOUSE: 'FULL_HOUSE',           // 葫芦
  FLUSH: 'FLUSH',                     // 同花
  STRAIGHT: 'STRAIGHT',               // 顺子
  THREE_OF_A_KIND: 'THREE_OF_A_KIND', // 三条
  TWO_PAIR: 'TWO_PAIR',               // 两对
  ONE_PAIR: 'ONE_PAIR',               // 对子
  HIGH_CARD: 'HIGH_CARD'              // 高牌
};

// 特殊牌型管理器类
class SpecialHandsManager {
  constructor() {
    // 特殊牌型配置
    this.specialHands = [
      {
        type: SpecialHandType.STRAIGHT_FLUSH,
        name: '完美同花序列',
        score: 150,
        check: this.checkStraightFlush.bind(this)
      },
      {
        type: SpecialHandType.FOUR_OF_A_KIND,
        name: '四骑士',
        score: 80,
        check: this.checkFourOfAKind.bind(this)
      },
      {
        type: SpecialHandType.FULL_HOUSE,
        name: '满座',
        score: 55,
        check: this.checkFullHouse.bind(this)
      },
      {
        type: SpecialHandType.FLUSH,
        name: '同色',
        score: 60,
        check: this.checkFlush.bind(this)
      },
      {
        type: SpecialHandType.STRAIGHT,
        name: '序列',
        score: 60,
        check: this.checkStraight.bind(this)
      },
      {
        type: SpecialHandType.THREE_OF_A_KIND,
        name: '三贤者',
        score: 30,
        check: this.checkThreeOfAKind.bind(this)
      },
      {
        type: SpecialHandType.TWO_PAIR,
        name: '双偶星',
        score: 30,
        check: this.checkTwoPair.bind(this)
      },
      {
        type: SpecialHandType.ONE_PAIR,
        name: '偶星',
        score: 15,
        check: this.checkOnePair.bind(this)
      }
    ];
  }
  
  // 计算特殊牌型分数
  calculateSpecialHandScore(cards) {
    if (!cards || cards.length === 0) {
      return 0;
    }
    
    // 检查每种特殊牌型
    for (const hand of this.specialHands) {
      if (hand.check(cards)) {
        console.log(`检测到特殊牌型: ${hand.name} (+${hand.score}分)`);
        return hand.score;
      }
    }
    
    return 0;
  }
  
  // 计算基础分数
  calculateBaseScore(cards) {
    if (!cards || cards.length === 0) {
      return 0;
    }
    
    let score = 0;
    
    // 基础分数：每张牌的点数
    for (const card of cards) {
      if (card.rank === CardRank.Ace) score += 1;
      else if (card.rank === CardRank.Jack) score += 11;
      else if (card.rank === CardRank.Queen) score += 12;
      else if (card.rank === CardRank.King) score += 13;
      else score += parseInt(card.rank) || 0;
    }
    
    return score;
  }
  
  // 检查同花顺
  checkStraightFlush(cards) {
    return this.checkFlush(cards) && this.checkStraight(cards);
  }
  
  // 检查四条
  checkFourOfAKind(cards) {
    if (cards.length < 4) return false;
    
    // 统计每个点数的数量
    const rankCounts = this.countRanks(cards);
    
    // 检查是否有点数出现了4次
    return Object.values(rankCounts).some(count => count >= 4);
  }
  
  // 检查葫芦（三条+对子）
  checkFullHouse(cards) {
    if (cards.length < 5) return false;
    
    // 统计每个点数的数量
    const rankCounts = this.countRanks(cards);
    const counts = Object.values(rankCounts);
    
    // 检查是否有三条和对子
    return counts.includes(3) && counts.includes(2);
  }
  
  // 检查同花
  checkFlush(cards) {
    if (cards.length < 3) return false;
    
    // 检查是否所有牌都是同一花色
    const suit = cards[0].suit;
    return cards.every(card => card.suit === suit);
  }
  
  // 检查顺子
  checkStraight(cards) {
    if (cards.length < 3) return false;
    
    // 简化的顺子检测
    // 在实际实现中，需要对牌进行排序并检查是否连续
    return true;
  }
  
  // 检查三条
  checkThreeOfAKind(cards) {
    if (cards.length < 3) return false;
    
    // 统计每个点数的数量
    const rankCounts = this.countRanks(cards);
    
    // 检查是否有点数出现了3次
    return Object.values(rankCounts).some(count => count >= 3);
  }
  
  // 检查两对
  checkTwoPair(cards) {
    if (cards.length < 4) return false;
    
    // 统计每个点数的数量
    const rankCounts = this.countRanks(cards);
    
    // 检查是否有两个点数各出现了2次
    const pairs = Object.values(rankCounts).filter(count => count >= 2);
    return pairs.length >= 2;
  }
  
  // 检查对子
  checkOnePair(cards) {
    if (cards.length < 2) return false;
    
    // 统计每个点数的数量
    const rankCounts = this.countRanks(cards);
    
    // 检查是否有点数出现了2次
    return Object.values(rankCounts).some(count => count >= 2);
  }
  
  // 统计每个点数的数量
  countRanks(cards) {
    const rankCounts = {};
    
    for (const card of cards) {
      if (!rankCounts[card.rank]) {
        rankCounts[card.rank] = 0;
      }
      rankCounts[card.rank]++;
    }
    
    return rankCounts;
  }
  
  // 统计每个花色的数量
  countSuits(cards) {
    const suitCounts = {};
    
    for (const card of cards) {
      if (!suitCounts[card.suit]) {
        suitCounts[card.suit] = 0;
      }
      suitCounts[card.suit]++;
    }
    
    return suitCounts;
  }
}

module.exports = {
  SpecialHandsManager,
  SpecialHandType
};
