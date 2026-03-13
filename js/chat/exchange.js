/* ============================================================
   exchange.js — 跨次元兑换所
   子模块：未来的事 / 亲密基金 / 网购 / 外卖 / 我们的信
         / 许愿星小铺
   ============================================================ */

class ExchangeManager {
    // ── 内置货币列表 ──
    static CURRENCIES = [
        { code: 'star',  label: '🌟 许愿星', symbol: '⭐' },
        { code: 'CNY',   label: '🇨🇳 人民币 ¥', symbol: '¥' },
        { code: 'USD',   label: '🇺🇸 美元 $',   symbol: '$' },
        { code: 'EUR',   label: '🇪🇺 欧元 €',   symbol: '€' },
        { code: 'GBP',   label: '🇬🇧 英镑 £',   symbol: '£' },
        { code: 'JPY',   label: '🇯🇵 日元 ¥',   symbol: '¥' },
        { code: 'KRW',   label: '🇰🇷 韩元 ₩',   symbol: '₩' },
        { code: 'HKD',   label: '🇭🇰 港元 HK$', symbol: 'HK$' },
    ];

    // ── storage key ──
    _key(fc) { return `zero_phone_exchange_${fc}`; }

    _load(fc) {
        try {
            const raw = localStorage.getItem(this._key(fc));
            if (raw) return JSON.parse(raw);
        } catch(e) {}
        return this._defaultData();
    }

    _save(fc, data) {
        try { localStorage.setItem(this._key(fc), JSON.stringify(data)); }
        catch(e) { console.warn('跨次元兑换所存储失败:', e); }
    }

    _defaultData() {
        return {
            bgImage: '',
            shopDecorUser: '',   // user写的小铺CSS
            shopDecorAI: '',     // AI写的小铺CSS
            stars: { userBalance: 0, aiBalance: 0 },
            items: [],           // 所有条目
        };
    }

    // ── 构造函数 ──
    constructor(chatInterface) {
        this.ci = chatInterface;
        this.friendCode = null;
        this.panelEl = null;
        this.activeTab = 'todo';   // 当前显示的子模块
        this._evBound = false;
        this._shopDecorStyle = null; // 动态注入的 <style>
    }

    // ═══════════════════════════════════════════════════
    //  面板开关
    // ═══════════════════════════════════════════════════

    open(friendCode) {
        this.friendCode = friendCode;
        this.panelEl = document.getElementById('exPanel');
        if (!this.panelEl) return;
        this.panelEl.style.display = 'flex';
        if (!this._evBound) { this._bindEvents(); this._evBound = true; }
        this._renderAll();
    }

    close() {
        if (this.panelEl) this.panelEl.style.display = 'none';
    }

    // ═══════════════════════════════════════════════════
    //  渲染入口
    // ═══════════════════════════════════════════════════

    _renderAll() {
        const data = this._load(this.friendCode);
        this._applyBg(data);
        this._applyShopDecor(data);
        this._renderStars(data);
        this._renderTab(this.activeTab, data);
        this._updateTabBtns();
    }

    _renderTab(tab, data) {
        this.activeTab = tab;
        const body = document.getElementById('ex-body');
        if (!body) return;
        if (!data) data = this._load(this.friendCode);

        switch(tab) {
            case 'todo':     body.innerHTML = this._htmlTodo(data); break;
            case 'fund':     body.innerHTML = this._htmlFund(data); break;
            case 'shop':     body.innerHTML = this._htmlShop(data); break;
            case 'delivery': body.innerHTML = this._htmlDelivery(data); break;
            case 'letter':   body.innerHTML = this._htmlLetter(data); break;
            case 'starshop': body.innerHTML = this._htmlStarShop(data); break;
        }
        this._bindBodyEvents(data);
    }

    _updateTabBtns() {
        document.querySelectorAll('.ex-tab-btn').forEach(btn => {
            btn.classList.toggle('ex-tab-active', btn.dataset.tab === this.activeTab);
        });
    }

    // ═══════════════════════════════════════════════════
    //  背景图
    // ═══════════════════════════════════════════════════

    _applyBg(data) {
        const bg = document.getElementById('ex-bg');
        if (!bg) return;
        bg.style.backgroundImage = data.bgImage ? `url('${data.bgImage}')` : '';
    }

