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
            autoSummary: true,
            summaryInterval: 20,
            contextMessages: 20,
            timeAwareness: true  // ← 新增：破次元时间感知
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
        
        window.chatInterface = this;
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
    
    // ← 修改：添加破次元时间感知
    async sendAIMessage() {
        console.log('🤖 sendAIMessage() 被调用');
        
        this.showTypingIndicator();
        
        try {
            const maxMessages = this.settings.contextMessages || 20;
            const recentMessages = this.messages.slice(-maxMessages);
            
            console.log('📜 准备发送的消息历史:', recentMessages.length, '条');
            console.log(`📊 使用 ${maxMessages} 条消息作为上下文`);
            
            // ← 新增：构造系统提示（包含时间信息）
            let systemPrompt = this.currentFriend?.persona || '';
            
            if (this.settings.timeAwareness) {
                const timeInfo = this.getCurrentTimeInfo();
                systemPrompt = `${timeInfo}\n\n${systemPrompt}`;
                console.log('🕐 时间感知已开启，添加时间信息');
            }
            
            console.log('👤 最终系统提示:', systemPrompt.substring(0, 100), '...');
            
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
    
    // ← 新增：获取当前时间信息（包含农历）
    getCurrentTimeInfo() {
        const now = new Date();
        
        // 检查农历库是否加载
        if (typeof Lunar === 'undefined') {
            console.warn('⚠️ 农历库未加载，使用基础时间信息');
            return `【当前时间】${this.formatFullDateTime(now)}`;
        }
        
        try {
            // 使用农历库
            const lunar = Lunar.fromDate(now);
            const solarTerm = lunar.getCurrentJieQi()?.getName() || '';
            const festival = lunar.getFestivals().join('、') || '';
            
            let timeInfo = `【当前时间】${this.formatFullDateTime(now)}`;
            timeInfo += `\n【农历】${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
            
            if (solarTerm) {
                timeInfo += `\n【节气】${solarTerm}`;
            }
            
            if (festival) {
                timeInfo += `\n【节日】${festival}`;
            }
            
            return timeInfo;
            
        } catch (error) {
            console.error('❌ 农历库调用失败:', error);
            return `【当前时间】${this.formatFullDateTime(now)}`;
        }
    }
    
    // ← 新增：格式化完整日期时间
    formatFullDateTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const weekDay = weekDays[date.getDay()];
        
        return `${year}年${month}月${day}日 ${weekDay} ${hours}:${minutes}:${seconds}`;
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
        
        // 检查是否需要自动总结
        if (this.settings.autoSummary) {
            this.checkAutoSummary();
        }
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
        
        const avatarEl = div.querySelector('.message-avatar');
        if (avatarEl) {
            avatarEl.addEventListener('dblclick', () => {
                console.log('👆 双击头像');
                this.handlePoke(message.type);
            });
        }
        
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

        const contextMessagesInput = document.getElementById('settingContextMessages');
        if (contextMessagesInput) {
            contextMessagesInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                if (value >= 1 && value <= 100) {
                    this.settings.contextMessages = value;
                    console.log('✅ 上下文记忆条数已更新:', this.settings.contextMessages);
                    this.saveSettings();
                } else {
                    alert('❌ 请输入1-100之间的数字');
                    e.target.value = this.settings.contextMessages || 20;
                }
            });
        }
        
        // ← 新增：破次元时间感知开关
        const timeAwarenessSwitch = document.getElementById('settingTimeAwareness');
        if (timeAwarenessSwitch) {
            timeAwarenessSwitch.addEventListener('change', (e) => {
                this.settings.timeAwareness = e.target.checked;
                console.log('破次元时间感知:', this.settings.timeAwareness);
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
        
        // 记忆模块入口
        const memoryModuleBtn = document.getElementById('settingMemoryModule');
        if (memoryModuleBtn) {
            memoryModuleBtn.addEventListener('click', () => {
                this.openMemoryModule();
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
        
        const contextMessagesInput = document.getElementById('settingContextMessages');
        if (contextMessagesInput) {
            contextMessagesInput.value = this.settings.contextMessages || 20;
        }
        
        // ← 新增：破次元时间感知开关
        const timeAwarenessSwitch = document.getElementById('settingTimeAwareness');
        if (timeAwarenessSwitch) {
            timeAwarenessSwitch.checked = this.settings.timeAwareness !== false;
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
        
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        const pokeSuffix = this.currentFriend.poke || '戳了戳你';
        const friendName = this.currentFriend.nickname || this.currentFriend.name;
        
        let pokeText = '';
        if (type === 'ai') {
            pokeText = `你拍了拍 ${friendName} 的${pokeSuffix}`;
        } else {
            console.log('⚠️ AI拍一拍功能待开发');
            return;
        }
        
        this.showPokeMessage(pokeText);
    }
    
    showPokeMessage(text) {
        console.log('💬 显示拍一拍提示:', text);
        
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) {
            console.error('❌ 找不到 messagesList 元素');
            return;
        }
        
        const systemDiv = document.createElement('div');
        systemDiv.className = 'system-message poke-message';
        systemDiv.innerHTML = `<span>${this.escapeHtml(text)}</span>`;
        
        messagesList.appendChild(systemDiv);
        
        this.triggerAvatarShake();
        
        this.scrollToBottom();
    }
    
    triggerAvatarShake() {
        console.log('📳 触发头像震动');
        
        const aiAvatars = document.querySelectorAll('.message-ai .message-avatar');
        
        if (aiAvatars.length > 0) {
            const lastAvatar = aiAvatars[aiAvatars.length - 1];
            lastAvatar.classList.add('shake');
            
            setTimeout(() => {
                lastAvatar.classList.remove('shake');
            }, 500);
        }
    }

    // ==================== 记忆模块功能 ====================
    
    // 打开记忆模块页面
    openMemoryModule() {
        console.log('🧠 打开记忆模块');
        
        const memoryPage = document.getElementById('memoryModulePage');
        if (memoryPage) {
            memoryPage.style.display = 'flex';
        }
        
        // 绑定记忆模块事件
        if (!this.memoryEventsBound) {
            this.bindMemoryEvents();
            this.memoryEventsBound = true;
        }
        
        // 应用设置到记忆模块UI
        this.applyMemorySettingsToUI();
    }
    
    // 关闭记忆模块页面
    closeMemoryModule() {
        console.log('🧠 关闭记忆模块');
        
        const memoryPage = document.getElementById('memoryModulePage');
        if (memoryPage) {
            memoryPage.style.display = 'none';
        }
        
        // 保存设置
        this.saveSettings();
    }
    
    // 绑定记忆模块事件
    bindMemoryEvents() {
        console.log('🔗 绑定记忆模块事件');
        
        // 返回按钮
        const memoryBackBtn = document.getElementById('memoryBackBtn');
        if (memoryBackBtn) {
            memoryBackBtn.addEventListener('click', () => {
                this.closeMemoryModule();
            });
        }
        
        // 自动总结开关
        const autoSummarySwitch = document.getElementById('memoryAutoSummary');
        if (autoSummarySwitch) {
            autoSummarySwitch.addEventListener('change', (e) => {
                this.settings.autoSummary = e.target.checked;
                console.log('自动总结:', this.settings.autoSummary);
                this.saveSettings();
            });
        }
        
        // 总结间隔输入
        const summaryIntervalInput = document.getElementById('memorySummaryInterval');
        if (summaryIntervalInput) {
            summaryIntervalInput.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                if (value > 0 && value <= 1000) {
                    this.settings.summaryInterval = value;
                    console.log('总结间隔:', this.settings.summaryInterval);
                    this.saveSettings();
                } else {
                    alert('请输入1-1000之间的数字');
                    e.target.value = this.settings.summaryInterval;
                }
            });
        }
        
        // 手动总结按钮
        const manualSummaryBtn = document.getElementById('memoryManualSummary');
        if (manualSummaryBtn) {
            manualSummaryBtn.addEventListener('click', () => {
                this.openManualSummaryModal();
            });
        }
        
        // 查看历史总结按钮
        const viewHistoryBtn = document.getElementById('memoryViewHistory');
        if (viewHistoryBtn) {
            viewHistoryBtn.addEventListener('click', () => {
                this.openSummaryHistory();
            });
        }
    }
    
    // 应用记忆模块设置到UI
    applyMemorySettingsToUI() {
        const autoSummarySwitch = document.getElementById('memoryAutoSummary');
        if (autoSummarySwitch) {
            autoSummarySwitch.checked = this.settings.autoSummary !== false;
        }
        
        const summaryIntervalInput = document.getElementById('memorySummaryInterval');
        if (summaryIntervalInput) {
            summaryIntervalInput.value = this.settings.summaryInterval || 20;
        }
    }
    
    // ==================== 手动总结弹窗 ====================
    
    // 打开手动总结弹窗
    openManualSummaryModal() {
        console.log('📝 打开手动总结弹窗');
        
        const modal = document.getElementById('manualSummaryModal');
        if (!modal) return;
        
        // 显示弹窗
        modal.style.display = 'flex';
        
        // 计算消息统计
        const summaries = this.storage.getChatSummaries(this.currentFriendCode);
        const summarizedCount = summaries.reduce((sum, s) => sum + s.messageCount, 0);
        const unsummarizedCount = this.messages.length - summarizedCount;
        
        // 更新统计信息
        document.getElementById('manualTotalMessages').textContent = this.messages.length;
        document.getElementById('manualSummarizedMessages').textContent = summarizedCount;
        document.getElementById('manualUnsummarizedMessages').textContent = unsummarizedCount;
        document.getElementById('manualUnsummarizedCount').textContent = unsummarizedCount;
        
        // 绑定弹窗事件
        if (!this.manualSummaryEventsBound) {
            this.bindManualSummaryEvents();
            this.manualSummaryEventsBound = true;
        }
    }
    
    // 关闭手动总结弹窗
    closeManualSummaryModal() {
        console.log('📝 关闭手动总结弹窗');
        
        const modal = document.getElementById('manualSummaryModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    // 绑定手动总结弹窗事件
    bindManualSummaryEvents() {
        // 关闭按钮
        const closeBtn = document.getElementById('manualSummaryClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeManualSummaryModal();
            });
        }
        
        // 遮罩层点击关闭
        const overlay = document.getElementById('manualSummaryOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeManualSummaryModal();
            });
        }
        
        // 取消按钮
        const cancelBtn = document.getElementById('manualSummaryCancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeManualSummaryModal();
            });
        }
        
        // 确认按钮
        const confirmBtn = document.getElementById('manualSummaryConfirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.handleManualSummaryConfirm();
            });
        }
    }
    
    // 处理手动总结确认
    handleManualSummaryConfirm() {
        console.log('📝 处理手动总结确认');
        
        // 获取选中的范围类型
        const rangeType = document.querySelector('input[name="summaryRange"]:checked').value;
        
        let startIndex, endIndex;
        
        if (rangeType === 'recent') {
            // 最近N条
            const count = parseInt(document.getElementById('manualRecentCount').value);
            if (count <= 0 || count > this.messages.length) {
                alert('请输入有效的消息条数');
                return;
            }
            endIndex = this.messages.length;
            startIndex = Math.max(0, endIndex - count);
            
        } else if (rangeType === 'range') {
            // 从第X条到第Y条
            startIndex = parseInt(document.getElementById('manualRangeStart').value) - 1;
            endIndex = parseInt(document.getElementById('manualRangeEnd').value);
            
            if (startIndex < 0 || endIndex > this.messages.length || startIndex >= endIndex) {
                alert('请输入有效的消息范围');
                return;
            }
            
        } else if (rangeType === 'unsummarized') {
            // 所有未总结的消息
            const summaries = this.storage.getChatSummaries(this.currentFriendCode);
            startIndex = summaries.reduce((sum, s) => sum + s.messageCount, 0);
            endIndex = this.messages.length;
            
            if (startIndex >= endIndex) {
                alert('没有未总结的消息');
                return;
            }
        }
        
        // 关闭弹窗
        this.closeManualSummaryModal();
        
        // 关闭记忆模块页面
        this.closeMemoryModule();
        
        // 生成总结
        this.generateAutoSummary(startIndex, endIndex);
    }
    
    // ==================== 历史总结列表 ====================
    
    // 打开历史总结列表
    openSummaryHistory() {
        console.log('📚 打开历史总结列表');
        
        const historyPage = document.getElementById('summaryHistoryPage');
        if (!historyPage) return;
        
        historyPage.style.display = 'flex';
        
        // 绑定历史总结事件
        if (!this.summaryHistoryEventsBound) {
            this.bindSummaryHistoryEvents();
            this.summaryHistoryEventsBound = true;
        }
        
        // 加载历史总结列表
        this.loadSummaryHistory();
    }
    
    // 关闭历史总结列表
    closeSummaryHistory() {
        console.log('📚 关闭历史总结列表');
        
        const historyPage = document.getElementById('summaryHistoryPage');
        if (historyPage) {
            historyPage.style.display = 'none';
        }
    }
    
    // 绑定历史总结事件
    bindSummaryHistoryEvents() {
        const backBtn = document.getElementById('summaryHistoryBackBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.closeSummaryHistory();
            });
        }
    }
    
    // 加载历史总结列表
    loadSummaryHistory() {
        console.log('📚 加载历史总结列表');
        
        const content = document.getElementById('summaryHistoryContent');
        if (!content) return;
        
        const summaries = this.storage.getChatSummaries(this.currentFriendCode);
        
        if (summaries.length === 0) {
            content.innerHTML = `
                <div class="summary-history-empty">
                    <div class="summary-history-empty-icon">📋</div>
                    <div class="summary-history-empty-text">暂无历史总结</div>
                </div>
            `;
            return;
        }
        
        // 按时间倒序排列
        summaries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        let html = '';
        summaries.forEach((summary, index) => {
            const number = summaries.length - index;
            html += this.createSummaryHistoryCardHTML(summary, number);
        });
        
        content.innerHTML = html;
    }
    
    // 生成历史总结卡片HTML
    createSummaryHistoryCardHTML(summary, number) {
        const startTime = new Date(summary.startTime);
        const endTime = new Date(summary.endTime);
        const createdTime = new Date(summary.createdAt);
        
        const timeRange = `${this.formatTime2(startTime)} - ${this.formatTime2(endTime)}`;
        const createdTimeStr = this.formatTime2(createdTime);
        
        return `
            <div class="summary-history-card">
                <div class="summary-history-card-header">
                    <span class="summary-history-card-title">📋 ${summary.date} 对话总结</span>
                    <span class="summary-history-card-number">#${number}</span>
                </div>
                
                <div class="summary-history-card-info">
                    <div class="summary-history-card-info-item">
                        <span>📊</span>
                        <span>总结了 ${summary.messageCount} 条消息</span>
                    </div>
                    <div class="summary-history-card-info-item">
                        <span>🕐</span>
                        <span>生成于 ${createdTimeStr}</span>
                    </div>
                    <div class="summary-history-card-info-item">
                        <span>💬</span>
                        <span>涵盖时间：${timeRange}</span>
                    </div>
                </div>
                
                <div class="summary-history-card-summary">
                    <div class="summary-history-card-summary-label">📝 主要内容：</div>
                    <div class="summary-history-card-summary-text">${this.escapeHtml(summary.summary || '对话总结')}</div>
                </div>
                
                <div class="summary-history-card-actions">
                    <button class="summary-history-card-btn" onclick="window.chatInterface.viewSummaryDetail('${summary.id}')">
                        <span>👁️</span>
                        <span>查看详情</span>
                    </button>
                    <button class="summary-history-card-btn" onclick="window.chatInterface.copySummaryFromHistory('${summary.id}')">
                        <span>📋</span>
                        <span>复制</span>
                    </button>
                    <button class="summary-history-card-btn" onclick="window.chatInterface.editSummaryFromHistory('${summary.id}')">
                        <span>⚙️</span>
                        <span>编辑</span>
                    </button>
                    <button class="summary-history-card-btn summary-history-card-btn-danger" onclick="window.chatInterface.deleteSummaryFromHistory('${summary.id}')">
                        <span>🗑️</span>
                        <span>删除</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    // ==================== 总结详情页面 ====================
    
    // 查看总结详情
    viewSummaryDetail(summaryId) {
        console.log('👁️ 查看总结详情:', summaryId);
        
        const summaries = this.storage.getChatSummaries(this.currentFriendCode);
        const summary = summaries.find(s => s.id === summaryId);
        
        if (!summary) {
            console.error('❌ 找不到总结');
            return;
        }
        
        const detailPage = document.getElementById('summaryDetailPage');
        if (!detailPage) return;
        
        detailPage.style.display = 'flex';
        
        // 绑定详情页事件
        if (!this.summaryDetailEventsBound) {
            this.bindSummaryDetailEvents();
            this.summaryDetailEventsBound = true;
        }
        
        // 设置标题
        const titleEl = document.getElementById('summaryDetailTitle');
        if (titleEl) {
            titleEl.textContent = `${summary.date} 对话总结`;
        }
        
        // 生成详情内容
        const contentEl = document.getElementById('summaryDetailContent');
        if (contentEl) {
            contentEl.innerHTML = this.createSummaryDetailHTML(summary);
        }
        
        // 保存当前查看的总结ID
        this.currentViewingSummaryId = summaryId;
    }
    
    // 关闭总结详情
    closeSummaryDetail() {
        console.log('👁️ 关闭总结详情');
        
        const detailPage = document.getElementById('summaryDetailPage');
        if (detailPage) {
            detailPage.style.display = 'none';
        }
        
        this.currentViewingSummaryId = null;
    }
    
   // 绑定详情页事件
    bindSummaryDetailEvents() {
        const backBtn = document.getElementById('summaryDetailBackBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.closeSummaryDetail();
            });
        }
    }
    
    // 生成总结详情HTML
    createSummaryDetailHTML(summary) {
        const startTime = new Date(summary.startTime);
        const endTime = new Date(summary.endTime);
        const createdTime = new Date(summary.createdAt);
        
        const timeRange = `${this.formatTime2(startTime)} - ${this.formatTime2(endTime)}`;
        const createdTimeStr = this.formatTime2(createdTime);
        
        // 解析详细内容
        const entries = this.parseSummaryContent(summary.content);
        
        const entriesHTML = entries.map(entry => `
            <div class="summary-detail-entry">
                <div class="summary-detail-entry-time">${entry.time}</div>
                <div class="summary-detail-entry-content">${this.escapeHtml(entry.content)}</div>
            </div>
        `).join('');
        
        return `
            <div class="summary-detail-info">
                <div class="summary-detail-info-item">
                    <span>📊</span>
                    <span>总结了 ${summary.messageCount} 条消息</span>
                </div>
                <div class="summary-detail-info-item">
                    <span>🕐</span>
                    <span>生成于 ${createdTimeStr}</span>
                </div>
                <div class="summary-detail-info-item">
                    <span>💬</span>
                    <span>涵盖时间：${timeRange}</span>
                </div>
            </div>
            
            <div class="summary-detail-timeline">
                ${entriesHTML}
            </div>
            
            <div class="summary-detail-actions">
                <button class="summary-detail-btn summary-detail-btn-primary" onclick="window.chatInterface.copySummaryDetail('${summary.id}')">
                    <span>📋</span>
                    <span>复制全部</span>
                </button>
                <button class="summary-detail-btn" onclick="window.chatInterface.editSummaryDetail('${summary.id}')">
                    <span>⚙️</span>
                    <span>编辑</span>
                </button>
                <button class="summary-detail-btn summary-detail-btn-danger" onclick="window.chatInterface.deleteSummaryDetail('${summary.id}')">
                    <span>🗑️</span>
                    <span>删除</span>
                </button>
            </div>
        `;
    }
    
    // 解析总结内容
    parseSummaryContent(content) {
        const entries = [];
        const lines = content.split('\n');
        
        lines.forEach(line => {
            line = line.trim();
            if (!line) return;
            
            const match = line.match(/^【(.+?)】(.+)$/);
            if (match) {
                entries.push({
                    time: `【${match[1]}】`,
                    content: match[2].trim()
                });
            }
        });
        
        return entries;
    }
    
    // 从历史列表复制总结
    copySummaryFromHistory(summaryId) {
        console.log('📋 从历史列表复制总结:', summaryId);
        
        const summaries = this.storage.getChatSummaries(this.currentFriendCode);
        const summary = summaries.find(s => s.id === summaryId);
        
        if (!summary) {
            console.error('❌ 找不到总结');
            return;
        }
        
        navigator.clipboard.writeText(summary.content).then(() => {
            console.log('✅ 复制成功');
            alert('✅ 已复制到剪贴板！');
        }).catch(err => {
            console.error('❌ 复制失败:', err);
            alert('❌ 复制失败，请手动复制');
        });
    }
    
    // 从详情页复制总结
    copySummaryDetail(summaryId) {
        this.copySummaryFromHistory(summaryId);
    }
    
    // 从历史列表编辑总结
editSummaryFromHistory(summaryId) {
    console.log('⚙️ 从历史列表编辑总结:', summaryId);
    
    const summaries = this.storage.getChatSummaries(this.currentFriendCode);
    const summary = summaries.find(s => s.id === summaryId);
    
    if (!summary) {
        console.error('❌ 找不到总结');
        return;
    }
    
    this.openEditSummaryModal(summary);
}

// 从详情页编辑总结
editSummaryDetail(summaryId) {
    this.editSummaryFromHistory(summaryId);
}

// 打开编辑总结弹窗
openEditSummaryModal(summary) {
    console.log('✏️ 打开编辑总结弹窗');
    
    const modal = document.getElementById('editSummaryModal');
    if (!modal) return;
    
    // 显示弹窗
    modal.style.display = 'flex';
    
    // 填充当前内容
    const summaryInput = document.getElementById('editSummarySummary');
    const contentTextarea = document.getElementById('editSummaryContent');
    
    if (summaryInput) {
        summaryInput.value = summary.summary || '';
    }
    
    if (contentTextarea) {
        contentTextarea.value = summary.content || '';
    }
    
    // 保存当前编辑的总结ID
    this.currentEditingSummaryId = summary.id;
    
    // 绑定编辑弹窗事件
    if (!this.editSummaryEventsBound) {
        this.bindEditSummaryEvents();
        this.editSummaryEventsBound = true;
    }
}

// 关闭编辑总结弹窗
closeEditSummaryModal() {
    console.log('✏️ 关闭编辑总结弹窗');
    
    const modal = document.getElementById('editSummaryModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    this.currentEditingSummaryId = null;
}

// 绑定编辑弹窗事件
bindEditSummaryEvents() {
    // 关闭按钮
    const closeBtn = document.getElementById('editSummaryClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            this.closeEditSummaryModal();
        });
    }
    
    // 遮罩层点击关闭
    const overlay = document.getElementById('editSummaryOverlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            this.closeEditSummaryModal();
        });
    }
    
    // 取消按钮
    const cancelBtn = document.getElementById('editSummaryCancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            this.closeEditSummaryModal();
        });
    }
    
    // 确认按钮
    const confirmBtn = document.getElementById('editSummaryConfirm');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            this.handleEditSummaryConfirm();
        });
    }
}

