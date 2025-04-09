import { _decorator, Component, Node, Button, director, resources, SpriteFrame, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MainMenu')
export class MainMenu extends Component {
    @property(Sprite)
    private background: Sprite = null;

    @property(Button)
    private startButton: Button = null;

    @property(Button)
    private exitButton: Button = null;

    start() {
        // 加载主菜单背景
        resources.load('/menu/main_menu/spriteFrame', SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error('load background err:', err);
                return;
            }
            if (this.background) {
                this.background.spriteFrame = spriteFrame;
            }
        });

        // 加载按钮图片
        resources.load('/ui-assets/Buttons/BTN_BLUE_RECT_IN/spriteFrame', SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error(' load button err:', err);
                return;
            }
            if (this.startButton) {
                const sprite = this.startButton.node.getComponent(Sprite);
                if (sprite) {
                    sprite.spriteFrame = spriteFrame;
                }
            }
        });

        // 设置按钮点击事件
        if (this.startButton) {
            this.startButton.node.on(Button.EventType.CLICK, this.onStartButtonClicked, this);
        }
        if (this.exitButton) {
            this.exitButton.node.on(Button.EventType.CLICK, this.onExitButtonClicked, this);
        }
    }

    private onStartButtonClicked() {
        // 切换到加载场景
        director.loadScene('Loading');
    }

    private onExitButtonClicked() {
        // 退出游戏
        director.end();
    }
} 