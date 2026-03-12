/* ========================================
   IntimacyBadgeManager - 亲密徽章模块
   零手机 × 亲密关系
   ======================================== */

class IntimacyBadgeManager {

    // ==================== 内置徽章定义 ====================

    static BUILTIN_BADGES = [
        {
            id: 'as_promised',
            name: '如约而至',
            file: 'badge-as-promised.png',
            desc: '双方各发送一条消息',
            hint: '只要聊过天就能解锁',
        },
        {
            id: 'sleep_guardian',
            name: '睡眠守护',
            file: 'badge-sleep-guardian.png',
            desc: '双方互道一次晚安',
            hint: '消息里含"晚安"即可',
        },
        {
            id: 'exclusive_exception',
            name: '专属例外',
            file: 'badge-exclusive-exception.png',
            desc: '凌晨0点到5点聊天累计7天',
            hint: '累计不连续也算',
        },
        {
            id: 'absolute_shelter',
            name: '绝对庇护',
            file: 'badge-absolute-shelter.png',
            desc: '凌晨0点到5点聊天累计30天',
            hint: '累计不连续也算',
        },
        {
            id: 'time_anchor',
            name: '时间锚点',
            file: 'badge-time-anchor.png',
            desc: '同一天内互发早安和晚安累计60天',
            hint: '早安+晚安同一天才算一天',
        },
        {
            id: 'dream_domain',
            name: '梦境管辖',
            file: 'badge-dream-domain.png',
            desc: '双方互道晚安连续7天',
            hint: '连续！中间断了从零开始',
        },
        {
            id: 'heartbeat_limited',
            name: '心动限定',
            file: 'badge-heartbeat-limited.png',
            desc: '情人节当天互说情人节快乐',
            hint: '限时版仅当天有效，连续3年永久解锁',
        },
        {
            id: 'infinite_overdraft',
            name: '无限透支',
            file: 'badge-infinite-overdraft.png',
            desc: '跨次元兑换所：双方各完成5项约定',
            hint: '需要跨次元兑换所模块配合解锁',
        },
        {
            id: 'only_route',
            name: '唯一航道',
            file: 'badge-only-route.png',
            desc: '小火花持续365天不熄灭',
            hint: '包括永不熄灭的火花',
        },
    ];

    // 关键词匹配
    static KEYWORDS = {
        goodMorning: ['早安', '早上好', '早哦', '起床了', 'good morning', '早！'],
        goodNight:   ['晚安', '晚安晚安', '睡了', '去睡了', 'good night', '晚安～', '晚安~'],
        valentine:   ['情人节快乐', '节日快乐', 'happy valentine', 'valentine'],
    };

    // ==================== 构造 ====================

    constructor(chatInterface) {
        this.ci = chatInterface;
        this.storage = chatInterface.storage;
        this.friendCode = null;
        this.panelEl = null;
        this._evBound = false;
    }

    // ==================== 存储 ====================

    _key(fc) { return `zero_phone_badges_${fc}`; }

    _load(fc) {
        try {
            const raw = localStorage.getItem(this._key(fc));
            if (raw) return JSON.parse(raw);
        } catch(e) {}
        return this._defaultData();
    }

    _save(fc, data) {
        try {
            localStorage.setItem(this._key(fc), JSON.stringify(data));
        } catch(e) { console.warn('徽章存储失败:', e); }
    }

    _defaultData() {
        return {
            unlocked: {},           // { badgeId: { unlockedAt, isLimited } }
            valentineYears: [],     // 已解锁心动限定的年份
            customBadges: [],       // 自定义徽章列表
            bgImage: '',
            // 跟踪计数器（增量更新，避免每次全量扫描）
            tracking: {
                lateNightDays: [],          // 凌晨聊过天的日期列表（字符串yyyy-mm-dd）
                morningNightDays: [],       // 早安+晚安同一天的日期列表
                consecutiveNightStreak: 0,  // 梦境管辖连续天数
                lastNightDate: '',          // 上次互道晚安的日期
                lastScanMsgIndex: 0,        // 上次扫描到的消息下标（增量）
            },
        };
    }

    // ==================== 全量获取所有徽章 ====================

    _getAllBadges(data) {
        return [
            ...IntimacyBadgeManager.BUILTIN_BADGES.map(b => ({
                ...b,
                isBuiltin: true,
                imagePath: `assets/images/intimacy-badges/${b.file}`,
            })),
            ...(data.customBadges || []),
        ];
    }

