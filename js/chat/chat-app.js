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
            if (window.chatInterface?.currentFriendCode) {
                window.chatInterface.openSearchPanel();
            } else {
                // 没有打开任何聊天，提示先进入
                if (window.chatInterface?.showCssToast) {
                    window.chatInterface.showCssToast('请先进入一个聊天再搜索');
                } else {
                    alert('请先进入一个聊天界面，然后在聊天设置中搜索');
                }
            }
        });
        
        document.getElementById('addChatBtn').addEventListener('click', () => {
    this.openCreateChatModal();
});
        
        // ===== 好友列表按钮 =====
        document.getElementById('manageGroupBtn').addEventListener('click', () => {
            try { this.openGroupManager(); } catch(e) { console.error('分组管理错误:', e); alert('分组管理出错: ' + e.message); }
        });
        
        document.getElementById('addFriendBtn').addEventListener('click', () => {
    this.openAddFriendChoice();
});
        
        // 绑定底部导航
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetPage = btn.getAttribute('data-page');
                this.switchPage(targetPage);
            });
        });
        
        // 初始化时渲染聊天列表（修复：退掉后台重进后消息条目不显示的bug）
        this.renderChatList();
        
        // IDB异步加载完成后重新渲染（防止数据延迟加载导致显示空白）
        window.addEventListener('storage-ready', () => {
            console.log('📦 IDB数据就绪，重新渲染列表');
            this.renderChatList();
            if (this.currentPage === 'friendListPage') {
                this.renderFriendList();
            }
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

// 如果切换到聊天列表页，渲染聊天列表
if (pageId === 'chatListPage') {
    this.renderChatList();
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
        
        const allFriends = this.storage.getAllFriends();
        const friends = allFriends.filter(f => !f.blacklisted);
        const blacklistedCount = allFriends.filter(f => f.blacklisted).length;
        
        if (friends.length === 0 && blacklistedCount === 0) {
            container.innerHTML = '';
            emptyPlaceholder.style.display = 'flex';
            return;
        }
        emptyPlaceholder.style.display = 'none';
        
        // 获取分组
        const userSettings = this.storage.getUserSettings();
        const groups = userSettings.friendGroups || [];
        const hasGroups = groups.length > 0;
        
        let html = '';
        
        if (hasGroups) {
            // 按分组显示
            const sortedGroups = [...groups].sort((a,b) => (a.order||0) - (b.order||0));
            // 加一个"未分组"
            const allGroupIds = groups.map(g => g.id);
            const ungrouped = friends.filter(f => !f.groupId || !allGroupIds.includes(f.groupId));
            
            sortedGroups.forEach(g => {
                const groupFriends = friends.filter(f => f.groupId === g.id);
                if (groupFriends.length === 0) return;
                html += '<div class="friend-group-section">';
                html += '<div class="friend-group-header" data-gid="'+g.id+'">';
                html += '<span class="friend-group-arrow">▼</span>';
                html += '<span>'+this._esc(g.name)+'</span>';
                html += '<span style="color:rgba(255,255,255,0.15);font-size:12px;">'+groupFriends.length+'</span>';
                html += '</div>';
                html += '<div class="friend-group-body">';
                groupFriends.forEach(f => { html += this.createFriendCard(f); });
                html += '</div></div>';
            });
            
            if (ungrouped.length > 0) {
                html += '<div class="friend-group-section">';
                html += '<div class="friend-group-header" data-gid="_ungrouped">';
                html += '<span class="friend-group-arrow">▼</span>';
                html += '<span>未分组</span>';
                html += '<span style="color:rgba(255,255,255,0.15);font-size:12px;">'+ungrouped.length+'</span>';
                html += '</div>';
                html += '<div class="friend-group-body">';
                ungrouped.forEach(f => { html += this.createFriendCard(f); });
                html += '</div></div>';
            }
        } else {
            // 无分组，直接列表
            html = friends.map(friend => this.createFriendCard(friend)).join('');
        }
        
        if (blacklistedCount > 0) {
            html += '<div class="friend-blacklist-entry" id="friendBlacklistEntry"><span style="color:rgba(255,100,100,0.5);font-size:13px;">🚫 黑名单</span><span style="color:rgba(255,255,255,0.2);font-size:12px;">'+blacklistedCount+'人</span><span style="color:rgba(255,255,255,0.1);font-size:12px;">›</span></div>';
        }
        container.innerHTML = html;
        this.bindFriendCardEvents();
        
        // 分组折叠/展开
        container.querySelectorAll('.friend-group-header').forEach(h => {
            h.addEventListener('click', () => {
                const body = h.nextElementSibling;
                const arrow = h.querySelector('.friend-group-arrow');
                if (body.style.display === 'none') {
                    body.style.display = '';
                    if (arrow) arrow.style.transform = '';
                } else {
                    body.style.display = 'none';
                    if (arrow) arrow.style.transform = 'rotate(-90deg)';
                }
            });
        });
        
        document.getElementById('friendBlacklistEntry')?.addEventListener('click', () => {
            if (window.friendProfile) window.friendProfile.openBlacklistPage();
        });
    }
    
    _esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    
    // 管理分组页面
    openGroupManager() {
        document.getElementById('groupManagerPage')?.remove();
        const store = this.storage;
        const userSettings = store.getUserSettings();
        if (!userSettings.friendGroups) userSettings.friendGroups = [];
        const groups = userSettings.friendGroups;
        const friends = store.getAllFriends().filter(f => !f.blacklisted);
        const save = () => { store.saveData('zero_phone_user_settings', userSettings); };
        
        const page = document.createElement('div');
        page.id = 'groupManagerPage';
        page.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:8000;background:#111;display:flex;flex-direction:column;';
        
        const render = () => {
            let groupsHtml = '';
            groups.sort((a,b) => (a.order||0) - (b.order||0)).forEach((g, i) => {
                const count = friends.filter(f => f.groupId === g.id).length;
                groupsHtml += '<div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.03);">';
                groupsHtml += '<div style="flex:1;font-size:15px;color:rgba(255,255,255,0.6);">'+this._esc(g.name)+' <span style="color:rgba(255,255,255,0.15);font-size:12px;">'+count+'人</span></div>';
                groupsHtml += '<button class="gm-rename" data-gid="'+g.id+'" style="background:none;border:none;color:rgba(255,255,255,0.2);font-size:13px;cursor:pointer;padding:4px 8px;">改名</button>';
                groupsHtml += '<button class="gm-del" data-gid="'+g.id+'" style="background:none;border:none;color:rgba(255,100,100,0.3);font-size:13px;cursor:pointer;padding:4px 8px;">删除</button>';
                groupsHtml += '</div>';
            });
            if (!groups.length) groupsHtml = '<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.1);font-size:14px;">暂无分组，点上方"+"添加</div>';
            
            let friendsHtml = '';
            friends.forEach(f => {
                const gName = groups.find(g => g.id === f.groupId)?.name || '未分组';
                friendsHtml += '<div style="display:flex;align-items:center;gap:10px;padding:11px 16px;border-bottom:1px solid rgba(255,255,255,0.02);cursor:pointer;" class="gm-friend" data-code="'+f.code+'">';
                const av = f.avatar ? '<img src="'+this._esc(f.avatar)+'" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">' : '<div style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:14px;color:rgba(255,255,255,0.3);">'+this._esc((f.nickname||f.name||'?').charAt(0))+'</div>';
                friendsHtml += av;
                friendsHtml += '<div style="font-size:15px;color:rgba(255,255,255,0.5);flex:1;">'+this._esc(f.nickname||f.name)+'</div>';
                friendsHtml += '<div style="font-size:12px;color:rgba(240,147,43,0.5);padding:4px 10px;border:1px solid rgba(240,147,43,0.15);border-radius:8px;">'+this._esc(gName)+'</div>';
                friendsHtml += '</div>';
            });
            
            page.innerHTML =
                '<div style="height:60px;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,0,0,0.1);display:flex;align-items:center;padding:0 16px;flex-shrink:0;box-shadow:0 2px 10px rgba(0,0,0,0.05);">' +
                    '<button id="gmBack" style="width:40px;height:40px;border:none;background:rgba(0,0,0,0.05);border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:rgba(0,0,0,0.6);">&#8592;</button>' +
                    '<div style="flex:1;text-align:center;font-size:18px;font-weight:600;color:#000;">管理分组</div>' +
                    '<button id="gmAdd" style="width:40px;height:40px;border:none;background:rgba(0,0,0,0.05);border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:rgba(0,0,0,0.5);">+</button>' +
                '</div>' +
                '<div style="flex:1;overflow-y:auto;">' +
                    '<div style="padding:14px 16px 8px;font-size:14px;color:rgba(255,255,255,0.2);font-weight:600;">分组列表</div>' +
                    groupsHtml +
                    '<div style="padding:18px 16px 8px;font-size:14px;color:rgba(255,255,255,0.2);font-weight:600;">好友归属（点击切换分组）</div>' +
                    friendsHtml +
                '</div>';
            
            page.querySelector('#gmBack')?.addEventListener('click', () => { page.remove(); this.renderFriendList(); });
            page.querySelector('#gmAdd')?.addEventListener('click', async () => {
                const ml = window.memoryLibrary;
                const name = ml ? await ml._zpInput('新建分组', '输入分组名称') : prompt('分组名称：');
                if (!name?.trim()) return;
                groups.push({ id: 'g_' + Date.now(), name: name.trim(), order: groups.length });
                save(); render();
            });
            page.querySelectorAll('.gm-rename').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const g = groups.find(x => x.id === btn.dataset.gid); if (!g) return;
                    const ml = window.memoryLibrary;
                    const nn = ml ? await ml._zpInput('重命名分组', '', g.name) : prompt('新名称：', g.name);
                    if (nn !== null && nn.trim()) { g.name = nn.trim(); save(); render(); }
                });
            });
            page.querySelectorAll('.gm-del').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const g = groups.find(x => x.id === btn.dataset.gid); if (!g) return;
                    const ml = window.memoryLibrary;
                    const ok = ml ? await ml._zpConfirm('删除分组', '删除「'+g.name+'」？分组内好友将变为未分组') : confirm('删除？');
                    if (ok) {
                        friends.filter(f => f.groupId === g.id).forEach(f => { f.groupId = ''; store.updateFriend(f.code, { groupId: '' }); });
                        userSettings.friendGroups = groups.filter(x => x.id !== g.id);
                        save(); render();
                    }
                });
            });
            page.querySelectorAll('.gm-friend').forEach(el => {
                el.addEventListener('click', async () => {
                    const f = friends.find(x => x.code === el.dataset.code); if (!f) return;
                    const ml = window.memoryLibrary;
                    const opts = groups.map(g => ({ label: g.name, value: g.id }));
                    opts.push({ label: '未分组', value: '' });
                    const pick = ml ? await ml._zpMenu(f.nickname||f.name, '选择分组', opts) : null;
                    if (pick !== null) { f.groupId = pick; store.updateFriend(f.code, { groupId: pick }); save(); render(); }
                });
            });
        };
        
        document.body.appendChild(page);
        render();
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
        
        // 跳转到聊天界面
        this.openChatInterface(code);
    }
    
    // 打开聊天界面
    openChatInterface(friendCode) {
        // 检查这个好友是否被从消息列表隐藏了
        const chatSettings = this.storage.getChatSettings(friendCode) || {};
        if (chatSettings.hiddenFromChatList) {
            const friend = this.storage.getFriendByCode(friendCode);
            const displayName = friend?.nickname || friend?.name || '该好友';
            if (confirm(`「${displayName}」的消息条已从消息列表中移除。\n\n要把消息条添加回消息列表吗？`)) {
                chatSettings.hiddenFromChatList = false;
                this.storage.saveChatSettings(friendCode, chatSettings);
            }
        }
        
        // 隐藏底部导航和顶部导航
        document.querySelector('.bottom-nav').style.display = 'none';
        document.querySelector('.top-bar').style.display = 'none';
        
        // 切换到聊天界面页（先让页面出来）
        this.switchPage('chatInterfacePage');
        
        // 初始化聊天界面
        if (!window.chatInterface) {
            window.chatInterface = new ChatInterface(this);
        }
        
        // 延迟到下一帧再加载聊天数据（让页面切换动画先完成，不卡）
        requestAnimationFrame(() => {
            window.chatInterface.loadChat(friendCode);
            
            // 返回时刷新聊天列表
            window.chatInterface._onBackCallback = () => {
                this.renderChatList();
            };
        });
    }
    
    // 长按好友卡片
    onFriendLongPress(code) {
        this.openEditModal(code);
    }
    
    // 返回桌面
    goBack() {
        window.history.back();
    }
    
    // ==================== 聊天列表相关 ====================

