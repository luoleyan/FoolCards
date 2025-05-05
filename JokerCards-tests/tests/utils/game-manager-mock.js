/**
 * 游戏管理器模拟
 * 用于在测试环境中模拟GameManager类的行为
 */

const mockCocos = require('./cocos-mock');
const { Card, CardSuit, CardRank } = require('./card-mock');

// 游戏管理器类
class GameManager extends mockCocos.Component {
  constructor(playerHand, opponentHand, playAreas, exchangeArea, specialHandsManager) {
    super();

    // 创建节点
    this.node = new mockCocos.Node('GameManager');

    // 游戏区域
    this.playerHand = playerHand || new mockCocos.Node('PlayerHand');
    this.opponentHand = opponentHand || new mockCocos.Node('OpponentHand');
    this.playAreas = playAreas || [
      new mockCocos.Node('PlayArea0'),
      new mockCocos.Node('PlayArea1'),
      new mockCocos.Node('PlayArea2')
    ];
    this.exchangeArea = exchangeArea || new mockCocos.Node('ExchangeArea');

    // 游戏状态
    this.currentRound = 0;
    this.maxRounds = 5;
    this.maxCardsPerTurn = 3;
    this.cardsPlayedThisTurn = 0;
    this.extraPlayCount = 0;
    this.playerPlayedInArea = [false, false, false];
    this.currentTurnPlayedCards = new Map();
    this.isGameOver = false;
    this.gameResult = null;

    // 分数
    this.playerScore = 0;
    this.opponentScore = 0;
    this.areaScores = [0, 0, 0];
    this.aiAreaScores = [0, 0, 0];

    // 卡牌
    this.deck = [];

    // 换牌
    this.exchangeCount = 5;
    this.maxExchangeCount = 5;

    // 场景效果
    this._revealedEffects = 0;
    this.sceneEffects = [];

    // AI对手
    this.aiOpponent = null;

    // 特殊牌型管理器
    this.specialHandsManager = specialHandsManager || null;

    // 游戏结束弹窗
    this.gameOverPopup = new mockCocos.Node('GameOverPopup');
  }

  // 初始化
  init() {
    // 创建卡组
    this.createDeck();

    // 洗牌
    this.shuffleDeck();

    // 发牌
    this.dealCards();

    // 初始化场景效果
    this.initSceneEffects();

    return this;
  }

  // 创建卡组
  createDeck() {
    this.deck = [];

    const suits = [CardSuit.Spade, CardSuit.Heart, CardSuit.Club, CardSuit.Diamond];
    const ranks = [CardRank.Ace, CardRank.Two, CardRank.Three, CardRank.Four,
                  CardRank.Five, CardRank.Six, CardRank.Seven, CardRank.Eight,
                  CardRank.Nine, CardRank.Ten, CardRank.Jack, CardRank.Queen, CardRank.King];

    for (const suit of suits) {
      for (const rank of ranks) {
        const card = new Card(suit, rank);
        this.deck.push(card);
      }
    }

    // 添加大小王
    this.deck.push(new Card(CardSuit.Joker, CardRank.JokerA));
    this.deck.push(new Card(CardSuit.Joker, CardRank.JokerB));
  }

  // 洗牌
  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  // 发牌
  dealCards() {
    // 清空手牌区域
    while (this.playerHand.children.length > 0) {
      this.playerHand.children[0].removeFromParent();
    }

    while (this.opponentHand.children.length > 0) {
      this.opponentHand.children[0].removeFromParent();
    }

    // 发牌给玩家和对手
    for (let i = 0; i < 10; i++) {
      if (this.deck.length > 0) {
        const playerCard = this.deck.pop();
        this.playerHand.addChild(playerCard.node);
      }

      if (this.deck.length > 0) {
        const opponentCard = this.deck.pop();
        this.opponentHand.addChild(opponentCard.node);
      }
    }
  }

  // 初始化场景效果
  initSceneEffects() {
    this._revealedEffects = 0;
  }

  // 开始新回合
  startNewRound() {
    // 检查游戏是否已结束
    if (this.isGameOver) {
      console.log('游戏已结束，无法开始新回合');
      return false;
    }

    // 检查是否达到最大回合数
    if (this.currentRound >= this.maxRounds) {
      console.log(`游戏结束，达到最大回合数：${this.maxRounds}`);
      this.showGameOver();
      return false;
    }

    // 更新回合数
    this.currentRound++;
    console.log(`开始第 ${this.currentRound}/${this.maxRounds} 回合`);

    // 检查是否需要揭示新的场景效果
    if (this.currentRound <= 3 && this._revealedEffects < this.currentRound) {
      this.revealNextSceneEffect();
    }

    // 补充换牌次数
    this.exchangeCount = Math.min(this.exchangeCount + 2, this.maxExchangeCount);
    console.log(`新回合开始，当前换牌次数：${this.exchangeCount}`);

    // 在新回合开始时，只清除AI机器人上一回合的内部记录
    if (this.aiOpponent) {
      this.aiOpponent.clearPlayedCardsRecord();
    }

    // 发牌
    this.dealCards();

    return true;
  }

