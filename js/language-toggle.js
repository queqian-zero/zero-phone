/* Language Toggle - 语言切换功能 */

class LanguageToggle {
    constructor() {
        this.appIcons = [];
        this.longPressTimer = null;
        this.longPressDelay = 500; // 长按延迟（毫秒）
        this.autoRevertDelay = 3000; // 自动恢复延迟（3秒）
        this.revertTimers = new Map(); // 存储每个图标的恢复定时器
        
        this.init();
    }
    
    init() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindEvents());
        } else {
            this.bindEvents();
        }
    }
    
    bindEvents() {
        // 获取所有APP图标
        this.appIcons = document.querySelectorAll('.app-icon');
        
        console.log(`🔍 找到 ${this.appIcons.length} 个APP图标`);
        
        this.appIcons.forEach(icon => {
            const labelText = icon.querySelector('.label-text');
            if (!labelText) return;
            
            // 存储当前语言状态（默认英文）
            icon.dataset.currentLang = 'en';
            icon.dataset.isLocked = 'false';
            
            // 触摸开始时间
            let touchStartTime = 0;
            
            // 触摸事件
            labelText.addEventListener('touchstart', (e) => {
                e.preventDefault();
                touchStartTime = Date.now();
                this.startLongPress(icon);
            }, { passive: false });
            
            labelText.addEventListener('touchend', (e) => {
                e.preventDefault();
                
                const touchDuration = Date.now() - touchStartTime;
                
                // 如果按压时间小于500ms，算作点击
                if (touchDuration < this.longPressDelay) {
                    console.log(`🖱️ 短按: ${icon.dataset.en}`);
                    this.handleClick(icon);
                }
                
                this.endLongPress(icon);
            }, { passive: false });
            
            labelText.addEventListener('touchcancel', () => {
                this.cancelLongPress();
            });
            
            // PC端事件
            labelText.addEventListener('mousedown', (e) => {
                if (e.button === 0) {
                    this.startLongPress(icon);
                }
            });
            
            labelText.addEventListener('mouseup', () => {
                this.endLongPress(icon);
            });
            
            labelText.addEventListener('mouseleave', () => {
                this.cancelLongPress();
            });
            
            labelText.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log(`🖱️ PC点击: ${icon.dataset.en}`);
                this.handleClick(icon);
            });
        });
        
        console.log('✓ Language toggle initialized');
    }
    
    // 处理点击（临时切换）
    handleClick(icon) {
        console.log(`📝 handleClick: ${icon.dataset.en}, locked: ${icon.dataset.isLocked}`);
        
        // 如果已经锁定，点击切换锁定状态的语言
        if (icon.dataset.isLocked === 'true') {
            this.toggleLanguage(icon, true);
        } else {
            // 临时切换到中文，3秒后恢复
            this.showChinese(icon, true);
        }
    }
    
    // 开始长按
    startLongPress(icon) {
        this.longPressTimer = setTimeout(() => {
            this.handleLongPress(icon);
        }, this.longPressDelay);
    }
    
    // 结束长按
    endLongPress(icon) {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }
    
    // 取消长按
    cancelLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }
    
    // 处理长按（锁定切换）
    handleLongPress(icon) {
        // 切换锁定状态
        const isLocked = icon.dataset.isLocked === 'true';
        
        if (isLocked) {
            // 解除锁定
            icon.dataset.isLocked = 'false';
            icon.classList.remove('lang-locked');
            console.log(`🔓 Unlocked: ${icon.dataset.en}`);
        } else {
            // 锁定当前语言
            icon.dataset.isLocked = 'true';
            icon.classList.add('lang-locked');
            
            // 清除自动恢复定时器
            if (this.revertTimers.has(icon)) {
                clearTimeout(this.revertTimers.get(icon));
                this.revertTimers.delete(icon);
            }
            
            console.log(`🔒 Locked: ${icon.dataset.en} (${icon.dataset.currentLang})`);
        }
        
        // 震动反馈（如果支持）
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
    
    // 显示中文
    showChinese(icon, autoRevert = false) {
        const currentLang = icon.dataset.currentLang;
        
        console.log(`🇨🇳 showChinese: ${icon.dataset.en}, current: ${currentLang}`);
        
        // 如果已经是中文，不做操作
        if (currentLang === 'zh') return;
        
        // 清除之前的自动恢复定时器
        if (this.revertTimers.has(icon)) {
            clearTimeout(this.revertTimers.get(icon));
            this.revertTimers.delete(icon);
        }
        
        // 切换到中文
        this.switchLanguage(icon, 'zh');
        
        // 如果需要自动恢复
        if (autoRevert && icon.dataset.isLocked === 'false') {
            const timer = setTimeout(() => {
                this.switchLanguage(icon, 'en');
                this.revertTimers.delete(icon);
            }, this.autoRevertDelay);
            
            this.revertTimers.set(icon, timer);
        }
    }
    
    // 切换语言（锁定状态下使用）
    toggleLanguage(icon, permanent = false) {
        const currentLang = icon.dataset.currentLang;
        const newLang = currentLang === 'en' ? 'zh' : 'en';
        
        this.switchLanguage(icon, newLang);
        
        // 如果不是永久切换且未锁定，设置自动恢复
        if (!permanent && icon.dataset.isLocked === 'false') {
            if (this.revertTimers.has(icon)) {
                clearTimeout(this.revertTimers.get(icon));
            }
            
            const timer = setTimeout(() => {
                this.switchLanguage(icon, 'en');
                this.revertTimers.delete(icon);
            }, this.autoRevertDelay);
            
            this.revertTimers.set(icon, timer);
        }
    }
    
    // 执行语言切换
    switchLanguage(icon, targetLang) {
        const labelText = icon.querySelector('.label-text');
        if (!labelText) return;
        
        const enText = icon.dataset.en;
        const zhText = icon.dataset.zh;
        const currentLang = icon.dataset.currentLang;
        
        // 如果已经是目标语言，不做操作
        if (currentLang === targetLang) return;
        
        console.log(`🔄 切换: ${enText} (${currentLang} → ${targetLang})`);
        
        // 淡出动画
        labelText.classList.add('fade-out');
        
        setTimeout(() => {
            // 切换文字
            labelText.textContent = targetLang === 'en' ? enText : zhText;
            icon.dataset.currentLang = targetLang;
            
            // 淡入动画
            labelText.classList.remove('fade-out');
            labelText.classList.add('fade-in');
            
            setTimeout(() => {
                labelText.classList.remove('fade-in');
            }, 200);
        }, 200);
    }
}

// 初始化
let languageToggleInstance = null;

function initLanguageToggle() {
    if (!languageToggleInstance) {
        languageToggleInstance = new LanguageToggle();
    }
    return languageToggleInstance;
}