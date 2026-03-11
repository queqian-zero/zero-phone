/* ============================================================
   亲密关系模块 JS
   文件路径：js/chat/intimacy-modules.js
   在 chat-app.html 中，于 chat-interface.js 之后引入：
   <script src="js/chat/intimacy-modules.js"></script>

   本文件通过 prototype 扩展 ChatInterface 类。
   ============================================================ */

// ================================================================
//  MODULE 1 — 幸运字符
// ================================================================

ChatInterface.prototype.openLuckyCharPage = function() {
    const page = document.getElementById('luckyCharPage');
    if (!page) return;
    page.style.display = 'flex';

    this._lcCurrentCharm = null; // 当前查看的 charm

    if (!this._lcEventsB) {
        this._bindLuckyCharEvents();
        this._lcEventsB = true;
    }
    this._renderLuckyCharPage();
};

ChatInterface.prototype.closeLuckyCharPage = function() {
    const p = document.getElementById('luckyCharPage');
    if (p) p.style.display = 'none';
};

ChatInterface.prototype._renderLuckyCharPage = function() {
    const data = this.storage.getLuckyCharmData();
    const today = new Date().toISOString().slice(0, 10);
    const hist = data.drawHistory[today] || { user: [], ai: [] };

    // 今日抽取 counts
    document.getElementById('lcDrawCountUser').textContent = `我：${hist.user.length}/3`;
    document.getElementById('lcDrawCountAi').textContent   = `TA：${hist.ai.length}/3`;

    const btn = document.getElementById('lcDrawBtn');
    if (btn) btn.disabled = hist.user.length >= 3;

    // 今日抽取结果展示
    this._renderDrawSlots(data, hist);

    // 正在佩戴
    this._renderWearing(data);

    // 字符图鉴
    this._renderLcGrid(data);
};

ChatInterface.prototype._renderDrawSlots = function(data, hist) {
    const container = document.getElementById('lcDrawSlots');
    if (!container) return;
    const allToday = [...hist.user, ...hist.ai].filter((v, i, a) => a.indexOf(v) === i);
    if (allToday.length === 0) {
        container.innerHTML = '<div style="color:#555;font-size:13px;padding:20px 0;">今天还没有抽取记录</div>';
        return;
    }
    container.innerHTML = '';
    allToday.slice(0, 6).forEach(cid => {
        const charm = data.charms.find(c => c.id === cid);
        if (!charm) return;
        const div = document.createElement('div');
        div.className = 'lc-draw-slot filled';
        div.innerHTML = this._lcCharmImgHTML(charm, 40) +
            `<div class="lc-slot-name">${charm.name}</div>`;
        container.appendChild(div);
    });
};

ChatInterface.prototype._renderWearing = function(data) {
    const renderSlot = (elId, charmId) => {
        const el = document.getElementById(elId);
        if (!el) return;
        if (!charmId) { el.className = 'lc-charm-preview empty'; el.innerHTML = ''; return; }
        const charm = data.charms.find(c => c.id === charmId);
        if (!charm) return;
        el.className = 'lc-charm-preview';
        el.innerHTML = this._lcCharmImgHTML(charm, 48);
    };
    renderSlot('lcWearingUser', data.wearing.user);
    renderSlot('lcWearingAi',   data.wearing.ai);

    const aiLabelEl = document.getElementById('lcWearingAiLabel');
    if (aiLabelEl) aiLabelEl.textContent = (this.currentFriend?.nickname || this.currentFriend?.name || 'TA') + '的';
};

ChatInterface.prototype._renderLcGrid = function(data) {
    const grid = document.getElementById('lcGrid');
    if (!grid) return;
    grid.innerHTML = '';
    data.charms.forEach(charm => {
        const litChars = data.litProgress[charm.id] || 0;
        const total = charm.name.length;
        const pct = total > 0 ? litChars / total : 0;
        const litLevel = Math.floor(pct * 5); // 0–4 → 0=unlit,1-4=partial/full

        const wornByUser = data.wearing.user === charm.id;
        const wornByAi   = data.wearing.ai === charm.id;

        const card = document.createElement('div');
        card.className = 'lc-card' +
            (litChars >= total && total > 0 ? ' fully-lit' : '') +
            (wornByUser || wornByAi ? ' worn' : '');
        card.setAttribute('data-id', charm.id);

        // Chars display
        const charsHTML = charm.name.split('').map((ch, i) =>
            `<span class="lc-char-unit${i < litChars ? ' lit' : ''}">${ch}</span>`
        ).join('');

        card.innerHTML = `
            <div class="lc-card-img-wrap">
                <div class="lc-card-img lit-${litLevel}" style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;">
                    ${this._lcCharmImgHTML(charm, 48)}
                </div>
                ${wornByUser ? '<div class="lc-card-worn-badge">我</div>' : ''}
                ${wornByAi   ? '<div class="lc-card-worn-badge" style="background:#1a5f9a;">TA</div>' : ''}
            </div>
            <div class="lc-card-name">${charm.name}</div>
            <div class="lc-card-chars">${charsHTML}</div>`;

        card.addEventListener('click', () => this._openLcDetail(charm.id));
        grid.appendChild(card);
    });
};

ChatInterface.prototype._lcCharmImgHTML = function(charm, size) {
    const s = size || 48;
    // 内置字符用真实图片（img 字段），自定义用上传的 imageSrc
    const src = charm.img || charm.imageSrc;
    if (src) {
        return `<img src="${src}" style="width:${s}px;height:${s}px;object-fit:contain;" alt="${charm.name}" onerror="this.style.display='none';this.nextSibling.style.display='inline'"><span style="font-size:${Math.floor(s*0.65)}px;line-height:1;display:none;">✨</span>`;
    }
    return `<span style="font-size:${Math.floor(s*0.65)}px;line-height:1;">✨</span>`;
};


ChatInterface.prototype._openLcDetail = function(charmId) {
    const data = this.storage.getLuckyCharmData();
    const charm = data.charms.find(c => c.id === charmId);
    if (!charm) return;
    this._lcCurrentCharm = charmId;

    const modal = document.getElementById('luckyCharDetailModal');
    if (!modal) return;

    const litChars = data.litProgress[charmId] || 0;
    const total = charm.name.length;
    const pct = total > 0 ? Math.round((litChars / total) * 100) : 0;

    document.getElementById('lcDetailImg').innerHTML = this._lcCharmImgHTML(charm, 90);
    document.getElementById('lcDetailName').textContent = charm.name;
    document.getElementById('lcDetailProgressFill').style.width = pct + '%';

    const charsHTML = charm.name.split('').map((ch, i) =>
        `<span class="lc-char-unit${i < litChars ? ' lit' : ''}">${ch}</span>`
    ).join('');
    document.getElementById('lcDetailChars').innerHTML = charsHTML;

    // 佩戴按钮
    const wornByUser = data.wearing.user === charmId;
    const wornByAi   = data.wearing.ai === charmId;
    document.getElementById('lcDetailWearUser').style.display = wornByUser ? 'none' : '';
    document.getElementById('lcDetailWearAi').style.display   = wornByAi   ? 'none' : '';
    const unwearBtn = document.getElementById('lcDetailUnwear');
    if (unwearBtn) {
        unwearBtn.style.display = (wornByUser || wornByAi) ? '' : 'none';
        unwearBtn.textContent = wornByUser ? '取下（我）' : '取下（TA）';
    }

    // 留言区：100% 后显示
    const liuyanDiv = document.getElementById('lcDetailLiuyan');
    if (liuyanDiv) {
        if (pct >= 100) {
            liuyanDiv.style.display = 'block';
            const savedMsg = data['留言Pending']?.[charmId] || {};
            const userInput = document.getElementById('lcDetailLiuyanUser');
            if (userInput) userInput.value = savedMsg.user || '';
            const aiTextEl = document.getElementById('lcDetailLiuyanAiText');
            if (aiTextEl) aiTextEl.textContent = savedMsg.ai || '（TA还没有留言，点击生成）';
        } else {
            liuyanDiv.style.display = 'none';
        }
    }

    modal.style.display = 'flex';
};

ChatInterface.prototype._bindLuckyCharEvents = function() {
    // 返回
    const backBtn = document.getElementById('luckyCharBackBtn');
    if (backBtn) backBtn.addEventListener('click', () => this.closeLuckyCharPage());

    // 自定义上传按钮
    const uploadBtn = document.getElementById('luckyCharUploadBtn');
    if (uploadBtn) uploadBtn.addEventListener('click', () => this._openLcUploadModal());

    // 抽取按钮
    const drawBtn = document.getElementById('lcDrawBtn');
    if (drawBtn) drawBtn.addEventListener('click', () => this._doLcDraw());

    // 详情弹窗关闭
    const detClose = document.getElementById('lcDetailClose');
    if (detClose) detClose.addEventListener('click', () => {
        document.getElementById('luckyCharDetailModal').style.display = 'none';
    });

    // 佩戴 / 取下
    const wearUser = document.getElementById('lcDetailWearUser');
    if (wearUser) wearUser.addEventListener('click', () => {
        if (!this._lcCurrentCharm) return;
        const data = this.storage.getLuckyCharmData();
        data.wearing.user = this._lcCurrentCharm;
        this.storage.saveLuckyCharmData(data);
        this._addStarTrailEvent('charm_wear', `佩戴幸运字符「${data.charms.find(c=>c.id===this._lcCurrentCharm)?.name||''}」`, this._lcCurrentCharm);
        document.getElementById('luckyCharDetailModal').style.display = 'none';
        this._renderLuckyCharPage();
    });
    const wearAi = document.getElementById('lcDetailWearAi');
    if (wearAi) wearAi.addEventListener('click', () => {
        if (!this._lcCurrentCharm) return;
        const data = this.storage.getLuckyCharmData();
        data.wearing.ai = this._lcCurrentCharm;
        this.storage.saveLuckyCharmData(data);
        document.getElementById('luckyCharDetailModal').style.display = 'none';
        this._renderLuckyCharPage();
    });
    const unwearBtn = document.getElementById('lcDetailUnwear');
    if (unwearBtn) unwearBtn.addEventListener('click', () => {
        if (!this._lcCurrentCharm) return;
        const data = this.storage.getLuckyCharmData();
        if (data.wearing.user === this._lcCurrentCharm) data.wearing.user = null;
        if (data.wearing.ai   === this._lcCurrentCharm) data.wearing.ai   = null;
        this.storage.saveLuckyCharmData(data);
        document.getElementById('luckyCharDetailModal').style.display = 'none';
        this._renderLuckyCharPage();
    });

    // 留言保存
    const liuyanSave = document.getElementById('lcDetailLiuyanSave');
    if (liuyanSave) liuyanSave.addEventListener('click', () => this._saveLcLiuyan());

    // 上传弹窗事件
    this._bindLcUploadEvents();
};