  // 揭示下一个场景效果
  revealNextSceneEffect() {
    if (this._revealedEffects < this.sceneEffects.length) {
      this._revealedEffects++;
      console.log(`揭示第 ${this._revealedEffects} 个场景效果`);

      if (this.sceneEffects[this._revealedEffects - 1]) {
        this.sceneEffects[this._revealedEffects - 1].reveal();
      }
    }
  }

  // 出牌
  playCard(card, playArea) {
    // 检查游戏是否已结束
    if (this.isGameOver) {
      console.log('游戏已结束，无法出牌');
      return false;
    }

    // 检查卡牌是否存在
    if (!card) {
      console.error('卡牌不存在');
      return false;
    }

    // 获取场地区域索引
    let areaIndex = -1;
    for (let i = 0; i < this.playAreas.length; i++) {
      if (this.playAreas[i] === playArea) {
        areaIndex = i;
        break;
      }
    }

    if (areaIndex === -1) {
      console.error('场地区域不存在');
      return false;
    }

    console.log(`出牌: ${card.getFullName ? card.getFullName() : '未知卡牌'} 到场地 ${areaIndex}`);

    // 检查场地区域是否已满（最多4张卡牌）
    if (playArea.children.filter(c => c.name === 'PlayerCard').length < 4) {
      // 将卡牌添加到场地区域
      playArea.addChild(card);
      card.name = 'PlayerCard';

      // 记录出牌
      this.recordCardPlayed(card, areaIndex);

      // 重新计算场地区域的分数
      this.calculateAreaScore(areaIndex);

      console.log('出牌处理完成');
      return true;
    } else {
      console.log('场地已满（已有4张卡牌），无法出牌');
      // 将卡牌返回到玩家手牌区域
      this.playerHand.addChild(card);
      return false;
    }
  }

  // 记录出牌
  recordCardPlayed(card, areaIndex) {
    // 如果有额外出牌次数，优先使用
    if (this.extraPlayCount > 0) {
      this.extraPlayCount--;
    } else {
      this.cardsPlayedThisTurn++;
    }

    // 记录当前回合打出的牌
    if (!this.currentTurnPlayedCards.has(areaIndex)) {
      this.currentTurnPlayedCards.set(areaIndex, []);
    }
    this.currentTurnPlayedCards.get(areaIndex)?.push(card);

    // 标记玩家已在该区域出牌
    this.playerPlayedInArea[areaIndex] = true;
  }

  // 计算场地区域分数
  calculateAreaScore(areaIndex) {
    // 获取场地区域中的卡牌
    const cards = this.currentTurnPlayedCards.get(areaIndex) || [];

    // 如果玩家没有在该区域出牌，不计算分数
    if (!this.playerPlayedInArea[areaIndex]) {
      return 0;
    }

    // 基础分数：每张牌的点数
    let score = 0;
    for (const card of cards) {
      if (card.rank === CardRank.Ace) score += 1;
      else if (card.rank === CardRank.Jack) score += 11;
      else if (card.rank === CardRank.Queen) score += 12;
      else if (card.rank === CardRank.King) score += 13;
      else score += parseInt(card.rank) || 0;
    }

    // 牌型加分
    if (this.checkSameSuit(cards)) score += 10; // 同花
    if (this.checkSequence(cards)) score += 15; // 顺子

    // 应用场景效果
    if (this._revealedEffects > areaIndex && this.sceneEffects[areaIndex]) {
      score = this.sceneEffects[areaIndex].applyEffect(cards, score);
    }

    // 应用特殊牌型加分
    if (this.specialHandsManager) {
      score += this.specialHandsManager.calculateSpecialHandScore(cards);
    }

    // 更新分数
    this.areaScores[areaIndex] = score;

    console.log(`场地 ${areaIndex} 分数: ${score}`);
    return score;
  }

