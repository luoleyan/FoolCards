import { _decorator, Component, Node, Sprite, UITransform, Color, tween, Vec3 } from 'cc';

/**
 * 场地高亮管理器
 * 负责管理场地区域的高亮效果
 */
export class AreaHighlightManager {
    private static instance: AreaHighlightManager = null;
    private playAreas: Node[] = [];
    private highlightNodes: Map<number, Node> = new Map();

    /**
     * 获取单例实例
     */
    public static getInstance(): AreaHighlightManager {
        if (!this.instance) {
            this.instance = new AreaHighlightManager();
        }
        return this.instance;
    }

    /**
     * 初始化场地高亮管理器
     * @param playAreas 场地区域节点数组
     */
    public init(playAreas: Node[]): void {
        console.log(`初始化场地高亮管理器，场地数量: ${playAreas.length}`);
        this.playAreas = playAreas;
        this.createHighlightNodes();
    }

    /**
     * 创建所有场地的高亮节点
     */
    private createHighlightNodes(): void {
        console.log(`初始化高亮节点，场地数量: ${this.playAreas.length}`);
        // 高亮节点现在会在需要时在addHighlight方法中创建
    }

    /**
     * 添加高亮效果到指定场地
     * @param areaIndex 场地索引
     */
    public addHighlight(areaIndex: number): void {
        console.log(`为场地${areaIndex+1}添加高亮效果`);

        const playArea = this.playAreas[areaIndex];
        if (!playArea) {
            console.error(`场地${areaIndex+1}不存在`);
            return;
        }

        // 检查是否已经有高亮边框
        let highlightNode = playArea.getChildByName('HighlightBorder');

        // 如果没有高亮边框，创建一个
        if (!highlightNode) {
            highlightNode = new Node('HighlightBorder');
            playArea.addChild(highlightNode);

            // 确保高亮边框在最底层显示
            highlightNode.setSiblingIndex(0);

            // 添加UITransform组件
            const areaTransform = playArea.getComponent(UITransform);
            if (areaTransform) {
                const highlightTransform = highlightNode.addComponent(UITransform);
                // 边框比场地区域稍大一些
                highlightTransform.setContentSize(
                    areaTransform.width + 10,
                    areaTransform.height + 10
                );
            }

            // 添加Sprite组件作为边框
            const sprite = highlightNode.addComponent(Sprite);

            // 设置边框类型为纯色
            sprite.type = Sprite.Type.FILLED;

            // 设置边框颜色为青绿色 (#39C5BB)
            sprite.color = new Color(57, 197, 187, 255);

            // 保存高亮节点引用
            this.highlightNodes.set(areaIndex, highlightNode);

            console.log(`为场地${areaIndex+1}创建了新的高亮边框节点`);
        }

        // 确保高亮边框可见
        highlightNode.active = true;

        // 添加脉动动画
        this.addPulsingAnimation(highlightNode);

        console.log(`场地${areaIndex+1}高亮效果已添加，节点状态: ${highlightNode.active ? '可见' : '不可见'}`);
    }

    /**
     * 移除指定场地的高亮效果
     * @param areaIndex 场地索引
     */
    public removeHighlight(areaIndex: number): void {
        // 获取高亮节点
        const highlightNode = this.highlightNodes.get(areaIndex);
        if (highlightNode) {
            // 停止动画
            tween(highlightNode).stop();

            // 隐藏高亮边框
            highlightNode.active = false;

            console.log(`场地${areaIndex+1}高亮效果已移除`);
        }
    }

    /**
     * 重置所有场地的高亮效果
     */
    public resetAllHighlights(): void {
        console.log("重置所有场地的高亮效果");
        // 遍历所有场地区域
        for (let i = 0; i < this.playAreas.length; i++) {
            this.removeHighlight(i);
        }
    }

    /**
     * 添加脉动动画
     * @param node 要添加动画的节点
     */
    private addPulsingAnimation(node: Node): void {
        // 停止可能已经存在的动画
        tween(node).stop();

        // 重置缩放
        node.scale = new Vec3(1, 1, 1);

        // 创建脉动动画
        tween(node)
            .to(0.5, { scale: new Vec3(1.05, 1.05, 1) })
            .to(0.5, { scale: new Vec3(1, 1, 1) })
            .union()
            .repeatForever()
            .start();
    }
}
