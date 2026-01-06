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
            openAddFriend();
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
        
        // 如果切换到好友列表，刷新列表
        if (pageId === 'friendListPage') {
            loadFriendList();
        }
        
        // 如果切换到聊天列表，刷新列表
if (pageId === 'chatListPage') {
    loadChatList();
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
        return;
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
    const membersHtml = friends.map(friend => {
        const friendCode = friend.friendCode;
        return `
        <div class="friend-card" 
             onclick="openChatWithFriend('${friendCode}')"
             oncontextmenu="openFriendProfileFromList('${friendCode}'); return false;"
             ontouchstart="handleFriendTouchStart(event, '${friendCode}')"
             ontouchend="handleFriendTouchEnd()">
            <div class="friend-avatar">
                ${friend.avatar ? `<img src="${friend.avatar}" alt="${friend.nickname}">` : '👤'}
            </div>
            <div class="friend-info">
                <div class="friend-name">${friend.remark || friend.nickname}</div>
                <div class="friend-signature">${friend.signature || '这个人很懒，什么都没写...'}</div>
            </div>
        </div>
        `;
    }).join('');
    
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

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    loadFriendList();
});

// ===== 添加好友功能 =====

// 全局变量
let currentAvatarBase64 = '';

// 打开添加好友页面
function openAddFriend() {
    document.getElementById('addFriendPage').classList.add('show');
}

// 关闭添加好友页面
function closeAddFriend() {
    document.getElementById('addFriendPage').classList.remove('show');
}

// 显示通过编码添加
function showAddByCode() {
    document.getElementById('addByCodePage').classList.add('show');
}

// 显示自定义人设
function showCustomPersona() {
    document.getElementById('customPersonaPage').classList.add('show');
}

// 返回添加好友选择页
function backToAddFriend() {
    document.getElementById('addByCodePage').classList.remove('show');
    document.getElementById('customPersonaPage').classList.remove('show');
}

// ===== 创建好友时选择头像 =====

// 选择头像（创建好友时）
function selectAvatar() {
    // 显示选择方式
    const choice = window.confirm('选择头像来源：\n\n点击"确定"从相册选择\n点击"取消"输入URL');
    
    if (choice) {
        selectAvatarFromAlbum();
    } else {
        selectAvatarFromURL();
    }
}

// 从相册选择头像
function selectAvatarFromAlbum() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 10 * 1024 * 1024) {
            alert('图片太大了！最大支持10MB');
            return;
        }
        
        // 询问是否压缩
        const compress = window.confirm('是否压缩图片？\n\n点击"确定"压缩后上传（推荐）\n点击"取消"使用原图');
        
        if (compress) {
            compressAvatarImage(file, (base64) => {
                applyCreateAvatar(base64);
            });
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                applyCreateAvatar(e.target.result);  // 这是Base64
            };
            reader.readAsDataURL(file);  // 转Base64
        }
    };
    
    input.click();
}

// 从URL选择头像
function selectAvatarFromURL() {
    const url = prompt('请输入图片URL：');
    if (!url) return;
    
    try {
        new URL(url);
    } catch (e) {
        alert('URL格式不正确！');
        return;
    }
    
    const testImg = new Image();
    testImg.onload = () => {
        applyCreateAvatar(url);
    };
    testImg.onerror = () => {
        alert('图片加载失败！请检查URL');
    };
    testImg.src = url;
}

// 压缩头像图片
function compressAvatarImage(file, callback) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
            const maxSize = 300;
            let width = img.width;
            let height = img.height;
            
            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressed = canvas.toDataURL('image/jpeg', 0.85);  // 转Base64
            callback(compressed);
        };
        
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

// 应用创建头像
function applyCreateAvatar(base64) {
    currentAvatarBase64 = base64;
    
    const preview = document.getElementById('avatarPreview');
    preview.innerHTML = `<img src="${base64}" alt="头像">`;
    preview.classList.add('has-image');
}

// 生成好友编码
function generateFriendCode() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `AI${timestamp}${random}`;
}

