/* ============================================================
   亲密关系模块 JS v2 — 全量修正版
   js/chat/intimacy-modules.js
   ============================================================ */
ChatInterface.prototype._lcData = function() {
    return this.storage.getLuckyCharmData(this.currentFriendCode);
};
ChatInterface.prototype._lcSave = function(data) {
    return this.storage.saveLuckyCharmData(data, this.currentFriendCode);
};

// ================================================================
//  共用工具
// ================================================================

ChatInterface.prototype._esc = function(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// 模块背景存取
ChatInterface.prototype._getModuleBg = function(moduleKey) {
    return localStorage.getItem(`zero_phone_module_bg_${moduleKey}_${this.currentFriendCode}`) || '';
};
ChatInterface.prototype._setModuleBg = function(moduleKey, value) {
    if (value) localStorage.setItem(`zero_phone_module_bg_${moduleKey}_${this.currentFriendCode}`, value);
    else localStorage.removeItem(`zero_phone_module_bg_${moduleKey}_${this.currentFriendCode}`);
};

// 应用模块背景
ChatInterface.prototype._applyModuleBg = function(pageId, moduleKey) {
    const page = document.getElementById(pageId);
    if (!page) return;
    const bg = this._getModuleBg(moduleKey);
    if (bg) {
        page.style.backgroundImage = `url(${bg})`;
        page.style.backgroundSize = 'cover';
        page.style.backgroundPosition = 'center';
    } else {
        page.style.backgroundImage = '';
    }
};

// 打开模块背景选择器
ChatInterface.prototype._openModuleBgPicker = function(moduleKey, pageId) {
    const modal = document.getElementById('moduleBgPickerModal');
    if (!modal) return;
    this._bgPickerModuleKey = moduleKey;
    this._bgPickerPageId   = pageId;
    const urlInput = document.getElementById('moduleBgUrlInput');
    if (urlInput) urlInput.value = '';
    modal.style.display = 'flex';
    if (!this._moduleBgEventsB) { this._bindModuleBgEvents(); this._moduleBgEventsB = true; }
};

ChatInterface.prototype._bindModuleBgEvents = function() {
    const modal    = document.getElementById('moduleBgPickerModal');
    const close    = document.getElementById('moduleBgClose');
    const fileBtn  = document.getElementById('moduleBgFileBtn');
    const fileInput= document.getElementById('moduleBgFileInput');
    const urlApply = document.getElementById('moduleBgUrlApply');
    const clearBtn = document.getElementById('moduleBgClearBtn');

    if (close) close.addEventListener('click', () => { modal.style.display='none'; });
    if (fileBtn && fileInput) {
        fileBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            this._compressImage(file, 1200, 0.8, (dataUrl) => {
                this._setModuleBg(this._bgPickerModuleKey, dataUrl);
                this._applyModuleBg(this._bgPickerPageId, this._bgPickerModuleKey);
                modal.style.display = 'none';
            });
        });
    }
    if (urlApply) urlApply.addEventListener('click', () => {
        const url = document.getElementById('moduleBgUrlInput')?.value.trim();
        if (!url) return;
        this._setModuleBg(this._bgPickerModuleKey, url);
        this._applyModuleBg(this._bgPickerPageId, this._bgPickerModuleKey);
        modal.style.display = 'none';
    });
    if (clearBtn) clearBtn.addEventListener('click', () => {
        this._setModuleBg(this._bgPickerModuleKey, '');
        this._applyModuleBg(this._bgPickerPageId, this._bgPickerModuleKey);
        modal.style.display = 'none';
    });
};

// 图片压缩
ChatInterface.prototype._compressImage = function(file, maxW, quality, cb) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const ratio = Math.min(1, maxW / img.width);
            const canvas = document.createElement('canvas');
            canvas.width  = img.width  * ratio;
            canvas.height = img.height * ratio;
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            cb(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

// 静默AI留言生成
ChatInterface.prototype._generateAiLiuyan = async function(context, extraHint) {
    try {
        const friendName = this.currentFriend?.nickname || this.currentFriend?.name || 'TA';
        const persona = (this.currentFriend?.persona || '').slice(0, 200);
        const ctxDesc = { charm:'幸运字符完全点亮', badge:'亲密徽章解锁', relationship:'关系绑定', capsule:'岁月胶囊报告', star_trail:'特别时刻' }[context] || '特别时刻';
        const prompt = `你是 ${friendName}。${persona ? `你的人设：${persona}` : ''}\n\n在「${ctxDesc}」这个特别时刻${extraHint ? ('，'+extraHint) : ''}，请用第一人称，以你的性格风格写一句留言，给对方看。要有情感、有温度、有你的个人风格，30-60字，像私下的悄悄话。直接写留言内容，不要有任何引导语。`;
        const result = await this.apiManager.callAI([{ type:'user', text:'请为这个时刻写下留言。' }], prompt);
        return result.success ? result.text.trim() : '';
    } catch(e) { return ''; }
};

// 添加星迹留痕事件
ChatInterface.prototype._addStarTrailEvent = function(type, title, refId) {
    if (!this.currentFriendCode) return;
    this.storage.addStarTrailEvent(this.currentFriendCode, { type, title, refId: refId || '' });
};

// 触发留言弹窗
ChatInterface.prototype._triggerLiuyanModal = function(context, desc, eventId) {
    const modal = document.getElementById('liuyanModal');
    if (!modal) return;
    modal.style.display = 'flex';
    this._liuyanContext = context;
    this._liuyanEventId = eventId;

    const titles = { charm:'🌟 字符点亮！', badge:'🏅 徽章解锁！', relationship:'💑 关系绑定！' };
    document.getElementById('liuyanModalTitle').textContent = titles[context] || '🌟 特别时刻';
    document.getElementById('liuyanModalDesc').textContent  = desc || '';

    const userInput = document.getElementById('liuyanModalInput');
    if (userInput) userInput.value = '';
    const aiDiv = document.getElementById('liuyanModalAi');
    if (aiDiv) aiDiv.style.display = 'none';

    if (!this._liuyanModalEventsB) {
        this._bindLiuyanModalEvents();
        this._liuyanModalEventsB = true;
    }

    // 静默生成AI留言
    this._generateAiLiuyan(context).then(msg => {
        if (!msg) return;
        const aiText = document.getElementById('liuyanModalAiText');
        if (aiText) aiText.textContent = msg;
        if (aiDiv) aiDiv.style.display = 'block';
        // 存到星迹事件
        if (this._liuyanEventId) {
            this.storage.updateStarTrailEvent(this.currentFriendCode, this._liuyanEventId, { aiMessage: msg });
        }
    });
};

ChatInterface.prototype._bindLiuyanModalEvents = function() {
    document.getElementById('liuyanModalSkip')?.addEventListener('click', () => {
        document.getElementById('liuyanModal').style.display = 'none';
    });
    document.getElementById('liuyanModalSave')?.addEventListener('click', () => {
        const text = document.getElementById('liuyanModalInput')?.value.trim();
        const aiMsg = document.getElementById('liuyanModalAiText')?.textContent || '';
        if (this._liuyanEventId) {
            this.storage.updateStarTrailEvent(this.currentFriendCode, this._liuyanEventId, {
                userMessage: text,
                aiMessage: aiMsg
            });
        }
        document.getElementById('liuyanModal').style.display = 'none';
    });
};


// ================================================================
//  MODULE 1 — 幸运字符
// ================================================================

ChatInterface.prototype.openLuckyCharPage = function() {
    const page = document.getElementById('luckyCharPage');
    if (!page) return;
    page.style.display = 'flex';
    this._applyModuleBg('luckyCharPage', 'lucky_char');
    if (!this._lcEventsB) { this._bindLuckyCharEvents(); this._lcEventsB = true; }
    this._renderLuckyCharPage();
};
ChatInterface.prototype.closeLuckyCharPage = function() {
    document.getElementById('luckyCharPage').style.display = 'none';
};

ChatInterface.prototype._renderLuckyCharPage = function() {
    const data = this._lcData();
    const today = new Date().toISOString().slice(0, 10);
    const hist  = data.drawHistory[today] || { user: [], ai: [] };

    document.getElementById('lcDrawCountUser').textContent = `我：${hist.user.length}/3`;
    document.getElementById('lcDrawCountAi').textContent   = `TA：${hist.ai.length}/3`;

    const btn = document.getElementById('lcDrawBtn');
    if (btn) btn.disabled = hist.user.length >= 3;

    this._renderDrawRevealArea(data, hist);
    this._renderWearing(data);
    this._renderLcGrid(data);
};

// 6张翻牌区
ChatInterface.prototype._renderDrawRevealArea = function(data, hist) {
    const container = document.getElementById('lcDrawSlots');
    if (!container) return;
    const today = new Date().toISOString().slice(0, 10);

    // 如果今天还没有翻牌准备好
    if (!this._lcTodayCards || this._lcTodayCardsDate !== today) {
        this._prepareTodayCards(data, hist, today);
    }

    container.innerHTML = '';
    (this._lcTodayCards || []).forEach((card, idx) => {
        const div = document.createElement('div');
        div.className = 'lc-draw-slot' + (card.revealed ? ' filled' : ' face-down');
        if (!card.revealed && hist.user.length < 3) {
            div.style.cursor = 'pointer';
            div.addEventListener('click', () => this._revealCard(idx));
        }
        if (card.revealed && card.charm) {
            div.innerHTML = this._lcCharmImgHTML(card.charm, 40) + `<div class="lc-slot-name">${card.charm.name}</div>`;
        } else if (card.revealed && !card.charm) {
            div.innerHTML = `<span style="font-size:24px;">🌫️</span><div class="lc-slot-name">空</div>`;
        } else {
            div.innerHTML = `<div class="lc-card-back">?</div>`;
        }
        container.appendChild(div);
    });
};

ChatInterface.prototype._prepareTodayCards = function(data, hist, today) {
    this._lcTodayCardsDate = today;
    // 6张牌：随机从16张中选6，其中已经抽过的标为revealed
    const shuffled = [...data.charms].sort(() => Math.random() - 0.5).slice(0, 6);
    this._lcTodayCards = shuffled.map(charm => {
        const alreadyDrawn = hist.user.includes(charm.id);
        return { charm, revealed: alreadyDrawn };
    });
    // 若今日已抽次数 > 当前revealed数，补齐（页面刷新恢复）
};

ChatInterface.prototype._revealCard = function(idx) {
    const data = this._lcData();
    const today = new Date().toISOString().slice(0, 10);
    if (!data.drawHistory[today]) data.drawHistory[today] = { user: [], ai: [] };
    const hist = data.drawHistory[today];
    if (hist.user.length >= 3) return;
    if (!this._lcTodayCards || !this._lcTodayCards[idx]) return;

    const card = this._lcTodayCards[idx];
    if (card.revealed) return;
    card.revealed = true;

    // 35% 概率出字符，65% 概率空卡
    const gotCharm = Math.random() < 0.35;
    let pickedCharm = null;
    if (gotCharm) {
        // 从未抽到过的里面随机选一张，没有剩余则也算空
        const neverDrawn = data.charms.filter(c => !this._getAllDrawnByUser(data).includes(c.id));
        const pool = neverDrawn.length > 0 ? neverDrawn : data.charms;
        pickedCharm = pool[Math.floor(Math.random() * pool.length)];
        hist.user.push(pickedCharm.id);
        this._addStarTrailEvent('charm_draw', `抽到幸运字符「${pickedCharm.name}」`, pickedCharm.id);
    }
    card.charm = pickedCharm; // null = 空卡

    this._lcSave(data);

    // 翻牌动画
    const slots = document.getElementById('lcDrawSlots');
    const slot  = slots?.children[idx];
    if (slot) {
        slot.classList.add('flipping');
        setTimeout(() => {
            slot.classList.remove('flipping', 'face-down');
            slot.classList.add('filled');
            slot.innerHTML = pickedCharm
                ? this._lcCharmImgHTML(pickedCharm, 40) + `<div class="lc-slot-name">${pickedCharm.name}</div>`
                : `<span style="font-size:24px;">🌫️</span><div class="lc-slot-name">空</div>`;
        }, 300);
    }

    this._renderLuckyCharPage();
};


// AI自动抽牌（每次AI发消息时调用）
ChatInterface.prototype._aiDrawLuckyChar = function() {
    const data = this._lcData();
    const today = new Date().toISOString().slice(0, 10);
    if (!data.drawHistory[today]) data.drawHistory[today] = { user: [], ai: [] };
    const hist = data.drawHistory[today];
    if (hist.ai.length >= 3) return;

    // AI每次发消息有35%概率抽到字符
    const gotCharm = Math.random() < 0.35;
    if (!gotCharm) { hist.ai.push('_empty_'); this._lcSave(data); return; }

    const alreadyDrawn = new Set(
        Object.values(data.drawHistory).flatMap(h => h.ai || []).filter(id => id !== '_empty_')
    );
    const available = data.charms.filter(c => !alreadyDrawn.has(c.id));
    if (!available.length) return;

    const picked = available[Math.floor(Math.random() * available.length)];
    hist.ai.push(picked.id);

    // AI以一定概率（60%）自动佩戴刚抽到的或者已有的字符里随机一个
    if (Math.random() < 0.6) {
        const allAiDrawn = data.charms.filter(c => alreadyDrawn.has(c.id) || c.id === picked.id);
        if (allAiDrawn.length > 0) {
            const wearPick = allAiDrawn[Math.floor(Math.random() * allAiDrawn.length)];
            data.wearing.ai = wearPick.id;
        }
    }

    this._lcSave(data);
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
        // 若已满点亮，显示天数
        const litChars = data.litProgress[charmId] || 0;
        const total = charm.name.length;
        if (litChars >= total && total > 0) {
            const litSince = data.litSince?.[charmId];
            if (litSince) {
                const days = Math.floor((Date.now() - new Date(litSince)) / 86400000);
                const badge = document.createElement('div');
                badge.className = 'lc-lit-days-badge';
                badge.textContent = `已点亮${days}天`;
                el.appendChild(badge);
            }
        }
    };
    renderSlot('lcWearingUser', data.wearing.user);
    renderSlot('lcWearingAi',   data.wearing.ai);
    const aiLabel = document.getElementById('lcWearingAiLabel');
    if (aiLabel) aiLabel.textContent = (this.currentFriend?.nickname || this.currentFriend?.name || 'TA') + '的';
};

