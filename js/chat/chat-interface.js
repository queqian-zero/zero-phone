/* Chat Interface - 聊天界面逻辑 */

class ChatInterface {
    constructor(chatApp) {
    this.chatApp = chatApp;
    this.storage = chatApp.storage;
    this.apiManager = new APIManager();
    this.currentFriendCode = null;
    this.currentFriend = null;
    this.messages = [];
    this.isExpanded = false;
    this.isMenuOpen = false;
    this.eventsBound = false;
    this.originalFriendName = null;
    
    // 设置相关
    this.settings = {
        aiRecognizeImage: true,
        chatPin: false,
        hideToken: false,
        autoSummary: true,           // ← 新增：自动总结开关
        summaryInterval: 20          // ← 新增：每20条总结一次
    };
    
    this.init();
}
    
    init() {
        console.log('🚀 ChatInterface init() 开始');
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
                this.openChatSettings();
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
            
            inputField.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    if (this.isExpanded) {
                        return;
                    } else {
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
        
        const friend = this.storage.getFriendByCode(friendCode);
        
        if (!friend) {
            console.error('❌ 找不到好友信息');
            alert('❌ 找不到好友信息');
            this.closeChatInterface();
            return;
        }
        
        this.currentFriend = friend;
        console.log('👤 好友完整信息:', friend);
        
        const displayName = friend.nickname || friend.name;
        const nameEl = document.querySelector('#chatFriendName span');
        if (nameEl) {
            nameEl.textContent = displayName;
            this.originalFriendName = displayName;
            console.log('✅ 设置好友名称:', displayName);
        }
        
        const chat = this.storage.getChatByFriendCode(friendCode);
        
        if (chat && chat.messages) {
            console.log('📜 加载历史消息:', chat.messages.length, '条');
            this.messages = chat.messages;
            this.renderMessages();
            
            if (chat.tokenStats) {
                this.updateTokenStatsFromStorage(chat.tokenStats);
            }
        } else {
            console.log('🆕 新聊天，添加欢迎消息');
            this.messages = [];
            this.addWelcomeMessage(friend);
        }
        
        this.loadSettings();
        
        setTimeout(() => this.scrollToBottom(), 100);
    }

    addWelcomeMessage(friend) {
        console.log('👋 添加欢迎消息');
        this.addMessage({
            type: 'ai',
            text: `你好！我是 ${friend.name}。很高兴认识你！`,
            timestamp: new Date().toISOString()
        });
    }
    
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
    
    closeChatInterface() {
        console.log('🔙 关闭聊天界面');
        
        document.querySelector('.bottom-nav').style.display = 'flex';
        document.querySelector('.top-bar').style.display = 'flex';
        
        this.chatApp.switchPage('friendListPage');
        
        const inputField = document.getElementById('inputField');
        const inputFieldInline = document.getElementById('inputFieldInline');
        if (inputField) {
            inputField.value = '';
        }
        if (inputFieldInline) {
            inputFieldInline.value = '';
        }
        
        this.currentFriendCode = null;
        this.currentFriend = null;
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
        
        const displayEl = document.querySelector('#tokenDisplay span');
        if (displayEl) {
            displayEl.textContent = `Token: ${tokenStats.total || 0}`;
        }
    }
    
    updateTokenStatsFromAPI(tokens) {
        console.log('📊 从API更新Token统计:', tokens);
        
        const chat = this.storage.getChatByFriendCode(this.currentFriendCode);
        const currentStats = chat?.tokenStats || {
            worldBook: 0,
            persona: 0,
            chatHistory: 0,
            input: 0,
            output: 0,
            total: 0
        };
        
        const updatedStats = {
            worldBook: currentStats.worldBook,
            persona: currentStats.persona,
            chatHistory: currentStats.chatHistory,
            input: currentStats.input + (tokens.input || 0),
            output: currentStats.output + (tokens.output || 0),
            total: currentStats.total + (tokens.total || 0),
            lastUpdate: new Date().toISOString()
        };
        
        this.storage.updateTokenStats(this.currentFriendCode, updatedStats);
        this.updateTokenStatsFromStorage(updatedStats);
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
            if (inputField && inputFieldInline) {
                inputFieldInline.value = inputField.value;
            }
            inputBar.classList.remove('expanded');
            this.isExpanded = false;
            console.log('⬇ 收起输入框');
        } else {
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
        
        const inputField = document.getElementById('inputField');
        const inputFieldInline = document.getElementById('inputFieldInline');
        
        let text = '';
        
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
        
        console.log('➕ 添加用户消息到列表');
        this.addMessage({
            type: 'user',
            text: text,
            timestamp: new Date().toISOString()
        });
        
        console.log('💾 保存消息到存储');
        this.storage.addMessage(this.currentFriendCode, {
            type: 'user',
            text: text,
            timestamp: new Date().toISOString()
        });
        
        if (inputField) {
            inputField.value = '';
            inputField.style.height = 'auto';
        }
        if (inputFieldInline) {
            inputFieldInline.value = '';
        }
        console.log('🧹 清空输入框');
        
        if (this.isExpanded) {
            this.toggleExpand();
        }
        
        this.closeMenu();
        this.scrollToBottom();
    }
    
    async sendAIMessage() {
        console.log('🤖 sendAIMessage() 被调用');
        
        this.showTypingIndicator();
        
        try {
            const maxMessages = 20;
            const recentMessages = this.messages.slice(-maxMessages);
            
            console.log('📜 准备发送的消息历史:', recentMessages.length, '条');
            
            const systemPrompt = this.currentFriend?.persona || '';
            console.log('👤 人设:', systemPrompt.substring(0, 50), '...');
            
            console.log('🌐 开始调用API...');
            const result = await this.apiManager.callAI(recentMessages, systemPrompt);
            
            this.hideTypingIndicator();
            
            if (!result.success) {
                console.error('❌ API调用失败:', result.error);
                this.showErrorAlert(result.error);
                return;
            }
            
            console.log('✅ API调用成功');
            console.log('💬 AI回复:', result.text.substring(0, 50), '...');
            console.log('📊 Token统计:', result.tokens);
            
            this.addMessage({
                type: 'ai',
                text: result.text,
                timestamp: new Date().toISOString()
            });
            
            this.storage.addMessage(this.currentFriendCode, {
                type: 'ai',
                text: result.text,
                timestamp: new Date().toISOString()
            });
            
            if (result.tokens) {
                this.updateTokenStatsFromAPI(result.tokens);
            }
            
            this.scrollToBottom();
            
        } catch (e) {
            console.error('❌ 发送AI消息时出错:', e);
            this.hideTypingIndicator();
            this.showErrorAlert('发送失败\n\n' + e.message);
        }
    }
    
    showErrorAlert(errorMessage) {
        console.log('⚠️ 显示错误提示:', errorMessage);
        alert('❌ AI调用失败\n\n' + errorMessage);
    }
    
    showTypingIndicator() {
        const nameEl = document.querySelector('#chatFriendName span');
        if (nameEl) {
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
        
        this.messages.push(message);
    }
    
    createMessageElement(message) {
    const div = document.createElement('div');
    div.className = `message message-${message.type}`;
    
    const time = this.formatTimeAdvanced(new Date(message.timestamp));
    
    let avatarHTML = '';
    if (message.type === 'ai') {
        const friend = this.currentFriend || this.storage.getFriendByCode(this.currentFriendCode);
        
        if (friend && friend.avatar) {
            avatarHTML = `<img src="${friend.avatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" alt="头像">`;
        } else if (friend) {
            avatarHTML = `<div class="avatar-placeholder">${friend.name.charAt(0)}</div>`;
        } else {
            avatarHTML = `<div class="avatar-placeholder">AI</div>`;
        }
    } else {
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
    
    // ===== 新增：给头像添加双击事件 =====
    const avatarEl = div.querySelector('.message-avatar');
    if (avatarEl) {
        avatarEl.addEventListener('dblclick', () => {
            console.log('👆 双击头像');
            this.handlePoke(message.type);
        });
    }
    // ===== 新增结束 =====
    
    console.log('🎨 创建消息元素:', message.type);
    return div;
}
    
    formatTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    
    formatTimeAdvanced(date) {
        const now = new Date();
        
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}:${seconds}`;
        
        if (this.isToday(date)) {
            return timeStr;
        }
        
        if (this.isYesterday(date)) {
            return `昨天 ${timeStr}`;
        }
        
        if (date.getFullYear() === now.getFullYear()) {
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${month}-${day} ${timeStr}`;
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day} ${timeStr}`;
    }
    
    isToday(date) {
        const now = new Date();
        return date.getDate() === now.getDate() &&
               date.getMonth() === now.getMonth() &&
               date.getFullYear() === now.getFullYear();
    }
    
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
    
    // ==================== 聊天设置相关 ====================
    
    openChatSettings() {
        console.log('⚙️ 打开聊天设置');
        
        const settingsPage = document.getElementById('chatSettingsPage');
        if (settingsPage) {
            settingsPage.style.display = 'flex';
        }
        
        this.loadSettings();
        
        if (!this.settingsEventsBound) {
            this.bindSettingsEvents();
            this.settingsEventsBound = true;
        }
    }
    
    closeChatSettings() {
        console.log('⚙️ 关闭聊天设置');
        
        const settingsPage = document.getElementById('chatSettingsPage');
        if (settingsPage) {
            settingsPage.style.display = 'none';
        }
        
        this.saveSettings();
    }
    
    bindSettingsEvents() {
        console.log('🔗 绑定设置页面事件');
        
        const settingsBackBtn = document.getElementById('settingsBackBtn');
        if (settingsBackBtn) {
            settingsBackBtn.addEventListener('click', () => {
                this.closeChatSettings();
            });
        }
        
        const settingsDoneBtn = document.getElementById('settingsDoneBtn');
        if (settingsDoneBtn) {
            settingsDoneBtn.addEventListener('click', () => {
                this.closeChatSettings();
            });
        }
        
        const aiRecognizeSwitch = document.getElementById('settingAiRecognizeImage');
        if (aiRecognizeSwitch) {
            aiRecognizeSwitch.addEventListener('change', (e) => {
                this.settings.aiRecognizeImage = e.target.checked;
                console.log('AI识别图片:', this.settings.aiRecognizeImage);
                this.saveSettings();
            });
        }
        
        const searchChatBtn = document.getElementById('settingSearchChat');
        if (searchChatBtn) {
            searchChatBtn.addEventListener('click', () => {
                alert('搜索聊天记录功能开发中...');
            });
        }
        
        const chatPinSwitch = document.getElementById('settingChatPin');
        if (chatPinSwitch) {
            chatPinSwitch.addEventListener('change', (e) => {
                this.settings.chatPin = e.target.checked;
                console.log('聊天置顶:', this.settings.chatPin);
                this.saveSettings();
            });
        }
        
        const pokeItem = document.querySelector('.setting-item:has(#settingPokeValue)');
        if (pokeItem) {
            pokeItem.style.cursor = 'pointer';
            pokeItem.addEventListener('click', () => {
                this.editPoke();
            });
        }
        
        const hideTokenSwitch = document.getElementById('settingHideToken');
        if (hideTokenSwitch) {
            hideTokenSwitch.addEventListener('change', (e) => {
                this.settings.hideToken = e.target.checked;
                console.log('隐藏Token统计:', this.settings.hideToken);
                this.toggleTokenDisplay();
                this.saveSettings();
            });
        }
        
        const importDataBtn = document.getElementById('settingImportData');
        if (importDataBtn) {
            importDataBtn.addEventListener('click', () => {
                alert('导入数据功能开发中...');
            });
        }
        
        const exportDataBtn = document.getElementById('settingExportData');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                alert('导出数据功能开发中...');
            });
        }
    }
    
    loadSettings() {
        console.log('📥 加载聊天设置');
        
        if (!this.currentFriendCode) {
            console.warn('⚠️ 没有当前好友编码');
            return;
        }
        
        const savedSettings = this.storage.getChatSettings(this.currentFriendCode);
        
        if (savedSettings) {
            this.settings = { ...this.settings, ...savedSettings };
            console.log('✅ 加载的设置:', this.settings);
        } else {
            console.log('ℹ️ 使用默认设置');
        }
        
        this.applySettingsToUI();
    }
    
    saveSettings() {
        console.log('💾 保存聊天设置');
        
        if (!this.currentFriendCode) {
            console.warn('⚠️ 没有当前好友编码');
            return;
        }
        
        const success = this.storage.saveChatSettings(this.currentFriendCode, this.settings);
        
        if (success) {
            console.log('✅ 设置保存成功:', this.settings);
        } else {
            console.error('❌ 设置保存失败');
        }
    }
    
    applySettingsToUI() {
        console.log('🎨 应用设置到UI');
        
        const aiRecognizeSwitch = document.getElementById('settingAiRecognizeImage');
        if (aiRecognizeSwitch) {
            aiRecognizeSwitch.checked = this.settings.aiRecognizeImage;
        }
        
        const chatPinSwitch = document.getElementById('settingChatPin');
        if (chatPinSwitch) {
            chatPinSwitch.checked = this.settings.chatPin;
        }
        
        const hideTokenSwitch = document.getElementById('settingHideToken');
        if (hideTokenSwitch) {
            hideTokenSwitch.checked = this.settings.hideToken;
        }
        
        const pokeValue = document.getElementById('settingPokeValue');
        if (pokeValue && this.currentFriend) {
            pokeValue.textContent = this.currentFriend.poke || '戳了戳你';
        }
        
        this.toggleTokenDisplay();
    }
    
    toggleTokenDisplay() {
        const tokenStats = document.getElementById('tokenStats');
        if (tokenStats) {
            if (this.settings.hideToken) {
                tokenStats.style.display = 'none';
                console.log('🙈 隐藏Token统计');
            } else {
                tokenStats.style.display = 'block';
                console.log('👁️ 显示Token统计');
            }
        }
    }
    
    editPoke() {
        if (!this.currentFriend) {
            console.error('❌ 没有当前好友');
            return;
        }
        
        console.log('✏️ 编辑拍一拍');
        
        const currentPoke = this.currentFriend.poke || '戳了戳你';
        
        const newPoke = prompt('修改拍一拍动作：', currentPoke);
        
        if (newPoke === null || newPoke.trim() === '') {
            console.log('⚠️ 用户取消或输入为空');
            return;
        }
        
        const success = this.storage.updateFriend(this.currentFriendCode, {
            poke: newPoke.trim()
        });
        
        if (success) {
            console.log('✅ 拍一拍保存成功:', newPoke.trim());
            
            this.currentFriend.poke = newPoke.trim();
            
            const pokeValue = document.getElementById('settingPokeValue');
            if (pokeValue) {
                pokeValue.textContent = newPoke.trim();
            }
        } else {
            console.error('❌ 拍一拍保存失败');
            alert('❌ 保存失败！');
        }
    }
    
    // ==================== 拍一拍功能 ====================
    
    handlePoke(type) {
        console.log('👋 处理拍一拍:', type);
        
        if (!this.currentFriend) {
            console.error('❌ 没有当前好友');
            return;
        }
        
        // 震动反馈
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // 获取拍一拍后缀
        const pokeSuffix = this.currentFriend.poke || '戳了戳你';
        const friendName = this.currentFriend.nickname || this.currentFriend.name;
        
        let pokeText = '';
        if (type === 'ai') {
            // 用户双击AI头像
            pokeText = `你拍了拍 ${friendName} 的${pokeSuffix}`;
        } else {
            // AI双击用户头像（暂时不实现，留空）
            console.log('⚠️ AI拍一拍功能待开发');
            return;
        }
        
        // 显示系统提示
        this.showPokeMessage(pokeText);
    }
    
    showPokeMessage(text) {
        console.log('💬 显示拍一拍提示:', text);
        
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) {
            console.error('❌ 找不到 messagesList 元素');
            return;
        }
        
        // 创建系统提示元素
        const systemDiv = document.createElement('div');
        systemDiv.className = 'system-message poke-message';
        systemDiv.innerHTML = `<span>${this.escapeHtml(text)}</span>`;
        
        // 添加到消息列表
        messagesList.appendChild(systemDiv);
        
        // 触发头像震动动画
        this.triggerAvatarShake();
        
        // 滚动到底部
        this.scrollToBottom();
    }
    
    triggerAvatarShake() {
        console.log('📳 触发头像震动');
        
        // 找到所有AI消息的头像
        const aiAvatars = document.querySelectorAll('.message-ai .message-avatar');
        
        // 给最后一个AI头像添加震动动画
        if (aiAvatars.length > 0) {
            const lastAvatar = aiAvatars[aiAvatars.length - 1];
            lastAvatar.classList.add('shake');
            
            // 动画结束后移除class
            setTimeout(() => {
                lastAvatar.classList.remove('shake');
            }, 500);
        }
    }
}

window.ChatInterface = ChatInterface;
console.log('✅ ChatInterface 类已加载');