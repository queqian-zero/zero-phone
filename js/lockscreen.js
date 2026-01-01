/* Lockscreen - 锁屏逻辑 */

class Lockscreen {
    constructor() {
        console.log('🔍 Lockscreen constructor started');
        
        this.lockscreenElement = getElement('#lockscreen');
        
        if (!this.lockscreenElement) {
            console.error('❌ 找不到 #lockscreen 元素！');
            alert('❌ 找不到锁屏元素！请检查HTML！');
            return;
        }
        
        console.log('✅ 找到锁屏元素:', this.lockscreenElement);
        
        // 添加点击测试
        this.lockscreenElement.onclick = () => {
            alert('✅ 锁屏可以点击！CONFIG.isLocked = ' + CONFIG.isLocked);
        };
        
        this.timeElement = getElement('#lockscreenTime');
        this.dateElement = getElement('#lockscreenDate');
        
        this.touchStartY = 0;
        this.touchCurrentY = 0;
        this.isSwiping = false;
        
        this.init();
    }
    
    init() {
        console.log('🔍 Lockscreen init started');
        
        // 更新锁屏时间和日期
        this.updateTime();
        this.updateDate();
        
        // 定时更新
        setInterval(() => this.updateTime(), 1000);
        setInterval(() => this.updateDate(), 60000);
        
        // 绑定触摸事件
        this.bindTouchEvents();
        
        console.log('✅ Lockscreen 初始化完成！');
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
        if (!this.lockscreenElement) {
            console.error('❌ lockscreenElement 不存在，无法绑定触摸事件！');
            return;
        }
        
        console.log('🔍 开始绑定触摸事件...');
        
        // 触摸开始
        this.lockscreenElement.addEventListener('touchstart', (e) => {
            console.log('🔍 touchstart 触发！isLocked =', CONFIG.isLocked);
            
            if (!CONFIG.isLocked) return;
            
            e.preventDefault();
            this.touchStartY = e.touches[0].clientY;
            this.isSwiping = true;
            addClass(this.lockscreenElement, 'swiping');
            
            console.log('🔍 开始滑动，起始Y =', this.touchStartY);
        }, { passive: false });
        
        // 触摸移动
        this.lockscreenElement.addEventListener('touchmove', (e) => {
            if (!CONFIG.isLocked || !this.isSwiping) return;
            
            e.preventDefault();
            this.touchCurrentY = e.touches[0].clientY;
            const deltaY = this.touchCurrentY - this.touchStartY;
            
            // 只允许向上滑动
            if (deltaY < 0) {
                const translateY = Math.max(deltaY, -this.lockscreenElement.offsetHeight);
                this.lockscreenElement.style.transform = `translateY(${translateY}px)`;
            }
        }, { passive: false });
        
        // 触摸结束
        this.lockscreenElement.addEventListener('touchend', (e) => {
            console.log('🔍 touchend 触发！');
            
            if (!CONFIG.isLocked || !this.isSwiping) {
                console.log('🔍 跳过：isLocked =', CONFIG.isLocked, 'isSwiping =', this.isSwiping);
                return;
            }
            
            e.preventDefault();
            const deltaY = this.touchCurrentY - this.touchStartY;
            
            console.log('🔍 滑动距离 deltaY =', deltaY);
            
            removeClass(this.lockscreenElement, 'swiping');
            this.isSwiping = false;
            
            // 判断是否解锁（向上滑动超过100px）
            if (Math.abs(deltaY) > 100 && deltaY < 0) {
                console.log('✅ 解锁！');
                this.unlock();
            } else {
                console.log('❌ 滑动不足，回弹');
                // 平滑回弹
                this.lockscreenElement.style.transition = 'transform 0.3s ease';
                this.lockscreenElement.style.transform = 'translateY(0)';
                setTimeout(() => {
                    this.lockscreenElement.style.transition = '';
                }, 300);
            }
        }, { passive: false });
        
        console.log('✅ 触摸事件绑定完成！');
    }
    
    // 解锁
    unlock() {
        if (!CONFIG.isLocked) return;
        
        CONFIG.isLocked = false;
        addClass(this.lockscreenElement, 'unlocked');
        
        console.log('🔓 已解锁！');
        alert('🔓 解锁成功！');  // 临时测试
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
    console.log('🔍 initLockscreen 被调用');
    
    if (!lockscreenInstance) {
        lockscreenInstance = new Lockscreen();
    }
    return lockscreenInstance;
}

console.log('✅ lockscreen.js 文件已加载！');