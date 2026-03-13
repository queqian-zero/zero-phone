/* ========================================
   RelationshipManager - 关系绑定模块
   零手机 × 亲密关系
   ======================================== */

class RelationshipManager {

    // ==================== 内置关系 ====================

    static BUILTIN_RELATIONS = [
        { id: 'couple',   name: '情侣',  file: 'rel-couple.png',   desc: '你是我最特别的那个人' },
        { id: 'besties',  name: '闺蜜',  file: 'rel-besties.png',  desc: '什么话都能对你说' },
        { id: 'bros',     name: '基友',  file: 'rel-bros.png',     desc: '永远的老哥们' },
        { id: 'partners', name: '死党',  file: 'rel-partners.png', desc: '风里来雨里去' },
    ];

    static IMG_BASE = 'assets/images/relationship/';

    // ==================== 构造 ====================

    constructor(chatInterface) {
        this.ci = chatInterface;
        this.storage = chatInterface.storage;
        this.friendCode = null;
        this.panelEl = null;
        this._evBound = false;
    }

    // ==================== 存储 ====================

    _key(friendCode) {
        return `zero_phone_relationship_${friendCode}`;
    }

    _load(friendCode) {
        try {
            const raw = localStorage.getItem(this._key(friendCode));
            if (raw) return JSON.parse(raw);
        } catch(e) {}
        return this._defaultData();
    }

    _save(friendCode, data) {
        try {
            localStorage.setItem(this._key(friendCode), JSON.stringify(data));
        } catch(e) { console.warn('关系绑定存储失败:', e); }
    }

    _defaultData() {
        return {
            currentRelation: null,   // { id, name, img, isCustom, boundAt }
            pendingInvite: null,     // { id, name, img, isCustom, sentAt }
            history: [],             // [{ id, name, boundAt, unboundAt? }]
            customRelations: [],     // 上传的自定义关系 [{ id, name, imgData }]
        };
    }

    // ==================== 面板开/关 ====================

    open(friendCode) {
        this.friendCode = friendCode;
        this.panelEl = document.getElementById('relPanel');
        if (!this.panelEl) return;
        this._render();
        this.panelEl.style.display = 'flex';
        if (!this._evBound) { this._bindEvents(); this._evBound = true; }
    }

    close() {
        if (this.panelEl) this.panelEl.style.display = 'none';
    }

    // ==================== 渲染 ====================

    _render() {
        const data = this._load(this.friendCode);
        const body = document.getElementById('relPanelBody');
        if (!body) return;

        const friendName = this.ci.currentFriend?.nickname || this.ci.currentFriend?.name || 'TA';

        if (data.pendingInvite) {
            body.innerHTML = this._renderPending(data, friendName);
        } else if (data.currentRelation) {
            body.innerHTML = this._renderBound(data, friendName);
        } else {
            body.innerHTML = this._renderPicker(data, friendName);
        }

        this._bindBodyEvents(data, friendName);
    }

    // 未绑定 - 选择关系
    _renderPicker(data, friendName) {
        const allRelations = [
            ...RelationshipManager.BUILTIN_RELATIONS.map(r => ({
                ...r,
                img: RelationshipManager.IMG_BASE + r.file,
                isCustom: false,
            })),
            ...data.customRelations.map(r => ({ ...r, isCustom: true })),
        ];

        const cards = allRelations.map(r => `
            <div class="rel-card" data-rel-id="${r.id}" data-rel-custom="${r.isCustom}">
                <div class="rel-card-img-wrap">
                    <img src="${r.img || r.imgData}" alt="${r.name}" onerror="this.style.display='none'">
                    <div class="rel-card-overlay"></div>
                </div>
                <div class="rel-card-name">${r.name}</div>
            </div>
        `).join('');

        return `
            <div class="rel-picker">
                <div class="rel-picker-hint">选择你们的关系，向${friendName}发出邀请</div>
                <div class="rel-cards-grid">${cards}</div>
                <div class="rel-upload-row">
                    <button class="rel-upload-btn" id="relUploadBtn">
                        <span class="rel-upload-icon">＋</span>
                        上传自定义关系
                    </button>
                </div>
                <!-- 上传表单（默认隐藏） -->
                <div class="rel-upload-form" id="relUploadForm" style="display:none;">
                    <input type="text" class="rel-input" id="relCustomName" placeholder="关系名称（如：挚友）" maxlength="10">
                    <div class="rel-file-row">
                        <input type="file" id="relCustomImg" accept="image/*" style="display:none;">
                        <button class="rel-file-btn" id="relCustomImgBtn">选择图片</button>
                        <span class="rel-file-name" id="relCustomImgName">未选择</span>
                    </div>
                    <button class="rel-confirm-upload-btn" id="relConfirmUpload">添加</button>
                </div>
            </div>
        `;
    }