    // ==================== 解锁条件检测 ====================

    // 主入口：扫描消息更新追踪数据，然后检测每个徽章是否解锁
    checkUnlocks(friendCode) {
        const data = this._load(friendCode);
        const chat = this.storage.getChatByFriendCode(friendCode);
        const messages = chat?.messages || [];

        this._updateTracking(data, messages, friendCode);
        this._checkAllBadges(data, messages, friendCode);

        this._save(friendCode, data);
        return data;
    }

    _updateTracking(data, messages, friendCode) {
        const t = data.tracking;
        const startIdx = t.lastScanMsgIndex || 0;
        const newMsgs = messages.slice(startIdx);
        if (newMsgs.length === 0) return;

        // 按日期分组新消息
        const byDate = {};
        newMsgs.forEach(msg => {
            if (!msg.timestamp) return;
            const d = new Date(msg.timestamp);
            const dateStr = this._dateStr(d);
            if (!byDate[dateStr]) byDate[dateStr] = { user: [], ai: [], hour: {} };
            const arr = msg.type === 'user' ? byDate[dateStr].user : byDate[dateStr].ai;
            arr.push(msg.text || '');
            const h = d.getHours();
            if (!byDate[dateStr].hour[h]) byDate[dateStr].hour[h] = true;
        });

        const lateNightSet = new Set(t.lateNightDays);
        const morningNightSet = new Set(t.morningNightDays);

        Object.entries(byDate).forEach(([dateStr, day]) => {
            // 凌晨聊天：0-5点有消息且双方都有
            const hasLate = Object.keys(day.hour).some(h => parseInt(h) < 5);
            if (hasLate && day.user.length > 0 && day.ai.length > 0) {
                lateNightSet.add(dateStr);
            }

            // 早安晚安：同一天user发了早安+晚安类关键词（或AI也发了）
            const allTexts = [...day.user, ...day.ai];
            const hasMorning = allTexts.some(txt => this._hasKeyword(txt, 'goodMorning'));
            const hasNight   = allTexts.some(txt => this._hasKeyword(txt, 'goodNight'));
            if (hasMorning && hasNight) {
                morningNightSet.add(dateStr);
            }

            // 梦境管辖：双方互道晚安连续天数
            const userNight = day.user.some(txt => this._hasKeyword(txt, 'goodNight'));
            const aiNight   = day.ai.some(txt => this._hasKeyword(txt, 'goodNight'));
            if (userNight && aiNight) {
                if (t.lastNightDate) {
                    const last = new Date(t.lastNightDate);
                    const curr = new Date(dateStr);
                    const diff = Math.round((curr - last) / 86400000);
                    if (diff === 1) {
                        t.consecutiveNightStreak = (t.consecutiveNightStreak || 0) + 1;
                    } else if (diff > 1) {
                        t.consecutiveNightStreak = 1; // 断了，重置
                    }
                    // diff === 0 同一天重复，不处理
                } else {
                    t.consecutiveNightStreak = 1;
                }
                t.lastNightDate = dateStr;
            }
        });

        t.lateNightDays = [...lateNightSet].sort();
        t.morningNightDays = [...morningNightSet].sort();
        t.lastScanMsgIndex = messages.length;
    }

    _checkAllBadges(data, messages, friendCode) {
        const t = data.tracking;
        const spark = this.ci.chatApp.calcSparkStatus(friendCode);
        const now = new Date();

        // 1. 如约而至
        this._tryUnlock(data, friendCode, 'as_promised',
            messages.some(m => m.type === 'user') && messages.some(m => m.type === 'ai'));

        // 2. 睡眠守护
        const userNightEver = messages.some(m => m.type === 'user' && this._hasKeyword(m.text, 'goodNight'));
        const aiNightEver   = messages.some(m => m.type === 'ai'   && this._hasKeyword(m.text, 'goodNight'));
        this._tryUnlock(data, friendCode, 'sleep_guardian', userNightEver && aiNightEver);

        // 3. 专属例外（凌晨累计7天）
        this._tryUnlock(data, friendCode, 'exclusive_exception', t.lateNightDays.length >= 7);

        // 4. 绝对庇护（凌晨累计30天）
        this._tryUnlock(data, friendCode, 'absolute_shelter', t.lateNightDays.length >= 30);

        // 5. 时间锚点（早安+晚安累计60天）
        this._tryUnlock(data, friendCode, 'time_anchor', t.morningNightDays.length >= 60);

        // 6. 梦境管辖（连续7天互道晚安）
        this._tryUnlock(data, friendCode, 'dream_domain', t.consecutiveNightStreak >= 7);

        // 7. 心动限定（情人节）
        this._checkValentine(data, messages, friendCode, now);

        // 8. 无限透支（依赖跨次元兑换所，暂时只读已存的标记）
        if (data._overdraftUnlockPending) {
            this._tryUnlock(data, friendCode, 'infinite_overdraft', true);
            data._overdraftUnlockPending = false;
        }

        // 9. 唯一航道（火花365天）
        const sparkDays = spark.status === 'never' ? 99999 : (spark.days || 0);
        this._tryUnlock(data, friendCode, 'only_route', sparkDays >= 365);
    }