ChatInterface.prototype._doLcDraw = function() {
    const data = this.storage.getLuckyCharmData();
    const today = new Date().toISOString().slice(0, 10);
    if (!data.drawHistory[today]) data.drawHistory[today] = { user: [], ai: [] };
    const hist = data.drawHistory[today];

    if (hist.user.length >= 3) { alert('今天已经抽完啦！明天再来~'); return; }

    // 随机抽一张
    const available = data.charms.filter(c => !hist.user.includes(c.id));
    if (available.length === 0) { alert('已经抽过所有字符了！'); return; }
    const picked = available[Math.floor(Math.random() * available.length)];
    hist.user.push(picked.id);

    // AI 也自动抽（如果还没抽满）
    if (hist.ai.length < 3) {
        const aiAvail = data.charms.filter(c => !hist.ai.includes(c.id));
        if (aiAvail.length > 0) {
            const aiPicked = aiAvail[Math.floor(Math.random() * aiAvail.length)];
            hist.ai.push(aiPicked.id);
        }
    }

    this.storage.saveLuckyCharmData(data);
    this._addStarTrailEvent('charm_draw', `抽到幸运字符「${picked.name}」`, picked.id);
    this._renderLuckyCharPage();
};

// 每次 AI 回复时调用，推进点亮进度
ChatInterface.prototype._advanceLuckyCharProgress = function() {
    const data = this.storage.getLuckyCharmData();
    const wornUser = data.wearing.user;
    const wornAi   = data.wearing.ai;
    let changed = false;

    const advance = (cid) => {
        if (!cid) return;
        const charm = data.charms.find(c => c.id === cid);
        if (!charm) return;
        const total = charm.name.length;
        const cur = data.litProgress[cid] || 0;
        if (cur < total) {
            // 每 8 轮点亮 1 字
            const rounds = this.storage.getIntimacyData(this.currentFriendCode)?.totalRounds || 0;
            const shouldBe = Math.min(total, Math.floor(rounds / 8));
            if (shouldBe > cur) {
                data.litProgress[cid] = shouldBe;
                changed = true;
                if (shouldBe >= total) {
                    // 100% 点亮 → 触发留言
                    this._triggerLiuyanModal('charm_full', `幸运字符「${charm.name}」已完全点亮！`);
                    this._addStarTrailEvent('charm_full', `幸运字符「${charm.name}」完全点亮`, cid);
                }
            }
        }
    };

    advance(wornUser);
    if (wornAi !== wornUser) advance(wornAi);
    if (changed) this.storage.saveLuckyCharmData(data);
};

ChatInterface.prototype._saveLcLiuyan = function() {
    if (!this._lcCurrentCharm) return;
    const input = document.getElementById('lcDetailLiuyanUser');
    const text = input?.value.trim();
    const data = this.storage.getLuckyCharmData();
    if (!data['留言Pending']) data['留言Pending'] = {};
    if (!data['留言Pending'][this._lcCurrentCharm]) data['留言Pending'][this._lcCurrentCharm] = {};
    data['留言Pending'][this._lcCurrentCharm].user = text;
    this.storage.saveLuckyCharmData(data);
    // AI 留言生成
    this._generateAiLiuyan('charm').then(msg => {
        data['留言Pending'][this._lcCurrentCharm].ai = msg;
        this.storage.saveLuckyCharmData(data);
        const aiEl = document.getElementById('lcDetailLiuyanAiText');
        if (aiEl) aiEl.textContent = msg;
    });
    alert('✅ 留言已保存！');
};

ChatInterface.prototype._openLcUploadModal = function() {
    const modal = document.getElementById('luckyCharUploadModal');
    if (modal) modal.style.display = 'flex';
};

ChatInterface.prototype._bindLcUploadEvents = function() {
    const closeBtn = document.getElementById('lcUploadClose');
    const cancelBtn = document.getElementById('lcUploadCancel');
    const confirmBtn = document.getElementById('lcUploadConfirm');
    const imgBtn = document.getElementById('lcUploadImgBtn');
    const imgFile = document.getElementById('lcUploadImgFile');
    const imgName = document.getElementById('lcUploadImgName');

    if (closeBtn)  closeBtn.addEventListener('click',  () => { document.getElementById('luckyCharUploadModal').style.display = 'none'; });
    if (cancelBtn) cancelBtn.addEventListener('click', () => { document.getElementById('luckyCharUploadModal').style.display = 'none'; });

    let _lcUploadImgData = null;
    if (imgBtn && imgFile) {
        imgBtn.addEventListener('click', () => imgFile.click());
        imgFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                _lcUploadImgData = ev.target.result;
                if (imgName) imgName.textContent = file.name;
            };
            reader.readAsDataURL(file);
        });
    }

    if (confirmBtn) confirmBtn.addEventListener('click', () => {
        const name = document.getElementById('lcUploadName')?.value.trim();
        const urlInput = document.getElementById('lcUploadImgUrl')?.value.trim();
        const color = document.getElementById('lcUploadColor')?.value || '#ff6b9d';

        if (!name) { alert('❌ 请输入字符名称'); return; }
        const src = _lcUploadImgData || urlInput;
        if (!src) { alert('❌ 请上传图片或输入图片URL'); return; }

        const data = this.storage.getLuckyCharmData();
        const id = 'custom_' + Date.now();
        data.charms.push({ id, name, isBuiltin: false, imageSrc: src, litColor: color });
        this.storage.saveLuckyCharmData(data);
        document.getElementById('luckyCharUploadModal').style.display = 'none';
        this._renderLuckyCharPage();
        alert('✅ 自定义字符已添加！');
    });
};


// ================================================================
//  MODULE 2 — 关系绑定
// ================================================================

ChatInterface.prototype.openRelationshipPage = function() {
    const page = document.getElementById('relationshipPage');
    if (!page) return;
    page.style.display = 'flex';
    if (!this._relEventsB) { this._bindRelEvents(); this._relEventsB = true; }
    this._renderRelPage();
};

ChatInterface.prototype.closeRelationshipPage = function() {
    const p = document.getElementById('relationshipPage');
    if (p) p.style.display = 'none';
};

ChatInterface.prototype._renderRelPage = function() {
    const binding = this.storage.getRelationshipBinding(this.currentFriendCode);
    const friendName = this.currentFriend?.nickname || this.currentFriend?.name || 'TA';

    document.getElementById('relUnbound').style.display = binding ? 'none' : 'block';
    document.getElementById('relBound').style.display   = binding ? 'block' : 'none';

    const customBtn = document.getElementById('relCustomBtn');
    if (customBtn) customBtn.style.display = binding ? 'none' : '';

    if (!binding) {
        this._renderRelTypeGrid();
    } else {
        // 显示绑定状态
        const allTypes = [...this.storage.getRelationshipTypes(),
            ...this._getCustomRelTypes()];
        const type = allTypes.find(t => t.id === binding.typeId) ||
            { name: binding.customName || '关系', img: null };

        const iconEl = document.getElementById('relBoundIcon');
        if (iconEl) {
            iconEl.innerHTML = type.img
                ? `<img src="${type.img}" style="width:80px;height:80px;object-fit:contain;">`
                : this._relTypeEmoji(binding.typeId);
        }
        document.getElementById('relBoundName').textContent = type.name;

        const boundAt = new Date(binding.boundAt);
        document.getElementById('relBoundDate').textContent = `绑定于 ${this._formatRelDate(boundAt)}`;
        const days = Math.floor((Date.now() - boundAt) / 86400000);
        document.getElementById('relBoundDays').textContent = `已在一起 ${days} 天 💕`;

        // 留言
        const liuyanUserEl = document.getElementById('relLiuyanUser');
        if (liuyanUserEl) liuyanUserEl.value = binding.liuyanUser || '';
        const liuyanAiEl = document.getElementById('relLiuyanAiText');
        if (liuyanAiEl) liuyanAiEl.textContent = binding.liuyanAi || `${friendName} 还没有留言`;
    }
};