    // 邀请等待中
    _renderPending(data, friendName) {
        const inv = data.pendingInvite;
        const imgSrc = inv.imgData || (RelationshipManager.IMG_BASE + (RelationshipManager.BUILTIN_RELATIONS.find(r=>r.id===inv.id)?.file || ''));
        return `
            <div class="rel-pending">
                <div class="rel-pending-img-wrap">
                    <img src="${imgSrc}" alt="${inv.name}" onerror="this.style.display='none'">
                </div>
                <div class="rel-pending-name">「${inv.name}」</div>
                <div class="rel-pending-hint">邀请已发出，等待${friendName}回应…</div>
                <div class="rel-pending-hint rel-pending-sub">在聊天里继续聊，TA会给你答复的</div>
                <button class="rel-cancel-invite-btn" id="relCancelInvite">撤回邀请</button>
            </div>
        `;
    }

    // 已绑定
    _renderBound(data, friendName) {
        const rel = data.currentRelation;
        const imgSrc = rel.imgData || (RelationshipManager.IMG_BASE + (RelationshipManager.BUILTIN_RELATIONS.find(r=>r.id===rel.id)?.file || ''));
        const boundDate = rel.boundAt
            ? (window.ZeroTime ? window.ZeroTime.dateStr(new Date(rel.boundAt)) : rel.boundAt.slice(0,10))
            : '';

        // 自定义关系可以删除，内置不行
        const customList = data.customRelations.map(r => `
            <div class="rel-custom-item">
                <img src="${r.imgData}" alt="${r.name}">
                <span>${r.name}</span>
                <button class="rel-del-custom-btn" data-custom-id="${r.id}">×</button>
            </div>
        `).join('');

        return `
            <div class="rel-bound">
                <div class="rel-bound-img-wrap">
                    <img src="${imgSrc}" alt="${rel.name}" onerror="this.style.display='none'">
                    <div class="rel-bound-sparkle"></div>
                </div>
                <div class="rel-bound-name">「${rel.name}」</div>
                <div class="rel-bound-since">与${friendName}成为${rel.name}于 ${boundDate}</div>
                <button class="rel-change-btn" id="relChangeBtn">更换关系</button>
                <button class="rel-unbind-btn" id="relUnbindBtn">解除关系</button>
                ${data.customRelations.length ? `<div class="rel-custom-list">${customList}</div>` : ''}
            </div>
        `;
    }

    // ==================== Body 内事件 ====================

