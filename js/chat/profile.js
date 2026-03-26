/**
 * 个人设置页模块（"我的"）
 * 独立于 chat-interface.js，通过 window.profileManager 暴露接口
 */
class ProfileManager {
    constructor(storage) {
        this.storage = storage;
        this._bound = false;
    }

    // ==================== 初始化 ====================
    init() {
        this._ensureUserData();
        if (!this._bound) {
            this.bindEvents();
            this._bound = true;
        }
        this.render();
    }

    // 确保用户数据完整
    _ensureUserData() {
        const s = this.storage.getUserSettings();
        let changed = false;
        if (!s.userNickname) { s.userNickname = s.userName || '〇'; changed = true; }
        if (!s.userFriendCode) { s.userFriendCode = this._generateFriendCode(); changed = true; }
        if (s.friendCodeChangesThisYear === undefined) { s.friendCodeChangesThisYear = 0; changed = true; }
        if (!s.friendCodeLastYear) { s.friendCodeLastYear = new Date().getFullYear(); changed = true; }
        if (!s.friendCodeHistory) { s.friendCodeHistory = []; changed = true; }
        if (changed) this.storage.updateUserSettings(s);
    }

    // 生成好友编码 ZP_XXXXXX
    _generateFriendCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let code = 'ZP_';
        for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    }

    // ==================== 渲染 ====================
    render() {
        const s = this.storage.getUserSettings();

        // 头像
        const avatarEl = document.getElementById('profileAvatar');
        if (avatarEl) {
            avatarEl.src = s.userAvatar || 'assets/icons/chat/default-avatar.png';
            avatarEl.onerror = () => { avatarEl.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23333"/><text x="32" y="38" text-anchor="middle" fill="%23666" font-size="24">👤</text></svg>'; };
        }

        // 昵称
        const nickEl = document.getElementById('profileNicknameText');
        if (nickEl) nickEl.textContent = s.userNickname || '〇';

        // 好友编码
        const codeEl = document.getElementById('profileFriendCodeText');
        if (codeEl) codeEl.textContent = `好友编码：${s.userFriendCode || '未生成'}`;
    }

    // ==================== 事件绑定 ====================
    bindEvents() {
        // 头部卡片点击 → 编辑头像
        document.getElementById('profileHeaderCard')?.addEventListener('click', () => this.showAvatarEdit());

        // 昵称编辑
        document.getElementById('profileNicknameArea')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showNicknameEdit();
        });

        // 好友编码编辑
        document.getElementById('profileFriendCodeArea')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showFriendCodeEdit();
        });

        // 复制好友编码
        document.getElementById('profileCodeCopyBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const s = this.storage.getUserSettings();
            this._copyText(s.userFriendCode || '');
        });

        // 菜单项
        document.getElementById('profileMenuCollection')?.addEventListener('click', () => this._showPlaceholder('收藏', '⭐'));
        document.getElementById('profileMenuMoments')?.addEventListener('click', () => this._showPlaceholder('朋友圈', '📷'));
        document.getElementById('profileMenuWallet')?.addEventListener('click', () => this._showPlaceholder('钱包', '💰'));
    }

    // ==================== 头像编辑 ====================
    showAvatarEdit() {
        this._removeOverlay();
        const s = this.storage.getUserSettings();
        const currentSrc = s.userAvatar || '';

        const overlay = document.createElement('div');
        overlay.className = 'profile-edit-overlay';
        overlay.id = 'profileEditOverlay';
        overlay.innerHTML = `<div class="profile-edit-body">
            <div class="profile-edit-title">修改头像</div>
            ${currentSrc ? `<img class="profile-avatar-preview" id="profileAvatarPreview" src="${currentSrc}">` : '<div id="profileAvatarPreview"></div>'}
            <div class="profile-avatar-options">
                <div class="profile-avatar-option" id="profileAvatarFileBtn">📷 从相册选择</div>
                <div class="profile-avatar-option" id="profileAvatarUrlBtn">🔗 粘贴链接</div>
            </div>
            <input type="file" id="profileAvatarFileInput" accept="image/*" style="display:none;">
            <input type="text" class="profile-edit-input" id="profileAvatarUrlInput" placeholder="粘贴头像图片URL..." style="display:none;">
            <button class="profile-edit-btn profile-edit-btn-primary" id="profileAvatarSaveBtn">保存</button>
            ${currentSrc ? '<button class="profile-edit-btn profile-edit-btn-secondary" id="profileAvatarRemoveBtn">移除头像</button>' : ''}
            <button class="profile-edit-btn profile-edit-btn-secondary" id="profileAvatarCancelBtn">取消</button>
        </div>`;
        document.body.appendChild(overlay);

        let pendingAvatar = '';

        // 从相册
        document.getElementById('profileAvatarFileBtn').addEventListener('click', () => {
            document.getElementById('profileAvatarFileInput').click();
        });
        document.getElementById('profileAvatarFileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const c = document.createElement('canvas');
                    const s = Math.min(1, 400 / Math.max(img.width, img.height));
                    c.width = img.width * s; c.height = img.height * s;
                    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                    pendingAvatar = c.toDataURL('image/jpeg', 0.8);
                    this._showPreview(pendingAvatar);
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });

        // URL方式
        document.getElementById('profileAvatarUrlBtn').addEventListener('click', () => {
            const urlInput = document.getElementById('profileAvatarUrlInput');
            urlInput.style.display = urlInput.style.display === 'none' ? 'block' : 'none';
        });
        document.getElementById('profileAvatarUrlInput').addEventListener('change', (e) => {
            const url = e.target.value.trim();
            if (url) { pendingAvatar = url; this._showPreview(url); }
        });

        // 保存
        document.getElementById('profileAvatarSaveBtn').addEventListener('click', () => {
            if (pendingAvatar) {
                this.storage.updateUserSettings({ userAvatar: pendingAvatar });
                this._toast('头像已更新');
            }
            this._removeOverlay();
            this.render();
        });

        // 移除
        document.getElementById('profileAvatarRemoveBtn')?.addEventListener('click', () => {
            this.storage.updateUserSettings({ userAvatar: '' });
            this._toast('头像已移除');
            this._removeOverlay();
            this.render();
        });

        // 取消
        document.getElementById('profileAvatarCancelBtn').addEventListener('click', () => this._removeOverlay());
    }

    _showPreview(src) {
        let el = document.getElementById('profileAvatarPreview');
        if (el && el.tagName === 'IMG') {
            el.src = src;
        } else if (el) {
            el.outerHTML = `<img class="profile-avatar-preview" id="profileAvatarPreview" src="${src}">`;
        }
    }

    // ==================== 昵称编辑 ====================
    showNicknameEdit() {
        this._removeOverlay();
        const s = this.storage.getUserSettings();

        const overlay = document.createElement('div');
        overlay.className = 'profile-edit-overlay';
        overlay.id = 'profileEditOverlay';
        overlay.innerHTML = `<div class="profile-edit-body">
            <div class="profile-edit-title">修改网名</div>
            <input type="text" class="profile-edit-input" id="profileNicknameInput" value="${this._escHtml(s.userNickname || '')}" maxlength="20" placeholder="输入新网名...">
            <div class="profile-edit-hint">最多20个字符</div>
            <button class="profile-edit-btn profile-edit-btn-primary" id="profileNicknameSaveBtn">保存</button>
            <button class="profile-edit-btn profile-edit-btn-secondary" id="profileNicknameCancelBtn">取消</button>
        </div>`;
        document.body.appendChild(overlay);

        document.getElementById('profileNicknameSaveBtn').addEventListener('click', () => {
            const val = document.getElementById('profileNicknameInput')?.value.trim();
            if (!val) { this._toast('网名不能为空'); return; }
            this.storage.updateUserSettings({ userNickname: val, userName: val });
            this._toast('网名已更新');
            this._removeOverlay();
            this.render();
        });
        document.getElementById('profileNicknameCancelBtn').addEventListener('click', () => this._removeOverlay());

        // 自动聚焦
        setTimeout(() => document.getElementById('profileNicknameInput')?.focus(), 100);
    }

    // ==================== 好友编码编辑 ====================
    showFriendCodeEdit() {
        this._removeOverlay();
        const s = this.storage.getUserSettings();

        // 年度重置
        const currentYear = new Date().getFullYear();
        if (s.friendCodeLastYear !== currentYear) {
            s.friendCodeLastYear = currentYear;
            s.friendCodeChangesThisYear = 0;
            this.storage.updateUserSettings(s);
        }

        const remaining = 3 - (s.friendCodeChangesThisYear || 0);

        const overlay = document.createElement('div');
        overlay.className = 'profile-edit-overlay';
        overlay.id = 'profileEditOverlay';
        overlay.innerHTML = `<div class="profile-edit-body">
            <div class="profile-edit-title">修改好友编码</div>
            <div style="text-align:center;margin-bottom:12px;">
                <div style="font-size:16px;font-weight:700;color:#fff;font-family:monospace;letter-spacing:1px;">${s.userFriendCode}</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.25);margin-top:4px;">今年剩余 ${remaining} 次修改机会</div>
            </div>
            ${remaining > 0 ? `
                <input type="text" class="profile-edit-input" id="profileCodeInput" placeholder="输入新的好友编码..." maxlength="20">
                <div class="profile-edit-hint">字母+数字，3-20位。好友编码类似微信号，别人通过它来添加你。修改后所有好友都会看到新编码。</div>
                <button class="profile-edit-btn profile-edit-btn-primary" id="profileCodeSaveBtn">修改编码（剩余${remaining}次）</button>
            ` : `<div class="profile-edit-hint" style="text-align:center;color:rgba(255,100,100,0.6);">今年的修改次数已用完，明年再来吧</div>`}
            <button class="profile-edit-btn profile-edit-btn-secondary" id="profileCodeCancelBtn">关闭</button>
        </div>`;
        document.body.appendChild(overlay);

        document.getElementById('profileCodeSaveBtn')?.addEventListener('click', () => {
            const val = document.getElementById('profileCodeInput')?.value.trim();
            if (!val) { this._toast('请输入新编码'); return; }
            if (val.length < 3) { this._toast('编码至少3位'); return; }
            if (!/^[a-zA-Z0-9_]+$/.test(val)) { this._toast('只能用字母、数字和下划线'); return; }

            const settings = this.storage.getUserSettings();
            const oldCode = settings.userFriendCode;

            // 记录修改历史
            if (!settings.friendCodeHistory) settings.friendCodeHistory = [];
            settings.friendCodeHistory.push({
                oldCode, newCode: val, date: new Date().toISOString()
            });
            settings.userFriendCode = val;
            settings.friendCodeChangesThisYear = (settings.friendCodeChangesThisYear || 0) + 1;
            this.storage.updateUserSettings(settings);

            this._toast('好友编码已更新');
            this._removeOverlay();
            this.render();
        });
        document.getElementById('profileCodeCancelBtn').addEventListener('click', () => this._removeOverlay());
    }

    // ==================== 占位弹窗 ====================
    _showPlaceholder(name, icon) {
        this._removeOverlay();
        const overlay = document.createElement('div');
        overlay.className = 'profile-edit-overlay';
        overlay.id = 'profileEditOverlay';
        overlay.innerHTML = `<div class="profile-edit-body" style="text-align:center;">
            <div style="font-size:40px;margin-bottom:12px;">${icon}</div>
            <div style="font-size:16px;font-weight:600;color:#fff;margin-bottom:8px;">${name}</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.3);margin-bottom:20px;">功能开发中，敬请期待...</div>
            <button class="profile-edit-btn profile-edit-btn-secondary" onclick="document.getElementById('profileEditOverlay')?.remove()">关闭</button>
        </div>`;
        document.body.appendChild(overlay);
    }

    // ==================== 工具方法 ====================
    _removeOverlay() {
        document.getElementById('profileEditOverlay')?.remove();
    }

    _toast(msg) {
        // 借用 chatInterface 的 toast，如果可用
        if (window.chatInterface?.showCssToast) {
            window.chatInterface.showCssToast(msg);
        } else {
            alert(msg);
        }
    }

    _copyText(text) {
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(() => this._toast('已复制'));
        } else {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            document.execCommand('copy'); ta.remove();
            this._toast('已复制');
        }
    }

    _escHtml(s) {
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // 获取用户信息（供其他模块调用）
    getUserProfile() {
        const s = this.storage.getUserSettings();
        return {
            nickname: s.userNickname || s.userName || '〇',
            avatar: s.userAvatar || '',
            friendCode: s.userFriendCode || ''
        };
    }
}

// 全局初始化
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // chatApp 是 chat-app.js 里的顶级 const，直接可用
        const app = (typeof chatApp !== 'undefined') ? chatApp : window.chatApp;
        if (app?.storage) {
            window.profileManager = new ProfileManager(app.storage);
            // 当切换到 profilePage 时自动刷新
            const observer = new MutationObserver(() => {
                const page = document.getElementById('profilePage');
                if (page && page.classList.contains('active')) {
                    window.profileManager.init();
                }
            });
            const page = document.getElementById('profilePage');
            if (page) observer.observe(page, { attributes: true, attributeFilter: ['class'] });
            console.log('✅ ProfileManager 已就绪');
        } else {
            console.warn('⚠️ ProfileManager: 找不到 storage');
        }
    }, 500);
});
