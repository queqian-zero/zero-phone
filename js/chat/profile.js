/**
 * 个人设置页模块（"我的"）
 * 独立于 chat-interface.js，通过 window.profileManager 暴露接口
 */
class ProfileManager {
    constructor(storage) {
        this.storage = storage;
        this._bound = false;
    }

    init() {
        if (!this._ensured) { this._ensureUserData(); this._ensured = true; }
        if (!this._bound) { this.bindEvents(); this._bound = true; }
        this.render();
    }

    _ensureUserData() {
        const s = this.storage.getUserSettings();
        let changed = false;
        if (!s.userNickname) { s.userNickname = s.userName || '〇'; changed = true; }
        if (!s.userFriendCode) { s.userFriendCode = this._genCode(); changed = true; }
        if (s.friendCodeChangesThisYear === undefined) { s.friendCodeChangesThisYear = 0; changed = true; }
        if (!s.friendCodeLastYear) { s.friendCodeLastYear = new Date().getFullYear(); changed = true; }
        if (!s.friendCodeHistory) { s.friendCodeHistory = []; changed = true; }
        if (!s.realName) { s.realName = ''; changed = true; }
        if (!s.birthday) { s.birthday = ''; changed = true; }
        if (!s.gender) { s.gender = ''; changed = true; }
        if (!s.region) { s.region = ''; changed = true; }
        if (!s.poke) { s.poke = '拍了拍你'; changed = true; }
        if (!s.signature) { s.signature = ''; changed = true; }
        if (s.profileCss === undefined) { s.profileCss = ''; changed = true; }
        if (!s.userPersona) { s.userPersona = ''; changed = true; }
        if (changed) this.storage.updateUserSettings(s);
    }

    _genCode() {
        const c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let code = 'ZP_';
        for (let i = 0; i < 8; i++) code += c[Math.floor(Math.random() * c.length)];
        return code;
    }

