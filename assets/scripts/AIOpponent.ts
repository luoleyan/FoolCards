import { _decorator, Component, Node, UITransform, Sprite, Vec3, tween } from 'cc';
import { Card } from './Card';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('AIOpponent')
export class AIOpponent extends Component {
    @property(Node)
    private opponentHand: Node = null;  // 对手手牌区域

    @property([Node])
    private playAreas: Node[] = [];  // 场地区域

    // AI机器人相关属性
    private aiPlayedCards: Map<number, Card[]> = new Map(); // 记录AI在每个场地区域打出的牌
    private aiCardContainers: Map<number, Node[]> = new Map(); // 记录AI在每个场地区域的卡牌容器

    // 游戏管理器引用
    private gameManager: GameManager = null;

    // 初始化
    public init(gameManager: GameManager, opponentHand: Node, playAreas: Node[]) {
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
    public playCards(maxCardsPerTurn: number) {
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
            .filter(card => card !== null); // 过滤掉无效的卡牌

        console.log(`对手有效卡牌数量: ${opponentCards.length}`);

        if (opponentCards.length === 0) {
            console.log("AI没有手牌，无法出牌");
            return;
        }

        // 决定AI出牌数量（与玩家相同，最多maxCardsPerTurn张）
        const aiPlayCount = Math.min(maxCardsPerTurn, opponentCards.length);
        console.log(`AI将出${aiPlayCount}张牌`);

        // 随机选择要出的牌
        const selectedCards: Card[] = [];
        const selectedIndices: number[] = [];

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
        const playCardPromises = [];

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

            // 创建一个Promise来处理卡牌显示
            const playPromise = new Promise<void>((resolve) => {
                // 显示AI出的牌（在移除卡牌前先显示）
                this.showCardInPlayArea(card, areaIndex);

                // 从对手手牌中移除
                card.node.removeFromParent();

                // 延迟一点时间，确保卡牌加载完成
                setTimeout(() => {
                    resolve();
                }, 100);
            });

            playCardPromises.push(playPromise);
        }

        // 等待所有卡牌显示完成
        Promise.all(playCardPromises)
            .then(() => {
                console.log("所有AI卡牌显示完成");
            })
            .catch(err => {
                console.error("显示AI卡牌时出错:", err);
            });

        // 重新排列对手手牌
        this.arrangeOpponentHand();

        // 确保所有场地区域的AI卡牌都正确排列
        for (let i = 0; i < this.playAreas.length; i++) {
            if (this.aiPlayedCards.has(i) && this.aiPlayedCards.get(i).length > 0) {
                this.arrangeAICardsInPlayArea(i);
            }
        }

        console.log("AI机器人出牌完成");
    }

