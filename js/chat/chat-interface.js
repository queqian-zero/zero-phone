/* Chat Interface - 聊天界面逻辑 */

class ChatInterface {
    constructor(chatApp) {
        this.chatApp = chatApp;
        this.storage = chatApp.storage;
        this.currentFriendCode = null;
        this.currentFriend = null; // ← 新增：保存当前好友完整信息
        this.messages = [];
        this.isExpanded = false;
        this.isMenuOpen = false;
        this.eventsBound = false;
        this.originalFriendName = null;
        this.init();
    }
    
    init() {
        console.log('🚀 ChatInterface init() 开始');
        // 绑定事件
        this.bindEvents();
        console.log('✅ ChatInterface 初始化完成');
    }
    
    // 绑定事件
    bindEvents() {
        if (this.eventsBound) {
            console.log('⚠️ 事件已绑定，跳过');
            return;
        }
        
        console.log('🔗 开始绑定事件...');
        
        // 返回按钮
        const chatBackBtn = document.getElementById('chatBackBtn');
        if (chatBackBtn) {
            chatBackBtn.addEventListener('click', () => {
                console.log('🔙 点击返回按钮');
                this.closeChatInterface();
            });
        }
        
        // 好友名点击 - 显示状态
        const chatFriendName = document.getElementById('chatFriendName');
        if (chatFriendName) {
            chatFriendName.addEventListener('click', () => {
                console.log('👤 点击好友名');
                this.toggleStatusModal();
            });
        }
        
        // 线下模式切换
        const offlineToggle = document.getElementById('offlineToggle');
        if (offlineToggle) {
            offlineToggle.addEventListener('click', (e) => {
                console.log('🔴 点击线下模式');
                e.target.classList.toggle('active');
                alert('线下模式功能开发中...');
            });
        }
        
        // 聊天设置
        const chatSettingsBtn = document.getElementById('chatSettingsBtn');
        if (chatSettingsBtn) {
            chatSettingsBtn.addEventListener('click', () => {
                console.log('⚙️ 点击聊天设置');
                alert('聊天设置功能开发中...');
            });
        }
        
        // Token统计展开
        const tokenDisplay = document.getElementById('tokenDisplay');
        if (tokenDisplay) {
            tokenDisplay.addEventListener('click', () => {
                console.log('📊 点击Token统计');
                this.toggleTokenDetails();
            });
        }
        
        // 菜单按钮
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                console.log('☰ 点击菜单按钮');
                this.toggleMenu();
            });
        }
        
        // 输入框展开（展开输入框内的按钮）
        const expandBtn = document.getElementById('expandBtn');
        if (expandBtn) {
            expandBtn.addEventListener('click', () => {
                console.log('⬇ 点击收起按钮');
                this.toggleExpand();
            });
        }
        
        // 底部行的展开按钮
        const inlineExpandBtn = document.getElementById('inlineExpandBtn');
        if (inlineExpandBtn) {
            inlineExpandBtn.addEventListener('click', () => {
                console.log('⬆ 点击底部行展开按钮');
                this.toggleExpand();
            });
        }
        
        // 展开输入框自动调整高度和事件
        const inputField = document.getElementById('inputField');
        if (inputField) {
            inputField.addEventListener('input', () => {
                this.autoResizeInput(inputField);
            });
            
            // Enter键发送（普通模式）/ 换行（展开模式）
            inputField.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    if (this.isExpanded) {
                        // 展开模式：允许换行
                        return;
                    } else {
                        // 普通模式：发送消息
                        e.preventDefault();
                        console.log('⏎ 按下Enter键发送');
                        this.sendUserMessage();
                    }
                }
            });
        }
        
        // 底部行输入框事件
        const inputFieldInline = document.getElementById('inputFieldInline');
        if (inputFieldInline) {
            // Enter键发送
            inputFieldInline.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    console.log('⏎ 按下Enter键发送');
                    this.sendUserMessage();
                }
            });
        }
        
        // 发送按钮
        const userSendBtn = document.getElementById('userSendBtn');
        if (userSendBtn) {
            userSendBtn.addEventListener('click', () => {
                console.log('📤 点击用户发送按钮');
                this.sendUserMessage();
            });
        }
        
        const aiSendBtn = document.getElementById('aiSendBtn');
        if (aiSendBtn) {
            aiSendBtn.addEventListener('click', () => {
                console.log('🤖 点击AI发送按钮');
                this.sendAIMessage();
            });
        }
        
        // 菜单项
        this.bindMenuItems();
        
        this.eventsBound = true;
        console.log('✅ 所有事件绑定完成');
    }
    
    // 绑定菜单项
    bindMenuItems() {
        const menuItems = {
            'menuResay': '🔄 重说',
            'menuEmoji': '😊 表情',
            'menuImage': '📷 图片',
            'menuVideo': '🎥 视频',
            'menuVoice': '🎤 语音',
            'menuFile': '📁 文件'
        };
        
        Object.keys(menuItems).forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    console.log(`点击${menuItems[id]}`);
                    alert(`${menuItems[id]}功能开发中...`);
                });
            }
        });
        
        // 占位符提示
        document.querySelectorAll('.menu-placeholder').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('点击占位符按钮');
                alert('该功能将在后续版本开放...');
            });
        });
    }
    
    // ==================== 加载聊天 ====================
    
    loadChat(friendCode) {
        console.log('📖 加载聊天:', friendCode);
        this.currentFriendCode = friendCode;
        
        // 获取好友完整信息
        const friend = this.storage.getFriendByCode(friendCode);
        
        if (!friend) {
            console.error('❌ 找不到好友信息');
            alert('❌ 找不到好友信息');
            this.closeChatInterface();
            return;
        }
        
        // ← 保存好友完整信息
        this.currentFriend = friend;
        console.log('👤 好友完整信息:', friend);
        
        // 设置好友名称
        const displayName = friend.nickname || friend.name;
        const nameEl = document.querySelector('#chatFriendName span');
        if (nameEl) {
            nameEl.textContent = displayName;
            this.originalFriendName = displayName;
            console.log('✅ 设置好友名称:', displayName);
        }
        
        // 加载聊天记录
        const chat = this.storage.getChatByFriendCode(friendCode);
        
        if (chat && chat.messages) {
            console.log('📜 加载历史消息:', chat.messages.length, '条');
            this.messages = chat.messages;
            this.renderMessages();
            
            // ← 更新Token统计（使用真实数据）
            if (chat.tokenStats) {
                this.updateTokenStatsFromStorage(chat.tokenStats);
            }
        } else {
            console.log('🆕 新聊天，添加欢迎消息');
            this.messages = [];
            this.addWelcomeMessage(friend);
        }
        
        // 滚动到底部
        setTimeout(() => this.scrollToBottom(), 100);
    }
    
    // 添加欢迎消息
    addWelcomeMessage(friend) {
        console.log('👋 添加欢迎消息');
        this.addMessage({
            type: 'ai',
            text: `你好！我是 ${friend.name}。很高兴认识你！`,
            timestamp: new Date().toISOString()
        });
    }
    
    // 渲染所有消息
    renderMessages() {
        console.log('🎨 渲染所有消息:', this.messages.length, '条');
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) {
            console.error('❌ 找不到 messagesList 元素');
            return;
        }
        
        messagesList.innerHTML = '';
        
        this.messages.forEach((msg, index) => {
            console.log(`  渲染消息 ${index + 1}:`, msg.type, msg.text.substring(0, 20));
            const messageEl = this.createMessageElement(msg);
            messagesList.appendChild(messageEl);
        });
        
        console.log('✅ 消息渲染完成');
    }
    
    // 关闭聊天界面
    closeChatInterface() {
        console.log('🔙 关闭聊天界面');
        
        // 显示底部导航
        document.querySelector('.bottom-nav').style.display = 'flex';
        
        // 显示顶部导航
        document.querySelector('.top-bar').style.display = 'flex';
        
        // 切换回好友列表
        this.chatApp.switchPage('friendListPage');
        
        // 清空输入框
        const inputField = document.getElementById('inputField');
        const inputFieldInline = document.getElementById('inputFieldInline');
        if (inputField) {
            inputField.value = '';
        }
        if (inputFieldInline) {
            inputFieldInline.value = '';
        }
        
        // 重置状态
        this.currentFriendCode = null;
        this.currentFriend = null; // ← 清空好友信息
        this.messages = [];
        this.originalFriendName = null;
        
        const messagesList = document.getElementById('messagesList');
        if (messagesList) {
            messagesList.innerHTML = '';
        }
    }
    
    // ==================== Token统计 ====================
    
    toggleTokenDetails() {
        const display = document.getElementById('tokenDisplay');
        const details = document.getElementById('tokenDetails');
        
        if (!display || !details) return;
        
        if (details.style.display === 'none') {
            display.classList.add('expanded');
            details.style.display = 'block';
            console.log('📊 展开Token详情');
        } else {
            display.classList.remove('expanded');
            details.style.display = 'none';
            console.log('📊 收起Token详情');
        }
    }
    
    // ← 新增：从storage更新Token统计
    updateTokenStatsFromStorage(tokenStats) {
        console.log('📊 从storage更新Token统计:', tokenStats);
        
        const elements = {
            'tokenTotal': tokenStats.total || 0,
            'tokenWorldbook': tokenStats.worldBook || 0,
            'tokenPersona': tokenStats.persona || 0,
            'tokenInput': tokenStats.input || 0,
            'tokenOutput': tokenStats.output || 0
        };
        
        Object.keys(elements).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = elements[id];
            }
        });
        
        // 更新显示
        const displayEl = document.querySelector('#tokenDisplay span');
        if (displayEl) {
            displayEl.textContent = `Token: ${tokenStats.total || 0}`;
        }
    }
    
    updateTokenStats() {
        // 模拟Token统计（临时用，后面会被真实数据替代）
        const total = this.messages.length * 100;
        
        const elements = {
            'tokenTotal': total,
            'tokenWorldbook': Math.floor(total * 0.1),
            'tokenPersona': Math.floor(total * 0.3),
            'tokenInput': Math.floor(total * 0.4),
            'tokenOutput': Math.floor(total * 0.2)
        };
        
        Object.keys(elements).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = elements[id];
            }
        });
        
        // 更新显示
        const displayEl = document.querySelector('#tokenDisplay span');
        if (displayEl) {
            displayEl.textContent = `Token: ${total}`;
        }
    }
    
    // ==================== 状态弹窗 ====================
    
    toggleStatusModal() {
        const modal = document.getElementById('statusModal');
        if (!modal) return;
        
        if (modal.style.display === 'none') {
            this.showStatusModal();
        } else {
            this.hideStatusModal();
        }
    }
    
    showStatusModal() {
        const modal = document.getElementById('statusModal');
        if (!modal) return;
        
        modal.style.display = 'block';
        
        // ← 使用真实数据（如果有的话）
        const data = {
            'statusOutfit': this.currentFriend?.currentOutfit || '休闲装',
            'statusAction': this.currentFriend?.currentAction || '正在看书',
            'statusMood': this.currentFriend?.currentMood || '心情不错',
            'statusLocation': this.currentFriend?.currentLocation || '家里的书房'
        };
        
        Object.keys(data).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = data[id];
            }
        });
    }
    
    hideStatusModal() {
        const modal = document.getElementById('statusModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    // ==================== 菜单 ====================
    
    toggleMenu() {
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }
    
    openMenu() {
        const menuPanel = document.getElementById('menuPanel');
        if (menuPanel) {
            menuPanel.style.display = 'block';
            this.isMenuOpen = true;
            console.log('☰ 打开菜单');
        }
    }
    
    closeMenu() {
        const menuPanel = document.getElementById('menuPanel');
        if (menuPanel) {
            menuPanel.style.display = 'none';
            this.isMenuOpen = false;
            console.log('☰ 关闭菜单');
        }
    }
    
    // ==================== 输入框 ====================
    
    toggleExpand() {
        const inputBar = document.getElementById('inputBar');
        const inputField = document.getElementById('inputField');
        const inputFieldInline = document.getElementById('inputFieldInline');
        
        if (!inputBar) return;
        
        if (this.isExpanded) {
            // 收起：将展开输入框的内容复制到底部行输入框
            if (inputField && inputFieldInline) {
                inputFieldInline.value = inputField.value;
            }
            inputBar.classList.remove('expanded');
            this.isExpanded = false;
            console.log('⬇ 收起输入框');
        } else {
            // 展开：将底部行输入框的内容复制到展开输入框
            if (inputField && inputFieldInline) {
                inputField.value = inputFieldInline.value;
                inputField.focus();
            }
            inputBar.classList.add('expanded');
            this.isExpanded = true;
            console.log('⬆ 展开输入框');
        }
    }
    
    autoResizeInput(textarea) {
        if (!this.isExpanded) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
        }
    }
    
    // ==================== 发送消息 ====================
    
    sendUserMessage() {
        console.log('📤 sendUserMessage() 被调用');
        
        // 获取当前激活的输入框
        const inputField = document.getElementById('inputField');
        const inputFieldInline = document.getElementById('inputFieldInline');
        
        let text = '';
        
        // 如果是展开状态，从展开输入框取值；否则从底部行输入框取值
        if (this.isExpanded && inputField) {
            text = inputField.value.trim();
        } else if (inputFieldInline) {
            text = inputFieldInline.value.trim();
        }
        
        console.log('📝 输入内容:', text);
        
        if (!text) {
            console.log('⚠️ 输入为空，不发送');
            return;
        }
        
        // 添加消息
        console.log('➕ 添加用户消息到列表');
        this.addMessage({
            type: 'user',
            text: text,
            timestamp: new Date().toISOString()
        });
        
        // 保存到存储
        console.log('💾 保存消息到存储');
        this.storage.addMessage(this.currentFriendCode, {
            type: 'user',
            text: text,
            timestamp: new Date().toISOString()
        });
        
        // 清空两个输入框
        if (inputField) {
            inputField.value = '';
            inputField.style.height = 'auto';
        }
        if (inputFieldInline) {
            inputFieldInline.value = '';
        }
        console.log('🧹 清空输入框');
        
        // 收起展开的输入框
        if (this.isExpanded) {
            this.toggleExpand();
        }
        
        // 关闭菜单
        this.closeMenu();
        
        // 滚动到底部
        this.scrollToBottom();
    }
    
    sendAIMessage() {
        console.log('🤖 sendAIMessage() 被调用');
        
        // 显示正在输入
        this.showTypingIndicator();
        
        // 模拟AI回复（后面会接API）
        setTimeout(() => {
            this.hideTypingIndicator();
            
            console.log('➕ 添加AI消息到列表');
            this.addMessage({
                type: 'ai',
                text: '这是AI的回复示例。后面会接入真实的API。',
                timestamp: new Date().toISOString()
            });
            
            // 保存到存储
            console.log('💾 保存AI消息到存储');
            this.storage.addMessage(this.currentFriendCode, {
                type: 'ai',
                text: '这是AI的回复示例。后面会接入真实的API。',
                timestamp: new Date().toISOString()
            });
            
            this.scrollToBottom();
        }, 1500);
    }
    
    showTypingIndicator() {
        const nameEl = document.querySelector('#chatFriendName span');
        if (nameEl) {
            // 保存原始名称
            if (!this.originalFriendName) {
                this.originalFriendName = nameEl.textContent;
            }
            nameEl.textContent = '突破次元遇见你…';
            console.log('💬 显示正在输入提示');
        }
    }
    
    hideTypingIndicator() {
        const nameEl = document.querySelector('#chatFriendName span');
        if (nameEl && this.originalFriendName) {
            nameEl.textContent = this.originalFriendName;
            console.log('💬 恢复好友名称');
        }
    }
    
    // ==================== 消息渲染 ====================
    
    addMessage(message) {
        console.log('➕ addMessage() 被调用:', message.type, message.text.substring(0, 20));
        
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) {
            console.error('❌ 找不到 messagesList 元素');
            return;
        }
        
        const messageEl = this.createMessageElement(message);
        messagesList.appendChild(messageEl);
        console.log('✅ 消息元素已添加到DOM');
        
        // 保存到消息列表
        this.messages.push(message);
        
        // 更新Token统计
        this.updateTokenStats();
    }
    
    // ← 修改：显示真实头像和优化时间
    createMessageElement(message) {
        const div = document.createElement('div');
        div.className = `message message-${message.type}`;
        
        // 使用智能时间格式化
        const time = this.formatTimeAdvanced(new Date(message.timestamp));
        
        // 头像HTML
        let avatarHTML = '';
        if (message.type === 'ai') {
            // AI消息：显示好友头像
            if (this.currentFriend && this.currentFriend.avatar) {
                avatarHTML = `<img src="${this.currentFriend.avatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" alt="头像">`;
            } else if (this.currentFriend) {
                // 没有头像就显示首字母
                avatarHTML = `<div class="avatar-placeholder">${this.currentFriend.name.charAt(0)}</div>`;
            } else {
                avatarHTML = `<div class="avatar-placeholder">AI</div>`;
            }
        } else {
            // 用户消息：显示"我"（后面可以改成用户自己的头像）
            avatarHTML = `<div class="avatar-placeholder">我</div>`;
        }
        
        div.innerHTML = `
            <div class="message-avatar">
                ${avatarHTML}
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="message-text">${this.escapeHtml(message.text)}</div>
                </div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        console.log('🎨 创建消息元素:', message.type);
        return div;
    }
    
    // ← 原有的时间格式化（保留作为备用）
    formatTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    
    // ← 新增：智能时间格式化
    formatTimeAdvanced(date) {
        const now = new Date();
        const diff = now - date; // 时间差（毫秒）
        
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;
        
        // 今天：只显示时间
        if (this.isToday(date)) {
            return timeStr;
        }
        
        // 昨天
        if (this.isYesterday(date)) {
            return `昨天 ${timeStr}`;
        }
        
        // 今年：显示 月-日 时:分
        if (date.getFullYear() === now.getFullYear()) {
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${month}-${day} ${timeStr}`;
        }
        
        // 更早：显示 年-月-日 时:分
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day} ${timeStr}`;
    }
    
    // ← 新增：判断是否是今天
    isToday(date) {
        const now = new Date();
        return date.getDate() === now.getDate() &&
               date.getMonth() === now.getMonth() &&
               date.getFullYear() === now.getFullYear();
    }
    
    // ← 新增：判断是否是昨天
    isYesterday(date) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return date.getDate() === yesterday.getDate() &&
               date.getMonth() === yesterday.getMonth() &&
               date.getFullYear() === yesterday.getFullYear();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        if (container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
                console.log('📜 滚动到底部');
            }, 100);
        }
    }
}

// 导出
window.ChatInterface = ChatInterface;
console.log('✅ ChatInterface 类已加载');