ChatInterface.prototype._renderRelTypeGrid = function() {
    const grid = document.getElementById('relTypeGrid');
    if (!grid) return;
    const types = [...this.storage.getRelationshipTypes(), ...this._getCustomRelTypes()];
    const emojis = { bros:'🤜', couple:'💑', besties:'👯', partners:'🤝' };
    grid.innerHTML = '';
    types.forEach(type => {
        const card = document.createElement('div');
        card.className = 'rel-type-card' + (this._selectedRelType === type.id ? ' active' : '');
        card.setAttribute('data-id', type.id);
        card.innerHTML = `<div class="rel-type-img">${
            type.img ? `<img src="${type.img}">` : (emojis[type.id] || '💫')
        }</div><div class="rel-type-name">${type.name}</div>`;
        card.addEventListener('click', () => {
            this._selectedRelType = type.id;
            this._selectedRelTypeData = type;
            document.querySelectorAll('.rel-type-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            const preview = document.getElementById('relSelectedPreview');
            const previewImg = document.getElementById('relSelectedImg');
            const previewName = document.getElementById('relSelectedName');
            if (preview) preview.style.display = 'block';
            if (previewImg) previewImg.innerHTML = type.img ? `<img src="${type.img}">` : (emojis[type.id] || '💫');
            if (previewName) previewName.textContent = type.name;
            const inviteBtn = document.getElementById('relInviteBtn');
            if (inviteBtn) inviteBtn.disabled = false;
        });
        grid.appendChild(card);
    });
    // 自定义加号
    const addCard = document.createElement('div');
    addCard.className = 'rel-type-card';
    addCard.style.cursor = 'pointer';
    addCard.innerHTML = `<div class="rel-type-img" style="font-size:32px;">＋</div><div class="rel-type-name">自定义</div>`;
    addCard.addEventListener('click', () => this._openRelCustomModal());
    grid.appendChild(addCard);
};

ChatInterface.prototype._relTypeEmoji = function(typeId) {
    const m = { bros:'🤜', couple:'💑', besties:'👯', partners:'🤝' };
    return `<span style="font-size:56px;">${m[typeId] || '💫'}</span>`;
};

ChatInterface.prototype._getCustomRelTypes = function() {
    try {
        const d = localStorage.getItem(`zero_phone_rel_custom_${this.currentFriendCode}`);
        return d ? JSON.parse(d) : [];
    } catch(e) { return []; }
};

ChatInterface.prototype._saveCustomRelTypes = function(types) {
    localStorage.setItem(`zero_phone_rel_custom_${this.currentFriendCode}`, JSON.stringify(types));
};

ChatInterface.prototype._formatRelDate = function(date) {
    return `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日`;
};

ChatInterface.prototype._bindRelEvents = function() {
    const backBtn = document.getElementById('relBackBtn');
    if (backBtn) backBtn.addEventListener('click', () => this.closeRelationshipPage());

    const customBtn = document.getElementById('relCustomBtn');
    if (customBtn) customBtn.addEventListener('click', () => this._openRelCustomModal());

    const inviteBtn = document.getElementById('relInviteBtn');
    if (inviteBtn) inviteBtn.addEventListener('click', () => this._openRelInviteModal());

    const unbindBtn = document.getElementById('relUnbindBtn');
    if (unbindBtn) unbindBtn.addEventListener('click', () => {
        if (!confirm('确定要解除关系绑定吗？')) return;
        this.storage.clearRelationshipBinding(this.currentFriendCode);
        this._selectedRelType = null;
        this._renderRelPage();
    });

    const saveLiuyan = document.getElementById('relSaveLiuyan');
    if (saveLiuyan) saveLiuyan.addEventListener('click', () => {
        const text = document.getElementById('relLiuyanUser')?.value.trim();
        const binding = this.storage.getRelationshipBinding(this.currentFriendCode);
        if (!binding) return;
        binding.liuyanUser = text;
        this.storage.setRelationshipBinding(this.currentFriendCode, binding);
        alert('✅ 留言已保存！');
    });

    const genAiBtn = document.getElementById('relGenAiMessage');
    if (genAiBtn) genAiBtn.addEventListener('click', async () => {
        genAiBtn.disabled = true;
        genAiBtn.textContent = '生成中…';
        const msg = await this._generateAiLiuyan('relationship');
        const binding = this.storage.getRelationshipBinding(this.currentFriendCode);
        if (binding) {
            binding.liuyanAi = msg;
            this.storage.setRelationshipBinding(this.currentFriendCode, binding);
        }
        const el = document.getElementById('relLiuyanAiText');
        if (el) el.textContent = msg;
        genAiBtn.disabled = false;
        genAiBtn.textContent = '重新生成';
    });

    // 邀请弹窗
    const invClose   = document.getElementById('relInviteClose');
    const invCancel  = document.getElementById('relInviteCancel');
    const invConfirm = document.getElementById('relInviteConfirm');
    if (invClose)   invClose.addEventListener('click',   () => { document.getElementById('relInviteModal').style.display='none'; });
    if (invCancel)  invCancel.addEventListener('click',  () => { document.getElementById('relInviteModal').style.display='none'; });
    if (invConfirm) invConfirm.addEventListener('click', () => this._confirmRelBinding());

    document.querySelectorAll('.rel-invite-tmpl').forEach(tmpl => {
        tmpl.addEventListener('click', () => {
            document.querySelectorAll('.rel-invite-tmpl').forEach(t => t.classList.remove('active'));
            tmpl.classList.add('active');
            this._selectedInviteTmpl = tmpl.getAttribute('data-tmpl');
            this._renderInviteCard();
        });
    });

    // 自定义弹窗
    this._bindRelCustomEvents();
};

ChatInterface.prototype._openRelInviteModal = function() {
    if (!this._selectedRelType) { alert('请先选择关系类型'); return; }
    const modal = document.getElementById('relInviteModal');
    if (!modal) return;
    this._selectedInviteTmpl = '1';
    modal.style.display = 'flex';
    this._renderInviteCard();
};

ChatInterface.prototype._renderInviteCard = function() {
    const container = document.getElementById('relInviteCardPreview');
    if (!container) return;
    const type = this._selectedRelTypeData;
    const friendName = this.currentFriend?.nickname || this.currentFriend?.name || 'TA';
    const tmpl = this._selectedInviteTmpl || '1';
    const emojis = { bros:'🤜', couple:'💑', besties:'👯', partners:'🤝' };
    const iconHTML = (type?.img)
        ? `<img src="${type.img}" style="width:64px;height:64px;object-fit:contain;">`
        : `<span style="font-size:48px;">${emojis[type?.id] || '💫'}</span>`;
    const names = `「${friendName}」×「你」`;
    const taglines = {
        '1': `正式成为彼此的 ${type?.name || '挚友'}`,
        '2': `跨越次元的 ${type?.name || '羁绊'} ，从此刻开始`,
        '3': `感谢你愿意成为我的 ${type?.name || '重要的人'}`
    };
    container.innerHTML = `
        <div class="invite-card invite-card-${tmpl}">
            <div class="invite-card-icon">${iconHTML}</div>
            <div class="invite-card-title">${type?.name || '关系绑定'} 邀请</div>
            <div class="invite-card-names">${names}</div>
            <div class="invite-card-sub">${taglines[tmpl] || taglines['1']}</div>
        </div>`;
};

ChatInterface.prototype._confirmRelBinding = function() {
    if (!this._selectedRelType) return;
    this.storage.setRelationshipBinding(this.currentFriendCode, {
        typeId: this._selectedRelType,
        customName: this._selectedRelTypeData?.name || '',
        customImg: this._selectedRelTypeData?.img || ''
    });
    document.getElementById('relInviteModal').style.display = 'none';
    // 触发留言
    this._triggerLiuyanModal('relationship', `你们正式成为了「${this._selectedRelTypeData?.name || '关系绑定'}」！`);
    this._addStarTrailEvent('relationship_bind', `确立关系「${this._selectedRelTypeData?.name || '关系绑定'}」`, this._selectedRelType);
    this._renderRelPage();
};

ChatInterface.prototype._openRelCustomModal = function() {
    const m = document.getElementById('relCustomModal');
    if (m) m.style.display = 'flex';
};

ChatInterface.prototype._bindRelCustomEvents = function() {
    const closeBtn   = document.getElementById('relCustomClose');
    const cancelBtn  = document.getElementById('relCustomCancel');
    const confirmBtn = document.getElementById('relCustomConfirm');
    const imgBtn     = document.getElementById('relCustomImgBtn');
    const imgFile    = document.getElementById('relCustomImgFile');
    const imgNameEl  = document.getElementById('relCustomImgName');
    let _relCustomImg = null;

    if (closeBtn)  closeBtn.addEventListener('click',  () => { document.getElementById('relCustomModal').style.display='none'; });
    if (cancelBtn) cancelBtn.addEventListener('click', () => { document.getElementById('relCustomModal').style.display='none'; });

    if (imgBtn && imgFile) {
        imgBtn.addEventListener('click', () => imgFile.click());
        imgFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                _relCustomImg = ev.target.result;
                if (imgNameEl) imgNameEl.textContent = file.name;
            };
            reader.readAsDataURL(file);
        });
    }

    if (confirmBtn) confirmBtn.addEventListener('click', () => {
        const name = document.getElementById('relCustomName')?.value.trim();
        if (!name) { alert('❌ 请输入关系名称'); return; }
        const customs = this._getCustomRelTypes();
        customs.push({ id: 'custom_' + Date.now(), name, img: _relCustomImg || '' });
        this._saveCustomRelTypes(customs);
        document.getElementById('relCustomModal').style.display = 'none';
        _relCustomImg = null;
        this._renderRelTypeGrid();
        alert('✅ 自定义关系已添加！');
    });
};
// ================================================================
//  MODULE 3 — 亲密徽章
// ================================================================

ChatInterface.prototype.openBadgePage = function() {
    const page = document.getElementById('badgePage');
    if (!page) return;
    page.style.display = 'flex';
    if (!this._badgeEventsB) { this._bindBadgeEvents(); this._badgeEventsB = true; }
    this._checkAndUnlockBadges(); // 每次打开检测一次
    this._renderBadgeGrid();
};

ChatInterface.prototype.closeBadgePage = function() {
    const p = document.getElementById('badgePage');
    if (p) p.style.display = 'none';
};

ChatInterface.prototype._checkAndUnlockBadges = function() {
    const defs = this.storage.getBadgeDefinitions();
    defs.forEach(def => {
        const already = this.storage.getUnlockedBadges(this.currentFriendCode).find(b => b.id === def.id);
        if (already) return;
        if (this._checkBadgeCondition(def)) {
            const isLimited = def.id === 'heartbeat-limited' && this._isValentinesLimited();
            this.storage.addUnlockedBadge(this.currentFriendCode, def.id, isLimited);
            this._triggerLiuyanModal('badge', `🏅 解锁徽章「${def.name}」！`);
            this._addStarTrailEvent('badge_unlock', `解锁亲密徽章「${def.name}」`, def.id);
        }
    });
};

ChatInterface.prototype._checkBadgeCondition = function(def) {
    const msgs = this.messages;
    const friendCode = this.currentFriendCode;

    switch(def.type) {
        case 'instant':
            return msgs.some(m => m.type === 'user') && msgs.some(m => m.type === 'ai');

        case 'goodnight_once': {
            const goodnightRe = /晚安/;
            const userHas = msgs.some(m => m.type === 'user' && goodnightRe.test(m.text));
            const aiHas   = msgs.some(m => m.type === 'ai'   && goodnightRe.test(m.text));
            return userHas && aiHas;
        }

        case 'night_chat_days': {
            const days = new Set();
            msgs.forEach(m => {
                const d = new Date(m.timestamp);
                const h = d.getHours();
                if (h >= 0 && h < 5) days.add(d.toISOString().slice(0, 10));
            });
            return days.size >= def.goal;
        }

        case 'night_chat_days_ex': {
            const days = new Set();
            msgs.forEach(m => {
                const d = new Date(m.timestamp);
                if (d.getHours() < 5) days.add(d.toISOString().slice(0, 10));
            });
            return days.size >= def.goal;
        }

        case 'greetings': {
            // 早安+晚安 累计 60 天
            const morningRe = /早安|早上好|早哦/;
            const nightRe   = /晚安/;
            const morningDays = new Set();
            const nightDays   = new Set();
            msgs.forEach(m => {
                const date = m.timestamp.slice(0, 10);
                if (morningRe.test(m.text)) morningDays.add(date);
                if (nightRe.test(m.text))   nightDays.add(date);
            });
            const bothDays = [...morningDays].filter(d => nightDays.has(d));
            return bothDays.length >= def.goal;
        }

        case 'goodnight_streak': {
            // 连续7天双方互道晚安
            const nightRe = /晚安/;
            const daysSets = {};
            msgs.forEach(m => {
                const date = m.timestamp.slice(0, 10);
                if (!daysSets[date]) daysSets[date] = { user: false, ai: false };
                if (nightRe.test(m.text)) daysSets[date][m.type] = true;
            });
            const bothDays = Object.entries(daysSets)
                .filter(([, v]) => v.user && v.ai)
                .map(([d]) => d)
                .sort();
            if (bothDays.length < def.goal) return false;
            // 检查连续性
            let streak = 1;
            for (let i = 1; i < bothDays.length; i++) {
                const prev = new Date(bothDays[i-1]);
                const cur  = new Date(bothDays[i]);
                const diff = (cur - prev) / 86400000;
                if (diff === 1) { streak++; if (streak >= def.goal) return true; }
                else streak = 1;
            }
            return false;
        }

        case 'spark_days': {
            const settings = this.storage.getChatSettings(this.currentFriendCode);
            if (!settings?.sparkEnabled) return false;
            const spark = this.chatApp.calcSparkStatus(this.currentFriendCode);
            return spark.days >= def.goal;
        }

        case 'valentines': {
            return this._checkValentinesCondition();
        }

        case 'progress': {
            // 跨次元兑换所 各完成5件事
            const ex = this.storage.getExchangeData(this.currentFriendCode);
            const allItems = [...(ex.todos||[]),...(ex.funds||[]),...(ex.shopping||[]),...(ex.delivery||[]),...(ex.letters||[])];
            return allItems.filter(i => i.completed).length >= def.goal;
        }

        default: return false;
    }
};

