/* Lockscreen - 锁屏逻辑（增强版 - 点击解锁 + 性能优化）*/

class Lockscreen {
    constructor() {
        this.lockscreenElement = getElement('#lockscreen');
        this.unlockButton = getElement('#unlockButton');
        this.timeElement = getElement('#lockscreenTime');
        this.dateElement = getElement('#lockscreenDate');
        
        // 防重复点击
        this.isUnlocking = false;
        
        // 定时器引用（用于清理）
        this.timeInterval = null;
        this.dateInterval = null;
        
        this.init();
    }
    
    init() {
        // 更新锁屏时间和日期
        this.updateTime();
        this.updateDate();
        
        // 定时更新（保存引用以便清理）
        this.timeInterval = setInterval(() => this.updateTime(), 1000);
        this.dateInterval = setInterval(() => this.updateDate(), 60000);
        
        // 绑定点击事件
        this.bindClickEvent();
    }
    
    // 更新时间
    updateTime() {
        const time = getCurrentTime();
        if (this.timeElement) {
            this.timeElement.textContent = time;
        }
    }
    
    // 更新日期
    updateDate() {
        const date = getCurrentDate();
        if (this.dateElement) {
            this.dateElement.textContent = date;
        }
    }
    
    // 绑定点击事件（增强版 - 防重复触发）
    bindClickEvent() {
        if (!this.unlockButton) {
            console.error('❌ 找不到解锁按钮！');
            return;
        }
        
        // 点击按钮解锁（防重复点击）
        this.unlockButton.addEventListener('click', (e) => {
            // 防止事件冒泡
            e.stopPropagation();
            
            // 如果正在解锁中，忽略点击
            if (this.isUnlocking) {
                return;
            }
            
            this.unlock();
        });
        
        // 移动端触摸优化（可选）
        this.unlockButton.addEventListener('touchend', (e) => {
            // 防止触摸后又触发click
            e.preventDefault();
            
            if (this.isUnlocking) {
                return;
            }
            
            this.unlock();
        }, { passive: false });
        
        console.log('✅ 锁屏点击事件已绑定');
    }
    
    // 解锁
    unlock() {
        if (!CONFIG.isLocked) return;
        if (this.isUnlocking) return; // 防重复
        
        // 设置解锁中标志
        this.isUnlocking = true;
        
        CONFIG.isLocked = false;
        addClass(this.lockscreenElement, 'unlocked');
        
        console.log('🔓 已解锁！');
        
        // 动画完成后重置标志（假设动画0.5秒）
        setTimeout(() => {
            this.isUnlocking = false;
        }, 500);
    }
    
    // 锁定
    lock() {
        if (CONFIG.isLocked) return;
        
        CONFIG.isLocked = true;
        this.isUnlocking = false; // 重置标志
        removeClass(this.lockscreenElement, 'unlocked');
        this.lockscreenElement.style.transform = '';
        
        console.log('🔒 已锁定！');
    }
    
    // 销毁（清理定时器）
    destroy() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
        
        if (this.dateInterval) {
            clearInterval(this.dateInterval);
            this.dateInterval = null;
        }
        
        console.log('🧹 锁屏已清理');
    }
}

// 初始化锁屏
let lockscreenInstance = null;

function initLockscreen() {
    if (!lockscreenInstance) {
        lockscreenInstance = new Lockscreen();
    }
    return lockscreenInstance;
}

// 清理锁屏（页面卸载时调用）
function destroyLockscreen() {
    if (lockscreenInstance) {
        lockscreenInstance.destroy();
        lockscreenInstance = null;
    }
}

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    destroyLockscreen();
});