  // 计算AI区域分数
  calculateAIAreaScore(areaIndex) {
    // 简化的AI分数计算
    return Math.floor(Math.random() * 50);
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

  // 检查是否还能出牌
  canPlayCard() {
    // 如果有额外出牌次数，返回true
    if (this.extraPlayCount > 0) {
      return true;
    }
    // 否则检查是否达到每回合出牌限制
    return this.cardsPlayedThisTurn < this.maxCardsPerTurn;
  }

  // 结束当前回合
  endTurn() {
    // 检查游戏是否已结束
    if (this.isGameOver) {
      console.log('游戏已结束，无法结束回合');
      return false;
    }

    console.log("=================== 回合结束处理开始 ===================");
    console.log(`当前回合: ${this.currentRound}/${this.maxRounds}`);

    // 重置回合状态
    this.resetCardPlayCount();

    // 记录玩家在各场地的出牌情况
    console.log("玩家在各场地的出牌情况:");
    for (let i = 0; i < this.playAreas.length; i++) {
      const hasPlayed = this.playerPlayedInArea[i];
      const cardCount = hasPlayed ? this.playAreas[i].children.filter(child => child.name === 'PlayerCard').length : 0;
      console.log(`- 场地${i+1}: ${hasPlayed ? '已出牌' : '未出牌'} (${cardCount}张)`);
    }

    // AI机器人出牌
    console.log("AI机器人开始出牌");
    if (this.aiOpponent) {
      this.aiOpponent.playCards(this.maxCardsPerTurn);
    } else {
      console.error("AI对手组件未初始化");
    }

    // 计算所有场地的分数
    console.log("计算所有场地的分数:");
    let totalPlayerScore = 0;
    let totalOpponentScore = 0;

    for (let i = 0; i < this.playAreas.length; i++) {
      console.log(`计算场地${i+1}的分数:`);

      // 计算玩家分数
      const oldPlayerScore = this.areaScores[i];
      this.calculateAreaScore(i);
      console.log(`- 玩家分数: ${oldPlayerScore} -> ${this.areaScores[i]}`);
      totalPlayerScore += this.areaScores[i];

      // 计算AI对手分数
      const oldAIScore = this.aiAreaScores[i];
      this.aiAreaScores[i] = this.calculateAIAreaScore(i);
      console.log(`- AI分数: ${oldAIScore} -> ${this.aiAreaScores[i]}`);
      totalOpponentScore += this.aiAreaScores[i];
    }

    // 更新总分
    this.playerScore = totalPlayerScore;
    this.opponentScore = totalOpponentScore;

    // 清空场地
    for (const area of this.playAreas) {
      area.children = [];
    }

    // 清空交换区域
    this.exchangeArea.children = [];

    // 重置玩家出牌区域标记
    this.playerPlayedInArea = [false, false, false];

    // 检查是否达到最大回合数
    if (this.currentRound >= this.maxRounds) {
      this.isGameOver = true;
      this.showGameOver();
    } else {
      // 开始新回合
      this.startNewRound();
    }

    console.log("=================== 回合结束处理完成 ===================");
    return true;
  }

  // 重置出牌计数
  resetCardPlayCount() {
    this.cardsPlayedThisTurn = 0;
    this.currentTurnPlayedCards.clear();
  }

  // 显示游戏结束
  showGameOver() {
    console.log("游戏结束");

    // 标记游戏已结束
    this.isGameOver = true;

    // 计算最终分数
    const finalPlayerScore = this.areaScores.reduce((sum, score) => sum + score, 0);
    const finalOpponentScore = this.aiAreaScores.reduce((sum, score) => sum + score, 0);

    // 更新总分
    this.playerScore = finalPlayerScore;
    this.opponentScore = finalOpponentScore;

    // 确定胜负
    if (finalPlayerScore > finalOpponentScore) {
      this.gameResult = "玩家胜利";
    } else if (finalPlayerScore < finalOpponentScore) {
      this.gameResult = "对手胜利";
    } else {
      this.gameResult = "平局";
    }

    console.log(`游戏结果: ${this.gameResult}`);
    console.log(`玩家最终分数: ${this.playerScore}`);
    console.log(`对手最终分数: ${this.opponentScore}`);

    // 显示游戏结束弹窗
    this.gameOverPopup.active = true;
  }

  // 换牌
  exchangeCard(card) {
    // 检查游戏是否已结束
    if (this.isGameOver) {
      console.log('游戏已结束，无法换牌');
      return false;
    }

    // 检查是否还有换牌次数
    if (this.exchangeCount <= 0) {
      console.log('换牌次数已用完');
      return false;
    }

    // 检查卡牌是否存在
    if (!card) {
      console.error('卡牌不存在');
      return false;
    }

    // 将卡牌添加到交换区域
    this.exchangeArea.addChild(card);

    // 减少换牌次数
    this.exchangeCount--;

    // 从玩家手牌中移除该卡牌
    const index = this.playerHand.children.indexOf(card);
    if (index !== -1) {
      this.playerHand.children.splice(index, 1);
    }

    // 从牌堆中抽一张新卡牌
    if (this.deck.length > 0) {
      const newCard = this.deck.pop();
      this.playerHand.addChild(newCard);
    }

    console.log(`换牌成功，剩余换牌次数: ${this.exchangeCount}`);
    return true;
  }

  // 检查场地区域是否已翻开
  isPlayAreaRevealed(areaIndex) {
    return this._revealedEffects > areaIndex;
  }

  // 检查是否允许放置到未翻开区域
  canPlayToUnrevealedArea() {
    return true;
  }

  // 检查游戏是否结束
  checkGameOver() {
    if (this.currentRound >= this.maxRounds) {
      this.isGameOver = true;
      this.determineGameResult();
      return true;
    }
    return false;
  }

  // 确定游戏结果
  determineGameResult() {
    if (this.playerScore > this.opponentScore) {
      this.gameResult = "玩家胜利";
    } else if (this.playerScore < this.opponentScore) {
      this.gameResult = "对手胜利";
    } else {
      this.gameResult = "平局";
    }
    return this.gameResult;
  }

  // 标记场地区域为已翻开
  markPlayAreaRevealed(areaIndex) {
    if (areaIndex >= this._revealedEffects) {
      this._revealedEffects = areaIndex + 1;
    }
  }
}

module.exports = {
  GameManager
};
