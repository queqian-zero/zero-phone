// ==================== 聊天APP主控制器 ====================
/**
 * ChatApp - 聊天应用主入口
 * 负责: 初始化所有模块、管理页面切换、协调各模块
 */

class ChatApp {
    constructor() {
        // 当前激活的tab
        this.currentTab = 'chat'; // chat/friend/discover/profile
        
        // DOM元素
        this.tabBtns = null;
        this.tabContents = null;
        
        this.init();
    }

    // ==================== 初始化 ====================
    
    init() {
        console.log('🚀 ChatApp initializing...');
        
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setup();
            });
        } else {
            this.setup();
        }
    }

    setup() {
        // 获取DOM元素
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        if (!this.tabBtns.length || !this.tabContents.length) {
            console.error('❌ 找不到tab元素');
            return;
        }
        
        // 绑定tab切换事件
        this.bindTabEvents();
        
        // 初始化各个模块
        this.initModules();
        
        // 显示默认tab
        this.switchTab(this.currentTab);
        
        console.log('✅ ChatApp initialized');
        showToast('✅ 聊天APP已加载', 'success');
    }

    // ==================== 模块初始化 ====================
    
    initModules() {
        // 初始化好友列表UI
        if (typeof FriendListUI !== 'undefined') {
            window.friendListUI = new FriendListUI(friendManager, storageManager);
            console.log('✅ FriendListUI module loaded');
        } else {
            console.warn('⚠️ FriendListUI not loaded');
        }
        
        // TODO: 初始化聊天列表UI
        // TODO: 初始化发现页UI
        // TODO: 初始化个人设置UI
    }

    // ==================== Tab切换 ====================
    
    bindTabEvents() {
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    switchTab(tabName) {
        // 更新按钮状态
        this.tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 更新内容显示
        this.tabContents.forEach(content => {
            if (content.dataset.tab === tabName) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
        
        this.currentTab = tabName;
        
        // 触发tab切换事件
        this.onTabChange(tabName);
    }

    onTabChange(tabName) {
        console.log('Tab changed to:', tabName);
        
        // 根据tab执行不同操作
        switch(tabName) {
            case 'chat':
                // TODO: 刷新聊天列表
                break;
            case 'friend':
                // 刷新好友列表
                if (window.friendListUI) {
                    window.friendListUI.render();
                }
                break;
            case 'discover':
                // TODO: 刷新发现页
                break;
            case 'profile':
                // TODO: 刷新个人设置
                break;
        }
    }

    // ==================== 工具方法 ====================
    
    // 显示加载提示
    showLoading(message = '加载中...') {
        showToast(message, 'info');
    }

    // 隐藏加载提示
    hideLoading() {
        // Toast会自动消失，不需要手动隐藏
    }

    // 显示错误
    showError(message) {
        showToast(message, 'error');
    }

    // 显示成功
    showSuccess(message) {
        showToast(message, 'success');
    }
}

// ==================== 全局实例 ====================

// 检查依赖是否加载
function checkDependencies() {
    const required = [
        { name: 'showToast', obj: window.showToast },
        { name: 'StorageManager', obj: window.StorageManager },
        { name: 'storageManager', obj: window.storageManager },
        { name: 'FriendManager', obj: window.FriendManager },
        { name: 'friendManager', obj: window.friendManager },
        { name: 'FriendListUI', obj: window.FriendListUI }
    ];
    
    const missing = required.filter(dep => !dep.obj);
    
    if (missing.length > 0) {
        console.error('❌ 缺少依赖:', missing.map(d => d.name).join(', '));
        alert('⚠️ 部分模块未加载，请检查文件引入顺序');
        return false;
    }
    
    return true;
}

// 创建ChatApp实例
if (checkDependencies()) {
    const chatApp = new ChatApp();
    window.chatApp = chatApp;
} else {
    console.error('❌ ChatApp初始化失败：缺少依赖');
}