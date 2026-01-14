/* Chat App - 聊天APP主逻辑 */

class ChatApp {
    constructor() {
        this.currentPage = 'chatListPage';
        this.storage = new StorageManager();  // ← 新增这行
        this.init();
    }
    
    init() {
        // 绑定返回按钮
        document.getElementById('backBtn').addEventListener('click', () => {
            this.goBack();
        });
        
        // ===== 聊天列表按钮 =====
        document.getElementById('searchChatBtn').addEventListener('click', () => {
            alert('搜索聊天记录功能开发中...');
        });
        
        document.getElementById('addChatBtn').addEventListener('click', () => {
            alert('创建聊天框功能开发中...');
        });
        
        // ===== 好友列表按钮 =====
        document.getElementById('manageGroupBtn').addEventListener('click', () => {
            alert('管理分组功能开发中...');
        });
        
        document.getElementById('addFriendBtn').addEventListener('click', () => {
    this.testAddFriend();  // ← 改成调用测试方法
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
        
        // 更新标题和右侧按钮
        this.updateTopBar(pageId);
        
        this.currentPage = pageId;
    }
    
    // 更新顶部导航栏
    updateTopBar(pageId) {
        const titles = {
            'chatListPage': '聊天',
            'friendListPage': '好友',
            'discoverPage': '发现',
            'profilePage': '我'
        };
        
        // 更新标题
        document.getElementById('pageTitle').textContent = titles[pageId];
        
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
    
    // 返回桌面
    goBack() {
        window.history.back();
    }
    // ===== 测试方法（临时） =====
    testAddFriend() {
        // 生成测试好友
        const testFriend = {
            code: 'TEST_2k25_' + Math.random().toString(36).substr(2, 3).toUpperCase() + '#',
            name: '测试好友_' + Date.now().toString().substr(-4),
            realName: '',
            nickname: '',
            avatar: '',
            persona: '这是一个测试好友',
            poke: '戳了戳你',
            signature: 'Hello World',
            groupId: 'default',
            addedTime: new Date().toISOString().split('T')[0],
            addedFrom: 'friend_code',
            canSeeMyMoments: true,
            seeTAMoments: true,
            currentOutfit: '',
            currentAction: '',
            currentMood: '',
            currentLocation: '',
            enableAvatarRecognition: true
        };
        
        // 保存到存储
        const success = this.storage.addFriend(testFriend);
        
        if (success) {
            // 获取所有好友
            const allFriends = this.storage.getAllFriends();
            
            // 显示结果
            alert(
                '✅ 添加成功！\n\n' +
                '编码: ' + testFriend.code + '\n' +
                '名字: ' + testFriend.name + '\n\n' +
                '当前好友总数: ' + allFriends.length + '\n\n' +
                '刷新页面再点一次，看看数据还在不在！'
            );
            
            console.log('所有好友:', allFriends);
        } else {
            alert('❌ 添加失败！');
        }
    }
}

// 初始化
const chatApp = new ChatApp();