ChatInterface.prototype._renderLcGrid = function(data) {
    const grid = document.getElementById('lcGrid');
    if (!grid) return;
    const today   = new Date().toISOString().slice(0, 10);
    const hist    = data.drawHistory[today] || { user: [], ai: [] };
    const drawnAll= this._getAllDrawnByUser(data);

    grid.innerHTML = '';
    data.charms.forEach(charm => {
        const litChars   = data.litProgress[charm.id] || 0;
        const total      = charm.name.length;
        const pct        = total > 0 ? litChars / total : 0;
        const litLevel   = Math.min(4, Math.floor(pct * 5));
        const wornByUser = data.wearing.user === charm.id;
        const wornByAi   = data.wearing.ai   === charm.id;
        const isDrawn    = drawnAll.includes(charm.id);
        const isFullyLit = litChars >= total && total > 0;

        const card = document.createElement('div');
        card.className = 'lc-card'+(isFullyLit?' fully-lit':'')+(wornByUser||wornByAi?' worn':'')+(isDrawn?'':' not-drawn');

        const charsHTML = charm.name.split('').map((ch, i) =>
            `<span class="lc-char-unit${i < litChars?' lit':''}">${ch}</span>`
        ).join('');

        let bottomInfo = '';
        if (isFullyLit && data.litSince?.[charm.id]) {
            const days = Math.floor((Date.now()-new Date(data.litSince[charm.id]))/86400000);
            bottomInfo = `<div class="lc-card-days">已点亮${days}天</div>`;
        } else if (isDrawn) {
            bottomInfo = `<div class="lc-card-chars">${charsHTML}</div>`;
        } else {
            bottomInfo = `<div class="lc-card-locked">未获得</div>`;
        }

        // 自定义字符的删除按钮
        const deleteBtn = !charm.isBuiltin
            ? `<div class="lc-card-delete-btn" data-id="${charm.id}" title="删除">×</div>`
            : '';

        card.innerHTML = `
            ${deleteBtn}
            <div class="lc-card-img-wrap">
                <div class="lc-card-img-inner lit-${litLevel}" style="filter:${isDrawn?'none':'grayscale(100%) brightness(0.2)'}">
                    ${this._lcCharmImgHTML(charm, 44)}
                </div>
                ${wornByUser?'<div class="lc-card-worn-badge">我</div>':''}
                ${wornByAi  ?'<div class="lc-card-worn-badge ai-worn">TA</div>':''}
            </div>
            <div class="lc-card-name">${charm.name}</div>
            ${bottomInfo}`;

        // 删除事件
        card.querySelector('.lc-card-delete-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!confirm(`确定要删除幸运字符「${charm.name}」吗？`)) return;
            data.charms = data.charms.filter(c => c.id !== charm.id);
            if (data.wearing.user === charm.id) data.wearing.user = null;
            if (data.wearing.ai   === charm.id) data.wearing.ai   = null;
            this._lcSave(data);
            this._renderLcGrid(this._lcData());
        });

        if (isDrawn) card.addEventListener('click', () => this._openLcDetail(charm.id));
        grid.appendChild(card);
    });
};


// 获取用户历史上所有抽到过的字符
ChatInterface.prototype._getAllDrawnByUser = function(data) {
    const all = new Set();
    Object.values(data.drawHistory || {}).forEach(hist => {
        (hist.user || []).forEach(id => all.add(id));
    });
    return [...all];
};

ChatInterface.prototype._lcCharmImgHTML = function(charm, size) {
    const s = size || 48;
    const src = charm.img || charm.imageSrc;
    if (src) {
        return `<img src="${src}" style="width:${s}px;height:${s}px;object-fit:contain;" alt="${charm.name}" onerror="this.style.display='none'">`;
    }
    const emojis = { beauty:'💄',cherish:'💝',destiny:'🌸',dreamland:'🌙',eternal:'♾️',exclusive:'👑',future:'🔮',guardian:'🛡️',happiness:'🌟','meet-you':'🤝',merriment:'🎉',mine:'🔒',only:'💎',sanctuary:'🏯',starlight:'⭐',treasure:'🎁' };
    return `<span style="font-size:${Math.floor(s*0.65)}px;line-height:1;">${emojis[charm.id] || '✨'}</span>`;
};

ChatInterface.prototype._openLcDetail = function(charmId) {
    const data  = this._lcData();
    const charm = data.charms.find(c => c.id === charmId);
    if (!charm) return;
    this._lcCurrentCharm = charmId;

    const modal = document.getElementById('luckyCharDetailModal');
    if (!modal) return;

    const litChars = data.litProgress[charmId] || 0;
    const total    = charm.name.length;
    const pct      = total > 0 ? Math.round((litChars / total) * 100) : 0;
    const isFullyLit = litChars >= total && total > 0;

    document.getElementById('lcDetailImg').innerHTML  = this._lcCharmImgHTML(charm, 90);
    document.getElementById('lcDetailName').textContent = charm.name;
    document.getElementById('lcDetailProgressFill').style.width = pct + '%';

    const charsHTML = charm.name.split('').map((ch, i) =>
        `<span class="lc-char-unit${i < litChars ? ' lit' : ''}">${ch}</span>`
    ).join('');
    document.getElementById('lcDetailChars').innerHTML = isFullyLit
        ? `<div class="lc-fully-lit-label">✨ 完全点亮</div>`
        : charsHTML;

    // 只控制用户自己那侧
    const wornByUser = data.wearing.user === charmId;
    const wornByAi   = data.wearing.ai   === charmId;

    const wearUserBtn = document.getElementById('lcDetailWearUser');
    const unwearBtn   = document.getElementById('lcDetailUnwear');
    const wearAiBtn   = document.getElementById('lcDetailWearAi');

    if (wearAiBtn)   wearAiBtn.style.display   = 'none'; // 永远隐藏，AI自己决定
    if (wearUserBtn) wearUserBtn.style.display  = wornByUser ? 'none' : '';
    if (unwearBtn) {
        // 只显示取下自己的那个
        unwearBtn.style.display  = wornByUser ? '' : 'none';
        unwearBtn.textContent    = '取下（我的）';
    }

    // 显示AI当前佩戴的字符名作为提示
    const aiWearing = data.wearing.ai ? data.charms.find(c=>c.id===data.wearing.ai) : null;
    const aiHintEl  = document.getElementById('lcDetailAiHint');
    const friendName = this.currentFriend?.nickname || this.currentFriend?.name || 'TA';
    if (aiHintEl) {
        aiHintEl.style.display = 'block';
        aiHintEl.textContent   = aiWearing
            ? `${friendName} 正在佩戴「${aiWearing.name}」`
            : `${friendName} 还没有佩戴字符`;
    }

    // 留言区
    const liuyanDiv = document.getElementById('lcDetailLiuyan');
    if (liuyanDiv) {
        liuyanDiv.style.display = isFullyLit ? 'block' : 'none';
        if (isFullyLit) {
            const saved = data['留言Pending']?.[charmId] || {};
            const userInput = document.getElementById('lcDetailLiuyanUser');
            const aiText    = document.getElementById('lcDetailLiuyanAiText');
            if (userInput) userInput.value = saved.user || '';
            if (aiText) aiText.textContent = saved.ai || '（TA的留言生成后会在这里显示）';
        }
    }

    modal.style.display = 'flex';
};


ChatInterface.prototype._bindLuckyCharEvents = function() {
    document.getElementById('luckyCharBackBtn')?.addEventListener('click', () => this.closeLuckyCharPage());
    document.getElementById('luckyCharUploadBtn')?.addEventListener('click', () => this._openLcUploadModal());
    document.getElementById('lcDrawBtn')?.addEventListener('click', () => {
        // 重新准备6张牌（下一轮）
        this._lcTodayCards = null;
        this._renderLuckyCharPage();
    });
    // 背景按钮
    document.getElementById('luckyCharBgBtn')?.addEventListener('click', () =>
        this._openModuleBgPicker('lucky_char', 'luckyCharPage'));

    // 详情弹窗
    document.getElementById('lcDetailClose')?.addEventListener('click', () => {
        document.getElementById('luckyCharDetailModal').style.display = 'none';
    });
    document.getElementById('lcDetailWearUser')?.addEventListener('click', () => {
        if (!this._lcCurrentCharm) return;
        const data = this._lcData();
        data.wearing.user = this._lcCurrentCharm;
        const charm = data.charms.find(c => c.id === this._lcCurrentCharm);
        this._addStarTrailEvent('charm_wear', `佩戴幸运字符「${charm?.name||''}」`, this._lcCurrentCharm);
        this._lcSave(data);
        document.getElementById('luckyCharDetailModal').style.display = 'none';
        this._renderLuckyCharPage();
    });
    document.getElementById('lcDetailWearAi')?.addEventListener('click', () => {
        if (!this._lcCurrentCharm) return;
        const data = this._lcData();
        data.wearing.ai = this._lcCurrentCharm;
        this._lcSave(data);
        document.getElementById('luckyCharDetailModal').style.display = 'none';
        this._renderLuckyCharPage();
    });
    document.getElementById('lcDetailUnwear')?.addEventListener('click', () => {
        if (!this._lcCurrentCharm) return;
        const data = this._lcData();
        if (data.wearing.user === this._lcCurrentCharm) data.wearing.user = null;
        if (data.wearing.ai   === this._lcCurrentCharm) data.wearing.ai   = null;
        this._lcSave(data);
        document.getElementById('luckyCharDetailModal').style.display = 'none';
        this._renderLuckyCharPage();
    });
    document.getElementById('lcDetailLiuyanSave')?.addEventListener('click', () => this._saveLcLiuyan());

    // 上传弹窗
    this._bindLcUploadEvents();
};

ChatInterface.prototype._saveLcLiuyan = function() {
    if (!this._lcCurrentCharm) return;
    const input = document.getElementById('lcDetailLiuyanUser');
    const text  = input?.value.trim();
    const data  = this._lcData();
    if (!data['留言Pending']) data['留言Pending'] = {};
    if (!data['留言Pending'][this._lcCurrentCharm]) data['留言Pending'][this._lcCurrentCharm] = {};
    data['留言Pending'][this._lcCurrentCharm].user = text;
    this._lcSave(data);
    alert('✅ 留言已保存！');
};

ChatInterface.prototype._openLcUploadModal = function() {
    document.getElementById('luckyCharUploadModal').style.display = 'flex';
};

ChatInterface.prototype._bindLcUploadEvents = function() {
    let _img = null;
    document.getElementById('lcUploadClose')?.addEventListener('click',  () => { document.getElementById('luckyCharUploadModal').style.display='none'; });
    document.getElementById('lcUploadCancel')?.addEventListener('click', () => { document.getElementById('luckyCharUploadModal').style.display='none'; });
    const imgBtn = document.getElementById('lcUploadImgBtn');
    const imgFile= document.getElementById('lcUploadImgFile');
    if (imgBtn && imgFile) {
        imgBtn.addEventListener('click', () => imgFile.click());
        imgFile.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            this._compressImage(file, 200, 0.9, (d) => { _img = d; document.getElementById('lcUploadImgName').textContent = file.name; });
        });
    }
    document.getElementById('lcUploadConfirm')?.addEventListener('click', () => {
        const name = document.getElementById('lcUploadName')?.value.trim();
        const url  = document.getElementById('lcUploadImgUrl')?.value.trim();
        const color= document.getElementById('lcUploadColor')?.value || '#ff6b9d';
        if (!name) { alert('❌ 请输入字符名称'); return; }
        const src = _img || url;
        if (!src) { alert('❌ 请上传图片或填写图片URL'); return; }
        const data = this._lcData();
        data.charms.push({ id:'custom_'+Date.now(), name, isBuiltin:false, img:src, litColor:color });
        this._lcSave(data);
        document.getElementById('luckyCharUploadModal').style.display = 'none';
        _img = null;
        this._renderLuckyCharPage();
    });
};

