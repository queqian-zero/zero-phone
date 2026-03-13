/* ========================================
   zero-equip.js — 佩戴标识系统
   统一管理幸运字符 / 亲密徽章 / 关系绑定
   的佩戴状态读取、弹窗确认、界面刷新
   ======================================== */

window.ZeroEquip = {

    // ══════════════════════════════════════
    // 取消佩戴确认弹窗
    // name: 要取消的物品名称，cb: 确认后回调
    // ══════════════════════════════════════
    confirmUnequip(name, cb) {
        // 复用已有弹窗，若不存在则动态创建
        let modal = document.getElementById('zeUnequipModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'zeUnequipModal';
            modal.innerHTML = `
                <div id="zeUnequipOverlay" style="position:absolute;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);"></div>
                <div style="position:relative;z-index:1;width:100%;background:rgba(12,16,26,0.98);border-top-left-radius:28px;border-top-right-radius:28px;padding:28px 20px 40px;text-align:center;">
                    <div id="zeUnequipTitle" style="font-size:17px;font-weight:600;color:rgba(255,255,255,0.9);margin-bottom:10px;"></div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:28px;">取消佩戴后可以随时重新佩戴</div>
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <button id="zeUnequipConfirm" style="background:rgba(255,80,80,0.1);border:1px solid rgba(255,100,100,0.2);border-radius:14px;color:rgba(255,150,150,0.85);font-size:15px;padding:14px;cursor:pointer;font-family:inherit;font-weight:500;">同意取消佩戴</button>
                        <button id="zeUnequipCancel" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px;color:rgba(255,255,255,0.55);font-size:15px;padding:14px;cursor:pointer;font-family:inherit;">再商量商量</button>
                    </div>
                </div>`;
            Object.assign(modal.style, {
                display: 'none', position: 'fixed', inset: '0',
                zIndex: '9900', alignItems: 'flex-end', justifyContent: 'center',
            });
            document.body.appendChild(modal);
        }

        document.getElementById('zeUnequipTitle').textContent = `取消佩戴「${name}」？`;
        modal.style.display = 'flex';

        const close = () => { modal.style.display = 'none'; };

        const confirmBtn = document.getElementById('zeUnequipConfirm');
        const cancelBtn  = document.getElementById('zeUnequipCancel');
        const overlay    = document.getElementById('zeUnequipOverlay');

        // 每次打开前清空旧监听
        const newConfirm = confirmBtn.cloneNode(true);
        const newCancel  = cancelBtn.cloneNode(true);
        const newOverlay = overlay.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
        overlay.parentNode.replaceChild(newOverlay, overlay);

        document.getElementById('zeUnequipConfirm').addEventListener('click', () => { close(); cb(); });
        document.getElementById('zeUnequipCancel').addEventListener('click', close);
        document.getElementById('zeUnequipOverlay').addEventListener('click', close);
    },

    // ══════════════════════════════════════
    // 读取三个模块当前佩戴的芯片
    // 返回 Array<{ type, img, label, imgFallback }>
    // ══════════════════════════════════════
    getChips(friendCode) {
        const chips = [];

        // ── 关系绑定 ──
        if (window.Relationship) {
            const chip = window.Relationship.getEquippedChip(friendCode);
            if (chip) chips.push(chip);
        }

        // ── 亲密徽章 ──
        if (window.IntimacyBadge) {
            const chip = window.IntimacyBadge.getEquippedChip(friendCode);
            if (chip) chips.push(chip);
        }

        // ── 幸运字符 ──
        if (window.LuckyCharm) {
            const chip = window.LuckyCharm.getEquippedChip(friendCode);
            if (chip) chips.push(chip);
        }

        return chips;
    },

    // ══════════════════════════════════════
    // 生成芯片 HTML（用于聊天列表 & 聊天头部）
    // size: 'sm'（列表）| 'md'（头部）
    // ══════════════════════════════════════
    renderChipsHTML(chips, size = 'sm') {
        if (!chips.length) return '';
        const px = size === 'sm' ? '13px' : '14px';
        const imgSz = size === 'sm' ? '14px' : '16px';
        const pad = size === 'sm' ? '2px 7px 2px 4px' : '3px 9px 3px 5px';
        return chips.map(c => {
            const imgPart = c.img
                ? `<img src="${c.img}" style="width:${imgSz};height:${imgSz};border-radius:50%;object-fit:contain;background:rgba(255,255,255,0.08);padding:1px;flex-shrink:0;" onerror="this.style.display='none'">`
                : `<span style="font-size:${imgSz};">${c.imgFallback || '✦'}</span>`;
            return `<span class="ze-chip ze-chip-${c.type}" style="display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:${pad};font-size:${px};color:rgba(255,255,255,0.7);white-space:nowrap;max-width:90px;overflow:hidden;text-overflow:ellipsis;">${imgPart}<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.label}</span></span>`;
        }).join('');
    },

    // ══════════════════════════════════════
    // 刷新聊天界面头部芯片（loadChat 后调用）
    // ══════════════════════════════════════
    refreshChatHeader(friendCode) {
        const wrap = document.getElementById('zeChatHeaderChips');
        if (!wrap) return;
        const chips = this.getChips(friendCode);
        wrap.innerHTML = chips.length ? this.renderChipsHTML(chips, 'md') : '';
        wrap.style.display = chips.length ? 'flex' : 'none';
    },

    // ══════════════════════════════════════
    // 刷新聊天列表某一项的芯片行
    // ══════════════════════════════════════
    refreshChatListItem(friendCode) {
        const row = document.querySelector(`.chat-list-item[data-code="${friendCode}"] .ze-chips-row`);
        if (!row) return;
        const chips = this.getChips(friendCode);
        row.innerHTML = chips.length ? this.renderChipsHTML(chips, 'sm') : '';
        row.style.display = chips.length ? 'flex' : 'none';
    },

    // ══════════════════════════════════════
    // 刷新两处（佩戴/取消后统一调用）
    // ══════════════════════════════════════
    refreshAll(friendCode) {
        this.refreshChatHeader(friendCode);
        this.refreshChatListItem(friendCode);
    },
};
