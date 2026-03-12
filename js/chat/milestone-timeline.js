/* ========================================
   MilestoneTimeline - 星迹留痕
   零手机 × 亲密关系
   ======================================== */

class MilestoneTimeline {

    // ==================== 事件类型配置 ====================

    static EVENT_TYPES = {
        charm_drawn:      { icon: '🎴', label: '抽到幸运字符' },
        charm_drawn_ai:   { icon: '🎴', label: 'TA抽到幸运字符' },
        charm_lit:        { icon: '✦',  label: '幸运字符完全点亮' },
        badge_unlocked:   { icon: '🏅', label: '解锁亲密徽章' },
        relation_bound:   { icon: '💍', label: '绑定关系' },
        relation_changed: { icon: '💍', label: '关系变更' },
        custom:           { icon: '⭐', label: '里程碑' },
    };

    // ==================== 构造 ====================

    constructor() {
        this._expandedIds = new Set(); // 记录哪些条目是展开的
    }

    // ==================== 存储 ====================

    _key(friendCode) {
        return `zero_phone_milestone_${friendCode}`;
    }

    _load(friendCode) {
        try {
            const raw = localStorage.getItem(this._key(friendCode));
            if (raw) return JSON.parse(raw);
        } catch(e) {}
        return { records: [] };
    }

    _save(friendCode, data) {
        try {
            localStorage.setItem(this._key(friendCode), JSON.stringify(data));
        } catch(e) {
            console.warn('星迹留痕存储失败:', e);
        }
    }

    // ==================== 写入记录（供其他模块调用）====================

