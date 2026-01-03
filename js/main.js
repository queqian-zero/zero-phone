/* Main - 主入口 */

class App {
    constructor() {
        this.statusBar = null;
        this.lockscreen = null;
        this.desktop = null;
        this.frameToggle = null;
        this.languageToggle = null;
        
        this.init();
    }
    
    async init() {
        console.log('🚀 AI Phone App Starting...');
        
        // 等待DOM完全加载
        await this.waitForDOM();
        
        // 初始化各个模块
        this.initModules();
        
        // 启动完成
        console.log('✅ AI Phone App Started!');
        console.log('📱 Current Page:', CONFIG.currentPage);
        console.log('🔒 Locked:', CONFIG.isLocked);
        console.log('🖼️ Frame:', CONFIG.hasFrame);
        console.log('📡 API:', CONFIG.hasAPI);
        
        // 显示欢迎信息
        this.showWelcome();
    }
    
    // 等待DOM加载
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    // 初始化各个模块
    initModules() {
        try {
            // 初始化状态栏
            this.statusBar = initStatusBar();
            console.log('✓ Status Bar initialized');
            
            // 初始化锁屏
            this.lockscreen = initLockscreen();
            console.log('✓ Lockscreen initialized');
            
            // 初始化桌面
            this.desktop = initDesktop();
            console.log('✓ Desktop initialized');
            
            // 初始化边框切换
            this.frameToggle = initFrameToggle();
            console.log('✓ Frame Toggle initialized');
            
            // 初始化语言切换
            this.languageToggle = initLanguageToggle();
            console.log('✓ Language Toggle initialized');
           
            // 初始化文字编辑器
        this.textEditor = initTextEditor();
        console.log('✓ Text Editor initialized');
            
        } catch (error) {
            console.error('❌ Module initialization failed:', error);
        }
    }
    
    // 显示欢迎信息
    showWelcome() {
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #667eea');
        console.log('%c    🤖 AI手机系统 v2.0.0', 'color: #667eea; font-size: 16px; font-weight: bold;');
        console.log('%c    开发者：〇&Claude', 'color: #764ba2; font-size: 12px;');
        console.log('%c    点击解锁版 + 美化 + 语言切换', 'color: #999; font-size: 11px;');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #667eea');
        console.log('');
        console.log('💡 功能：');
        console.log('  • 点击 ⬆️ 按钮解锁');
        console.log('  • 左右滑动切换页面');
        console.log('  • 点击状态栏右上角切换边框');
        console.log('  • 点击APP名字显示中文（3秒后恢复）');
        console.log('  • 长按APP名字锁定语言');
        console.log('');
    }
}

// 创建并启动应用
const app = new App();

// 全局错误处理
window.addEventListener('error', (e) => {
    console.error('Global Error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e.reason);
});

// 调试用：全局访问
window.APP = app;
window.CONFIG = CONFIG;