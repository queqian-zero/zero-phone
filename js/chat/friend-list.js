/* Friend List - 好友列表逻辑 */

class FriendList {
    constructor() {
        this.currentMethod = 'code'; // 添加方式：code(编码) / custom(自定义)
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderFriendList();
        console.log('✅ 好友列表初始化完成');
    }

    // 绑定事件
    bindEvents() {
        // 添加好友按钮
        const addFriendBtn = document.getElementById('addFriendBtn');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => this.showAddFriendModal());
        }

        // 管理分组按钮
        const manageGroupBtn = document.getElementById('manageGroupBtn');
        if (manageGroupBtn) {
            manageGroupBtn.addEventListener('click', () => this.showManageGroupModal());
        }
    }

    // 渲染好友列表
    renderFriendList() {
        const container = document.getElementById('friendListContainer');
        if (!container) {
            console.error('❌ 找不到好友列表容器');
            return;
        }

        const groups = storageManager.getAllGroups();
        let html = '';

        // 遍历所有分组
        groups.forEach(group => {
            const friends = storageManager.getFriendsByGroup(group.id);
            
            html += `
                <div class="friend-group">
                    <div class="group-header" onclick="friendList.toggleGroup('${group.id}')">
                        <div class="group-title-wrapper">
                            <span class="group-toggle-icon">▼</span>
                            <span class="group-title">${group.name}</span>
                            <span class="group-count">(${friends.length})</span>
                        </div>
                    </div>
                    <div class="group-friends" data-group="${group.id}">
                        ${this.renderFriendItems(friends)}
                    </div>
                </div>
            `;
        });

        // 如果没有好友
        if (groups.every(g => storageManager.getFriendsByGroup(g.id).length === 0)) {
            html = `
                <div class="empty-friends">
                    <div class="empty-friends-icon">👥</div>
                    <div class="empty-friends-text">还没有好友<br>点击右上角添加好友吧~</div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    // 渲染好友项
    renderFriendItems(friends) {
        if (friends.length === 0) {
            return '<div class="empty-friends-text" style="padding: 20px; text-align: center; color: rgba(255,255,255,0.4);">该分组暂无好友</div>';
        }

        return friends.map(friend => `
            <div class="friend-item" onclick="friendList.openFriendDetail('${friend.id}')">
                <div class="friend-avatar">
                    <img src="${friend.avatar}" alt="${friend.nickname}">
                </div>
                <div class="friend-info">
                    <div class="friend-name">${friend.remark || friend.nickname}</div>
                    <div class="friend-signature">${friend.signature || '这个人很懒，什么都没写~'}</div>
                </div>
            </div>
        `).join('');
    }

    // 折叠/展开分组
    toggleGroup(groupId) {
        const header = event.currentTarget;
        header.classList.toggle('collapsed');
    }

    // ==================== 添加好友 ====================

    // 显示添加好友弹窗
    showAddFriendModal() {
        const modal = this.createAddFriendModal();
        document.body.appendChild(modal);
        
        // 延迟添加active类，触发动画
        setTimeout(() => modal.classList.add('active'), 10);
    }

    // 创建添加好友弹窗
    createAddFriendModal() {
        const modal = document.createElement('div');
        modal.className = 'add-friend-modal';
        modal.innerHTML = `
            <div class="add-friend-content">
                <h2 class="modal-title">添加好友</h2>
                
                <!-- 方式选择 -->
                <div class="add-method-tabs">
                    <button class="method-tab active" data-method="code">
                        通过编码添加
                    </button>
                    <button class="method-tab" data-method="custom">
                        自定义人设
                    </button>
                </div>

                <!-- 通过编码添加 -->
                <div class="add-form-section active" data-section="code">
                    <div class="form-group">
                        <label class="form-label">好友编码</label>
                        <input type="text" class="form-input" id="friendCodeInput" 
                               placeholder="请输入6位好友编码" maxlength="6">
                    </div>
                    <div id="codePreview"></div>
                </div>

                <!-- 自定义人设 -->
                <div class="add-form-section" data-section="custom">
                    <div class="form-group">
                        <label class="form-label">头像</label>
                        <div class="avatar-selector">
                            <div class="avatar-preview" id="avatarPreview">
                                <img src="assets/icons/chat/nav-friend.png" alt="头像">
                            </div>
                            <button class="avatar-upload-btn" onclick="friendList.selectAvatar()">
                                选择头像
                            </button>
                        </div>
                    </div>

                    <div class="form-group form-switch">
                        <label class="form-label">头像识图</label>
                        <div class="switch active" id="avatarRecognitionSwitch" 
                             onclick="this.classList.toggle('active')">
                            <div class="switch-thumb"></div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">网名 *</label>
                        <input type="text" class="form-input" id="nicknameInput" 
                               placeholder="请输入网名">
                    </div>

                    <div class="form-group">
                        <label class="form-label">真实姓名</label>
                        <input type="text" class="form-input" id="realnameInput" 
                               placeholder="请输入真实姓名（选填）">
                    </div>

                    <div class="form-group">
                        <label class="form-label">个性签名</label>
                        <input type="text" class="form-input" id="signatureInput" 
                               placeholder="请输入个性签名（选填）">
                    </div>

                    <div class="form-group">
                        <label class="form-label">人设 *</label>
                        <textarea class="form-textarea" id="personaInput" 
                                  placeholder="请输入人设描述..."></textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">拍一拍后缀</label>
                        <input type="text" class="form-input" id="pokeSuffixInput" 
                               placeholder="拍了拍你..." value="的小脑袋">
                    </div>

                    <div class="form-group">
                        <label class="form-label">分组</label>
                        <select class="form-input" id="groupSelect">
                            ${this.renderGroupOptions()}
                        </select>
                    </div>
                </div>

                <!-- 按钮 -->
                <div class="modal-buttons">
                    <button class="modal-btn modal-btn-cancel" onclick="friendList.closeModal(this)">
                        取消
                    </button>
                    <button class="modal-btn modal-btn-confirm" onclick="friendList.confirmAddFriend()">
                        确定
                    </button>
                </div>
            </div>
        `;

        // 绑定tab切换
        modal.querySelectorAll('.method-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const method = tab.dataset.method;
                this.switchAddMethod(method, modal);
            });
        });

        // 监听编码输入
        const codeInput = modal.querySelector('#friendCodeInput');
        if (codeInput) {
            codeInput.addEventListener('input', (e) => {
                this.previewCodeInfo(e.target.value, modal);
            });
        }

        return modal;
    }

    // 切换添加方式
    switchAddMethod(method, modal) {
        this.currentMethod = method;
        
        // 切换tab样式
        modal.querySelectorAll('.method-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.method === method);
        });

        // 切换表单区域
        modal.querySelectorAll('.add-form-section').forEach(section => {
            section.classList.toggle('active', section.dataset.section === method);
        });
    }

    // 预览编码信息
    previewCodeInfo(code, modal) {
        const preview = modal.querySelector('#codePreview');
        if (!preview) return;

        if (code.length !== 6) {
            preview.innerHTML = '';
            return;
        }

        const codeInfo = storageManager.getCodeInfo(code);
        
        if (!codeInfo) {
            preview.innerHTML = `
                <div style="padding: 12px; background: rgba(255,59,48,0.1); border-radius: 8px; color: #ff3b30; font-size: 14px; margin-top: 12px;">
                    ❌ 编码不存在
                </div>
            `;
            return;
        }

        if (codeInfo.isDeleted) {
            preview.innerHTML = `
                <div style="padding: 12px; background: rgba(102,126,234,0.1); border-radius: 8px; margin-top: 12px;">
                    <div style="color: rgba(255,255,255,0.9); font-size: 14px; margin-bottom: 4px;">
                        👤 ${codeInfo.nickname}
                    </div>
                    <div style="color: rgba(255,255,255,0.5); font-size: 12px;">
                        创建于: ${codeInfo.createTime}<br>
                        删除于: ${codeInfo.deleteTime}
                    </div>
                </div>
            `;
        } else {
            preview.innerHTML = `
                <div style="padding: 12px; background: rgba(255,149,0,0.1); border-radius: 8px; color: #ff9500; font-size: 14px; margin-top: 12px;">
                    ⚠️ 该好友已在列表中
                </div>
            `;
        }
    }

    // 渲染分组选项
    renderGroupOptions() {
        const groups = storageManager.getAllGroups();
        return groups.map(g => 
            `<option value="${g.id}">${g.name}</option>`
        ).join('');
    }

    // 选择头像
    selectAvatar() {
        // 简单实现：使用prompt输入URL
        const url = prompt('请输入头像URL:');
        if (url) {
            document.querySelector('#avatarPreview img').src = url;
        }
    }

    // 确认添加好友
    confirmAddFriend() {
        if (this.currentMethod === 'code') {
            this.addFriendByCode();
        } else {
            this.addFriendByCustom();
        }
    }

    // 通过编码添加
    addFriendByCode() {
        const code = document.getElementById('friendCodeInput').value.trim().toUpperCase();
        
        if (code.length !== 6) {
            alert('请输入6位编码');
            return;
        }

        const codeInfo = storageManager.getCodeInfo(code);
        
        if (!codeInfo) {
            alert('编码不存在');
            return;
        }

        if (!codeInfo.isDeleted) {
            alert('该好友已在列表中');
            return;
        }

        // 通过编码添加（记忆库保留）
        const result = storageManager.addFriend({
            friendCode: code,
            nickname: codeInfo.nickname,
            addSource: '编码添加'
        });

        if (result.success) {
            storageManager.updateCodeStatus(code, false);
            alert('添加成功！');
            this.closeModal(event.target);
            this.renderFriendList();
        } else {
            alert(result.message || '添加失败');
        }
    }

    // 自定义人设添加
    addFriendByCustom() {
        const nickname = document.getElementById('nicknameInput').value.trim();
        const persona = document.getElementById('personaInput').value.trim();

        if (!nickname) {
            alert('请输入网名');
            return;
        }

        if (!persona) {
            alert('请输入人设');
            return;
        }

        // 生成编码
        const code = storageManager.generateFriendCode();

        // 添加到编码库
        storageManager.addFriendCode(code, nickname);

        // 添加好友
        const result = storageManager.addFriend({
            friendCode: code,
            avatar: document.querySelector('#avatarPreview img').src,
            avatarRecognition: document.getElementById('avatarRecognitionSwitch').classList.contains('active'),
            nickname: nickname,
            realname: document.getElementById('realnameInput').value.trim(),
            signature: document.getElementById('signatureInput').value.trim(),
            persona: persona,
            pokeSuffix: document.getElementById('pokeSuffixInput').value.trim() || '的小脑袋',
            group: document.getElementById('groupSelect').value,
            addSource: '人设添加'
        });

        if (result.success) {
            alert('添加成功！');
            this.closeModal(event.target);
            this.renderFriendList();
        } else {
            alert(result.message || '添加失败');
        }
    }

    // 关闭弹窗
    closeModal(btn) {
        const modal = btn.closest('.add-friend-modal, .manage-group-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    }

    // ==================== 管理分组 ====================

    // 显示管理分组弹窗
    showManageGroupModal() {
        const modal = this.createManageGroupModal();
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    }

    // 创建管理分组弹窗
    createManageGroupModal() {
        const modal = document.createElement('div');
        modal.className = 'manage-group-modal';
        modal.innerHTML = `
            <div class="manage-group-content">
                <h2 class="modal-title">管理分组</h2>
                
                <!-- 添加分组 -->
                <div class="add-group-input-wrapper">
                    <input type="text" class="form-input add-group-input" 
                           id="newGroupNameInput" placeholder="输入新分组名称">
                    <button class="modal-btn-confirm" onclick="friendList.addNewGroup()" 
                            style="padding: 12px 20px; border-radius: 8px;">
                        添加
                    </button>
                </div>

                <!-- 分组列表 -->
                <div class="group-list">
                    ${this.renderGroupList()}
                </div>

                <!-- 关闭按钮 -->
                <button class="modal-btn modal-btn-cancel" onclick="friendList.closeModal(this)">
                    关闭
                </button>
            </div>
        `;
        return modal;
    }

    // 渲染分组列表
    renderGroupList() {
        const groups = storageManager.getAllGroups();
        
        return groups.map(group => `
            <div class="group-item">
                <span class="group-item-name">
                    ${group.name}
                    ${group.isDefault ? '<span style="font-size: 12px; color: #667eea;">(默认)</span>' : ''}
                </span>
                <div class="group-item-actions">
                    <button class="group-action-btn" onclick="friendList.renameGroup('${group.id}')">
                        重命名
                    </button>
                    ${!group.isDefault ? `
                        <button class="group-action-btn danger" onclick="friendList.deleteGroup('${group.id}')">
                            删除
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // 添加新分组
    addNewGroup() {
        const input = document.getElementById('newGroupNameInput');
        const name = input.value.trim();

        if (!name) {
            alert('请输入分组名称');
            return;
        }

        const result = storageManager.addGroup(name);
        
        if (result.success) {
            input.value = '';
            // 刷新分组列表
            const list = document.querySelector('.group-list');
            if (list) {
                list.innerHTML = this.renderGroupList();
            }
            // 刷新好友列表
            this.renderFriendList();
        } else {
            alert(result.message || '添加失败');
        }
    }

    // 重命名分组
    renameGroup(groupId) {
        const newName = prompt('请输入新的分组名称:');
        if (!newName) return;

        const result = storageManager.renameGroup(groupId, newName.trim());
        
        if (result.success) {
            // 刷新分组列表
            const list = document.querySelector('.group-list');
            if (list) {
                list.innerHTML = this.renderGroupList();
            }
            // 刷新好友列表
            this.renderFriendList();
        } else {
            alert(result.message || '重命名失败');
        }
    }

    // 删除分组
    deleteGroup(groupId) {
        if (!confirm('确定删除该分组吗？\n分组内的好友将移至默认分组')) {
            return;
        }

        const result = storageManager.deleteGroup(groupId);
        
        if (result.success) {
            // 刷新分组列表
            const list = document.querySelector('.group-list');
            if (list) {
                list.innerHTML = this.renderGroupList();
            }
            // 刷新好友列表
            this.renderFriendList();
        } else {
            alert(result.message || '删除失败');
        }
    }

    // ==================== 打开好友详情 ====================

    openFriendDetail(friendId) {
        // 暂时用alert，后面会实现详情页
        const friend = storageManager.getFriend(friendId);
        if (friend) {
            alert(`打开好友详情:\n${friend.remark || friend.nickname}\n编码: ${friend.friendCode}`);
        }
    }
}

// 创建全局实例
let friendList;

// 初始化（在页面加载完成后调用）
function initFriendList() {
    if (!friendList) {
        friendList = new FriendList();
    }
    return friendList;
}
