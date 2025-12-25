/* Lockscreen - 锁屏逻辑 */

class Lockscreen {
    constructor() {
        this.lockscreenElement = getElement('#lockscreen');
        this.timeElement = getElement('#lockscreenTime');
        this.dateElement = getElement('#lockscreenDate');
        
        this.touchStartY = 0;
        this.touchCurrentY = 0;
        this.isSwiping = false;
        
        this.init();
    }
    
    init() {
        // 更新锁屏时间和日期
        this.updateTime();
        this.updateDate();
        
        // 定时更新
        setInterval(() => this.updateTime(), 1000);
        setInterval(() => this.updateDate(), 60000);
        
        // 绑定触摸事件
        this.bindTouchEvents();
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
    
    // 绑定触摸事件
    bindTouchEvents() {
        if (!this.lockscreenElement) return;
        
        // 触摸开始
        this.lockscreenElement.addEventListener('touchstart', (e) => {
            if (!CONFIG.isLocked) return;
            
            this.touchStartY = e.touches[0].clientY;
            this.isSwiping = true;
            addClass(this.lockscreenElement, 'swiping');
        });
        
        // 触摸移动
        this.lockscreenElement.addEventListener('touchmove', (e) => {
            if (!CONFIG.isLocked || !this.isSwiping) return;
            
            this.touchCurrentY = e.touches[0].clientY;
            const deltaY = this.touchCurrentY - this.touchStartY;
            
            // 只允许向上滑动
            if (deltaY < 0) {
                const translateY = Math.max(deltaY, -this.lockscreenElement.offsetHeight);
                this.lockscreenElement.style.transform = `translateY(${translateY}px)`;
            }
        });
        
        // 触摸结束
        this.lockscreenElement.addEventListener('touchend', (e) => {
            if (!CONFIG.isLocked || !this.isSwiping) return;
            
            const deltaY = this.touchCurrentY - this.touchStartY;
            
            removeClass(this.lockscreenElement, 'swiping');
            this.isSwiping = false;
            
            // 判断是否解锁（向上滑动超过阈值）
            if (deltaY < -CONFIG.swipeThreshold) {
                this.unlock();
            } else {
                // 回弹
                this.lockscreenElement.style.transform = '';
            }
        });
    }
    
    // 解锁
    unlock() {
        if (!CONFIG.isLocked) return;
        
        CONFIG.isLocked = false;
        addClass(this.lockscreenElement, 'unlocked');
        
        console.log('🔓 Unlocked!');
    }
    
    // 锁定
    lock() {
        if (CONFIG.isLocked) return;
        
        CONFIG.isLocked = true;
        removeClass(this.lockscreenElement, 'unlocked');
        this.lockscreenElement.style.transform = '';
        
        console.log('🔒 Locked!');
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