    _checkValentine(data, messages, friendCode, now) {
        const isValentine = now.getMonth() === 1 && now.getDate() === 14;
        const yearStr = String(now.getFullYear());

        if (!isValentine) {
            // 非情人节：心动限定如果不是永久解锁就移除
            if (data.unlocked['heartbeat_limited'] && !data.unlocked['heartbeat_limited'].isPermanent) {
                delete data.unlocked['heartbeat_limited'];
            }
            return;
        }

        // 今天是情人节，检查双方是否互说了情人节快乐
        const todayStr = this._dateStr(now);
        const todayMsgs = messages.filter(m => m.timestamp && this._dateStr(new Date(m.timestamp)) === todayStr);
        const userVal = todayMsgs.some(m => m.type === 'user' && this._hasKeyword(m.text, 'valentine'));
        const aiVal   = todayMsgs.some(m => m.type === 'ai'   && this._hasKeyword(m.text, 'valentine'));

        if (userVal && aiVal) {
            if (!data.valentineYears.includes(yearStr)) {
                data.valentineYears.push(yearStr);
            }
            // 连续3年 → 永久
            const isPermanent = data.valentineYears.length >= 3;
            if (!data.unlocked['heartbeat_limited']) {
                this._tryUnlock(data, friendCode, 'heartbeat_limited', true, { isPermanent });
            } else {
                data.unlocked['heartbeat_limited'].isPermanent = isPermanent;
            }
        }
    }

    // 尝试解锁一个徽章（已解锁则跳过）
    _tryUnlock(data, friendCode, badgeId, condition, extra = {}) {
        if (!condition) return;
        if (data.unlocked[badgeId]) return; // 已解锁

        data.unlocked[badgeId] = {
            unlockedAt: new Date().toISOString(),
            ...extra,
        };

        // 找徽章名
        const all = this._getAllBadges(data);
        const badge = all.find(b => b.id === badgeId);
        const badgeName = badge?.name || badgeId;

        // 写星迹留痕
        if (window.MilestoneTimeline) {
            window.MilestoneTimeline.addRecord(friendCode, {
                type: 'badge_unlocked',
                date: new Date().toISOString(),
                payload: { badgeId, badgeName },
            });
        }

        this._showToast(`🏅 解锁了「${badgeName}」！`);
        console.log('🏅 徽章解锁:', badgeName);
    }

    // 供跨次元兑换所模块调用：触发无限透支解锁
    triggerOverdraftCheck(friendCode) {
        const data = this._load(friendCode);
        data._overdraftUnlockPending = true;
        this._save(friendCode, data);
    }

    // ==================== 自定义徽章 ====================

    addCustomBadge(name, imageSrc, desc) {
        if (!name)     { this._showToast('请填写徽章名称！'); return false; }
        if (!imageSrc) { this._showToast('请上传徽章图片！'); return false; }
        if (!desc)     { this._showToast('请填写解锁条件！'); return false; }

        const data = this._load(this.friendCode);
        const id = 'custom_badge_' + Date.now();
        data.customBadges.push({
            id,
            name,
            imagePath: imageSrc,
            desc,
            hint: '',
            isBuiltin: false,
            isCustomUnlocked: false, // 需要手动解锁
        });
        this._save(this.friendCode, data);
        this._renderBadges(data);
        this._showToast(`「${name}」已添加！`);
        return true;
    }

