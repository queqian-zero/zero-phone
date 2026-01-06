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
        
        // 🆕 如果切换到好友列表，刷新列表（加这3行）
    if (pageId === 'friendListPage') {
        loadFriendList();
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

// 选择头像
function selectAvatar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // 验证文件大小
        if (file.size > 5 * 1024 * 1024) {
            alert('图片太大了！最大支持5MB');
            return;
        }
        
        // 转换为base64
        const reader = new FileReader();
        reader.onload = (e) => {
            currentAvatarBase64 = e.target.result;
            
            // 显示预览
            const preview = document.getElementById('avatarPreview');
            preview.innerHTML = `<img src="${currentAvatarBase64}" alt="头像">`;
            preview.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    };
    
    input.click();
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
    
    // 检查编码格式
    if (!code.startsWith('AI')) {
        alert('编码格式错误！应以AI开头');
        return;
    }
    
    // 检查编码库
    const codeLibrary = JSON.parse(localStorage.getItem('friendCodeLibrary') || '{}');
    
    if (!codeLibrary[code]) {
        alert('❌ 好友编码不存在！');
        return;
    }
    
    // 检查是否已在好友列表
    const friends = JSON.parse(localStorage.getItem('friends') || '[]');
    if (friends.some(f => f.friendCode === code)) {
        alert('⚠️ 该好友已在列表中！');
        return;
    }
    
    // 从编码库恢复好友
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
    
    // 关闭页面并刷新列表
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
    
    console.log('📝 输入信息:', { nickname, signature, persona, group });
    
    // 验证
    if (!nickname) {
        alert('请输入网名！');
        return;
    }
    
    if (!persona) {
        alert('请输入人设！');
        return;
    }
    
    if (persona.length < 20) {
        alert(`人设至少20个字！\n当前：${persona.length}个字`);
        return;
    }
    
    console.log('✅ 验证通过，开始生成编码...');
    
    // 生成好友编码
    const friendCode = generateFriendCode();
    console.log('🔑 好友编码:', friendCode);
    
    // 创建好友对象
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
    
    console.log('👤 新好友对象:', newFriend);
    
    // 保存到好友列表
    const friends = JSON.parse(localStorage.getItem('friends') || '[]');
    friends.push(newFriend);
    localStorage.setItem('friends', JSON.stringify(friends));
    console.log('💾 已保存到好友列表');
    
    // 保存到编码库
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
    console.log('💾 已保存到编码库');
    
    alert(`✅ ${nickname} 已创建！\n\n好友编码：${friendCode}`);
    
    // 清空表单
    document.getElementById('nicknameInput').value = '';
    document.getElementById('signatureInput').value = '';
    document.getElementById('personaInput').value = '';
    
    // 重置头像
    const avatarPreview = document.getElementById('avatarPreview');
    avatarPreview.innerHTML = `
        <span class="avatar-placeholder">📷</span>
        <span class="avatar-hint">点击上传头像</span>
    `;
    avatarPreview.classList.remove('has-image');
    currentAvatarBase64 = '';
    
    console.log('✅ 表单已清空');
    
    // 关闭页面并刷新列表
    document.getElementById('customPersonaPage').classList.remove('show');
    document.getElementById('addFriendPage').classList.remove('show');
    
    console.log('🔄 刷新好友列表...');
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
    
    // 填充数据
    loadFriendProfile(friend);
    
    // 显示页面
    document.getElementById('friendProfilePage').classList.add('show');
}

// 加载好友资料
function loadFriendProfile(friend) {
    // 头像
    const avatarImg = document.getElementById('profileAvatarImg');
    if (friend.avatar) {
        avatarImg.src = friend.avatar;
        avatarImg.style.display = 'block';
    } else {
        avatarImg.style.display = 'none';
    }
    
    // 头像识别开关
    const avatarSwitch = document.getElementById('avatarRecognitionSwitch');
    avatarSwitch.checked = friend.avatarRecognition !== false; // 默认开启
    
    // 好友编码
    document.getElementById('codeText').textContent = friend.friendCode;
    
    // 基本信息
    document.getElementById('profileNickname').value = friend.nickname || '';
    document.getElementById('profileRemark').value = friend.remark || '';
    document.getElementById('profileRealName').value = friend.realName || '';
    document.getElementById('profileSignature').value = friend.signature || '';
    document.getElementById('profilePoke').value = friend.poke || '';
    document.getElementById('profilePersona').value = friend.persona || '';
    document.getElementById('profileGroup').value = friend.group || '我的好友';
    
    // 重置编辑按钮
    const editBtn = document.getElementById('editProfileBtn');
    editBtn.textContent = '编辑';
    editBtn.classList.remove('editing');
    
    // 禁用所有输入
    setInputsDisabled(true);
}

