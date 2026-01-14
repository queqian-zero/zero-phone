// ==================== 好友列表UI管理器 ====================
/**
 * FriendListUI - 好友列表界面渲染和交互
 * 负责: 渲染好友列表、处理点击/长按、显示添加好友弹窗
 */

class FriendListUI {
    constructor(friendManager, storage) {
        this.friendManager = friendManager;
        this.storage = storage;
        
        // DOM元素
        this.container = null;
        this.addFriendBtn = null;
        this.manageGroupBtn = null;
        
        // 长按计时器
        this.longPressTimer = null;
        this.longPressDelay = 500; // 500ms判定为长按
        
        this.init();
    }

    // ==================== 初始化 ====================
    
    init() {
        // 获取DOM元素
        this.container = document.querySelector('.friend-list-container');
        this.addFriendBtn = document.querySelector('.add-friend-btn');
        this.manageGroupBtn = document.querySelector('.manage-group-btn');
        
        if (!this.container) {
            console.error('❌ 找不到 .friend-list-container');
            return;
        }
        
        // 绑定事件
        this.bindEvents();
        
        // 渲染列表
        this.render();
        
        console.log('✅ FriendListUI initialized');
    }

    // ==================== 事件绑定 ====================
    
    bindEvents() {
        // 添加好友按钮
        if (this.addFriendBtn) {
            this.addFriendBtn.addEventListener('click', () => {
                this.showAddFriendModal();
            });
        }
        
        // 管理分组按钮
        if (this.manageGroupBtn) {
            this.manageGroupBtn.addEventListener('click', () => {
                this.showManageGroupModal();
            });
        }
    }

    // ==================== 渲染好友列表 ====================
    