    // 手动解锁自定义徽章
    unlockCustomBadge(badgeId) {
        const data = this._load(this.friendCode);
        const badge = data.customBadges.find(b => b.id === badgeId);
        if (!badge) return;
        if (data.unlocked[badgeId]) { this._showToast('已经解锁啦'); return; }

        data.unlocked[badgeId] = { unlockedAt: new Date().toISOString() };
        badge.isCustomUnlocked = true;

        if (window.MilestoneTimeline) {
            window.MilestoneTimeline.addRecord(this.friendCode, {
                type: 'badge_unlocked',
                date: new Date().toISOString(),
                payload: { badgeId, badgeName: badge.name },
            });
        }

        this._save(this.friendCode, data);
        this._renderBadges(data);
        this._showToast(`🏅 解锁了「${badge.name}」！`);
    }

    deleteCustomBadge(badgeId) {
        const data = this._load(this.friendCode);
        const idx = data.customBadges.findIndex(b => b.id === badgeId);
        if (idx === -1) return;
        const name = data.customBadges[idx].name;
        data.customBadges.splice(idx, 1);
        delete data.unlocked[badgeId];
        this._save(this.friendCode, data);
        this._renderBadges(data);
        this._showToast(`「${name}」已删除`);
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
        const bg = document.getElementById('ib-bg');
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
        if (!this.panelEl) this.panelEl = document.getElementById('ibPanel');
        if (!this.panelEl) return;

        const data = this.checkUnlocks(friendCode);
        this.panelEl.style.display = 'flex';

        if (!this._evBound) {
            this._bindEvents();
            this._evBound = true;
        }
        this._applyBg(data);
        this._renderBadges(data);
    }

    close() {
        if (this.panelEl) this.panelEl.style.display = 'none';
    }

    // ==================== 渲染 ====================

    _renderBadges(data) {
        const wrap = document.getElementById('ib-badges-wrap');
        if (!wrap) return;

        const all = this._getAllBadges(data);
        const unlockedIds = new Set(Object.keys(data.unlocked));

        // 更新顶部统计
        const countEl = document.getElementById('ib-unlocked-count');
        const totalEl = document.getElementById('ib-total-count');
        if (countEl) countEl.textContent = unlockedIds.size;
        if (totalEl) totalEl.textContent = `/ ${all.length}`;

        // 已解锁的排前面
        const sorted = [
            ...all.filter(b => unlockedIds.has(b.id)),
            ...all.filter(b => !unlockedIds.has(b.id)),
        ];

        wrap.innerHTML = sorted.map(badge => {
            const isUnlocked = unlockedIds.has(badge.id);
            const info = data.unlocked[badge.id];
            const isLimited = badge.id === 'heartbeat_limited' && info && !info.isPermanent;
            const dateStr = info ? this._formatDate(info.unlockedAt) : '';

            return `
            <div class="ib-badge-item ${isUnlocked ? 'ib-badge-unlocked' : 'ib-badge-locked'}"
                 onclick="window.IntimacyBadge._openBadgeDetail('${badge.id}')">
                <div class="ib-badge-img-wrap">
                    <img src="${badge.imagePath}"
                         class="ib-badge-img ${isUnlocked ? '' : 'ib-badge-img-gray'}"
                         onerror="this.style.opacity='0.2'">
                    ${isLimited ? '<div class="ib-badge-limited">限时</div>' : ''}
                    ${!isUnlocked ? '<div class="ib-badge-lock-icon">🔒</div>' : ''}
                </div>
                <div class="ib-badge-name">${badge.name}</div>
                ${isUnlocked
                    ? `<div class="ib-badge-date">${dateStr}</div>`
                    : `<div class="ib-badge-hint">${badge.hint || badge.desc}</div>`
                }
            </div>`;
        }).join('');

        // 上传按钮放最后
        wrap.innerHTML += `
            <div class="ib-badge-item ib-badge-add" onclick="window.IntimacyBadge._openUploadModal()">
                <div class="ib-badge-img-wrap ib-badge-add-icon">＋</div>
                <div class="ib-badge-name">上传徽章</div>
            </div>`;
    }

    // ==================== 徽章详情弹窗 ====================

