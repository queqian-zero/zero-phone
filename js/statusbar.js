/* Status Bar - 状态栏逻辑 */

class StatusBar {
    constructor() {
        this.timeElement = getElement('#statusTime');
        this.signalElement = getElement('#statusSignal');
        this.batteryElement = getElement('#statusBattery');
        
        this.init();
    }
    
    init() {
        // 初始更新
        this.updateTime();
        this.updateBattery();
        this.updateSignal();
        
        // 定时更新
        setInterval(() => this.updateTime(), 1000);      // 每秒更新时间
        setInterval(() => this.updateBattery(), 60000);  // 每分钟更新电量
        
        // 监听API配置变化
        this.watchAPIStatus();
    }
    
    // 更新时间显示
    updateTime() {
        const time = getCurrentTime();
        if (this.timeElement) {
            this.timeElement.textContent = time;
        }
    }
    
    // 更新电量显示
    async updateBattery() {
        const level = await getBatteryLevel();
        if (this.batteryElement) {
            this.batteryElement.textContent = `🔋${level}%`;
        }
    }
    
    // 更新信号显示
    updateSignal() {
        if (this.signalElement) {
            if (CONFIG.hasAPI) {
                // 有API配置 - 显示信号
                this.signalElement.textContent = '📶';
                this.signalElement.title = 'API已配置';
            } else {
                // 无API配置 - 无信号
                this.signalElement.textContent = '📵';
                this.signalElement.title = 'API未配置';
            }
        }
    }
    
    // 监听API状态变化
    watchAPIStatus() {
        // 每5秒检查一次API配置状态
        setInterval(() => {
            const hasAPI = CONFIG.hasAPI || (CONFIG.apiKey && CONFIG.apiKey.length > 0);
            if (hasAPI !== CONFIG.hasAPI) {
                CONFIG.hasAPI = hasAPI;
                this.updateSignal();
            }
        }, 5000);
    }
}

// 初始化状态栏（延迟到DOM加载完成）
let statusBarInstance = null;

function initStatusBar() {
    if (!statusBarInstance) {
        statusBarInstance = new StatusBar();
    }
    return statusBarInstance;
}