    // 压缩图片（最长边≤800px，质量0.45），返回 Promise<dataURL>
    _compressImage(src, maxSize = 800, quality = 0.45) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.naturalWidth, h = img.naturalHeight;
                if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize; } }
                else       { if (h > maxSize) { w = w * maxSize / h; h = maxSize; } }
                canvas.width = Math.round(w);
                canvas.height = Math.round(h);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(src);
            img.src = src;
        });
    }

    setBgImage(src) {
        this._compressImage(src, 800, 0.45).then(compressed => {
            const data = this._load(this.friendCode);
            data.bgImage = compressed;
            this._save(this.friendCode, data);
            this._applyBg(data);
        });
    }

    clearBgImage() {
        const data = this._load(this.friendCode);
        data.bgImage = '';
        this._save(this.friendCode, data);
        this._applyBg(data);
    }

    // ═══════════════════════════════════════════════════
    //  小铺装修 CSS
    // ═══════════════════════════════════════════════════

    _applyShopDecor(data) {
        if (!this._shopDecorStyle) {
            this._shopDecorStyle = document.createElement('style');
            this._shopDecorStyle.id = 'ex-shop-decor-style';
            document.head.appendChild(this._shopDecorStyle);
        }
        const combined = (data.shopDecorUser || '') + '\n' + (data.shopDecorAI || '');
        this._shopDecorStyle.textContent = combined;
    }

    setShopDecorUser(css) {
        const data = this._load(this.friendCode);
        data.shopDecorUser = css;
        this._save(this.friendCode, data);
        this._applyShopDecor(data);
    }

    // AI指令调用
    aiSetShopDecor(friendCode, css) {
        const data = this._load(friendCode);
        data.shopDecorAI = css;
        this._save(friendCode, data);
        this._applyShopDecor(data);
    }

    // ═══════════════════════════════════════════════════
    //  许愿星
    // ═══════════════════════════════════════════════════

    _renderStars(data) {
        const el = document.getElementById('ex-stars-display');
        if (!el) return;
        el.innerHTML = `
            <span class="ex-star-item">⭐ 我的许愿星 <b>${data.stars.userBalance}</b></span>
            <span class="ex-star-sep">·</span>
            <span class="ex-star-item">✦ TA的许愿星 <b>${data.stars.aiBalance}</b></span>`;
    }

    // AI给user许愿星
    aiGiveStar(friendCode, amount) {
        const data = this._load(friendCode);
        data.stars.userBalance += amount;
        this._save(friendCode, data);
        this._renderStars(data);
        window.ZeroEquip?.refreshAll(friendCode);
        if (window.MilestoneTimeline) {
            window.MilestoneTimeline.addRecord(friendCode, {
                type: 'star_received',
                date: new Date().toISOString(),
                payload: { from: 'ai', amount },
            });
        }
    }

    // User给AI许愿星
    _userGiveStar(amount) {
        const data = this._load(this.friendCode);
        if (data.stars.userBalance < amount) { this._showToast('你的许愿星不够哦'); return; }
        data.stars.userBalance -= amount;
        data.stars.aiBalance   += amount;
        this._save(this.friendCode, data);
        this._renderStars(data);
        this._showToast(`✨ 给TA转了 ${amount} 颗许愿星`);
        if (window.MilestoneTimeline) {
            window.MilestoneTimeline.addRecord(this.friendCode, {
                type: 'star_received',
                date: new Date().toISOString(),
                payload: { from: 'user', amount },
            });
        }
    }

    // ═══════════════════════════════════════════════════
    //  通用 item 操作
    // ═══════════════════════════════════════════════════

    _newItem(overrides) {
        return {
            id: 'ex_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
            module: '',
            from: 'user',
            to: 'ai',
            content: '',
            note: '',
            attachments: [],
            currency: 'CNY',
            amount: 0,
            sendAt: null,
            openAt: null,
            sealed: false,
            price: 1,
            status: 'active',
            doneAt: null,
            doneNote: '',
            doneImg: '',
            createdAt: new Date().toISOString(),
            ...overrides,
        };
    }

    _addItem(item) {
        const data = this._load(this.friendCode);
        data.items.push(item);
        this._save(this.friendCode, data);
    }

    _updateItem(id, patch) {
        const data = this._load(this.friendCode);
        const idx = data.items.findIndex(i => i.id === id);
        if (idx === -1) return;
        data.items[idx] = { ...data.items[idx], ...patch };
        this._save(this.friendCode, data);
        return data.items[idx];
    }

    _getItems(fc, module) {
        const data = this._load(fc);
        return data.items.filter(i => i.module === module);
    }

    // ═══════════════════════════════════════════════════
    //  格式化工具
    // ═══════════════════════════════════════════════════

    _fmtDate(iso) {
        if (!iso) return '';
        try {
            const d = new Date(iso);
            if (window.ZeroTime) return window.ZeroTime.formatFull(d).slice(0,16);
            return d.toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
        } catch(e) { return ''; }
    }

    _currSymbol(code) {
        return ExchangeManager.CURRENCIES.find(c => c.code === code)?.symbol || code;
    }

    // ═══════════════════════════════════════════════════
    //  ① 未来的事
    // ═══════════════════════════════════════════════════

    _htmlTodo(data) {
        const items = data.items.filter(i => i.module === 'todo');

        // 分组：AI做 / user做 / 一起做
        const forAI   = items.filter(i => i.from === 'user' && i.to === 'ai');
        const forUser = items.filter(i => i.from === 'ai'   && i.to === 'user');
        const both    = items.filter(i => i.to === 'both');

        const renderGroup = (list, emptyText) => {
            if (!list.length) return `<div class="ex-empty">${emptyText}</div>`;
            return list.map(item => this._htmlTodoItem(item)).join('');
        };

        return `
        <!-- ★ 关键类名：
             .ex-todo-section  分组容器
             .ex-todo-item     每一条待办
             .ex-todo-done     已完成状态
             .ex-todo-check    勾选按钮
        -->
        <div class="ex-todo-wrap">
            <div class="ex-group-header">✦ 我让TA做的事</div>
            <div class="ex-todo-section" id="ex-todo-for-ai">
                ${renderGroup(forAI, '还没有给TA布置任务～')}
            </div>
            <button class="ex-add-btn" id="ex-todo-add-forai-btn">＋ 布置给TA</button>

            <div class="ex-group-header">✦ TA让我做的事</div>
            <div class="ex-todo-section" id="ex-todo-for-user">
                ${renderGroup(forUser, 'TA还没有给你布置任务～')}
            </div>

            <div class="ex-group-header">✦ 我们一起做</div>
            <div class="ex-todo-section" id="ex-todo-both">
                ${renderGroup(both, '还没有一起要做的事～')}
            </div>
            <button class="ex-add-btn" id="ex-todo-add-both-btn">＋ 一起做的事</button>
        </div>`;
    }

    _htmlTodoItem(item) {
        const isDone = item.status === 'done';
        const isWithdrawn = item.status === 'withdrawn';
        const canComplete = !isDone && !isWithdrawn && (
            (item.to === 'ai' && false) ||  // ai的只能AI完成
            (item.to === 'user') ||
            (item.to === 'both')
        );
        // user只能完成自己要做的部分（to=user 或 to=both）
        const userCanComplete = !isDone && !isWithdrawn && (item.to === 'user' || item.to === 'both');
        const userCanWithdraw = !isDone && !isWithdrawn && item.from === 'user';

        let doneInfo = '';
        if (isDone && item.doneNote) doneInfo += `<div class="ex-done-note">💬 ${item.doneNote}</div>`;
        if (isDone && item.doneImg)  doneInfo += `<div class="ex-done-img-wrap"><img src="${item.doneImg}" class="ex-done-img" onclick="this.style.transform=this.style.transform?'':'scale(2)';"></div>`;
        if (isDone && item.doneAt)   doneInfo += `<div class="ex-done-time">✓ ${this._fmtDate(item.doneAt)}</div>`;

        return `
        <div class="ex-todo-item ${isDone ? 'ex-todo-done' : ''} ${isWithdrawn ? 'ex-todo-withdrawn' : ''}" data-id="${item.id}">
            <div class="ex-todo-main">
                ${userCanComplete
                    ? `<button class="ex-todo-check" onclick="window.Exchange._completeTodo('${item.id}')">○</button>`
                    : isDone ? `<span class="ex-todo-checked">✓</span>` : `<span class="ex-todo-dot">·</span>`
                }
                <div class="ex-todo-content">${this._esc(item.content)}</div>
                <div class="ex-todo-actions">
                    ${userCanWithdraw ? `<button class="ex-item-withdraw-btn" onclick="window.Exchange._withdrawItem('${item.id}')">撤销</button>` : ''}
                    ${isWithdrawn ? '<span class="ex-withdrawn-label">已撤销</span>' : ''}
                </div>
            </div>
            ${doneInfo}
        </div>`;
    }

    _completeTodo(id) {
        // 弹出打卡弹窗
        this._openCheckinModal(id);
    }

    // ═══════════════════════════════════════════════════
    //  ② 亲密基金
    // ═══════════════════════════════════════════════════

    _htmlFund(data) {
        const items = data.items.filter(i => i.module === 'fund' && i.status !== 'withdrawn');
        const total = items.reduce((s, i) => {
            if (i.currency !== 'star') return s;
            return s + (i.from === 'ai' ? i.amount : -i.amount);
        }, 0);

        const rows = items.length
            ? items.map(item => {
                const sym = this._currSymbol(item.currency);
                const isDone = item.status === 'done';
                const fromLabel = item.from === 'ai' ? 'TA → 我' : '我 → TA';
                return `
                <div class="ex-fund-item ${isDone ? 'ex-fund-done' : ''}" data-id="${item.id}">
                    <div class="ex-fund-row1">
                        <span class="ex-fund-from">${fromLabel}</span>
                        <span class="ex-fund-amount">${sym}${item.amount}</span>
                        <span class="ex-fund-date">${this._fmtDate(item.createdAt)}</span>
                    </div>
                    ${item.content ? `<div class="ex-fund-note">${this._esc(item.content)}</div>` : ''}
                    ${!isDone ? `<button class="ex-fund-take-btn" onclick="window.Exchange._takeFund('${item.id}')">取出</button>` : `<span class="ex-fund-taken">已取出 ${this._fmtDate(item.doneAt)}</span>`}
                </div>`;
            }).join('')
            : `<div class="ex-empty">基金罐空空的～</div>`;

        return `
        <!-- ★ 关键类名：
             .ex-fund-item    每一条存款
             .ex-fund-done    已取出
             .ex-fund-amount  金额
        -->
        <div class="ex-fund-wrap">
            <div class="ex-fund-header">
                <span class="ex-fund-title">🪙 亲密基金</span>
            </div>
            <div id="ex-fund-list">${rows}</div>
            <button class="ex-add-btn" id="ex-fund-add-btn">＋ 我存给TA</button>
        </div>`;
    }

    _takeFund(id) {
        const data = this._load(this.friendCode);
        const item = data.items.find(i => i.id === id);
        if (!item || item.status === 'done') return;
        item.status = 'done';
        item.doneAt = new Date().toISOString();
        this._save(this.friendCode, data);
        this._notifyComplete(item);
        this._renderTab('fund', data);
        this._showToast('💸 已取出！');
    }

    // ═══════════════════════════════════════════════════
    //  ③ 网购
    // ═══════════════════════════════════════════════════

    _htmlShop(data) {
        return this._htmlDeliveryLike(data, 'shop', '🛍️ 网购', '包裹', '＋ 寄存给TA');
    }

    // ④ 外卖
    _htmlDelivery(data) {
        return this._htmlDeliveryLike(data, 'delivery', '🥡 外卖', '外卖', '＋ 点给TA');
    }

    _htmlDeliveryLike(data, module, title, itemLabel, addLabel) {
        // user只能送给AI，AI送给user的在这里也显示
        const fromAI   = data.items.filter(i => i.module === module && i.from === 'ai');
        const fromUser = data.items.filter(i => i.module === module && i.from === 'user');

        const renderList = (list, canComplete) => list.length
            ? list.map(item => {
                const isDone = item.status === 'done';
                const isWithdrawn = item.status === 'withdrawn';
                const userCanComplete = canComplete && !isDone && !isWithdrawn;
                const userCanWithdraw = item.from === 'user' && !isDone && !isWithdrawn;

                let doneInfo = '';
                if (isDone && item.doneImg)  doneInfo += `<img src="${item.doneImg}" class="ex-done-img">`;
                if (isDone && item.doneNote) doneInfo += `<div class="ex-done-note">💬 ${item.doneNote}</div>`;
                if (isDone && item.doneAt)   doneInfo += `<div class="ex-done-time">✓ ${this._fmtDate(item.doneAt)}</div>`;

                return `
                <div class="ex-delivery-item ${isDone ? 'ex-done' : ''} ${isWithdrawn ? 'ex-withdrawn' : ''}" data-id="${item.id}">
                    <div class="ex-delivery-content">${this._esc(item.content)}</div>
                    ${item.attachments?.length ? `<div class="ex-attachments">${item.attachments.map(a => `<img src="${a}" class="ex-attach-thumb" onclick="window.Exchange._previewImg('${a}')">`).join('')}</div>` : ''}
                    <div class="ex-item-footer">
                        <span class="ex-item-date">${this._fmtDate(item.createdAt)}</span>
                        <div class="ex-item-actions">
                            ${userCanComplete ? `<button class="ex-complete-btn" onclick="window.Exchange._openCheckinModal('${item.id}')">打卡收到了</button>` : ''}
                            ${userCanWithdraw ? `<button class="ex-item-withdraw-btn" onclick="window.Exchange._withdrawItem('${item.id}')">撤销</button>` : ''}
                            ${isWithdrawn ? '<span class="ex-withdrawn-label">已撤销</span>' : ''}
                        </div>
                    </div>
                    ${doneInfo}
                </div>`;
            }).join('')
            : `<div class="ex-empty">空空的～</div>`;

        return `
        <!-- ★ 关键类名：
             .ex-delivery-item   每一条
             .ex-done            已完成
             .ex-delivery-content 内容
        -->
        <div class="ex-delivery-wrap">
            <div class="ex-group-header">✦ TA送给我的</div>
            ${renderList(fromAI, true)}

            <div class="ex-group-header">✦ 我送给TA的</div>
            ${renderList(fromUser, false)}
            <button class="ex-add-btn" id="ex-delivery-add-btn">${addLabel}</button>
        </div>`;
    }

    // ═══════════════════════════════════════════════════
    //  ⑤ 我们的信
    // ═══════════════════════════════════════════════════

    _htmlLetter(data) {
        const letters = data.items.filter(i => i.module === 'letter');
        const now = new Date();

        const rows = letters.length
            ? letters.map(item => {
                const isSealed = item.sealed && new Date(item.openAt) > now;
                const isDone = item.status === 'done';
                const isWithdrawn = item.status === 'withdrawn';
                const fromLabel = item.from === 'user' ? '我' : 'TA';
                const toLabel   = item.to === 'future_user' ? '未来的我'
                                : item.to === 'future_ai'   ? '未来的TA'
                                : item.to === 'user'        ? '我'
                                :                              'TA';
                const canOpen = !isSealed && !isDone && item.to === 'user';

                return `
                <div class="ex-letter-item ${isSealed ? 'ex-letter-sealed' : ''} ${isDone ? 'ex-letter-opened' : ''}" data-id="${item.id}">
                    <div class="ex-letter-header">
                        <span class="ex-letter-envelope">✉️</span>
                        <div class="ex-letter-meta">
                            <span class="ex-letter-from">${fromLabel} → ${toLabel}</span>
                            ${item.openAt ? `<span class="ex-letter-open-time">${isSealed ? '🔒 ' + this._fmtDate(item.openAt) + ' 开启' : '📬 ' + this._fmtDate(item.openAt) + ' 已到'}</span>` : ''}
                        </div>
                        ${!isDone && !isWithdrawn && item.from === 'user' ? `<button class="ex-item-withdraw-btn" onclick="window.Exchange._withdrawItem('${item.id}')">撤销</button>` : ''}
                    </div>
                    ${isSealed
                        ? `<div class="ex-letter-sealed-msg">📮 还没到约定的时间，信正在等待中...</div>`
                        : `<div class="ex-letter-body">${this._esc(item.content)}</div>`
                    }
                    ${canOpen && !isSealed ? `<button class="ex-letter-open-btn" onclick="window.Exchange._openLetter('${item.id}')">拆开这封信</button>` : ''}
                    ${isDone ? `<div class="ex-letter-opened-label">✓ 已阅 ${this._fmtDate(item.doneAt)}</div>` : ''}
                    ${isWithdrawn ? `<div class="ex-withdrawn-label">已撤回</div>` : ''}
                </div>`;
            }).join('')
            : `<div class="ex-empty">信箱空空的，写一封吧～</div>`;

        return `
        <!-- ★ 关键类名：
             .ex-letter-item    每封信
             .ex-letter-sealed  封印中
             .ex-letter-opened  已开启
             .ex-letter-body    信的内容
        -->
        <div class="ex-letter-wrap">
            ${rows}
            <button class="ex-add-btn" id="ex-letter-add-btn">✉️ 写一封信</button>
        </div>`;
    }

    _openLetter(id) {
        const data = this._load(this.friendCode);
        const item = data.items.find(i => i.id === id);
        if (!item) return;
        item.status = 'done';
        item.doneAt = new Date().toISOString();
        this._save(this.friendCode, data);
        this._notifyComplete(item);
        if (window.MilestoneTimeline) {
            window.MilestoneTimeline.addRecord(this.friendCode, {
                type: 'letter_opened',
                date: new Date().toISOString(),
                payload: { from: item.from, content: item.content.slice(0, 30) },
            });
        }
        this._renderTab('letter', data);
        this._showToast('📬 信已开启！');
    }

    // ═══════════════════════════════════════════════════
    //  ⑥ 许愿星小铺
    // ═══════════════════════════════════════════════════

    _htmlStarShop(data) {
        // user上架的 = AI可以购买（AI做的事）
        // AI上架的  = user可以购买（user可以做的事）
        const forAI   = data.items.filter(i => i.module === 'starshop' && i.from === 'user' && i.status === 'active');  // user上架，AI买
        const forUser = data.items.filter(i => i.module === 'starshop' && i.from === 'ai'   && i.status === 'active');  // AI上架，user买
        const redeemed = data.items.filter(i => i.module === 'starshop' && i.status === 'done');

        const renderShelf = (list, buyerIsUser, myShelf) => {
            if (!list.length) return `<div class="ex-empty">货架空空的～</div>`;
            return list.map(item => {
                const canBuy = buyerIsUser;
                const canDelist = myShelf;
                return `
                <div class="ex-shop-item" data-id="${item.id}">
                    <div class="ex-shop-item-content">${this._esc(item.content)}</div>
                    <div class="ex-shop-item-footer">
                        <span class="ex-shop-price">⭐ × ${item.price}</span>
                        <div class="ex-shop-actions">
                            ${canBuy    ? `<button class="ex-shop-buy-btn" onclick="window.Exchange._redeemWish('${item.id}')">兑换愿望</button>` : ''}
                            ${canDelist ? `<button class="ex-item-withdraw-btn" onclick="window.Exchange._delistWish('${item.id}')">下架</button>` : ''}
                        </div>
                    </div>
                </div>`;
            }).join('');
        };

        const renderHistory = () => {
            if (!redeemed.length) return '';
            return `
            <div class="ex-group-header">✦ 已兑换</div>
            ${redeemed.map(item => `
            <div class="ex-shop-item ex-shop-done" data-id="${item.id}">
                <div class="ex-shop-item-content">${this._esc(item.content)}</div>
                <div class="ex-shop-item-footer">
                    <span class="ex-shop-price">⭐ × ${item.price}</span>
                    <span class="ex-shop-done-time">✓ ${this._fmtDate(item.doneAt)}</span>
                </div>
                ${item.doneNote ? `<div class="ex-done-note">💬 ${this._esc(item.doneNote)}</div>` : ''}
            </div>`).join('')}`;
        };

        return `
        <!-- ★ 关键类名（装修用）：
             #ex-starshop-wrap        整个小铺容器
             .ex-starshop-ai-shelf    AI货架区
             .ex-starshop-user-shelf  user货架区
             .ex-shop-item            每个愿望卡片
             .ex-shop-price           价格标签
             .ex-shop-buy-btn         兑换按钮
        -->
        <div id="ex-starshop-wrap">
            <div class="ex-starshop-header">
                <span class="ex-starshop-title">🌟 许愿星小铺</span>
                <div class="ex-star-balance">我的许愿星：<b>${data.stars.userBalance}</b> ⭐</div>
            </div>

            <div class="ex-starshop-user-shelf">
                <div class="ex-group-header">✦ TA上架的愿望（我可以兑换）</div>
                ${renderShelf(forUser, true, false)}
            </div>

            <div class="ex-starshop-ai-shelf">
                <div class="ex-group-header">✦ 我上架的愿望（TA可以兑换）</div>
                ${renderShelf(forAI, false, true)}
                <button class="ex-add-btn" id="ex-starshop-add-btn">＋ 上架新愿望</button>
            </div>

            ${renderHistory()}

            <div class="ex-starshop-decor-section">
                <div class="ex-group-header">🎨 小铺装修</div>
                <div class="ex-decor-classnames">
                    <div class="ex-decor-classnames-title">📋 可用类名（复制给AI或粘贴到装修框）</div>
                    <div class="ex-decor-classnames-grid">
                        <code>#ex-starshop-wrap</code><span>整个小铺容器</span>
                        <code>.ex-starshop-user-shelf</code><span>TA上架的货架区</span>
                        <code>.ex-starshop-ai-shelf</code><span>我上架的货架区</span>
                        <code>.ex-shop-item</code><span>每张愿望卡片</span>
                        <code>.ex-shop-item-content</code><span>卡片内容文字</span>
                        <code>.ex-shop-price</code><span>许愿星价格标签</span>
                        <code>.ex-shop-buy-btn</code><span>兑换按钮</span>
                        <code>.ex-group-header</code><span>分区标题</span>
                        <code>.ex-starshop-title</code><span>小铺大标题</span>
                        <code>.ex-star-balance</code><span>余额显示</span>
                    </div>
                </div>
                <textarea class="ex-decor-input" id="ex-decor-css-input" placeholder="在这里输入CSS代码装修小铺，或请AI写好后粘贴进来...">${data.shopDecorUser || ''}</textarea>
                <button class="ex-decor-apply-btn" id="ex-decor-apply-btn">应用装修</button>
            </div>
        </div>`;
    }

    _redeemWish(id) {
        const data = this._load(this.friendCode);
        const item = data.items.find(i => i.id === id);
        if (!item || item.status !== 'active') return;
        if (data.stars.userBalance < item.price) {
            this._showToast(`许愿星不足，还差 ${item.price - data.stars.userBalance} 颗`);
            return;
        }
        data.stars.userBalance -= item.price;
        item.status = 'done';
        item.doneAt = new Date().toISOString();
        this._save(this.friendCode, data);
        this._renderStars(data);
        this._notifyComplete(item);
        if (window.MilestoneTimeline) {
            window.MilestoneTimeline.addRecord(this.friendCode, {
                type: 'shop_redeemed',
                date: new Date().toISOString(),
                payload: { content: item.content, price: item.price },
            });
        }
        this._renderTab('starshop', data);
        this._showToast(`🌟 兑换成功！消耗 ${item.price} 颗许愿星`);
    }

    _delistWish(id) {
        this._withdrawItem(id);
        this._showToast('已下架');
    }

    // ═══════════════════════════════════════════════════
    //  打卡弹窗
    // ═══════════════════════════════════════════════════

    _openCheckinModal(itemId) {
        let m = document.getElementById('exCheckinModal');
        if (!m) return;
        m.style.display = 'flex';
        m._itemId = itemId;
        // 清空
        const noteEl = document.getElementById('ex-checkin-note');
        const imgPreview = document.getElementById('ex-checkin-img-preview');
        if (noteEl) noteEl.value = '';
        if (imgPreview) { imgPreview.src = ''; imgPreview.style.display = 'none'; }
        this._checkinImgSrc = null;
    }

    _closeCheckinModal() {
        const m = document.getElementById('exCheckinModal');
        if (m) m.style.display = 'none';
    }

    _submitCheckin() {
        const m = document.getElementById('exCheckinModal');
        if (!m || !m._itemId) return;
        const noteEl = document.getElementById('ex-checkin-note');
        const note = noteEl ? noteEl.value.trim() : '';
        // 压缩打卡图片再存
        const doSubmit = (img) => {
            const data = this._load(this.friendCode);
            const item = data.items.find(i => i.id === m._itemId);
            if (!item) return;
            item.status = 'done';
            item.doneAt = new Date().toISOString();
            item.doneNote = note;
            item.doneImg  = img;
            this._save(this.friendCode, data);
            this._closeCheckinModal();
            this._notifyComplete(item);
            if (window.MilestoneTimeline) {
                window.MilestoneTimeline.addRecord(this.friendCode, {
                    type: 'exchange_done',
                    date: new Date().toISOString(),
                    payload: { module: item.module, content: item.content.slice(0, 30), note },
                });
            }
            this._renderTab(this.activeTab, data);
            this._showToast('✓ 打卡成功！');
        };
        const rawImg = this._checkinImgSrc || '';
        if (rawImg) {
            this._compressImage(rawImg, 600, 0.5).then(doSubmit);
        } else {
            doSubmit('');
        }
        return; // 下面旧逻辑跳过
    }

    // ═══════════════════════════════════════════════════
    //  通知（打卡/完成后通知AI）
    // ═══════════════════════════════════════════════════

    _notifyComplete(item) {
        // 注入系统消息到聊天
        const moduleNames = { todo:'待办', fund:'亲密基金', shop:'网购', delivery:'外卖', letter:'信件', starshop:'许愿星小铺' };
        const mName = moduleNames[item.module] || item.module;
        const sysText = `[系统] 跨次元兑换所 · ${mName}：「${item.content.slice(0,20)}」已完成打卡 ✓`;
        if (this.ci) {
            this.ci.addMessage({ type: 'system', text: sysText, timestamp: new Date().toISOString() });
            this.ci.storage.addMessage(this.friendCode, { type: 'system', text: sysText, timestamp: new Date().toISOString() });
        }
    }

    // ═══════════════════════════════════════════════════
    //  撤销
    // ═══════════════════════════════════════════════════

    _withdrawItem(id) {
        const data = this._load(this.friendCode);
        const item = data.items.find(i => i.id === id);
        if (!item) return;
        item.status = 'withdrawn';
        this._save(this.friendCode, data);
        this._renderTab(this.activeTab, data);
        this._showToast('已撤销');
    }

    // ═══════════════════════════════════════════════════
    //  图片预览
    // ═══════════════════════════════════════════════════

    _previewImg(src) {
        let m = document.getElementById('exImgPreviewModal');
        if (!m) {
            m = document.createElement('div');
            m.id = 'exImgPreviewModal';
            Object.assign(m.style, {
                display:'none', position:'fixed', inset:'0', zIndex:'9999',
                background:'rgba(0,0,0,0.85)', alignItems:'center', justifyContent:'center',
            });
            m.innerHTML = `<img id="exPreviewImg" style="max-width:90vw;max-height:90vh;border-radius:8px;">`;
            m.addEventListener('click', () => { m.style.display = 'none'; });
            document.body.appendChild(m);
        }
        document.getElementById('exPreviewImg').src = src;
        m.style.display = 'flex';
    }

    // ═══════════════════════════════════════════════════
    //  事件绑定
    // ═══════════════════════════════════════════════════

    _bindEvents() {
        // 关闭按钮
        const closeBtn = document.getElementById('exPanelClose');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());

        // Tab切换
        document.querySelectorAll('.ex-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._renderTab(btn.dataset.tab);
                this._updateTabBtns();
            });
        });

        // 背景图按钮
        const bgBtn = document.getElementById('ex-bg-btn');
        if (bgBtn) bgBtn.addEventListener('click', () => this._openBgModal());

        // 打卡弹窗
        const checkinConfirm = document.getElementById('ex-checkin-confirm');
        if (checkinConfirm) checkinConfirm.addEventListener('click', () => this._submitCheckin());
        const checkinCancel = document.getElementById('ex-checkin-cancel');
        if (checkinCancel) checkinCancel.addEventListener('click', () => this._closeCheckinModal());
        const checkinImgInput = document.getElementById('ex-checkin-img-input');
        if (checkinImgInput) checkinImgInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                this._checkinImgSrc = ev.target.result;
                const preview = document.getElementById('ex-checkin-img-preview');
                if (preview) { preview.src = ev.target.result; preview.style.display = 'block'; }
            };
            reader.readAsDataURL(file);
        });
    }

    _bindBodyEvents(data) {
        // 未来的事 - 布置给TA
        const todoAddAI = document.getElementById('ex-todo-add-forai-btn');
        if (todoAddAI) todoAddAI.addEventListener('click', () => this._openAddModal('todo', 'user', 'ai'));

        // 未来的事 - 一起做
        const todoAddBoth = document.getElementById('ex-todo-add-both-btn');
        if (todoAddBoth) todoAddBoth.addEventListener('click', () => this._openAddModal('todo', 'user', 'both'));

        // 亲密基金 - 存给TA
        const fundAdd = document.getElementById('ex-fund-add-btn');
        if (fundAdd) fundAdd.addEventListener('click', () => this._openAddModal('fund'));

        // 网购/外卖
        const deliveryAdd = document.getElementById('ex-delivery-add-btn');
        if (deliveryAdd) deliveryAdd.addEventListener('click', () => this._openAddModal(this.activeTab));

        // 写信
        const letterAdd = document.getElementById('ex-letter-add-btn');
        if (letterAdd) letterAdd.addEventListener('click', () => this._openAddModal('letter'));

        // 许愿星小铺 - 上架
        const starshopAdd = document.getElementById('ex-starshop-add-btn');
        if (starshopAdd) starshopAdd.addEventListener('click', () => this._openAddModal('starshop'));

        // 小铺装修
        const decorApply = document.getElementById('ex-decor-apply-btn');
        if (decorApply) decorApply.addEventListener('click', () => {
            const css = document.getElementById('ex-decor-css-input')?.value || '';
            this.setShopDecorUser(css);
            this._showToast('🎨 装修已应用！');
        });

        // 背景图清除
        const bgClear = document.getElementById('ex-bg-clear-btn');
        if (bgClear) bgClear.addEventListener('click', () => {
            this.clearBgImage();
            this._showToast('背景已清除');
        });
    }

    // ═══════════════════════════════════════════════════
    //  添加条目弹窗
    // ═══════════════════════════════════════════════════

    _openAddModal(module, from = 'user', to = null) {
        this._addModalModule = module;
        this._addModalFrom   = from;
        this._addModalTo     = to;
        this._addModalAttachments = [];

        const m = document.getElementById('exAddModal');
        if (!m) return;

        // 根据模块配置表单
        const title = {
            todo: '添加待办事项', fund: '存入亲密基金',
            shop: '网购寄存', delivery: '点外卖给TA',
            letter: '写一封信', starshop: '上架愿望',
        }[module] || '添加';

        document.getElementById('ex-add-modal-title').textContent = title;

        // 动态表单区
        const form = document.getElementById('ex-add-modal-form');
        form.innerHTML = this._addModalFormHTML(module, to);
        this._bindAddModalForm(module);

        m.style.display = 'flex';
    }

    _addModalFormHTML(module, to) {
        switch(module) {
            case 'todo':
                return `
                <textarea class="ex-input-textarea" id="ex-add-content" placeholder="说说你想让TA做什么..."></textarea>`;

            case 'fund':
                const currencies = ExchangeManager.CURRENCIES.filter(c => c.code !== 'star');
                const currencyOptions = currencies.map(c => `<option value="${c.code}">${c.label}</option>`).join('');
                return `
                <div class="ex-input-row">
                    <select class="ex-input-select" id="ex-add-currency">
                        <option value="star">🌟 许愿星</option>
                        ${currencyOptions}
                    </select>
                    <input type="number" class="ex-input-num" id="ex-add-amount" placeholder="金额" min="0.01" step="0.01">
                </div>
                <input class="ex-input-text" id="ex-add-content" placeholder="备注（可选）">`;

            case 'shop':
            case 'delivery':
                return `
                <textarea class="ex-input-textarea" id="ex-add-content" placeholder="${module==='shop' ? '描述一下这件宝贝...' : '描述一下这份外卖...'}"></textarea>
                <div class="ex-attach-row">
                    <label class="ex-attach-label">📎 附图/小票
                        <input type="file" id="ex-add-img-input" accept="image/*" multiple style="display:none">
                    </label>
                    <div id="ex-add-img-preview-row" class="ex-attach-preview-row"></div>
                </div>`;

            case 'letter':
                const futureDate = new Date(Date.now() + 365*24*3600*1000).toISOString().slice(0,16);
                return `
                <div class="ex-input-row">
                    <label class="ex-input-label">收件人</label>
                    <select class="ex-input-select" id="ex-add-letter-to">
                        <option value="ai">TA（现在）</option>
                        <option value="future_ai">未来的TA</option>
                        <option value="future_user">未来的我</option>
                    </select>
                </div>
                <div class="ex-input-row">
                    <label class="ex-input-label">开信时间</label>
                    <input type="datetime-local" class="ex-input-text" id="ex-add-letter-openat" value="${futureDate}">
                </div>
                <textarea class="ex-input-textarea" id="ex-add-content" placeholder="亲爱的..."></textarea>`;

            case 'starshop':
                return `
                <textarea class="ex-input-textarea" id="ex-add-content" placeholder="描述这个愿望（例：允许你今晚熬夜到12点...）"></textarea>
                <div class="ex-input-row">
                    <label class="ex-input-label">定价 ⭐</label>
                    <input type="number" class="ex-input-num" id="ex-add-price" value="1" min="1" step="1">
                </div>`;

            default: return '';
        }
    }

    _bindAddModalForm(module) {
        if (module === 'shop' || module === 'delivery') {
            const imgInput = document.getElementById('ex-add-img-input');
            const label = document.querySelector('.ex-attach-label');
            if (label) label.addEventListener('click', e => {
                e.preventDefault();
                imgInput?.click();
            });
            if (imgInput) imgInput.addEventListener('change', e => {
                const files = Array.from(e.target.files);
                files.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = ev => {
                        this._addModalAttachments.push(ev.target.result);
                        const row = document.getElementById('ex-add-img-preview-row');
                        if (row) row.innerHTML += `<img src="${ev.target.result}" class="ex-attach-thumb">`;
                    };
                    reader.readAsDataURL(file);
                });
            });
        }
    }

    _submitAddModal() {
        const module = this._addModalModule;
        const content = document.getElementById('ex-add-content')?.value.trim() || '';
        if (!content && module !== 'fund') { this._showToast('请填写内容'); return; }

        let item = this._newItem({ module, from: this._addModalFrom || 'user', to: this._addModalTo });

        switch(module) {
            case 'todo':
                item.content = content;
                break;

            case 'fund': {
                const amt = parseFloat(document.getElementById('ex-add-amount')?.value);
                if (!amt || amt <= 0) { this._showToast('请填写金额'); return; }
                item.currency = document.getElementById('ex-add-currency')?.value || 'CNY';
                item.amount   = amt;
                item.content  = content || '';
                item.to       = 'ai';
                break;
            }

            case 'shop':
            case 'delivery':
                item.content     = content;
                item.attachments = [...this._addModalAttachments];
                item.to          = 'ai';
                break;

            case 'letter': {
                item.content = content;
                item.to      = document.getElementById('ex-add-letter-to')?.value || 'ai';
                const openAtStr = document.getElementById('ex-add-letter-openat')?.value;
                item.openAt  = openAtStr ? new Date(openAtStr).toISOString() : null;
                item.sendAt  = new Date().toISOString();
                item.sealed  = !!item.openAt && new Date(item.openAt) > new Date();
                break;
            }

            case 'starshop': {
                item.content = content;
                item.price   = parseInt(document.getElementById('ex-add-price')?.value) || 1;
                item.to      = 'ai';    // user上架，AI可买
                break;
            }
        }

        this._addItem(item);
        this._closeAddModal();
        this._renderTab(this.activeTab);
        this._showToast('✓ 已添加！');
    }

    _closeAddModal() {
        const m = document.getElementById('exAddModal');
        if (m) m.style.display = 'none';
        this._addModalAttachments = [];
    }

    // ═══════════════════════════════════════════════════
    //  背景图弹窗
    // ═══════════════════════════════════════════════════

    _openBgModal() {
        const m = document.getElementById('exBgModal');
        if (m) m.style.display = 'flex';
    }

    _closeBgModal() {
        const m = document.getElementById('exBgModal');
        if (m) m.style.display = 'none';
    }

    // ═══════════════════════════════════════════════════
    //  AI 指令入口（由 chat-interface.js 调用）
    // ═══════════════════════════════════════════════════

    handleAIReply(text, friendCode) {
        let modified = text;
        const fc = friendCode;

        // AI写待办
        const todoMatch = modified.match(/\[EX_TODO_ADD:([^\]]+)\]/g);
        if (todoMatch) {
            todoMatch.forEach(m => {
                const inner = m.slice(13, -1);
                const targetMatch = inner.match(/\|target:(ai|user|both)$/);
                const target = targetMatch ? targetMatch[1] : 'user';
                const content = targetMatch ? inner.slice(0, inner.lastIndexOf('|target:')) : inner;
                const item = this._newItem({ module:'todo', from:'ai', to:target, content });
                const data = this._load(fc);
                data.items.push(item);
                this._save(fc, data);
            });
            modified = modified.replace(/\[EX_TODO_ADD:[^\]]+\]/g, '').trim();
        }

        // AI存基金
        const fundMatch = modified.match(/\[EX_FUND_ADD:([^\]]+)\]/);
        if (fundMatch) {
            const inner = fundMatch[1];
            const currMatch = inner.match(/\|currency:([A-Za-z]+)$/);
            const currency = currMatch ? currMatch[1] : 'CNY';
            const amount = parseFloat(currMatch ? inner.slice(0, inner.lastIndexOf('|currency:')) : inner) || 0;
            if (amount > 0) {
                const item = this._newItem({ module:'fund', from:'ai', to:'user', currency, amount, content:'' });
                const data = this._load(fc);
                data.items.push(item);
                this._save(fc, data);
            }
            modified = modified.replace(fundMatch[0], '').trim();
        }

        // AI存外卖/网购
        const delivMatch = modified.match(/\[EX_DELIVERY_ADD:([^\]]+)\]/);
        if (delivMatch) {
            const content = delivMatch[1];
            const isShop = content.includes('|shop');
            const module = isShop ? 'shop' : 'delivery';
            const cleanContent = content.replace('|shop','').trim();
            const item = this._newItem({ module, from:'ai', to:'user', content: cleanContent });
            const data = this._load(fc);
            data.items.push(item);
            this._save(fc, data);
            modified = modified.replace(delivMatch[0], '').trim();
        }

        // AI写信
        const letterMatch = modified.match(/\[EX_LETTER_WRITE:([^|]+)\|openAt:([^|]+)\|([^\]]+)\]/);
        if (letterMatch) {
            const to = letterMatch[1].trim();       // user | future_user
            const openAtStr = letterMatch[2].trim();
            const content = letterMatch[3].trim();
            const openAt = openAtStr !== 'now' ? new Date(openAtStr).toISOString() : null;
            const item = this._newItem({
                module:'letter', from:'ai', to,
                content, openAt, sendAt: new Date().toISOString(),
                sealed: !!openAt && new Date(openAt) > new Date(),
            });
            const data = this._load(fc);
            data.items.push(item);
            this._save(fc, data);
            modified = modified.replace(letterMatch[0], '').trim();
        }

        // AI完成某条
        const doneMatch = modified.match(/\[EX_DONE:([^\]]+)\]/);
        if (doneMatch) {
            const id = doneMatch[1].trim();
            this._updateItem(id, { status:'done', doneAt: new Date().toISOString() });
            // 通知
            const data = this._load(fc);
            const item = data.items.find(i => i.id === id);
            if (item) this._notifyComplete(item);
            modified = modified.replace(doneMatch[0], '').trim();
            if (window.MilestoneTimeline) {
                window.MilestoneTimeline.addRecord(fc, {
                    type: 'exchange_done',
                    date: new Date().toISOString(),
                    payload: { module: item?.module, content: item?.content?.slice(0,30) },
                });
            }
        }

        // AI撤销
        const withdrawMatch = modified.match(/\[EX_WITHDRAW:([^\]]+)\]/);
        if (withdrawMatch) {
            this._updateItem(withdrawMatch[1].trim(), { status:'withdrawn' });
            modified = modified.replace(withdrawMatch[0], '').trim();
        }

        // AI给许愿星
        const starMatch = modified.match(/\[EX_STAR_GIVE:(\d+)\]/);
        if (starMatch) {
            this.aiGiveStar(fc, parseInt(starMatch[1]));
            modified = modified.replace(starMatch[0], '').trim();
        }

        // AI上架小铺愿望
        const shopAddMatch = modified.match(/\[EX_SHOP_ADD:([^|]+)\|price:(\d+)\]/);
        if (shopAddMatch) {
            const content = shopAddMatch[1].trim();
            const price   = parseInt(shopAddMatch[2]);
            const item = this._newItem({ module:'starshop', from:'ai', to:'user', content, price });
            const data = this._load(fc);
            data.items.push(item);
            this._save(fc, data);
            modified = modified.replace(shopAddMatch[0], '').trim();
        }

        // AI用许愿星兑换user上架的愿望
        const shopRedeemMatch = modified.match(/\[EX_SHOP_REDEEM:([^\]]+)\]/);
        if (shopRedeemMatch) {
            const id = shopRedeemMatch[1].trim();
            const data = this._load(fc);
            const item = data.items.find(i => i.id === id && i.module === 'starshop' && i.from === 'user');
            if (item && item.status === 'active' && data.stars.aiBalance >= item.price) {
                data.stars.aiBalance -= item.price;
                item.status = 'done';
                item.doneAt = new Date().toISOString();
                this._save(fc, data);
                if (window.MilestoneTimeline) {
                    window.MilestoneTimeline.addRecord(fc, {
                        type: 'shop_redeemed',
                        date: new Date().toISOString(),
                        payload: { content: item.content, price: item.price, by: 'ai' },
                    });
                }
            }
            modified = modified.replace(shopRedeemMatch[0], '').trim();
        }

        // AI装修小铺
        const decorMatch = modified.match(/\[EX_SHOP_DECOR:([\s\S]*?)\]/);
        if (decorMatch) {
            this.aiSetShopDecor(fc, decorMatch[1]);
            modified = modified.replace(decorMatch[0], '').trim();
        }

        // 刷新面板（如果开着）
        if (this.panelEl && this.panelEl.style.display !== 'none' && this.friendCode === fc) {
            this._renderTab(this.activeTab);
        }

        return modified;
    }

    // ═══════════════════════════════════════════════════
    //  AI 上下文注入
    // ═══════════════════════════════════════════════════

    getAIContextInfo(friendCode) {
        const data = this._load(friendCode);
        if (!data.items.length && !data.stars.aiBalance && !data.stars.userBalance) return '';

        let info = '\n\n【跨次元兑换所】\n';
        info += `许愿星：我有 ${data.stars.userBalance}⭐，TA（你）有 ${data.stars.aiBalance}⭐\n`;

        const active = data.items.filter(i => i.status === 'active');
        if (active.length) {
            info += `活跃条目（${active.length}项）：\n`;
            active.slice(0, 10).forEach(item => {
                const moduleLabel = {todo:'待办',fund:'基金',shop:'网购',delivery:'外卖',letter:'信',starshop:'小铺'}[item.module]||item.module;
                info += `  [${item.id}] [${moduleLabel}] ${item.from==='ai'?'你发':'我发'} → ${item.to}: 「${item.content.slice(0,20)}」\n`;
            });
            if (active.length > 10) info += `  ...还有 ${active.length - 10} 项\n`;
        }

        const shopForAI = data.items.filter(i => i.module==='starshop' && i.from==='user' && i.status==='active');
        if (shopForAI.length) {
            info += `你可以兑换的愿望（用你的许愿星）：\n`;
            shopForAI.forEach(i => info += `  [${i.id}] 「${i.content}」定价 ${i.price}⭐\n`);
        }

        info += `\n可用指令：
[EX_TODO_ADD:内容|target:user/ai/both]  写待办
[EX_FUND_ADD:金额|currency:CNY/USD/star等]  往亲密基金存钱给user
[EX_DELIVERY_ADD:内容]  点外卖/网购给user（网购加|shop后缀）
[EX_LETTER_WRITE:收件人(user/future_user)|openAt:ISO时间或now|内容]  写信
[EX_DONE:条目id]  完成某条
[EX_WITHDRAW:条目id]  撤销自己发的
[EX_STAR_GIVE:数量]  给user许愿星
[EX_SHOP_ADD:愿望内容|price:数量]  上架愿望到小铺
[EX_SHOP_REDEEM:条目id]  用许愿星兑换user上架的愿望
[EX_SHOP_DECOR:css代码]  装修小铺（可随时改）
以上指令会自动隐去不显示在聊天气泡里，自然表达即可。`;

        return info;
    }

    // ═══════════════════════════════════════════════════
    //  工具
    // ═══════════════════════════════════════════════════

    _esc(str) {
        return String(str||'')
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    _showToast(msg) {
        let t = document.getElementById('ex-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'ex-toast';
            Object.assign(t.style, {
                position:'fixed', bottom:'80px', left:'50%', transform:'translateX(-50%)',
                background:'rgba(20,24,35,0.92)', color:'rgba(255,255,255,0.88)',
                padding:'10px 20px', borderRadius:'20px', fontSize:'13px',
                zIndex:'9999', pointerEvents:'none', transition:'opacity 0.3s',
            });
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.opacity = '1';
        clearTimeout(t._timer);
        t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2000);
    }
}

window.ExchangeManager = ExchangeManager;