renderChatList() {
    const container = document.getElementById('chatListContainer');
    const empty = document.getElementById('chatListEmpty');
    if (!container) return;

    const friends = this.storage.getAllFriends();
    const allChats = this.storage.getChats();

    // 只渲染有聊天记录的好友（有messages数组且非空）
    let chatItems = [];
    for (const friend of friends) {
        const chat = allChats.find(c => c.friendCode === friend.code);
        const lastMsg = chat?.messages?.length
            ? chat.messages[chat.messages.length - 1]
            : null;
        chatItems.push({ friend, chat, lastMsg });
    }

    // 过滤掉完全没有消息的（没聊过的好友不显示在聊天列表）
    // 同时过滤掉被用户主动隐藏的
    chatItems = chatItems.filter(item => {
        if (!item.lastMsg) return false;
        const settings = this.storage.getChatSettings(item.friend.code) || {};
        if (settings.hiddenFromChatList) return false;
        return true;
    });

    if (chatItems.length === 0) {
        container.innerHTML = '';
        if (empty) empty.style.display = 'flex';
        return;
    }

    if (empty) empty.style.display = 'none';

    // 排序：置顶在前，其余按最后消息时间倒序
    const getSettings = (code) => this.storage.getChatSettings(code) || {};

    chatItems.sort((a, b) => {
        const aPinned = getSettings(a.friend.code).chatPin || false;
        const bPinned = getSettings(b.friend.code).chatPin || false;
        if (aPinned !== bPinned) return aPinned ? -1 : 1;
        const aTime = a.lastMsg?.timestamp || 0;
        const bTime = b.lastMsg?.timestamp || 0;
        return new Date(bTime) - new Date(aTime);
    });

    container.innerHTML = chatItems.map(item => this.createChatListItem(item)).join('');

    // 绑定点击 + 长按事件
    container.querySelectorAll('.chat-list-item').forEach(el => {
        const code = el.getAttribute('data-code');
        let longPressTimer = null;
        let longPressTriggered = false;
        
        el.addEventListener('touchstart', () => {
            longPressTriggered = false;
            el.classList.add('long-pressing');
            longPressTimer = setTimeout(() => {
                longPressTriggered = true;
                if (navigator.vibrate) navigator.vibrate(50);
                this.showChatListContextMenu(code);
            }, 500);
        });
        
        el.addEventListener('touchend', () => {
            el.classList.remove('long-pressing');
            clearTimeout(longPressTimer);
            if (!longPressTriggered) {
                this.openChatInterface(code);
            }
        });
        
        el.addEventListener('touchcancel', () => {
            el.classList.remove('long-pressing');
            clearTimeout(longPressTimer);
        });
    });
}