// 通过编码添加好友
function addFriendByCode() {
    const code = document.getElementById('friendCodeInput').value.trim();
    
    if (!code) {
        alert('请输入好友编码！');
        return;
    }
    
    if (!code.startsWith('AI')) {
        alert('编码格式错误！应以AI开头');
        return;
    }
    
    const codeLibrary = JSON.parse(localStorage.getItem('friendCodeLibrary') || '{}');
    
    if (!codeLibrary[code]) {
        alert('❌ 好友编码不存在！');
        return;
    }
    
    const friends = JSON.parse(localStorage.getItem('friends') || '[]');
    if (friends.some(f => f.friendCode === code)) {
        alert('⚠️ 该好友已在列表中！');
        return;
    }
    
    const friendData = codeLibrary[code];
    const newFriend = {
        friendCode: code,
        avatar: friendData.avatar || '',
        nickname: friendData.nickname,
        remark: '',
        signature: friendData.signature || '',
        persona: friendData.persona,
        group: '我的好友',
        addTime: Date.now()
    };
    
    friends.push(newFriend);
    localStorage.setItem('friends', JSON.stringify(friends));
    
    alert(`✅ ${friendData.nickname} 已添加！`);
    
    document.getElementById('addByCodePage').classList.remove('show');
    document.getElementById('addFriendPage').classList.remove('show');
    loadFriendList();
}

// 创建自定义好友
function createCustomFriend() {
    console.log('🔍 开始创建好友...');
    
    const nickname = document.getElementById('nicknameInput').value.trim();
    const signature = document.getElementById('signatureInput').value.trim();
    const persona = document.getElementById('personaInput').value.trim();
    const group = document.getElementById('groupInput').value;
    
    if (!nickname) {
        alert('请输入网名！');
        return;
    }
    
    if (!persona || persona.length < 20) {
        alert(`人设至少20个字！\n当前：${persona.length}个字`);
        return;
    }
    
    const friendCode = generateFriendCode();
    
    const newFriend = {
        friendCode: friendCode,
        avatar: currentAvatarBase64 || '',
        nickname: nickname,
        remark: '',
        signature: signature || '',
        persona: persona,
        group: group,
        addTime: Date.now()
    };
    
    const friends = JSON.parse(localStorage.getItem('friends') || '[]');
    friends.push(newFriend);
    localStorage.setItem('friends', JSON.stringify(friends));
    
    const codeLibrary = JSON.parse(localStorage.getItem('friendCodeLibrary') || '{}');
    codeLibrary[friendCode] = {
        avatar: currentAvatarBase64 || '',
        nickname: nickname,
        signature: signature || '',
        persona: persona,
        createTime: Date.now(),
        memories: {
            chatSummary: [],
            diary: [],
            coreMemory: []
        }
    };
    localStorage.setItem('friendCodeLibrary', JSON.stringify(codeLibrary));
    
    alert(`✅ ${nickname} 已创建！\n\n好友编码：${friendCode}`);
    
    // 清空表单
    document.getElementById('nicknameInput').value = '';
    document.getElementById('signatureInput').value = '';
    document.getElementById('personaInput').value = '';
    document.getElementById('avatarPreview').innerHTML = `
        <span class="avatar-placeholder">📷</span>
        <span class="avatar-hint">点击上传头像</span>
    `;
    document.getElementById('avatarPreview').classList.remove('has-image');
    currentAvatarBase64 = '';
    
    document.getElementById('customPersonaPage').classList.remove('show');
    document.getElementById('addFriendPage').classList.remove('show');
    loadFriendList();
    
    console.log('✅ 好友创建完成！');
}

// ===== 人设编辑功能 =====

let currentEditingFriend = null;
let isEditMode = false;

// 打开好友资料页面
function openFriendProfile(friendCode) {
    const friends = JSON.parse(localStorage.getItem('friends') || '[]');
    const friend = friends.find(f => f.friendCode === friendCode);
    
    if (!friend) {
        alert('找不到该好友！');
        return;
    }
    
    currentEditingFriend = friend;
    isEditMode = false;
    
    loadFriendProfile(friend);
    document.getElementById('friendProfilePage').classList.add('show');
}

// 加载好友资料
function loadFriendProfile(friend) {
    const avatarImg = document.getElementById('profileAvatarImg');
    if (friend.avatar) {
        avatarImg.src = friend.avatar;
        avatarImg.style.display = 'block';
    } else {
        avatarImg.style.display = 'none';
    }
    
    const avatarSwitch = document.getElementById('avatarRecognitionSwitch');
    avatarSwitch.checked = friend.avatarRecognition !== false;
    
    document.getElementById('codeText').textContent = friend.friendCode;
    document.getElementById('profileNickname').value = friend.nickname || '';
    document.getElementById('profileRemark').value = friend.remark || '';
    document.getElementById('profileRealName').value = friend.realName || '';
    document.getElementById('profileSignature').value = friend.signature || '';
    document.getElementById('profilePoke').value = friend.poke || '';
    document.getElementById('profilePersona').value = friend.persona || '';
    document.getElementById('profileGroup').value = friend.group || '我的好友';
    
    const editBtn = document.getElementById('editProfileBtn');
    editBtn.textContent = '编辑';
    editBtn.classList.remove('editing');
    
    setInputsDisabled(true);
}