    _openBadgeDetail(badgeId) {
        const data = this._load(this.friendCode);
        const all = this._getAllBadges(data);
        const badge = all.find(b => b.id === badgeId);
        if (!badge) return;

        const isUnlocked = !!data.unlocked[badgeId];
        const info = data.unlocked[badgeId];

        const modal = document.getElementById('ibDetailModal');
        if (!modal) return;

        document.getElementById('ib-detail-img').src = badge.imagePath;
        document.getElementById('ib-detail-img').className = `ib-detail-big-img ${isUnlocked ? '' : 'ib-badge-img-gray'}`;
        document.getElementById('ib-detail-name').textContent = badge.name;
        document.getElementById('ib-detail-desc').textContent = badge.desc;

        const statusEl = document.getElementById('ib-detail-status');
        if (isUnlocked) {
            statusEl.textContent = `✦ 已解锁 · ${this._formatDate(info.unlockedAt)}`;
            statusEl.className = 'ib-detail-status ib-detail-status-on';
        } else {
            statusEl.textContent = '🔒 尚未解锁';
            statusEl.className = 'ib-detail-status ib-detail-status-off';
        }

        // 自定义徽章显示手动解锁/删除按钮
        const actionsEl = document.getElementById('ib-detail-actions');
        if (!badge.isBuiltin) {
            actionsEl.innerHTML = `
                ${!isUnlocked ? `<button class="ib-detail-btn ib-detail-btn-unlock" onclick="window.IntimacyBadge.unlockCustomBadge('${badgeId}'); window.IntimacyBadge._closeDetailModal();">手动解锁</button>` : ''}
                <button class="ib-detail-btn ib-detail-btn-delete" onclick="window.IntimacyBadge.deleteCustomBadge('${badgeId}'); window.IntimacyBadge._closeDetailModal();">删除徽章</button>`;
        } else {
            actionsEl.innerHTML = '';
        }

        modal.style.display = 'flex';
    }

    _closeDetailModal() {
        const m = document.getElementById('ibDetailModal');
        if (m) m.style.display = 'none';
    }

    // ==================== 上传自定义徽章弹窗 ====================

