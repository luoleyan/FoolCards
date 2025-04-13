import { _decorator, Component, Node, Label, Button, ScrollView, UITransform, Vec3, Mask, Layout, Color, Widget } from 'cc';
import { SpecialHandsManager, SpecialHand } from './SpecialHands';
const { ccclass, property } = _decorator;

@ccclass('SpecialHandsPopup')
export class SpecialHandsPopup extends Component {
    @property(Node)
    private popupNode: Node = null;

    @property(ScrollView)
    private scrollView: ScrollView = null;

    @property(Label)
    private titleLabel: Label = null;

    @property(Button)
    private closeButton: Button = null;

    @property(Node)
    private contentNode: Node = null;

    private specialHandsManager: SpecialHandsManager = null;

    private hideAllNodes() {
        // 隐藏所有相关节点
        if (this.popupNode) {
            this.popupNode.active = false;
        }
        if (this.scrollView && this.scrollView.node) {
            this.scrollView.node.active = false;
        }
        if (this.titleLabel && this.titleLabel.node) {
            this.titleLabel.node.active = false;
        }
        if (this.closeButton && this.closeButton.node) {
            this.closeButton.node.active = false;
        }
        if (this.contentNode) {
            this.contentNode.active = false;
        }
    }

    onLoad() {
        console.log('SpecialHandsPopup onLoad');
        // 确保在加载时所有节点都是隐藏的
        this.hideAllNodes();
    }

    onEnable() {
        console.log('SpecialHandsPopup onEnable');
        // 确保在节点启用时也是隐藏状态
        this.hideAllNodes();
    }

    start() {
        console.log('SpecialHandsPopup start');
        // 初始化特殊牌型管理器
        this.specialHandsManager = SpecialHandsManager.getInstance();
        
        // 设置弹窗节点的大小
        if (this.popupNode) {
            const popupTransform = this.popupNode.getComponent(UITransform) || this.popupNode.addComponent(UITransform);
            popupTransform.setContentSize(900, 700); // 设置弹窗大小

            // 添加 Widget 组件使弹窗居中
            const popupWidget = this.popupNode.getComponent(Widget) || this.popupNode.addComponent(Widget);
            popupWidget.isAlignHorizontalCenter = true;
            popupWidget.isAlignVerticalCenter = true;
            popupWidget.alignMode = Widget.AlignMode.ALWAYS;
        }
        
        // 设置关闭按钮事件和位置
        if (this.closeButton && this.popupNode) {
            this.closeButton.node.on(Button.EventType.CLICK, this.hidePopup, this);
            
            // 确保关闭按钮是 popupNode 的直接子节点
            if (this.closeButton.node.parent !== this.popupNode) {
                this.closeButton.node.setParent(this.popupNode);
            }
            
            // 添加 Widget 组件来固定关闭按钮位置
            let widget = this.closeButton.node.getComponent(Widget);
            if (!widget) {
                widget = this.closeButton.node.addComponent(Widget);
            }
            
            // 设置右上角对齐
            widget.isAlignRight = true;
            widget.right = 70; // 从50像素增加到70像素（更靠左）
            widget.isAlignTop = true;
            widget.top = 70; // 从50像素增加到70像素（更靠下）
            widget.alignMode = Widget.AlignMode.ALWAYS;
            
            // 设置按钮大小
            const btnTransform = this.closeButton.node.getComponent(UITransform);
            if (btnTransform) {
                btnTransform.setContentSize(45, 45); // 保持按钮大小不变
            }
        }

        // 确保 ScrollView 结构正确
        if (this.scrollView && this.popupNode) {
            // 确保 ScrollView 是 popupNode 的子节点
            if (this.scrollView.node.parent !== this.popupNode) {
                this.scrollView.node.setParent(this.popupNode);
            }

            // 设置 ScrollView 的大小和位置
            const scrollViewTrans = this.scrollView.node.getComponent(UITransform);
            if (scrollViewTrans) {
                scrollViewTrans.setContentSize(800, 600);
            }

            // 设置 view 的大小
            const viewTrans = this.scrollView.view.getComponent(UITransform);
            if (viewTrans) {
                viewTrans.setContentSize(800, 600);
            }

            // 调整 ScrollView 的位置
            const scrollViewWidget = this.scrollView.node.getComponent(Widget) || this.scrollView.node.addComponent(Widget);
            scrollViewWidget.isAlignHorizontalCenter = true; // 水平居中
            scrollViewWidget.isAlignVerticalCenter = true;   // 垂直居中
            scrollViewWidget.top = 60; // 为顶部的关闭按钮留出空间
            scrollViewWidget.alignMode = Widget.AlignMode.ALWAYS;
        }

        // 初始化弹窗内容
        this.initPopupContent();

        // 确保在start时所有节点都是隐藏的
        this.hideAllNodes();
    }

