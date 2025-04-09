import { _decorator, Component, sys, view, screen, UITransform, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlatformAdapter')
export class PlatformAdapter extends Component {
    private static instance: PlatformAdapter = null;

    public static getInstance(): PlatformAdapter {
        return PlatformAdapter.instance;
    }

    private isMobile: boolean = false;
    private isTablet: boolean = false;
    private isDesktop: boolean = false;
    private isWeb: boolean = false;

    start() {
        PlatformAdapter.instance = this;
        this.detectPlatform();
        this.adaptToPlatform();
    }

    private detectPlatform() {
        // 检测平台类型
        this.isMobile = sys.isMobile;
        this.isTablet = this.isTabletDevice();
        this.isDesktop = sys.platform === sys.Platform.DESKTOP_BROWSER || sys.platform === sys.Platform.WIN32 || sys.platform === sys.Platform.MACOS;
        this.isWeb = sys.isBrowser;

        console.log(`Platform detected: Mobile=${this.isMobile}, Tablet=${this.isTablet}, Desktop=${this.isDesktop}, Web=${this.isWeb}`);
    }

    private isTabletDevice(): boolean {
        // 检测是否为平板设备
        const screenSize = screen.windowSize;
        const aspectRatio = screenSize.width / screenSize.height;
        return this.isMobile && (aspectRatio >= 0.74 && aspectRatio <= 1.5);
    }

    private adaptToPlatform() {
        // 强制横屏显示
        if (this.isMobile || this.isTablet) {
            view.setOrientation(1); // 1 = LANDSCAPE
        }

        if (this.isMobile || this.isTablet) {
            this.adaptForMobile();
        } else {
            this.adaptForDesktop();
        }
    }

    private adaptForMobile() {
        // 移动设备适配
        const canvas = this.node.getComponent(UITransform);
        if (canvas) {
            // 设置移动设备上的缩放比例
            const designResolution = view.getDesignResolutionSize();
            const screenSize = screen.windowSize;

            // 计算横屏下的缩放比例
            const scaleX = screenSize.width / designResolution.width;
            const scaleY = screenSize.height / designResolution.height;
            const scale = Math.min(scaleX, scaleY);

            // 应用缩放
            this.node.setScale(scale, scale, 1);

            // 调整UI元素大小和位置
            this.adjustUIElements(scale);
        }
    }

    private adaptForDesktop() {
        // 桌面设备适配
        const canvas = this.node.getComponent(UITransform);
        if (canvas) {
            // 保持原始设计分辨率
            const designResolution = view.getDesignResolutionSize();
            view.setDesignResolutionSize(designResolution.width, designResolution.height, 2);
        }
    }

    private adjustUIElements(scale: number) {
        // 调整UI元素的大小和位置
        // 这里可以根据需要调整特定的UI元素
        const uiElements = this.node.getComponentsInChildren(UITransform);
        for (const element of uiElements) {
            // 调整字体大小
            const label = element.node.getComponent(Label);
            if (label) {
                const originalSize = label.fontSize;
                label.fontSize = Math.floor(originalSize * scale);
            }

            // 调整按钮大小
            const button = element.node.getComponent('cc.Button');
            if (button) {
                const originalSize = element.contentSize;
                element.setContentSize(
                    originalSize.width * scale,
                    originalSize.height * scale
                );
            }
        }
    }

    public getPlatformType(): string {
        if (this.isTablet) return 'tablet';
        if (this.isMobile) return 'mobile';
        if (this.isDesktop) return 'desktop';
        if (this.isWeb) return 'web';
        return 'unknown';
    }

    public isTouchDevice(): boolean {
        return this.isMobile || this.isTablet;
    }

    public getScreenScale(): number {
        const designResolution = view.getDesignResolutionSize();
        const screenSize = screen.windowSize;
        const scaleX = screenSize.width / designResolution.width;
        const scaleY = screenSize.height / designResolution.height;
        return Math.min(scaleX, scaleY);
    }

    public isLandscape(): boolean {
        const screenSize = screen.windowSize;
        return screenSize.width > screenSize.height;
    }
} 