    addRecord(friendCode, record) {
        const data = this._load(friendCode);
        const id = 'mt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        data.records.push({
            id,
            type: record.type || 'custom',
            date: record.date || new Date().toISOString(),
            // 事件附带的具体信息（字符名/徽章名/关系名等）
            payload: record.payload || this._buildPayload(record),
            userNote: null,   // 用户寄语
            aiNote: null,     // AI寄语
        });
        this._save(friendCode, data);
        // 如果面板正开着，刷新
        this._tryRefresh(friendCode);
        return id;
    }

    // 把旧格式的 record 字段兼容转成 payload
    _buildPayload(record) {
        const p = {};
        if (record.charmName)    p.charmName    = record.charmName;
        if (record.charmId)      p.charmId      = record.charmId;
        if (record.badgeName)    p.badgeName    = record.badgeName;
        if (record.badgeId)      p.badgeId      = record.badgeId;
        if (record.relationName) p.relationName = record.relationName;
        if (record.label)        p.label        = record.label;
        return p;
    }

    // ==================== 寄语操作 ====================

    writeUserNote(friendCode, recordId, text) {
        if (!text || !text.trim()) return false;
        const data = this._load(friendCode);
        const rec = data.records.find(r => r.id === recordId);
        if (!rec) return false;
        rec.userNote = { text: text.trim(), createdAt: new Date().toISOString() };
        this._save(friendCode, data);
        return true;
    }

    deleteUserNote(friendCode, recordId) {
        const data = this._load(friendCode);
        const rec = data.records.find(r => r.id === recordId);
        if (!rec) return false;
        rec.userNote = null;
        this._save(friendCode, data);
        return true;
    }

    // AI寄语（由chat-interface.js在AI自然触发时调用）
    writeAiNote(friendCode, recordId, text) {
        if (!text || !text.trim()) return false;
        const data = this._load(friendCode);
        const rec = data.records.find(r => r.id === recordId);
        if (!rec) return false;
        rec.aiNote = { text: text.trim(), createdAt: new Date().toISOString() };
        this._save(friendCode, data);
        this._tryRefresh(friendCode);
        return true;
    }

    // ==================== 渲染 ====================

    _tryRefresh(friendCode) {
        const panel = document.getElementById('intimacyPanelPage');
        if (panel && panel.style.display !== 'none') {
            this.render(friendCode);
        }
    }

    render(friendCode) {
        const wrap = document.getElementById('mt-timeline-wrap');
        if (!wrap) return;

        const data = this._load(friendCode);
        const records = [...data.records].reverse(); // 最新的在上面

        if (records.length === 0) {
            wrap.innerHTML = `
                <div class="mt-empty">
                    <div class="mt-empty-icon">✦</div>
                    <div class="mt-empty-text">还没有任何印记<br>快去解锁你们的第一个故事吧</div>
                </div>`;
            return;
        }

        wrap.innerHTML = records.map(rec => this._renderRecord(rec, friendCode)).join('');
    }

    _renderRecord(rec, friendCode) {
        const typeCfg = MilestoneTimeline.EVENT_TYPES[rec.type] || MilestoneTimeline.EVENT_TYPES.custom;
        const dateStr = this._formatDate(rec.date);
        const title = this._buildTitle(rec, typeCfg);
        const isExpanded = this._expandedIds.has(rec.id);

        const hasUserNote = !!rec.userNote;
        const hasAiNote   = !!rec.aiNote;

        return `
        <div class="mt-record" id="mt-rec-${rec.id}">
            <!-- 时间轴线 & 节点 -->
            <div class="mt-line-col">
                <div class="mt-dot">${typeCfg.icon}</div>
                <div class="mt-vline"></div>
            </div>
            <!-- 内容 -->
            <div class="mt-body">
                <div class="mt-header" onclick="window.MilestoneTimeline._toggleExpand('${rec.id}', '${friendCode}')">
                    <div class="mt-title-wrap">
                        <div class="mt-title">${title}</div>
                        <div class="mt-date">${dateStr}</div>
                    </div>
                    <div class="mt-chevron ${isExpanded ? 'mt-chevron-open' : ''}">›</div>
                </div>

                <!-- 展开内容 -->
                <div class="mt-expand ${isExpanded ? 'mt-expand-open' : ''}">
                    <!-- 用户寄语 -->
                    <div class="mt-note-block mt-note-user">
                        <div class="mt-note-header">
                            <span class="mt-note-who">你的寄语</span>
                            ${hasUserNote ? `<button class="mt-note-del-btn" onclick="window.MilestoneTimeline._deleteUserNote('${rec.id}','${friendCode}')">删除</button>` : ''}
                        </div>
                        ${hasUserNote
                            ? `<div class="mt-note-text">${this._escapeHtml(rec.userNote.text)}</div>
                               <div class="mt-note-meta">${this._formatDate(rec.userNote.createdAt)}</div>`
                            : `<div class="mt-note-input-wrap">
                                   <textarea class="mt-note-input" id="mt-input-${rec.id}" placeholder="写点什么留念一下吧…" rows="3"></textarea>
                                   <button class="mt-note-save-btn" onclick="window.MilestoneTimeline._saveUserNote('${rec.id}','${friendCode}')">留下</button>
                               </div>`
                        }
                    </div>
                    <!-- AI寄语 -->
                    <div class="mt-note-block mt-note-ai">
                        <div class="mt-note-header">
                            <span class="mt-note-who mt-note-who-ai">TA的寄语</span>
                        </div>
                        ${hasAiNote
                            ? `<div class="mt-note-text mt-note-text-ai">${this._escapeHtml(rec.aiNote.text)}</div>
                               <div class="mt-note-meta">${this._formatDate(rec.aiNote.createdAt)}</div>`
                            : `<div class="mt-note-empty-ai">TA还没有留言…</div>`
                        }
                    </div>
                </div>
            </div>
        </div>`;
    }

    _buildTitle(rec, typeCfg) {
        const p = rec.payload || {};
        switch(rec.type) {
            case 'charm_drawn':
                return `抽到了幸运字符「${p.charmName || '未知'}」`;
            case 'charm_drawn_ai':
                return `TA抽到了幸运字符「${p.charmName || '未知'}」`;
            case 'charm_lit':
                return `幸运字符「${p.charmName || '未知'}」完全点亮 ✦`;
            case 'badge_unlocked':
                return `解锁了亲密徽章「${p.badgeName || '未知'}」`;
            case 'relation_bound':
                return `与TA成为了「${p.relationName || '未知'}」`;
            case 'relation_changed':
                return `关系变更为「${p.relationName || '未知'}」`;
            default:
                return p.label || typeCfg.label;
        }
    }

    // ==================== 展开/折叠 ====================

    _toggleExpand(recordId, friendCode) {
        if (this._expandedIds.has(recordId)) {
            this._expandedIds.delete(recordId);
        } else {
            this._expandedIds.add(recordId);
        }
        this.render(friendCode);
    }

    // ==================== 寄语操作（供HTML onclick调用）====================

    _saveUserNote(recordId, friendCode) {
        const input = document.getElementById(`mt-input-${recordId}`);
        if (!input) return;
        const text = input.value.trim();
        if (!text) {
            this._showToast('写点什么再留下吧～');
            return;
        }
        this.writeUserNote(friendCode, recordId, text);
        this.render(friendCode);
        this._showToast('✦ 寄语已留下');
    }

    _deleteUserNote(recordId, friendCode) {
        const ok = window.confirm('确定删除这条寄语吗？删除后可以重新写。');
        if (!ok) return;
        this.deleteUserNote(friendCode, recordId);
        this.render(friendCode);
    }

    // ==================== AI系统提示（供chat-interface.js调用）====================

    getAIContextInfo(friendCode) {
        const data = this._load(friendCode);
        const records = [...data.records].reverse().slice(0, 5); // 最近5条
        if (records.length === 0) return '';

        let info = '\n\n【星迹留痕·最近解锁记录】\n';
        records.forEach(rec => {
            const typeCfg = MilestoneTimeline.EVENT_TYPES[rec.type] || {};
            const title = this._buildTitle(rec, typeCfg);
            const dateStr = this._formatDate(rec.date);
            info += `• [ID:${rec.id}] ${dateStr} ${title}`;
            if (rec.userNote) info += `（用户寄语："${rec.userNote.text}"）`;
            if (rec.aiNote)   info += `（你的留言："${rec.aiNote.text}"）`;
            else info += '（你还没有留言）';
            info += '\n';
        });
        info += '注：你可以在聊天中自然提到这些里程碑，也可以选择主动写一条留言。如果你想留言，请在回复中包含 [MT_NOTE:记录ID|你想写的留言内容]，格式严格。留言要符合你的人设，也可以完全不提。';

        return info;
    }

    // ==================== 工具方法 ====================

    _formatDate(iso) {
        if (!iso) return '';
        try {
            const d = new Date(iso);
            const now = new Date();
            const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
            if (diffDays === 0) return '今天';
            if (diffDays === 1) return '昨天';
            if (diffDays < 7)  return `${diffDays}天前`;
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            if (y === now.getFullYear()) return `${m}月${day}日`;
            return `${y}.${m}.${day}`;
        } catch(e) { return ''; }
    }

    _escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/\n/g, '<br>');
    }

    _showToast(msg) {
        let toast = document.getElementById('mtToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'mtToast';
            toast.className = 'mt-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('mt-toast-show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.classList.remove('mt-toast-show');
        }, 2200);
    }
}

// ==================== 全局挂载 ====================
window.MilestoneTimeline = new MilestoneTimeline();