// ==================== 聊天列表长按菜单 ====================

showChatListContextMenu(friendCode) {
    console.log('📋 显示聊天列表长按菜单:', friendCode);
    
    // 移除旧菜单
    const old = document.getElementById('chatListContextMenu');
    if (old) old.remove();
    
    const friend = this.storage.getFriendByCode(friendCode);
    const displayName = friend?.nickname || friend?.name || '未知';
    const settings = this.storage.getChatSettings(friendCode) || {};
    const isPinned = settings.chatPin || false;
    
    const menu = document.createElement('div');
    menu.id = 'chatListContextMenu';
    menu.style.cssText = `
        position: fixed; top:0; left:0; right:0; bottom:0;
        z-index: 9999; display:flex; align-items:flex-end; justify-content:center;
    `;
    menu.innerHTML = `
        <div id="chatListCtxOverlay" style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);"></div>
        <div style="position:relative;z-index:1;width:100%;background:#1a1a1a;border-radius:16px 16px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom));animation:ctxSlideUp 0.25s ease-out;">
            <div style="text-align:center;font-size:15px;font-weight:600;color:#fff;margin-bottom:16px;">${this.escapeHtml(displayName)}</div>
            <button class="ctx-btn" id="ctxPinChat" style="width:100%;padding:14px;margin-bottom:8px;border:none;border-radius:10px;background:rgba(255,255,255,0.08);color:#fff;font-size:14px;cursor:pointer;">
                ${isPinned ? '📌 取消置顶' : '📌 置顶聊天'}
            </button>
            <button class="ctx-btn" id="ctxDeleteChat" style="width:100%;padding:14px;margin-bottom:8px;border:none;border-radius:10px;background:rgba(255,255,255,0.08);color:#ff6b6b;font-size:14px;cursor:pointer;">
                🗑️ 删除消息条
            </button>
            <button class="ctx-btn" id="ctxCancel" style="width:100%;padding:14px;border:none;border-radius:10px;background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.5);font-size:14px;cursor:pointer;">
                取消
            </button>
        </div>
    `;
    
    // 动画
    if (!document.getElementById('ctxSlideUpAnim')) {
        const style = document.createElement('style');
        style.id = 'ctxSlideUpAnim';
        style.textContent = `@keyframes ctxSlideUp { from{transform:translateY(100%);} to{transform:translateY(0);} }`;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(menu);
    
    // 事件
    document.getElementById('chatListCtxOverlay').addEventListener('click', () => menu.remove());
    document.getElementById('ctxCancel').addEventListener('click', () => menu.remove());
    
    document.getElementById('ctxPinChat').addEventListener('click', () => {
        menu.remove();
        this.toggleChatPin(friendCode);
    });
    
    document.getElementById('ctxDeleteChat').addEventListener('click', () => {
        menu.remove();
        this.showDeleteChatOptions(friendCode, displayName);
    });
}

// 切换置顶
toggleChatPin(friendCode) {
    const settings = this.storage.getChatSettings(friendCode) || {};
    settings.chatPin = !settings.chatPin;
    this.storage.saveChatSettings(friendCode, settings);
    console.log('📌 聊天置顶:', settings.chatPin);
    this.renderChatList();
}

// 删除消息条选项
showDeleteChatOptions(friendCode, displayName) {
    const old = document.getElementById('chatDeleteOptions');
    if (old) old.remove();
    
    const menu = document.createElement('div');
    menu.id = 'chatDeleteOptions';
    menu.style.cssText = `
        position: fixed; top:0; left:0; right:0; bottom:0;
        z-index: 9999; display:flex; align-items:center; justify-content:center;
    `;
    menu.innerHTML = `
        <div id="chatDelOverlay" style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);"></div>
        <div style="position:relative;z-index:1;width:85%;max-width:320px;background:#1a1a1a;border-radius:16px;padding:24px 20px;text-align:center;">
            <div style="font-size:15px;font-weight:600;color:#fff;margin-bottom:6px;">删除「${this.escapeHtml(displayName)}」的消息条</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:20px;">从消息列表中移除</div>
            <button id="chatDelKeepRecords" style="width:100%;padding:13px;margin-bottom:8px;border:none;border-radius:10px;background:rgba(255,255,255,0.08);color:#fff;font-size:14px;cursor:pointer;">
                仅移除消息条（保留聊天记录）
            </button>
            <button id="chatDelClearAll" style="width:100%;padding:13px;margin-bottom:12px;border:none;border-radius:10px;background:rgba(255,60,60,0.15);color:#ff6b6b;font-size:14px;cursor:pointer;">
                清空聊天记录 + 移除消息条
            </button>
            <button id="chatDelCancel" style="width:100%;padding:13px;border:none;border-radius:10px;background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.5);font-size:14px;cursor:pointer;">
                取消
            </button>
        </div>
    `;
    
    document.body.appendChild(menu);
    
    document.getElementById('chatDelOverlay').addEventListener('click', () => menu.remove());
    document.getElementById('chatDelCancel').addEventListener('click', () => menu.remove());
    
    // 仅移除消息条（不删聊天记录）
    document.getElementById('chatDelKeepRecords').addEventListener('click', () => {
        menu.remove();
        const settings = this.storage.getChatSettings(friendCode) || {};
        settings.hiddenFromChatList = true;
        this.storage.saveChatSettings(friendCode, settings);
        console.log('🗑️ 消息条已隐藏（保留记录）:', friendCode);
        this.renderChatList();
    });
    
    // 清空聊天记录 + 移除消息条
    document.getElementById('chatDelClearAll').addEventListener('click', () => {
        menu.remove();
        if (!confirm('⚠️ 确定要清空聊天记录吗？此操作不可撤销！')) return;
        this.storage.deleteChat(friendCode);
        const settings = this.storage.getChatSettings(friendCode) || {};
        settings.hiddenFromChatList = true;
        this.storage.saveChatSettings(friendCode, settings);
        console.log('🗑️ 聊天记录已清空 + 消息条已隐藏:', friendCode);
        this.renderChatList();
    });
}

createChatListItem({ friend, lastMsg }) {
    const displayName = friend.nickname || friend.name;
    const settings = this.storage.getChatSettings(friend.code) || {};
    const pinned = settings.chatPin ? 'pinned' : '';

    const avatarContent = friend.avatar
        ? `<img src="${friend.avatar}" alt="">`
        : friend.name.charAt(0);

    // 最后消息预览
    let preview = '还没有消息';
    if (lastMsg) {
        const prefix = lastMsg.type === 'user' ? '我：' : '';
        const text = (lastMsg.text || '').replace(/\n/g, ' ');
        preview = prefix + (text.length > 30 ? text.substring(0, 30) + '…' : text);
    }

    // 时间显示
    const timeStr = lastMsg?.timestamp ? this.formatChatListTime(new Date(lastMsg.timestamp)) : '';
    
    // 火花图标
    const flameHtml = this.getChatListFlameIcon(friend.code, settings, friend);

    return `
        <div class="chat-list-item ${pinned}" data-code="${friend.code}">
            <div class="chat-list-avatar">${avatarContent}</div>
            <div class="chat-list-info">
                <div class="chat-list-name-row">
                    <span class="chat-list-name">${displayName}${flameHtml}</span>
                    <span class="chat-list-time">${timeStr}</span>
                </div>
                <div class="chat-list-preview">${this.escapeHtml(preview)}</div>
            </div>
        </div>`;
}

// 获取聊天列表中的火花图标
getChatListFlameIcon(friendCode, settings, friend) {
    if (settings.flameEnabled === false) return '';
    
    const flameIconVal = settings.flameCustomIcon || '🔥';
    const deadIconVal = settings.flameCustomDeadIcon || '💔';
    const flameIsImg = settings.flameCustomIconType === 'image';
    const deadIsImg = settings.flameCustomDeadIconType === 'image';
    const extinguishDays = settings.flameExtinguishDays ?? 3;
    
    const renderIcon = (val, isImg) => {
        if (isImg && val) return `<img src="${val}" style="width:14px;height:14px;object-fit:contain;vertical-align:middle;">`;
        return val;
    };
    
    const startStr = settings.flameStartDate || friend?.addedTime || new Date().toISOString().split('T')[0];
    const startDate = new Date(startStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    startDate.setHours(0,0,0,0);
    
    const lastChatStr = settings.flameLastChatDate || '';
    const lastChatDate = lastChatStr ? new Date(lastChatStr) : null;
    if (lastChatDate) lastChatDate.setHours(0,0,0,0);
    
    const totalDays = Math.floor((today - startDate) / 86400000);
    
    if (extinguishDays === 0) {
        return ` <span class="chat-list-flame">${renderIcon(flameIconVal, flameIsImg)}</span>`;
    }
    
    const daysSinceChat = lastChatDate ? Math.floor((today - lastChatDate) / 86400000) : totalDays;
    
    if (daysSinceChat <= extinguishDays) {
        // 火花还在（含即将熄灭）
        return ` <span class="chat-list-flame">${renderIcon(flameIconVal, flameIsImg)}</span>`;
    }
    
    // 火花熄灭
    const deadDays = daysSinceChat - extinguishDays;
    if (deadDays >= 3) return '';
    return ` <span class="chat-list-flame">${renderIcon(deadIconVal, deadIsImg)}</span>`;
}

// 聊天列表时间格式化
formatChatListTime(date) {
    const now = new Date();
    const diff = now - date;
    const oneDay = 86400000;

    const pad = n => String(n).padStart(2, '0');

    if (diff < oneDay && date.getDate() === now.getDate()) {
        // 今天：显示 HH:mm
        return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    } else if (diff < 2 * oneDay && (now.getDate() - date.getDate() === 1)) {
        return '昨天';
    } else if (date.getFullYear() === now.getFullYear()) {
        // 今年：显示 M/D
        return `${date.getMonth() + 1}/${date.getDate()}`;
    } else {
        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    }
}

escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ==================== 创建聊天弹窗 ====================

openCreateChatModal() {
    const modal = document.getElementById('createChatModal');
    if (!modal) return;

    const body = document.getElementById('createChatBody');
    const friends = this.storage.getAllFriends();
    const allChats = this.storage.getChats();

    if (friends.length === 0) {
        body.innerHTML = `<div class="create-chat-empty">还没有好友<br>先去好友页添加一个吧</div>`;
    } else {
        body.innerHTML = friends.map(friend => {
            const hasChat = allChats.some(c => c.friendCode === friend.code && c.messages?.length > 0);
            const displayName = friend.nickname || friend.name;
            const avatarContent = friend.avatar
                ? `<img src="${friend.avatar}" alt="">`
                : friend.name.charAt(0);
            const tag = hasChat ? `<span class="create-chat-existing-tag">已有聊天</span>` : '';

            return `
                <div class="create-chat-friend-item" data-code="${friend.code}">
                    <div class="create-chat-friend-avatar">${avatarContent}</div>
                    <div class="create-chat-friend-info">
                        <div class="create-chat-friend-name">${displayName}</div>
                        <div class="create-chat-friend-sig">${friend.signature || '没有个性签名'}</div>
                    </div>
                    ${tag}
                </div>`;
        }).join('');

        body.querySelectorAll('.create-chat-friend-item').forEach(el => {
            el.addEventListener('click', () => {
                this.closeCreateChatModal();
                this.openChatInterface(el.getAttribute('data-code'));
            });
        });
    }

    modal.style.display = 'flex';

    if (!this.createChatEventsBound) {
        this.bindCreateChatEvents();
        this.createChatEventsBound = true;
    }
}

closeCreateChatModal() {
    const modal = document.getElementById('createChatModal');
    if (modal) modal.style.display = 'none';
}

bindCreateChatEvents() {
    const closeBtn = document.getElementById('createChatClose');
    const overlay = document.getElementById('createChatOverlay');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeCreateChatModal());
    if (overlay) overlay.addEventListener('click', () => this.closeCreateChatModal());
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
    
    // ==================== 人设编辑相关 ====================
    
    // 打开编辑弹窗
    openEditModal(code) {
        const friend = this.storage.getFriendByCode(code);
        if (!friend) {
            alert('❌ 找不到好友数据');
            return;
        }
        
        // 保存当前编辑的好友编码
        this.currentEditingCode = code;
        
        // 填充表单数据
        document.getElementById('editRealName').value = friend.realName || '';
        document.getElementById('editName').value = friend.name || '';
        document.getElementById('editNickname').value = friend.nickname || '';
        document.getElementById('editSignature').value = friend.signature || '';
        document.getElementById('editPersona').value = friend.persona || '';
        document.getElementById('editPoke').value = friend.poke || '';
        document.getElementById('avatarRecognitionSwitch').checked = friend.enableAvatarRecognition !== false;
        
        // 设置头像预览
        const avatarPreview = document.getElementById('avatarPreview');
        if (friend.avatar) {
            avatarPreview.innerHTML = `<img src="${friend.avatar}" alt="头像">`;
        } else {
            avatarPreview.innerHTML = `<span id="avatarPlaceholder">${friend.name.charAt(0)}</span>`;
        }
        
        // 显示弹窗
        document.getElementById('editFriendModal').style.display = 'flex';
        
        // 绑定事件（只绑定一次）
        if (!this.editModalBound) {
            this.bindEditModalEvents();
            this.editModalBound = true;
        }
    }
    
    // 绑定编辑弹窗事件
    bindEditModalEvents() {
        // 关闭按钮
        document.getElementById('closeEditModal').addEventListener('click', () => {
            this.closeEditModal();
        });
        
        // 点击遮罩关闭
        document.getElementById('editFriendModal').addEventListener('click', (e) => {
            if (e.target.id === 'editFriendModal') {
                this.closeEditModal();
            }
        });
        
        // 头像上传
        document.getElementById('avatarUploadArea').addEventListener('click', () => {
            document.getElementById('avatarInput').click();
        });
        
        document.getElementById('avatarInput').addEventListener('change', (e) => {
            this.handleAvatarUpload(e);
        });
        
        // 保存按钮
        document.getElementById('saveFriendBtn').addEventListener('click', () => {
            this.saveFriendEdit();
        });
        
        // 删除按钮
        document.getElementById('deleteFriendBtn').addEventListener('click', () => {
            this.handleDeleteFriend();
        });
    }
    
    // 关闭编辑弹窗
    closeEditModal() {
        document.getElementById('editFriendModal').style.display = 'none';
        this.currentEditingCode = null;
    }
    
    // 处理头像上传
    handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            alert('❌ 请选择图片文件');
            return;
        }
        
        // 检查文件大小（限制5MB）
        if (file.size > 5 * 1024 * 1024) {
            alert('❌ 图片大小不能超过5MB');
            return;
        }
        
        // 读取文件为Base64
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result;
            
            // 更新预览
            const avatarPreview = document.getElementById('avatarPreview');
            avatarPreview.innerHTML = `<img src="${base64}" alt="头像">`;
            
            // 保存到临时变量
            this.tempAvatar = base64;
        };
        reader.readAsDataURL(file);
    }
    
    // 保存编辑
    saveFriendEdit() {
        // 获取表单数据
        const name = document.getElementById('editName').value.trim();
        
        // 验证必填项
        if (!name) {
            alert('❌ 网名不能为空');
            return;
        }
        
        // 构建更新数据
        const updates = {
            realName: document.getElementById('editRealName').value.trim(),
            name: name,
            nickname: document.getElementById('editNickname').value.trim(),
            signature: document.getElementById('editSignature').value.trim(),
            persona: document.getElementById('editPersona').value.trim(),
            poke: document.getElementById('editPoke').value.trim(),
            enableAvatarRecognition: document.getElementById('avatarRecognitionSwitch').checked
        };
        
        // 如果有新头像
        if (this.tempAvatar) {
            updates.avatar = this.tempAvatar;
            this.tempAvatar = null;
        }
        
        // 保存到存储
        const success = this.storage.updateFriend(this.currentEditingCode, updates);
        
        if (success) {
            // 关闭弹窗
            this.closeEditModal();
            
            // 刷新好友列表
            this.renderFriendList();
            
            alert('✅ 保存成功！');
        } else {
            alert('❌ 保存失败！');
        }
    }
    
    // 处理删除好友
    handleDeleteFriend() {
        const btn = document.getElementById('deleteFriendBtn');
        
        // 如果正在倒计时，直接返回
        if (btn.classList.contains('counting')) {
            return;
        }
        
        // 开始倒计时
        let countdown = 3;
        btn.classList.add('counting');
        btn.textContent = `确认删除 (${countdown}s)`;
        
        const timer = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                btn.textContent = `确认删除 (${countdown}s)`;
            } else {
                clearInterval(timer);
                this.deleteFriend();
            }
        }, 1000);
    }
    
    // 删除好友
    deleteFriend() {
        const success = this.storage.deleteFriend(this.currentEditingCode);
        
        if (success) {
            // 关闭弹窗
            this.closeEditModal();
            
            // 刷新好友列表
            this.renderFriendList();
            
            alert('✅ 已删除好友');
        } else {
            alert('❌ 删除失败！');
        }
        
        // 重置删除按钮
        const btn = document.getElementById('deleteFriendBtn');
        btn.classList.remove('counting');
        btn.textContent = '删除好友';
    }
    
    // ==================== 添加好友相关 ====================
    
    // 打开添加好友选择弹窗
    openAddFriendChoice() {
        document.getElementById('addFriendChoiceModal').style.display = 'flex';
        
        // 绑定事件（只绑定一次）
        if (!this.addChoiceBound) {
            this.bindAddChoiceEvents();
            this.addChoiceBound = true;
        }
    }
    
    // 绑定添加选择弹窗事件
    bindAddChoiceEvents() {
        // 关闭按钮
        document.getElementById('closeAddChoiceModal').addEventListener('click', () => {
            this.closeAddFriendChoice();
        });
        
        // 点击遮罩关闭
        document.getElementById('addFriendChoiceModal').addEventListener('click', (e) => {
            if (e.target.id === 'addFriendChoiceModal') {
                this.closeAddFriendChoice();
            }
        });
        
        // 新建好友按钮
        document.getElementById('newFriendBtn').addEventListener('click', () => {
            this.closeAddFriendChoice();
            this.openNewFriendModal();
        });
        
        // 通过编码添加按钮
        document.getElementById('addByCodeBtn').addEventListener('click', () => {
            this.closeAddFriendChoice();
            this.openAddByCodeModal();
        });
    }
    
    // 关闭添加好友选择弹窗
    closeAddFriendChoice() {
        document.getElementById('addFriendChoiceModal').style.display = 'none';
    }
    
    // ==================== 新建好友相关 ====================
    
    // 打开新建好友弹窗
    openNewFriendModal() {
        // 清空表单
        document.getElementById('newFriendName').value = '';
        document.getElementById('newFriendNickname').value = '';
        document.getElementById('newFriendSignature').value = '';
        document.getElementById('newFriendPersona').value = '';
        document.getElementById('newFriendPoke').value = '';
        
        // 显示弹窗
        document.getElementById('newFriendModal').style.display = 'flex';
        
        // 绑定事件（只绑定一次）
        if (!this.newFriendBound) {
            this.bindNewFriendEvents();
            this.newFriendBound = true;
        }
    }
    
    // 绑定新建好友弹窗事件
    bindNewFriendEvents() {
        // 关闭按钮
        document.getElementById('closeNewFriendModal').addEventListener('click', () => {
            this.closeNewFriendModal();
        });
        
        // 点击遮罩关闭
        document.getElementById('newFriendModal').addEventListener('click', (e) => {
            if (e.target.id === 'newFriendModal') {
                this.closeNewFriendModal();
            }
        });
        
        // 创建按钮
        document.getElementById('createFriendBtn').addEventListener('click', () => {
            this.createNewFriend();
        });
    }
    
    // 关闭新建好友弹窗
    closeNewFriendModal() {
        document.getElementById('newFriendModal').style.display = 'none';
    }
    
    // 创建新好友
    createNewFriend() {
        // 获取表单数据
        const name = document.getElementById('newFriendName').value.trim();
        
        // 验证必填项
        if (!name) {
            alert('❌ 网名不能为空');
            return;
        }
        
        // 生成好友编码
        const code = this.generateFriendCode(name);
        
        // 构建好友数据
        const newFriend = {
            code: code,
            name: name,
            realName: '',
            nickname: document.getElementById('newFriendNickname').value.trim(),
            avatar: '',
            persona: document.getElementById('newFriendPersona').value.trim(),
            poke: document.getElementById('newFriendPoke').value.trim() || '戳了戳你',
            signature: document.getElementById('newFriendSignature').value.trim(),
            groupId: 'default',
            addedTime: new Date().toISOString().split('T')[0],
            addedFrom: 'manual',
            canSeeMyMoments: true,
            seeTAMoments: true,
            currentOutfit: '',
            currentAction: '',
            currentMood: '',
            currentLocation: '',
            enableAvatarRecognition: true
        };
        
        // 保存到存储
        const success = this.storage.addFriend(newFriend);
        
        if (success) {
            // 关闭弹窗
            this.closeNewFriendModal();
            
            // 刷新好友列表
            this.renderFriendList();
            
            alert(`✅ 创建成功！\n\n好友编码：${code}\n\n请保存此编码，删除好友后可通过编码恢复。`);
        } else {
            alert('❌ 创建失败！');
        }
    }
    
    // 生成好友编码
    generateFriendCode(name) {
        // 取网名的首字母或前3个字符
        const prefix = name.substring(0, 3).toUpperCase();
        
        // 当前年份
        const year = new Date().getFullYear().toString().substring(2);
        
        // 随机字符串（3位）
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        
        // 格式：XXX_年份_随机#
        return `${prefix}_${year}k25_${random}#`;
    }
    
    // ==================== 通过编码添加相关 ====================
    
    // 打开通过编码添加弹窗
    openAddByCodeModal() {
        // 清空输入框
        document.getElementById('friendCodeInput').value = '';
        
        // 显示弹窗
        document.getElementById('addByCodeModal').style.display = 'flex';
        
        // 绑定事件（只绑定一次）
        if (!this.addByCodeBound) {
            this.bindAddByCodeEvents();
            this.addByCodeBound = true;
        }
    }
    
    // 绑定通过编码添加弹窗事件
    bindAddByCodeEvents() {
        // 关闭按钮
        document.getElementById('closeAddByCodeModal').addEventListener('click', () => {
            this.closeAddByCodeModal();
        });
        
        // 点击遮罩关闭
        document.getElementById('addByCodeModal').addEventListener('click', (e) => {
            if (e.target.id === 'addByCodeModal') {
                this.closeAddByCodeModal();
            }
        });
        
        // 添加按钮
        document.getElementById('addByCodeConfirmBtn').addEventListener('click', () => {
            this.addFriendByCode();
        });
    }
    
    // 关闭通过编码添加弹窗
    closeAddByCodeModal() {
        document.getElementById('addByCodeModal').style.display = 'none';
    }
    
    // 通过编码添加好友
addFriendByCode() {
    const code = document.getElementById('friendCodeInput').value.trim();
    
    // 验证编码格式
    if (!code) {
        alert('❌ 请输入好友编码');
        return;
    }
    
    // 检查好友是否存在（包括已删除的）
    const allFriends = this.storage.getAllFriendsIncludingDeleted();
    const friend = allFriends.find(f => f.code === code);
    
    if (!friend) {
        alert('❌ 无效的好友编码\n\n未找到该编码对应的好友。');
        return;
    }
    
    // 检查好友是否已删除
    if (!friend.isDeleted) {
        alert('❌ 该好友已存在！\n\n网名：' + friend.name);
        return;
    }
    
    // 恢复好友
    const success = this.storage.restoreFriend(code);
    
    if (success) {
        // 关闭弹窗
        this.closeAddByCodeModal();
        
        // 刷新好友列表
        this.renderFriendList();
        
        alert(`✅ 恢复成功！\n\n好友「${friend.name}」已苏醒。\n\n聊天记录、记忆总结都已恢复。`);
    } else {
        alert('❌ 恢复失败！');
    }
}
}
// 初始化
console.log('📦 chat-app.js v20260424 loaded');
const chatApp = new ChatApp();
window.chatApp = chatApp;