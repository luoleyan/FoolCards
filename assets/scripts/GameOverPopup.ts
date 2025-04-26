import { _decorator, Component, Node, Label, Button, director, UIOpacity, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameOverPopup')
export class GameOverPopup extends Component {
    @property(Node)
    private popupNode: Node = null;  // 弹窗主体节点

    @property(Label)
    private resultLabel: Label = null;  // 游戏结果标签

    @property(Label)
    private playerScoreLabel: Label = null;  // 玩家分数标签

    @property(Label)
    private opponentScoreLabel: Label = null;  // 对手分数标签

    @property(Button)
    private returnButton: Button = null;  // 返回主菜单按钮

    start() {
        // 初始化时隐藏弹窗
        if (this.popupNode) {
            this.popupNode.active = false;
        }

        // 设置返回按钮点击事件
        if (this.returnButton) {
            this.returnButton.node.on(Button.EventType.CLICK, this.onReturnButtonClicked, this);
        }
    }

    /**
     * 显示游戏结束弹窗
     * @param playerScore 玩家分数
     * @param opponentScore 对手分数
     */
    public showPopup(playerScore: number, opponentScore: number) {
        if (!this.popupNode) return;

        // 设置分数
        if (this.playerScoreLabel) {
            this.playerScoreLabel.string = `玩家分数: ${playerScore}`;
        }

        if (this.opponentScoreLabel) {
            this.opponentScoreLabel.string = `对手分数: ${opponentScore}`;
        }

        // 设置游戏结果
        if (this.resultLabel) {
            if (playerScore > opponentScore) {
                this.resultLabel.string = "恭喜你获胜！";
            } else if (playerScore < opponentScore) {
                this.resultLabel.string = "很遗憾，你输了！";
            } else {
                this.resultLabel.string = "平局！";
            }
        }

        // 显示弹窗并添加动画效果
        this.popupNode.active = true;
        
        // 设置初始缩放为0
        this.popupNode.setScale(0, 0, 1);
        
        // 创建弹出动画
        tween(this.popupNode)
            .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
    }

    /**
     * 隐藏弹窗
     */
    public hidePopup() {
        if (!this.popupNode) return;

        // 创建隐藏动画
        tween(this.popupNode)
            .to(0.2, { scale: new Vec3(0, 0, 1) }, { easing: 'backIn' })
            .call(() => {
                this.popupNode.active = false;
            })
            .start();
    }

    /**
     * 返回主菜单按钮点击事件处理
     */
    private onReturnButtonClicked() {
        // 切换到主菜单场景
        director.loadScene('MainMenu');
    }
}