// 推进点亮进度（每次AI回复调用）
ChatInterface.prototype._advanceLuckyCharProgress = function() {
    const data = this._lcData();
    const wornUser = data.wearing.user;
    const wornAi   = data.wearing.ai;
    const today    = new Date().toISOString().slice(0, 10);
    if (!data.drawHistory[today]) data.drawHistory[today] = { user:[], ai:[] };
    let changed = false;

    const advance = (cid) => {
        if (!cid) return;
        const charm = data.charms.find(c => c.id === cid);
        if (!charm) return;
        const total = charm.name.length;
        const cur   = data.litProgress[cid] || 0;
        if (cur >= total) return; // 已满

        const rounds = this.storage.getIntimacyData(this.currentFriendCode)?.totalRounds || 0;
        const shouldBe = Math.min(total, Math.floor(rounds / 8));
        if (shouldBe > cur) {
            data.litProgress[cid] = shouldBe;
            changed = true;
            if (shouldBe >= total) {
                // 记录点亮日期
                if (!data.litSince) data.litSince = {};
                data.litSince[cid] = new Date().toISOString();
                // 触发留言
                const evId = this._addStarTrailEvent('charm_full', `幸运字符「${charm.name}」完全点亮`, cid);
                this._triggerLiuyanModal('charm', `幸运字符「${charm.name}」已完全点亮！`, evId);
                // 静默生成AI留言
                this._generateAiLiuyan('charm', `幸运字符「${charm.name}」完全点亮`).then(msg => {
                    if (msg) {
                        if (!data['留言Pending']) data['留言Pending'] = {};
                        if (!data['留言Pending'][cid]) data['留言Pending'][cid] = {};
                        data['留言Pending'][cid].ai = msg;
                        this._lcSave(data);
                    }
                });
            }
        }
    };

    advance(wornUser);
    if (wornAi !== wornUser) advance(wornAi);
    if (changed) this._lcSave(data);
};


// ================================================================
//  MODULE 2 — 关系绑定
// ================================================================

ChatInterface.prototype.openRelationshipPage = function() {
    const page = document.getElementById('relationshipPage');
    if (!page) return;
    page.style.display = 'flex';
    this._applyModuleBg('relationshipPage', 'relationship');
    if (!this._relEventsB) { this._bindRelEvents(); this._relEventsB = true; }
    this._renderRelPage();
};
ChatInterface.prototype.closeRelationshipPage = function() {
    document.getElementById('relationshipPage').style.display = 'none';
};

ChatInterface.prototype._renderRelPage = function() {
    const binding    = this.storage.getRelationshipBinding(this.currentFriendCode);
    const pending    = this._getRelPending();
    const friendName = this.currentFriend?.nickname || this.currentFriend?.name || 'TA';

    const unboundEl  = document.getElementById('relUnbound');
    const pendingEl  = document.getElementById('relPending');
    const boundEl    = document.getElementById('relBound');

    if (binding) {
        unboundEl.style.display  = 'none';
        pendingEl.style.display  = 'none';
        boundEl.style.display    = 'block';
        this._renderRelBound(binding, friendName);
    } else if (pending) {
        unboundEl.style.display  = 'none';
        pendingEl.style.display  = 'block';
        boundEl.style.display    = 'none';
        this._renderRelPending(pending, friendName);
    } else {
        unboundEl.style.display  = 'block';
        pendingEl.style.display  = 'none';
        boundEl.style.display    = 'none';
        this._renderRelTypeGrid();
    }
};

ChatInterface.prototype._getRelPending = function() {
    try {
        const d = localStorage.getItem(`zero_phone_rel_pending_${this.currentFriendCode}`);
        return d ? JSON.parse(d) : null;
    } catch(e) { return null; }
};
ChatInterface.prototype._setRelPending = function(data) {
    if (data) localStorage.setItem(`zero_phone_rel_pending_${this.currentFriendCode}`, JSON.stringify(data));
    else localStorage.removeItem(`zero_phone_rel_pending_${this.currentFriendCode}`);
};

ChatInterface.prototype._renderRelBound = function(binding, friendName) {
    const allTypes = [...this.storage.getRelationshipTypes(), ...this._getCustomRelTypes()];
    const type = allTypes.find(t => t.id === binding.typeId) || { name: binding.customName || '关系', img: null };
    const emojis = { bros:'🤜', couple:'💑', besties:'👯', partners:'🤝' };

    document.getElementById('relBoundIcon').innerHTML = type.img
        ? `<img src="${type.img}" style="width:80px;height:80px;object-fit:contain;">`
        : `<span style="font-size:56px;">${emojis[binding.typeId]||'💫'}</span>`;
    document.getElementById('relBoundName').textContent = type.name;
    const boundAt = new Date(binding.boundAt);
    document.getElementById('relBoundDate').textContent = `绑定于 ${boundAt.getFullYear()}年${boundAt.getMonth()+1}月${boundAt.getDate()}日`;
    const days = Math.floor((Date.now() - boundAt) / 86400000);
    document.getElementById('relBoundDays').textContent = `已在一起 ${days} 天 💕`;

    const liuyanUserEl = document.getElementById('relLiuyanUser');
    if (liuyanUserEl) liuyanUserEl.value = binding.liuyanUser || '';
    const liuyanAiEl = document.getElementById('relLiuyanAiText');
    if (liuyanAiEl) liuyanAiEl.textContent = binding.liuyanAi || `${friendName} 还没有留言`;
};

ChatInterface.prototype._renderRelPending = function(pending, friendName) {
    const allTypes = [...this.storage.getRelationshipTypes(), ...this._getCustomRelTypes()];
    const type = allTypes.find(t => t.id === pending.typeId) || { name: pending.customName || '关系', img: null };
    const emojis = { bros:'🤜', couple:'💑', besties:'👯', partners:'🤝' };
    const iconHTML = type.img
        ? `<img src="${type.img}" style="width:64px;height:64px;object-fit:contain;">`
        : `<span style="font-size:48px;">${emojis[type.id]||'💫'}</span>`;

    document.getElementById('relPendingIcon').innerHTML = iconHTML;
    document.getElementById('relPendingTypeName').textContent = type.name;
    document.getElementById('relPendingDesc').textContent = `邀请已发出，等待 ${friendName} 的回应…`;

    const preview = document.getElementById('relPendingCardPreview');
    if (preview && pending.inviteHtml) {
        preview.innerHTML = pending.inviteHtml; // 渲染邀请卡
    }
    // 没有"TA同意了"按钮，全靠 AI 回复自动判断
};


ChatInterface.prototype._renderRelTypeGrid = function() {
    const grid = document.getElementById('relTypeGrid');
    if (!grid) return;
    const builtins = this.storage.getRelationshipTypes();
    const customs  = this._getCustomRelTypes();
    const emojis   = { bros:'🤜', couple:'💑', besties:'👯', partners:'🤝' };
    grid.innerHTML  = '';

    [...builtins, ...customs].forEach(type => {
        const isCustom = !builtins.find(b=>b.id===type.id);
        const card = document.createElement('div');
        card.className = 'rel-type-card'+(this._selectedRelType===type.id?' active':'');

        card.innerHTML = `
            ${isCustom?`<div class="rel-type-delete-btn" data-id="${type.id}" title="删除">×</div>`:''}
            <div class="rel-type-img">${type.img?`<img src="${type.img}">`:emojis[type.id]||'💫'}</div>
            <div class="rel-type-name">${type.name}</div>`;

        // 删除事件
        card.querySelector('.rel-type-delete-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!confirm(`确定要删除关系类型「${type.name}」吗？`)) return;
            const updated = customs.filter(c=>c.id!==type.id);
            this._saveCustomRelTypes(updated);
            this._renderRelTypeGrid();
        });

        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('rel-type-delete-btn')) return;
            this._selectedRelType     = type.id;
            this._selectedRelTypeData = type;
            document.querySelectorAll('.rel-type-card').forEach(c=>c.classList.remove('active'));
            card.classList.add('active');
            const preview = document.getElementById('relSelectedPreview');
            if (preview) preview.style.display = 'block';
            document.getElementById('relSelectedImg').innerHTML   = type.img?`<img src="${type.img}">`:emojis[type.id]||'💫';
            document.getElementById('relSelectedName').textContent = type.name;
            const invBtn = document.getElementById('relInviteBtn');
            if (invBtn) invBtn.disabled = false;
        });
        grid.appendChild(card);
    });

    // 自定义加号
    const addCard = document.createElement('div');
    addCard.className = 'rel-type-card';
    addCard.innerHTML = `<div class="rel-type-img" style="font-size:32px;">＋</div><div class="rel-type-name">自定义</div>`;
    addCard.addEventListener('click', () => document.getElementById('relCustomModal').style.display='flex');
    grid.appendChild(addCard);
};


ChatInterface.prototype._getCustomRelTypes = function() {
    try { const d = localStorage.getItem(`zero_phone_rel_custom_${this.currentFriendCode}`); return d ? JSON.parse(d) : []; }
    catch(e) { return []; }
};
ChatInterface.prototype._saveCustomRelTypes = function(types) {
    localStorage.setItem(`zero_phone_rel_custom_${this.currentFriendCode}`, JSON.stringify(types));
};