// 关闭好友资料页面
function closeFriendProfile() {
    if (isEditMode) {
        const confirm = window.confirm('有未保存的修改，确定要退出吗？');
        if (!confirm) return;
    }
    
    document.getElementById('friendProfilePage').classList.remove('show');
    currentEditingFriend = null;
    isEditMode = false;
}

// 切换编辑模式
function toggleEdit() {
    isEditMode = !isEditMode;
    const editBtn = document.getElementById('editProfileBtn');
    
    if (isEditMode) {
        editBtn.textContent = '保存';
        editBtn.classList.add('editing');
        setInputsDisabled(false);
    } else {
        saveFriendProfile();
        editBtn.textContent = '编辑';
        editBtn.classList.remove('editing');
        setInputsDisabled(true);
    }
}

// 设置输入框禁用状态
function setInputsDisabled(disabled) {
    document.getElementById('profileNickname').disabled = disabled;
    document.getElementById('profileRemark').disabled = disabled;
    document.getElementById('profileRealName').disabled = disabled;
    document.getElementById('profileSignature').disabled = disabled;
    document.getElementById('profilePoke').disabled = disabled;
    document.getElementById('profilePersona').disabled = disabled;
    document.getElementById('profileGroup').disabled = disabled;
    document.getElementById('avatarRecognitionSwitch').disabled = disabled;
    
    const avatarHint = document.getElementById('avatarEditHint');
    if (disabled) {
        avatarHint.style.display = 'none';
    } else {
        avatarHint.style.display = 'block';
    }
}

// 保存好友资料
function saveFriendProfile() {
    if (!currentEditingFriend) return;
    
    const nickname = document.getElementById('profileNickname').value.trim();
    const remark = document.getElementById('profileRemark').value.trim();
    const realName = document.getElementById('profileRealName').value.trim();
    const signature = document.getElementById('profileSignature').value.trim();
    const poke = document.getElementById('profilePoke').value.trim();
    const persona = document.getElementById('profilePersona').value.trim();
    const group = document.getElementById('profileGroup').value;
    const avatarRecognition = document.getElementById('avatarRecognitionSwitch').checked;
    
    if (!nickname) {
        alert('网名不能为空！');
        return;
    }
    
    if (!persona || persona.length < 20) {
        alert('人设至少20个字！');
        return;
    }
    
    let friends = JSON.parse(localStorage.getItem('friends') || '[]');
    const friendIndex = friends.findIndex(f => f.friendCode === currentEditingFriend.friendCode);
    
    if (friendIndex !== -1) {
        friends[friendIndex].nickname = nickname;
        friends[friendIndex].avatar = currentEditingFriend.avatar;
        friends[friendIndex].remark = remark;
        friends[friendIndex].realName = realName;
        friends[friendIndex].signature = signature;
        friends[friendIndex].poke = poke;
        friends[friendIndex].persona = persona;
        friends[friendIndex].group = group;
        friends[friendIndex].avatarRecognition = avatarRecognition;
        
        localStorage.setItem('friends', JSON.stringify(friends));
        
        let codeLibrary = JSON.parse(localStorage.getItem('friendCodeLibrary') || '{}');
        if (codeLibrary[currentEditingFriend.friendCode]) {
            codeLibrary[currentEditingFriend.friendCode].nickname = nickname;
            codeLibrary[currentEditingFriend.friendCode].avatar = currentEditingFriend.avatar;
            codeLibrary[currentEditingFriend.friendCode].signature = signature;
            codeLibrary[currentEditingFriend.friendCode].persona = persona;
            localStorage.setItem('friendCodeLibrary', JSON.stringify(codeLibrary));
        }
        
        currentEditingFriend = friends[friendIndex];
        
        alert('✅ 保存成功！');
        loadFriendList();
    }
}

