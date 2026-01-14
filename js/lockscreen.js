/* Lockscreen - 锁屏逻辑（超简单版 - 点击解锁）*/

class Lockscreen {
    constructor() {
        this.lockscreenElement = getElement('#lockscreen');
        this.unlockButton = getElement('#unlockButton');
        this.timeElement = getElement('#lockscreenTime');
        this.dateElement = getElement('#lockscreenDate');
        
        this.init();
    }
    
    init() {
        // 更新锁屏时间和日期
        this.updateTime();
        this.updateDate();
        
        // 定时更新
        setInterval(() => this.updateTime(), 1000);
        setInterval(() => this.updateDate(), 60000);
        
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
    
    // 绑定点击事件（超简单！）
    bindClickEvent() {
        if (!this.unlockButton) {
            console.error('❌ 找不到解锁按钮！');
            return;
        }
        
        // 点击按钮解锁
        this.unlockButton.addEventListener('click', () => {
            this.unlock();
        });
        
        console.log('✅ 锁屏点击事件已绑定');
    }
    
    // 解锁
    unlock() {
        if (!CONFIG.isLocked) return;
        
        CONFIG.isLocked = false;
        addClass(this.lockscreenElement, 'unlocked');
        
        console.log('🔓 已解锁！');
    }
    
    // 锁定
    lock() {
        if (CONFIG.isLocked) return;
        
        CONFIG.isLocked = true;
        removeClass(this.lockscreenElement, 'unlocked');
        this.lockscreenElement.style.transform = '';
        
        console.log('🔒 已锁定！');
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