ChatInterface.prototype._bindRelEvents = function() {
    document.getElementById('relBackBtn')?.addEventListener('click', () => this.closeRelationshipPage());
    document.getElementById('relBgBtn')?.addEventListener('click', () =>
        this._openModuleBgPicker('relationship', 'relationshipPage'));

    // 发送邀请
    document.getElementById('relInviteBtn')?.addEventListener('click', () => {
        if (!this._selectedRelType) { alert('请先选择关系类型'); return; }
        document.getElementById('relInviteModal').style.display = 'flex';
        this._selectedInviteTmpl = '1';
        this._renderInviteCard();
        this._populateInviteCodePanel();
    });

    // 邀请卡弹窗
    document.getElementById('relInviteClose')?.addEventListener('click',   () => { document.getElementById('relInviteModal').style.display='none'; });
    document.getElementById('relInviteCancel')?.addEventListener('click',  () => { document.getElementById('relInviteModal').style.display='none'; });
    document.getElementById('relInviteConfirm')?.addEventListener('click', () => this._sendRelInvite());

    // 模板切换
    document.querySelectorAll('.rel-invite-tmpl').forEach(t => {
        t.addEventListener('click', () => {
            document.querySelectorAll('.rel-invite-tmpl').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            this._selectedInviteTmpl = t.getAttribute('data-tmpl');
            if (this._selectedInviteTmpl === 'diy') {
                document.getElementById('relInviteDiySection').style.display = 'block';
                document.getElementById('relInviteCardPreview').style.display = 'none';
                document.getElementById('relInviteCodePanel').style.display  = 'none';
            } else {
                document.getElementById('relInviteDiySection').style.display = 'none';
                document.getElementById('relInviteCardPreview').style.display = 'block';
                this._renderInviteCard();
            }
        });
    });

    // 查看代码
    document.getElementById('relViewCodeBtn')?.addEventListener('click', () => {
        const panel = document.getElementById('relInviteCodePanel');
        if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    // DIY 预览
    document.getElementById('relDiyPreviewBtn')?.addEventListener('click', () => {
        const html = document.getElementById('relDiyHtmlInput')?.value;
        const preview = document.getElementById('relInviteCardPreview');
        if (preview && html) { preview.style.display='block'; preview.innerHTML = html; }
    });

    // 已绑定状态按钮
    document.getElementById('relUnbindBtn')?.addEventListener('click', () => {
        if (!confirm('确定要解除关系绑定吗？')) return;
        this.storage.clearRelationshipBinding(this.currentFriendCode);
        this._selectedRelType = null;
        this._renderRelPage();
    });
    document.getElementById('relSaveLiuyan')?.addEventListener('click', () => {
        const text = document.getElementById('relLiuyanUser')?.value.trim();
        const binding = this.storage.getRelationshipBinding(this.currentFriendCode);
        if (!binding) return;
        binding.liuyanUser = text;
        this.storage.setRelationshipBinding(this.currentFriendCode, binding);
        alert('✅ 留言已保存！');
    });
    document.getElementById('relGenAiMessage')?.addEventListener('click', async (e) => {
        e.target.disabled = true; e.target.textContent = '生成中…';
        const msg = await this._generateAiLiuyan('relationship');
        const binding = this.storage.getRelationshipBinding(this.currentFriendCode);
        if (binding) { binding.liuyanAi = msg; this.storage.setRelationshipBinding(this.currentFriendCode, binding); }
        document.getElementById('relLiuyanAiText').textContent = msg;
        e.target.disabled = false; e.target.textContent = '重新生成';
    });

    // 待确认状态按钮
    document.getElementById('relAgreeBtn')?.addEventListener('click', () => this._confirmRelBinding());
    document.getElementById('relCancelInviteBtn')?.addEventListener('click', () => {
        if (!confirm('确定要撤回邀请吗？')) return;
        this._setRelPending(null);
        this._selectedRelType = null;
        this._renderRelPage();
    });

    this._bindRelCustomEvents();
};

ChatInterface.prototype._renderInviteCard = function() {
    const preview = document.getElementById('relInviteCardPreview');
    if (!preview) return;
    const type = this._selectedRelTypeData;
    const friendName = this.currentFriend?.nickname || this.currentFriend?.name || 'TA';
    const emojis = { bros:'🤜', couple:'💑', besties:'👯', partners:'🤝' };
    const tmpl = this._selectedInviteTmpl || '1';
    const iconHTML = type?.img
        ? `<img src="${type.img}" style="width:64px;height:64px;object-fit:contain;">`
        : `<span style="font-size:48px;">${emojis[type?.id]||'💫'}</span>`;
    const taglines = {
        '1': `正式成为彼此的 ${type?.name||'挚友'}`,
        '2': `跨越次元的 ${type?.name||'羁绊'}，从此刻开始`,
        '3': `感谢你愿意成为我的 ${type?.name||'重要的人'}`
    };
    const cardHTML = `<div class="invite-card invite-card-${tmpl}">
        <div class="invite-card-icon">${iconHTML}</div>
        <div class="invite-card-title">${type?.name||'关系绑定'} 邀请</div>
        <div class="invite-card-names">「${friendName}」×「你」</div>
        <div class="invite-card-sub">${taglines[tmpl]||taglines['1']}</div>
    </div>`;
    preview.innerHTML = cardHTML;
    // 更新代码面板
    const codeEl = document.getElementById('relInviteCodeContent');
    if (codeEl) codeEl.textContent = cardHTML;
};

ChatInterface.prototype._populateInviteCodePanel = function() {
    // 初始渲染代码
    setTimeout(() => {
        const cardEl = document.getElementById('relInviteCardPreview');
        const codeEl = document.getElementById('relInviteCodeContent');
        if (cardEl && codeEl) codeEl.textContent = cardEl.innerHTML;
    }, 100);
};

ChatInterface.prototype._sendRelInvite = function() {
    if (!this._selectedRelType) return;

    let finalHtml = '';
    if (this._selectedInviteTmpl === 'diy') {
        finalHtml = document.getElementById('relDiyHtmlInput')?.value || '';
        if (!finalHtml.trim()) { alert('❌ 请先输入DIY的HTML内容'); return; }
    } else {
        finalHtml = document.getElementById('relInviteCardPreview')?.innerHTML || '';
    }

    const typeName = this._selectedRelTypeData?.name || this._selectedRelType;

    // 存 pending（邀请卡只在关系绑定页展示，不发到聊天框）
    this._setRelPending({
        typeId:     this._selectedRelType,
        customName: typeName,
        inviteHtml: finalHtml,
        invitedAt:  new Date().toISOString()
    });

    document.getElementById('relInviteModal').style.display = 'none';

    // 只发纯文字，AI 自己决定同意/拒绝
    const plainMsg = `我想和你成为「${typeName}」，你愿意吗？`;
    const inputField = document.getElementById('inputFieldInline') || document.getElementById('inputField');
    if (inputField) {
        inputField.value = plainMsg;
        const sendBtn = document.getElementById('userSendBtn') || document.getElementById('sendBtn');
        sendBtn?.click();
    }

    this._renderRelPage();
    this._relWatchActive = true;
};


/* 监听AI回复来判断同意/拒绝 */
ChatInterface.prototype._startWatchingRelResponse = function() {
    this._relWatchActive = true;
};

/* 在AI每次回复后调用这个检查（需要在 incrementIntimacyRound 钩子里调用） */
ChatInterface.prototype._checkRelResponseInAiMsg = function(aiText) {
    if (!this._relWatchActive) return;
    const pending = this._getRelPending();
    if (!pending) { this._relWatchActive = false; return; }

    const agreeWords  = /同意|好的|可以|愿意|接受|当然|没问题|好呀|好啊|嗯嗯|嗯！|🥰|💑|💍|❤/;
    const rejectWords = /拒绝|不行|不要|不愿意|不想|算了|不可以|不好|不同意|😤|🙅/;

    if (agreeWords.test(aiText)) {
        this._relWatchActive = false;
        this._confirmRelBindingFromAi();
    } else if (rejectWords.test(aiText)) {
        this._relWatchActive = false;
        this._setRelPending(null);
        this._selectedRelType = null;
        // 在亲密关系面板如果打开了刷新
        const page = document.getElementById('relationshipPage');
        if (page && page.style.display !== 'none') this._renderRelPage();
        // 发一个通知 toast
        this._showToast(`${this.currentFriend?.nickname||'TA'} 拒绝了你的关系绑定邀请`);
    }
};

ChatInterface.prototype._confirmRelBindingFromAi = function() {
    const pending = this._getRelPending();
    if (!pending) return;
    this.storage.setRelationshipBinding(this.currentFriendCode, {
        typeId:     pending.typeId,
        customName: pending.customName
    });
    this._setRelPending(null);
    const evId = this._addStarTrailEvent('relationship_bind', `确立关系「${pending.customName||pending.typeId}」`, pending.typeId);
    this._triggerLiuyanModal('relationship', `你们正式成为了「${pending.customName||'关系绑定'}」！`, evId);
    const page = document.getElementById('relationshipPage');
    if (page && page.style.display !== 'none') this._renderRelPage();
    this._showToast(`🎉 ${this.currentFriend?.nickname||'TA'} 同意了！关系已绑定`);
};

/* Toast 通知 */
ChatInterface.prototype._showToast = function(msg) {
    let toast = document.getElementById('intimacyToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'intimacyToast';
        toast.className = 'intimacy-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
};


ChatInterface.prototype._confirmRelBinding = function() {
    const pending = this._getRelPending();
    if (!pending) return;
    this.storage.setRelationshipBinding(this.currentFriendCode, {
        typeId:     pending.typeId,
        customName: pending.customName,
    });
    this._setRelPending(null);
    const evId = this._addStarTrailEvent('relationship_bind', `确立关系「${pending.customName||pending.typeId}」`, pending.typeId);
    this._triggerLiuyanModal('relationship', `你们正式成为了「${pending.customName||'关系绑定'}」！`, evId);
    this._renderRelPage();
};

ChatInterface.prototype._bindRelCustomEvents = function() {
    let _relCustomImg = null;
    document.getElementById('relCustomClose')?.addEventListener('click',  () => { document.getElementById('relCustomModal').style.display='none'; });
    document.getElementById('relCustomCancel')?.addEventListener('click', () => { document.getElementById('relCustomModal').style.display='none'; });
    const imgBtn = document.getElementById('relCustomImgBtn');
    const imgFile= document.getElementById('relCustomImgFile');
    if (imgBtn && imgFile) {
        imgBtn.addEventListener('click', () => imgFile.click());
        imgFile.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            this._compressImage(file, 200, 0.9, (d) => {
                _relCustomImg = d;
                document.getElementById('relCustomImgName').textContent = file.name;
            });
        });
    }
    document.getElementById('relCustomConfirm')?.addEventListener('click', () => {
        const name = document.getElementById('relCustomName')?.value.trim();
        if (!name) { alert('❌ 请输入关系名称'); return; }
        const customs = this._getCustomRelTypes();
        customs.push({ id:'custom_'+Date.now(), name, img:_relCustomImg||'' });
        this._saveCustomRelTypes(customs);
        document.getElementById('relCustomModal').style.display = 'none';
        _relCustomImg = null;
        this._renderRelTypeGrid();
    });
};


// ================================================================
//  MODULE 3 — 亲密徽章
// ================================================================

ChatInterface.prototype.openBadgePage = function() {
    const page = document.getElementById('badgePage');
    if (!page) return;
    page.style.display = 'flex';
    this._applyModuleBg('badgePage', 'badge');
    if (!this._badgeEventsB) { this._bindBadgeEvents(); this._badgeEventsB = true; }
    this._checkAndUnlockBadges();
    this._renderBadgeGrid();
};
ChatInterface.prototype.closeBadgePage = function() {
    document.getElementById('badgePage').style.display = 'none';
};

ChatInterface.prototype._checkAndUnlockBadges = function() {
    const defs = this.storage.getBadgeDefinitions();
    defs.forEach(def => {
        const already = this.storage.getUnlockedBadges(this.currentFriendCode).find(b => b.id === def.id);
        if (already) return;
        if (this._checkBadgeCondition(def)) {
            const isLimited = def.id === 'heartbeat-limited' && this._isValentinesLimited();
            this.storage.addUnlockedBadge(this.currentFriendCode, def.id, isLimited);
            // 静默生成AI留言
            this._generateAiLiuyan('badge', `解锁了徽章「${def.name}」`).then(msg => {
                if (msg) this._saveBadgeLiuyan(def.id, { ai: msg });
            });
            const evId = this._addStarTrailEvent('badge_unlock', `解锁亲密徽章「${def.name}」`, def.id);
            this._triggerLiuyanModal('badge', `🏅 解锁徽章「${def.name}」！`, evId);
        }
    });
};

ChatInterface.prototype._checkBadgeCondition = function(def) {
    const msgs = this.messages || [];
    switch(def.type) {
        case 'instant':
            return msgs.some(m => m.type==='user') && msgs.some(m => m.type==='ai');
        case 'goodnight_once': {
            const re = /晚安/;
            return msgs.some(m=>m.type==='user'&&re.test(m.text)) && msgs.some(m=>m.type==='ai'&&re.test(m.text));
        }
        case 'night_chat_days': {
            const days=new Set(); msgs.forEach(m=>{const d=new Date(m.timestamp);if(d.getHours()<5)days.add(d.toISOString().slice(0,10));});
            return days.size >= def.goal;
        }
        case 'night_chat_days_ex': {
            const days=new Set(); msgs.forEach(m=>{const d=new Date(m.timestamp);if(d.getHours()<5)days.add(d.toISOString().slice(0,10));});
            return days.size >= def.goal;
        }
        case 'greetings': {
            const mr=/早安|早上好/,nr=/晚安/; const md=new Set(),nd=new Set();
            msgs.forEach(m=>{const d=m.timestamp.slice(0,10);if(mr.test(m.text))md.add(d);if(nr.test(m.text))nd.add(d);});
            return [...md].filter(d=>nd.has(d)).length >= def.goal;
        }
        case 'goodnight_streak': {
            const nr=/晚安/; const dayMap={};
            msgs.forEach(m=>{const d=m.timestamp.slice(0,10);if(!dayMap[d])dayMap[d]={user:false,ai:false};if(nr.test(m.text))dayMap[d][m.type]=true;});
            const both=[...Object.entries(dayMap).filter(([,v])=>v.user&&v.ai).map(([d])=>d)].sort();
            let streak=1; for(let i=1;i<both.length;i++){const diff=(new Date(both[i])-new Date(both[i-1]))/86400000;if(diff===1){streak++;if(streak>=def.goal)return true;}else streak=1;}
            return false;
        }
        case 'spark_days': {
            const settings=this.storage.getChatSettings(this.currentFriendCode);
            if(!settings?.sparkEnabled)return false;
            return (this.chatApp?.calcSparkStatus?.(this.currentFriendCode)?.days||0)>=def.goal;
        }
        case 'valentines': return this._checkValentinesCondition();
        case 'progress': {
            const ex=this.storage.getExchangeData(this.currentFriendCode);
            return [...(ex.todos||[]),...(ex.funds||[]),...(ex.shopping||[]),...(ex.delivery||[]),...(ex.letters||[])].filter(i=>i.completed).length>=def.goal;
        }
        default: return false;
    }
};

ChatInterface.prototype._checkValentinesCondition = function() {
    const re=/情人节快乐/;
    return (this.messages||[]).some(m=>re.test(m.text)&&new Date(m.timestamp).getMonth()===1&&new Date(m.timestamp).getDate()===14);
};
ChatInterface.prototype._isValentinesLimited = function() {
    const re=/情人节快乐/;
    const years=new Set((this.messages||[]).filter(m=>re.test(m.text)).map(m=>new Date(m.timestamp)).filter(d=>d.getMonth()===1&&d.getDate()===14).map(d=>d.getFullYear()));
    return years.size < 3;
};

ChatInterface.prototype._renderBadgeGrid = function() {
    const grid     = document.getElementById('badgeGrid');
    if (!grid) return;
    const defs     = this.storage.getBadgeDefinitions();
    const customs  = this.storage.getCustomBadges(this.currentFriendCode);
    const unlocked = this.storage.getUnlockedBadges(this.currentFriendCode);
    grid.innerHTML  = '';

    [...defs, ...customs].forEach(def => {
        const ul       = unlocked.find(b=>b.id===def.id);
        const isUnlock = !!ul;
        const isCustom = !!def.isCustom;

        const card = document.createElement('div');
        card.className = 'badge-card'+(isUnlock?(ul.isLimited?' unlocked-limited':' unlocked'):'');

        card.innerHTML = `
            ${isCustom?`<div class="badge-card-delete-btn" data-id="${def.id}" title="删除">×</div>`:''}
            <div class="badge-card-img-wrap">
                <div style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;filter:${isUnlock?'none':'grayscale(100%) brightness(0.25)'}">
                    ${this._badgeImgHTML(def, 52)}
                </div>
                ${!isUnlock?'<div class="badge-card-locked-overlay">🔒</div>':''}
            </div>
            <div class="badge-card-name">${def.name}</div>
            <div class="badge-card-status">${isUnlock?(ul.isLimited?'✦ 限定版':'✦ 已解锁'):'进行中'}</div>`;

        card.querySelector('.badge-card-delete-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!confirm(`确定要删除自定义徽章「${def.name}」吗？`)) return;
            const updated = customs.filter(c=>c.id!==def.id);
            this.storage.saveCustomBadges(this.currentFriendCode, updated);
            this._renderBadgeGrid();
        });

        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('badge-card-delete-btn')) return;
            this._openBadgeDetail(def.id);
        });
        grid.appendChild(card);
    });
};


ChatInterface.prototype._badgeImgHTML = function(def, size) {
    const s = size || 52;
    const src = def.img || def.imageSrc;
    if (src) return `<img src="${src}" style="width:${s}px;height:${s}px;object-fit:contain;" alt="${def.name}" onerror="this.style.display='none'">`;
    const emojis = {'infinite-overdraft':'💳','absolute-shelter':'🛡️','time-anchor':'⚓','exclusive-exception':'✨','only-route':'🌊','sleep-guardian':'🌙','as-promised':'🤝','dream-domain':'🌌','heartbeat-limited':'💖'};
    return `<span style="font-size:${Math.floor(s*0.65)}px;line-height:1;">${emojis[def.id]||'🏅'}</span>`;
};

