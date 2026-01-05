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
            alert('添加好友功能开发中...');
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
}

// 初始化
const chatApp = new ChatApp();

// ===== 好友列表功能 =====

// 切换分组展开/折叠
function toggleGroup(groupHeader) {
    const group = groupHeader.parentElement;
    group.classList.toggle('expanded');
}

// 加载好友列表
function loadFriendList() {
    const friends = JSON.parse(localStorage.getItem('friends') || '[]');
    
    if (friends.length === 0) {
        return; // 保持默认的"暂无好友"提示
    }
    
    // 按分组整理好友
    const groups = {};
    friends.forEach(friend => {
        const groupName = friend.group || '我的好友';
        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        groups[groupName].push(friend);
    });
    
    // 渲染分组和好友
    const container = document.getElementById('friendGroups');
    container.innerHTML = '';
    
    Object.keys(groups).forEach(groupName => {
        const groupFriends = groups[groupName];
        const groupHtml = createGroupHtml(groupName, groupFriends);
        container.innerHTML += groupHtml;
    });
    
    // 默认展开所有分组
    document.querySelectorAll('.friend-group').forEach(group => {
        group.classList.add('expanded');
    });
}

// 创建分组HTML
function createGroupHtml(groupName, friends) {
    const membersHtml = friends.map(friend => `
        <div class="friend-card" onclick="openFriendProfile('${friend.friendCode}')">
            <div class="friend-avatar">
                ${friend.avatar ? `<img src="${friend.avatar}" alt="${friend.nickname}">` : '👤'}
            </div>
            <div class="friend-info">
                <div class="friend-name">${friend.remark || friend.nickname}</div>
                <div class="friend-signature">${friend.signature || '这个人很懒，什么都没写...'}</div>
            </div>
        </div>
    `).join('');
    
    return `
        <div class="friend-group">
            <div class="group-header" onclick="toggleGroup(this)">
                <span class="group-arrow">▶</span>
                <span class="group-name">${groupName}</span>
                <span class="group-count">(${friends.length})</span>
            </div>
            <div class="group-members">
                ${membersHtml}
            </div>
        </div>
    `;
}

// 打开好友资料页面
function openFriendProfile(friendCode) {
    alert(`打开好友资料：${friendCode}\n\n（人设编辑页面开发中...）`);
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    loadFriendList();
});