    _openUploadModal() {
        const m = document.getElementById('ibUploadModal');
        if (!m) return;
        // 清空表单
        ['ib-up-name', 'ib-up-desc'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const preview = document.getElementById('ib-up-preview');
        if (preview) { preview.src = ''; preview.style.display = 'none'; }
        this._uploadImageSrc = null;
        m.style.display = 'flex';
    }

    _closeUploadModal() {
        const m = document.getElementById('ibUploadModal');
        if (m) m.style.display = 'none';
    }

    // ==================== 背景弹窗 ====================

    _openBgModal() {
        const m = document.getElementById('ibBgModal');
        if (m) m.style.display = 'flex';
    }
    _closeBgModal() {
        const m = document.getElementById('ibBgModal');
        if (m) m.style.display = 'none';
    }

    // ==================== 事件绑定 ====================

    _bindEvents() {
        const back = document.getElementById('ib-back-btn');
        if (back) back.addEventListener('click', () => this.close());

        const bgBtn = document.getElementById('ib-custom-btn');
        if (bgBtn) bgBtn.addEventListener('click', () => this._openBgModal());

        this._bindBgModalEvents();
        this._bindUploadModalEvents();
        this._bindDetailModalEvents();
    }

    _bindDetailModalEvents() {
        const overlay = document.getElementById('ibDetailOverlay');
        if (overlay) overlay.addEventListener('click', () => this._closeDetailModal());
        const close = document.getElementById('ibDetailClose');
        if (close) close.addEventListener('click', () => this._closeDetailModal());
    }

    _bindBgModalEvents() {
        const overlay = document.getElementById('ibBgOverlay');
        if (overlay) overlay.addEventListener('click', () => this._closeBgModal());
        const close = document.getElementById('ibBgClose');
        if (close) close.addEventListener('click', () => this._closeBgModal());

        const applyUrl = document.getElementById('ib-bg-url-apply');
        if (applyUrl) applyUrl.addEventListener('click', () => {
            const url = document.getElementById('ib-bg-url')?.value?.trim();
            if (url) { this.setBgImage(url); this._closeBgModal(); }
        });

        const fileInput = document.getElementById('ib-bg-file');
        const uploadBtn = document.getElementById('ib-bg-upload');
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', e => {
                const file = e.target.files[0];
                if (!file) return;
                this._compressImage(file, src => { this.setBgImage(src); this._closeBgModal(); });
            });
        }

        const clearBtn = document.getElementById('ib-bg-clear');
        if (clearBtn) clearBtn.addEventListener('click', () => { this.clearBgImage(); this._closeBgModal(); });
    }

    _bindUploadModalEvents() {
        const overlay = document.getElementById('ibUploadOverlay');
        if (overlay) overlay.addEventListener('click', () => this._closeUploadModal());
        const close = document.getElementById('ibUploadClose');
        if (close) close.addEventListener('click', () => this._closeUploadModal());

        const imgFile = document.getElementById('ib-up-img-file');
        const imgBtn  = document.getElementById('ib-up-img-btn');
        if (imgBtn && imgFile) {
            imgBtn.addEventListener('click', () => imgFile.click());
            imgFile.addEventListener('change', e => {
                const file = e.target.files[0];
                if (!file) return;
                this._compressImage(file, src => {
                    this._uploadImageSrc = src;
                    const p = document.getElementById('ib-up-preview');
                    if (p) { p.src = src; p.style.display = 'block'; }
                });
            });
        }

        const urlApply = document.getElementById('ib-up-img-url-apply');
        if (urlApply) urlApply.addEventListener('click', () => {
            const url = document.getElementById('ib-up-img-url')?.value?.trim();
            if (url) {
                this._uploadImageSrc = url;
                const p = document.getElementById('ib-up-preview');
                if (p) { p.src = url; p.style.display = 'block'; }
            }
        });

        const confirm = document.getElementById('ib-up-confirm');
        if (confirm) confirm.addEventListener('click', () => {
            const name = document.getElementById('ib-up-name')?.value?.trim();
            const desc = document.getElementById('ib-up-desc')?.value?.trim();
            if (!name)               { this._showToast('请填写徽章名称！'); return; }
            if (!this._uploadImageSrc) { this._showToast('请上传徽章图片！'); return; }
            if (!desc)               { this._showToast('请填写解锁条件！'); return; }
            const ok = this.addCustomBadge(name, this._uploadImageSrc, desc);
            if (ok) this._closeUploadModal();
        });
    }

    // ==================== 工具方法 ====================

    _hasKeyword(text, type) {
        if (!text) return false;
        const t = text.toLowerCase();
        return IntimacyBadgeManager.KEYWORDS[type].some(kw => t.includes(kw.toLowerCase()));
    }

    _dateStr(d) {
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    _formatDate(iso) {
        if (!iso) return '';
        try {
            const d = new Date(iso);
            return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
        } catch(e) { return ''; }
    }

    _compressImage(file, cb) {
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const max = 400;
                let { width: w, height: h } = img;
                if (w > max || h > max) {
                    if (w > h) { h = h * max / w; w = max; }
                    else       { w = w * max / h; h = max; }
                }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                cb(canvas.toDataURL('image/png', 0.85));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    _showToast(msg) {
        let t = document.getElementById('ibToast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'ibToast';
            t.className = 'ib-toast';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.classList.add('ib-toast-show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => t.classList.remove('ib-toast-show'), 2200);
    }

    // ==================== AI系统提示 ====================

    getAIContextInfo(friendCode) {
        const data = this._load(friendCode);
        const all = this._getAllBadges(data);
        const unlockedIds = Object.keys(data.unlocked);
        const unlocked = all.filter(b => unlockedIds.includes(b.id));
        const locked   = all.filter(b => !unlockedIds.includes(b.id));
        const t = data.tracking;

        let info = '\n\n【亲密徽章状态】\n';
        if (unlocked.length > 0) {
            info += `已解锁（${unlocked.length}个）：${unlocked.map(b => b.name).join('、')}\n`;
        } else {
            info += '尚未解锁任何徽章\n';
        }

        // 挑几个接近解锁的提示
        const hints = [];
        if (!data.unlocked['exclusive_exception'])
            hints.push(`专属例外（凌晨聊天累计${t.lateNightDays?.length || 0}/7天）`);
        if (!data.unlocked['time_anchor'])
            hints.push(`时间锚点（早安+晚安累计${t.morningNightDays?.length || 0}/60天）`);
        if (!data.unlocked['dream_domain'])
            hints.push(`梦境管辖（晚安连续${t.consecutiveNightStreak || 0}/7天）`);
        if (hints.length > 0) info += `进度中：${hints.slice(0, 2).join('，')}\n`;

        info += '注：你可以自然地聊到徽章，比如提到快要解锁某个、或庆祝解锁了某个。根据你的人设决定要不要提，不要刻意。';
        return info;
    }
}

// ==================== 全局挂载 ====================
window.IntimacyBadgeManager = IntimacyBadgeManager;