// 复制好友编码
function copyCode() {
    const code = document.getElementById('codeText').textContent;
    
    const tempInput = document.createElement('input');
    tempInput.value = code;
    document.body.appendChild(tempInput);
    tempInput.select();
    
    try {
        document.execCommand('copy');
        alert('✅ 编码已复制！');
    } catch (err) {
        alert('❌ 复制失败，请手动复制');
    }
    
    document.body.removeChild(tempInput);
}

// 删除好友
function deleteFriend() {
    if (!currentEditingFriend) return;
    
    const friendName = currentEditingFriend.remark || currentEditingFriend.nickname;
    const confirmMsg = `确定要删除好友 "${friendName}" 吗？\n\n删除后聊天记录将被清空，但人设和记忆库会保留。`;
    
    const result = window.confirm(confirmMsg);
    if (!result) return;
    
    const finalConfirm = window.confirm(`确定删除 "${friendName}" ？`);
    if (!finalConfirm) return;
    
    let friends = JSON.parse(localStorage.getItem('friends') || '[]');
    friends = friends.filter(f => f.friendCode !== currentEditingFriend.friendCode);
    localStorage.setItem('friends', JSON.stringify(friends));
    
    localStorage.removeItem(`chatHistory_${currentEditingFriend.friendCode}`);
    
    let codeLibrary = JSON.parse(localStorage.getItem('friendCodeLibrary') || '{}');
    if (codeLibrary[currentEditingFriend.friendCode]) {
        const now = new Date().toISOString().split('T')[0];
        if (!codeLibrary[currentEditingFriend.friendCode].memories) {
            codeLibrary[currentEditingFriend.friendCode].memories = {
                chatSummary: [],
                diary: [],
                coreMemory: []
            };
        }
        codeLibrary[currentEditingFriend.friendCode].memories.diary.push(
            `${now}: 被主人从好友列表移除了...`
        );
        localStorage.setItem('friendCodeLibrary', JSON.stringify(codeLibrary));
    }
    
    alert(`✅ ${friendName} 已删除`);
    
    document.getElementById('friendProfilePage').classList.remove('show');
    currentEditingFriend = null;
    loadFriendList();
}

// ===== 编辑好友时更换头像 =====

// 更换资料头像
function changeProfileAvatar() {
    if (!isEditMode) return;
    
    const choice = window.confirm('选择头像来源：\n\n点击"确定"从相册选择\n点击"取消"输入URL');
    
    if (choice) {
        selectProfileAvatarFromAlbum();
    } else {
        selectProfileAvatarFromURL();
    }
}