ChatInterface.prototype._openBadgeDetail = function(badgeId) {
    const allDefs = [...this.storage.getBadgeDefinitions(), ...this.storage.getCustomBadges(this.currentFriendCode)];
    const def = allDefs.find(d => d.id === badgeId);
    if (!def) return;
    const modal = document.getElementById('badgeDetailModal');
    if (!modal) return;
    const ul = this.storage.getUnlockedBadges(this.currentFriendCode).find(b => b.id === badgeId);

    document.getElementById('badgeDetailImg').innerHTML    = this._badgeImgHTML(def, 80);
    document.getElementById('badgeDetailName').textContent = def.name;
    document.getElementById('badgeDetailDesc').textContent = def.desc || def.condition || '';
    const statusEl = document.getElementById('badgeDetailStatus');
    statusEl.textContent = ul
        ? `✦ ${ul.isLimited ? '限定版' : '已解锁'} · ${new Date(ul.unlockedAt).toLocaleDateString()}`
        : '🔒 尚未解锁';
    statusEl.style.color = ul ? '#ffd700' : '#666';

    const liuyanSection = document.getElementById('badgeLiuyanSection');
    if (liuyanSection) {
        liuyanSection.style.display = ul ? 'block' : 'none';
        if (ul) {
            const saved = this._getBadgeLiuyan(badgeId);
            this._currentBadgeId = badgeId;

            // AI 寄语：只读，从星迹留痕读取
            const aiEl = document.getElementById('badgeLiuyanAiText');
            if (aiEl) {
                if (saved.ai) {
                    aiEl.textContent = saved.ai;
                } else {
                    aiEl.textContent = '（TA的寄语将在解锁后自动生成）';
                    this._generateAiLiuyan('badge', `解锁了徽章「${def.name}」`).then(msg => {
                        if (!msg) return;
                        aiEl.textContent = msg;
                        this._saveBadgeLiuyan(badgeId, { ai: msg });
                    });
                }
            }

            // 我的寄语：写过就只读，未写才显示输入框
            const userArea = document.getElementById('badgeLiuyanUserArea');
            const saveBtn  = document.getElementById('badgeLiuyanSave');
            if (userArea) {
                if (saved.user) {
                    userArea.innerHTML = `
                        <div class="liuyan-readonly-text">${this._esc(saved.user)}</div>
                        <button class="liuyan-delete-btn" id="badgeLiuyanDeleteBtn">🗑️ 删除我的寄语（可重新写）</button>`;
                    if (saveBtn) saveBtn.style.display = 'none';
                    document.getElementById('badgeLiuyanDeleteBtn')?.addEventListener('click', () => {
                        if (!confirm('确定删除这条寄语吗？')) return;
                        this._saveBadgeLiuyan(badgeId, { user: '' });
                        this._openBadgeDetail(badgeId);
                    });
                } else {
                    userArea.innerHTML = `<textarea class="badge-liuyan-input" id="badgeLiuyanUser" placeholder="写下你对这枚徽章的感言…"></textarea>`;
                    if (saveBtn) saveBtn.style.display = '';
                }
            }
        }
    }

    this._currentBadgeId = badgeId;
    modal.style.display  = 'flex';
};


ChatInterface.prototype._getBadgeLiuyan = function(badgeId) {
    const events = this.storage.getStarTrailEvents(this.currentFriendCode);
    const ev = events.find(e => e.type === 'badge_unlock' && e.refId === badgeId);
    if (ev) return { user: ev.userMessage || '', ai: ev.aiMessage || '', eventId: ev.id };
    return { user: '', ai: '' };
};

ChatInterface.prototype._saveBadgeLiuyan = function(badgeId, data) {
    const events = this.storage.getStarTrailEvents(this.currentFriendCode);
    const ev = events.find(e => e.type === 'badge_unlock' && e.refId === badgeId);
    if (ev) {
        this.storage.updateStarTrailEvent(this.currentFriendCode, ev.id, {
            userMessage: data.user !== undefined ? data.user : ev.userMessage,
            aiMessage:   data.ai   !== undefined ? data.ai   : ev.aiMessage
        });
    }
    // 同步刷新星迹留痕区域
    const section = document.getElementById('starTrailSection');
    if (section) this._renderStarTrailSection();
};


ChatInterface.prototype._bindBadgeEvents = function() {
    document.getElementById('badgeBackBtn')?.addEventListener('click', () => this.closeBadgePage());
    document.getElementById('badgeBgBtn')?.addEventListener('click',  () => this._openModuleBgPicker('badge', 'badgePage'));
    document.getElementById('badgeCustomBtn')?.addEventListener('click', () => { document.getElementById('badgeCustomModal').style.display='flex'; });
    document.getElementById('badgeDetailClose')?.addEventListener('click', () => { document.getElementById('badgeDetailModal').style.display='none'; });

    // 保存我的寄语（AI寄语不需要按钮，已自动生成）
    document.getElementById('badgeLiuyanSave')?.addEventListener('click', () => {
    if (!this._currentBadgeId) return;
    const textarea = document.getElementById('badgeLiuyanUser');
    const userText = textarea?.value.trim();
    if (!userText) { alert('❌ 请先写下寄语内容'); return; }
    const saved = this._getBadgeLiuyan(this._currentBadgeId);
    this._saveBadgeLiuyan(this._currentBadgeId, { ...saved, user: userText });
    alert('✅ 寄语已保存！');
    this._openBadgeDetail(this._currentBadgeId); // 刷新为只读模式
});

    // 自定义徽章弹窗 — 三项都必填
    let _customBadgeImg = null;
    document.getElementById('badgeCustomClose')?.addEventListener('click',  () => { document.getElementById('badgeCustomModal').style.display='none'; });
    document.getElementById('badgeCustomCancel')?.addEventListener('click', () => { document.getElementById('badgeCustomModal').style.display='none'; });
    const ccImgBtn  = document.getElementById('badgeCustomImgBtn');
    const ccImgFile = document.getElementById('badgeCustomImgFile');
    if (ccImgBtn && ccImgFile) {
        ccImgBtn.addEventListener('click', () => ccImgFile.click());
        ccImgFile.addEventListener('change', (e) => {
            const file = e.target.files[0]; if (!file) return;
            this._compressImage(file, 200, 0.9, (d) => {
                _customBadgeImg = d;
                document.getElementById('badgeCustomImgName').textContent = file.name;
            });
        });
    }
    document.getElementById('badgeCustomConfirm')?.addEventListener('click', () => {
        const name = document.getElementById('badgeCustomName')?.value.trim();
        const cond = document.getElementById('badgeCustomCondition')?.value.trim();
        if (!name) { alert('❌ 请输入徽章名称'); return; }
        if (!_customBadgeImg) { alert('❌ 请上传徽章图标'); return; }
        if (!cond) { alert('❌ 请填写解锁条件描述'); return; }
        const customs = this.storage.getCustomBadges(this.currentFriendCode);
        customs.push({ id:'custom_badge_'+Date.now(), name, desc:cond, imageSrc:_customBadgeImg, isCustom:true });
        this.storage.saveCustomBadges(this.currentFriendCode, customs);
        document.getElementById('badgeCustomModal').style.display = 'none';
        _customBadgeImg = null;
        document.getElementById('badgeCustomName').value = '';
        document.getElementById('badgeCustomCondition').value = '';
        document.getElementById('badgeCustomImgName').textContent = '未选择';
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
    this._applyModuleBg('exchangePage', 'exchange');
    this._exCurrentTab = this._exCurrentTab || 'todos';
    if (!this._exEventsB) { this._bindExchangeEvents(); this._exEventsB = true; }
    this._switchExchangeTab(this._exCurrentTab);
};
ChatInterface.prototype.closeExchangePage = function() {
    document.getElementById('exchangePage').style.display = 'none';
};

ChatInterface.prototype._switchExchangeTab = function(tab) {
    this._exCurrentTab = tab;
    document.querySelectorAll('.exchange-tab').forEach(t => t.classList.toggle('active', t.getAttribute('data-tab')===tab));
    this._renderExchangeBody(tab);
};

ChatInterface.prototype._renderExchangeBody = function(tab) {
    const body = document.getElementById('exchangeBody');
    if (!body) return;
    const data = this.storage.getExchangeData(this.currentFriendCode);
    const friendName = this.currentFriend?.nickname || this.currentFriend?.name || 'TA';

    switch(tab) {
        case 'todos':     return this._renderTodos(body, data.todos||[], friendName);
        case 'funds':     return this._renderFunds(body, data.funds||[]);
        case 'shopping':  return this._renderShopping(body, data.shopping||[], friendName);
        case 'delivery':  return this._renderDelivery(body, data.delivery||[], friendName);
        case 'letters':   return this._renderLetters(body, data.letters||[], friendName);
    }
};

// ── 待做的事：分两块：TA要做的 / 双方一起做的 ──
ChatInterface.prototype._renderTodos = function(body, items, friendName) {
    const forAi   = items.filter(i => i.assignedTo === 'ai');
    const forBoth  = items.filter(i => i.assignedTo === 'both');

    body.innerHTML = `
        <div class="ex-section-header">
            <span class="ex-section-title">📋 我要求TA完成的</span>
        </div>
        <div id="todosForAi">${forAi.length ? '' : '<div class="exchange-empty"><div class="exchange-empty-text">还没有</div></div>'}</div>
        <div class="ex-section-header" style="margin-top:16px;">
            <span class="ex-section-title">🤝 我们一起完成的</span>
        </div>
        <div id="todosForBoth">${forBoth.length ? '' : '<div class="exchange-empty"><div class="exchange-empty-text">还没有</div></div>'}</div>`;

    const aiContainer   = document.getElementById('todosForAi');
    const bothContainer = document.getElementById('todosForBoth');
    forAi.forEach(item  => aiContainer.appendChild(this._makeTodoItem(item, friendName)));
    forBoth.forEach(item => bothContainer.appendChild(this._makeTodoItem(item, friendName)));
};

ChatInterface.prototype._makeTodoItem = function(item, friendName) {
    const div = document.createElement('div');
    div.className = 'exchange-item' + (item.completed ? ' completed' : '');
    const whoLabel = item.assignedTo === 'ai' ? `${friendName}来完成` : '双方共同完成';
    div.innerHTML = `
        <div class="exchange-item-header">
            <div class="exchange-item-icon">📋</div>
            <div class="exchange-item-info">
                <div class="exchange-item-title">${this._esc(item.content||'')}</div>
                <div class="exchange-item-meta">${whoLabel}</div>
            </div>
        </div>
        ${item.completed ? '<div class="exchange-item-completed-badge">✅ 已完成</div>' : ''}
        ${item.completed && item.completedNote ? `<div class="exchange-item-note">完成备注：${this._esc(item.completedNote)}</div>` : ''}
        ${item.completed && item.completedPhoto ? `<div class="exchange-item-complete-photo"><img src="${item.completedPhoto}"></div>` : ''}
        <div class="exchange-item-actions">
            ${!item.completed ? `<button class="exchange-action-btn complete" data-action="complete" data-id="${item.id}" data-tab="todos">✅ 完成</button>` : ''}
            <button class="exchange-action-btn delete" data-action="delete" data-id="${item.id}" data-tab="todos">🗑️ 删除</button>
        </div>`;
    this._bindItemBtns(div);
    return div;
};

// ── 亲密基金：只显示存款记录，无完成按钮 ──
ChatInterface.prototype._renderFunds = function(body, items) {
    const total = items.reduce((s, i) => s + (parseFloat(i.amount)||0), 0);
    body.innerHTML = `
        <div class="fund-total-bar">
            <div class="fund-total-label">亲密基金总额</div>
            <div><span class="fund-total-amount">${total.toFixed(2)}</span><span class="fund-total-unit"> 元</span></div>
        </div>
        <div class="ex-section-header"><span class="ex-section-title">💰 存款记录</span></div>
        <div id="fundRecords"></div>`;
    const container = document.getElementById('fundRecords');
    if (items.length === 0) {
        container.innerHTML = '<div class="exchange-empty"><div class="exchange-empty-text">还没有存款记录</div></div>';
        return;
    }
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'exchange-item';
        div.innerHTML = `
            <div class="exchange-item-header">
                <div class="exchange-item-icon">💰</div>
                <div class="exchange-item-info">
                    <div class="exchange-item-title fund-amount">${parseFloat(item.amount).toFixed(2)} 元</div>
                    <div class="exchange-item-meta">${new Date(item.createdAt).toLocaleDateString()} · ${item.note||'存入'}</div>
                </div>
            </div>
            <div class="exchange-item-actions">
                <button class="exchange-action-btn delete" data-action="delete" data-id="${item.id}" data-tab="funds">🗑️ 撤销</button>
            </div>`;
        this._bindItemBtns(div);
        container.appendChild(div);
    });
};