ChatInterface.prototype._checkValentinesCondition = function() {
    const valentinesRe = /情人节快乐/;
    const feb14 = (ts) => {
        const d = new Date(ts);
        return d.getMonth() === 1 && d.getDate() === 14;
    };
    const matches = this.messages.filter(m => valentinesRe.test(m.text) && feb14(m.timestamp));
    return matches.length > 0;
};

ChatInterface.prototype._isValentinesLimited = function() {
    // 检查是否是第一年（限定版）还是连续3年（永久版）
    const valentinesRe = /情人节快乐/;
    const years = new Set(
        this.messages
            .filter(m => valentinesRe.test(m.text))
            .map(m => new Date(m.timestamp))
            .filter(d => d.getMonth() === 1 && d.getDate() === 14)
            .map(d => d.getFullYear())
    );
    return years.size < 3; // 少于3年 = 限定版
};

ChatInterface.prototype._renderBadgeGrid = function() {
    const grid = document.getElementById('badgeGrid');
    if (!grid) return;
    const defs = this.storage.getBadgeDefinitions();
    const customs = this.storage.getCustomBadges(this.currentFriendCode);
    const unlocked = this.storage.getUnlockedBadges(this.currentFriendCode);

    grid.innerHTML = '';
    const allBadges = [...defs, ...customs.map(c => ({...c, isCustom:true}))];

    allBadges.forEach(def => {
        const ul = unlocked.find(b => b.id === def.id);
        const isUnlocked = !!ul;
        const isLimited = ul?.isLimited;

        const card = document.createElement('div');
        card.className = 'badge-card' + (isUnlocked ? (isLimited ? ' unlocked-limited' : ' unlocked') : '');
        card.setAttribute('data-id', def.id);

        const progress = isUnlocked ? '' : this._getBadgeProgressText(def);
        const statusText = isUnlocked
            ? (isLimited ? '✦ 限定版' : '✦ 已解锁')
            : `进行中`;

        card.innerHTML = `
            <div class="badge-card-img-wrap">
                <div class="badge-card-img" style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;filter:${isUnlocked?'none':'grayscale(100%) brightness(0.25)'};">
                    ${this._badgeImgHTML(def, 52)}
                </div>
                ${!isUnlocked ? '<div class="badge-card-locked-overlay">🔒</div>' : ''}
            </div>
            <div class="badge-card-name">${def.name}</div>
            <div class="badge-card-status">${statusText}</div>`;

        card.addEventListener('click', () => this._openBadgeDetail(def.id));
        grid.appendChild(card);
    });
};

ChatInterface.prototype._badgeImgHTML = function(def, size) {
    const s = size || 52;
    // 内置徽章用 def.img，自定义用 def.imageSrc
    const src = def.img || def.imageSrc;
    if (src) {
        return `<img src="${src}" style="width:${s}px;height:${s}px;object-fit:contain;" alt="${def.name}" onerror="this.style.display='none';this.nextSibling.style.display='inline'"><span style="font-size:${Math.floor(s*0.65)}px;line-height:1;display:none;">🏅</span>`;
    }
    return `<span style="font-size:${Math.floor(s*0.65)}px;line-height:1;">🏅</span>`;
};

ChatInterface.prototype._getBadgeProgressText = function(def) {
    switch(def.type) {
        case 'night_chat_days': {
            const days = new Set();
            this.messages.forEach(m => {
                if (new Date(m.timestamp).getHours() < 5) days.add(m.timestamp.slice(0,10));
            });
            return `${days.size}/${def.goal} 天`;
        }
        case 'greetings': {
            const morningRe = /早安/; const nightRe = /晚安/;
            const md = new Set(); const nd = new Set();
            this.messages.forEach(m => {
                const d = m.timestamp.slice(0,10);
                if (morningRe.test(m.text)) md.add(d);
                if (nightRe.test(m.text)) nd.add(d);
            });
            return `${[...md].filter(d=>nd.has(d)).length}/${def.goal} 天`;
        }
        default: return '';
    }
};

ChatInterface.prototype._openBadgeDetail = function(badgeId) {
    const allDefs = [...this.storage.getBadgeDefinitions(), ...this.storage.getCustomBadges(this.currentFriendCode)];
    const def = allDefs.find(d => d.id === badgeId);
    if (!def) return;

    const modal = document.getElementById('badgeDetailModal');
    if (!modal) return;

    const unlockedBadges = this.storage.getUnlockedBadges(this.currentFriendCode);
    const ul = unlockedBadges.find(b => b.id === badgeId);

    document.getElementById('badgeDetailImg').innerHTML = this._badgeImgHTML(def, 80);
    document.getElementById('badgeDetailName').textContent = def.name;
    document.getElementById('badgeDetailDesc').textContent = def.desc || def.condition || '';
    document.getElementById('badgeDetailStatus').textContent = ul
        ? `✦ ${ul.isLimited ? '限定版' : '已解锁'} · ${new Date(ul.unlockedAt).toLocaleDateString()}`
        : '🔒 尚未解锁';
    document.getElementById('badgeDetailStatus').style.color = ul ? '#ffd700' : '#666';

    const progress = this._getBadgeProgressText(def);
    const progressEl = document.getElementById('badgeDetailProgress');
    if (progressEl) progressEl.textContent = progress ? `当前进度：${progress}` : (ul ? '已达成解锁条件' : '继续努力中…');

    // 留言区
    const liuyanSection = document.getElementById('badgeLiuyanSection');
    if (liuyanSection) {
        if (ul) {
            liuyanSection.style.display = 'block';
            const saved = this._getBadgeLiuyan(badgeId);
            const userInput = document.getElementById('badgeLiuyanUser');
            if (userInput) userInput.value = saved.user || '';
            const aiEl = document.getElementById('badgeLiuyanAiText');
            if (aiEl) aiEl.textContent = saved.ai || '（点击下方按钮生成TA的留言）';
        } else {
            liuyanSection.style.display = 'none';
        }
    }

    this._currentBadgeId = badgeId;
    modal.style.display = 'flex';
};

ChatInterface.prototype._getBadgeLiuyan = function(badgeId) {
    try {
        const k = `zero_phone_badge_liuyan_${this.currentFriendCode}_${badgeId}`;
        const d = localStorage.getItem(k);
        return d ? JSON.parse(d) : {};
    } catch(e) { return {}; }
};
ChatInterface.prototype._saveBadgeLiuyan = function(badgeId, data) {
    localStorage.setItem(`zero_phone_badge_liuyan_${this.currentFriendCode}_${badgeId}`, JSON.stringify(data));
};

ChatInterface.prototype._bindBadgeEvents = function() {
    const backBtn = document.getElementById('badgeBackBtn');
    if (backBtn) backBtn.addEventListener('click', () => this.closeBadgePage());

    const customBtn = document.getElementById('badgeCustomBtn');
    if (customBtn) customBtn.addEventListener('click', () => {
        document.getElementById('badgeCustomModal').style.display = 'flex';
    });

    const detClose = document.getElementById('badgeDetailClose');
    if (detClose) detClose.addEventListener('click', () => {
        document.getElementById('badgeDetailModal').style.display = 'none';
    });

    const liuyanSave = document.getElementById('badgeLiuyanSave');
    if (liuyanSave) liuyanSave.addEventListener('click', async () => {
        if (!this._currentBadgeId) return;
        const userText = document.getElementById('badgeLiuyanUser')?.value.trim();
        const saved = this._getBadgeLiuyan(this._currentBadgeId);
        saved.user = userText;
        if (!saved.ai) {
            saved.ai = await this._generateAiLiuyan('badge');
            const aiEl = document.getElementById('badgeLiuyanAiText');
            if (aiEl) aiEl.textContent = saved.ai;
        }
        this._saveBadgeLiuyan(this._currentBadgeId, saved);
        alert('✅ 寄语已保存！');
    });

    // 自定义徽章弹窗
    const ccClose   = document.getElementById('badgeCustomClose');
    const ccCancel  = document.getElementById('badgeCustomCancel');
    const ccConfirm = document.getElementById('badgeCustomConfirm');
    const ccImgBtn  = document.getElementById('badgeCustomImgBtn');
    const ccImgFile = document.getElementById('badgeCustomImgFile');
    let _customBadgeImg = null;

    if (ccClose)  ccClose.addEventListener('click',  () => { document.getElementById('badgeCustomModal').style.display='none'; });
    if (ccCancel) ccCancel.addEventListener('click', () => { document.getElementById('badgeCustomModal').style.display='none'; });
    if (ccImgBtn && ccImgFile) {
        ccImgBtn.addEventListener('click', () => ccImgFile.click());
        ccImgFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                _customBadgeImg = ev.target.result;
                document.getElementById('badgeCustomImgName').textContent = file.name;
            };
            reader.readAsDataURL(file);
        });
    }
    if (ccConfirm) ccConfirm.addEventListener('click', () => {
        const name = document.getElementById('badgeCustomName')?.value.trim();
        const cond = document.getElementById('badgeCustomCondition')?.value.trim();
        if (!name) { alert('❌ 请输入徽章名称'); return; }
        const customs = this.storage.getCustomBadges(this.currentFriendCode);
        customs.push({ id:'custom_badge_'+Date.now(), name, desc:cond||'', imageSrc:_customBadgeImg||'', isCustom:true });
        this.storage.saveCustomBadges(this.currentFriendCode, customs);
        document.getElementById('badgeCustomModal').style.display = 'none';
        _customBadgeImg = null;
        this._renderBadgeGrid();
    });
};


// ================================================================
//  MODULE 4 — 跨次元兑换所
// ================================================================

ChatInterface.prototype.openExchangePage = function() {
    const page = document.getElementById('exchangePage');
    if (!page) return;
    page.style.display = 'flex';
    this._exCurrentTab = this._exCurrentTab || 'todos';
    if (!this._exEventsB) { this._bindExchangeEvents(); this._exEventsB = true; }
    this._switchExchangeTab(this._exCurrentTab);
};

ChatInterface.prototype.closeExchangePage = function() {
    const p = document.getElementById('exchangePage');
    if (p) p.style.display = 'none';
};

ChatInterface.prototype._switchExchangeTab = function(tab) {
    this._exCurrentTab = tab;
    document.querySelectorAll('.exchange-tab').forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-tab') === tab);
    });
    this._renderExchangeBody(tab);
};

ChatInterface.prototype._renderExchangeBody = function(tab) {
    const body = document.getElementById('exchangeBody');
    if (!body) return;
    const data = this.storage.getExchangeData(this.currentFriendCode);
    const items = data[tab] || [];
    const friendName = this.currentFriend?.nickname || this.currentFriend?.name || 'TA';

    if (tab === 'funds') {
        this._renderFundsBody(body, items);
        return;
    }
    if (tab === 'letters') {
        this._renderLettersBody(body, items, friendName);
        return;
    }

    if (items.length === 0) {
        body.innerHTML = `<div class="exchange-empty">
            <div class="exchange-empty-icon">${this._exTabEmoji(tab)}</div>
            <div class="exchange-empty-text">还没有内容<br>点击右上角 ＋ 添加</div>
        </div>`;
        return;
    }

    body.innerHTML = '<div class="exchange-list"></div>';
    const list = body.querySelector('.exchange-list');
    items.forEach(item => {
        list.appendChild(this._createExchangeItemEl(item, tab, friendName));
    });
};