// 关闭好友资料页面
function closeFriendProfile() {
    // 如果正在编辑，询问是否保存
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
        // 进入编辑模式
        editBtn.textContent = '保存';
        editBtn.classList.add('editing');
        setInputsDisabled(false);
    } else {
        // 保存并退出编辑模式
        saveFriendProfile();
        editBtn.textContent = '编辑';
        editBtn.classList.remove('editing');
        setInputsDisabled(true);
    }
}

// 设置输入框禁用状态
function setInputsDisabled(disabled) {
    document.getElementById('profileRemark').disabled = disabled;
    document.getElementById('profileRealName').disabled = disabled;
    document.getElementById('profileSignature').disabled = disabled;
    document.getElementById('profilePoke').disabled = disabled;
    document.getElementById('profilePersona').disabled = disabled;
    document.getElementById('profileGroup').disabled = disabled;
    document.getElementById('avatarRecognitionSwitch').disabled = disabled;
}

// 保存好友资料
function saveFriendProfile() {
    if (!currentEditingFriend) return;
    
    // 获取输入值
    const remark = document.getElementById('profileRemark').value.trim();
    const realName = document.getElementById('profileRealName').value.trim();
    const signature = document.getElementById('profileSignature').value.trim();
    const poke = document.getElementById('profilePoke').value.trim();
    const persona = document.getElementById('profilePersona').value.trim();
    const group = document.getElementById('profileGroup').value;
    const avatarRecognition = document.getElementById('avatarRecognitionSwitch').checked;
    
    // 验证人设
    if (!persona || persona.length < 20) {
        alert('人设至少20个字！');
        return;
    }
    
    // 更新好友列表
    let friends = JSON.parse(localStorage.getItem('friends') || '[]');
    const friendIndex = friends.findIndex(f => f.friendCode === currentEditingFriend.friendCode);
    
    if (friendIndex !== -1) {
        friends[friendIndex].remark = remark;
        friends[friendIndex].realName = realName;
        friends[friendIndex].signature = signature;
        friends[friendIndex].poke = poke;
        friends[friendIndex].persona = persona;
        friends[friendIndex].group = group;
        friends[friendIndex].avatarRecognition = avatarRecognition;
        
        localStorage.setItem('friends', JSON.stringify(friends));
        
        // 更新编码库
        let codeLibrary = JSON.parse(localStorage.getItem('friendCodeLibrary') || '{}');
        if (codeLibrary[currentEditingFriend.friendCode]) {
            codeLibrary[currentEditingFriend.friendCode].signature = signature;
            codeLibrary[currentEditingFriend.friendCode].persona = persona;
            localStorage.setItem('friendCodeLibrary', JSON.stringify(codeLibrary));
        }
        
        // 更新当前对象
        currentEditingFriend = friends[friendIndex];
        
        alert('✅ 保存成功！');
        
        // 刷新好友列表
        loadFriendList();
    }
}

// 复制好友编码
function copyCode() {
    const code = document.getElementById('codeText').textContent;
    
    // 创建临时输入框
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
    
    // 倒计时确认
    let countdown = 3;
    const confirmMsg = `确定要删除好友 "${friendName}" 吗？\n\n删除后聊天记录将被清空，但人设和记忆库会保留。\n如需彻底删除，请在"好友编码库"中操作。\n\n`;
    
    const result = window.confirm(confirmMsg + `(${countdown}秒后可确认)`);
    
    if (!result) return;
    
    // 二次确认
    setTimeout(() => {
        const finalConfirm = window.confirm(`确定删除 "${friendName}" ？`);
        
        if (finalConfirm) {
            // 从好友列表删除
            let friends = JSON.parse(localStorage.getItem('friends') || '[]');
            friends = friends.filter(f => f.friendCode !== currentEditingFriend.friendCode);
            localStorage.setItem('friends', JSON.stringify(friends));
            
            // 清空聊天记录
            localStorage.removeItem(`chatHistory_${currentEditingFriend.friendCode}`);
            
            // 在记忆库添加"被删除"记录
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
            
            // 关闭页面并刷新列表
            document.getElementById('friendProfilePage').classList.remove('show');
            currentEditingFriend = null;
            loadFriendList();
        }
    }, 100);
}