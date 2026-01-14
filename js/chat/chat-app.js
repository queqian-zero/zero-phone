/* Chat App - 聊天APP主逻辑 */

class ChatApp {
    constructor() {
        this.currentPage = 'chatListPage';
        this.storage = new StorageManager();
        this.longPressTimer = null;
        this.longPressTriggered = false;
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
            this.testAddFriend();
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
        
        // 如果切换到好友页，渲染好友列表
        if (pageId === 'friendListPage') {
            this.renderFriendList();
        }
        
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
            document.querySelectorAll('.chat-list-btn').forEach(btn => {
                btn.style.display = 'flex';
            });
        } else if (pageId === 'friendListPage') {
            document.querySelectorAll('.friend-list-btn').forEach(btn => {
                btn.style.display = 'flex';
            });
        }
    }
    
    // ==================== 好友列表相关 ====================
    
    // 渲染好友列表
    renderFriendList() {
        const container = document.getElementById('friendListContainer');
        const emptyPlaceholder = document.getElementById('friendEmptyPlaceholder');
        
        // 获取所有好友
        const friends = this.storage.getAllFriends();
        
        // 如果没有好友，显示空状态
        if (friends.length === 0) {
            container.innerHTML = '';
            emptyPlaceholder.style.display = 'flex';
            return;
        }
        
        // 隐藏空状态
        emptyPlaceholder.style.display = 'none';
        
        // 生成好友卡片HTML
        container.innerHTML = friends.map(friend => this.createFriendCard(friend)).join('');
        
        // 绑定事件
        this.bindFriendCardEvents();
    }
    
    // 创建好友卡片HTML
    createFriendCard(friend) {
        // 显示的名字（优先备注，其次网名）
        const displayName = friend.nickname || friend.name;
        
        // 头像（如果没有就显示首字母）
        const avatarContent = friend.avatar 
            ? `<img src="${friend.avatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` 
            : friend.name.charAt(0);
        
        return `
            <div class="friend-item" data-code="${friend.code}">
                <div class="friend-avatar">${avatarContent}</div>
                <div class="friend-info">
                    <div class="friend-name-row">
                        <span class="friend-name">${displayName}</span>
                        ${friend.nickname ? `<span class="friend-nickname">(${friend.name})</span>` : ''}
                    </div>
                    <div class="friend-signature">${friend.signature || '这个人很懒，什么都没留下...'}</div>
                </div>
                <span class="friend-code">${friend.code}</span>
            </div>
        `;
    }
    
    // 绑定好友卡片事件
    bindFriendCardEvents() {
        const friendItems = document.querySelectorAll('.friend-item');
        
        friendItems.forEach(item => {
            const code = item.getAttribute('data-code');
            
            // 触摸开始
            item.addEventListener('touchstart', (e) => {
                this.longPressTriggered = false;
                
                // 添加长按效果
                item.classList.add('long-pressing');
                
                // 设置长按定时器（500ms）
                this.longPressTimer = setTimeout(() => {
                    this.longPressTriggered = true;
                    this.onFriendLongPress(code);
                    
                    // 震动反馈
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                }, 500);
            });
            
            // 触摸结束
            item.addEventListener('touchend', (e) => {
                // 移除长按效果
                item.classList.remove('long-pressing');
                
                // 清除定时器
                clearTimeout(this.longPressTimer);
                
                // 如果没有触发长按，就是普通点击
                if (!this.longPressTriggered) {
                    this.onFriendClick(code);
                }
            });
            
            // 触摸取消（比如滑动离开）
            item.addEventListener('touchcancel', (e) => {
                item.classList.remove('long-pressing');
                clearTimeout(this.longPressTimer);
            });
        });
    }
    
    // 点击好友卡片
    onFriendClick(code) {
        const friend = this.storage.getFriendByCode(code);
        alert(`点击好友：${friend.name}\n\n准备跳转到聊天界面...`);
        // TODO: 跳转到聊天界面
    }
    
    // 长按好友卡片
    onFriendLongPress(code) {
        const friend = this.storage.getFriendByCode(code);
        alert(`长按好友：${friend.name}\n\n准备进入人设编辑界面...`);
        // TODO: 打开人设编辑弹窗
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
            // 重新渲染好友列表
            this.renderFriendList();
            
            // 获取所有好友
            const allFriends = this.storage.getAllFriends();
            
            // 显示结果
            alert(
                '✅ 添加成功！\n\n' +
                '编码: ' + testFriend.code + '\n' +
                '名字: ' + testFriend.name + '\n\n' +
                '当前好友总数: ' + allFriends.length
            );
        } else {
            alert('❌ 添加失败！');
        }
    }
}

// 初始化
const chatApp = new ChatApp();