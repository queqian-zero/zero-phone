// ==================== 记忆库（档案室） ====================
class MemoryLibrary {
    open() {
        document.getElementById('memoryLibPage')?.remove();
        const ci = window.chatInterface;
        if (!ci?.storage) return;

        const friends = ci.storage.getAllFriends() || [];
        const page = document.createElement('div');
        page.id = 'memoryLibPage';
        page.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:8000;background:#0d0d0d;display:flex;flex-direction:column;';

        page.innerHTML = `
            <div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;">
                <button id="mlBack" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:20px;cursor:pointer;">&#8592;</button>
                <div style="flex:1;font-size:16px;font-weight:600;color:#fff;text-align:center;">记忆库</div>
            </div>
            <div style="padding:12px 16px;font-size:11px;color:rgba(255,255,255,0.2);text-align:center;">每个角色的专属档案</div>
            <div id="mlGrid" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px 16px;min-height:0;">
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
                    ${friends.map(f => {
                        const avatar = f.avatar || '';
                        const name = f.nickname || f.name || '???';
                        return `<div class="ml-char-card" data-code="${f.code}" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;overflow:hidden;cursor:pointer;">
                            <div style="width:100%;aspect-ratio:1;background:rgba(255,255,255,0.02);display:flex;align-items:center;justify-content:center;overflow:hidden;">
                                ${avatar ? `<img src="${avatar}" style="width:100%;height:100%;object-fit:cover;">` : `<div style="font-size:36px;color:rgba(255,255,255,0.1);">${this._esc(name.charAt(0))}</div>`}
                            </div>
                            <div style="padding:10px;text-align:center;">
                                <div style="font-size:14px;font-weight:600;color:#fff;">${this._esc(name)}</div>
                                <div style="font-size:10px;color:rgba(255,255,255,0.2);margin-top:2px;">${f.code}</div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;

        document.body.appendChild(page);
        page.querySelector('#mlBack')?.addEventListener('click', () => page.remove());
        page.querySelectorAll('.ml-char-card').forEach(card => {
            card.addEventListener('click', () => this._openCharArchive(card.dataset.code));
        });
    }

