/* Chat Interface - 聊天界面逻辑 */

class ChatInterface {
    constructor() {
        this.currentFriendId = null;
        this.messages = [];
        this.isExpanded = false;
        this.isMenuOpen = false;
        this.init();
    }
    
    init() {
        // 更新状态栏时间
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        
        // 绑定事件
        this.bindEvents();
        
        // 加载测试数据
        this.loadTestData();
        
        console.log('✅ 聊天界面初始化完成');
    }
    
    // 更新时间
    updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timeEl = document.getElementById('statusTime');
        if (timeEl) {
            timeEl.textContent = `${hours}:${minutes}`;
        }
    }
    
    // 绑定事件
    bindEvents() {
        // 返回按钮
        document.getElementById('backBtn').addEventListener('click', () => {
            window.history.back();
        });
        
        // 备注名点击 - 显示状态
        document.querySelector('.chat-title').addEventListener('click', () => {
            this.toggleStatusModal();
        });
        
        // 线下模式切换
        document.getElementById('offlineToggle').addEventListener('click', (e) => {
            e.target.classList.toggle('active');
            alert('线下模式功能开发中...');
        });
        
        // 聊天设置
        document.getElementById('chatSettingsBtn').addEventListener('click', () => {
            alert('聊天设置功能开发中...');
        });
        
        // Token统计展开
        document.getElementById('tokenDisplay').addEventListener('click', () => {
            this.toggleTokenDetails();
        });
        
        // 菜单按钮
        document.getElementById('menuBtn').addEventListener('click', () => {
            this.toggleMenu();
        });
        
        // 输入框展开
        document.getElementById('expandBtn').addEventListener('click', () => {
            this.toggleExpand();
        });
        
        // 输入框自动调整高度
        const inputField = document.getElementById('inputField');
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
                    this.sendUserMessage();
                }
            }
        });
        
        // 发送按钮
        document.getElementById('userSendBtn').addEventListener('click', () => {
            this.sendUserMessage();
        });
        
        document.getElementById('aiSendBtn').addEventListener('click', () => {
            this.sendAIMessage();
        });
        
        // 菜单项
        this.bindMenuItems();
        
        // 点击空白处关闭弹窗
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.status-modal') && !e.target.closest('.chat-title')) {
                this.hideStatusModal();
            }
            if (!e.target.closest('.menu-panel') && !e.target.closest('.menu-btn')) {
                this.closeMenu();
            }
        });
    }
    
    // 绑定菜单项
    bindMenuItems() {
        // 重说
        document.getElementById('menuResay').addEventListener('click', () => {
            alert('重说功能开发中...');
        });
        
        // 表情
        document.getElementById('menuEmoji').addEventListener('click', () => {
            alert('表情选择器开发中...');
        });
        
        // 图片
        document.getElementById('menuImage').addEventListener('click', () => {
            alert('图片功能开发中...');
        });
        
        // 视频
        document.getElementById('menuVideo').addEventListener('click', () => {
            alert('视频功能开发中...');
        });
        
        // 语音
        document.getElementById('menuVoice').addEventListener('click', () => {
            alert('语音功能开发中...');
        });
        
        // 文件
        document.getElementById('menuFile').addEventListener('click', () => {
            alert('文件功能开发中...');
        });
        
        // 占位符提示
        document.querySelectorAll('.menu-placeholder').forEach(btn => {
            btn.addEventListener('click', () => {
                alert('该功能将在后续版本开放...');
            });
        });
    }
    
    // 切换状态弹窗
    toggleStatusModal() {
        const modal = document.getElementById('statusModal');
        if (modal.style.display === 'none') {
            this.showStatusModal();
        } else {
            this.hideStatusModal();
        }
    }
    
    showStatusModal() {
        const modal = document.getElementById('statusModal');
        modal.style.display = 'block';
        
        // 加载示例数据
        document.getElementById('statusOutfit').textContent = '休闲装';
        document.getElementById('statusAction').textContent = '正在看书';
        document.getElementById('statusMood').textContent = '心情不错';
        document.getElementById('statusLocation').textContent = '家里的书房';
    }
    
    hideStatusModal() {
        const modal = document.getElementById('statusModal');
        modal.style.display = 'none';
    }
    
    // 切换Token详情
    toggleTokenDetails() {
        const display = document.getElementById('tokenDisplay');
        const details = document.getElementById('tokenDetails');
        
        if (details.style.display === 'none') {
            display.classList.add('expanded');
            details.style.display = 'block';
        } else {
            display.classList.remove('expanded');
            details.style.display = 'none';
        }
    }
    
    // 切换菜单
    toggleMenu() {
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }
    
    openMenu() {
        document.getElementById('menuPanel').style.display = 'block';
        this.isMenuOpen = true;
    }
    
    closeMenu() {
        document.getElementById('menuPanel').style.display = 'none';
        this.isMenuOpen = false;
    }
    
    // 切换输入框展开
    toggleExpand() {
        const wrapper = document.getElementById('inputWrapper');
        
        if (this.isExpanded) {
            wrapper.classList.remove('expanded');
            this.isExpanded = false;
        } else {
            wrapper.classList.add('expanded');
            this.isExpanded = true;
        }
    }
    
    // 自动调整输入框高度
    autoResizeInput(textarea) {
        if (!this.isExpanded) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
        }
    }
    
    // 发送用户消息
    sendUserMessage() {
        const inputField = document.getElementById('inputField');
        const text = inputField.value.trim();
        
        if (!text) return;
        
        // 添加消息
        this.addMessage({
            type: 'user',
            text: text,
            timestamp: new Date()
        });
        
        // 清空输入框
        inputField.value = '';
        inputField.style.height = 'auto';
        
        // 关闭菜单
        this.closeMenu();
        
        // 滚动到底部
        this.scrollToBottom();
    }
    
    // 发送AI消息
    sendAIMessage() {
        // 显示正在输入
        this.showTypingIndicator();
        
        // 模拟AI回复（后面会接API）
        setTimeout(() => {
            this.hideTypingIndicator();
            
            this.addMessage({
                type: 'ai',
                text: '这是AI的回复示例。后面会接入真实的API。',
                timestamp: new Date()
            });
            
            this.scrollToBottom();
        }, 1500);
    }
    
    // 显示正在输入
    showTypingIndicator() {
        document.getElementById('typingIndicator').style.display = 'block';
    }
    
    hideTypingIndicator() {
        document.getElementById('typingIndicator').style.display = 'none';
    }
    
    // 添加消息
    addMessage(message) {
        const messagesList = document.getElementById('messagesList');
        const messageEl = this.createMessageElement(message);
        messagesList.appendChild(messageEl);
        
        // 保存到消息列表
        this.messages.push(message);
        
        // 更新Token统计
        this.updateTokenStats();
    }
    
    // 创建消息元素
    createMessageElement(message) {
        const div = document.createElement('div');
        div.className = `message message-${message.type}`;
        
        const time = this.formatTime(message.timestamp);
        
        div.innerHTML = `
            <div class="message-avatar">
                <img src="assets/default-avatar.png" alt="${message.type}">
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="message-text">${this.escapeHtml(message.text)}</div>
                </div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        return div;
    }
    
    // 格式化时间
    formatTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    
    // 转义HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 滚动到底部
    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }
    
    // 更新Token统计
    updateTokenStats() {
        // 模拟Token统计
        const total = this.messages.length * 100;
        
        document.getElementById('tokenTotal').textContent = total;
        document.getElementById('tokenWorldbook').textContent = Math.floor(total * 0.1);
        document.getElementById('tokenPersona').textContent = Math.floor(total * 0.3);
        document.getElementById('tokenInput').textContent = Math.floor(total * 0.4);
        document.getElementById('tokenOutput').textContent = Math.floor(total * 0.2);
        
        // 更新显示
        document.querySelector('#tokenDisplay span').textContent = `Token: ${total}`;
    }
    
    // 加载测试数据
    loadTestData() {
        // 设置好友名称
        document.querySelector('.friend-name').textContent = '测试角色';
        
        // 添加示例消息
        this.addMessage({
            type: 'ai',
            text: '你好！我是AI助手。这是一条测试消息。',
            timestamp: new Date()
        });
        
        setTimeout(() => {
            this.scrollToBottom();
        }, 100);
    }
}

// 初始化
const chatInterface = new ChatInterface();