    render() {
        if (!this.container) return;
        
        const groups = this.storage.getAllGroups();
        const friends = this.friendManager.getAllFriends();
        
        // 如果没有好友，显示空状态
        if (friends.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        // 按分组渲染
        let html = '';
        
        groups.forEach(group => {
            const groupFriends = friends.filter(f => f.groupId === group.id);
            
            if (groupFriends.length > 0) {
                html += this.renderGroup(group, groupFriends);
            }
        });
        
        this.container.innerHTML = html;
        
        // 绑定好友项的事件
        this.bindFriendItemEvents();
    }

    // 渲染空状态
    renderEmptyState() {
        this.container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <div class="empty-text">暂无好友</div>
                <div class="empty-hint">点击右上角添加好友</div>
            </div>
        `;
    }

    // 渲染一个分组
    renderGroup(group, friends) {
        const collapsedClass = group.collapsed ? 'collapsed' : '';
        
        return `
            <div class="friend-group ${collapsedClass}" data-group-id="${group.id}">
                <div class="group-header" data-group-id="${group.id}">
                    <span class="group-name">${group.name}</span>
                    <span class="group-count">${friends.length}</span>
                    <span class="group-arrow">›</span>
                </div>
                <div class="group-content">
                    ${friends.map(friend => this.renderFriendItem(friend)).join('')}
                </div>
            </div>
        `;
    }

    // 渲染一个好友项
    renderFriendItem(friend) {
        const displayName = friend.nickname || friend.name;
        const avatarHtml = friend.avatar 
            ? `<img src="${friend.avatar}" alt="${displayName}">` 
            : `<div class="avatar-placeholder">${displayName.charAt(0)}</div>`;
        
        return `
            <div class="friend-item" data-friend-code="${friend.code}">
                <div class="friend-avatar">
                    ${avatarHtml}
                </div>
                <div class="friend-info">
                    <div class="friend-name">${displayName}</div>
                    <div class="friend-signature">${friend.signature || '这个人很懒，什么都没写'}</div>
                </div>
            </div>
        `;
    }

    // ==================== 好友项事件 ====================
    
    bindFriendItemEvents() {
        const friendItems = this.container.querySelectorAll('.friend-item');
        
        friendItems.forEach(item => {
            const friendCode = item.dataset.friendCode;
            
            // 触摸开始（长按检测）
            item.addEventListener('touchstart', (e) => {
                this.handleTouchStart(e, friendCode);
            });
            
            // 触摸结束
            item.addEventListener('touchend', (e) => {
                this.handleTouchEnd(e, friendCode);
            });
            
            // 触摸移动（取消长按）
            item.addEventListener('touchmove', () => {
                this.cancelLongPress();
            });
            
            // 点击（PC端备用）
            item.addEventListener('click', (e) => {
                if (!this.longPressTimer) {
                    this.handleFriendClick(friendCode);
                }
            });
        });
        
        // 分组折叠
        const groupHeaders = this.container.querySelectorAll('.group-header');
        groupHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                this.toggleGroup(header.dataset.groupId);
            });
        });
    }

    // 触摸开始
    handleTouchStart(e, friendCode) {
        // 添加点击反馈动画
        e.currentTarget.classList.add('pressing');
        
        // 开始长按计时
        this.longPressTimer = setTimeout(() => {
            // 触发震动反馈（如果支持）
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            // 长按事件：编辑好友
            this.handleFriendLongPress(friendCode);
            
            this.longPressTimer = null;
        }, this.longPressDelay);
    }

    // 触摸结束
    handleTouchEnd(e, friendCode) {
        // 移除点击反馈
        e.currentTarget.classList.remove('pressing');
        
        if (this.longPressTimer) {
            // 短按：跳转聊天
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
            this.handleFriendClick(friendCode);
        }
    }

    // 取消长按
    cancelLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    // 点击好友（跳转聊天）
    handleFriendClick(friendCode) {
        const friend = this.friendManager.getFriendByCode(friendCode);
        if (!friend) return;
        
        showToast(`💬 进入与 ${friend.nickname || friend.name} 的聊天`, 'info');
        
        // TODO: 跳转到聊天界面
        // 目前只是提示，等聊天界面完成后再实现
        console.log('跳转聊天:', friendCode);
    }

    // 长按好友（编辑）
    handleFriendLongPress(friendCode) {
        const friend = this.friendManager.getFriendByCode(friendCode);
        if (!friend) return;
        
        showToast(`✏️ 编辑 ${friend.nickname || friend.name}`, 'info');
        
        // 显示编辑弹窗
        this.showEditFriendModal(friend);
    }

    // 折叠/展开分组
    toggleGroup(groupId) {
        const groupEl = this.container.querySelector(`.friend-group[data-group-id="${groupId}"]`);
        if (!groupEl) return;
        
        groupEl.classList.toggle('collapsed');
        
        // 保存状态
        const groups = this.storage.getAllGroups();
        const group = groups.find(g => g.id === groupId);
        if (group) {
            group.collapsed = groupEl.classList.contains('collapsed');
            this.storage.setData(this.storage.KEYS.GROUPS, groups);
        }
    }

    // ==================== 弹窗 ====================
    
    // 显示添加好友弹窗
    showAddFriendModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>添加好友</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>网名 *</label>
                        <input type="text" id="friend-name" placeholder="请输入网名" />
                    </div>
                    <div class="form-group">
                        <label>人设 *</label>
                        <textarea id="friend-persona" rows="6" placeholder="请输入人设（大框框，随便写）"></textarea>
                    </div>
                    <div class="form-group">
                        <label>个性签名</label>
                        <input type="text" id="friend-signature" placeholder="可选" />
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel">取消</button>
                    <button class="btn-confirm">确定</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定事件
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.btn-cancel');
        const confirmBtn = modal.querySelector('.btn-confirm');
        
        const closeModal = () => {
            modal.classList.add('fade-out');
            setTimeout(() => modal.remove(), 300);
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        confirmBtn.addEventListener('click', () => {
            const name = document.getElementById('friend-name').value;
            const persona = document.getElementById('friend-persona').value;
            const signature = document.getElementById('friend-signature').value;
            
            const friend = this.friendManager.createFriend({
                name,
                persona,
                signature
            });
            
            if (friend) {
                closeModal();
                this.render(); // 重新渲染列表
            }
        });
        
        // 显示动画
        setTimeout(() => modal.classList.add('show'), 10);
    }

    // 显示编辑好友弹窗
    showEditFriendModal(friend) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>编辑好友</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>网名</label>
                        <input type="text" id="edit-friend-name" value="${friend.name}" />
                    </div>
                    <div class="form-group">
                        <label>备注</label>
                        <input type="text" id="edit-friend-nickname" value="${friend.nickname || ''}" placeholder="可选" />
                    </div>
                    <div class="form-group">
                        <label>人设</label>
                        <textarea id="edit-friend-persona" rows="6">${friend.persona}</textarea>
                    </div>
                    <div class="form-group">
                        <label>个性签名</label>
                        <input type="text" id="edit-friend-signature" value="${friend.signature || ''}" placeholder="可选" />
                    </div>
                    <div class="form-group">
                        <label>拍一拍</label>
                        <input type="text" id="edit-friend-poke" value="${friend.poke}" />
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-delete">删除好友</button>
                    <div style="flex: 1;"></div>
                    <button class="btn-cancel">取消</button>
                    <button class="btn-confirm">保存</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定事件
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.btn-cancel');
        const confirmBtn = modal.querySelector('.btn-confirm');
        const deleteBtn = modal.querySelector('.btn-delete');
        
        const closeModal = () => {
            modal.classList.add('fade-out');
            setTimeout(() => modal.remove(), 300);
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        confirmBtn.addEventListener('click', () => {
            const updates = {
                name: document.getElementById('edit-friend-name').value,
                nickname: document.getElementById('edit-friend-nickname').value,
                persona: document.getElementById('edit-friend-persona').value,
                signature: document.getElementById('edit-friend-signature').value,
                poke: document.getElementById('edit-friend-poke').value
            };
            
            const success = this.friendManager.updateFriend(friend.code, updates);
            
            if (success) {
                closeModal();
                this.render();
            }
        });
        
        deleteBtn.addEventListener('click', () => {
            // 删除确认（简化版，直接删除）
            const success = this.friendManager.deleteFriend(friend.code, true);
            if (success) {
                closeModal();
                this.render();
            }
        });
        
        setTimeout(() => modal.classList.add('show'), 10);
    }

    // 显示管理分组弹窗
    showManageGroupModal() {
        showToast('⚠️ 分组管理功能暂未实现', 'warning');
        // TODO: 后续实现
    }
}

// 暴露到window
window.FriendListUI = FriendListUI;

// 全局实例（会在chat-app.js中创建）
let friendListUI = null;
