// ==================== 聊天APP主控制器 ====================
/**
 * ChatApp - 聊天应用主入口
 * 负责: 页面切换、按钮管理、模块初始化
 */

class ChatApp {
    constructor() {
        this.currentPage = 'chatListPage';
        this.init();
    }
    
    // ==================== 初始化 ====================
    
    init() {
        console.log('🚀 ChatApp initializing...');
        
        // 等待DOM加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setup();
            });
        } else {
            this.setup();
        }
    }

    setup() {
        // 检查依赖
        if (!this.checkDependencies()) {
            return;
        }
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化模块
        this.initModules();
        
        // 显示默认页面
        this.switchPage(this.currentPage);
        
        console.log('✅ 聊天APP初始化完成');
        if (typeof showToast === 'function') {
            showToast('✅ 聊天APP已加载', 'success', 1000);
        }
    }

    // ==================== 依赖检查 ====================
    
    checkDependencies() {
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
            const missingNames = missing.map(d => d.name).join('\n');
            alert('⚠️ 缺少以下模块:\n\n' + missingNames + '\n\n请检查文件引入顺序');
            return false;
        }
        
        return true;
    }

    // ==================== 事件绑定 ====================
    
    bindEvents() {
        // 返回按钮
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.goBack());
        }
        
        // 聊天列表按钮
        const searchChatBtn = document.getElementById('searchChatBtn');
        if (searchChatBtn) {
            searchChatBtn.addEventListener('click', () => {
                alert('搜索聊天记录功能开发中...');
            });
        }
        
        const addChatBtn = document.getElementById('addChatBtn');
        if (addChatBtn) {
            addChatBtn.addEventListener('click', () => {
                alert('创建聊天框功能开发中...');
            });
        }
        
        // 好友列表按钮
        const manageGroupBtn = document.getElementById('manageGroupBtn');
        if (manageGroupBtn) {
            manageGroupBtn.addEventListener('click', () => {
                alert('管理分组功能开发中...');
            });
        }
        
        const addFriendBtn = document.getElementById('addFriendBtn');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => {
                alert('添加好友功能开发中...');
            });
        }
        
        // 底部导航
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetPage = btn.getAttribute('data-page');
                this.switchPage(targetPage);
            });
        });
    }

    // ==================== 模块初始化 ====================
    
    initModules() {
        // 初始化好友列表UI
        if (typeof FriendListUI !== 'undefined' && window.friendManager) {
            window.friendListUI = new FriendListUI(friendManager, storageManager);
            console.log('✅ FriendListUI module loaded');
        } else {
            console.warn('⚠️ FriendListUI not loaded');
        }
        
        // TODO: 初始化聊天列表UI
        // TODO: 初始化发现页UI
        // TODO: 初始化个人设置UI
    }

    // ==================== 页面切换 ====================
    
    switchPage(pageId) {
        console.log('Switching to page:', pageId);
        
        // 隐藏所有页面
        document.querySelectorAll('.chat-page').forEach(page => {
            page.classList.remove('active');
        });
        
        // 显示目标页面
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // 更新底部导航
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-page') === pageId) {
                btn.classList.add('active');
            }
        });
        
        // 更新标题和右侧按钮
        this.updateTopBar(pageId);
        
        this.currentPage = pageId;
        
        // 触发页面切换后的操作
        this.onPageChange(pageId);
    }

    // ==================== 更新顶部栏 ====================
    
    updateTopBar(pageId) {
        const titles = {
            'chatListPage': '聊天',
            'friendListPage': '好友',
            'discoverPage': '发现',
            'profilePage': '我'
        };
        
        // 更新标题
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = titles[pageId] || '聊天';
        }
        
        // 隐藏所有按钮
        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.style.display = 'none';
        });
        
        // 根据页面显示对应按钮
        if (pageId === 'chatListPage') {
            // 聊天列表：显示搜索和创建聊天
            document.querySelectorAll('.chat-list-btn').forEach(btn => {
                btn.style.display = 'flex';
            });
        } else if (pageId === 'friendListPage') {
            // 好友列表：显示管理分组和添加好友
            document.querySelectorAll('.friend-list-btn').forEach(btn => {
                btn.style.display = 'flex';
            });
        }
        // 发现页和个人设置：不显示右侧按钮
    }

    // ==================== 页面切换回调 ====================
    
    onPageChange(pageId) {
        // 根据页面执行不同操作
        switch(pageId) {
            case 'chatListPage':
                // TODO: 刷新聊天列表
                break;
                
            case 'friendListPage':
                // 刷新好友列表
                if (window.friendListUI) {
                    // 确保容器存在
                    const container = document.querySelector('#friendListPage .page-content');
                    if (container && !container.classList.contains('friend-list-container')) {
                        container.classList.add('friend-list-container');
                        window.friendListUI.container = container;
                    }
                    window.friendListUI.render();
                }
                break;
                
            case 'discoverPage':
                // TODO: 刷新发现页
                break;
                
            case 'profilePage':
                // TODO: 刷新个人设置
                break;
        }
    }

    // ==================== 返回桌面 ====================
    
    goBack() {
        window.history.back();
    }
}

// ==================== 全局初始化 ====================

// 创建ChatApp实例
const chatApp = new ChatApp();
window.chatApp = chatApp;