// ── 网购：分"我送给TA的"（user创建，不能自己完成）/ "TA送给我的"（ai创建，user可完成） ──
ChatInterface.prototype._renderShopping = function(body, items, friendName) {
    const iSent   = items.filter(i => i.from === 'user');
    const theyGave= items.filter(i => i.from === 'ai');
    body.innerHTML = `
        <div class="ex-section-header"><span class="ex-section-title">🛍️ 我送给${friendName}的</span></div>
        <div id="shoppingISent"></div>
        <div class="ex-section-header" style="margin-top:16px;"><span class="ex-section-title">🎁 ${friendName}送给我的</span></div>
        <div id="shoppingTheyGave"></div>`;
    const sentEl  = document.getElementById('shoppingISent');
    const gaveEl  = document.getElementById('shoppingTheyGave');
    if (iSent.length===0) sentEl.innerHTML  = '<div class="exchange-empty"><div class="exchange-empty-text">还没有</div></div>';
    if (theyGave.length===0) gaveEl.innerHTML = '<div class="exchange-empty"><div class="exchange-empty-text">还没有</div></div>';
    iSent.forEach(item => sentEl.appendChild(this._makeShopItem(item, 'shopping', false, friendName)));
    theyGave.forEach(item => gaveEl.appendChild(this._makeShopItem(item, 'shopping', true, friendName)));
};

ChatInterface.prototype._renderDelivery = function(body, items, friendName) {
    const iSent   = items.filter(i => i.from === 'user');
    const theyGave= items.filter(i => i.from === 'ai');
    body.innerHTML = `
        <div class="ex-section-header"><span class="ex-section-title">🍜 我点给${friendName}的</span></div>
        <div id="deliveryISent"></div>
        <div class="ex-section-header" style="margin-top:16px;"><span class="ex-section-title">🥡 ${friendName}点给我的</span></div>
        <div id="deliveryTheyGave"></div>`;
    const sentEl  = document.getElementById('deliveryISent');
    const gaveEl  = document.getElementById('deliveryTheyGave');
    if (iSent.length===0) sentEl.innerHTML  = '<div class="exchange-empty"><div class="exchange-empty-text">还没有</div></div>';
    if (theyGave.length===0) gaveEl.innerHTML = '<div class="exchange-empty"><div class="exchange-empty-text">还没有</div></div>';
    iSent.forEach(item => sentEl.appendChild(this._makeShopItem(item, 'delivery', false, friendName)));
    theyGave.forEach(item => gaveEl.appendChild(this._makeShopItem(item, 'delivery', true, friendName)));
};

ChatInterface.prototype._makeShopItem = function(item, tab, canComplete, friendName) {
    const div = document.createElement('div');
    div.className = 'exchange-item' + (item.completed ? ' completed' : '');
    const icon = tab === 'delivery' ? '🍜' : '🛍️';
    div.innerHTML = `
        <div class="exchange-item-header">
            <div class="exchange-item-icon">${item.imageSrc ? `<img src="${item.imageSrc}">` : icon}</div>
            <div class="exchange-item-info">
                <div class="exchange-item-title">${this._esc(item.name||'')}</div>
                <div class="exchange-item-meta">${item.note||''}</div>
            </div>
        </div>
        ${item.completed ? '<div class="exchange-item-completed-badge">✅ 已完成</div>' : ''}
        ${item.completed && item.completedNote ? `<div class="exchange-item-note">${this._esc(item.completedNote)}</div>` : ''}
        ${item.completed && item.completedPhoto ? `<div class="exchange-item-complete-photo"><img src="${item.completedPhoto}"></div>` : ''}
        <div class="exchange-item-actions">
            ${canComplete && !item.completed ? `<button class="exchange-action-btn complete" data-action="complete" data-id="${item.id}" data-tab="${tab}">✅ 我收到了</button>` : ''}
            ${!canComplete && item.completed ? '' : ''}
            <button class="exchange-action-btn delete" data-action="delete" data-id="${item.id}" data-tab="${tab}">🗑️ 删除</button>
        </div>`;
    this._bindItemBtns(div);
    return div;
};

// ── 我们的信：用户只能写自己发出的信 ──
ChatInterface.prototype._renderLetters = function(body, items, friendName) {
    const now = Date.now();
    body.innerHTML = '';
    if (items.length === 0) {
        body.innerHTML = '<div class="exchange-empty"><div class="exchange-empty-icon">✉️</div><div class="exchange-empty-text">还没有信件</div></div>';
        return;
    }
    items.forEach(item => {
        const isLocked = new Date(item.receiveTime).getTime() > now;
        const toLabel = { ai: friendName, future_self: '未来的我', future_ai: `未来的${friendName}` }[item.to] || item.to;
        const div = document.createElement('div');
        div.className = 'letter-envelope';
        div.innerHTML = `
            <div class="letter-from-to">我 → ${toLabel}</div>
            <div class="letter-preview-text">${isLocked ? '📮 信件尚未到达…' : this._esc((item.content||'').slice(0,50)+'…')}</div>
            <div class="letter-time">📅 ${new Date(item.sendTime||item.createdAt).toLocaleDateString()} · 收到 ${new Date(item.receiveTime).toLocaleDateString()}</div>
            ${isLocked ? `<div class="letter-locked">⏳ ${new Date(item.receiveTime).toLocaleDateString()} 后可读取</div>` : ''}
            <div class="exchange-item-actions" style="margin-top:8px;">
                <button class="exchange-action-btn delete" data-action="delete" data-id="${item.id}" data-tab="letters">🗑️ 删除</button>
            </div>`;
        if (!isLocked) div.querySelector('.letter-preview-text').addEventListener('click', () => this._openLetterDetail(item, friendName));
        this._bindItemBtns(div);
        body.appendChild(div);
    });
};

ChatInterface.prototype._openLetterDetail = function(item, friendName) {
    const modal = document.getElementById('letterDetailModal');
    if (!modal) return;
    const toLabel = { ai: friendName, future_self: '未来的我', future_ai: `未来的${friendName}` }[item.to] || item.to;
    document.getElementById('letterDetailMeta').innerHTML =
        `<b>来自：</b>我 &nbsp;→&nbsp; <b>致：</b>${toLabel}<br>发送于 ${new Date(item.sendTime||item.createdAt).toLocaleDateString()}`;
    document.getElementById('letterDetailContent').textContent = item.content || '';
    this._currentLetterData = item;
    modal.style.display = 'flex';
};

ChatInterface.prototype._bindItemBtns = function(el) {
    el.querySelectorAll('.exchange-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.getAttribute('data-action');
            const id     = btn.getAttribute('data-id');
            const tab    = btn.getAttribute('data-tab');
            if (action === 'delete') {
                if (!confirm('确定要删除吗？')) return;
                this.storage.deleteExchangeItem(this.currentFriendCode, tab, id);
                this._renderExchangeBody(tab);
            } else if (action === 'complete') {
                this._openExCompleteModal(tab, id);
            }
        });
    });
};

ChatInterface.prototype._openExCompleteModal = function(tab, itemId) {
    const modal = document.getElementById('exchangeCompleteModal');
    if (!modal) return;
    this._pendingCompleteTab = tab;
    this._pendingCompleteId  = itemId;
    document.getElementById('exCompleteImgPreview').style.display = 'none';
    document.getElementById('exCompleteNote').value = '';
    this._completeImgData = null;
    modal.style.display = 'flex';
};