    // ==================== 角色档案子页 ====================
    _openCharArchive(friendCode) {
        const ci = window.chatInterface;
        if (!ci?.storage) return;
        const friend = ci.storage.getFriendByCode(friendCode);
        if (!friend) return;
        const name = friend.nickname || friend.name || '???';

        document.getElementById('mlCharPage')?.remove();
        const page = document.createElement('div');
        page.id = 'mlCharPage';
        page.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:8500;background:#0d0d0d;display:flex;flex-direction:column;';

        const menuItem = (icon, label, id, placeholder) => `<div class="ml-menu-item" id="${id}" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.03);cursor:pointer;">
            <span style="font-size:16px;color:rgba(255,255,255,0.4);width:24px;text-align:center;">${icon}</span>
            <div style="flex:1;"><div style="font-size:14px;color:rgba(255,255,255,0.7);">${label}</div>${placeholder ? `<div style="font-size:10px;color:rgba(255,255,255,0.15);margin-top:2px;">${placeholder}</div>` : ''}</div>
            <span style="color:rgba(255,255,255,0.15);">&#8250;</span>
        </div>`;

        page.innerHTML = `
            <div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;">
                <button id="mcBack" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:20px;cursor:pointer;">&#8592;</button>
                <div style="flex:1;font-size:16px;font-weight:600;color:#fff;text-align:center;">${this._esc(name)} 的档案</div>
            </div>
            <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;min-height:0;">
                <!-- 角色卡头部 -->
                <div style="text-align:center;padding:24px 16px 16px;">
                    <div style="width:80px;height:80px;border-radius:16px;overflow:hidden;margin:0 auto 10px;background:rgba(255,255,255,0.03);">
                        ${friend.avatar ? `<img src="${friend.avatar}" style="width:100%;height:100%;object-fit:cover;">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;color:rgba(255,255,255,0.1);">${this._esc(name.charAt(0))}</div>`}
                    </div>
                    <div style="font-size:18px;font-weight:700;color:#fff;">${this._esc(name)}</div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.2);margin-top:4px;">${friendCode}</div>
                </div>
                <!-- 菜单 -->
                <div style="margin:0 16px;border:1px solid rgba(255,255,255,0.04);border-radius:12px;overflow:hidden;">
                    ${menuItem('&#9786;', '表情包收藏', 'mlStickers', '占位 - TA偷的表情包')}
                    ${menuItem('&#9998;', '聊天总结', 'mlChatSummary', '线上聊天的记忆总结')}
                    ${menuItem('&#9829;', '核心记忆', 'mlCoreMemory', '线上聊天的核心记忆')}
                    ${menuItem('&#9998;', '记事本', 'mlNotebook', 'TA的碎碎念和日记')}
                    ${menuItem('&#9670;', '剧场归档', 'mlTheaterArchive', '占位 - 次元剧场存档')}
                </div>
            </div>`;

        document.body.appendChild(page);
        page.querySelector('#mcBack')?.addEventListener('click', () => page.remove());

        // 聊天总结
        page.querySelector('#mlChatSummary')?.addEventListener('click', () => {
            this._showChatSummary(friendCode, name);
        });

        // 核心记忆
        page.querySelector('#mlCoreMemory')?.addEventListener('click', () => {
            this._showCoreMemories(friendCode, name);
        });

        // 记事本（占位但给个提示）
        page.querySelector('#mlNotebook')?.addEventListener('click', () => {
            this._toast('记事本功能开发中...');
        });

        // 表情包收藏（占位）
        page.querySelector('#mlStickers')?.addEventListener('click', () => {
            this._toast('表情包收藏功能开发中...');
        });

        // 剧场归档（占位）
        page.querySelector('#mlTheaterArchive')?.addEventListener('click', () => {
            this._toast('剧场归档功能开发中...');
        });
    }

    // ==================== 聊天总结查看 ====================
    _showChatSummary(friendCode, name) {
        const ci = window.chatInterface;
        if (!ci?.storage) return;
        const settings = ci.storage.loadFriendSettings(friendCode) || {};
        const summaries = settings.chatSummary || settings.memorySummary || '';

        document.getElementById('mlDetailPage')?.remove();
        const page = document.createElement('div');
        page.id = 'mlDetailPage';
        page.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9000;background:#111;display:flex;flex-direction:column;';
        page.innerHTML = `
            <div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;">
                <button id="mdBack" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:20px;cursor:pointer;">&#8592;</button>
                <div style="flex:1;font-size:16px;font-weight:600;color:#fff;text-align:center;">${this._esc(name)} 的聊天总结</div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:16px;min-height:0;">
                ${summaries ? `<div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.8;white-space:pre-wrap;">${this._esc(summaries)}</div>` : '<div style="text-align:center;padding:40px 0;color:rgba(255,255,255,0.15);font-size:13px;">暂无聊天总结</div>'}
            </div>`;
        document.body.appendChild(page);
        page.querySelector('#mdBack')?.addEventListener('click', () => page.remove());
    }

    // ==================== 核心记忆查看 ====================
    _showCoreMemories(friendCode, name) {
        const ci = window.chatInterface;
        if (!ci?.storage) return;
        const memories = ci.storage.getCoreMemories(friendCode) || [];

        document.getElementById('mlDetailPage')?.remove();
        const page = document.createElement('div');
        page.id = 'mlDetailPage';
        page.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9000;background:#111;display:flex;flex-direction:column;';
        page.innerHTML = `
            <div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;">
                <button id="mdBack" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:20px;cursor:pointer;">&#8592;</button>
                <div style="flex:1;font-size:16px;font-weight:600;color:#fff;text-align:center;">${this._esc(name)} 的核心记忆</div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:16px;min-height:0;">
                ${memories.length === 0 ? '<div style="text-align:center;padding:40px 0;color:rgba(255,255,255,0.15);font-size:13px;">暂无核心记忆</div>' :
                    memories.map(m => `<div style="margin-bottom:14px;padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                        <div style="font-size:12px;color:rgba(255,100,100,0.6);margin-bottom:6px;">${this._esc(m.date || '')}</div>
                        <div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;">${this._esc(m.content || '')}</div>
                    </div>`).join('')}
            </div>`;
        document.body.appendChild(page);
        page.querySelector('#mdBack')?.addEventListener('click', () => page.remove());
    }

    _esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    _toast(msg) { window.chatInterface?.showCssToast?.(msg) || alert(msg); }
}

window.memoryLibrary = new MemoryLibrary();
