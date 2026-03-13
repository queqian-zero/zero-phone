/* ========================================
   LuckyCharmManager - 幸运字符模块
   零手机 × 亲密关系
   ======================================== */

class LuckyCharmManager {

    // ==================== 静态数据 ====================

    static BUILTIN_CHARMS = [
        { id: 'beautiful',  name: '美好beautiful',    file: 'luck-beautiful.png'  },
        { id: 'treasure',   name: '珍宝treasure',     file: 'luck-treasure.png'   },
        { id: 'meetyou',    name: '遇见你meet you',   file: 'luck-meet-you.png'   },
        { id: 'destiny',    name: '宿命destiny',      file: 'luck-destiny.png'    },
        { id: 'only',       name: '唯一only',         file: 'luck-only.png'       },
        { id: 'mine',       name: '我的mine',         file: 'luck-mine.png'       },
        { id: 'happiness',  name: '幸福happiness',    file: 'luck-happiness.png'  },
        { id: 'cherish',    name: '珍爱cherish',      file: 'luck-cherish.png'    },
        { id: 'future',     name: '未来future',       file: 'luck-future.png'     },
        { id: 'guardian',   name: '守护guardian',     file: 'luck-guardian.png'   },
        { id: 'merriment',  name: '欢乐merriment',    file: 'luck-merriment.png'  },
        { id: 'sanctuary',  name: '庇护所sanctuary',  file: 'luck-sanctuary.png'  },
        { id: 'starlight',  name: '星光starlight',    file: 'luck-starlight.png'  },
        { id: 'exclusive',  name: '专属Exclusive',    file: 'luck-exclusive.png'  },
        { id: 'dreamland',  name: '梦境dreamland',    file: 'luck-dreamland.png'  },
        { id: 'eternal',    name: '永恒eternal',      file: 'luck-eternal.png'    },
    ];

    // 每个字符点亮所需消息数
    static MSGS_PER_CHAR = 20;
    // 每天最多抽次数
    static MAX_DAILY_DRAWS = 3;
    // 每次抽到字符的概率
    static CHARM_PROBABILITY = 0.35;
    // 抽卡展示数量
    static CARD_COUNT = 6;

    // ==================== 构造 ====================

    constructor(chatInterface) {
        this.ci = chatInterface;           // ChatInterface 实例
        this.storage = chatInterface.storage;
        this.friendCode = null;
        this.panelEl = null;
        this._evBound = false;
        this._drawCards = [];              // 本次抽卡状态 [{flipped, result}]
        this._drawAnimating = false;
    }

    // ==================== 存储 ====================