    _bindBodyEvents(data, friendName) {
        // 选择关系卡片
        document.querySelectorAll('.rel-card').forEach(card => {
            card.addEventListener('click', () => {
                const relId = card.dataset.relId;
                const isCustom = card.dataset.relCustom === 'true';
                this._sendInvite(relId, isCustom, data);
            });
        });

        // 上传表单开关
        const uploadBtn = document.getElementById('relUploadBtn');
        const uploadForm = document.getElementById('relUploadForm');
        if (uploadBtn && uploadForm) {
            uploadBtn.addEventListener('click', () => {
                uploadForm.style.display = uploadForm.style.display === 'none' ? 'flex' : 'none';
            });
        }

        // 选图片
        const imgBtn = document.getElementById('relCustomImgBtn');
        const imgInput = document.getElementById('relCustomImg');
        const imgName = document.getElementById('relCustomImgName');
        if (imgBtn && imgInput) {
            imgBtn.addEventListener('click', () => imgInput.click());
            imgInput.addEventListener('change', () => {
                if (imgInput.files[0]) {
                    imgName.textContent = imgInput.files[0].name;
                    this._tempImgFile = imgInput.files[0];
                }
            });
        }

        // 确认上传自定义关系
        const confirmUpload = document.getElementById('relConfirmUpload');
        if (confirmUpload) {
            confirmUpload.addEventListener('click', () => this._addCustomRelation(data));
        }

        // 撤回邀请
        const cancelInvite = document.getElementById('relCancelInvite');
        if (cancelInvite) {
            cancelInvite.addEventListener('click', () => {
                data.pendingInvite = null;
                this._save(this.friendCode, data);
                this._render();
            });
        }

        // 更换关系
        const changeBtn = document.getElementById('relChangeBtn');
        if (changeBtn) {
            changeBtn.addEventListener('click', () => {
                data.currentRelation = null;
                this._save(this.friendCode, data);
                this._render();
            });
        }

        // 解除关系
        const unbindBtn = document.getElementById('relUnbindBtn');
        if (unbindBtn) {
            unbindBtn.addEventListener('click', () => this._sendUnbindRequest(data, friendName));
        }

        // 删除自定义关系
        document.querySelectorAll('.rel-del-custom-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cid = btn.dataset.customId;
                data.customRelations = data.customRelations.filter(r => r.id !== cid);
                this._save(this.friendCode, data);
                this._render();
            });
        });
    }

    // ==================== 发邀请 ====================

    _sendInvite(relId, isCustom, data) {
        let rel;
        if (isCustom) {
            rel = data.customRelations.find(r => r.id === relId);
        } else {
            const builtin = RelationshipManager.BUILTIN_RELATIONS.find(r => r.id === relId);
            if (builtin) rel = { ...builtin, img: RelationshipManager.IMG_BASE + builtin.file };
        }
        if (!rel) return;

        const friendName = this.ci.currentFriend?.nickname || this.ci.currentFriend?.name || 'TA';
        const imgSrc = rel.imgData || rel.img || '';

        // 保存 pending 状态
        data.pendingInvite = {
            id: rel.id,
            name: rel.name,
            imgData: rel.imgData || null,
            sentAt: new Date().toISOString(),
        };
        this._save(this.friendCode, data);
        this.close();

        // 发邀请卡片到聊天
        const cardHtml = this._buildInviteCard(rel, imgSrc, friendName);
        this.ci.addMessage({
            type: 'user',
            text: cardHtml,
            isHtml: true,
            timestamp: new Date().toISOString(),
        });
        this.ci.storage.addMessage(this.ci.currentFriendCode, {
            type: 'user',
            text: cardHtml,
            isHtml: true,
            timestamp: new Date().toISOString(),
        });
        this.ci.scrollToBottom();

        // 触发AI回复
        setTimeout(() => this.ci.sendAIMessage(), 300);
    }

    _buildInviteCard(rel, imgSrc, friendName) {
        const desc = rel.desc || '';
        return `[RENDER]
<div style="
    display:flex;flex-direction:column;align-items:center;
    background:linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03));
    border:1px solid rgba(255,255,255,0.15);
    border-radius:20px;padding:24px 20px 20px;
    max-width:240px;text-align:center;
    box-shadow:0 4px 24px rgba(0,0,0,0.3);
    backdrop-filter:blur(12px);
    font-family:inherit;
">
    ${imgSrc ? `<img src="${imgSrc}" style="width:72px;height:72px;object-fit:contain;margin-bottom:12px;border-radius:50%;background:rgba(255,255,255,0.06);padding:8px;" onerror="this.style.display='none'">` : `<div style="font-size:40px;margin-bottom:12px;">💍</div>`}
    <div style="font-size:13px;color:rgba(255,255,255,0.45);margin-bottom:6px;letter-spacing:1px;">关系绑定邀请</div>
    <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:8px;">「${rel.name}」</div>
    ${desc ? `<div style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:16px;">${desc}</div>` : ''}
    <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.6;">
        想和你成为<br><span style="color:rgba(200,220,255,0.85);font-weight:600;">${friendName}</span> 的「${rel.name}」
    </div>
    <div style="margin-top:16px;font-size:11px;color:rgba(255,255,255,0.25);">等待 ${friendName} 的回应…</div>
</div>
[/RENDER]`;
    }

    // ==================== 解除关系 ====================

    _sendUnbindRequest(data, friendName) {
        const rel = data.currentRelation;
        if (!confirm(`确定要向${friendName}提出解除「${rel.name}」关系吗？TA可能会拒绝哦`)) return;

        this.close();

        // 发解除卡片
        const card = `[RENDER]
<div style="
    display:flex;flex-direction:column;align-items:center;
    background:linear-gradient(135deg,rgba(255,80,80,0.08),rgba(255,255,255,0.03));
    border:1px solid rgba(255,100,100,0.2);
    border-radius:20px;padding:20px;max-width:220px;text-align:center;
    font-family:inherit;
">
    <div style="font-size:32px;margin-bottom:10px;">🤍</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:6px;">关系解除申请</div>
    <div style="font-size:16px;color:rgba(255,255,255,0.75);">想解除我们的「${rel.name}」关系…</div>
</div>
[/RENDER]`;

        this.ci.addMessage({
            type: 'user', text: card, isHtml: true, timestamp: new Date().toISOString(),
        });
        this.ci.storage.addMessage(this.ci.currentFriendCode, {
            type: 'user', text: card, isHtml: true, timestamp: new Date().toISOString(),
        });
        this.ci.scrollToBottom();

        // 标记等待解除
        data.pendingInvite = { id: '__unbind__', name: rel.name, sentAt: new Date().toISOString() };
        this._save(this.friendCode, data);

        setTimeout(() => this.ci.sendAIMessage(), 300);
    }

    // ==================== 添加自定义关系 ====================

    _addCustomRelation(data) {
        const nameEl = document.getElementById('relCustomName');
        const name = nameEl?.value.trim();
        if (!name) { this._toast('请填写关系名称'); return; }
        if (!this._tempImgFile) { this._toast('请选择图片'); return; }
        if (this._tempImgFile.size > 2 * 1024 * 1024) { this._toast('图片不超过2MB'); return; }

        const reader = new FileReader();
        reader.onload = (e) => {
            const newRel = {
                id: 'custom_' + Date.now(),
                name,
                imgData: e.target.result,
                isCustom: true,
            };
            data.customRelations.push(newRel);
            this._save(this.friendCode, data);
            this._tempImgFile = null;
            this._render();
        };
        reader.readAsDataURL(this._tempImgFile);
    }

    // ==================== AI 指令处理 ====================

    // 在 chat-interface.js 的 AI 回复处理里调用
    handleAIReply(text, friendCode) {
        const data = this._load(friendCode);
        let modified = text;

        // AI 同意绑定
        if (text.includes('[REL_ACCEPT]')) {
            modified = modified.replace('[REL_ACCEPT]', '').trim();
            if (data.pendingInvite && data.pendingInvite.id !== '__unbind__') {
                this._acceptBinding(data, friendCode);
            }
        }

        // AI 拒绝绑定
        const rejectMatch = text.match(/\[REL_REJECT(?::([^\]]*))?\]/);
        if (rejectMatch) {
            modified = modified.replace(rejectMatch[0], '').trim();
            if (data.pendingInvite && data.pendingInvite.id !== '__unbind__') {
                data.pendingInvite = null;
                this._save(friendCode, data);
            }
        }

        // AI 同意解除
        if (text.includes('[REL_UNBIND_OK]')) {
            modified = modified.replace('[REL_UNBIND_OK]', '').trim();
            if (data.currentRelation || (data.pendingInvite?.id === '__unbind__')) {
                this._acceptUnbind(data, friendCode);
            }
        }

        return modified;
    }

    _acceptBinding(data, friendCode) {
        const inv = data.pendingInvite;
        const relName = inv.name;

        // 如果是自定义关系，找到imgData
        const customRel = data.customRelations.find(r => r.id === inv.id);

        data.currentRelation = {
            id: inv.id,
            name: relName,
            imgData: inv.imgData || customRel?.imgData || null,
            isCustom: !!customRel,
            boundAt: new Date().toISOString(),
        };
        // 存到历史
        data.history.push({ id: inv.id, name: relName, boundAt: data.currentRelation.boundAt });
        data.pendingInvite = null;
        this._save(friendCode, data);

        // 写星迹
        if (window.MilestoneTimeline) {
            window.MilestoneTimeline.addRecord(friendCode, {
                type: 'relation_bound',
                payload: { relationName: relName },
            });
        }

        // 刷新面板（如果正好开着）
        if (this.panelEl && this.panelEl.style.display !== 'none') {
            this._render();
        }
    }

    _acceptUnbind(data, friendCode) {
        const relName = data.currentRelation?.name || data.pendingInvite?.name;

        // 更新历史记录
        const last = data.history[data.history.length - 1];
        if (last && !last.unboundAt) last.unboundAt = new Date().toISOString();

        data.currentRelation = null;
        data.pendingInvite = null;
        this._save(friendCode, data);

        if (window.MilestoneTimeline) {
            window.MilestoneTimeline.addRecord(friendCode, {
                type: 'relation_changed',
                payload: { relationName: '（解除了' + (relName || '关系') + '）' },
            });
        }
    }

    // ==================== AI 上下文注入 ====================

    getAIContextInfo(friendCode) {
        const data = this._load(friendCode);
        let info = '\n\n【关系绑定状态】\n';

        if (data.currentRelation) {
            const rel = data.currentRelation;
            const since = rel.boundAt
                ? (window.ZeroTime ? window.ZeroTime.dateStr(new Date(rel.boundAt)) : rel.boundAt.slice(0,10))
                : '';
            info += `你们目前的关系是「${rel.name}」，绑定于 ${since}。\n`;
            info += `这段关系对你来说是真实的——你们是彼此认可的「${rel.name}」，可以自然地用这个身份和user互动。\n`;
        } else if (data.pendingInvite) {
            const inv = data.pendingInvite;
            if (inv.id === '__unbind__') {
                info += `user提出想解除你们的关系。你可以同意（回复中加入 [REL_UNBIND_OK]）或婉拒，完全按你的真实感受来。\n`;
            } else {
                info += `user向你发出了「${inv.name}」关系绑定邀请，正在等待你的回应。\n`;
                info += `你可以在回复中表达态度：\n`;
                info += `- 同意 → 在回复里加入 [REL_ACCEPT]（会从你的消息里隐去，不影响内容）\n`;
                info += `- 拒绝 → 在回复里加入 [REL_REJECT] 或 [REL_REJECT:简短理由]\n`;
                info += `用你真实的性格和感受来决定，不要刻意迎合，也不要故意拒绝。\n`;
            }
        } else {
            info += `你们目前没有特定的关系绑定。\n`;
        }

        return info;
    }

    // ==================== 获取当前关系（供外部查询）====================

    getCurrentRelation(friendCode) {
        return this._load(friendCode).currentRelation || null;
    }

    // ==================== 工具 ====================

    _bindEvents() {
        const closeBtn = document.getElementById('relPanelClose');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());
        const overlay = document.getElementById('relPanelOverlay');
        if (overlay) overlay.addEventListener('click', () => this.close());
    }

    _toast(msg) {
        const t = document.createElement('div');
        t.className = 'rel-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2200);
    }
}