    // ==================== "我的" Tab 主页渲染 ====================
    render() {
        const s = this.storage.getUserSettings();
        const avatarEl = document.getElementById('profileAvatar');
        if (avatarEl) {
            avatarEl.src = s.userAvatar || 'assets/icons/chat/default-avatar.png';
            avatarEl.onerror = () => { avatarEl.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23333"/><text x="32" y="38" text-anchor="middle" fill="%23666" font-size="24">👤</text></svg>'; };
        }
        const nickEl = document.getElementById('profileNicknameText');
        if (nickEl) nickEl.textContent = s.userNickname || '〇';
        const codeEl = document.getElementById('profileFriendCodeText');
        if (codeEl) codeEl.textContent = `好友编码：${s.userFriendCode || '未生成'}`;
        // 应用自定义CSS
        this._applyProfileCss(s.profileCss || '');
    }

    bindEvents() {
        document.getElementById('profileHeaderCard')?.addEventListener('click', () => this.openDetailPage());
        document.getElementById('profileCodeCopyBtn')?.addEventListener('click', (e) => { e.stopPropagation(); this._copyText(this.storage.getUserSettings().userFriendCode || ''); });
        document.getElementById('profileMenuCollection')?.addEventListener('click', () => this._placeholder('收藏', '⭐'));
        document.getElementById('profileMenuMoments')?.addEventListener('click', () => window.momentsManager?.openForSelf?.());
        document.getElementById('profileMenuWallet')?.addEventListener('click', () => this._placeholder('钱包', '💰'));
    }

    // ==================== 个人资料详情页 ====================
    openDetailPage() {
        let page = document.getElementById('profileDetailPage');
        if (!page) {
            page = document.createElement('div');
            page.className = 'profile-detail-page';
            page.id = 'profileDetailPage';
            document.body.appendChild(page);
        }
        this._renderDetailPage(page);
        requestAnimationFrame(() => page.classList.add('open'));
    }

    closeDetailPage() {
        const page = document.getElementById('profileDetailPage');
        if (page) page.classList.remove('open');
    }

    _renderDetailPage(page) {
        const s = this.storage.getUserSettings();
        const age = s.birthday ? this._calcAge(s.birthday) : '';

        page.innerHTML = `
            <div class="profile-detail-header">
                <button class="profile-detail-back" id="profileDetailBack">←</button>
                <div class="profile-detail-title">个人资料</div>
            </div>
            <div class="profile-detail-list">
                <!-- 真实信息区（选择性对角色可见） -->
                <div style="padding:8px 16px 0;font-size:11px;color:rgba(255,255,255,0.2);">🔒 真实信息（可选择让哪些角色知道）</div>
                <div class="profile-detail-group">
                    <div class="profile-detail-row" data-field="realName">
                        <div class="profile-detail-label">真实姓名</div>
                        <div class="profile-detail-value">${this._esc(s.realName) || '未填写'}</div>
                        <span class="profile-detail-arrow">›</span>
                    </div>
                    <div class="profile-detail-row" data-field="userPersona">
                        <div class="profile-detail-label">用户人设</div>
                        <div class="profile-detail-value">${s.userPersona ? (s.userPersona.length > 15 ? this._esc(s.userPersona.substring(0,15)) + '...' : this._esc(s.userPersona)) : '点击填写'}</div>
                        <span class="profile-detail-arrow">›</span>
                    </div>
                </div>

                <!-- 网络身份（所有角色都能看到） -->
                <div style="padding:8px 16px 0;font-size:11px;color:rgba(255,255,255,0.2);">🌐 网络身份（所有角色可见）</div>
                <div class="profile-detail-group">
                    <div class="profile-detail-row" data-field="avatar">
                        <div class="profile-detail-label">头像</div>
                        <div class="profile-detail-value">
                            <img class="profile-detail-avatar-val" src="${s.userAvatar || 'assets/icons/chat/default-avatar.png'}">
                        </div>
                        <span class="profile-detail-arrow">›</span>
                    </div>
                    <div class="profile-detail-row" data-field="nickname">
                        <div class="profile-detail-label">网名</div>
                        <div class="profile-detail-value">${this._esc(s.userNickname) || '〇'}</div>
                        <span class="profile-detail-arrow">›</span>
                    </div>
                </div>
                <div class="profile-detail-group">
                    <div class="profile-detail-row" data-field="birthday">
                        <div class="profile-detail-label">生日</div>
                        <div class="profile-detail-value">${s.birthday || '未填写'}</div>
                        <span class="profile-detail-arrow">›</span>
                    </div>
                    <div class="profile-detail-row no-click">
                        <div class="profile-detail-label">年龄</div>
                        <div class="profile-detail-value">${age ? age + '岁' : '根据生日自动计算'}</div>
                    </div>
                    <div class="profile-detail-row" data-field="gender">
                        <div class="profile-detail-label">性别</div>
                        <div class="profile-detail-value">${this._esc(s.gender) || '未填写'}</div>
                        <span class="profile-detail-arrow">›</span>
                    </div>
                    <div class="profile-detail-row" data-field="region">
                        <div class="profile-detail-label">地区</div>
                        <div class="profile-detail-value">${this._esc(s.region) || '未填写'}</div>
                        <span class="profile-detail-arrow">›</span>
                    </div>
                </div>
                <div class="profile-detail-group">
                    <div class="profile-detail-row" data-field="friendCode">
                        <div class="profile-detail-label">好友编码</div>
                        <div class="profile-detail-value" style="font-family:monospace;">${s.userFriendCode}</div>
                        <span class="profile-detail-arrow">›</span>
                    </div>
                    <div class="profile-detail-row" data-field="poke">
                        <div class="profile-detail-label">拍一拍</div>
                        <div class="profile-detail-value">${this._esc(s.poke) || '拍了拍你'}</div>
                        <span class="profile-detail-arrow">›</span>
                    </div>
                    <div class="profile-detail-row" data-field="signature">
                        <div class="profile-detail-label">个性签名</div>
                        <div class="profile-detail-value">${this._esc(s.signature) || '未填写'}</div>
                        <span class="profile-detail-arrow">›</span>
                    </div>
                </div>
                <!-- 自定义CSS区 -->
                <div class="profile-css-section">
                    <div class="profile-css-toggle" id="profileCssToggle">
                        <span class="profile-css-toggle-label">🎨 界面自定义CSS</span>
                        <span class="profile-css-toggle-arrow">▶</span>
                    </div>
                    <div class="profile-css-body" id="profileCssBody">
                        <div class="profile-css-ref-toggle" id="profileCssRefToggle">📋 查看可用类名 ▾</div>
                        <div class="profile-css-ref-content" id="profileCssRefContent">
                            <div class="profile-css-ref">
<b>底部导航栏</b>
.bottom-nav — 导航栏容器
.nav-btn — 导航按钮
.nav-btn.active — 当前选中
.nav-label — 导航文字
.nav-icon-img — 导航图标

<b>消息列表页</b>
#chatListPage — 消息列表页容器
.chat-list-item — 单条消息卡片
.chat-item-avatar — 头像
.chat-item-name — 名字
.chat-item-msg — 最后消息
.chat-item-time — 时间

<b>好友列表页</b>
#friendListPage — 好友列表容器
.friend-item — 好友卡片

<b>发现页</b>
#discoverPage — 发现页容器

<b>个人设置页</b>
#profilePage — "我的"页容器
.profile-header-card — 头部卡片
.profile-avatar — 头像
.profile-nickname — 网名
.profile-menu-group — 菜单组
.profile-menu-item — 菜单项

<b>顶部栏</b>
.top-bar — 顶部导航栏
.app-title — 标题

<b>聊天界面</b>
.chat-interface-header — 聊天题头
.message — 消息项
.message-ai .msg-bubble — AI气泡
.message-user .msg-bubble — 用户气泡
.message-time — 时间戳
.message-avatar img — 气泡头像
                            </div>
                        </div>
                        <textarea id="profileCssTextarea" placeholder="写CSS美化界面..." rows="4" style="width:100%;padding:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#fff;font-size:11px;font-family:monospace;resize:vertical;margin-bottom:8px;box-sizing:border-box;">${this._esc(s.profileCss || '')}</textarea>
                        <div style="display:flex;gap:8px;">
                            <button id="profileCssApplyBtn" style="flex:1;padding:8px;border:none;border-radius:8px;background:rgba(240,147,43,0.12);color:#f0932b;font-size:12px;cursor:pointer;">应用</button>
                            <button id="profileCssClearBtn" style="padding:8px 12px;border:none;border-radius:8px;background:rgba(255,100,100,0.08);color:rgba(255,100,100,0.5);font-size:12px;cursor:pointer;">清除</button>
                        </div>
                    </div>
                </div>
            </div>`;

        // 事件绑定
        page.querySelector('#profileDetailBack')?.addEventListener('click', () => this.closeDetailPage());

        // 每行点击编辑
        page.querySelectorAll('.profile-detail-row[data-field]').forEach(row => {
            row.addEventListener('click', () => this._editField(row.getAttribute('data-field')));
        });

        // CSS toggle
        page.querySelector('#profileCssToggle')?.addEventListener('click', function() { this.classList.toggle('open'); });
        page.querySelector('#profileCssRefToggle')?.addEventListener('click', function() { this.classList.toggle('open'); });
        page.querySelector('#profileCssApplyBtn')?.addEventListener('click', () => {
            const css = page.querySelector('#profileCssTextarea')?.value.trim() || '';
            this.storage.updateUserSettings({ profileCss: css });
            this._applyProfileCss(css);
            this._toast('CSS已应用');
        });
        page.querySelector('#profileCssClearBtn')?.addEventListener('click', () => {
            // 彻底清除：storage + style标签 + textarea
            const s = this.storage.getUserSettings();
            s.profileCss = '';
            this.storage.saveData('zero_phone_user_settings', s);
            this._applyProfileCss('');
            const ta = page.querySelector('#profileCssTextarea');
            if (ta) ta.value = '';
            this._toast('CSS已清除');
        });
        // 离开textarea时自动保存（防止用户删了文字但忘了点按钮）
        page.querySelector('#profileCssTextarea')?.addEventListener('blur', () => {
            const css = page.querySelector('#profileCssTextarea')?.value.trim() || '';
            const current = this.storage.getUserSettings().profileCss || '';
            if (css !== current) {
                this.storage.updateUserSettings({ profileCss: css });
                this._applyProfileCss(css);
            }
        });
    }

    // ==================== 字段编辑 ====================
    _editField(field) {
        const s = this.storage.getUserSettings();
        switch (field) {
            case 'avatar': this._editAvatar(s); break;
            case 'realName': this._editText('真实姓名', 'realName', s.realName || '', 20, '真实姓名仅自己可见，AI不会知道'); break;
            case 'nickname': this._editText('网名', 'userNickname', s.userNickname || '', 20, '最多20字，修改后所有好友可见', (v) => { this.storage.updateUserSettings({ userName: v }); }); break;
            case 'birthday': this._editBirthday(s); break;
            case 'gender': this._editGender(s); break;
            case 'region': this._editText('地区', 'region', s.region || '', 50, '随便填写，如：上海 / 东京 / 二次元'); break;
            case 'friendCode': this._editFriendCode(s); break;
            case 'poke': this._editText('拍一拍', 'poke', s.poke || '', 30, '别人拍你时显示的文字'); break;
            case 'signature': this._editSignature(s); break;
            case 'userPersona': this._editUserPersona(s); break;
        }
    }

    // 通用文本编辑
    _editText(title, key, current, maxLen, hint, extraSave) {
        this._removeOverlay();
        const ov = this._createOverlay(`
            <div class="profile-edit-title">修改${title}</div>
            <input type="text" class="profile-edit-input" id="profileEditInput" value="${this._esc(current)}" maxlength="${maxLen}" placeholder="请输入${title}...">
            <div class="profile-edit-hint">${hint}</div>
            <button class="profile-edit-btn profile-edit-btn-primary" id="profileEditSave">保存</button>
            <button class="profile-edit-btn profile-edit-btn-secondary" id="profileEditCancel">取消</button>
        `);
        ov.querySelector('#profileEditSave').addEventListener('click', () => {
            const val = ov.querySelector('#profileEditInput')?.value.trim() || '';
            this.storage.updateUserSettings({ [key]: val });
            if (extraSave) extraSave(val);
            this._toast(`${title}已更新`);
            this._removeOverlay();
            this._refreshDetail();
            this.render();
        });
        ov.querySelector('#profileEditCancel').addEventListener('click', () => this._removeOverlay());
        setTimeout(() => ov.querySelector('#profileEditInput')?.focus(), 100);
    }

    // 头像编辑
    _editAvatar(s) {
        this._removeOverlay();
        const ov = this._createOverlay(`
            <div class="profile-edit-title">修改头像</div>
            ${s.userAvatar ? `<img class="profile-avatar-preview" id="profileAvatarPreview" src="${s.userAvatar}">` : '<div id="profileAvatarPreview"></div>'}
            <div class="profile-avatar-options">
                <div class="profile-avatar-option" id="pAvatarFileBtn">📷 从相册</div>
                <div class="profile-avatar-option" id="pAvatarUrlBtn">🔗 粘贴链接</div>
                <div class="profile-avatar-option" id="pAvatarLibBtn">🖼 从图库</div>
            </div>
            <input type="file" id="pAvatarFileInput" accept="image/*" style="display:none;">
            <input type="text" class="profile-edit-input" id="pAvatarUrlInput" placeholder="粘贴图片URL..." style="display:none;">
            <div id="pAvatarLibPanel" style="display:none;max-height:200px;overflow-y:auto;margin:8px 0;"></div>
            <button class="profile-edit-btn profile-edit-btn-primary" id="pAvatarSave">保存</button>
            ${s.userAvatar ? '<button class="profile-edit-btn profile-edit-btn-secondary" id="pAvatarRemove">移除头像</button>' : ''}
            <button class="profile-edit-btn profile-edit-btn-secondary" id="pAvatarCancel">取消</button>
        `);
        let pending = '';
        ov.querySelector('#pAvatarFileBtn').addEventListener('click', () => ov.querySelector('#pAvatarFileInput').click());
        ov.querySelector('#pAvatarFileInput').addEventListener('change', (e) => {
            const f = e.target.files[0]; if (!f) return;
            const r = new FileReader();
            r.onload = (ev) => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); const sc = Math.min(1,400/Math.max(img.width,img.height)); c.width=img.width*sc;c.height=img.height*sc; c.getContext('2d').drawImage(img,0,0,c.width,c.height); pending=c.toDataURL('image/jpeg',0.8); this._showPrev(pending); }; img.src=ev.target.result; };
            r.readAsDataURL(f);
        });
        ov.querySelector('#pAvatarUrlBtn').addEventListener('click', () => { const el = ov.querySelector('#pAvatarUrlInput'); el.style.display = el.style.display === 'none' ? 'block' : 'none'; document.getElementById('pAvatarLibPanel').style.display = 'none'; });
        ov.querySelector('#pAvatarUrlInput').addEventListener('change', (e) => { const url = e.target.value.trim(); if (url) { pending = url; this._showPrev(url); } });
        
        // 从图库选择
        ov.querySelector('#pAvatarLibBtn').addEventListener('click', () => {
            const libPanel = document.getElementById('pAvatarLibPanel');
            ov.querySelector('#pAvatarUrlInput').style.display = 'none';
            if (libPanel.style.display !== 'none') { libPanel.style.display = 'none'; return; }
            
            // 读取base64库数据
            const libData = this.storage.getUserSettings()?.base64Library || {};
            const tabs = ['avatars', 'webImages', 'transparent'];
            const tabLabels = { avatars: '头像库', webImages: '网图库', transparent: '透明底图' };
            let allImages = [];
            tabs.forEach(tab => {
                const items = libData[tab]?.items || [];
                items.forEach(item => {
                    if (item.data) allImages.push({ src: item.data, name: item.name || '', tab: tabLabels[tab] || tab });
                });
            });
            
            if (allImages.length === 0) {
                libPanel.innerHTML = '<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.2);font-size:12px;">图库里还没有图片</div>';
            } else {
                libPanel.innerHTML = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:4px;">' +
                    allImages.map((img, i) => `<div class="avatar-lib-item" data-idx="${i}" style="aspect-ratio:1;border-radius:8px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border 0.15s;">
                        <img src="${img.src}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentElement.style.display='none'">
                    </div>`).join('') + '</div>';
                
                libPanel.querySelectorAll('.avatar-lib-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const idx = parseInt(item.dataset.idx);
                        const img = allImages[idx];
                        if (img) {
                            pending = img.src;
                            this._showPrev(pending);
                            // 高亮选中
                            libPanel.querySelectorAll('.avatar-lib-item').forEach(el => el.style.borderColor = 'transparent');
                            item.style.borderColor = 'rgba(240,147,43,0.6)';
                        }
                    });
                });
            }
            libPanel.style.display = 'block';
        });
        
        ov.querySelector('#pAvatarSave').addEventListener('click', () => { if (pending) this.storage.updateUserSettings({ userAvatar: pending }); this._removeOverlay(); this._refreshDetail(); this.render(); this._toast('头像已更新'); });
        ov.querySelector('#pAvatarRemove')?.addEventListener('click', () => { this.storage.updateUserSettings({ userAvatar: '' }); this._removeOverlay(); this._refreshDetail(); this.render(); this._toast('头像已移除'); });
        ov.querySelector('#pAvatarCancel').addEventListener('click', () => this._removeOverlay());
    }

    _showPrev(src) { const el = document.getElementById('profileAvatarPreview'); if (el?.tagName === 'IMG') el.src = src; else if (el) el.outerHTML = `<img class="profile-avatar-preview" id="profileAvatarPreview" src="${src}">`; }

    // 生日编辑（滚轮式选择器）
    _editBirthday(s) {
        this._removeOverlay();
        const current = s.birthday ? new Date(s.birthday) : new Date(2000, 0, 1);
        let selYear = current.getFullYear();
        let selMonth = current.getMonth() + 1;
        let selDay = current.getDate();
        const thisYear = new Date().getFullYear();

        const ov = this._createOverlay(`
            <div class="profile-edit-title">选择生日</div>
            <div style="display:flex;gap:4px;height:200px;overflow:hidden;margin-bottom:16px;position:relative;">
                <!-- 选中行高亮 -->
                <div style="position:absolute;top:50%;left:0;right:0;height:40px;transform:translateY(-50%);background:rgba(255,255,255,0.06);border-radius:8px;pointer-events:none;z-index:1;border-top:1px solid rgba(255,255,255,0.08);border-bottom:1px solid rgba(255,255,255,0.08);"></div>
                <div class="wheel-col" id="wheelYear" style="flex:1.2;overflow-y:auto;scroll-snap-type:y mandatory;-webkit-overflow-scrolling:touch;position:relative;z-index:2;"></div>
                <div class="wheel-col" id="wheelMonth" style="flex:1;overflow-y:auto;scroll-snap-type:y mandatory;-webkit-overflow-scrolling:touch;position:relative;z-index:2;"></div>
                <div class="wheel-col" id="wheelDay" style="flex:1;overflow-y:auto;scroll-snap-type:y mandatory;-webkit-overflow-scrolling:touch;position:relative;z-index:2;"></div>
            </div>
            <button class="profile-edit-btn profile-edit-btn-primary" id="profileEditSave">确定</button>
            <button class="profile-edit-btn profile-edit-btn-secondary" id="profileEditCancel">取消</button>
        `);

        const wheelItemStyle = 'height:40px;display:flex;align-items:center;justify-content:center;scroll-snap-align:center;font-size:16px;color:rgba(255,255,255,0.25);transition:color 0.1s;flex-shrink:0;';
        const padStyle = 'height:80px;flex-shrink:0;'; // 上下各2个空位的padding

        // 填充年
        const yearEl = ov.querySelector('#wheelYear');
        yearEl.innerHTML = `<div style="${padStyle}"></div>` + Array.from({length: thisYear - 1920 + 1}, (_, i) => {
            const y = 1920 + i;
            return `<div style="${wheelItemStyle}" data-val="${y}">${y}年</div>`;
        }).join('') + `<div style="${padStyle}"></div>`;

        // 填充月
        const monthEl = ov.querySelector('#wheelMonth');
        monthEl.innerHTML = `<div style="${padStyle}"></div>` + Array.from({length:12}, (_, i) => `<div style="${wheelItemStyle}" data-val="${i+1}">${String(i+1).padStart(2,'0')}月</div>`).join('') + `<div style="${padStyle}"></div>`;

        // 填充日
        const fillDays = () => {
            const daysInMonth = new Date(selYear, selMonth, 0).getDate();
            const dayEl = ov.querySelector('#wheelDay');
            dayEl.innerHTML = `<div style="${padStyle}"></div>` + Array.from({length: daysInMonth}, (_, i) => `<div style="${wheelItemStyle}" data-val="${i+1}">${String(i+1).padStart(2,'0')}日</div>`).join('') + `<div style="${padStyle}"></div>`;
            if (selDay > daysInMonth) selDay = daysInMonth;
            this._wheelScrollTo(dayEl, selDay);
            this._wheelHighlight(dayEl);
        };

        // 滚动到指定值
        this._wheelScrollTo(yearEl, selYear - 1920);
        this._wheelScrollTo(monthEl, selMonth - 1);
        fillDays();
        // 精确滚动到选中值
        setTimeout(() => {
            this._wheelScrollTo(yearEl, selYear - 1920);
            this._wheelScrollTo(monthEl, selMonth - 1);
            this._wheelScrollTo(ov.querySelector('#wheelDay'), selDay - 1);
            this._wheelHighlight(yearEl);
            this._wheelHighlight(monthEl);
            this._wheelHighlight(ov.querySelector('#wheelDay'));
        }, 50);

        // 监听滚动
        const onScroll = (el, cb) => {
            let timer;
            el.addEventListener('scroll', () => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    const idx = Math.round(el.scrollTop / 40);
                    cb(idx);
                    this._wheelHighlight(el);
                }, 80);
            }, { passive: true });
        };
        onScroll(yearEl, idx => { selYear = 1920 + idx; fillDays(); });
        onScroll(monthEl, idx => { selMonth = idx + 1; fillDays(); });
        onScroll(ov.querySelector('#wheelDay'), idx => { selDay = idx + 1; });

        ov.querySelector('#profileEditSave').addEventListener('click', () => {
            const dateStr = `${selYear}-${String(selMonth).padStart(2,'0')}-${String(selDay).padStart(2,'0')}`;
            this.storage.updateUserSettings({ birthday: dateStr });
            this._removeOverlay(); this._refreshDetail(); this._toast('生日已更新');
        });
        ov.querySelector('#profileEditCancel').addEventListener('click', () => this._removeOverlay());
    }

    _wheelScrollTo(el, idx) {
        el.scrollTop = idx * 40;
    }

    _wheelHighlight(el) {
        const centerY = el.scrollTop + el.clientHeight / 2;
        el.querySelectorAll('[data-val]').forEach(item => {
            const itemCenter = item.offsetTop + 20;
            const dist = Math.abs(centerY - itemCenter);
            if (dist < 20) {
                item.style.color = '#fff'; item.style.fontSize = '18px'; item.style.fontWeight = '600';
            } else if (dist < 60) {
                item.style.color = 'rgba(255,255,255,0.4)'; item.style.fontSize = '15px'; item.style.fontWeight = '400';
            } else {
                item.style.color = 'rgba(255,255,255,0.15)'; item.style.fontSize = '14px'; item.style.fontWeight = '400';
            }
        });
    }

    // 性别选择
    _editGender(s) {
        this._removeOverlay();
        const ov = this._createOverlay(`
            <div class="profile-edit-title">选择性别</div>
            <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">
                ${['男', '女', '其他', '保密'].map(g => `<button class="profile-edit-btn ${s.gender === g ? 'profile-edit-btn-primary' : 'profile-edit-btn-secondary'}" data-gender="${g}">${g}</button>`).join('')}
            </div>
            <button class="profile-edit-btn profile-edit-btn-secondary" id="profileEditCancel">取消</button>
        `);
        ov.querySelectorAll('[data-gender]').forEach(btn => {
            btn.addEventListener('click', () => { this.storage.updateUserSettings({ gender: btn.getAttribute('data-gender') }); this._removeOverlay(); this._refreshDetail(); this._toast('性别已更新'); });
        });
        ov.querySelector('#profileEditCancel').addEventListener('click', () => this._removeOverlay());
    }

    // 个性签名（多行）
    _editSignature(s) {
        this._removeOverlay();
        const ov = this._createOverlay(`
            <div class="profile-edit-title">修改个性签名</div>
            <textarea class="profile-edit-textarea" id="profileEditInput" rows="3" maxlength="100" placeholder="写下你的个性签名...">${this._esc(s.signature || '')}</textarea>
            <div class="profile-edit-hint">最多100字</div>
            <button class="profile-edit-btn profile-edit-btn-primary" id="profileEditSave">保存</button>
            <button class="profile-edit-btn profile-edit-btn-secondary" id="profileEditCancel">取消</button>
        `);
        ov.querySelector('#profileEditSave').addEventListener('click', () => { this.storage.updateUserSettings({ signature: ov.querySelector('#profileEditInput')?.value.trim() || '' }); this._removeOverlay(); this._refreshDetail(); this._toast('签名已更新'); });
        ov.querySelector('#profileEditCancel').addEventListener('click', () => this._removeOverlay());
    }

    // 用户人设编辑
    _editUserPersona(s) {
        this._removeOverlay();
        const ov = this._createOverlay(`
            <div class="profile-edit-title">用户人设</div>
            <div class="profile-css-ref-toggle" id="personaTipsToggle" style="margin-bottom:8px;cursor:pointer;color:rgba(255,255,255,0.3);font-size:12px;user-select:none;">💡 人设提示（点击展开） ▾</div>
            <div id="personaTipsContent" style="display:none;padding:10px 12px;background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:12px;font-size:11px;color:rgba(255,255,255,0.3);line-height:1.8;">
                <b>建议包含的信息：</b><br>
                · 姓名 / 昵称 / 称呼偏好<br>
                · 年龄 / 生日<br>
                · 性格特点（内向/外向/慢热等）<br>
                · 外貌描述（身高/发色/穿衣风格等）<br>
                · 生理特征（体质/过敏/习惯等）<br>
                · 职业 / 学校 / 日常作息<br>
                · 兴趣爱好 / 讨厌的事物<br>
                · 口癖 / 说话习惯 / 语言风格<br>
                · 和角色的关系背景故事<br>
                · 其他你希望角色了解的信息<br>
                <br>
                <span style="color:rgba(240,147,43,0.6);">⚠️ 这里写的内容是真实的你，只有你授权的角色才能看到。在每个角色的聊天设置里可以开关「让TA知道用户人设」。</span>
            </div>
            <textarea class="profile-edit-textarea" id="profileEditInput" rows="8" placeholder="写下关于你自己的信息，让角色更了解真实的你...">${this._esc(s.userPersona || '')}</textarea>
            <div class="profile-edit-hint">角色需要在聊天设置里开启权限才能看到这些内容</div>
            <button class="profile-edit-btn profile-edit-btn-primary" id="profileEditSave">保存</button>
            <button class="profile-edit-btn profile-edit-btn-secondary" id="profileEditCancel">取消</button>
        `);
        ov.querySelector('#personaTipsToggle').addEventListener('click', function() {
            this.classList.toggle('open');
            const content = document.getElementById('personaTipsContent');
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        });
        ov.querySelector('#profileEditSave').addEventListener('click', () => {
            this.storage.updateUserSettings({ userPersona: ov.querySelector('#profileEditInput')?.value.trim() || '' });
            this._removeOverlay(); this._refreshDetail(); this._toast('用户人设已保存');
        });
        ov.querySelector('#profileEditCancel').addEventListener('click', () => this._removeOverlay());
    }

    // 好友编码
    _editFriendCode(s) {
        this._removeOverlay();
        const yr = new Date().getFullYear();
        if (s.friendCodeLastYear !== yr) { s.friendCodeLastYear = yr; s.friendCodeChangesThisYear = 0; this.storage.updateUserSettings(s); }
        const remain = 3 - (s.friendCodeChangesThisYear || 0);

        const ov = this._createOverlay(`
            <div class="profile-edit-title">修改好友编码</div>
            <div style="text-align:center;margin-bottom:12px;">
                <div style="font-size:16px;font-weight:700;color:#fff;font-family:monospace;letter-spacing:1px;">${s.userFriendCode}</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.25);margin-top:4px;">今年剩余 ${remain} 次修改机会</div>
            </div>
            ${remain > 0 ? `
                <input type="text" class="profile-edit-input" id="profileEditInput" placeholder="输入新的好友编码..." maxlength="20">
                <div class="profile-edit-hint">字母+数字+下划线，3-20位。修改后所有好友可见新编码。</div>
                <button class="profile-edit-btn profile-edit-btn-primary" id="profileEditSave">修改（剩${remain}次）</button>
            ` : '<div class="profile-edit-hint" style="text-align:center;color:rgba(255,100,100,0.6);">今年修改次数已用完</div>'}
            <button class="profile-edit-btn profile-edit-btn-secondary" id="profileEditCancel">关闭</button>
        `);
        ov.querySelector('#profileEditSave')?.addEventListener('click', () => {
            const val = ov.querySelector('#profileEditInput')?.value.trim();
            if (!val || val.length < 3) { this._toast('编码至少3位'); return; }
            if (!/^[a-zA-Z0-9_]+$/.test(val)) { this._toast('只能用字母、数字、下划线'); return; }
            const st = this.storage.getUserSettings();
            if (!st.friendCodeHistory) st.friendCodeHistory = [];
            st.friendCodeHistory.push({ old: st.userFriendCode, new: val, date: new Date().toISOString() });
            st.userFriendCode = val;
            st.friendCodeChangesThisYear = (st.friendCodeChangesThisYear || 0) + 1;
            this.storage.updateUserSettings(st);
            this._removeOverlay(); this._refreshDetail(); this.render(); this._toast('编码已更新');
        });
        ov.querySelector('#profileEditCancel').addEventListener('click', () => this._removeOverlay());
    }

    // 自定义CSS
    _applyProfileCss(css) {
        let el = document.getElementById('userProfileCssTag');
        if (el) el.remove();
        if (css) { el = document.createElement('style'); el.id = 'userProfileCssTag'; el.textContent = css; document.head.appendChild(el); }
    }

    // ==================== 工具方法 ====================
    _createOverlay(html) {
        const ov = document.createElement('div');
        ov.className = 'profile-edit-overlay'; ov.id = 'profileEditOverlay';
        ov.innerHTML = `<div class="profile-edit-body">${html}</div>`;
        document.body.appendChild(ov);
        return ov;
    }
    _removeOverlay() { document.getElementById('profileEditOverlay')?.remove(); }
    _refreshDetail() { const p = document.getElementById('profileDetailPage'); if (p) this._renderDetailPage(p); }
    _toast(msg) { window.chatInterface?.showCssToast ? window.chatInterface.showCssToast(msg) : alert(msg); }
    _copyText(t) { if (navigator.clipboard?.writeText) navigator.clipboard.writeText(t).then(() => this._toast('已复制')); else { const a = document.createElement('textarea'); a.value=t;a.style.cssText='position:fixed;opacity:0'; document.body.appendChild(a);a.select();document.execCommand('copy');a.remove(); this._toast('已复制'); } }
    _esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    _calcAge(birthday) { const b = new Date(birthday); const n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--; return a > 0 ? a : ''; }
    _placeholder(name, icon) { this._removeOverlay(); const ov = this._createOverlay(`<div style="text-align:center;"><div style="font-size:40px;margin-bottom:12px;">${icon}</div><div style="font-size:16px;font-weight:600;color:#fff;margin-bottom:8px;">${name}</div><div style="font-size:13px;color:rgba(255,255,255,0.3);margin-bottom:20px;">功能开发中...</div><button class="profile-edit-btn profile-edit-btn-secondary" onclick="document.getElementById('profileEditOverlay')?.remove()">关闭</button></div>`); }
    getUserProfile() { const s = this.storage.getUserSettings(); return { nickname: s.userNickname || s.userName || '〇', avatar: s.userAvatar || '', friendCode: s.userFriendCode || '', realName: s.realName || '', signature: s.signature || '' }; }
}

// 全局初始化
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const app = (typeof chatApp !== 'undefined') ? chatApp : window.chatApp;
        if (app?.storage) {
            window.profileManager = new ProfileManager(app.storage);
            // 启动时应用自定义CSS（仅当确实有内容时）
            const s = app.storage.getUserSettings() || {};
            if (s.profileCss && s.profileCss.trim().length > 0) {
                window.profileManager._applyProfileCss(s.profileCss);
            }
            const observer = new MutationObserver(() => {
                const page = document.getElementById('profilePage');
                if (page && page.classList.contains('active')) window.profileManager.init();
            });
            const page = document.getElementById('profilePage');
            if (page) observer.observe(page, { attributes: true, attributeFilter: ['class'] });
            console.log('✅ ProfileManager 已就绪');
        }
    }, 500);
});