ChatInterface.prototype._renderFundsBody = function(body, items) {
    const total = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const receivedTotal = items.filter(i => i.completed).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    body.innerHTML = `
        <div class="fund-total-bar">
            <div class="fund-total-label">亲密基金总额</div>
            <div><span class="fund-total-amount">${total.toFixed(2)}</span><span class="fund-total-unit">元</span></div>
            <div style="font-size:12px;color:#888;margin-top:4px;">已取用 ${receivedTotal.toFixed(2)} 元</div>
        </div>
        <div class="exchange-list" id="fundList"></div>`;
    const list = document.getElementById('fundList');
    const friendName = this.currentFriend?.nickname || this.currentFriend?.name || 'TA';
    if (items.length === 0) {
        list.innerHTML = `<div class="exchange-empty"><div class="exchange-empty-icon">💰</div><div class="exchange-empty-text">还没有亲密基金</div></div>`;
    } else {
        items.forEach(item => list.appendChild(this._createExchangeItemEl(item, 'funds', friendName)));
    }
};

ChatInterface.prototype._renderLettersBody = function(body, items, friendName) {
    if (items.length === 0) {
        body.innerHTML = `<div class="exchange-empty"><div class="exchange-empty-icon">✉️</div><div class="exchange-empty-text">还没有信件</div></div>`;
        return;
    }
    body.innerHTML = '';
    const now = Date.now();
    items.forEach(item => {
        const receiveTime = new Date(item.receiveTime).getTime();
        const isLocked = receiveTime > now;
        const div = document.createElement('div');
        div.className = 'letter-envelope';
        div.innerHTML = `
            <div class="letter-from-to">来自：${item.from === 'user' ? '我' : friendName} → 致：${item.to === 'user' ? '我' : (item.to === 'future_user' ? '未来的我' : (item.to === 'future_ai' ? '未来的'+friendName : friendName))}</div>
            <div class="letter-preview-text">${isLocked ? '📮 信件尚未到达…' : (item.content?.slice(0, 50) + '…')}</div>
            <div class="letter-time">📅 发送：${new Date(item.sendTime).toLocaleDateString()} · 收到：${new Date(item.receiveTime).toLocaleDateString()}</div>
            ${isLocked ? `<div class="letter-locked">⏳ ${new Date(item.receiveTime).toLocaleDateString()} 后可读取</div>` : ''}`;
        if (!isLocked) {
            div.addEventListener('click', () => this._openLetterDetail(item));
        }
        body.appendChild(div);
    });
};

ChatInterface.prototype._createExchangeItemEl = function(item, tab, friendName) {
    const div = document.createElement('div');
    div.className = 'exchange-item' + (item.completed ? ' completed' : '');
    div.setAttribute('data-id', item.id);

    const iconEmoji = this._exTabEmoji(tab);
    const fromLabel = item.from === 'user' ? '我' : friendName;
    const toLabel   = item.to === 'ai' ? friendName : (item.to === 'user' ? '我' : '双方');

    let metaText = '';
    if (tab === 'todos') metaText = item.assignedTo === 'both' ? '双方共同完成' : `由${item.assignedTo === 'user' ? '我' : friendName}完成`;
    if (tab === 'funds') metaText = `${fromLabel} 存入 · ${item.amount} 元`;
    if (tab === 'shopping' || tab === 'delivery') metaText = `${fromLabel} 送给 ${toLabel}`;

    div.innerHTML = `
        <div class="exchange-item-header">
            <div class="exchange-item-icon">
                ${item.imageSrc ? `<img src="${item.imageSrc}">` : iconEmoji}
            </div>
            <div class="exchange-item-info">
                <div class="exchange-item-title">${this._esc(item.name || item.content?.slice(0,30) || '未命名')}</div>
                <div class="exchange-item-meta">${metaText}</div>
            </div>
        </div>
        ${item.completed ? `<div class="exchange-item-completed-badge">✅ 已完成</div>` : ''}
        ${item.note ? `<div class="exchange-item-note">${this._esc(item.note)}</div>` : ''}
        ${item.completed && item.completedPhoto ? `<div class="exchange-item-complete-photo"><img src="${item.completedPhoto}" alt="完成照片"></div>` : ''}
        ${item.completed && item.completedNote ? `<div class="exchange-item-note">完成备注：${this._esc(item.completedNote)}</div>` : ''}
        <div class="exchange-item-actions">
            ${!item.completed ? `<button class="exchange-action-btn complete" data-action="complete" data-id="${item.id}" data-tab="${tab}">✅ 完成</button>` : ''}
            <button class="exchange-action-btn delete" data-action="delete" data-id="${item.id}" data-tab="${tab}">🗑️ 删除</button>
        </div>`;

    div.querySelectorAll('.exchange-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');
            const t  = btn.getAttribute('data-tab');
            if (action === 'delete') {
                if (!confirm('确定要删除吗？')) return;
                this.storage.deleteExchangeItem(this.currentFriendCode, t, id);
                this._renderExchangeBody(t);
            } else if (action === 'complete') {
                this._openExCompleteModal(t, id);
            }
        });
    });

    return div;
};

ChatInterface.prototype._exTabEmoji = function(tab) {
    return { todos:'📋', funds:'💰', shopping:'🛍️', delivery:'🍜', letters:'✉️' }[tab] || '📦';
};

ChatInterface.prototype._openLetterDetail = function(item) {
    const modal = document.getElementById('letterDetailModal');
    if (!modal) return;
    const friendName = this.currentFriend?.nickname || this.currentFriend?.name || 'TA';
    document.getElementById('letterDetailMeta').innerHTML =
        `<b>来自：</b>${item.from === 'user' ? '我' : friendName} &nbsp;→&nbsp; <b>致：</b>${item.to === 'user' ? '我' : friendName}<br>
        发送于 ${new Date(item.sendTime).toLocaleDateString()}，收到于 ${new Date(item.receiveTime).toLocaleDateString()}`;
    document.getElementById('letterDetailContent').textContent = item.content || '';
    this._currentLetterData = item;
    modal.style.display = 'flex';
};

ChatInterface.prototype._openExCompleteModal = function(tab, itemId) {
    const modal = document.getElementById('exchangeCompleteModal');
    if (!modal) return;
    this._pendingCompleteTab = tab;
    this._pendingCompleteId  = itemId;
    modal.style.display = 'flex';
    const imgPreview = document.getElementById('exCompleteImgPreview');
    if (imgPreview) imgPreview.style.display = 'none';
    const noteEl = document.getElementById('exCompleteNote');
    if (noteEl) noteEl.value = '';
    this._completeImgData = null;
};

ChatInterface.prototype._bindExchangeEvents = function() {
    const backBtn = document.getElementById('exchangeBackBtn');
    if (backBtn) backBtn.addEventListener('click', () => this.closeExchangePage());

    const addBtn = document.getElementById('exchangeAddBtn');
    if (addBtn) addBtn.addEventListener('click', () => this._openExchangeAddModal());

    document.querySelectorAll('.exchange-tab').forEach(tab => {
        tab.addEventListener('click', () => this._switchExchangeTab(tab.getAttribute('data-tab')));
    });

    // 添加弹窗
    document.getElementById('exchangeAddClose')?.addEventListener('click', () => {
        document.getElementById('exchangeAddModal').style.display = 'none';
    });

    // 完成弹窗
    const completeClose  = document.getElementById('exchangeCompleteClose');
    const completeCancel = document.getElementById('exchangeCompleteCancel');
    const completeConfirm= document.getElementById('exchangeCompleteConfirm');
    const completeImgBtn = document.getElementById('exCompleteImgBtn');
    const completeImgFile= document.getElementById('exCompleteImgFile');

    if (completeClose)   completeClose.addEventListener('click',  () => { document.getElementById('exchangeCompleteModal').style.display='none'; });
    if (completeCancel)  completeCancel.addEventListener('click', () => { document.getElementById('exchangeCompleteModal').style.display='none'; });
    if (completeImgBtn && completeImgFile) {
        completeImgBtn.addEventListener('click', () => completeImgFile.click());
        completeImgFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                this._completeImgData = ev.target.result;
                const preview = document.getElementById('exCompleteImgPreview');
                const imgEl   = document.getElementById('exCompleteImgEl');
                if (preview) preview.style.display = 'block';
                if (imgEl) imgEl.src = ev.target.result;
                document.getElementById('exCompleteImgName').textContent = file.name;
            };
            reader.readAsDataURL(file);
        });
    }
    if (completeConfirm) completeConfirm.addEventListener('click', () => {
        const note = document.getElementById('exCompleteNote')?.value.trim();
        this.storage.updateExchangeItem(this.currentFriendCode, this._pendingCompleteTab, this._pendingCompleteId, {
            completed: true,
            completedAt: new Date().toISOString(),
            completedPhoto: this._completeImgData || '',
            completedNote: note
        });
        document.getElementById('exchangeCompleteModal').style.display = 'none';
        this._renderExchangeBody(this._pendingCompleteTab);
    });

    // 信件详情关闭
    document.getElementById('letterDetailClose')?.addEventListener('click', () => {
        document.getElementById('letterDetailModal').style.display = 'none';
    });
    document.getElementById('letterDetailDelete')?.addEventListener('click', () => {
        if (!this._currentLetterData) return;
        if (!confirm('确定删除这封信吗？')) return;
        this.storage.deleteExchangeItem(this.currentFriendCode, 'letters', this._currentLetterData.id);
        document.getElementById('letterDetailModal').style.display = 'none';
        this._renderExchangeBody('letters');
    });
};