// 从相册选择头像
function selectProfileAvatarFromAlbum() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 10 * 1024 * 1024) {
            alert('图片太大了！最大支持10MB');
            return;
        }
        
        const compress = window.confirm('是否压缩图片？\n\n点击"确定"压缩后上传（推荐）\n点击"取消"使用原图');
        
        if (compress) {
            compressProfileAvatar(file, (base64) => {
                applyProfileAvatar(base64);
            });
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                applyProfileAvatar(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

// 从URL选择头像
function selectProfileAvatarFromURL() {
    const url = prompt('请输入图片URL：');
    if (!url) return;
    
    try {
        new URL(url);
    } catch (e) {
        alert('URL格式不正确！');
        return;
    }
    
    const testImg = new Image();
    testImg.onload = () => {
        applyProfileAvatar(url);
    };
    testImg.onerror = () => {
        alert('图片加载失败！请检查URL');
    };
    testImg.src = url;
}

// 压缩头像
function compressProfileAvatar(file, callback) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
            const maxSize = 300;
            let width = img.width;
            let height = img.height;
            
            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            callback(compressed);
        };
        
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

// 应用头像
function applyProfileAvatar(base64) {
    const avatarImg = document.getElementById('profileAvatarImg');
    avatarImg.src = base64;
    avatarImg.style.display = 'block';
    
    if (currentEditingFriend) {
        currentEditingFriend.avatar = base64;
    }
    
    console.log('✅ 头像已更新（保存时生效）');
}

// ===== 聊天功能 =====

let friendLongPressTimer = null;
let friendLongPressTriggered = false;

// 处理好友卡片触摸开始
function handleFriendTouchStart(event, friendCode) {
    friendLongPressTriggered = false;
    
    // 长按0.5秒触发人设编辑
    friendLongPressTimer = setTimeout(() => {
        friendLongPressTriggered = true;
        navigator.vibrate && navigator.vibrate(50); // 震动反馈
        openFriendProfileFromList(friendCode);
    }, 500);
}

// 处理好友卡片触摸结束
function handleFriendTouchEnd() {
    if (friendLongPressTimer) {
        clearTimeout(friendLongPressTimer);
        friendLongPressTimer = null;
    }
}

// 从好友列表打开人设编辑
function openFriendProfileFromList(friendCode) {
    // 阻止触发聊天
    if (friendLongPressTimer) {
        clearTimeout(friendLongPressTimer);
    }
    
    // 打开人设编辑
    openFriendProfile(friendCode);
}

// 打开与好友的聊天
function openChatWithFriend(friendCode) {
    // 如果是长按触发的，不打开聊天
    if (friendLongPressTriggered) {
        friendLongPressTriggered = false;
        return;
    }
    
    console.log(`打开与好友 ${friendCode} 的聊天`);
    
    // 检查好友是否存在
    const friends = JSON.parse(localStorage.getItem('friends') || '[]');
    const friend = friends.find(f => f.friendCode === friendCode);
    
    if (!friend) {
        alert('找不到该好友！');
        return;
    }
    
    // 创建或打开聊天
    createOrOpenChat(friend);
}

// 创建或打开聊天
function createOrOpenChat(friend) {
    // 获取所有聊天
    let chats = JSON.parse(localStorage.getItem('chats') || '[]');
    
    // 检查是否已有聊天
    let chat = chats.find(c => c.friendCode === friend.friendCode);
    
    if (!chat) {
        // 创建新聊天
        chat = {
            chatId: `chat_${Date.now()}`,
            friendCode: friend.friendCode,
            friendNickname: friend.nickname,
            friendAvatar: friend.avatar || '',
            lastMessage: '',
            lastMessageTime: Date.now(),
            unreadCount: 0,
            createTime: Date.now()
        };
        
        chats.unshift(chat); // 添加到开头
        localStorage.setItem('chats', JSON.stringify(chats));
        
        console.log('✅ 创建新聊天:', chat);
    }
    
    // 跳转到聊天界面
    openChatInterface(chat);
    
    // 刷新聊天列表
    loadChatList();
}

// 打开聊天界面
function openChatInterface(chat) {
    alert(`打开聊天界面：${chat.friendNickname}\n\n（聊天界面开发中...）`);
    // TODO: 后面会实现真正的聊天界面
}

// 加载聊天列表
function loadChatList() {
    const chats = JSON.parse(localStorage.getItem('chats') || '[]');
    const container = document.querySelector('#chatListPage .page-content');
    
    if (chats.length === 0) {
        container.innerHTML = `
            <div class="empty-placeholder">
                <div class="empty-icon">💬</div>
                <div class="empty-text">暂无聊天</div>
            </div>
        `;
        return;
    }
    
    // 渲染聊天列表
    const chatsHtml = chats.map(chat => {
        const timeStr = formatChatTime(chat.lastMessageTime);
        
        return `
            <div class="chat-item" onclick="openChatById('${chat.chatId}')">
                <div class="chat-avatar">
                    ${chat.friendAvatar ? `<img src="${chat.friendAvatar}" alt="${chat.friendNickname}">` : '👤'}
                </div>
                <div class="chat-info">
                    <div class="chat-header">
                        <div class="chat-name">${chat.friendNickname}</div>
                        <div class="chat-time">${timeStr}</div>
                    </div>
                    <div class="chat-preview">${chat.lastMessage || '开始聊天吧~'}</div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = chatsHtml;
}

// 通过chatId打开聊天
function openChatById(chatId) {
    const chats = JSON.parse(localStorage.getItem('chats') || '[]');
    const chat = chats.find(c => c.chatId === chatId);
    
    if (chat) {
        openChatInterface(chat);
    }
}

// 格式化聊天时间
function formatChatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const date = new Date(timestamp);
    
    // 1分钟内
    if (diff < 60 * 1000) {
        return '刚刚';
    }
    
    // 1小时内
    if (diff < 60 * 60 * 1000) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `${minutes}分钟前`;
    }
    
    // 今天
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    
    // 昨天
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return '昨天';
    }
    
    // 一周内
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = ['日', '一', '二', '三', '四', '五', '六'];
        return `星期${days[date.getDay()]}`;
    }
    
    // 更早
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

// 页面切换时加载聊天列表
document.addEventListener('DOMContentLoaded', () => {
    loadChatList();
});