    private initPopupContent() {
        // 获取所有特殊牌型
        const specialHands = this.specialHandsManager.getSpecialHands();
        
        // 清空现有内容
        if (this.contentNode) {
            this.contentNode.removeAllChildren();
            
            // 确保 contentNode 有 Layout 组件
            let layout = this.contentNode.getComponent(Layout);
            if (!layout) {
                layout = this.contentNode.addComponent(Layout);
            }
            // 设置垂直布局
            layout.type = Layout.Type.VERTICAL;
            layout.spacingY = 30; // 增加垂直间距
            layout.paddingTop = 30;
            layout.paddingBottom = 30;
            layout.paddingLeft = 40;
            layout.paddingRight = 40;
            layout.resizeMode = Layout.ResizeMode.CONTAINER;

            // 确保 contentNode 有正确的 UITransform
            const contentTransform = this.contentNode.getComponent(UITransform) || this.contentNode.addComponent(UITransform);
            contentTransform.width = 750; // 增加内容区域宽度
            
            // 遍历所有特殊牌型创建显示节点
            specialHands.forEach(hand => {
                // 创建容器节点
                const itemNode = new Node('HandItem');
                const itemLayout = itemNode.addComponent(Layout);
                itemLayout.type = Layout.Type.VERTICAL;
                itemLayout.spacingY = 15; // 增加项目内部间距
                itemLayout.resizeMode = Layout.ResizeMode.CONTAINER;
                itemLayout.paddingLeft = 20;
                itemLayout.paddingRight = 20;
                
                // 设置容器节点的 UITransform
                const itemTransform = itemNode.addComponent(UITransform);
                itemTransform.width = 750; // 增加项目宽度
                
                // 创建标题（牌型名称）
                const titleNode = new Node('Title');
                const titleLabel = titleNode.addComponent(Label);
                // 将英文名称转换为中文名称（使用括号内的名称）
                const chineseNames = {
                    'ROYAL_FLUSH': '完美同色序列',
                    'PERFECT_STRAIGHT': '完美序列',
                    'STRAIGHT_FLUSH': '同色序列',
                    'FOUR_OF_A_KIND': '四骑士',
                    'FLUSH': '同色',
                    'STRAIGHT': '序列',
                    'FULL_HOUSE': '满座',
                    'THREE_OF_A_KIND': '三贤者',
                    'TWO_PAIRS': '双偶星',
                    'PAIR': '偶星'
                };
                
                // 获取中文名称，如果映射表中没有对应的名称则使用原始名称
                const displayName = chineseNames[hand.name] || hand.name;
                titleLabel.string = displayName;
                titleLabel.color = new Color(255, 255, 0, 255); // 黄色
                titleLabel.fontSize = 32; // 增加字体大小
                titleLabel.overflow = Label.Overflow.RESIZE_HEIGHT;
                titleLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
                
                // 创建描述文本
                const descNode = new Node('Description');
                const descLabel = descNode.addComponent(Label);
                descLabel.string = `${hand.description}`;
                descLabel.color = new Color(255, 255, 255, 255); // 白色
                descLabel.fontSize = 28; // 增加字体大小
                descLabel.overflow = Label.Overflow.RESIZE_HEIGHT;
                descLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
                
                // 创建分数文本
                const scoreNode = new Node('Score');
                const scoreLabel = scoreNode.addComponent(Label);
                scoreLabel.string = `牌型加分: ${hand.bonusPoints}`;
                scoreLabel.color = new Color(0, 255, 0, 255); // 绿色
                scoreLabel.fontSize = 28; // 增加字体大小
                scoreLabel.overflow = Label.Overflow.RESIZE_HEIGHT;
                scoreLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
                
                // 设置所有文本节点的 UITransform
                [titleNode, descNode, scoreNode].forEach(node => {
                    const transform = node.getComponent(UITransform) || node.addComponent(UITransform);
                    transform.width = 700; // 增加文本宽度
                    transform.height = 50; // 增加初始高度
                });
                
                // 设置节点层级关系
                titleNode.setParent(itemNode);
                descNode.setParent(itemNode);
                scoreNode.setParent(itemNode);
                itemNode.setParent(this.contentNode);
            });

            // 确保 ScrollView 的 content 大小正确
            if (this.scrollView) {
                const viewContent = this.scrollView.content;
                if (viewContent) {
                    const contentTransform = viewContent.getComponent(UITransform);
                    const viewTrans = this.scrollView.view.getComponent(UITransform);
                    if (contentTransform && viewTrans) {
                        // 使用 setContentSize 方法设置大小
                        contentTransform.setContentSize(
                            contentTransform.width,
                            Math.max(contentTransform.height, viewTrans.height)
                        );
                    }
                }
            }
        }
    }

    public showPopup() {
        console.log('showPopup called');
        if (this.popupNode) {
            // 先激活所有需要的子节点
            if (this.contentNode) this.contentNode.active = true;
            if (this.scrollView && this.scrollView.node) this.scrollView.node.active = true;
            if (this.titleLabel && this.titleLabel.node) this.titleLabel.node.active = true;
            if (this.closeButton && this.closeButton.node) this.closeButton.node.active = true;
            
            // 最后显示弹窗本身
            console.log('Activating popupNode');
            this.popupNode.active = true;
            
            // 重置滚动位置
            if (this.scrollView) {
                this.scrollView.scrollToTop();
            }
        }
    }

    public hidePopup() {
        console.log('hidePopup called');
        if (this.popupNode) {
            console.log('Deactivating popupNode');
            this.popupNode.active = false;
        }
    }
} 