ChatInterface.prototype._openExchangeAddModal = function() {
    const modal = document.getElementById('exchangeAddModal');
    if (!modal) return;
    modal.style.display = 'flex';
    const tab = this._exCurrentTab;
    const titleMap = { todos:'待做的事', funds:'亲密基金', shopping:'网购', delivery:'外卖', letters:'我们的信' };
    const titleEl = document.getElementById('exchangeAddModalTitle');
    if (titleEl) titleEl.textContent = `添加 · ${titleMap[tab]}`;

    const body = document.getElementById('exchangeAddBody');
    if (!body) return;
    const friendName = this.currentFriend?.nickname || this.currentFriend?.name || 'TA';

    let formHTML = '';
    if (tab === 'todos') {
        formHTML = `
            <div class="form-row"><label>事项内容</label><textarea id="exAddContent" placeholder="写下要做的事…" rows="3"></textarea></div>
            <div class="form-row"><label>由谁完成</label>
                <div class="radio-group">
                    <label class="radio-item"><input type="radio" name="exTodoAssign" value="user" checked> 我</label>
                    <label class="radio-item"><input type="radio" name="exTodoAssign" value="ai"> ${friendName}</label>
                    <label class="radio-item"><input type="radio" name="exTodoAssign" value="both"> 双方</label>
                </div>
            </div>`;
    } else if (tab === 'funds') {
        formHTML = `
            <div class="form-row"><label>金额（元）</label><input type="number" id="exAddAmount" placeholder="0.00" min="0" step="0.01"></div>
            <div class="form-row"><label>来自</label>
                <div class="radio-group">
                    <label class="radio-item"><input type="radio" name="exFundFrom" value="user" checked> 我</label>
                    <label class="radio-item"><input type="radio" name="exFundFrom" value="ai"> ${friendName}</label>
                </div>
            </div>
            <div class="form-row"><label>备注（可选）</label><input type="text" id="exAddNote" placeholder="存入原因…"></div>`;
    } else if (tab === 'shopping' || tab === 'delivery') {
        formHTML = `
            <div class="form-row"><label>物品名称</label><input type="text" id="exAddName" placeholder="${tab==='delivery'?'比如：奶茶一杯':'比如：毛绒玩具'}"></div>
            <div class="form-row"><label>图片（可选）</label>
                <div class="upload-row">
                    <button class="upload-btn" id="exAddImgBtn">选择图片</button>
                    <input type="file" id="exAddImgFile" accept="image/*" style="display:none;">
                    <span id="exAddImgName" class="upload-hint">未选择</span>
                </div>
            </div>
            <div class="form-row"><label>送给</label>
                <div class="radio-group">
                    <label class="radio-item"><input type="radio" name="exItemTo" value="ai" checked> ${friendName}</label>
                    <label class="radio-item"><input type="radio" name="exItemTo" value="user"> 我</label>
                </div>
            </div>
            <div class="form-row"><label>备注（可选）</label><input type="text" id="exAddNote2" placeholder="附言…"></div>`;
    } else if (tab === 'letters') {
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        formHTML = `
            <div class="form-row"><label>来自</label>
                <div class="radio-group">
                    <label class="radio-item"><input type="radio" name="exLetterFrom" value="user" checked> 我</label>
                    <label class="radio-item"><input type="radio" name="exLetterFrom" value="ai"> ${friendName}</label>
                </div>
            </div>
            <div class="form-row"><label>致</label>
                <div class="radio-group">
                    <label class="radio-item"><input type="radio" name="exLetterTo" value="ai" checked> ${friendName}</label>
                    <label class="radio-item"><input type="radio" name="exLetterTo" value="user"> 我</label>
                    <label class="radio-item"><input type="radio" name="exLetterTo" value="future_user"> 未来的我</label>
                    <label class="radio-item"><input type="radio" name="exLetterTo" value="future_ai"> 未来的${friendName}</label>
                </div>
            </div>
            <div class="form-row"><label>信件内容</label><textarea id="exLetterContent" placeholder="写下你想说的话…" rows="6"></textarea></div>
            <div class="form-row"><label>发送时间</label><input type="datetime-local" id="exLetterSendTime"></div>
            <div class="form-row"><label>对方可读取时间</label><input type="datetime-local" id="exLetterReceiveTime"></div>`;
    }

    formHTML += `<div class="modal-actions">
        <button class="modal-btn-cancel" id="exAddCancel">取消</button>
        <button class="modal-btn-confirm" id="exAddConfirm">添加</button>
    </div>`;
    body.innerHTML = formHTML;

    // 绑定图片上传
    let _exAddImg = null;
    const exImgBtn  = document.getElementById('exAddImgBtn');
    const exImgFile = document.getElementById('exAddImgFile');
    if (exImgBtn && exImgFile) {
        exImgBtn.addEventListener('click', () => exImgFile.click());
        exImgFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                _exAddImg = ev.target.result;
                document.getElementById('exAddImgName').textContent = file.name;
            };
            reader.readAsDataURL(file);
        });
    }

    document.getElementById('exAddCancel')?.addEventListener('click', () => { modal.style.display='none'; });
    document.getElementById('exAddConfirm')?.addEventListener('click', () => {
        let item = {};
        if (tab === 'todos') {
            const content = document.getElementById('exAddContent')?.value.trim();
            if (!content) { alert('❌ 请输入事项内容'); return; }
            item = { content, assignedTo: document.querySelector('input[name="exTodoAssign"]:checked')?.value || 'both' };
        } else if (tab === 'funds') {
            const amount = parseFloat(document.getElementById('exAddAmount')?.value);
            if (!amount || amount <= 0) { alert('❌ 请输入有效金额'); return; }
            item = { amount, from: document.querySelector('input[name="exFundFrom"]:checked')?.value || 'user', note: document.getElementById('exAddNote')?.value.trim() };
        } else if (tab === 'shopping' || tab === 'delivery') {
            const name = document.getElementById('exAddName')?.value.trim();
            if (!name) { alert('❌ 请输入物品名称'); return; }
            item = { name, imageSrc: _exAddImg || '', to: document.querySelector('input[name="exItemTo"]:checked')?.value || 'ai', note: document.getElementById('exAddNote2')?.value.trim(), from: 'user' };
        } else if (tab === 'letters') {
            const content = document.getElementById('exLetterContent')?.value.trim();
            if (!content) { alert('❌ 请写下信件内容'); return; }
            const sendTime    = document.getElementById('exLetterSendTime')?.value || new Date().toISOString();
            const receiveTime = document.getElementById('exLetterReceiveTime')?.value || new Date().toISOString();
            item = { content, from: document.querySelector('input[name="exLetterFrom"]:checked')?.value || 'user', to: document.querySelector('input[name="exLetterTo"]:checked')?.value || 'ai', sendTime, receiveTime };
        }
        this.storage.addExchangeItem(this.currentFriendCode, tab, item);
        modal.style.display = 'none';
        this._renderExchangeBody(tab);
    });
};


// ================================================================
//  MODULE 5 — 岁月胶囊
// ================================================================

ChatInterface.prototype.openTimeCapsulePage = function() {
    const page = document.getElementById('timeCapsulePage');
    if (!page) return;
    page.style.display = 'flex';
    if (!this._capsuleEventsB) { this._bindCapsuleEvents(); this._capsuleEventsB = true; }
    this._renderCapsuleList();
};

ChatInterface.prototype.closeTimeCapsulePage = function() {
    const p = document.getElementById('timeCapsulePage');
    if (p) p.style.display = 'none';
};

ChatInterface.prototype._renderCapsuleList = function() {
    const body = document.getElementById('capsuleBody');
    if (!body) return;
    const capsules = this.storage.getTimeCapsules(this.currentFriendCode);

    if (capsules.length === 0) {
        body.innerHTML = `<div class="capsule-empty">
            <div class="capsule-empty-icon">📅</div>
            <div class="capsule-empty-text">还没有生成报告<br>点击右上角「生成报告」开始记录</div>
        </div>`;
        return;
    }

    body.innerHTML = '<div class="capsule-list"></div>';
    const list = body.querySelector('.capsule-list');
    capsules.forEach(c => {
        const card = document.createElement('div');
        card.className = 'capsule-card';
        const typeLabel = { weekly:'周报 📅', monthly:'月报 📆', annual:'年报 📚' }[c.type] || '报告';
        const totalMsgs = c.stats?.totalMessages || 0;
        const days = c.stats?.totalDays || 0;
        const coverImg = c.coverImgs?.[0] || '';
        card.innerHTML = `
            <div class="capsule-card-cover">
                ${coverImg ? `<img src="${coverImg}">` : { weekly:'📅', monthly:'🌙', annual:'⭐' }[c.type] || '📚'}
                <div class="capsule-card-type-badge">${typeLabel}</div>
            </div>
            <div class="capsule-card-body">
                <div class="capsule-card-title">${this._esc(c.title)}</div>
                <div class="capsule-card-stats">
                    <span class="capsule-card-stat">💬 ${totalMsgs} 条消息</span>
                    <span class="capsule-card-stat">📆 ${days} 天相处</span>
                    <span class="capsule-card-stat">🕐 ${new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
            </div>`;
        card.addEventListener('click', () => this._openCapsuleDetail(c.id));
        list.appendChild(card);
    });
};

ChatInterface.prototype._openCapsuleDetail = function(capsuleId) {
    const page = document.getElementById('capsuleDetailPage');
    if (!page) return;
    const capsule = this.storage.getTimeCapsules(this.currentFriendCode).find(c => c.id === capsuleId);
    if (!capsule) return;
    this._currentCapsuleId = capsuleId;
    page.style.display = 'flex';

    if (!this._capsuleDetailEventsB) { this._bindCapsuleDetailEvents(); this._capsuleDetailEventsB = true; }

    document.getElementById('capsuleDetailTitle').textContent = capsule.title || '报告详情';
    this._renderCapsuleDetailBody(capsule);
};