    _key(friendCode) {
        return `zero_phone_lucky_charm_${friendCode}`;
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
        } catch(e) {
            console.warn('幸运字符存储失败:', e);
        }
    }

    _defaultData() {
        return {
            customCharms: [],        // 用户上传的自定义字符
            userDrawnIds: [],        // 用户已抽到的字符id
            aiDrawnIds: [],          // AI已抽到的字符id
            litProgress: {},         // { charmId: 消息条数 } 点亮进度
            litTimestamps: {},       // { charmId: ISO date } 100%点亮时间
            equippedCharmId: null,   // 当前佩戴的字符id（共享）
            userShowEquipped: true,  // 用户侧是否展示佩戴
            aiShowEquipped: true,    // AI侧是否展示佩戴
            userTodayDraws: { date: '', count: 0 },
            aiTodayDraws:   { date: '', count: 0 },
            bgImage: '',
        };
    }

    // ==================== 数据辅助 ====================

    // 获取所有字符（内置 + 自定义）
    _getAllCharms(data) {
        const builtin = LuckyCharmManager.BUILTIN_CHARMS.map(c => ({
            ...c,
            isBuiltin: true,
            imagePath: `assets/images/lucky-chars/${c.file}`,
            customSymbol: null,
            symbolColor: null,
        }));
        return [...builtin, ...(data.customCharms || [])];
    }

    // 获取点亮所需消息数（按字符名长度）
    _requiredMsgs(charm) {
        return charm.name.length * LuckyCharmManager.MSGS_PER_CHAR;
    }

    // 获取点亮进度 0~1
    _litRatio(data, charmId) {
        const charm = this._getAllCharms(data).find(c => c.id === charmId);
        if (!charm) return 0;
        const progress = data.litProgress[charmId] || 0;
        return Math.min(1, progress / this._requiredMsgs(charm));
    }

    // 是否完全点亮
    _isFullyLit(data, charmId) {
        return this._litRatio(data, charmId) >= 1;
    }

    // 检查今日剩余抽次
    _todayRemaining(data, who) {
        const key = who === 'user' ? 'userTodayDraws' : 'aiTodayDraws';
        const today = this._localDateStr(new Date());
        const rec = data[key];
        if (rec.date !== today) return LuckyCharmManager.MAX_DAILY_DRAWS;
        return Math.max(0, LuckyCharmManager.MAX_DAILY_DRAWS - rec.count);
    }

    // 消耗一次抽次
    _consumeDraw(data, who) {
        const key = who === 'user' ? 'userTodayDraws' : 'aiTodayDraws';
        const today = this._localDateStr(new Date());
        if (data[key].date !== today) {
            data[key] = { date: today, count: 1 };
        } else {
            data[key].count += 1;
        }
    }

    // 本地日期字符串 yyyy-mm-dd（避免 toISOString 的 UTC 跨天问题）
    _localDateStr(d) {
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    // ==================== 消息通知（每发一条消息调用）====================

    onMessageSent(friendCode) {
        const data = this._load(friendCode);
        const equipped = data.equippedCharmId;
        if (!equipped) return;
        // 未完全点亮才累计
        if (!this._isFullyLit(data, equipped)) {
            data.litProgress[equipped] = (data.litProgress[equipped] || 0) + 1;
            // 刚好点亮，记录时间戳
            if (this._isFullyLit(data, equipped)) {
                data.litTimestamps[equipped] = new Date().toISOString();
                this._save(friendCode, data);
                // 触发解锁记录
                this._onCharmFullyLit(friendCode, equipped, data);
                return;
            }
        }
        this._save(friendCode, data);
    }

    _onCharmFullyLit(friendCode, charmId, data) {
        const charm = this._getAllCharms(data).find(c => c.id === charmId);
        if (!charm) return;
        // 触发星迹留痕记录
        if (window.MilestoneTimeline) {
            window.MilestoneTimeline.addRecord(friendCode, {
                type: 'charm_lit',
                charmId,
                charmName: charm.name,
                date: new Date().toISOString(),
            });
        }
        // 如果面板正开着，刷新显示
        if (this.panelEl && this.panelEl.style.display !== 'none') {
            this._renderEquipped(data);
            this._renderMyCharms(data);
        }
    }

    // ==================== 抽卡逻辑 ====================

    // 初始化6张牌（只定结果，不翻）
    _initDrawCards(data) {
        const allCharms = this._getAllCharms(data);
        const undrawnUser = allCharms.filter(c => !data.userDrawnIds.includes(c.id));
        this._drawCards = Array.from({ length: LuckyCharmManager.CARD_COUNT }, (_, i) => {
            const isCharm = Math.random() < LuckyCharmManager.CHARM_PROBABILITY;
            let result = null;
            if (isCharm && undrawnUser.length > 0) {
                const idx = Math.floor(Math.random() * undrawnUser.length);
                result = undrawnUser[idx];
            }
            return { flipped: false, result, index: i };
        });
    }

    // 用户翻一张牌
    flipCard(cardIndex) {
        if (this._drawAnimating) return;
        const card = this._drawCards[cardIndex];
        if (!card || card.flipped) return;

        const data = this._load(this.friendCode);
        const remaining = this._todayRemaining(data, 'user');
        if (remaining <= 0) {
            this._showToast('今天已经抽完啦，明天再来～');
            return;
        }

        this._drawAnimating = true;
        card.flipped = true;
        this._consumeDraw(data, 'user');

        // 如果抽到了字符，加入已抽列表
        if (card.result && !data.userDrawnIds.includes(card.result.id)) {
            data.userDrawnIds.push(card.result.id);
            data.litProgress[card.result.id] = data.litProgress[card.result.id] || 0;
            // 触发星迹留痕记录
            if (window.MilestoneTimeline) {
                window.MilestoneTimeline.addRecord(this.friendCode, {
                    type: 'charm_drawn',
                    charmId: card.result.id,
                    charmName: card.result.name,
                    date: new Date().toISOString(),
                });
            }
        }
        this._save(this.friendCode, data);

        // 翻牌动画
        const cardEl = document.getElementById(`lc-card-${cardIndex}`);
        if (cardEl) {
            cardEl.classList.add('lc-card-flipping');
            setTimeout(() => {
                this._renderCard(cardEl, card, data);
                cardEl.classList.remove('lc-card-flipping');
                cardEl.classList.add('lc-card-flipped');
                this._drawAnimating = false;
                // 刷新剩余次数
                this._renderDrawHeader(data);
                // 如果抽到了字符，刷新我的字符列表
                if (card.result) {
                    this._renderMyCharms(data);
                    this._showToast(`✨ 抽到了「${card.result.name}」！`);
                } else {
                    this._showToast('这次是空卡，再试试吧～');
                }
            }, 300);
        } else {
            this._drawAnimating = false;
        }
    }

    // ==================== 佩戴逻辑 ====================

    equipCharm(charmId) {
        const data = this._load(this.friendCode);
        if (!data.userDrawnIds.includes(charmId)) {
            this._showToast('还没有抽到这个字符哦');
            return;
        }
        if (data.equippedCharmId === charmId) {
            // 再点一次=取消佩戴
            data.equippedCharmId = null;
            this._save(this.friendCode, data);
            this._showToast('已取消佩戴');
        } else {
            data.equippedCharmId = charmId;
            this._save(this.friendCode, data);
            const charm = this._getAllCharms(data).find(c => c.id === charmId);
            this._showToast(`已佩戴「${charm?.name || charmId}」`);
        }
        this._renderEquipped(data);
        this._renderMyCharms(data);
    }

    toggleShowEquipped() {
        const data = this._load(this.friendCode);
        data.userShowEquipped = !data.userShowEquipped;
        this._save(this.friendCode, data);
        this._renderEquipped(data);
        const btn = document.getElementById('lc-toggle-show');
        if (btn) btn.textContent = data.userShowEquipped ? '关闭展示' : '开启展示';
    }

    // AI侧：由chat-interface.js在AI操作时调用
    aiEquipCharm(friendCode, charmId) {
    const data = this._load(friendCode);
    data.equippedCharmId = charmId;
    this._save(friendCode, data);
    // 面板开着就刷新展示
    if (this.panelEl && this.panelEl.style.display !== 'none') {
        this._renderEquipped(data);
    }
}

    aiDrawCharm(friendCode) {
        const data = this._load(friendCode);
        const remaining = this._todayRemaining(data, 'ai');
        if (remaining <= 0) return null;
        this._consumeDraw(data, 'ai');
        const isCharm = Math.random() < LuckyCharmManager.CHARM_PROBABILITY;
        let result = null;
        if (isCharm) {
            const allCharms = this._getAllCharms(data);
            const undrawn = allCharms.filter(c => !data.aiDrawnIds.includes(c.id));
            if (undrawn.length > 0) {
                result = undrawn[Math.floor(Math.random() * undrawn.length)];
                data.aiDrawnIds.push(result.id);
                if (window.MilestoneTimeline) {
                    window.MilestoneTimeline.addRecord(friendCode, {
                        type: 'charm_drawn_ai',
                        charmId: result.id,
                        charmName: result.name,
                        date: new Date().toISOString(),
                    });
                }
            }
        }
        this._save(friendCode, data);
        return result;
    }

    // ==================== 自定义上传 ====================

    addCustomCharm(name, imageSrc, customSymbol, symbolColor) {
        if (!name || !imageSrc) {
            this._showToast('请填写字符名称并上传图片');
            return false;
        }
        const data = this._load(this.friendCode);
        const id = 'custom_' + Date.now();
        const charm = {
            id,
            name,
            imagePath: imageSrc,
            isBuiltin: false,
            customSymbol: customSymbol || null,
            symbolColor: symbolColor || '#ffffff',
            file: null,
        };
        data.customCharms.push(charm);
        this._save(this.friendCode, data);
        this._renderMyCharms(data);
        this._showToast(`「${name}」已添加到字符库！`);
        return true;
    }

    deleteCustomCharm(charmId) {
        const data = this._load(this.friendCode);
        const idx = data.customCharms.findIndex(c => c.id === charmId);
        if (idx === -1) return;
        const charm = data.customCharms[idx];
        data.customCharms.splice(idx, 1);
        // 如果正在佩戴，取消佩戴
        if (data.equippedCharmId === charmId) data.equippedCharmId = null;
        // 移除抽取记录
        data.userDrawnIds = data.userDrawnIds.filter(id => id !== charmId);
        data.aiDrawnIds = data.aiDrawnIds.filter(id => id !== charmId);
        this._save(this.friendCode, data);
        this._renderMyCharms(data);
        this._renderEquipped(data);
        this._showToast(`「${charm.name}」已删除`);
    }

    // ==================== 背景图 ====================

    setBgImage(src) {
        const data = this._load(this.friendCode);
        data.bgImage = src;
        this._save(this.friendCode, data);
        this._applyBg(data);
    }

    clearBgImage() {
        const data = this._load(this.friendCode);
        data.bgImage = '';
        this._save(this.friendCode, data);
        this._applyBg(data);
    }

    _applyBg(data) {
        const bg = document.getElementById('lc-bg');
        if (!bg) return;
        if (data.bgImage) {
            bg.style.backgroundImage = `url('${data.bgImage}')`;
            bg.style.backgroundSize = 'cover';
            bg.style.backgroundPosition = 'center';
        } else {
            bg.style.backgroundImage = '';
        }
    }

    // ==================== 面板开关 ====================

    open(friendCode) {
        this.friendCode = friendCode;
        if (!this.panelEl) {
            this.panelEl = document.getElementById('lcPanel');
        }
        if (!this.panelEl) return;

        const data = this._load(friendCode);
        this._initDrawCards(data);

        this.panelEl.style.display = 'flex';

        if (!this._evBound) {
            this._bindEvents();
            this._evBound = true;
        }

        this._renderAll(data);
    }

    close() {
        if (this.panelEl) this.panelEl.style.display = 'none';
    }

    // ==================== 渲染 ====================

    _renderAll(data) {
        this._applyBg(data);
        this._renderDrawHeader(data);
        this._renderDrawCards(data);
        this._renderEquipped(data);
        this._renderMyCharms(data);
    }

    _renderDrawHeader(data) {
        const remaining = this._todayRemaining(data, 'user');
        const el = document.getElementById('lc-draw-remaining');
        if (el) el.textContent = `今日剩余 ${remaining} 次`;
    }

    _renderDrawCards(data) {
        const wrap = document.getElementById('lc-cards-wrap');
        if (!wrap) return;
        wrap.innerHTML = '';
        this._drawCards.forEach((card, i) => {
            const el = document.createElement('div');
            el.className = 'lc-card' + (card.flipped ? ' lc-card-flipped' : '');
            el.id = `lc-card-${i}`;
            el.onclick = () => this.flipCard(i);
            this._renderCard(el, card, data);
            wrap.appendChild(el);
        });
    }

    _renderCard(el, card, data) {
        if (!card.flipped) {
            el.innerHTML = `<div class="lc-card-back"><div class="lc-card-back-symbol">✦</div></div>`;
        } else if (card.result) {
            const ratio = this._litRatio(data, card.result.id);
            el.innerHTML = `
                <div class="lc-card-front lc-card-charm">
                    <div class="lc-charm-img-wrap">
                        <img src="${card.result.imagePath}" class="lc-charm-img ${ratio >= 1 ? '' : 'lc-charm-gray'}" onerror="this.style.opacity='0.3'">
                        ${ratio < 1 ? `<img src="${card.result.imagePath}" class="lc-charm-img lc-charm-color" style="clip-path: inset(0 ${100 - ratio * 100}% 0 0);" onerror="this.style.display='none'">` : ''}
                    </div>
                    <div class="lc-charm-name">${this._renderCharmName(card.result.name, ratio)}</div>
                </div>`;
        } else {
            el.innerHTML = `<div class="lc-card-front lc-card-empty"><div class="lc-card-empty-icon">○</div><div class="lc-card-empty-label">空卡</div></div>`;
        }
    }

    // 字符名逐字亮起
    _renderCharmName(name, ratio) {
        const total = name.length;
        return name.split('').map((char, i) => {
            const charRatio = i / total;
            const isLit = ratio >= (i + 1) / total;
            const isCurrent = !isLit && ratio >= charRatio;
            return `<span class="lc-char ${isLit ? 'lc-char-lit' : ''} ${isCurrent ? 'lc-char-glow' : ''}">${char}</span>`;
        }).join('');
    }

    _renderEquipped(data) {
        const wrap = document.getElementById('lc-equipped-wrap');
        if (!wrap) return;

        if (!data.userShowEquipped || !data.equippedCharmId) {
            wrap.innerHTML = `
                <div class="lc-equipped-empty">
                    <div class="lc-equipped-empty-icon">○</div>
                    <div class="lc-equipped-empty-label">${data.equippedCharmId ? '展示已关闭' : '暂未佩戴字符'}</div>
                </div>`;
            const btn = document.getElementById('lc-toggle-show');
            if (btn) btn.textContent = data.userShowEquipped ? '关闭展示' : '开启展示';
            return;
        }

        const charm = this._getAllCharms(data).find(c => c.id === data.equippedCharmId);
        if (!charm) { wrap.innerHTML = ''; return; }

        const ratio = this._litRatio(data, charm.id);
        const isFullyLit = ratio >= 1;
        let litInfo = '';
        if (isFullyLit && data.litTimestamps[charm.id]) {
            const litDate = new Date(data.litTimestamps[charm.id]);
            const now = new Date();
            const days = Math.floor((now - litDate) / (1000 * 60 * 60 * 24)) + 1;
            litInfo = `<div class="lc-equipped-days">已点亮 ${days} 天</div>`;
        }

        wrap.innerHTML = `
            <div class="lc-equipped-display">
                <div class="lc-charm-img-wrap lc-equipped-img-wrap">
                    <img src="${charm.imagePath}" class="lc-charm-img ${isFullyLit ? '' : 'lc-charm-gray'}" onerror="this.style.opacity='0.3'">
                    ${!isFullyLit ? `<img src="${charm.imagePath}" class="lc-charm-img lc-charm-color" style="clip-path: inset(0 ${100 - ratio * 100}% 0 0);" onerror="this.style.display='none'">` : ''}
                </div>
                <div class="lc-charm-name lc-equipped-name">${this._renderCharmName(charm.name, ratio)}</div>
                ${litInfo}
                <div class="lc-equipped-progress-wrap">
                    <div class="lc-equipped-progress-bar" style="width: ${ratio * 100}%"></div>
                </div>
                <div class="lc-equipped-progress-label">${isFullyLit ? '✦ 已完全点亮' : `${Math.round(ratio * 100)}% · 还需 ${Math.max(0, this._requiredMsgs(charm) - (data.litProgress[charm.id]||0))} 条消息`}</div>
            </div>`;

        const btn = document.getElementById('lc-toggle-show');
        if (btn) btn.textContent = '关闭展示';
    }

    _renderMyCharms(data) {
        const wrap = document.getElementById('lc-my-charms-wrap');
        if (!wrap) return;

        const allCharms = this._getAllCharms(data);
        const drawn = allCharms.filter(c => data.userDrawnIds.includes(c.id));

        if (drawn.length === 0) {
            wrap.innerHTML = `<div class="lc-no-charms">还没有抽到任何字符，快去抽吧～</div>`;
            return;
        }

        wrap.innerHTML = drawn.map(charm => {
            const ratio = this._litRatio(data, charm.id);
            const isEquipped = data.equippedCharmId === charm.id;
            const isFullyLit = ratio >= 1;
            return `
                <div class="lc-my-charm-item ${isEquipped ? 'lc-charm-equipped' : ''}" data-id="${charm.id}">
                    <div class="lc-charm-img-wrap lc-my-charm-img-wrap">
                        <img src="${charm.imagePath}" class="lc-charm-img ${isFullyLit ? '' : 'lc-charm-gray'}" onerror="this.style.opacity='0.3'">
                        ${!isFullyLit ? `<img src="${charm.imagePath}" class="lc-charm-img lc-charm-color" style="clip-path: inset(0 ${100 - ratio * 100}% 0 0);" onerror="this.style.display='none'">` : ''}
                    </div>
                    <div class="lc-charm-name lc-my-charm-name">${this._renderCharmName(charm.name, ratio)}</div>
                    <div class="lc-my-charm-actions">
                        <button class="lc-equip-btn ${isEquipped ? 'lc-equip-btn-on' : ''}" onclick="window.LuckyCharm.equipCharm('${charm.id}')">
                            ${isEquipped ? '取消佩戴' : '佩戴'}
                        </button>
                        ${!charm.isBuiltin ? `<button class="lc-delete-btn" onclick="window.LuckyCharm.deleteCustomCharm('${charm.id}')">删除</button>` : ''}
                    </div>
                    <div class="lc-my-charm-bar-wrap">
                        <div class="lc-my-charm-bar" style="width: ${ratio * 100}%"></div>
                    </div>
                </div>`;
        }).join('');
    }

    // ==================== 事件绑定 ====================

    _bindEvents() {
        // 返回
        const backBtn = document.getElementById('lc-back-btn');
        if (backBtn) backBtn.addEventListener('click', () => this.close());

        // 展示开关
        const toggleBtn = document.getElementById('lc-toggle-show');
        if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggleShowEquipped());

        // 打开自定义背景弹窗
        const customBtn = document.getElementById('lc-custom-btn');
        if (customBtn) customBtn.addEventListener('click', () => this._openCustomModal());

        // 打开上传弹窗
        const uploadBtn = document.getElementById('lc-upload-charm-btn');
        if (uploadBtn) uploadBtn.addEventListener('click', () => this._openUploadModal());

        // 打开字符库管理弹窗
        const libraryBtn = document.getElementById('lc-library-btn');
        if (libraryBtn) libraryBtn.addEventListener('click', () => this._openLibraryModal());

        this._bindCustomModalEvents();
        this._bindUploadModalEvents();
        this._bindLibraryModalEvents();
    }

    // ---- 自定义背景弹窗 ----

    _openCustomModal() {
        const m = document.getElementById('lcCustomModal');
        if (m) m.style.display = 'flex';
    }

    _closeCustomModal() {
        const m = document.getElementById('lcCustomModal');
        if (m) m.style.display = 'none';
    }

    _bindCustomModalEvents() {
        const overlay = document.getElementById('lcCustomOverlay');
        if (overlay) overlay.addEventListener('click', () => this._closeCustomModal());

        const close = document.getElementById('lcCustomClose');
        if (close) close.addEventListener('click', () => this._closeCustomModal());

        // URL应用
        const applyUrl = document.getElementById('lc-bg-url-apply');
        if (applyUrl) applyUrl.addEventListener('click', () => {
            const url = document.getElementById('lc-bg-url')?.value?.trim();
            if (url) { this.setBgImage(url); this._closeCustomModal(); }
        });

        // 文件上传
        const fileInput = document.getElementById('lc-bg-file');
        const uploadBtn = document.getElementById('lc-bg-upload');
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                this._compressAndReadImage(file, (src) => {
                    this.setBgImage(src);
                    this._closeCustomModal();
                });
            });
        }

        // 清除背景
        const clearBtn = document.getElementById('lc-bg-clear');
        if (clearBtn) clearBtn.addEventListener('click', () => {
            this.clearBgImage();
            this._closeCustomModal();
        });
    }

    // ---- 上传字符弹窗 ----

    _openUploadModal() {
        const m = document.getElementById('lcUploadModal');
        if (m) {
            m.style.display = 'flex';
            // 清空表单
            const nameInput = document.getElementById('lc-upload-name');
            if (nameInput) nameInput.value = '';
            const symbolInput = document.getElementById('lc-upload-symbol');
            if (symbolInput) symbolInput.value = '';
            const colorInput = document.getElementById('lc-upload-color');
            if (colorInput) colorInput.value = '#ffffff';
            const preview = document.getElementById('lc-upload-preview');
            if (preview) { preview.src = ''; preview.style.display = 'none'; }
            this._uploadImageSrc = null;
        }
    }

    _closeUploadModal() {
        const m = document.getElementById('lcUploadModal');
        if (m) m.style.display = 'none';
    }

    _bindUploadModalEvents() {
        const overlay = document.getElementById('lcUploadOverlay');
        if (overlay) overlay.addEventListener('click', () => this._closeUploadModal());

        const close = document.getElementById('lcUploadClose');
        if (close) close.addEventListener('click', () => this._closeUploadModal());

        // 图片上传（文件）
        const imgFile = document.getElementById('lc-upload-img-file');
        const imgUploadBtn = document.getElementById('lc-upload-img-btn');
        if (imgUploadBtn && imgFile) {
            imgUploadBtn.addEventListener('click', () => imgFile.click());
            imgFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                this._compressAndReadImage(file, (src) => {
                    this._uploadImageSrc = src;
                    const preview = document.getElementById('lc-upload-preview');
                    if (preview) { preview.src = src; preview.style.display = 'block'; }
                });
            });
        }

        // 图片URL
        const imgUrlApply = document.getElementById('lc-upload-img-url-apply');
        if (imgUrlApply) imgUrlApply.addEventListener('click', () => {
            const url = document.getElementById('lc-upload-img-url')?.value?.trim();
            if (url) {
                this._uploadImageSrc = url;
                const preview = document.getElementById('lc-upload-preview');
                if (preview) { preview.src = url; preview.style.display = 'block'; }
            }
        });

        // 确认上传
        const confirm = document.getElementById('lc-upload-confirm');
        if (confirm) confirm.addEventListener('click', () => {
            const name = document.getElementById('lc-upload-name')?.value?.trim();
            const symbol = document.getElementById('lc-upload-symbol')?.value?.trim();
            const color = document.getElementById('lc-upload-color')?.value || '#ffffff';
            if (!name) { this._showToast('请填写字符名称！'); return; }
            if (!this._uploadImageSrc) { this._showToast('请上传字符图片！'); return; }
            const ok = this.addCustomCharm(name, this._uploadImageSrc, symbol, color);
            if (ok) this._closeUploadModal();
        });
    }

    // ---- 字符库管理弹窗 ----

    _openLibraryModal() {
        const m = document.getElementById('lcLibraryModal');
        if (m) {
            m.style.display = 'flex';
            this._renderLibrary();
        }
    }

    _closeLibraryModal() {
        const m = document.getElementById('lcLibraryModal');
        if (m) m.style.display = 'none';
    }

    _renderLibrary() {
        const wrap = document.getElementById('lc-library-list');
        if (!wrap) return;
        const data = this._load(this.friendCode);
        const customs = data.customCharms || [];

        if (customs.length === 0) {
            wrap.innerHTML = `<div class="lc-library-empty">还没有上传过自定义字符～</div>`;
            return;
        }

        wrap.innerHTML = customs.map(charm => {
            const isDrawn = data.userDrawnIds.includes(charm.id);
            const isEquipped = data.equippedCharmId === charm.id;
            return `
                <div class="lc-library-item" id="lc-lib-item-${charm.id}">
                    <img src="${charm.imagePath}" class="lc-library-img" onerror="this.style.opacity='0.2'">
                    <div class="lc-library-info">
                        <div class="lc-library-name">${charm.name}</div>
                        <div class="lc-library-tags">
                            ${isDrawn ? '<span class="lc-lib-tag lc-lib-tag-drawn">已抽到</span>' : '<span class="lc-lib-tag">未抽到</span>'}
                            ${isEquipped ? '<span class="lc-lib-tag lc-lib-tag-equipped">佩戴中</span>' : ''}
                            ${charm.customSymbol ? `<span class="lc-lib-tag">符号 ${charm.customSymbol}</span>` : ''}
                        </div>
                    </div>
                    <button class="lc-library-del-btn" onclick="window.LuckyCharm._confirmDeleteCustom('${charm.id}', '${charm.name.replace(/'/g, "\\'")}')">删除</button>
                </div>`;
        }).join('');
    }

    _confirmDeleteCustom(charmId, charmName) {
        const ok = window.confirm(`确定删除「${charmName}」吗？\n（已抽到的记录和点亮进度也会一起清除）`);
        if (ok) {
            this.deleteCustomCharm(charmId);
            const item = document.getElementById(`lc-lib-item-${charmId}`);
            if (item) item.remove();
            const data = this._load(this.friendCode);
            if ((data.customCharms || []).length === 0) {
                const wrap = document.getElementById('lc-library-list');
                if (wrap) wrap.innerHTML = `<div class="lc-library-empty">还没有上传过自定义字符～</div>`;
            }
        }
    }

    _bindLibraryModalEvents() {
        const overlay = document.getElementById('lcLibraryOverlay');
        if (overlay) overlay.addEventListener('click', () => this._closeLibraryModal());
        const close = document.getElementById('lcLibraryClose');
        if (close) close.addEventListener('click', () => this._closeLibraryModal());
        const uploadFromLib = document.getElementById('lc-library-upload-btn');
        if (uploadFromLib) uploadFromLib.addEventListener('click', () => {
            this._closeLibraryModal();
            this._openUploadModal();
        });
    }

        // ==================== 工具方法 ====================

    _compressAndReadImage(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxSize = 400;
                let { width, height } = img;
                if (width > maxSize || height > maxSize) {
                    if (width > height) { height = height * maxSize / width; width = maxSize; }
                    else { width = width * maxSize / height; height = maxSize; }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                callback(canvas.toDataURL('image/png', 0.85));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    _showToast(msg) {
        let toast = document.getElementById('lcToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'lcToast';
            toast.className = 'lc-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('lc-toast-show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.classList.remove('lc-toast-show');
        }, 2200);
    }

    // ==================== AI系统提示信息（供chat-interface.js调用）====================

    getAIContextInfo(friendCode) {
        const data = this._load(friendCode);
        const allCharms = this._getAllCharms(data);

        const userEquipped = allCharms.find(c => c.id === data.equippedCharmId);
        const aiEquipped = userEquipped; // 共享

        const userDrawn = allCharms.filter(c => data.userDrawnIds.includes(c.id));
        const aiDrawn = allCharms.filter(c => data.aiDrawnIds.includes(c.id));

        const remaining = this._todayRemaining(data, 'ai');

        let info = '\n\n【幸运字符状态】\n';
        if (userEquipped) {
            const ratio = this._litRatio(data, userEquipped.id);
            info += `当前佩戴：「${userEquipped.name}」（点亮进度 ${Math.round(ratio * 100)}%）\n`;
        } else {
            info += '当前未佩戴幸运字符\n';
        }
        if (aiDrawn.length > 0) {
            info += `你（AI）已抽到：${aiDrawn.map(c => `${c.name}(id:${c.id})`).join('、')}\n`;
        }
        info += `你（AI）今日剩余抽次：${remaining}次\n`;
        info += `用户已抽到：${userDrawn.map(c => c.name).join('、') || '暂无'}\n`;
        info += '注：你可以自主选择是否抽卡、佩戴哪个字符，或在聊天中自然提及（根据你的人设决定）。如果你决定抽卡，请在回复中包含 [LC_AI_DRAW]；如果你决定佩戴某个字符，请包含 [LC_AI_EQUIP:字符id]。';

        return info;
    }

}

// ==================== 全局挂载 ====================
window.LuckyCharmManager = LuckyCharmManager;
