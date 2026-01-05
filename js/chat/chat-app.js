/* Chat App - 聊天APP主逻辑 */

class ChatApp {
    constructor() {
        this.currentPage = 'chatListPage';
        this.init();
    }
    
    init() {
        // 绑定返回按钮
        document.getElementById('backBtn').addEventListener('click', () => {
            this.goBack();
        });
        
        // 绑定搜索按钮
        document.getElementById('searchBtn').addEventListener('click', () => {
            alert('搜索功能开发中...');
        });
        
        // 绑定新建聊天按钮
        document.getElementById('addChatBtn').addEventListener('click', () => {
            alert('新建聊天功能开发中...');
        });
        
        // 绑定底部导航
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetPage = btn.getAttribute('data-page');
                this.switchPage(targetPage);
            });
        });
        
        console.log('✅ 聊天APP初始化完成');
    }
    
    // 切换页面
    switchPage(pageId) {
        // 隐藏所有页面
        document.querySelectorAll('.chat-page').forEach(page => {
            page.classList.remove('active');
        });
        
        // 显示目标页面
        document.getElementById(pageId).classList.add('active');
        
        // 更新底部导航
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-page') === pageId) {
                btn.classList.add('active');
            }
        });
        
        // 更新标题
        const titles = {
            'chatListPage': '聊天',
            'friendListPage': '好友',
            'discoverPage': '发现',
            'profilePage': '我'
        };
        document.getElementById('pageTitle').textContent = titles[pageId];
        
        this.currentPage = pageId;
    }
    
    // 返回桌面（不触发锁屏）
    goBack() {
        // 直接跳转回主页面，不刷新
        window.history.back();
    }
}

// 初始化
const chatApp = new ChatApp();