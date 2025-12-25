/* Frame Toggle - 边框切换逻辑 */

class FrameToggle {
    constructor() {
        this.toggleBtn = getElement('#frameToggleBtn');
        this.phoneFrame = getElement('#phoneFrame');
        
        this.init();
    }
    
    init() {
        // 恢复上次的边框状态
        this.applyFrameState(CONFIG.hasFrame, false);
        
        // 绑定点击事件
        this.bindEvents();
    }
    
    // 绑定事件
    bindEvents() {
        if (!this.toggleBtn) return;
        
        this.toggleBtn.addEventListener('click', () => {
            this.toggle();
        });
    }
    
    // 切换边框
    toggle() {
        const newState = !CONFIG.hasFrame;
        this.applyFrameState(newState);
        
        // 保存状态
        saveConfig('hasFrame', newState);
        
        console.log(`🖼️ Frame: ${newState ? 'ON' : 'OFF'}`);
    }
    
    // 应用边框状态
    applyFrameState(hasFrame, animate = true) {
        CONFIG.hasFrame = hasFrame;
        
        if (!this.phoneFrame) return;
        
        if (!animate) {
            // 禁用过渡动画
            this.phoneFrame.style.transition = 'none';
        }
        
        if (hasFrame) {
            // 显示边框
            removeClass(this.phoneFrame, 'frameless');
            if (this.toggleBtn) {
                this.toggleBtn.textContent = '⬜';
                this.toggleBtn.title = '切换到无框模式';
            }
        } else {
            // 隐藏边框
            addClass(this.phoneFrame, 'frameless');
            if (this.toggleBtn) {
                this.toggleBtn.textContent = '⬛';
                this.toggleBtn.title = '切换到有框模式';
            }
        }
        
        if (!animate) {
            // 恢复过渡动画
            setTimeout(() => {
                this.phoneFrame.style.transition = '';
            }, 50);
        }
    }
}

// 初始化边框切换
let frameToggleInstance = null;

function initFrameToggle() {
    if (!frameToggleInstance) {
        frameToggleInstance = new FrameToggle();
    }
    return frameToggleInstance;
}