ChatInterface.prototype._bindExchangeEvents = function() {
    document.getElementById('exchangeBackBtn')?.addEventListener('click', () => this.closeExchangePage());
    document.getElementById('exchangeBgBtn')?.addEventListener('click',  () => this._openModuleBgPicker('exchange','exchangePage'));
    document.getElementById('exchangeAddBtn')?.addEventListener('click', () => this._openExchangeAddModal());

    document.querySelectorAll('.exchange-tab').forEach(t => {
        t.addEventListener('click', () => this._switchExchangeTab(t.getAttribute('data-tab')));
    });

    // 添加弹窗关闭
    document.getElementById('exchangeAddClose')?.addEventListener('click', () => {
        document.getElementById('exchangeAddModal').style.display = 'none';
    });

    // 完成弹窗
    const completeClose  = document.getElementById('exchangeCompleteClose');
    const completeCancel = document.getElementById('exchangeCompleteCancel');
    const completeConfirm= document.getElementById('exchangeCompleteConfirm');
    const completeImgBtn = document.getElementById('exCompleteImgBtn');
    const completeImgFile= document.getElementById('exCompleteImgFile');

    completeClose?.addEventListener('click',  () => { document.getElementById('exchangeCompleteModal').style.display='none'; });
    completeCancel?.addEventListener('click', () => { document.getElementById('exchangeCompleteModal').style.display='none'; });
    completeImgBtn?.addEventListener('click', () => completeImgFile?.click());
    completeImgFile?.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        this._compressImage(file, 800, 0.8, (d) => {
            this._completeImgData = d;
            document.getElementById('exCompleteImgEl').src = d;
            document.getElementById('exCompleteImgPreview').style.display = 'block';
            document.getElementById('exCompleteImgName').textContent = file.name;
        });
    });
    completeConfirm?.addEventListener('click', () => {
        const note = document.getElementById('exCompleteNote')?.value.trim();
        this.storage.updateExchangeItem(this.currentFriendCode, this._pendingCompleteTab, this._pendingCompleteId, {
            completed:true, completedAt:new Date().toISOString(),
            completedPhoto:this._completeImgData||'', completedNote:note
        });
        document.getElementById('exchangeCompleteModal').style.display = 'none';
        this._renderExchangeBody(this._pendingCompleteTab);
    });

    // 信件详情
    document.getElementById('letterDetailClose')?.addEventListener('click', () => { document.getElementById('letterDetailModal').style.display='none'; });
    document.getElementById('letterDetailDelete')?.addEventListener('click', () => {
        if (!this._currentLetterData || !confirm('确定删除这封信吗？')) return;
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
    const friendName = this.currentFriend?.nickname || this.currentFriend?.name || 'TA';
    const titles = { todos:'待做的事', funds:'亲密基金', shopping:'网购', delivery:'外卖', letters:'我们的信' };
    document.getElementById('exchangeAddModalTitle').textContent = `添加 · ${titles[tab]}`;

    const body = document.getElementById('exchangeAddBody');
    if (!body) return;
    let formHTML = '';

    if (tab === 'todos') {
        // 用户不能给自己立目标
        formHTML = `
            <div class="form-row"><label>事项内容</label><textarea id="exAddContent" placeholder="写下要做的事…" rows="3"></textarea></div>
            <div class="form-row"><label>由谁完成</label>
                <div class="radio-group">
                    <label class="radio-item"><input type="radio" name="exTodoAssign" value="ai" checked> ${friendName}来做</label>
                    <label class="radio-item"><input type="radio" name="exTodoAssign" value="both"> 双方一起</label>
                </div>
            </div>`;
    } else if (tab === 'funds') {
        // 只能用户自己存
        formHTML = `
            <div class="form-row"><label>存入金额（元）</label><input type="number" id="exAddAmount" placeholder="0.00" min="0.01" step="0.01"></div>
            <div class="form-row"><label>备注（可选）</label><input type="text" id="exAddNote" placeholder="存入原因…"></div>`;
    } else if (tab === 'shopping' || tab === 'delivery') {
        const placeholder = tab==='delivery' ? '比如：奶茶一杯' : '比如：毛绒玩具';
        // 只能送给TA，不能送给自己
        formHTML = `
            <div class="form-row"><label>物品名称</label><input type="text" id="exAddName" placeholder="${placeholder}"></div>
            <div class="form-row"><label>图片（可选）</label>
                <div class="upload-row">
                    <button class="upload-btn" id="exAddImgBtn">选择图片</button>
                    <input type="file" id="exAddImgFile" accept="image/*" style="display:none;">
                    <span id="exAddImgName" class="upload-hint">未选择</span>
                </div>
            </div>
            <div class="form-row"><label>附言（可选）</label><input type="text" id="exAddNote2" placeholder="写给TA的话…"></div>`;
    } else if (tab === 'letters') {
        // from 固定为 user，to 只能是 ai / future_self / future_ai
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
        const tomorrowStr = tomorrow.toISOString().slice(0,16);
        formHTML = `
            <div class="form-row"><label>这封信写给</label>
                <div class="radio-group" style="flex-wrap:wrap;gap:8px;">
                    <label class="radio-item"><input type="radio" name="exLetterTo" value="ai" checked> ${friendName}</label>
                    <label class="radio-item"><input type="radio" name="exLetterTo" value="future_self"> 未来的我</label>
                    <label class="radio-item"><input type="radio" name="exLetterTo" value="future_ai"> 未来的${friendName}</label>
                </div>
            </div>
            <div class="form-row"><label>信件内容</label><textarea id="exLetterContent" placeholder="写下你想说的话…" rows="6"></textarea></div>
            <div class="form-row"><label>对方可读取时间</label><input type="datetime-local" id="exLetterReceiveTime" value="${tomorrowStr}"></div>`;
    }

    formHTML += `<div class="modal-actions">
        <button class="modal-btn-cancel" id="exAddCancel">取消</button>
        <button class="modal-btn-confirm" id="exAddConfirm">添加</button>
    </div>`;
    body.innerHTML = formHTML;

    // 图片绑定
    let _exAddImg = null;
    const exImgBtn  = document.getElementById('exAddImgBtn');
    const exImgFile = document.getElementById('exAddImgFile');
    if (exImgBtn && exImgFile) {
        exImgBtn.addEventListener('click', () => exImgFile.click());
        exImgFile.addEventListener('change', (e) => {
            const file=e.target.files[0]; if(!file) return;
            this._compressImage(file, 600, 0.8, (d) => { _exAddImg=d; document.getElementById('exAddImgName').textContent=file.name; });
        });
    }

    document.getElementById('exAddCancel')?.addEventListener('click', () => { modal.style.display='none'; });
    document.getElementById('exAddConfirm')?.addEventListener('click', () => {
        let item = {};
        if (tab === 'todos') {
            const content = document.getElementById('exAddContent')?.value.trim();
            if (!content) { alert('❌ 请输入事项内容'); return; }
            item = { content, assignedTo: document.querySelector('input[name="exTodoAssign"]:checked')?.value||'ai' };
        } else if (tab === 'funds') {
            const amount = parseFloat(document.getElementById('exAddAmount')?.value);
            if (!amount || amount <= 0) { alert('❌ 请输入有效金额'); return; }
            item = { amount, from:'user', note:document.getElementById('exAddNote')?.value.trim() };
        } else if (tab === 'shopping' || tab === 'delivery') {
            const name = document.getElementById('exAddName')?.value.trim();
            if (!name) { alert('❌ 请输入物品名称'); return; }
            item = { name, from:'user', to:'ai', imageSrc:_exAddImg||'', note:document.getElementById('exAddNote2')?.value.trim() };
        } else if (tab === 'letters') {
            const content = document.getElementById('exLetterContent')?.value.trim();
            if (!content) { alert('❌ 请写下信件内容'); return; }
            item = { content, from:'user', to:document.querySelector('input[name="exLetterTo"]:checked')?.value||'ai',
                sendTime:new Date().toISOString(), receiveTime:document.getElementById('exLetterReceiveTime')?.value||new Date().toISOString() };
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
    this._applyModuleBg('timeCapsulePage', 'capsule');
    if (!this._capsuleEventsB) { this._bindCapsuleEvents(); this._capsuleEventsB = true; }
    this._checkAutoGenerateCapsule(); // 检查是否需要自动生成
    this._renderCapsuleList();
};
ChatInterface.prototype.closeTimeCapsulePage = function() {
    document.getElementById('timeCapsulePage').style.display = 'none';
};

// ── 自动生成检查（周日/月末/年末） ──
ChatInterface.prototype._checkAutoGenerateCapsule = function() {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const lastCheck = localStorage.getItem(`zero_phone_capsule_autocheck_${this.currentFriendCode}`);
    if (lastCheck === todayStr) return; // 今天已检查过
    localStorage.setItem(`zero_phone_capsule_autocheck_${this.currentFriendCode}`, todayStr);

    const isLastDayOfMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate() === now.getDate();
    const isLastDayOfYear  = now.getMonth()===11 && now.getDate()===31;
    const isSunday         = now.getDay() === 0;

    const capsules = this.storage.getTimeCapsules(this.currentFriendCode);

    const alreadyHas = (type) => {
        const periodKey = this._capsulePeriodKey(type, now);
        return capsules.some(c => c.type === type && c.periodKey === periodKey);
    };

    if (isSunday && !alreadyHas('weekly')) {
        setTimeout(() => this._generateCapsuleReport('weekly', true), 2000);
    }
    if (isLastDayOfMonth && !isLastDayOfYear && !alreadyHas('monthly')) {
        setTimeout(() => this._generateCapsuleReport('monthly', true), 3000);
    }
    if (isLastDayOfYear && !alreadyHas('annual')) {
        setTimeout(() => this._generateCapsuleReport('annual', true), 4000);
    }
};

ChatInterface.prototype._capsulePeriodKey = function(type, date) {
    const d = date || new Date();
    if (type === 'weekly') {
        return `${d.getFullYear()}_W${this._getWeekNumber(d)}`;
    } else if (type === 'monthly') {
        return `${d.getFullYear()}_M${d.getMonth()+1}`;
    } else {
        return `${d.getFullYear()}_Y`;
    }
};

ChatInterface.prototype._renderCapsuleList = function() {
    const body = document.getElementById('capsuleBody');
    if (!body) return;
    const capsules = this.storage.getTimeCapsules(this.currentFriendCode);
    if (capsules.length === 0) {
        body.innerHTML = `<div class="capsule-empty">
            <div class="capsule-empty-icon">📅</div>
            <div class="capsule-empty-text">还没有报告<br>每周日、月末、年末会自动生成<br>也可以手动点击「生成报告」</div>
        </div>`;
        return;
    }
    body.innerHTML = '<div class="capsule-list"></div>';
    const list = body.querySelector('.capsule-list');
    capsules.forEach(c => {
        const card = document.createElement('div');
        card.className = 'capsule-card';
        const typeLabel = { weekly:'📅 周报', monthly:'🌙 月报', annual:'⭐ 年报' }[c.type] || '报告';
        const coverImg = c.coverImgs?.[0] || '';
        card.innerHTML = `
            <div class="capsule-card-cover">
                ${coverImg ? `<img src="${coverImg}">` : ({weekly:'📅',monthly:'🌙',annual:'⭐'}[c.type]||'📚')}
                <div class="capsule-card-type-badge">${typeLabel}</div>
            </div>
            <div class="capsule-card-body">
                <div class="capsule-card-title">${this._esc(c.title)}</div>
                <div class="capsule-card-stats">
                    <span class="capsule-card-stat">💬 ${c.stats?.totalMessages||0} 条消息</span>
                    <span class="capsule-card-stat">📆 ${c.stats?.totalDays||0} 天</span>
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
    const capsule = this.storage.getTimeCapsules(this.currentFriendCode).find(c=>c.id===capsuleId);
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
    const coverImg = capsule.coverImgs?.[0] || '';

    const heatmapHTML = this._buildHeatmap(capsule);
    const timelineHTML = (capsule.unlockEvents||[]).map(ev =>
        `<div class="capsule-tl-item"><div class="capsule-tl-dot"></div><div class="capsule-tl-text">${this._esc(ev)}</div></div>`
    ).join('') || '<div style="color:#555;font-size:13px;">本期无解锁事件</div>';

    // AI寄语（不显示生成按钮，已自动生成）
    const aiMsgSection = capsule.aiMessage
        ? `<div class="capsule-section">
            <div class="capsule-section-title">🌸 ${this.currentFriend?.nickname||'TA'} 的寄语</div>
            <div class="capsule-liuyan-wrap"><div class="capsule-liuyan-text">${this._esc(capsule.aiMessage)}</div></div>
           </div>`
        : '';

    // 报告美化入口
    body.innerHTML = `
        <div class="capsule-detail-cover" id="capsuleCoverArea">
            ${coverImg ? `<img src="${coverImg}">` : ({weekly:'📅',monthly:'🌙',annual:'⭐'}[capsule.type]||'📚')}
            <button class="capsule-detail-cover-edit" id="capsuleEditCoverBtn">更换封面</button>
        </div>
        <div class="capsule-section">
            <div class="capsule-section-title">📊 数据总览</div>
            <div class="capsule-stats-grid">
                <div class="capsule-stat-card"><div class="capsule-stat-value">${s.totalMessages||0}</div><div class="capsule-stat-label">消息总数</div></div>
                <div class="capsule-stat-card"><div class="capsule-stat-value">${s.totalDays||0}</div><div class="capsule-stat-label">相识天数</div></div>
                <div class="capsule-stat-card"><div class="capsule-stat-value">${s.morningCount||0}</div><div class="capsule-stat-label">早安打卡</div></div>
                <div class="capsule-stat-card"><div class="capsule-stat-value">${s.nightCount||0}</div><div class="capsule-stat-label">晚安打卡</div></div>
                <div class="capsule-stat-card"><div class="capsule-stat-value">${s.nightChatCount||0}</div><div class="capsule-stat-label">熬夜修仙</div></div>
                <div class="capsule-stat-card"><div class="capsule-stat-value">${s.totalTokens||0}</div><div class="capsule-stat-label">消耗Token</div></div>
            </div>
        </div>
        <div class="capsule-section">
            <div class="capsule-section-title">🗓️ 聊天热力图</div>
            ${heatmapHTML}
        </div>
        <div class="capsule-section">
            <div class="capsule-section-title">🌟 本期解锁事件</div>
            <div class="capsule-timeline-list">${timelineHTML}</div>
        </div>
        ${capsule.aiEvaluation ? `<div class="capsule-section"><div class="capsule-section-title">💬 系统评语</div><div style="font-size:13px;color:#ccc;line-height:1.8;background:rgba(255,255,255,0.03);border-radius:10px;padding:12px;">${this._esc(capsule.aiEvaluation)}</div></div>` : ''}
        ${aiMsgSection}
        <div class="capsule-section">
            <div class="capsule-section-title">✍️ 我的寄语</div>
            <textarea class="capsule-liuyan-input" id="capsuleUserMsg" placeholder="写下你对这段时光的感受…">${this._esc(capsule.userMessage||'')}</textarea>
            <button class="capsule-liuyan-save" id="capsuleSaveUserMsgBtn">保存我的寄语</button>
        </div>
        <div class="capsule-section">
            <div class="capsule-section-title">📝 备注</div>
            <textarea class="capsule-notes-input" id="capsuleNotes" placeholder="可以写下任何想补充的话…">${this._esc(capsule.notes||'')}</textarea>
            <button class="capsule-notes-save" id="capsuleSaveNotesBtn">保存备注</button>
        </div>
        <div class="capsule-section">
            <div class="capsule-section-title">🎨 报告美化</div>
            <div class="capsule-beautify-wrap">
                <div class="capsule-beautify-hint">可以在这里写CSS美化报告外观，或者在聊天里跟TA说想美化一下，TA可能会帮你</div>
                <textarea class="capsule-beautify-css" id="capsuleBeautifyCss" placeholder="写下CSS代码…" rows="5">${this._esc(capsule.customCss||'')}</textarea>
                <div class="capsule-beautify-actions">
                    <button class="capsule-beautify-btn" id="capsuleBeautifyApply">应用预览</button>
                    <button class="capsule-beautify-btn" id="capsuleBeautifySave">保存</button>
                    <button class="capsule-beautify-btn" id="capsuleBeautifyViewCode" style="background:rgba(255,255,255,0.07);">查看AI美化代码</button>
                </div>
                ${capsule.aiBeautifyCss ? `<div style="margin-top:8px;"><div style="font-size:12px;color:#888;margin-bottom:4px;">TA的美化代码：</div><pre class="capsule-ai-css-code" id="capsuleAiCssCode">${this._esc(capsule.aiBeautifyCss)}</pre></div>` : ''}
            </div>
        </div>`;

    // 应用已保存的CSS
    if (capsule.customCss) this._applyCapsuleCss(capsule.customCss);

    // 事件绑定
    document.getElementById('capsuleEditCoverBtn')?.addEventListener('click', () => {
        document.getElementById('capsuleCoverModal').style.display = 'flex';
        this._renderCapsuleCoverGrid(capsule);
    });
    document.getElementById('capsuleSaveUserMsgBtn')?.addEventListener('click', () => {
        const text = document.getElementById('capsuleUserMsg')?.value.trim();
        this.storage.updateTimeCapsule(this.currentFriendCode, this._currentCapsuleId, { userMessage:text });
        alert('✅ 寄语已保存！');
    });
    document.getElementById('capsuleSaveNotesBtn')?.addEventListener('click', () => {
        const notes = document.getElementById('capsuleNotes')?.value.trim();
        this.storage.updateTimeCapsule(this.currentFriendCode, this._currentCapsuleId, { notes });
        alert('✅ 备注已保存！');
    });
    document.getElementById('capsuleBeautifyApply')?.addEventListener('click', () => {
        const css = document.getElementById('capsuleBeautifyCss')?.value;
        this._applyCapsuleCss(css);
    });
    document.getElementById('capsuleBeautifySave')?.addEventListener('click', () => {
        const css = document.getElementById('capsuleBeautifyCss')?.value;
        this.storage.updateTimeCapsule(this.currentFriendCode, this._currentCapsuleId, { customCss: css });
        alert('✅ 美化代码已保存！');
    });
    document.getElementById('capsuleBeautifyViewCode')?.addEventListener('click', () => {
        const aiCodeEl = document.getElementById('capsuleAiCssCode');
        if (aiCodeEl) aiCodeEl.style.display = aiCodeEl.style.display==='none'?'block':'none';
    });
};

ChatInterface.prototype._applyCapsuleCss = function(css) {
    if (!css) return;
    let styleEl = document.getElementById('capsuleCustomStyle');
    if (!styleEl) { styleEl=document.createElement('style'); styleEl.id='capsuleCustomStyle'; document.head.appendChild(styleEl); }
    styleEl.textContent = css;
};

ChatInterface.prototype._buildHeatmap = function(capsule) {
    if (!capsule.heatmapData || Object.keys(capsule.heatmapData).length===0)
        return '<div style="color:#555;font-size:13px;padding:8px 0;">暂无数据</div>';
    const counts = Object.values(capsule.heatmapData);
    const max = Math.max(...counts, 1);
    return `<div class="heatmap-grid">${Object.entries(capsule.heatmapData).map(([date,count]) =>
        `<div class="heatmap-day l${Math.ceil((count/max)*4)}" title="${date}: ${count}条"></div>`
    ).join('')}</div>`;
};

ChatInterface.prototype._renderCapsuleCoverGrid = function(capsule) {
    const grid = document.getElementById('capsuleCoverGrid');
    if (!grid) return;
    const imgs = capsule.coverImgs || [];
    grid.innerHTML = '';
    imgs.forEach((src, idx) => {
        const div = document.createElement('div');
        div.className = 'capsule-cover-img-item' + (idx===0?' selected':'');
        div.innerHTML = `<img src="${src}"><div class="capsule-cover-img-del" data-idx="${idx}">×</div>`;
        div.addEventListener('click', (e) => {
            if (e.target.classList.contains('capsule-cover-img-del')) {
                const i = parseInt(e.target.getAttribute('data-idx'));
                imgs.splice(i, 1);
                this.storage.updateTimeCapsule(this.currentFriendCode, this._currentCapsuleId, { coverImgs:[...imgs] });
                this._renderCapsuleCoverGrid({ ...capsule, coverImgs:[...imgs] });
                return;
            }
            const newImgs = [src, ...imgs.filter((_,i)=>i!==idx)];
            this.storage.updateTimeCapsule(this.currentFriendCode, this._currentCapsuleId, { coverImgs:newImgs });
            document.querySelectorAll('.capsule-cover-img-item').forEach(d=>d.classList.remove('selected'));
            div.classList.add('selected');
        });
        grid.appendChild(div);
    });
};

ChatInterface.prototype._bindCapsuleEvents = function() {
    document.getElementById('capsuleBackBtn')?.addEventListener('click', () => this.closeTimeCapsulePage());
    document.getElementById('capsuleBgBtn')?.addEventListener('click',  () => this._openModuleBgPicker('capsule','timeCapsulePage'));
    document.getElementById('capsuleGenBtn')?.addEventListener('click', () => { document.getElementById('capsuleGenModal').style.display='flex'; });

    document.getElementById('capsuleGenClose')?.addEventListener('click',  () => { document.getElementById('capsuleGenModal').style.display='none'; });
    document.getElementById('capsuleGenCancel')?.addEventListener('click', () => { document.getElementById('capsuleGenModal').style.display='none'; });
    document.getElementById('capsuleGenConfirm')?.addEventListener('click',() => {
        const type = document.querySelector('input[name="capsuleType"]:checked')?.value || 'monthly';
        document.getElementById('capsuleGenModal').style.display = 'none';
        this._generateCapsuleReport(type, false);
    });

    // 封面弹窗
    document.getElementById('capsuleCoverClose')?.addEventListener('click',  () => { document.getElementById('capsuleCoverModal').style.display='none'; });
    document.getElementById('capsuleCoverCancel')?.addEventListener('click', () => { document.getElementById('capsuleCoverModal').style.display='none'; });
    document.getElementById('capsuleCoverConfirm')?.addEventListener('click',() => {
        document.getElementById('capsuleCoverModal').style.display='none';
        const c = this.storage.getTimeCapsules(this.currentFriendCode).find(c=>c.id===this._currentCapsuleId);
        if (c) this._renderCapsuleDetailBody(c);
    });
    const coverUploadBtn  = document.getElementById('capsuleCoverUploadBtn');
    const coverUploadFile = document.getElementById('capsuleCoverUploadFile');
    coverUploadBtn?.addEventListener('click', () => coverUploadFile?.click());
    coverUploadFile?.addEventListener('change', (e) => {
        [...e.target.files].forEach(file => {
            this._compressImage(file, 1200, 0.8, (dataUrl) => {
                const capsule = this.storage.getTimeCapsules(this.currentFriendCode).find(c=>c.id===this._currentCapsuleId);
                if (!capsule) return;
                const imgs = [...(capsule.coverImgs||[]), dataUrl];
                this.storage.updateTimeCapsule(this.currentFriendCode, this._currentCapsuleId, { coverImgs:imgs });
                this._renderCapsuleCoverGrid({...capsule, coverImgs:imgs});
            });
        });
    });
};

ChatInterface.prototype._bindCapsuleDetailEvents = function() {
    document.getElementById('capsuleDetailBackBtn')?.addEventListener('click', () => {
        document.getElementById('capsuleDetailPage').style.display = 'none';
        this._renderCapsuleList();
    });
};

ChatInterface.prototype._generateCapsuleReport = async function(type, isAuto) {
    const body = document.getElementById('capsuleBody');
    if (body && !isAuto) body.innerHTML = '<div class="capsule-generating"><span class="capsule-generating-spin">⏳</span>正在生成报告…</div>';

    try {
        const msgs    = this.messages || [];
        const now     = new Date();
        const start   = this._getCapsuleStartDate(type, now);
        const period  = msgs.filter(m => new Date(m.timestamp) >= start);

        const heatmap = {};
        let morning=0, night=0, nightChat=0;
        const mr=/早安|早上好/, nr=/晚安/;
        period.forEach(m => {
            const date = m.timestamp.slice(0,10);
            heatmap[date] = (heatmap[date]||0)+1;
            const h = new Date(m.timestamp).getHours();
            if (mr.test(m.text)) morning++;
            if (nr.test(m.text)) night++;
            if (h<5) nightChat++;
        });

        const firstMsg = msgs.length>0 ? new Date(msgs[0].timestamp) : now;
        const totalDays = Math.floor((now-firstMsg)/86400000)+1;

        const starTrail = this.storage.getStarTrailEvents(this.currentFriendCode);
        const periodEvents = starTrail.filter(e=>new Date(e.date)>=start).map(e=>`${e.date} · ${e.title}`);

        const stats = { totalMessages:period.length, totalDays, morningCount:morning, nightCount:night, nightChatCount:nightChat,
            totalTokens: this.storage.getChatByFriendCode(this.currentFriendCode)?.tokenStats?.total || 0 };

        // 静默生成AI评语
        let aiEvaluation = '', aiMessage = '';
        try {
            const friendName = this.currentFriend?.nickname || this.currentFriend?.name || 'TA';
            const persona    = (this.currentFriend?.persona||'').slice(0,200);
            const evalPmt    = `你是 ${friendName}。${persona?`人设：${persona}`:''}。请为${start.toLocaleDateString()}至${now.toLocaleDateString()}这段时间写一段简短的系统评语，50-100字，有温度有趣，符合你的性格。直接写评语内容。`;
            const ev = await this.apiManager.callAI([{type:'user',text:'请写系统评语'}], evalPmt);
            if (ev.success) aiEvaluation = ev.text.trim();

            const msgPmt = `你是 ${friendName}。${persona?`人设：${persona}`:''}。请为这份报告写一段寄语，给对方看，30-60字，像私下的悄悄话。直接写内容。`;
            const msg = await this.apiManager.callAI([{type:'user',text:'请写寄语'}], msgPmt);
            if (msg.success) aiMessage = msg.text.trim();
        } catch(e) {}

        const titleMap = {
            weekly:  `${now.getFullYear()}年第${this._getWeekNumber(now)}周 · 周报`,
            monthly: `${now.getFullYear()}年${now.getMonth()+1}月 · 月报`,
            annual:  `${now.getFullYear()}年 · 年报`
        };

        const capsuleId = this.storage.addTimeCapsule(this.currentFriendCode, {
            type, title:titleMap[type]||'报告',
            periodKey: this._capsulePeriodKey(type, now),
            stats, heatmapData:heatmap, unlockEvents:periodEvents,
            aiEvaluation, aiMessage,
            userMessage:'', notes:'', coverImgs:[], customCss:'', aiBeautifyCss:''
        });

        this._addStarTrailEvent('capsule_gen', `生成${titleMap[type]}`, capsuleId);
        this._renderCapsuleList();
        if (capsuleId && !isAuto) setTimeout(() => this._openCapsuleDetail(capsuleId), 300);
        if (isAuto) console.log(`✅ 自动生成岁月胶囊：${titleMap[type]}`);

    } catch(e) {
        console.error('岁月胶囊生成失败:', e);
        if (!isAuto) { this._renderCapsuleList(); alert('❌ 报告生成失败：' + e.message); }
    }
};

ChatInterface.prototype._getCapsuleStartDate = function(type, now) {
    const d = new Date(now);
    if (type==='weekly') d.setDate(d.getDate()-7);
    else if (type==='monthly') d.setMonth(d.getMonth()-1);
    else d.setFullYear(d.getFullYear()-1);
    return d;
};
ChatInterface.prototype._getWeekNumber = function(date) {
    const d = new Date(date);
    d.setHours(0,0,0,0); d.setDate(d.getDate()+3-(d.getDay()+6)%7);
    const w1 = new Date(d.getFullYear(),0,4);
    return 1+Math.round(((d.getTime()-w1.getTime())/86400000-3+(w1.getDay()+6)%7)/7);
};


// ================================================================
//  星迹留痕
// ================================================================

ChatInterface.prototype._renderStarTrailSection = function() {
    const intimacyContent = document.getElementById('intimacyContent');
    if (!intimacyContent) return;
    let section = document.getElementById('starTrailSection');
    if (!section) {
        section = document.createElement('div');
        section.id = 'starTrailSection';
        section.className = 'star-trail-section';
        intimacyContent.appendChild(section);
    }
    const events = this.storage.getStarTrailEvents(this.currentFriendCode);
    if (events.length === 0) {
        section.innerHTML = `<div class="star-trail-title">✨ 星迹留痕</div><div class="star-trail-empty">还没有任何记录</div>`;
        return;
    }
    const eventsHTML = events.map(ev => {
        const icon = {charm_draw:'🎴',charm_wear:'💍',charm_full:'⭐',badge_unlock:'🏅',relationship_bind:'💑',capsule_gen:'📅'}[ev.type]||'✨';
        return `<div class="star-trail-event" data-id="${ev.id}">
            <div class="star-trail-event-header">
                <div class="star-trail-event-icon">${icon}</div>
                <div class="star-trail-event-info">
                    <div class="star-trail-event-title">${this._esc(ev.title)}</div>
                    <div class="star-trail-event-date">${ev.date}</div>
                </div>
                <div class="star-trail-event-arrow">›</div>
            </div>
            <div class="star-trail-event-detail">
                ${ev.userMessage ? `<div class="star-trail-liuyan-row"><div class="star-trail-liuyan-label">我说</div><div class="star-trail-liuyan-text">${this._esc(ev.userMessage)}</div></div>` : ''}
                ${ev.aiMessage   ? `<div class="star-trail-liuyan-row"><div class="star-trail-liuyan-label">TA说</div><div class="star-trail-liuyan-text">${this._esc(ev.aiMessage)}</div></div>`   : ''}
                <button class="star-trail-liuyan-btn" data-id="${ev.id}">✏️ 写寄语</button>
            </div>
        </div>`;
    }).join('');
    section.innerHTML = `<div class="star-trail-title">✨ 星迹留痕</div><div class="star-trail-list">${eventsHTML}</div>`;
    section.querySelectorAll('.star-trail-event-header').forEach(h => {
        h.addEventListener('click', () => h.closest('.star-trail-event').classList.toggle('expanded'));
    });
    section.querySelectorAll('.star-trail-liuyan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); this._openStarTrailMsgModal(btn.getAttribute('data-id')); });
    });
};

ChatInterface.prototype._openStarTrailMsgModal = function(eventId) {
    const modal = document.getElementById('starTrailMsgModal');
    if (!modal) return;
    const ev = this.storage.getStarTrailEvents(this.currentFriendCode).find(e=>e.id===eventId);
    if (!ev) return;
    this._currentStarEventId = eventId;
    document.getElementById('starMsgUserInput').value   = ev.userMessage || '';
    document.getElementById('starMsgAiText').textContent = ev.aiMessage   || '（TA还没有留言）';
    modal.style.display = 'flex';
    if (!this._starMsgEventsB) { this._bindStarMsgEvents(); this._starMsgEventsB = true; }
};

ChatInterface.prototype._bindStarMsgEvents = function() {
    document.getElementById('starMsgClose')?.addEventListener('click',  () => { document.getElementById('starTrailMsgModal').style.display='none'; });
    document.getElementById('starMsgCancel')?.addEventListener('click', () => { document.getElementById('starTrailMsgModal').style.display='none'; });
    document.getElementById('starMsgGenBtn')?.addEventListener('click', async (e) => {
        e.target.disabled=true; e.target.textContent='生成中…';
        const msg = await this._generateAiLiuyan('star_trail');
        document.getElementById('starMsgAiText').textContent = msg || '（生成失败）';
        e.target.disabled=false; e.target.textContent='重新生成';
    });
    document.getElementById('starMsgSave')?.addEventListener('click', () => {
        if (!this._currentStarEventId) return;
        const userMsg = document.getElementById('starMsgUserInput')?.value.trim();
        const aiMsg   = document.getElementById('starMsgAiText')?.textContent;
        this.storage.updateStarTrailEvent(this.currentFriendCode, this._currentStarEventId, {
            userMessage: userMsg,
            aiMessage: (aiMsg==='（TA还没有留言）'||aiMsg==='（生成失败）') ? '' : aiMsg
        });
        document.getElementById('starTrailMsgModal').style.display = 'none';
        this._renderStarTrailSection();
    });
};


// ================================================================
//  钩子
// ================================================================

const _origLoadIntimacyPanel = ChatInterface.prototype.loadIntimacyPanel;
ChatInterface.prototype.loadIntimacyPanel = function() {
    _origLoadIntimacyPanel.call(this);
    setTimeout(() => this._renderStarTrailSection(), 0);
};

const _origIncrementV3 = ChatInterface.prototype.incrementIntimacyRound;
ChatInterface.prototype.incrementIntimacyRound = function(aiResponseText) {
    _origIncrementV3.call(this);
    this._advanceLuckyCharProgress();
    this._aiDrawLuckyChar();
    if ((this.storage.getIntimacyData(this.currentFriendCode)?.totalRounds||0) % 10 === 0) {
        this._checkAndUnlockBadges();
    }
    // 检测关系绑定的同意/拒绝
    if (aiResponseText && this._relWatchActive) {
        this._checkRelResponseInAiMsg(aiResponseText);
    }
};


console.log('✅ intimacy-modules.js v2 已加载');