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
    this.openEditModal(code);
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
}

// 初始化
const chatApp = new ChatApp();