// 处理编辑总结确认
handleEditSummaryConfirm() {
    console.log('✏️ 处理编辑总结确认');
    
    if (!this.currentEditingSummaryId) {
        console.error('❌ 没有正在编辑的总结ID');
        return;
    }
    
    const summaryInput = document.getElementById('editSummarySummary');
    const contentTextarea = document.getElementById('editSummaryContent');
    
    if (!summaryInput || !contentTextarea) {
        console.error('❌ 找不到输入元素');
        return;
    }
    
    const newSummary = summaryInput.value.trim();
    const newContent = contentTextarea.value.trim();
    
    if (!newSummary || !newContent) {
        alert('一句话总结和详细内容不能为空！');
        return;
    }
    
    // 更新总结
    const success = this.storage.updateChatSummaryFull(
        this.currentFriendCode,
        this.currentEditingSummaryId,
        newSummary,
        newContent
    );
    
    if (success) {
        console.log('✅ 总结更新成功');
        alert('✅ 总结已更新！');
        
        // 关闭编辑弹窗
        this.closeEditSummaryModal();
        
        // 如果当前在详情页，关闭详情页
        if (this.currentViewingSummaryId === this.currentEditingSummaryId) {
            this.closeSummaryDetail();
        }
        
        // 重新加载历史列表
        this.loadSummaryHistory();
    } else {
        console.error('❌ 总结更新失败');
        alert('❌ 更新失败！');
    }
}
    
    // 从历史列表删除总结
    deleteSummaryFromHistory(summaryId) {
        console.log('🗑️ 从历史列表删除总结:', summaryId);
        
        if (!confirm('确定要删除这条总结吗？')) {
            return;
        }
        
        const success = this.storage.deleteChatSummary(this.currentFriendCode, summaryId);
        
        if (success) {
            console.log('✅ 总结删除成功');
            // 重新加载历史列表
            this.loadSummaryHistory();
        } else {
            console.error('❌ 总结删除失败');
            alert('❌ 删除失败！');
        }
    }
    
    // 从详情页删除总结
    deleteSummaryDetail(summaryId) {
        console.log('🗑️ 从详情页删除总结:', summaryId);
        
        if (!confirm('确定要删除这条总结吗？')) {
            return;
        }
        
        const success = this.storage.deleteChatSummary(this.currentFriendCode, summaryId);
        
        if (success) {
            console.log('✅ 总结删除成功');
            // 关闭详情页
            this.closeSummaryDetail();
            // 重新加载历史列表
            this.loadSummaryHistory();
        } else {
            console.error('❌ 总结删除失败');
            alert('❌ 删除失败！');
        }
    }
    
    // ==================== 聊天总结功能 ====================
    
    // 检查是否需要自动总结
    checkAutoSummary() {
        if (!this.settings.autoSummary) {
            console.log('ℹ️ 自动总结已关闭');
            return;
        }
        
        const interval = this.settings.summaryInterval || 20;
        
        // 获取当前聊天的所有总结
        const summaries = this.storage.getChatSummaries(this.currentFriendCode);
        
        // 计算已经总结过的消息数量
        const summarizedCount = summaries.reduce((sum, s) => sum + s.messageCount, 0);
        
        // 计算未总结的消息数量
        const unsummarizedCount = this.messages.length - summarizedCount;
        
        console.log(`📊 消息统计: 总${this.messages.length}条, 已总结${summarizedCount}条, 未总结${unsummarizedCount}条`);
        
        // 如果未总结的消息达到间隔数量，触发自动总结
        if (unsummarizedCount >= interval) {
            console.log('🎯 达到自动总结条件，开始生成总结...');
            this.generateAutoSummary(summarizedCount, this.messages.length);
        }
    }
    
    // 生成自动总结
    async generateAutoSummary(startIndex, endIndex) {
        console.log(`📝 生成自动总结: 从第${startIndex + 1}条到第${endIndex}条`);
        
        // 获取需要总结的消息
        const messagesToSummarize = this.messages.slice(startIndex, endIndex);
        
        if (messagesToSummarize.length === 0) {
            console.warn('⚠️ 没有需要总结的消息');
            return;
        }
        
        // 显示生成中的提示
        this.showSummaryGenerating();
        
        try {
            // 调用AI生成总结
            const summaryResult = await this.callAIForSummary(messagesToSummarize);
            
            // 隐藏生成中的提示
            this.hideSummaryGenerating();
            
            if (!summaryResult || !summaryResult.content) {
                console.error('❌ 总结生成失败');
                alert('❌ 总结生成失败，请稍后重试');
                return;
            }
            
            // 获取时间范围
            const startTime = new Date(messagesToSummarize[0].timestamp);
            const endTime = new Date(messagesToSummarize[messagesToSummarize.length - 1].timestamp);
            
            // 构造总结数据
            const summaryData = {
                date: this.formatDate(startTime),
                messageCount: messagesToSummarize.length,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                summary: summaryResult.summary,
                content: summaryResult.content
            };
            
            // 保存总结到storage
            const summaryId = this.storage.addChatSummary(this.currentFriendCode, summaryData);
            
            if (!summaryId) {
                console.error('❌ 总结保存失败');
                return;
            }
            
            console.log('✅ 自动总结生成成功');
            alert('✅ 总结已生成！可在"记忆模块 > 查看历史总结"中查看。');
            
        } catch (error) {
            console.error('❌ 生成总结时出错:', error);
            this.hideSummaryGenerating();
            alert('❌ 总结生成失败：' + error.message);
        }
    }
    
    // 调用AI生成总结
    async callAIForSummary(messages) {
        console.log('🤖 调用AI生成总结...');
        
        // 构造总结的系统提示
        const summaryPrompt = `你是一个专业的对话总结助手。请按照以下格式总结对话内容：

第一部分：一句话总结（用 === 包裹）
用1-2句话概括整个对话的主要内容，不超过80字。

===
（在这里写一句话总结）
===

第二部分：详细时间轴（每条消息单独总结）
1. 每一条消息都要单独总结
2. 使用【年月日 时:分:秒】格式标注时间
3. 使用第三人称客观描述
4. 保留关键细节（人物、情绪、动作、内容）
5. 每条总结独立成段

示例格式：
【2026年1月18日 14:34:42】"我"向沈眠提议去王者荣耀商城购物。
【2026年1月18日 14:34:55】"我"提示沈眠带上大小号的购物袋，并确认了外出的目的地。

请总结以下对话内容。只输出总结内容，不要有任何其他说明。`;
        
        // 构造消息历史（格式化为便于总结的格式）
        let conversationText = '';
        messages.forEach(msg => {
            const time = new Date(msg.timestamp);
            const timeStr = this.formatTimeForSummary(time);
            const sender = msg.type === 'user' ? '我' : this.currentFriend.name;
            conversationText += `[${timeStr}] ${sender}: ${msg.text}\n`;
        });
        
        // 调用API
        const result = await this.apiManager.callAI(
            [{ type: 'user', text: conversationText }],
            summaryPrompt
        );
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        // 解析AI返回的内容，分离一句话总结和详细内容
        const fullText = result.text;
        
        // 提取一句话总结（在 === 和 === 之间）
        const summaryMatch = fullText.match(/===\s*([\s\S]*?)\s*===/);
        const oneLinerSummary = summaryMatch ? summaryMatch[1].trim() : '对话总结';
        
        // 提取详细内容（=== 后面的所有内容）
        const detailedContent = fullText.split(/===\s*[\s\S]*?\s*===\s*/)[1]?.trim() || fullText;
        
        console.log('📝 一句话总结:', oneLinerSummary);
        console.log('📋 详细内容长度:', detailedContent.length);
        
        return {
            summary: oneLinerSummary,
            content: detailedContent
        };
    }
    
    // 显示"生成中"提示
    showSummaryGenerating() {
        const nameEl = document.querySelector('#chatFriendName span');
        if (nameEl) {
            if (!this.originalFriendName) {
                this.originalFriendName = nameEl.textContent;
            }
            nameEl.textContent = '正在生成总结…';
            console.log('💬 显示生成中提示');
        }
    }
    
    // 隐藏"生成中"提示
    hideSummaryGenerating() {
        const nameEl = document.querySelector('#chatFriendName span');
        if (nameEl && this.originalFriendName) {
            nameEl.textContent = this.originalFriendName;
            console.log('💬 恢复好友名称');
        }
    }
    
    // 格式化日期（用于总结标题）
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}年${month}月${day}日`;
    }
    
    // 格式化时间（用于显示）
    formatTime2(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    
    // 格式化时间（用于总结）
    formatTimeForSummary(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    }
}

// 暴露到全局（供HTML onclick使用）
window.ChatInterface = ChatInterface;
window.chatInterface = null;
console.log('✅ ChatInterface 类已加载');