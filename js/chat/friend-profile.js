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

        const modeLabels = ['分开', '按类合并', '时间线'];
        const mode = this._sdpMode || 0; // 0=分开, 1=按类合并, 2=时间线
        const nextModeLabel = modeLabels[(mode + 1) % 3];
        const titleMap = [label, '全部动态', '动态时间线'];

        panel.innerHTML = `
            <div class="sdp-bg" style="${bgStyle}"></div>
            <div class="sdp-content">
                <div class="sdp-header">
                    <button class="sdp-back" id="sdpBack">←</button>
                    <div class="sdp-title">${titleMap[mode]}</div>
                    <button class="sdp-merge-btn" id="sdpMergeBtn" title="切换视图">${nextModeLabel}</button>
                    <button class="ai-status-theme-btn" id="sdpThemeBtn" title="切换明暗">🌓</button>
                    <button class="sdp-customize-btn" id="sdpCustomizeBtn">⚙️</button>
                </div>

                ${mode === 1 ? this._renderCategoryMergedView(status, history, friendName, fieldLabels) : 
                  mode === 2 ? this._renderTimelineMergedView(status, history, friendName, fieldLabels) : `
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
                `}
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
        
        // 合并/分开切换（3种模式循环）
        panel.querySelector('#sdpMergeBtn').addEventListener('click', () => {
            this._sdpMode = ((this._sdpMode || 0) + 1) % 3;
            this.closeStatusDetailPanel();
            this.openStatusDetailPanel(field);
        });
        
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

    // 按类合并视图：四种状态各自展示（原版合并）
    _renderCategoryMergedView(status, history, friendName, fieldLabels) {
        const fields = ['outfit', 'action', 'thoughts', 'location'];
        let html = '';
        
        for (const f of fields) {
            const cur = status[f] || '';
            const curDate = status[f + 'Date'] || '';
            const list = history[f] || [];
            
            html += `<div class="sdp-merged-section">
                <div class="sdp-merged-label">${fieldLabels[f]}</div>
                <div class="sdp-current" style="margin:0 16px 8px;">
                    ${cur ? `
                        <div class="sdp-current-value" style="font-size:15px;">${this._esc(cur)}</div>
                        <div class="sdp-current-date">${curDate ? new Date(curDate).toLocaleString('zh-CN') : ''}</div>
                    ` : `<div class="sdp-empty" style="padding:10px;">${friendName}还没设置</div>`}
                </div>`;
            
            if (list.length > 0) {
                html += `<div style="padding:0 16px 12px;">`;
                html += list.slice().reverse().slice(0, 5).map((h, i) => {
                    const realIdx = list.length - 1 - i;
                    return `<div class="sdp-history-item" style="margin-bottom:4px;">
                        <div class="sdp-history-value" style="font-size:12px;">${this._esc(h.value)}</div>
                        <div class="sdp-history-meta">
                            <span>${h.date ? new Date(h.date).toLocaleString('zh-CN') : ''}</span>
                            <div style="display:flex;gap:6px;">
                                <button class="sdp-history-edit" data-field="${f}" data-idx="${realIdx}" style="padding:2px 8px;border:none;border-radius:6px;background:rgba(100,180,255,0.08);color:rgba(100,180,255,0.6);font-size:9px;cursor:pointer;">改</button>
                                <button class="sdp-history-del" data-field="${f}" data-idx="${realIdx}">删</button>
                            </div>
                        </div>
                    </div>`;
                }).join('');
                if (list.length > 5) {
                    html += `<div style="text-align:center;font-size:10px;color:rgba(255,255,255,0.15);padding:4px;">还有${list.length - 5}条（切到分开模式查看全部）</div>`;
                }
                html += `</div>`;
            }
            html += `</div>`;
        }
        
        return html;
    }

    // 时间线合并视图：按时间排序的卡片
    _renderTimelineMergedView(status, history, friendName, fieldLabels) {
        // 当前状态汇总卡
        let html = `<div class="sdp-current" style="margin:0 16px 12px;">
            <div class="sdp-current-label" style="margin-bottom:10px;">当前状态</div>`;
        ['outfit','action','thoughts','location'].forEach(f => {
            const val = status[f] || '';
            html += `<div style="margin-bottom:8px;">
                <span style="font-size:11px;color:rgba(240,147,43,0.6);">${fieldLabels[f]}</span>
                <div style="font-size:14px;color:${val ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.15)'};margin-top:2px;">${val ? this._esc(val) : '未设置'}</div>
            </div>`;
        });
        html += `</div>`;
        
        // 合并所有历史记录并按时间排序
        const allHistory = [];
        ['outfit','action','thoughts','location'].forEach(f => {
            (history[f] || []).forEach((h, idx) => {
                allHistory.push({ field: f, label: fieldLabels[f], value: h.value, date: h.date, fieldKey: f, idx });
            });
            // 加入当前值（作为最新的一条）
            if (status[f]) {
                allHistory.push({ field: f, label: fieldLabels[f], value: status[f], date: status[f + 'Date'] || '', isCurrent: true });
            }
        });
        allHistory.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        
        // 按日期分组显示
        html += `<div class="sdp-history-title" style="margin-top:4px;">全部动态 (${allHistory.length})</div>`;
        html += `<div style="padding:0 16px 40px;">`;
        
        if (allHistory.length === 0) {
            html += '<div class="sdp-empty">暂无记录</div>';
        } else {
            // 尝试按相近时间(5分钟内)聚合成卡片
            const cards = [];
            let currentCard = null;
            allHistory.forEach(item => {
                const ts = new Date(item.date || 0).getTime();
                if (!currentCard || Math.abs(ts - currentCard.ts) > 5 * 60000) {
                    currentCard = { ts, date: item.date, items: [] };
                    cards.push(currentCard);
                }
                currentCard.items.push(item);
            });
            
            html += cards.map(card => {
                const dateStr = card.date ? new Date(card.date).toLocaleString('zh-CN') : '';
                const itemsHtml = card.items.map(item => 
                    `<div style="margin-bottom:6px;"><span style="font-weight:600;color:rgba(240,147,43,0.7);font-size:12px;">${item.label.substring(2)}：</span><span style="color:rgba(255,255,255,0.7);font-size:13px;">${this._esc(item.value)}</span>${item.isCurrent ? '<span style="font-size:9px;color:rgba(100,255,100,0.4);margin-left:6px;">当前</span>' : ''}</div>`
                ).join('');
                return `<div class="sdp-history-item" style="margin-bottom:8px;">
                    <div style="font-size:10px;color:rgba(255,255,255,0.2);margin-bottom:6px;">${dateStr}</div>
                    ${itemsHtml}
                </div>`;
            }).join('');
        }
        html += `</div>`;
        
        return html;
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

    async _editStatusHistory(field, idx) {
        const ci = window.chatInterface;
        if (!ci?.currentFriendCode) return;
        const data = ci.storage.getIntimacyData(ci.currentFriendCode);
        const item = data.aiStatusHistory?.[field]?.[idx];
        if (!item) return;
        
        const newVal = await this._prompt('修改内容', '', '输入新内容', item.value);
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

    // ==================== 自定义弹窗系统（替代原生prompt/confirm）====================
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
                <button id="fpEditPersonaBtn" style="padding:8px 14px;border:none;border-radius:10px;background:rgba(240,147,43,0.12);color:#f0932b;font-size:12px;font-weight:600;cursor:pointer;flex-shrink:0;">编辑人设</button>
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
                <div class="fp-row">
                    <div class="fp-row-label">自动回复</div>
                    <div class="fp-row-value" style="font-style:italic;">${(() => { const d = ci?.storage?.getIntimacyData(ci?.currentFriendCode); return this._esc(d?.aiState?.autoReply) || '未设置'; })()}</div>
                </div>
                <div class="fp-row">
                    <div class="fp-row-label">个性签名</div>
                    <div class="fp-row-value">${this._esc(friend.signature) || '这个人很懒...'}</div>
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
                <button class="fp-entry-btn fp-entry-ghost" onclick="window.momentsManager?.openForFriend?.('${code}')">📷 TA的朋友圈</button>
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
        
        // 编辑人设按钮
        page.querySelector('#fpEditPersonaBtn')?.addEventListener('click', () => {
            this.closeFriendProfilePage();
            // 打开编辑弹窗（通过 chatApp）
            const app = (typeof chatApp !== 'undefined') ? chatApp : window.chatApp;
            if (app?.openEditModal) {
                app.openEditModal(code);
            } else {
                this._toast('编辑功能不可用');
            }
        });
        
        // 来源展开
        page.querySelector('#fpSourceRow')?.addEventListener('click', () => {
            page.querySelector('#fpSourceHistory')?.classList.toggle('open');
        });

        // 备注编辑
        page.querySelector('[data-edit="nickname"]')?.addEventListener('click', async () => {
            const val = await this._prompt('修改备注名', '', '输入备注名', friend.nickname || '');
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
    async _clearChat(code, storage) {
        const r = await this._showDialog({
            title: '清空聊天记录',
            message: '请选择清空方式：',
            buttons: [
                { text: '取消', value: 'cancel' },
                { text: '仅聊天消息', value: 'messages' },
                { text: '全部清空', value: 'all', danger: true }
            ]
        });
        
        if (r === 'cancel' || r === false || r === null) return;
        
        const chats = storage.getData('zero_phone_chats') || [];
        const chat = chats.find(c => c.friendCode === code);
        
        if (chat) {
            // 清空消息
            chat.messages = [];
            
            if (r === 'all') {
                // 连总结、核心记忆、记忆碎片一起清空
                chat.summaries = [];
                chat.coreMemories = [];
                chat.memoryFragments = [];
            }
            
            storage.saveData('zero_phone_chats', chats);
        }
        
        // 刷新界面
        const ci = window.chatInterface;
        if (ci && ci.currentFriendCode === code) {
            ci.messages = [];
            ci.renderMessages();
        }
        this._toast(r === 'all' ? '聊天记录、总结、记忆已全部清空' : '聊天消息已清空');
    }

    async _blacklistFriend(code, friend, storage) {
        const name = friend.nickname || friend.name;
        const ok = await this._confirm('拉黑好友', `确定拉黑「${name}」吗？\n\n拉黑后：\n· TA每天只能对你说一轮话\n· TA大概率会知道自己被拉黑\n· 可以在黑名单中解除`, '拉黑', '取消');
        if (!ok) return;
        storage.updateFriend(code, { blacklisted: true, blacklistedDate: new Date().toISOString() });
        this._toast(`已拉黑「${friend.nickname || friend.name}」`);
        this.closeFriendProfilePage();
    }

    async _deleteFriend(code, friend, storage) {
        const name = friend.nickname || friend.name;
        
        const r = await this._showDialog({
            title: `删除好友「${name}」`,
            message: '请选择删除方式：',
            buttons: [
                { text: '取消', value: 'cancel' },
                { text: '仅删除好友', value: 'soft', primary: true },
                { text: '彻底抹除', value: 'permanent', danger: true }
            ]
        });
        
        if (r === 'cancel' || r === false || r === null) return;
        
        if (r === 'permanent') {
            const confirmText = await this._prompt('彻底删除确认', `输入「永久删除」来确认彻底抹除「${name}」\n\n⚠️ 此操作不可逆，连编码一起消失，永远加不回来`, '输入"永久删除"');
            if (confirmText !== '永久删除') {
                this._toast('输入不正确，取消操作');
                return;
            }
            const friends = storage.getAllFriendsIncludingDeleted();
            const idx = friends.findIndex(f => f.code === code);
            if (idx >= 0) friends.splice(idx, 1);
            storage.saveData(storage.KEYS.FRIENDS, friends);
            this._toast(`「${name}」已被彻底删除，无法恢复`);
        } else {
            storage.deleteFriend(code);
            this._toast(`已删除「${name}」`);
        }
        
        this.closeFriendProfilePage();
        const ci = window.chatInterface;
        if (ci) ci.closeChatInterface();
    }

    // ==================== AI状态指令处理 ====================
    processStatusCommands(text) {
        const ci = window.chatInterface;
        if (!ci?.currentFriendCode) return text;
        const friend = ci.currentFriend;
        const friendName = friend?.nickname || friend?.name || 'TA';
        
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
        
        // [AI_NICKNAME:新网名] - AI修改自己的网名
        const nickMatch = text.match(/\[AI_NICKNAME:([^\]]+)\]/);
        if (nickMatch) {
            const newName = nickMatch[1].trim();
            text = text.replace(/\[AI_NICKNAME:[^\]]+\]/g, '');
            if (newName && ci.storage) {
                const oldName = ci.currentFriend?.name || '';
                ci.storage.updateFriend(ci.currentFriendCode, { name: newName });
                if (ci.currentFriend) ci.currentFriend.name = newName;
                // 更新题头（如果没有备注就显示新网名）
                if (!ci.currentFriend?.nickname) {
                    const nameEl = document.querySelector('#chatFriendName span');
                    if (nameEl) nameEl.textContent = newName;
                }
                ci.showCssSystemMessage(`📝 ${oldName || 'TA'} 把网名改成了「${newName}」`);
            }
        }
        
        // [AI_POKE:拍一拍文字] - AI修改自己的拍一拍
        const pokeMatch = text.match(/\[AI_POKE:([^\]]+)\]/);
        if (pokeMatch) {
            const newPoke = pokeMatch[1].trim();
            text = text.replace(/\[AI_POKE:[^\]]+\]/g, '');
            if (newPoke && ci.storage) {
                ci.storage.updateFriend(ci.currentFriendCode, { poke: newPoke });
                if (ci.currentFriend) ci.currentFriend.poke = newPoke;
                const friendName = ci.currentFriend?.nickname || ci.currentFriend?.name || 'TA';
                ci.showCssSystemMessage(`📝 ${friendName} 修改了拍一拍为「${newPoke}」`);
            }
        }
        
        // [AI_CHANGE_CODE:新编码] - AI修改自己的好友编码（每年3次）
        const codeMatch = text.match(/\[AI_CHANGE_CODE:([^\]]+)\]/);
        if (codeMatch) {
            text = text.replace(/\[AI_CHANGE_CODE:[^\]]+\]/g, '');
            const newCode = codeMatch[1].trim();
            const friend = ci.currentFriend;
            const friendName = friend?.nickname || friend?.name || 'TA';
            
            if (friend && ci.storage) {
                const yr = new Date().getFullYear();
                if (friend.codeLastYear !== yr) {
                    friend.codeChangesThisYear = 0;
                    friend.codeLastYear = yr;
                }
                const used = friend.codeChangesThisYear || 0;
                
                if (used >= 3) {
                    ci.showCssSystemMessage(`⚠️ ${friendName} 今年修改编码次数已用完（3次）`);
                } else if (!newCode.match(/^[A-Za-z0-9_\-]{3,20}$/)) {
                    ci.showCssSystemMessage(`⚠️ ${friendName} 想改编码但格式不对（3-20位字母/数字/下划线）`);
                } else {
                    // 检查编码是否已被使用
                    const all = ci.storage.getAllFriendsIncludingDeleted();
                    const conflict = all.find(f => f.code === newCode && f.code !== friend.code);
                    if (conflict) {
                        ci.showCssSystemMessage(`⚠️ ${friendName} 想改编码为「${newCode}」但已被占用`);
                    } else {
                        const oldCode = friend.code;
                        if (!friend.codeHistory) friend.codeHistory = [];
                        friend.codeHistory.push({ code: oldCode, changedAt: new Date().toISOString() });
                        friend.codeChangesThisYear = used + 1;
                        
                        // ====== 通用迁移：扫描所有包含旧编码的key，自动换成新编码 ======
                        // 这样不管以后加什么新功能，只要key里含friendCode就会自动迁移
                        const cache = ci.storage._cache;
                        const keysToMigrate = Object.keys(cache).filter(k => k.includes(oldCode));
                        keysToMigrate.forEach(oldKey => {
                            const newKey = oldKey.replace(oldCode, newCode);
                            if (newKey !== oldKey) {
                                ci.storage.saveData(newKey, cache[oldKey]);
                                ci.storage.deleteData(oldKey);
                            }
                        });
                        // 也扫localStorage（兜底）
                        const lsKeys = [];
                        for (let i = 0; i < localStorage.length; i++) {
                            const k = localStorage.key(i);
                            if (k && k.includes(oldCode)) lsKeys.push(k);
                        }
                        lsKeys.forEach(oldKey => {
                            const newKey = oldKey.replace(oldCode, newCode);
                            if (newKey !== oldKey) {
                                try {
                                    const val = localStorage.getItem(oldKey);
                                    localStorage.setItem(newKey, val);
                                    localStorage.removeItem(oldKey);
                                } catch(e) {}
                            }
                        });
                        
                        // 更新好友列表里的code字段
                        const friends = ci.storage.getAllFriendsIncludingDeleted();
                        const idx = friends.findIndex(f => f.code === oldCode);
                        friend.code = newCode;
                        if (idx >= 0) friends[idx] = {...friend};
                        ci.storage.saveData(ci.storage.KEYS.FRIENDS, friends);
                        
                        // 更新聊天记录里的friendCode
                        const chats = ci.storage.getChats();
                        const chat = chats.find(c => c.friendCode === oldCode);
                        if (chat) { chat.friendCode = newCode; ci.storage.saveData(ci.storage.KEYS.CHATS, chats); }
                        
                        // 更新当前引用（不reload，保持当前状态）
                        ci.currentFriendCode = newCode;
                        ci.currentFriend = friend;
                        
                        ci.showCssSystemMessage(`📝 ${friendName} 修改了好友编码：${oldCode} → ${newCode}（今年剩${2-used}次）`);
                    }
                }
            }
        }
        
        // [AI_CHANGE_NICKNAME:新网名] - AI改网名（直接生效）
        const chgNickMatch = text.match(/\[AI_CHANGE_NICKNAME:([^\]]+)\]/);
        if (chgNickMatch) {
            text = text.replace(/\[AI_CHANGE_NICKNAME:[^\]]+\]/g, '');
            const nn = chgNickMatch[1].trim();
            if (nn && friend) {
                friend.nickname = nn;
                ci.storage.updateFriend(friend.code, { nickname: nn });
                ci.showCssSystemMessage('✏️ ' + friendName + ' 把网名改成了「' + nn + '」');
            }
        }
        
        // [AI_CHANGE_REALNAME:新真名] - AI改真名（需要用户审批）
        const chgRealMatch = text.match(/\[AI_CHANGE_REALNAME:([^\]]+)\]/);
        if (chgRealMatch) {
            text = text.replace(/\[AI_CHANGE_REALNAME:[^\]]+\]/g, '');
            const nr = chgRealMatch[1].trim();
            if (nr && friend) {
                const oldName = friend.name || '无';
                setTimeout(async () => {
                    const ml = window.memoryLibrary;
                    const ok = ml
                        ? await ml._zpConfirm(friendName + ' 想修改真实姓名', '「' + oldName + '」→「' + nr + '」\n\n是否同意？')
                        : confirm(friendName + ' 想把真实姓名改为「' + nr + '」，同意吗？');
                    if (ok) {
                        ci.storage.updateFriend(friend.code, { name: nr });
                        ci.showCssSystemMessage('✅ 已同意修改真实姓名为「' + nr + '」');
                    } else {
                        ci.showCssSystemMessage('❌ 已驳回修改真实姓名的请求');
                    }
                }, 500);
            }
        }
        
        // [AI_CHANGE_PERSONA:新人设] - AI改人设（需要用户审批）
        const chgPersonaMatch = text.match(/\[AI_CHANGE_PERSONA:([^\]]+)\]/);
        if (chgPersonaMatch) {
            text = text.replace(/\[AI_CHANGE_PERSONA:[^\]]+\]/g, '');
            const np = chgPersonaMatch[1].trim();
            if (np && friend) {
                setTimeout(async () => {
                    const ml = window.memoryLibrary;
                    const preview = np.length > 200 ? np.substring(0, 200) + '...' : np;
                    const ok = ml
                        ? await ml._zpConfirm(friendName + ' 想修改人设', '新内容：\n' + preview + '\n\n是否同意？')
                        : confirm(friendName + ' 想修改人设，同意吗？\n' + preview);
                    if (ok) {
                        ci.storage.updateFriend(friend.code, { persona: np });
                        ci.showCssSystemMessage('✅ 已同意 ' + friendName + ' 修改人设');
                    } else {
                        ci.showCssSystemMessage('❌ 已驳回 ' + friendName + ' 修改人设的请求');
                    }
                }, 500);
            }
        }
        
        // [AI_TIMEZONE:UTC偏移] - AI调整自己的时区
        const tzMatch = text.match(/\[AI_TIMEZONE:([^\]]+)\]/);
        if (tzMatch) {
            text = text.replace(/\[AI_TIMEZONE:[^\]]+\]/g, '');
            if (ci.settings?.allowAiTimezone) {
                const offset = parseFloat(tzMatch[1].trim());
                if (!isNaN(offset) && offset >= -12 && offset <= 14) {
                    ci.settings.aiTimezone = offset;
                    ci.saveSettings();
                    const sign = offset >= 0 ? '+' : '';
                    const friendName = ci.currentFriend?.nickname || ci.currentFriend?.name || 'TA';
                    ci.showCssSystemMessage(`🕐 ${friendName} 把时区调整到了 UTC${sign}${offset}`);
                }
            }
        }
        
        // [AI_SIGNATURE:签名内容] - AI修改自己的个性签名
        const sigMatch = text.match(/\[AI_SIGNATURE:([^\]]+)\]/);
        if (sigMatch) {
            const newSig = sigMatch[1].trim();
            text = text.replace(/\[AI_SIGNATURE:[^\]]+\]/g, '');
            if (newSig && ci.storage) {
                ci.storage.updateFriend(ci.currentFriendCode, { signature: newSig });
                if (ci.currentFriend) ci.currentFriend.signature = newSig;
                const friendName = ci.currentFriend?.nickname || ci.currentFriend?.name || 'TA';
                ci.showCssSystemMessage(`✏️ ${friendName} 更新了个性签名`);
            }
        }
        
        // [AI_FAKE_IMAGE:描述] - AI发送假图片
        const fakeImgMatch = text.match(/\[AI_FAKE_IMAGE:([^\]]+)\]/);
        if (fakeImgMatch) {
            const desc = fakeImgMatch[1].trim();
            text = text.replace(/\[AI_FAKE_IMAGE:[^\]]+\]/g, '');
            if (desc && ci) {
                const fakeMsg = { type: 'ai', text: '', timestamp: new Date().toISOString(), _fakeImage: desc };
                ci.addMessage(fakeMsg);
                ci.storage.addMessage(ci.currentFriendCode, fakeMsg);
            }
        }
        
        // [AI_VOICE:内容] - AI发送语音条
        const voiceMatch = text.match(/\[AI_VOICE:([^\]]+)\]/);
        if (voiceMatch) {
            const voiceText = voiceMatch[1].trim();
            text = text.replace(/\[AI_VOICE:[^\]]+\]/g, '');
            if (voiceText && ci) {
                const duration = Math.max(1, Math.min(60, Math.ceil(voiceText.length / 3)));
                const barWidth = Math.min(75, 25 + duration * 1.5);
                const voiceMsg = { type: 'ai', text: `[语音消息] ${voiceText}`, timestamp: new Date().toISOString(), _voice: true, _voiceText: voiceText, _voiceDuration: duration, _voiceBarWidth: barWidth };
                ci.addMessage(voiceMsg);
                ci.storage.addMessage(ci.currentFriendCode, voiceMsg);
            }
        }
        
        // [AI_SEND_LIB_IMAGE:名字] - AI从图库发图给user
        const libImgMatch = text.match(/\[AI_SEND_LIB_IMAGE:([^\]]+)\]/);
        if (libImgMatch) {
            const imgName = libImgMatch[1].trim();
            text = text.replace(/\[AI_SEND_LIB_IMAGE:[^\]]+\]/g, '');
            if (ci && window.base64Library) {
                const ld = window.base64Library._getData();
                // 搜索所有库
                const allItems = [...(ld.avatars?.items||[]), ...(ld.webImages?.items||[]), ...(ld.stickers?.items||[])];
                const found = allItems.find(i => i.name === imgName) || allItems.find(i => (i.name||'').includes(imgName) || (i.desc||'').includes(imgName));
                if (found) {
                    const src = found.data || found.url || '';
                    const msg = { type: 'ai', text: '', timestamp: new Date().toISOString(), _stickerUrl: src, _stickerName: found.name };
                    ci.addMessage(msg);
                    ci.storage.addMessage(ci.currentFriendCode, msg);
                }
            }
        }
        
        // [AI_CHANGE_AVATAR:名字] - AI用图库的图换头像
        const avatarMatch = text.match(/\[AI_CHANGE_AVATAR:([^\]]+)\]/);
        if (avatarMatch) {
            const imgName = avatarMatch[1].trim();
            text = text.replace(/\[AI_CHANGE_AVATAR:[^\]]+\]/g, '');
            if (ci && window.base64Library) {
                const ld = window.base64Library._getData();
                const allItems = [...(ld.avatars?.items||[]), ...(ld.webImages?.items||[])];
                const found = allItems.find(i => i.name === imgName) || allItems.find(i => (i.name||'').includes(imgName));
                if (found && (found.data || found.url)) {
                    const src = found.data || found.url;
                    ci.storage.updateFriend(ci.currentFriendCode, { avatar: src });
                    if (ci.currentFriend) ci.currentFriend.avatar = src;
                    const friendName = ci.currentFriend?.nickname || ci.currentFriend?.name || 'TA';
                    ci.showCssSystemMessage(`${friendName} 换了头像「${found.name}」`);
                    // 刷新聊天界面中的AI头像
                    document.querySelectorAll('.message-ai .message-avatar img').forEach(img => { img.src = src; });
                }
            }
        }
        
        // [AI_CHANGE_AVATAR_FROM_CHAT] - AI用user发的图换头像
        if (text.includes('[AI_CHANGE_AVATAR_FROM_CHAT]')) {
            text = text.replace(/\[AI_CHANGE_AVATAR_FROM_CHAT\]/g, '');
            if (ci) {
                // 找最近的user发的图片
                const recentImg = [...ci.messages].reverse().find(m => m.type === 'user' && m._imageUrl);
                if (recentImg) {
                    ci.storage.updateFriend(ci.currentFriendCode, { avatar: recentImg._imageUrl });
                    if (ci.currentFriend) ci.currentFriend.avatar = recentImg._imageUrl;
                    const friendName = ci.currentFriend?.nickname || ci.currentFriend?.name || 'TA';
                    ci.showCssSystemMessage(`${friendName} 把你发的图片设为了头像`);
                    document.querySelectorAll('.message-ai .message-avatar img').forEach(img => { img.src = recentImg._imageUrl; });
                }
            }
        }
        
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

    // ==================== 黑名单管理 ====================
    openBlacklistPage() {
        document.getElementById('fpBlacklistPage')?.remove();
        
        const ci = window.chatInterface;
        if (!ci?.storage) return;
        
        const allFriends = ci.storage.getAllFriends();
        const blacklisted = allFriends.filter(f => f.blacklisted);
        
        const page = document.createElement('div');
        page.className = 'friend-profile-page open';
        page.id = 'fpBlacklistPage';
        
        page.innerHTML = `
            <div class="fp-header">
                <button class="fp-back" id="fpBlacklistBack">←</button>
                <div class="fp-title">黑名单</div>
            </div>
            <div style="padding:0 16px 40px;">
                ${blacklisted.length === 0 ? '<div style="text-align:center;padding:40px 0;color:rgba(255,255,255,0.15);font-size:13px;">黑名单是空的</div>' :
                    blacklisted.map(f => `<div class="fp-group" style="margin:8px 0;">
                        <div class="fp-row" style="gap:12px;">
                            <img src="${f.avatar || 'assets/icons/chat/default-avatar.png'}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;" onerror="this.src='assets/icons/chat/default-avatar.png'">
                            <div style="flex:1;">
                                <div style="font-size:14px;color:#fff;">${this._esc(f.nickname || f.name)}</div>
                                <div style="font-size:11px;color:rgba(255,255,255,0.25);font-family:monospace;">${f.code}</div>
                            </div>
                            <button class="fpd-btn fp-unblock-btn" data-code="${f.code}" style="padding:6px 14px;border:none;border-radius:8px;background:rgba(100,180,255,0.1);color:rgba(100,180,255,0.7);font-size:12px;cursor:pointer;">解除拉黑</button>
                        </div>
                    </div>`).join('')}
            </div>`;
        
        document.body.appendChild(page);
        
        page.querySelector('#fpBlacklistBack').addEventListener('click', () => page.remove());
        
        page.querySelectorAll('.fp-unblock-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const code = btn.getAttribute('data-code');
                const f = allFriends.find(fr => fr.code === code);
                const name = f?.nickname || f?.name || code;
                const ok = await this._confirm('解除拉黑', `确定将「${name}」从黑名单中移除吗？`, '解除', '取消');
                if (!ok) return;
                ci.storage.updateFriend(code, { blacklisted: false, blacklistedDate: '' });
                this._toast(`已将「${name}」移出黑名单`);
                page.remove();
                // 刷新好友列表（黑名单空了就自动消失）
                if (typeof chatApp !== 'undefined') chatApp.renderFriendList();
                // 如果还有黑名单成员就重新打开
                const remaining = ci.storage.getAllFriends().filter(fr => fr.blacklisted);
                if (remaining.length > 0) this.openBlacklistPage();
            });
        });
    }

    // ==================== 自定义弹窗系统（替代丑丑的浏览器弹窗） ====================
    _showDialog({ title, message, buttons, input, inputValue, inputPlaceholder }) {
        return new Promise((resolve) => {
            document.getElementById('fpDialog')?.remove();
            const dlg = document.createElement('div');
            dlg.id = 'fpDialog';
            dlg.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9500;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);';
            
            const inputHtml = input ? `<input type="text" id="fpDialogInput" value="${this._esc(inputValue||'')}" placeholder="${this._esc(inputPlaceholder||'')}" style="width:100%;padding:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:10px;color:#fff;font-size:14px;margin-top:12px;box-sizing:border-box;">` : '';
            
            const btnsHtml = (buttons || [{text:'确定',value:true},{text:'取消',value:false}]).map(b => {
                const style = b.danger ? 'background:rgba(255,60,60,0.12);color:rgba(255,100,100,0.9);' :
                              b.primary ? 'background:rgba(240,147,43,0.15);color:#f0932b;' :
                              'background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.5);';
                return `<button class="fp-dlg-btn" data-val="${this._esc(String(b.value))}" style="${style}">${this._esc(b.text)}</button>`;
            }).join('');
            
            dlg.innerHTML = `<div style="width:calc(100% - 48px);max-width:320px;background:#1c1c1c;border-radius:16px;border:1px solid rgba(255,255,255,0.08);padding:24px 20px 16px;animation:profileSlideUp 0.2s ease-out;">
                <div style="font-size:16px;font-weight:600;color:#fff;margin-bottom:8px;text-align:center;">${title || ''}</div>
                <div style="font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;text-align:center;white-space:pre-line;">${message || ''}</div>
                ${inputHtml}
                <div style="display:flex;gap:8px;margin-top:16px;">${btnsHtml}</div>
            </div>`;
            
            document.body.appendChild(dlg);
            
            // 自动聚焦输入框
            if (input) setTimeout(() => document.getElementById('fpDialogInput')?.focus(), 100);
            
            dlg.querySelectorAll('.fp-dlg-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const val = btn.getAttribute('data-val');
                    const inputEl = document.getElementById('fpDialogInput');
                    dlg.remove();
                    if (input) {
                        resolve(val === 'true' || val === 'confirm' ? (inputEl?.value ?? '') : null);
                    } else {
                        resolve(val === 'true' || val === 'confirm' ? true : val === 'false' || val === 'cancel' ? false : val);
                    }
                });
            });
        });
    }

    // 便捷方法
    async _confirm(title, message, confirmText = '确定', cancelText = '取消') {
        return this._showDialog({ title, message, buttons: [
            { text: cancelText, value: false },
            { text: confirmText, value: true, primary: true }
        ]});
    }

    async _dangerConfirm(title, message, confirmText = '确定', cancelText = '取消') {
        return this._showDialog({ title, message, buttons: [
            { text: cancelText, value: false },
            { text: confirmText, value: true, danger: true }
        ]});
    }

    async _prompt(title, message, defaultValue = '', placeholder = '') {
        return this._showDialog({ title, message, input: true, inputValue: defaultValue, inputPlaceholder: placeholder, buttons: [
            { text: '取消', value: 'cancel' },
            { text: '确定', value: 'confirm', primary: true }
        ]});
    }
    _esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    _toast(msg) { window.chatInterface?.showCssToast?.(msg) || alert(msg); }
}

// 全局初始化
window.friendProfile = new FriendProfileManager();

// 暴露全局自定义弹窗（供其他模块使用，替代丑陋的 confirm/prompt）
window.zpConfirm = (title, msg, okText, cancelText) => window.friendProfile._confirm(title, msg, okText, cancelText);
window.zpPrompt = (title, msg, defaultVal, placeholder) => window.friendProfile._prompt(title, msg, defaultVal, placeholder);
window.zpDangerConfirm = (title, msg, okText, cancelText) => window.friendProfile._dangerConfirm(title, msg, okText, cancelText);
