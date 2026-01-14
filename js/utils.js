/* Utils - 工具函数 */

// ==================== 时间相关 ====================

// 获取当前时间（HH:MM格式）
function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 获取当前日期（中文格式）
function getCurrentDate() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const day = days[now.getDay()];
    return `${month}月${date}日 ${day}`;
}

// 格式化时间戳为日期
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
}

// 计算两个日期之间的天数
function getDaysBetween(startDate, endDate = new Date()) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// ==================== 电量相关 ====================

// 获取设备电量（真实API或模拟）
async function getBatteryLevel() {
    try {
        // 尝试使用Battery API
        if ('getBattery' in navigator) {
            const battery = await navigator.getBattery();
            const level = Math.floor(battery.level * 100);
            return level;
        }
    } catch (e) {
        console.warn('Battery API not available:', e);
    }
    
    // 降级方案：返回模拟电量
    return Math.floor(Math.random() * 20) + 80; // 80-100%
}

// 监听电量变化
async function watchBattery(callback) {
    try {
        if ('getBattery' in navigator) {
            const battery = await navigator.getBattery();
            
            // 初始调用
            callback(Math.floor(battery.level * 100));
            
            // 监听变化
            battery.addEventListener('levelchange', () => {
                callback(Math.floor(battery.level * 100));
            });
            
            return true;
        }
    } catch (e) {
        console.warn('Battery watch not available:', e);
    }
    
    return false;
}

// ==================== 触摸/手势相关 ====================

// 检测滑动方向和距离
function detectSwipe(startX, startY, endX, endY) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // 判断是水平还是垂直滑动
    if (absDeltaX > absDeltaY) {
        // 水平滑动
        if (absDeltaX > CONFIG.swipeThreshold) {
            return deltaX > 0 ? 'right' : 'left';
        }
    } else {
        // 垂直滑动
        if (absDeltaY > CONFIG.swipeThreshold) {
            return deltaY > 0 ? 'down' : 'up';
        }
    }
    
    return null;
}

// ==================== DOM操作辅助 ====================

// 安全获取DOM元素
function getElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
        console.warn(`Element not found: ${selector}`);
    }
    return element;
}

// 批量获取DOM元素
function getElements(selector) {
    return document.querySelectorAll(selector);
}

// 添加class（支持多个）
function addClass(element, ...classNames) {
    if (element) {
        element.classList.add(...classNames);
    }
}

// 移除class（支持多个）
function removeClass(element, ...classNames) {
    if (element) {
        element.classList.remove(...classNames);
    }
}

// 切换class
function toggleClass(element, className) {
    if (element) {
        element.classList.toggle(className);
    }
}

// ==================== 节流/防抖 ====================

// 节流函数
function throttle(func, wait) {
    let timeout;
    let previous = 0;
    
    return function(...args) {
        const now = Date.now();
        const remaining = wait - (now - previous);
        
        if (remaining <= 0) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            func.apply(this, args);
        } else if (!timeout) {
            timeout = setTimeout(() => {
                previous = Date.now();
                timeout = null;
                func.apply(this, args);
            }, remaining);
        }
    };
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
}

// ==================== 动画辅助 ====================

// 延迟执行
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 等待动画结束
function waitForAnimation(element) {
    return new Promise(resolve => {
        element.addEventListener('animationend', resolve, { once: true });
    });
}

// 等待过渡结束
function waitForTransition(element) {
    return new Promise(resolve => {
        element.addEventListener('transitionend', resolve, { once: true });
    });
}
