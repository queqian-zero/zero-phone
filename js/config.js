/* Config - 全局配置 */

const CONFIG = {
    // API配置
    hasAPI: false,                    // 是否配置了API
    apiKey: '',                       // API密钥
    apiModel: 'claude-sonnet-4',      // API模型
    
    // 显示配置
    hasFrame: true,                   // 是否显示边框
    currentPage: 0,                   // 当前页面 (0, 1, 2)
    totalPages: 3,                    // 总页面数
    
    // 锁屏状态
    isLocked: true,                   // 是否锁屏
    
    // 动画配置
    swipeThreshold: 50,               // 滑动触发阈值（px）
    swipeVelocity: 0.3,              // 滑动速度阈值
    
    // 本地存储key
    storageKeys: {
        apiKey: 'ai_phone_api_key',
        apiModel: 'ai_phone_api_model',
        hasFrame: 'ai_phone_has_frame',
        currentPage: 'ai_phone_current_page'
    }
};

// 从本地存储加载配置
function loadConfig() {
    try {
        // 加载API配置
        const savedApiKey = localStorage.getItem(CONFIG.storageKeys.apiKey);
        if (savedApiKey) {
            CONFIG.apiKey = savedApiKey;
            CONFIG.hasAPI = true;
        }
        
        const savedApiModel = localStorage.getItem(CONFIG.storageKeys.apiModel);
        if (savedApiModel) {
            CONFIG.apiModel = savedApiModel;
        }
        
        // 加载边框配置
        const savedFrame = localStorage.getItem(CONFIG.storageKeys.hasFrame);
        if (savedFrame !== null) {
            CONFIG.hasFrame = savedFrame === 'true';
        }
        
        // 加载当前页面
        const savedPage = localStorage.getItem(CONFIG.storageKeys.currentPage);
        if (savedPage !== null) {
            CONFIG.currentPage = parseInt(savedPage, 10);
        }
    } catch (e) {
        console.warn('Failed to load config from localStorage:', e);
    }
}

// 保存配置到本地存储
function saveConfig(key, value) {
    try {
        localStorage.setItem(CONFIG.storageKeys[key], value);
        CONFIG[key] = value;
    } catch (e) {
        console.warn('Failed to save config to localStorage:', e);
    }
}

// 页面加载时自动加载配置
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadConfig);
} else {
    loadConfig();
}