    // 记录AI出的牌并在场地上方显示（常驻显示）
    private showCardInPlayArea(card: Card, areaIndex: number) {
        console.log(`记录AI卡牌: ${card.getFullName()} 在场地区域 ${areaIndex}`);

        // 检查场地区域是否有效
        if (areaIndex < 0 || areaIndex >= this.playAreas.length) {
            console.error(`无效的场地区域索引: ${areaIndex}`);
            return;
        }

        const playArea = this.playAreas[areaIndex];
        if (!playArea) {
            console.error(`场地区域 ${areaIndex} 不存在`);
            return;
        }

        console.log(`场地区域 ${areaIndex} 名称: ${playArea.name}`);

        // 卡牌信息已经在playCards方法中记录到aiPlayedCards中

        // 创建一个容器来显示AI出的牌，使用AICard作为名称以区分
        const cardContainer = new Node('AICard');
        playArea.addChild(cardContainer);

        // 设置容器初始位置在场地区域外的上方
        const areaTransform = playArea.getComponent(UITransform);
        if (areaTransform) {
            // 计算位置 - 放在场地区域外的上方，确保完全在场地外
            // 考虑卡牌高度 (180 * 0.1 = 18像素) 和额外间距
            const cardHeight = 180 * 0.1; // 卡牌高度（考虑缩放）
            const topY = (areaTransform.height / 2) + cardHeight + 80; // 场地区域外的上方位置，留出卡牌高度+80像素的间距
            cardContainer.setPosition(new Vec3(0, topY, 0)); // 初始位置，稍后会在arrangeAICardsInPlayArea中调整
        }

        // 记录容器
        if (!this.aiCardContainers.has(areaIndex)) {
            this.aiCardContainers.set(areaIndex, []);
        }
        this.aiCardContainers.get(areaIndex).push(cardContainer);

        // 创建卡牌的克隆
        const cardClone = new Node('Card');
        cardContainer.addChild(cardClone);

        // 添加UITransform组件
        const cardTransform = cardClone.addComponent(UITransform);
        cardTransform.setContentSize(120, 180);

        // 添加Sprite组件
        let cardSprite = cardClone.getComponent(Sprite);
        if (!cardSprite) {
            cardSprite = cardClone.addComponent(Sprite);
        }

        // 添加Card组件
        let cardComp: Card = null;
        try {
            cardComp = cardClone.addComponent(Card);
        } catch (error) {
            console.error('Error adding Card component:', error);
            return;
        }

        if (!cardComp) {
            console.error('Failed to add Card component to AI card');
            return;
        }

        // 设置Card组件的精灵引用
        cardComp.cardSprite = cardSprite;

        // 设置卡牌缩放 - 与玩家卡牌完全一致
        cardClone.setScale(0.1, 0.1, 1); // 更小的缩放比例

        // 初始化卡牌并等待完成后再显示正面
        cardComp.init(card.suit, card.rank)
            .then(() => {
                console.log(`AI卡牌 ${card.getFullName()} 初始化完成，准备显示正面`);
                // 检查节点和组件是否仍然有效
                if (!cardClone || !cardClone.isValid || !cardComp || !cardComp.isValid) {
                    console.error('Card node or component became invalid after initialization');
                    return Promise.reject(new Error('Card node or component became invalid'));
                }
                // 显示卡牌正面
                return cardComp.showCardFace();
            })
            .then(() => {
                console.log(`AI卡牌 ${card.getFullName()} 正面显示完成，准备添加动画`);
                // 再次检查节点是否有效
                if (!cardClone || !cardClone.isValid) {
                    console.error('Card node became invalid before animation');
                    return;
                }
                // 添加动画效果 - 与新的缩放比例一致
                cardClone.setScale(0, 0, 1);
                tween(cardClone)
                    .to(0.3, { scale: new Vec3(0.12, 0.12, 1) })
                    .to(0.1, { scale: new Vec3(0.1, 0.1, 1) })
                    .call(() => {
                        console.log(`AI卡牌 ${card.getFullName()} 动画完成，准备重新排列`);
                        // 检查节点是否仍然有效
                        if (cardClone && cardClone.isValid && this.node && this.node.isValid) {
                            // 重新排列该区域的AI卡牌
                            this.arrangeAICardsInPlayArea(areaIndex);
                        }
                    })
                    .start();
            })
            .catch(err => {
                console.error('Error initializing or displaying AI card:', err);
            });

        console.log(`AI卡牌 ${card.getFullName()} 显示过程开始`);
    }

