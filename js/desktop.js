/* Desktop - 桌面切换逻辑 */

class Desktop {
    constructor() {
        this.pagesElement = getElement('#desktopPages');
        this.indicators = getElements('.indicator');
        
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchCurrentX = 0;
        this.touchCurrentY = 0;
        this.isDragging = false;
        this.startPage = 0;
        
        this.init();
    }
    
    init() {
        // 恢复上次的页面
        this.goToPage(CONFIG.currentPage, false);
        
        // 绑定触摸事件
        this.bindTouchEvents();
        
        // 绑定页面时间更新
        this.updatePageTimes();
        setInterval(() => this.updatePageTimes(), 1000);
    }
    
    // 更新各页面的时间显示
    updatePageTimes() {
        const time = getCurrentTime();
        const date = getCurrentDate();
        
        // 第1页的时间
        const page1Time = getElement('#page1Time');
        const page1Date = getElement('#page1Date');
        if (page1Time) page1Time.textContent = time;
        if (page1Date) page1Date.textContent = date;
    }
    
    // 绑定触摸事件
    bindTouchEvents() {
        if (!this.pagesElement) return;
        
        // 触摸开始
        this.pagesElement.addEventListener('touchstart', (e) => {
            if (CONFIG.isLocked) return;
            
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.startPage = CONFIG.currentPage;
            this.isDragging = true;
            
            addClass(this.pagesElement, 'dragging');
        });
        
        // 触摸移动
        this.pagesElement.addEventListener('touchmove', (e) => {
            if (CONFIG.isLocked || !this.isDragging) return;
            
            this.touchCurrentX = e.touches[0].clientX;
            this.touchCurrentY = e.touches[0].clientY;
            
            const deltaX = this.touchCurrentX - this.touchStartX;
            const deltaY = this.touchCurrentY - this.touchStartY;
            
            // 判断是否为水平滑动
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                e.preventDefault(); // 阻止垂直滚动
                
                // 计算当前偏移
                const baseOffset = -this.startPage * 33.333;
                const dragOffset = (deltaX / this.pagesElement.offsetWidth) * 100;
                let newOffset = baseOffset + dragOffset;
                
                // 限制边界
                newOffset = Math.max(-66.666, Math.min(0, newOffset));
                
                this.pagesElement.style.transform = `translateX(${newOffset}%)`;
            }
        });
        
        // 触摸结束
        this.pagesElement.addEventListener('touchend', (e) => {
            if (CONFIG.isLocked || !this.isDragging) return;
            
            const deltaX = this.touchCurrentX - this.touchStartX;
            const deltaY = this.touchCurrentY - this.touchStartY;
            
            removeClass(this.pagesElement, 'dragging');
            this.isDragging = false;
            
            // 判断滑动方向（水平优先）
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                const direction = detectSwipe(
                    this.touchStartX, 
                    this.touchStartY, 
                    this.touchCurrentX, 
                    this.touchCurrentY
                );
                
                if (direction === 'left') {
                    // 向左滑 - 下一页
                    this.nextPage();
                } else if (direction === 'right') {
                    // 向右滑 - 上一页
                    this.prevPage();
                } else {
                    // 回弹到当前页
                    this.goToPage(CONFIG.currentPage);
                }
            } else {
                // 回弹到当前页
                this.goToPage(CONFIG.currentPage);
            }
        });
    }
    
    // 跳转到指定页面
    goToPage(pageIndex, animate = true) {
        // 限制页面范围
        pageIndex = Math.max(0, Math.min(CONFIG.totalPages - 1, pageIndex));
        
        CONFIG.currentPage = pageIndex;
        
        // 保存到本地存储
        saveConfig('currentPage', pageIndex);
        
        // 更新页面位置
        if (this.pagesElement) {
            this.pagesElement.setAttribute('data-page', pageIndex);
            
            if (!animate) {
                addClass(this.pagesElement, 'dragging');
                setTimeout(() => {
                    removeClass(this.pagesElement, 'dragging');
                }, 50);
            }
        }
        
        // 更新指示点
        this.updateIndicators();
        
        console.log(`📱 Page: ${pageIndex}`);
    }
    
    // 下一页
    nextPage() {
        if (CONFIG.currentPage < CONFIG.totalPages - 1) {
            this.goToPage(CONFIG.currentPage + 1);
        } else {
            this.goToPage(CONFIG.currentPage); // 回弹
        }
    }
    
    // 上一页
    prevPage() {
        if (CONFIG.currentPage > 0) {
            this.goToPage(CONFIG.currentPage - 1);
        } else {
            this.goToPage(CONFIG.currentPage); // 回弹
        }
    }
    
    // 更新指示点
    updateIndicators() {
        this.indicators.forEach((indicator, index) => {
            if (index === CONFIG.currentPage) {
                addClass(indicator, 'active');
            } else {
                removeClass(indicator, 'active');
            }
        });
    }
}

// 初始化桌面
let desktopInstance = null;

function initDesktop() {
    if (!desktopInstance) {
        desktopInstance = new Desktop();
    }
    return desktopInstance;
}
