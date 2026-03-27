/**
 * AI动态状态栏 + 好友详细资料页
 * 独立模块，通过 window.friendProfile 暴露接口
 */
class FriendProfileManager {
    constructor() {
        this._statusDropdownBound = false;
    }

    // ==================== 动态状态栏（点名字弹出） ====================
    showStatusDropdown() {
        const ci = window.chatInterface;
        if (!ci?.currentFriend || !ci?.currentFriendCode) return;
        
        const friend = ci.currentFriend;
        const code = ci.currentFriendCode;
        const data = ci.storage.getIntimacyData(code);
        const status = data.aiStatus || {};

        // 移除旧的
        document.getElementById('aiStatusDropdown')?.remove();

        const dd = document.createElement('div');
        dd.className = 'ai-status-dropdown open';
        dd.id = 'aiStatusDropdown';
        
        const displayName = friend.nickname || friend.name;
        const avatarSrc = friend.avatar || 'assets/icons/chat/default-avatar.png';
        const friendCode = friend.code || '';

        dd.innerHTML = `
            <div class="ai-status-backdrop" id="aiStatusBackdrop"></div>
            <div class="ai-status-card" id="aiStatusCard">
                <div class="ai-status-header">
                    <img class="ai-status-avatar" src="${avatarSrc}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 50 50%22><rect width=%2250%22 height=%2250%22 fill=%22%23333%22/></svg>'">
                    <div style="flex:1;">
                        <div class="ai-status-name">${this._esc(displayName)}</div>
                        <div class="ai-status-code">${friendCode}</div>
                    </div>
                    <button class="ai-status-theme-btn" id="aiStatusThemeBtn" title="切换明暗">🌓</button>
                </div>
                <div class="ai-status-grid">
                    <div class="ai-status-item" data-status="outfit">
                        <div class="ai-status-label">👔 装扮</div>
                        <div class="ai-status-value ${status.outfit ? '' : 'empty'}">${this._esc(status.outfit) || '未设置'}</div>
                    </div>
                    <div class="ai-status-item" data-status="action">
                        <div class="ai-status-label">🎬 动作</div>
                        <div class="ai-status-value ${status.action ? '' : 'empty'}">${this._esc(status.action) || '未设置'}</div>
                    </div>
                    <div class="ai-status-item" data-status="thoughts">
                        <div class="ai-status-label">💭 心声</div>
                        <div class="ai-status-value ${status.thoughts ? '' : 'empty'}">${this._esc(status.thoughts) || '未设置'}</div>
                    </div>
                    <div class="ai-status-item" data-status="location">
                        <div class="ai-status-label">📍 位置</div>
                        <div class="ai-status-value ${status.location ? '' : 'empty'}">${this._esc(status.location) || '未设置'}</div>
                    </div>
                </div>
                <div class="ai-status-actions">
                    <button class="ai-status-action-btn ai-status-action-primary" id="aiStatusToProfile">查看详细资料</button>
                    <button class="ai-status-action-btn ai-status-action-secondary" id="aiStatusClose">关闭</button>
                </div>
            </div>`;

        document.body.appendChild(dd);

        // 事件
        dd.querySelector('#aiStatusBackdrop').addEventListener('click', () => this.hideStatusDropdown());
        dd.querySelector('#aiStatusClose').addEventListener('click', () => this.hideStatusDropdown());
        dd.querySelector('#aiStatusToProfile').addEventListener('click', () => {
            this.hideStatusDropdown();
            this.openFriendProfilePage();
        });
        
        // 点击状态项→打开历史详情面板
        dd.querySelectorAll('.ai-status-item').forEach(item => {
            item.addEventListener('click', () => {
                const field = item.getAttribute('data-status');
                this.hideStatusDropdown();
                this.openStatusDetailPanel(field);
            });
        });
        
        // 明暗切换
        dd.querySelector('#aiStatusThemeBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            const card = dd.querySelector('#aiStatusCard');
            card.classList.toggle('light');
            this._statusThemeLight = card.classList.contains('light');
        });
        // 恢复上次主题
        if (this._statusThemeLight) {
            dd.querySelector('#aiStatusCard')?.classList.add('light');
        }
    }

    hideStatusDropdown() {
        document.getElementById('aiStatusDropdown')?.remove();
    }

    // ==================== 动态历史详情面板 ====================
    openStatusDetailPanel(field) {
        const ci = window.chatInterface;
        if (!ci?.currentFriendCode) return;
        
        const data = ci.storage.getIntimacyData(ci.currentFriendCode);
        const status = data.aiStatus || {};
        const history = data.aiStatusHistory || {};
        const panelSettings = data.statusPanelSettings || {};
        
        const fieldLabels = { outfit:'👔 装扮', action:'🎬 动作', thoughts:'💭 心声', location:'📍 位置' };
        const label = fieldLabels[field] || field;
        const current = status[field] || '';
        const currentDate = status[field + 'Date'] || '';
        const historyList = history[field] || [];
        const friendName = ci.currentFriend?.nickname || ci.currentFriend?.name || 'TA';

        document.getElementById('statusDetailPanel')?.remove();

        const panel = document.createElement('div');
        panel.className = 'status-detail-panel open';
        panel.id = 'statusDetailPanel';
        
        // 背景图
        const bgStyle = panelSettings.bgImage ? `background-image:url(${panelSettings.bgImage});background-size:cover;background-position:center;` : '';

        panel.innerHTML = `
            <div class="sdp-bg" style="${bgStyle}"></div>
            <div class="sdp-content">
                <div class="sdp-header">
                    <button class="sdp-back" id="sdpBack">←</button>
                    <div class="sdp-title">${label}</div>
                    <button class="ai-status-theme-btn" id="sdpThemeBtn" title="切换明暗">🌓</button>
                    <button class="sdp-customize-btn" id="sdpCustomizeBtn">⚙️</button>
                </div>

                <!-- Tab切换 -->
                <div class="sdp-tabs">
                    ${['outfit','action','thoughts','location'].map(f => 
                        `<div class="sdp-tab ${f===field?'active':''}" data-field="${f}">${fieldLabels[f]}</div>`
                    ).join('')}
                </div>

                <!-- 当前状态 -->
                <div class="sdp-current" id="sdpCurrentBlock">
                    ${current ? `
                        <div class="sdp-current-label">当前</div>
                        <div class="sdp-current-value">${this._esc(current)}</div>
                        <div class="sdp-current-date">${currentDate ? new Date(currentDate).toLocaleString('zh-CN') : ''}</div>
                    ` : `<div class="sdp-empty">${friendName}还没设置${label.substring(2)}</div>`}
                </div>

                <!-- 历史记录 -->
                <div class="sdp-history-title">历史记录 (${historyList.length})</div>
                <div class="sdp-history-list" id="sdpHistoryList">
                    ${historyList.length === 0 ? '<div class="sdp-empty">暂无历史</div>' : 
                        historyList.slice().reverse().map((h, i) => {
                            const realIdx = historyList.length - 1 - i;
                            return `<div class="sdp-history-item">
                                <div class="sdp-history-value">${this._esc(h.value)}</div>
                                <div class="sdp-history-meta">
                                    <span>${h.date ? new Date(h.date).toLocaleString('zh-CN') : '未知时间'}</span>
                                    <div style="display:flex;gap:6px;">
                                        <button class="sdp-history-edit" data-field="${field}" data-idx="${realIdx}" style="padding:3px 10px;border:none;border-radius:6px;background:rgba(100,180,255,0.08);color:rgba(100,180,255,0.6);font-size:10px;cursor:pointer;">修改</button>
                                        <button class="sdp-history-del" data-field="${field}" data-idx="${realIdx}">删除</button>
                                    </div>
                                </div>
                            </div>`;
                        }).join('')}
                </div>
            </div>

            <!-- 自定义面板 -->
            <div class="sdp-customize" id="sdpCustomize" style="display:none;">
                <div class="sdp-customize-inner">
                    <div style="text-align:center;font-size:15px;font-weight:600;color:#fff;margin-bottom:14px;">面板自定义</div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:8px;">背景图</div>
                    <div style="display:flex;gap:8px;margin-bottom:12px;">
                        <button id="sdpBgUploadBtn" style="flex:1;padding:10px;border:1px dashed rgba(255,255,255,0.12);border-radius:8px;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.4);font-size:12px;cursor:pointer;">📷 上传</button>
                        <input type="file" id="sdpBgInput" accept="image/*" style="display:none;">
                        <button id="sdpBgResetBtn" style="padding:10px 14px;border:none;border-radius:8px;background:rgba(255,100,100,0.08);color:rgba(255,100,100,0.5);font-size:12px;cursor:pointer;">清除</button>
                    </div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:8px;">自定义CSS</div>
                    <div class="sdp-css-ref-toggle" id="sdpCssRefToggle">📋 查看类名 ▾</div>
                    <div class="sdp-css-ref" id="sdpCssRef" style="display:none;">
.status-detail-panel — 整个面板<br>
.sdp-header — 顶部栏<br>
.sdp-tabs — Tab切换栏<br>
.sdp-tab — 单个Tab<br>
.sdp-tab.active — 选中的Tab<br>
.sdp-current — 当前状态块<br>
.sdp-current-value — 当前状态文字<br>
.sdp-history-list — 历史列表<br>
.sdp-history-item — 单条历史<br>
.sdp-history-value — 历史内容文字
                    </div>
                    <textarea id="sdpCssTextarea" rows="3" placeholder="写CSS美化面板..." style="width:100%;padding:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#fff;font-size:11px;font-family:monospace;resize:vertical;margin:8px 0;box-sizing:border-box;">${this._esc(panelSettings.css || '')}</textarea>
                    <div style="display:flex;gap:8px;">
                        <button id="sdpCssApplyBtn" style="flex:1;padding:8px;border:none;border-radius:8px;background:rgba(240,147,43,0.12);color:#f0932b;font-size:12px;cursor:pointer;">应用</button>
                        <button id="sdpCssClearBtn" style="padding:8px 12px;border:none;border-radius:8px;background:rgba(255,100,100,0.08);color:rgba(255,100,100,0.5);font-size:12px;cursor:pointer;">清除</button>
                    </div>
                    <button id="sdpCustomizeClose" style="width:100%;margin-top:12px;padding:10px;border:none;border-radius:8px;background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.3);font-size:13px;cursor:pointer;">关闭</button>
                </div>
            </div>`;

        document.body.appendChild(panel);
        this._applyStatusPanelCss(panelSettings.css || '');

        // 事件绑定
        panel.querySelector('#sdpBack').addEventListener('click', () => this.closeStatusDetailPanel());
        
        // 明暗切换
        panel.querySelector('#sdpThemeBtn').addEventListener('click', () => {
            panel.classList.toggle('light');
            this._statusThemeLight = panel.classList.contains('light');
        });
        if (this._statusThemeLight) panel.classList.add('light');
        
        // Tab切换
        panel.querySelectorAll('.sdp-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.closeStatusDetailPanel();
                this.openStatusDetailPanel(tab.getAttribute('data-field'));
            });
        });

        // 删除历史
        panel.querySelectorAll('.sdp-history-del').forEach(btn => {
            btn.addEventListener('click', () => {
                const f = btn.getAttribute('data-field');
                const idx = parseInt(btn.getAttribute('data-idx'));
                this._deleteStatusHistory(f, idx);
                this.closeStatusDetailPanel();
                this.openStatusDetailPanel(f);
            });
        });

        // 修改历史
        panel.querySelectorAll('.sdp-history-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const f = btn.getAttribute('data-field');
                const idx = parseInt(btn.getAttribute('data-idx'));
                this._editStatusHistory(f, idx);
            });
        });

        // 自定义面板
        panel.querySelector('#sdpCustomizeBtn').addEventListener('click', () => {
            panel.querySelector('#sdpCustomize').style.display = 'flex';
        });
        panel.querySelector('#sdpCustomizeClose').addEventListener('click', () => {
            panel.querySelector('#sdpCustomize').style.display = 'none';
        });

        // 背景图
        panel.querySelector('#sdpBgUploadBtn').addEventListener('click', () => panel.querySelector('#sdpBgInput').click());
        panel.querySelector('#sdpBgInput').addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image(); img.onload = () => {
                    const c = document.createElement('canvas'); const s = Math.min(1,1080/img.width);
                    c.width=img.width*s;c.height=img.height*s; c.getContext('2d').drawImage(img,0,0,c.width,c.height);
                    const bgData = c.toDataURL('image/jpeg',0.7);
                    this._saveStatusPanelSetting('bgImage', bgData);
                    panel.querySelector('.sdp-bg').style.backgroundImage = `url(${bgData})`;
                    panel.querySelector('.sdp-bg').style.backgroundSize = 'cover';
                    this._toast('背景已更新');
                }; img.src = ev.target.result;
            }; reader.readAsDataURL(file);
        });
        panel.querySelector('#sdpBgResetBtn').addEventListener('click', () => {
            this._saveStatusPanelSetting('bgImage', '');
            panel.querySelector('.sdp-bg').style.backgroundImage = '';
            this._toast('背景已清除');
        });

        // CSS
        panel.querySelector('#sdpCssRefToggle').addEventListener('click', function() {
            const ref = panel.querySelector('#sdpCssRef');
            ref.style.display = ref.style.display === 'none' ? 'block' : 'none';
        });
        panel.querySelector('#sdpCssApplyBtn').addEventListener('click', () => {
            const css = panel.querySelector('#sdpCssTextarea')?.value.trim() || '';
            this._saveStatusPanelSetting('css', css);
            this._applyStatusPanelCss(css);
            this._toast('CSS已应用');
        });
        panel.querySelector('#sdpCssClearBtn').addEventListener('click', () => {
            this._saveStatusPanelSetting('css', '');
            this._applyStatusPanelCss('');
            panel.querySelector('#sdpCssTextarea').value = '';
            this._toast('CSS已清除');
        });
    }

    closeStatusDetailPanel() {
        document.getElementById('statusDetailPanel')?.remove();
        this._removeStatusPanelCss();
    }

    _deleteStatusHistory(field, idx) {
        const ci = window.chatInterface;
        if (!ci?.currentFriendCode) return;
        const data = ci.storage.getIntimacyData(ci.currentFriendCode);
        if (data.aiStatusHistory?.[field]) {
            data.aiStatusHistory[field].splice(idx, 1);
            ci.storage.saveIntimacyData(ci.currentFriendCode, data);
            this._toast('已删除');
        }
    }

    _editStatusHistory(field, idx) {
        const ci = window.chatInterface;
        if (!ci?.currentFriendCode) return;
        const data = ci.storage.getIntimacyData(ci.currentFriendCode);
        const item = data.aiStatusHistory?.[field]?.[idx];
        if (!item) return;
        
        const newVal = prompt('修改内容：', item.value);
        if (newVal === null) return;
        if (!newVal.trim()) { this._toast('内容不能为空'); return; }
        
        data.aiStatusHistory[field][idx].value = newVal.trim();
        ci.storage.saveIntimacyData(ci.currentFriendCode, data);
        this._toast('已修改');
        
        // 刷新面板
        this.closeStatusDetailPanel();
        this.openStatusDetailPanel(field);
    }

    _saveStatusPanelSetting(key, value) {
        const ci = window.chatInterface;
        if (!ci?.currentFriendCode) return;
        const data = ci.storage.getIntimacyData(ci.currentFriendCode);
        if (!data.statusPanelSettings) data.statusPanelSettings = {};
        data.statusPanelSettings[key] = value;
        ci.storage.saveIntimacyData(ci.currentFriendCode, data);
    }

    _applyStatusPanelCss(css) {
        this._removeStatusPanelCss();
        if (css) {
            const el = document.createElement('style');
            el.id = 'statusPanelCssTag';
            el.textContent = css;
            document.head.appendChild(el);
        }
    }

    _removeStatusPanelCss() {
        document.getElementById('statusPanelCssTag')?.remove();
    }

    // ==================== 好友详细资料页 ====================
    openFriendProfilePage() {
        const ci = window.chatInterface;
        if (!ci?.currentFriend || !ci?.currentFriendCode) return;

        let page = document.getElementById('friendProfilePage');
        if (!page) {
            page = document.createElement('div');
            page.className = 'friend-profile-page';
            page.id = 'friendProfilePage';
            document.body.appendChild(page);
        }
        this._renderProfilePage(page);
        requestAnimationFrame(() => page.classList.add('open'));
    }

    closeFriendProfilePage() {
        const page = document.getElementById('friendProfilePage');
        if (page) page.classList.remove('open');
    }

    _renderProfilePage(page) {
        const ci = window.chatInterface;
        const friend = ci.currentFriend;
        const code = ci.currentFriendCode;
        const storage = ci.storage;
        
        const displayName = friend.nickname || friend.name;
        const avatarSrc = friend.avatar || 'assets/icons/chat/default-avatar.png';
        const friendCode = friend.code || '';
        const addedDate = friend.addedDate || friend.createdAt || '';
        const addedDateStr = addedDate ? new Date(addedDate).toLocaleString('zh-CN') : '未知';
        
        // 统计
        const chat = storage.getChatByFriendCode(code);
        const totalMsgs = chat?.messages?.length || 0;
        
        // 来源
        const source = friend.source || '通过编码添加';
        const addHistory = friend.addHistory || [{ date: addedDate, method: source }];

        // 权限
        const settings = storage.getChatSettings(code) || {};
        const blockMe = settings.blockMyMoments || false;
        const blockThem = settings.blockTheirMoments || false;

        page.innerHTML = `
            <div class="fp-header">
                <button class="fp-back" id="fpBack">←</button>
                <div class="fp-title">好友资料</div>
            </div>

            <!-- 头部 -->
            <div class="fp-hero">
                <img class="fp-hero-avatar" src="${avatarSrc}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect width=%2264%22 height=%2264%22 fill=%22%23333%22/></svg>'">
                <div class="fp-hero-info">
                    <div class="fp-hero-name">${this._esc(displayName)}</div>
                    <div class="fp-hero-code">编码：${friendCode}</div>
                </div>
            </div>

            <!-- 基本信息 -->
            <div class="fp-group">
                <div class="fp-row clickable" data-edit="nickname">
                    <div class="fp-row-label">备注</div>
                    <div class="fp-row-value">${this._esc(friend.nickname) || '未设置'}</div>
                    <span class="fp-row-arrow">›</span>
                </div>
                <div class="fp-row">
                    <div class="fp-row-label">网名</div>
                    <div class="fp-row-value">${this._esc(friend.name)}</div>
                </div>
                <div class="fp-row">
                    <div class="fp-row-label">实际姓名</div>
                    <div class="fp-row-value">${this._esc(friend.realName) || '未公开'}</div>
                </div>
                <div class="fp-row">
                    <div class="fp-row-label">拍一拍</div>
                    <div class="fp-row-value">${this._esc(friend.poke) || '拍了拍你'}</div>
                </div>
            </div>

            <!-- 时间和来源 -->
            <div class="fp-group">
                <div class="fp-row">
                    <div class="fp-row-label">添加时间</div>
                    <div class="fp-row-value">${addedDateStr}</div>
                </div>
                <div class="fp-row clickable" id="fpSourceRow">
                    <div class="fp-row-label">来源</div>
                    <div class="fp-row-value">${this._esc(source)}</div>
                    <span class="fp-row-arrow">›</span>
                </div>
                <div class="fp-source-history" id="fpSourceHistory">
                    ${addHistory.map((h, i) => `第${i+1}次添加：${h.date ? new Date(h.date).toLocaleString('zh-CN') : '未知'} · ${h.method || '编码添加'}`).join('<br>')}
                </div>
                <div class="fp-row">
                    <div class="fp-row-label">总聊天</div>
                    <div class="fp-row-value">${totalMsgs} 条消息</div>
                </div>
            </div>

            <!-- 入口 -->
            <div class="fp-entry-row">
                <button class="fp-entry-btn fp-entry-ghost" onclick="window.chatInterface?.showCssToast?.('📷 朋友圈开发中...')">📷 TA的朋友圈</button>
                <button class="fp-entry-btn fp-entry-ghost" onclick="window.chatInterface?.showCssToast?.('💕 情侣空间开发中...')">💕 情侣空间</button>
            </div>

            <!-- 权限 -->
            <div class="fp-group-title" style="padding:10px 16px 0;font-size:11px;color:rgba(255,255,255,0.2);">朋友权限</div>
            <div class="fp-group">
                <div class="fp-row" style="justify-content:space-between;">
                    <div class="fp-row-label">不让TA看我</div>
                    <label class="setting-switch" style="margin:0;">
                        <input type="checkbox" id="fpBlockMe" ${blockMe ? 'checked' : ''}>
                        <span class="switch-slider"></span>
                    </label>
                </div>
                <div class="fp-row" style="justify-content:space-between;">
                    <div class="fp-row-label">不看TA</div>
                    <label class="setting-switch" style="margin:0;">
                        <input type="checkbox" id="fpBlockThem" ${blockThem ? 'checked' : ''}>
                        <span class="switch-slider"></span>
                    </label>
                </div>
            </div>

            <!-- 危险操作 -->
            <div class="fp-danger-group">
                <div style="font-size:11px;color:rgba(255,255,255,0.2);margin-bottom:8px;">危险操作</div>
                <button class="fp-danger-btn fp-danger-warn" id="fpClearChat">清空聊天记录</button>
                <button class="fp-danger-btn fp-danger-red" id="fpBlacklist">拉黑好友</button>
                <button class="fp-danger-btn fp-danger-fatal" id="fpDeleteFriend">删除好友</button>
            </div>`;

        // 事件绑定
        page.querySelector('#fpBack').addEventListener('click', () => this.closeFriendProfilePage());
        
        // 来源展开
        page.querySelector('#fpSourceRow')?.addEventListener('click', () => {
            page.querySelector('#fpSourceHistory')?.classList.toggle('open');
        });

        // 备注编辑
        page.querySelector('[data-edit="nickname"]')?.addEventListener('click', () => {
            const val = prompt('修改备注名：', friend.nickname || '');
            if (val !== null) {
                storage.updateFriend(code, { nickname: val.trim() });
                ci.currentFriend.nickname = val.trim();
                // 更新聊天题头
                const nameEl = document.querySelector('#chatFriendName span');
                if (nameEl) nameEl.textContent = val.trim() || friend.name;
                this._renderProfilePage(page);
                this._toast('备注已更新');
            }
        });

        // 权限开关
        page.querySelector('#fpBlockMe')?.addEventListener('change', (e) => {
            const s = storage.getChatSettings(code) || {};
            s.blockMyMoments = e.target.checked;
            storage.saveChatSettings(code, { ...ci.settings, ...s });
        });
        page.querySelector('#fpBlockThem')?.addEventListener('change', (e) => {
            const s = storage.getChatSettings(code) || {};
            s.blockTheirMoments = e.target.checked;
            storage.saveChatSettings(code, { ...ci.settings, ...s });
        });

        // 危险操作
        page.querySelector('#fpClearChat')?.addEventListener('click', () => this._clearChat(code, storage));
        page.querySelector('#fpBlacklist')?.addEventListener('click', () => this._blacklistFriend(code, friend, storage));
        page.querySelector('#fpDeleteFriend')?.addEventListener('click', () => this._deleteFriend(code, friend, storage));
    }

    // ==================== 危险操作 ====================
    _clearChat(code, storage) {
        const choice = confirm('清空聊天记录？\n\n点「确定」= 仅清空聊天记录\n\n如果想连总结和记忆一起清空，请在清空后手动到记忆模块删除');
        if (!choice) return;
        
        // 清空消息
        const chat = storage.getChatByFriendCode(code);
        if (chat) {
            chat.messages = [];
            storage.saveData('zero_phone_chats', storage.getData('zero_phone_chats').map(c => c.friendCode === code ? chat : c));
        }
        
        // 刷新界面
        const ci = window.chatInterface;
        if (ci && ci.currentFriendCode === code) {
            ci.messages = [];
            ci.renderMessages();
        }
        this._toast('聊天记录已清空');
    }

    _blacklistFriend(code, friend, storage) {
        if (!confirm(`确定拉黑「${friend.nickname || friend.name}」吗？\n\n拉黑后对方有可能会被系统通知，有概率被对方删除或收到挽回消息`)) return;
        storage.updateFriend(code, { blacklisted: true, blacklistedDate: new Date().toISOString() });
        this._toast(`已拉黑「${friend.nickname || friend.name}」`);
        this.closeFriendProfilePage();
    }

    _deleteFriend(code, friend, storage) {
        const name = friend.nickname || friend.name;
        const choice = confirm(`删除好友「${name}」？\n\n⚠️ 确定 = 仅删除好友关系（可通过编码重新添加）\n\n如果要彻底删除（连编码一起抹除，永远加不回来），请输入"永久删除"后确认`);
        if (!choice) return;
        
        const permanent = prompt('输入"永久删除"来彻底抹除，或直接点确定仅删除好友关系：');
        
        if (permanent === '永久删除') {
            // 彻底删除：从好友列表移除（不是软删除）
            const friends = storage.getAllFriendsIncludingDeleted();
            const idx = friends.findIndex(f => f.code === code);
            if (idx >= 0) friends.splice(idx, 1);
            storage.saveData(storage.KEYS.FRIENDS, friends);
            this._toast(`「${name}」已被彻底删除，无法恢复`);
        } else {
            // 软删除
            storage.deleteFriend(code);
            this._toast(`已删除「${name}」`);
        }
        
        this.closeFriendProfilePage();
        // 返回聊天列表
        const ci = window.chatInterface;
        if (ci) ci.closeChatInterface();
    }

    // ==================== AI状态指令处理 ====================
    processStatusCommands(text) {
        const ci = window.chatInterface;
        if (!ci?.currentFriendCode) return text;
        
        // [STATUS:字段:内容] - AI更新自己的状态
        const statusRegex = /\[STATUS:([^:]+):([^\]]+)\]/g;
        let match;
        while ((match = statusRegex.exec(text)) !== null) {
            const field = match[1].trim().toLowerCase();
            const value = match[2].trim();
            
            const fieldMap = { '装扮':'outfit', 'outfit':'outfit', '动作':'action', 'action':'action', '心声':'thoughts', 'thoughts':'thoughts', '位置':'location', 'location':'location' };
            const key = fieldMap[field];
            
            if (key) {
                const data = ci.storage.getIntimacyData(ci.currentFriendCode);
                if (!data.aiStatus) data.aiStatus = {};
                
                // 保存历史
                if (!data.aiStatusHistory) data.aiStatusHistory = {};
                if (!data.aiStatusHistory[key]) data.aiStatusHistory[key] = [];
                if (data.aiStatus[key]) {
                    data.aiStatusHistory[key].push({
                        value: data.aiStatus[key],
                        date: data.aiStatus[key + 'Date'] || new Date().toISOString()
                    });
                }
                
                data.aiStatus[key] = value;
                data.aiStatus[key + 'Date'] = new Date().toISOString();
                ci.storage.saveIntimacyData(ci.currentFriendCode, data);
            }
        }
        text = text.replace(/\[STATUS:[^\]]+\]/g, '');
        
        // [STATUS_CSS]css[/STATUS_CSS] - AI美化状态面板
        const cssMatcher = text.match(/\[STATUS_?\s*CSS\]([\s\S]*?)\[\/?\s*STATUS_?\s*CSS\]/i);
        if (cssMatcher) {
            const css = cssMatcher[1].trim();
            text = text.replace(/\[STATUS_?\s*CSS\][\s\S]*?\[\/?\s*STATUS_?\s*CSS\]/gi, '');
            
            const data = ci.storage.getIntimacyData(ci.currentFriendCode);
            if (!data.statusPanelSettings) data.statusPanelSettings = {};
            data.statusPanelSettings.css = css;
            ci.storage.saveIntimacyData(ci.currentFriendCode, data);
            this._applyStatusPanelCss(css);
            
            const friendName = ci.currentFriend?.nickname || ci.currentFriend?.name || 'TA';
            ci.showCssSystemMessage(`🎨 ${friendName} 装修了状态面板`);
        }
        
        return text;
    }

    // ==================== 工具 ====================
    _esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    _toast(msg) { window.chatInterface?.showCssToast?.(msg) || alert(msg); }
}

// 全局初始化
window.friendProfile = new FriendProfileManager();