ChatInterface.prototype._renderCapsuleDetailBody = function(capsule) {
    const body = document.getElementById('capsuleDetailBody');
    if (!body) return;
    const s = capsule.stats || {};
    const friendName = this.currentFriend?.nickname || this.currentFriend?.name || 'TA';
    const coverImg = capsule.coverImgs?.[0] || '';

    const heatmapHTML = this._buildHeatmap(capsule);
    const timelineHTML = (capsule.unlockEvents || []).map(ev =>
        `<div class="capsule-tl-item"><div class="capsule-tl-dot"></div><div class="capsule-tl-text">${this._esc(ev)}</div></div>`
    ).join('') || '<div style="color:#555;font-size:13px;">本期无新解锁事件</div>';

    body.innerHTML = `
        <div class="capsule-detail-cover">
            ${coverImg ? `<img src="${coverImg}">` : ({ weekly:'📅', monthly:'🌙', annual:'⭐' }[capsule.type] || '📚')}
            <button class="capsule-detail-cover-edit" id="capsuleEditCoverBtn">更换封面</button>
        </div>

        <div class="capsule-section">
            <div class="capsule-section-title">📊 数据总览</div>
            <div class="capsule-stats-grid">
                <div class="capsule-stat-card"><div class="capsule-stat-value">${s.totalMessages || 0}</div><div class="capsule-stat-label">消息总数</div></div>
                <div class="capsule-stat-card"><div class="capsule-stat-value">${s.totalDays || 0}</div><div class="capsule-stat-label">相识天数</div></div>
                <div class="capsule-stat-card"><div class="capsule-stat-value">${s.morningCount || 0}</div><div class="capsule-stat-label">早安打卡</div></div>
                <div class="capsule-stat-card"><div class="capsule-stat-value">${s.nightCount || 0}</div><div class="capsule-stat-label">晚安打卡</div></div>
                <div class="capsule-stat-card"><div class="capsule-stat-value">${s.nightChatCount || 0}</div><div class="capsule-stat-label">熬夜修仙</div></div>
                <div class="capsule-stat-card"><div class="capsule-stat-value">${s.totalTokens || 0}</div><div class="capsule-stat-label">消耗 Token</div></div>
            </div>
        </div>

        <div class="capsule-section">
            <div class="capsule-section-title">🗓️ 聊天热力图</div>
            <div class="capsule-heatmap">${heatmapHTML}</div>
        </div>

        <div class="capsule-section">
            <div class="capsule-section-title">🌟 本期解锁事件</div>
            <div class="capsule-timeline-list">${timelineHTML}</div>
        </div>

        ${capsule.aiEvaluation ? `
        <div class="capsule-section">
            <div class="capsule-section-title">💬 系统评语</div>
            <div style="font-size:13px;color:#ccc;line-height:1.8;background:rgba(255,255,255,0.03);border-radius:10px;padding:12px;">${this._esc(capsule.aiEvaluation)}</div>
        </div>` : ''}

        <div class="capsule-section">
            <div class="capsule-section-title">🌸 ${friendName} 的寄语</div>
            <div class="capsule-liuyan-wrap">
                <div class="capsule-liuyan-text" id="capsuleAiMsg">${this._esc(capsule.aiMessage || '（尚未生成）')}</div>
            </div>
            <button class="capsule-liuyan-save" id="capsuleGenAiMsgBtn">生成 TA 的寄语</button>
        </div>

        <div class="capsule-section">
            <div class="capsule-section-title">✍️ 我的寄语</div>
            <textarea class="capsule-liuyan-input" id="capsuleUserMsg" placeholder="写下你对这段时光的感受…">${this._esc(capsule.userMessage || '')}</textarea>
            <button class="capsule-liuyan-save" id="capsuleSaveUserMsgBtn">保存我的寄语</button>
        </div>

        <div class="capsule-section">
            <div class="capsule-section-title">📝 备注</div>
            <textarea class="capsule-notes-input" id="capsuleNotes" placeholder="可以写下任何想补充的话…">${this._esc(capsule.notes || '')}</textarea>
            <button class="capsule-notes-save" id="capsuleSaveNotesBtn">保存备注</button>
        </div>`;

    // 绑定封面更换
    document.getElementById('capsuleEditCoverBtn')?.addEventListener('click', () => {
        document.getElementById('capsuleCoverModal').style.display = 'flex';
        this._renderCapsuleCoverGrid(capsule);
    });

    // 生成AI寄语
    document.getElementById('capsuleGenAiMsgBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('capsuleGenAiMsgBtn');
        if (btn) { btn.disabled = true; btn.textContent = '生成中…'; }
        const msg = await this._generateAiLiuyan('capsule');
        this.storage.updateTimeCapsule(this.currentFriendCode, this._currentCapsuleId, { aiMessage: msg });
        const el = document.getElementById('capsuleAiMsg');
        if (el) el.textContent = msg;
        if (btn) { btn.disabled = false; btn.textContent = '重新生成'; }
    });

    // 保存用户寄语
    document.getElementById('capsuleSaveUserMsgBtn')?.addEventListener('click', () => {
        const text = document.getElementById('capsuleUserMsg')?.value.trim();
        this.storage.updateTimeCapsule(this.currentFriendCode, this._currentCapsuleId, { userMessage: text });
        alert('✅ 寄语已保存！');
    });

    // 保存备注
    document.getElementById('capsuleSaveNotesBtn')?.addEventListener('click', () => {
        const notes = document.getElementById('capsuleNotes')?.value.trim();
        this.storage.updateTimeCapsule(this.currentFriendCode, this._currentCapsuleId, { notes });
        alert('✅ 备注已保存！');
    });
};

ChatInterface.prototype._buildHeatmap = function(capsule) {
    if (!capsule.heatmapData || Object.keys(capsule.heatmapData).length === 0) {
        return '<div style="color:#555;font-size:13px;">暂无热力图数据</div>';
    }
    const counts = Object.values(capsule.heatmapData);
    const max = Math.max(...counts, 1);
    let html = '<div class="heatmap-grid">';
    Object.entries(capsule.heatmapData).forEach(([date, count]) => {
        const level = Math.ceil((count / max) * 4);
        html += `<div class="heatmap-day l${level}" title="${date}: ${count}条"></div>`;
    });
    html += '</div>';
    return html;
};

ChatInterface.prototype._renderCapsuleCoverGrid = function(capsule) {
    const grid = document.getElementById('capsuleCoverGrid');
    if (!grid) return;
    const imgs = capsule.coverImgs || [];
    grid.innerHTML = '';
    imgs.forEach((src, idx) => {
        const div = document.createElement('div');
        div.className = 'capsule-cover-img-item' + (idx === 0 ? ' selected' : '');
        div.innerHTML = `<img src="${src}"><div class="capsule-cover-img-del" data-idx="${idx}">×</div>`;
        div.addEventListener('click', (e) => {
            if (e.target.classList.contains('capsule-cover-img-del')) {
                const i = parseInt(e.target.getAttribute('data-idx'));
                imgs.splice(i, 1);
                this.storage.updateTimeCapsule(this.currentFriendCode, this._currentCapsuleId, { coverImgs: imgs });
                this._renderCapsuleCoverGrid({ ...capsule, coverImgs: imgs });
                return;
            }
            document.querySelectorAll('.capsule-cover-img-item').forEach(d => d.classList.remove('selected'));
            div.classList.add('selected');
            const newImgs = [src, ...imgs.filter((_, i) => i !== idx)];
            this.storage.updateTimeCapsule(this.currentFriendCode, this._currentCapsuleId, { coverImgs: newImgs });
        });
        grid.appendChild(div);
    });
};

ChatInterface.prototype._bindCapsuleEvents = function() {
    const backBtn = document.getElementById('capsuleBackBtn');
    if (backBtn) backBtn.addEventListener('click', () => this.closeTimeCapsulePage());

    const genBtn = document.getElementById('capsuleGenBtn');
    if (genBtn) genBtn.addEventListener('click', () => {
        document.getElementById('capsuleGenModal').style.display = 'flex';
    });

    // 生成弹窗
    document.getElementById('capsuleGenClose')?.addEventListener('click',  () => { document.getElementById('capsuleGenModal').style.display='none'; });
    document.getElementById('capsuleGenCancel')?.addEventListener('click', () => { document.getElementById('capsuleGenModal').style.display='none'; });
    document.getElementById('capsuleGenConfirm')?.addEventListener('click',() => this._doGenerateCapsule());

    // 封面弹窗
    const coverClose = document.getElementById('capsuleCoverClose');
    const coverCancel= document.getElementById('capsuleCoverCancel');
    const coverConfirm=document.getElementById('capsuleCoverConfirm');
    const coverUploadBtn = document.getElementById('capsuleCoverUploadBtn');
    const coverUploadFile= document.getElementById('capsuleCoverUploadFile');

    if (coverClose)  coverClose.addEventListener('click',  () => { document.getElementById('capsuleCoverModal').style.display='none'; });
    if (coverCancel) coverCancel.addEventListener('click', () => { document.getElementById('capsuleCoverModal').style.display='none'; });
    if (coverConfirm)coverConfirm.addEventListener('click',() => { document.getElementById('capsuleCoverModal').style.display='none'; this._renderCapsuleDetailBody(this.storage.getTimeCapsules(this.currentFriendCode).find(c=>c.id===this._currentCapsuleId)); });

    if (coverUploadBtn && coverUploadFile) {
        coverUploadBtn.addEventListener('click', () => coverUploadFile.click());
        coverUploadFile.addEventListener('change', (e) => {
            const files = [...e.target.files];
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const capsule = this.storage.getTimeCapsules(this.currentFriendCode).find(c=>c.id===this._currentCapsuleId);
                    if (!capsule) return;
                    const imgs = [...(capsule.coverImgs||[]), ev.target.result];
                    this.storage.updateTimeCapsule(this.currentFriendCode, this._currentCapsuleId, { coverImgs: imgs });
                    this._renderCapsuleCoverGrid({ ...capsule, coverImgs: imgs });
                };
                reader.readAsDataURL(file);
            });
        });
    }
};

ChatInterface.prototype._bindCapsuleDetailEvents = function() {
    const backBtn = document.getElementById('capsuleDetailBackBtn');
    if (backBtn) backBtn.addEventListener('click', () => {
        document.getElementById('capsuleDetailPage').style.display = 'none';
        this._renderCapsuleList();
    });
};

ChatInterface.prototype._doGenerateCapsule = function() {
    const type = document.querySelector('input[name="capsuleType"]:checked')?.value || 'monthly';
    document.getElementById('capsuleGenModal').style.display = 'none';
    this._generateCapsuleReport(type);
};

ChatInterface.prototype._generateCapsuleReport = async function(type) {
    const body = document.getElementById('capsuleBody');
    if (body) body.innerHTML = '<div class="capsule-generating"><span class="capsule-generating-spin">⏳</span>正在生成报告，请稍候…</div>';

    try {
        const msgs = this.messages;
        const now = new Date();
        const friendName = this.currentFriend?.nickname || this.currentFriend?.name || 'TA';

        // 统计数据
        const startDate = this._getCapsuleStartDate(type, now);
        const periodMsgs = msgs.filter(m => new Date(m.timestamp) >= startDate);

        const heatmap = {};
        let morningCount = 0, nightCount = 0, nightChatCount = 0;
        const morningRe = /早安|早上好/; const nightRe = /晚安/;

        periodMsgs.forEach(m => {
            const date = m.timestamp.slice(0, 10);
            heatmap[date] = (heatmap[date] || 0) + 1;
            const h = new Date(m.timestamp).getHours();
            if (morningRe.test(m.text)) morningCount++;
            if (nightRe.test(m.text)) nightCount++;
            if (h >= 0 && h < 5) nightChatCount++;
        });

        const firstMsgDate = msgs.length > 0 ? new Date(msgs[0].timestamp) : now;
        const totalDays = Math.floor((now - firstMsgDate) / 86400000) + 1;

        const chat = this.storage.getChatByFriendCode(this.currentFriendCode);
        const totalTokens = chat?.tokenStats?.total || 0;

        // 收集本期解锁事件
        const starTrail = this.storage.getStarTrailEvents(this.currentFriendCode);
        const periodEvents = starTrail
            .filter(e => new Date(e.date) >= startDate)
            .map(e => `${e.date} · ${e.title}`);

        const stats = {
            totalMessages: periodMsgs.length,
            totalDays,
            morningCount,
            nightCount,
            nightChatCount,
            totalTokens
        };

        // 生成 AI 评语
        const evalPrompt = `你是 ${friendName}。请为这段时间（${startDate.toLocaleDateString()} 至 ${now.toLocaleDateString()}）的相处写一段简短的"系统评语"，要有温度、有趣、符合你的性格，50-100字。数据参考：消息 ${stats.totalMessages} 条，熬夜聊天 ${nightChatCount} 次，早安 ${morningCount} 次，晚安 ${nightCount} 次。直接写评语内容，不要有引导语。`;
        let aiEvaluation = '';
        try {
            const evalResult = await this.apiManager.callAI([{ type:'user', text:'请写系统评语' }], evalPrompt);
            if (evalResult.success) aiEvaluation = evalResult.text.trim();
        } catch(e) { /* 静默 */ }

        // 标题
        const titleMap = {
            weekly:  `${now.getFullYear()}年第${this._getWeekNumber(now)}周 · 周报`,
            monthly: `${now.getFullYear()}年${now.getMonth()+1}月 · 月报`,
            annual:  `${now.getFullYear()}年 · 年报`
        };

        const capsuleId = this.storage.addTimeCapsule(this.currentFriendCode, {
            type, title: titleMap[type] || '报告',
            stats, heatmapData: heatmap,
            unlockEvents: periodEvents,
            aiEvaluation,
            aiMessage: '', userMessage: '', notes: '',
            coverImgs: []
        });

        this._addStarTrailEvent('capsule_gen', `生成${titleMap[type]}`, capsuleId);
        this._renderCapsuleList();

        setTimeout(() => {
            if (capsuleId) this._openCapsuleDetail(capsuleId);
        }, 300);

    } catch(e) {
        console.error('岁月胶囊生成失败:', e);
        this._renderCapsuleList();
        alert('❌ 报告生成失败：' + e.message);
    }
};