    // 重新排列场地区域中的AI卡牌
    private arrangeAICardsInPlayArea(areaIndex: number) {
        // 检查组件是否有效
        if (!this.node || !this.isValid) {
            console.error('AIOpponent component is invalid in arrangeAICardsInPlayArea');
            return;
        }

        // 检查索引是否有效
        if (areaIndex < 0 || areaIndex >= this.playAreas.length) {
            console.error(`Invalid area index: ${areaIndex}`);
            return;
        }

        const playArea = this.playAreas[areaIndex];
        if (!playArea || !playArea.isValid) {
            console.error(`Play area at index ${areaIndex} is invalid`);
            return;
        }

        try {
            // 获取该区域的所有AI卡牌容器
            const aiCards = playArea.children.filter(child => child && child.isValid && child.name === 'AICard');
            if (aiCards.length === 0) {
                console.log(`No valid AI cards found in play area ${areaIndex}`);
                return;
            }

            // 获取场地区域的UITransform
            const areaTransform = playArea.getComponent(UITransform);
            if (!areaTransform) {
                console.error(`Play area ${areaIndex} has no UITransform component`);
                return;
            }

            // 计算顶部位置 - 放在场地区域外的上方，确保完全在场地外
            // 考虑卡牌高度 (180 * 0.1 = 18像素) 和额外间距
            const cardHeight = 180 * 0.1; // 卡牌高度（考虑缩放）
            const topY = (areaTransform.height / 2) + cardHeight + 80; // 场地区域外的上方位置，留出卡牌高度+80像素的间距

            // 计算水平布局
            const cardWidth = 120;   // 卡牌原始宽度
            const spacing = 30;      // 卡牌间距（大幅增加间距，使卡牌之间有更明显的间隔）
            const cardSpacingFactor = 1.0; // 不再减小场地区域卡牌间距

            // 计算总宽度和起始位置 - 使用更小的缩放比例
            const totalWidth = (aiCards.length - 1) * (cardWidth * 0.1 + spacing * cardSpacingFactor);
            const startX = -(totalWidth / 2);

            // 重新排列所有AI卡牌
            aiCards.forEach((container, index) => {
                // 检查容器是否有效
                if (container && container.isValid) {
                    // 使用更大的间距计算卡牌位置
                    const x = startX + index * (cardWidth * 0.1 + spacing * cardSpacingFactor);
                    container.setPosition(new Vec3(x, topY, 0));
                }
            });
        } catch (error) {
            console.error(`Error in arrangeAICardsInPlayArea for area ${areaIndex}:`, error);
        }
    }

    // 移除所有AI卡牌信息和容器
    public removeAllCardContainers() {
        // 遍历所有场地区域
        for (let areaIndex = 0; areaIndex < this.playAreas.length; areaIndex++) {
            const playArea = this.playAreas[areaIndex];
            if (!playArea) continue;

            // 获取该区域的所有AI卡牌容器
            const containers = this.aiCardContainers.get(areaIndex) || [];

            // 移除所有容器
            for (const container of containers) {
                if (container && container.isValid) {
                    container.destroy();
                }
            }
        }

        // 清空容器记录
        this.aiCardContainers.clear();

        // 清空出牌记录
        this.aiPlayedCards.clear();
    }

    // 只清除内部记录，不清除显示的标签
    public clearPlayedCardsRecord() {
        // 只清空内部记录，不影响显示
        this.aiPlayedCards.clear();
    }



    // 重新排列对手手牌
    private arrangeOpponentHand() {
        if (!this.opponentHand) return;

        // 获取所有卡牌并保持原有顺序
        const cards = [...this.opponentHand.children];

        // 计算卡牌间距
        const cardWidth = 120 * 0.25; // 卡牌宽度（考虑缩放）
        const spacing = cardWidth * 1.5; // 卡牌间距
        const totalWidth = (cards.length - 1) * spacing;
        const startX = -totalWidth / 2;

        // 按照原有顺序排列卡牌
        cards.forEach((cardNode, index) => {
            const card = cardNode.getComponent(Card);
            if (card) {
                // 设置卡牌位置
                const x = startX + index * spacing;
                cardNode.setPosition(x, 0, 0);

                // 确保卡牌显示背面
                card.showCardBackSync();
            }
        });

        // 确保对手手牌区域可见
        this.opponentHand.active = true;
    }

    // 清理资源
    public clear() {
        this.removeAllCardContainers();
        this.aiPlayedCards.clear();
        this.aiCardContainers.clear();
    }

    // 获取AI出牌信息
    public getPlayedCards(): Map<number, Card[]> {
        return this.aiPlayedCards;
    }

    // 这里曾经有获取花色和点数名称的方法，但现在直接使用卡牌的getFullName方法
}