ChatInterface.prototype._getCapsuleStartDate = function(type, now) {
    const d = new Date(now);
    if (type === 'weekly')  { d.setDate(d.getDate() - 7); }
    else if (type === 'monthly') { d.setMonth(d.getMonth() - 1); }
    else if (type === 'annual')  { d.setFullYear(d.getFullYear() - 1); }
    return d;
};

ChatInterface.prototype._getWeekNumber = function(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};


// ================================================================
//  星迹留痕 — Star Trail Timeline
// ================================================================

ChatInterface.prototype._renderStarTrailSection = function() {
    // 查找容器，附加到亲密面板内容区
    const existingSection = document.getElementById('starTrailSection');
    const intimacyContent = document.getElementById('intimacyContent');
    if (!intimacyContent) return;

    let section = existingSection;
    if (!section) {
        section = document.createElement('div');
        section.id = 'starTrailSection';
        section.className = 'star-trail-section';
        intimacyContent.appendChild(section);
    }

    const events = this.storage.getStarTrailEvents(this.currentFriendCode);

    if (events.length === 0) {
        section.innerHTML = `
            <div class="star-trail-title">✨ 星迹留痕</div>
            <div class="star-trail-empty">还没有任何记录<br>解锁徽章、点亮字符、确立关系后会在这里留下印迹</div>`;
        return;
    }

    const eventsHTML = events.map(ev => {
        const icon = { charm_draw:'🎴', charm_wear:'💍', charm_full:'⭐', badge_unlock:'🏅', relationship_bind:'💑', capsule_gen:'📅' }[ev.type] || '✨';
        return `
            <div class="star-trail-event" data-id="${ev.id}">
                <div class="star-trail-event-header">
                    <div class="star-trail-event-icon">${icon}</div>
                    <div class="star-trail-event-info">
                        <div class="star-trail-event-title">${this._esc(ev.title)}</div>
                        <div class="star-trail-event-date">${ev.date}</div>
                    </div>
                    <div class="star-trail-event-arrow">›</div>
                </div>
                <div class="star-trail-event-detail">
                    <div class="star-trail-liuyan-row">
                        <div class="star-trail-liuyan-label">我的寄语</div>
                        <div class="star-trail-liuyan-text">${this._esc(ev.userMessage) || '尚未留言'}</div>
                    </div>
                    <div class="star-trail-liuyan-row" style="margin-top:8px;">
                        <div class="star-trail-liuyan-label">TA 的寄语</div>
                        <div class="star-trail-liuyan-text">${this._esc(ev.aiMessage) || '尚未留言'}</div>
                    </div>
                    <button class="star-trail-liuyan-btn" data-id="${ev.id}">✏️ 写寄语</button>
                </div>
            </div>`;
    }).join('');

    section.innerHTML = `
        <div class="star-trail-title">✨ 星迹留痕</div>
        <div class="star-trail-list">${eventsHTML}</div>`;

    // 折叠展开
    section.querySelectorAll('.star-trail-event-header').forEach(header => {
        header.addEventListener('click', () => {
            const ev = header.closest('.star-trail-event');
            ev.classList.toggle('expanded');
        });
    });

    // 写寄语按钮
    section.querySelectorAll('.star-trail-liuyan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._openStarTrailMsgModal(btn.getAttribute('data-id'));
        });
    });
};

ChatInterface.prototype._openStarTrailMsgModal = function(eventId) {
    const modal = document.getElementById('starTrailMsgModal');
    if (!modal) return;
    const events = this.storage.getStarTrailEvents(this.currentFriendCode);
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;
    this._currentStarEventId = eventId;

    const userInput = document.getElementById('starMsgUserInput');
    if (userInput) userInput.value = ev.userMessage || '';
    const aiText = document.getElementById('starMsgAiText');
    if (aiText) aiText.textContent = ev.aiMessage || '（尚未生成）';

    modal.style.display = 'flex';
    if (!this._starMsgEventsB) {
        this._bindStarMsgEvents();
        this._starMsgEventsB = true;
    }
};

ChatInterface.prototype._bindStarMsgEvents = function() {
    const closeBtn  = document.getElementById('starMsgClose');
    const cancelBtn = document.getElementById('starMsgCancel');
    const saveBtn   = document.getElementById('starMsgSave');
    const genBtn    = document.getElementById('starMsgGenBtn');

    if (closeBtn)  closeBtn.addEventListener('click',  () => { document.getElementById('starTrailMsgModal').style.display='none'; });
    if (cancelBtn) cancelBtn.addEventListener('click', () => { document.getElementById('starTrailMsgModal').style.display='none'; });

    if (genBtn) genBtn.addEventListener('click', async () => {
        genBtn.disabled = true;
        genBtn.textContent = '生成中…';
        const msg = await this._generateAiLiuyan('star_trail');
        const el = document.getElementById('starMsgAiText');
        if (el) el.textContent = msg;
        genBtn.disabled = false;
        genBtn.textContent = '重新生成';
    });

    if (saveBtn) saveBtn.addEventListener('click', () => {
        if (!this._currentStarEventId) return;
        const userMsg = document.getElementById('starMsgUserInput')?.value.trim();
        const aiMsg   = document.getElementById('starMsgAiText')?.textContent;
        this.storage.updateStarTrailEvent(this.currentFriendCode, this._currentStarEventId, {
            userMessage: userMsg,
            aiMessage: aiMsg === '（尚未生成）' ? '' : aiMsg
        });
        document.getElementById('starTrailMsgModal').style.display = 'none';
        this._renderStarTrailSection();
        alert('✅ 寄语已保存！');
    });
};

ChatInterface.prototype._addStarTrailEvent = function(type, title, refId) {
    if (!this.currentFriendCode) return;
    this.storage.addStarTrailEvent(this.currentFriendCode, { type, title, refId: refId || '' });
};


// ================================================================
//  通用工具 — 留言触发 & AI 生成
// ================================================================

ChatInterface.prototype._triggerLiuyanModal = function(context, desc) {
    const modal = document.getElementById('liuyanModal');
    if (!modal) return;
    modal.style.display = 'flex';
    this._liuyanContext = context;

    document.getElementById('liuyanModalTitle').textContent = { charm:'🌟 字符点亮！', badge:'🏅 徽章解锁！', relationship:'💑 关系绑定！' }[context] || '🌟 特别时刻';
    document.getElementById('liuyanModalDesc').textContent = desc || '';

    const userInput = document.getElementById('liuyanModalInput');
    if (userInput) userInput.value = '';
    const aiDiv = document.getElementById('liuyanModalAi');
    if (aiDiv) aiDiv.style.display = 'none';

    if (!this._liuyanModalEventsB) {
        this._bindLiuyanModalEvents();
        this._liuyanModalEventsB = true;
    }

    // 自动生成 AI 留言
    this._generateAiLiuyan(context).then(msg => {
        const aiText = document.getElementById('liuyanModalAiText');
        if (aiText) aiText.textContent = msg;
        if (aiDiv) aiDiv.style.display = 'block';
    });
};

ChatInterface.prototype._bindLiuyanModalEvents = function() {
    const skipBtn = document.getElementById('liuyanModalSkip');
    const saveBtn = document.getElementById('liuyanModalSave');
    if (skipBtn) skipBtn.addEventListener('click', () => { document.getElementById('liuyanModal').style.display='none'; });
    if (saveBtn) saveBtn.addEventListener('click', () => {
        const text = document.getElementById('liuyanModalInput')?.value.trim();
        const aiText = document.getElementById('liuyanModalAiText')?.textContent;
        // 保存到星迹留痕最新事件
        const events = this.storage.getStarTrailEvents(this.currentFriendCode);
        if (events.length > 0) {
            this.storage.updateStarTrailEvent(this.currentFriendCode, events[0].id, {
                userMessage: text,
                aiMessage: aiText || ''
            });
        }
        document.getElementById('liuyanModal').style.display = 'none';
        alert('✅ 留言已保存！');
    });
};

ChatInterface.prototype._generateAiLiuyan = async function(context) {
    try {
        const friendName = this.currentFriend?.nickname || this.currentFriend?.name || 'TA';
        const persona = (this.currentFriend?.persona || '').slice(0, 200);
        const ctxDesc = { charm:'幸运字符点亮', badge:'亲密徽章解锁', relationship:'关系绑定', capsule:'岁月胶囊', star_trail:'特别时刻' }[context] || '特别时刻';
        const prompt = `你是 ${friendName}。${persona ? `你的人设：${persona}` : ''}\n\n在这个「${ctxDesc}」的特别时刻，请用第一人称，以你的性格风格写一句留言，给对方看。要有情感、有温度、有你的个人风格，30-60字，像私下的悄悄话。直接写留言内容，不要有任何引导语。`;
        const result = await this.apiManager.callAI([{ type:'user', text:'请为这个时刻写下留言。' }], prompt);
        return result.success ? result.text.trim() : '';
    } catch(e) { return ''; }
};

// 工具方法
ChatInterface.prototype._esc = function(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// ================================================================
//  钩子：loadIntimacyPanel 扩展 — 加载完亲密面板时渲染星迹留痕
// ================================================================

const _origLoadIntimacyPanel = ChatInterface.prototype.loadIntimacyPanel;
ChatInterface.prototype.loadIntimacyPanel = function() {
    _origLoadIntimacyPanel.call(this);
    // 延迟一帧，确保 DOM 已挂载
    setTimeout(() => this._renderStarTrailSection(), 0);
};

// ================================================================
//  钩子：incrementIntimacyRound 扩展 — 同时推进幸运字符进度
// ================================================================

const _origIncrement = ChatInterface.prototype.incrementIntimacyRound;
ChatInterface.prototype.incrementIntimacyRound = function() {
    _origIncrement.call(this);
    this._advanceLuckyCharProgress();
    // 每10轮检测一次徽章
    const data = this.storage.getIntimacyData(this.currentFriendCode);
    if ((data.totalRounds % 10) === 0) {
        this._checkAndUnlockBadges();
    }
};

console.log('✅ intimacy-modules.js 已加载');
