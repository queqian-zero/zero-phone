// ==================== 记忆库（档案室） ====================
class MemoryLibrary {
    _store() { return window.chatInterface?.storage || window.chatApp?.storage; }
    open() {
        document.getElementById('memoryLibPage')?.remove();
        if (!this._store()) { this._toast('存储不可用'); return; }

        const friends = this._store().getAllFriends() || [];
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
        if (!this._store()) return;
        const friend = this._store().getFriendByCode(friendCode);
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

        // 记事本
        page.querySelector('#mlNotebook')?.addEventListener('click', () => {
            this._openNotebook(friendCode, name);
        });

        // 表情包收藏（占位）
        page.querySelector('#mlStickers')?.addEventListener('click', () => {
            this._toast('表情包收藏功能开发中...');
        });

        // 剧场归档
        page.querySelector('#mlTheaterArchive')?.addEventListener('click', () => {
            this._showTheaterArchive(friendCode, name);
        });
    }

    // ==================== 聊天总结查看 ====================
    _showChatSummary(friendCode, name) {
        const ci = window.chatInterface;
        if (!this._store()) return;
        const summaries = this._store().getChatSummaries(friendCode) || [];

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
                ${summaries.length === 0 ? '<div style="text-align:center;padding:40px 0;color:rgba(255,255,255,0.15);font-size:13px;">暂无聊天总结</div>' :
                    summaries.slice().reverse().map(s => `<div style="margin-bottom:14px;padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                        <div style="font-size:10px;color:rgba(255,255,255,0.2);margin-bottom:6px;">${s.createdAt ? new Date(s.createdAt).toLocaleString('zh-CN') : ''} | ${s.messageCount||0}条消息</div>
                        <div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.8;white-space:pre-wrap;">${this._esc(s.summary || s.text || '')}</div>
                    </div>`).join('')}
            </div>`;
        document.body.appendChild(page);
        page.querySelector('#mdBack')?.addEventListener('click', () => page.remove());
    }

    // ==================== 核心记忆查看 ====================
    _showCoreMemories(friendCode, name) {
        const ci = window.chatInterface;
        if (!this._store()) return;
        const memories = this._store().getCoreMemories(friendCode) || [];

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
                <div style="margin-top:20px;padding:12px;background:rgba(255,255,255,0.015);border-radius:10px;text-align:center;">
                    <div style="font-size:11px;color:rgba(255,255,255,0.12);line-height:1.7;">&#9670; 记忆碎片（TA已遗忘的记忆）不在这里<br>如需查看，请到聊天设置 → 记忆 → 记忆碎片</div>
                </div>
            </div>`;
        document.body.appendChild(page);
        page.querySelector('#mdBack')?.addEventListener('click', () => page.remove());
    }

    // ==================== 记事本（碎碎念 + 日记） ====================
    _openNotebook(friendCode, name) {
        document.getElementById('mlDetailPage')?.remove();
        const page = document.createElement('div');
        page.id = 'mlDetailPage';
        page.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9000;background:#111;display:flex;flex-direction:column;';
        
        page.innerHTML = `
            <div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;">
                <button id="nbBack" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:20px;cursor:pointer;">&#8592;</button>
                <div style="flex:1;font-size:16px;font-weight:600;color:#fff;text-align:center;">${this._esc(name)} 的记事本</div>
            </div>
            <div style="display:flex;border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;">
                <div id="nbTabNotes" class="nb-tab" style="flex:1;padding:10px;text-align:center;font-size:13px;cursor:pointer;color:#f0932b;border-bottom:2px solid #f0932b;">碎碎念</div>
                <div id="nbTabDiary" class="nb-tab" style="flex:1;padding:10px;text-align:center;font-size:13px;cursor:pointer;color:rgba(255,255,255,0.4);">日记</div>
            </div>
            <div id="nbContent" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;min-height:0;"></div>
            <div style="padding:10px 16px calc(10px + env(safe-area-inset-bottom));border-top:1px solid rgba(255,255,255,0.04);flex-shrink:0;text-align:center;">
                <div style="font-size:10px;color:rgba(255,255,255,0.15);">记事本内容由TA撰写</div>
            </div>`;
        
        document.body.appendChild(page);
        this._nbFriendCode = friendCode;
        this._nbTab = 'notes';
        
        page.querySelector('#nbBack')?.addEventListener('click', () => { page.remove(); this._openCharArchive(friendCode); });
        page.querySelector('#nbTabNotes')?.addEventListener('click', () => { this._nbTab = 'notes'; this._refreshNotebook(page, friendCode, name); });
        page.querySelector('#nbTabDiary')?.addEventListener('click', () => { this._nbTab = 'diary'; this._refreshNotebook(page, friendCode, name); });
        
        this._refreshNotebook(page, friendCode, name);
    }

    _refreshNotebook(page, friendCode, name) {
        const ci = window.chatInterface;
        const data = this._store()?.getIntimacyData(friendCode) || {};
        if (!data.notebook) data.notebook = { notes: [], diary: [] };
        const items = this._nbTab === 'notes' ? (data.notebook.notes || []) : (data.notebook.diary || []);
        
        // Tab样式
        page.querySelector('#nbTabNotes').style.cssText = `flex:1;padding:10px;text-align:center;font-size:13px;cursor:pointer;${this._nbTab === 'notes' ? 'color:#f0932b;border-bottom:2px solid #f0932b;' : 'color:rgba(255,255,255,0.4);'}`;
        page.querySelector('#nbTabDiary').style.cssText = `flex:1;padding:10px;text-align:center;font-size:13px;cursor:pointer;${this._nbTab === 'diary' ? 'color:#f0932b;border-bottom:2px solid #f0932b;' : 'color:rgba(255,255,255,0.4);'}`;
        
        const content = page.querySelector('#nbContent');
        if (items.length === 0) {
            content.innerHTML = `<div style="text-align:center;padding:40px 0;color:rgba(255,255,255,0.12);font-size:13px;">${this._nbTab === 'notes' ? '还没有碎碎念' : '还没有日记'}</div>`;
            return;
        }
        
        if (this._nbTab === 'notes') {
            // 碎碎念 — 便签风格
            content.innerHTML = items.slice().reverse().map(n => `<div class="nb-note-card" data-id="${n.id}" style="margin-bottom:12px;padding:14px;background:rgba(255,240,200,0.04);border:1px dashed rgba(255,220,150,0.12);border-radius:10px;cursor:pointer;position:relative;">
                <div class="nb-note-text" style="font-size:14px;color:rgba(255,255,255,0.65);line-height:1.7;white-space:pre-wrap;font-family:serif;max-height:80px;overflow:hidden;">${this._esc(n.content || '')}</div>
                <div style="margin-top:8px;font-size:9px;color:rgba(255,255,255,0.15);text-align:right;">${n.createdAt ? new Date(n.createdAt).toLocaleString('zh-CN') : ''}</div>
            </div>`).join('');
        } else {
            // 日记 — 手账风格
            let diaryHtml = '';
            items.slice().reverse().forEach(d => {
                diaryHtml += '<div class="nb-diary-card" data-id="' + d.id + '" style="margin-bottom:20px;border-radius:14px;overflow:hidden;cursor:pointer;position:relative;background:linear-gradient(145deg,rgba(255,248,235,0.06),rgba(255,240,220,0.03));border:1px solid rgba(255,230,180,0.08);">';
                // 日记头部：日期条
                diaryHtml += '<div style="padding:12px 16px;background:rgba(255,230,180,0.04);border-bottom:1px dashed rgba(255,220,150,0.08);">';
                diaryHtml += '<div style="font-size:15px;font-weight:700;color:rgba(255,220,170,0.7);letter-spacing:1px;">' + this._esc(d.date || '') + '</div>';
                if (d.time) diaryHtml += '<div style="font-size:11px;color:rgba(255,255,255,0.2);margin-top:2px;">' + this._esc(d.time) + '</div>';
                if (d.mood) diaryHtml += '<div style="font-size:12px;color:rgba(255,180,120,0.5);margin-top:4px;">♡ ' + this._esc(d.mood) + '</div>';
                diaryHtml += '</div>';
                // 正文预览
                diaryHtml += '<div style="padding:14px 16px;min-height:60px;" ' + (d.fontId ? 'data-font="' + this._esc(d.fontId) + '"' : '') + '>';
                const preview = (d.content || '').substring(0, 120);
                diaryHtml += '<div style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.8;white-space:pre-wrap;">' + this._renderDiaryContent(preview + (d.content.length > 120 ? '...' : ''), d.fontId) + '</div>';
                diaryHtml += '</div>';
                // 署名
                if (d.signature) diaryHtml += '<div style="padding:0 16px 12px;text-align:right;font-size:11px;color:rgba(255,255,255,0.15);font-style:italic;">—— ' + this._esc(d.signature) + '</div>';
                diaryHtml += '</div>';
            });
            content.innerHTML = diaryHtml;
        }
        
        // 点击碎碎念 — 只读查看
        content.querySelectorAll('.nb-note-card').forEach(card => {
            card.addEventListener('click', () => {
                // 点击展开/收起全文
                const textEl = card.querySelector('.nb-note-text');
                if (textEl) {
                    const isExpanded = textEl.style.maxHeight !== '80px';
                    textEl.style.maxHeight = isExpanded ? '80px' : 'none';
                    textEl.style.overflow = isExpanded ? 'hidden' : 'visible';
                }
            });
        });
        content.querySelectorAll('.nb-diary-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                const item = (data.notebook.diary || []).find(d => d.id === id);
                if (item) this._viewDiaryFull(item, name);
            });
            // 加载自定义字体
            const textEl = card.querySelector('[data-font]');
            if (textEl) this._loadFont(textEl.dataset.font, textEl);
        });
    }

    // ==================== 碎碎念编辑 ====================
    _editNote(friendCode, name, existing, parentPage) {
        document.getElementById('nbEditOverlay')?.remove();
        const ov = document.createElement('div');
        ov.id = 'nbEditOverlay';
        ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9500;display:flex;align-items:flex-end;background:rgba(0,0,0,0.5);';
        
        ov.innerHTML = `<div style="width:100%;background:#1a1a1a;border-radius:16px 16px 0 0;padding:20px 16px calc(16px + env(safe-area-inset-bottom));max-height:70vh;display:flex;flex-direction:column;animation:profileSlideUp 0.25s ease-out;">
            <div style="font-size:15px;font-weight:600;color:#fff;text-align:center;margin-bottom:12px;">${existing ? '编辑碎碎念' : '新碎碎念'}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.2);text-align:center;margin-bottom:10px;">想写什么就写什么，没有格式要求</div>
            <textarea id="nbNoteText" rows="6" style="width:100%;padding:14px;background:rgba(255,240,200,0.04);border:1px dashed rgba(255,220,150,0.12);border-radius:10px;color:rgba(255,255,255,0.7);font-size:14px;line-height:1.7;resize:vertical;box-sizing:border-box;font-family:serif;">${this._esc(existing?.content || '')}</textarea>
            <div style="display:flex;gap:8px;margin-top:12px;">
                <button id="nbNoteSave" style="flex:1;padding:10px;border:none;border-radius:10px;background:rgba(240,147,43,0.12);color:#f0932b;font-size:13px;font-weight:600;cursor:pointer;">保存</button>
                ${existing ? `<button id="nbNoteDelete" style="padding:10px 16px;border:none;border-radius:10px;background:rgba(255,60,60,0.08);color:rgba(255,100,100,0.5);font-size:13px;cursor:pointer;">删除</button>` : ''}
            </div>
            <button id="nbNoteCancel" style="width:100%;margin-top:8px;padding:10px;border:none;background:transparent;color:rgba(255,255,255,0.2);font-size:13px;cursor:pointer;">取消</button>
        </div>`;
        
        document.body.appendChild(ov);
        
        ov.querySelector('#nbNoteSave')?.addEventListener('click', () => {
            const text = ov.querySelector('#nbNoteText')?.value.trim();
            if (!text) { this._toast('内容不能为空'); return; }
            const ci = window.chatInterface;
            const data = this._store().getIntimacyData(friendCode);
            if (!data.notebook) data.notebook = { notes: [], diary: [] };
            if (existing) {
                const item = data.notebook.notes.find(n => n.id === existing.id);
                if (item) { item.content = text; item.updatedAt = new Date().toISOString(); }
            } else {
                data.notebook.notes.push({ id: 'note_' + Date.now(), content: text, createdAt: new Date().toISOString() });
            }
            this._store().saveIntimacyData(friendCode, data);
            ov.remove();
            this._refreshNotebook(parentPage, friendCode, name);
        });
        
        ov.querySelector('#nbNoteDelete')?.addEventListener('click', async () => {
            const ok = window.zpConfirm ? await window.zpConfirm('删除', '删除这条碎碎念？', '删除', '取消') : confirm('删除？');
            if (!ok) return;
            const ci = window.chatInterface;
            const data = this._store().getIntimacyData(friendCode);
            data.notebook.notes = (data.notebook.notes || []).filter(n => n.id !== existing.id);
            this._store().saveIntimacyData(friendCode, data);
            ov.remove();
            this._refreshNotebook(parentPage, friendCode, name);
        });
        
        ov.querySelector('#nbNoteCancel')?.addEventListener('click', () => ov.remove());
    }

    // ==================== 日记编辑 ====================
    _editDiary(friendCode, name, existing, parentPage) {
        const now = new Date();
        const h = now.getHours();
        
        // 新建日记检查时间（22点后）
        if (!existing && h < 22) {
            this._toast('日记只能在晚上10点之后撰写哦');
            return;
        }
        
        const defaultDate = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
        const defaultTime = `${String(h).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        
        document.getElementById('nbEditOverlay')?.remove();
        const ov = document.createElement('div');
        ov.id = 'nbEditOverlay';
        ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9500;background:#111;display:flex;flex-direction:column;';
        
        ov.innerHTML = `
            <div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;">
                <button id="diaryBack" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:20px;cursor:pointer;">&#8592;</button>
                <div style="flex:1;font-size:16px;font-weight:600;color:#fff;text-align:center;">${existing ? '编辑日记' : '写日记'}</div>
                <button id="diarySave" style="padding:6px 14px;border:none;border-radius:8px;background:rgba(240,147,43,0.15);color:#f0932b;font-size:13px;font-weight:600;cursor:pointer;">保存</button>
            </div>
            <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;min-height:0;">
                <div style="display:flex;gap:8px;margin-bottom:12px;">
                    <div style="flex:1;"><div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:4px;">日期</div><input type="text" id="diaryDate" value="${this._esc(existing?.date || defaultDate)}" style="width:100%;padding:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#fff;font-size:13px;box-sizing:border-box;"></div>
                    <div style="flex:1;"><div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:4px;">时间</div><input type="text" id="diaryTime" value="${this._esc(existing?.time || defaultTime)}" style="width:100%;padding:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#fff;font-size:13px;box-sizing:border-box;"></div>
                </div>
                <div style="margin-bottom:12px;">
                    <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:4px;">今天的心情</div>
                    <input type="text" id="diaryMood" value="${this._esc(existing?.mood || '')}" placeholder="开心/难过/平静/激动..." style="width:100%;padding:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#fff;font-size:13px;box-sizing:border-box;">
                </div>
                <div style="margin-bottom:12px;">
                    <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:4px;">日记正文</div>
                    <!-- 工具栏 -->
                    <div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
                        <button id="diaryInsertImg" style="padding:4px 10px;border:1px solid rgba(255,255,255,0.08);border-radius:6px;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.35);font-size:11px;cursor:pointer;">&#9634; 插入图片</button>
                        <select id="diaryFontPicker" style="padding:4px 8px;border:1px solid rgba(255,255,255,0.08);border-radius:6px;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.35);font-size:11px;cursor:pointer;">
                            <option value="">默认字体</option>
                            ${this._getAvailableFonts().map(f => '<option value="' + this._esc(f.id) + '"' + (existing?.fontId === f.id ? ' selected' : '') + '>' + this._esc(f.name) + '</option>').join('')}
                        </select>
                        <button id="diaryBold" style="padding:4px 8px;border:1px solid rgba(255,255,255,0.08);border-radius:6px;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.35);font-size:11px;cursor:pointer;font-weight:700;">B</button>
                        <button id="diaryItalic" style="padding:4px 8px;border:1px solid rgba(255,255,255,0.08);border-radius:6px;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.35);font-size:11px;cursor:pointer;font-style:italic;">I</button>
                    </div>
                    <textarea id="diaryContent" rows="10" placeholder="今天发生了什么...&#10;&#10;支持：**加粗** *斜体* __下划线__&#10;插入图片：![图片名]" style="width:100%;padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;color:rgba(255,255,255,0.7);font-size:14px;line-height:1.8;resize:vertical;box-sizing:border-box;font-family:inherit;">${this._esc(existing?.content || '')}</textarea>
                </div>
                <div style="margin-bottom:12px;">
                    <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:4px;">署名（签在日记末尾右下角）</div>
                    <input type="text" id="diarySignature" value="${this._esc(existing?.signature || '')}" placeholder="名字/网名/笔名..." style="width:100%;padding:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#fff;font-size:13px;box-sizing:border-box;">
                </div>
                ${existing ? `<button id="diaryDelete" style="width:100%;padding:10px;border:1px solid rgba(255,60,60,0.15);border-radius:10px;background:rgba(255,60,60,0.05);color:rgba(255,100,100,0.5);font-size:13px;cursor:pointer;">删除这篇日记</button>` : ''}
            </div>`;
        
        document.body.appendChild(ov);
        
        ov.querySelector('#diaryBack')?.addEventListener('click', () => { ov.remove(); });
        ov.querySelector('#diarySave')?.addEventListener('click', () => {
            const content = ov.querySelector('#diaryContent')?.value.trim();
            if (!content) { this._toast('正文不能为空'); return; }
            const entry = {
                id: existing?.id || 'diary_' + Date.now(),
                date: ov.querySelector('#diaryDate')?.value.trim() || defaultDate,
                time: ov.querySelector('#diaryTime')?.value.trim() || defaultTime,
                mood: ov.querySelector('#diaryMood')?.value.trim() || '',
                content,
                fontId: ov.querySelector('#diaryFontPicker')?.value || '',
                signature: ov.querySelector('#diarySignature')?.value.trim() || '',
                createdAt: existing?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const ci = window.chatInterface;
            const data = this._store().getIntimacyData(friendCode);
            if (!data.notebook) data.notebook = { notes: [], diary: [] };
            if (existing) {
                const idx = data.notebook.diary.findIndex(d => d.id === existing.id);
                if (idx >= 0) data.notebook.diary[idx] = entry;
            } else {
                data.notebook.diary.push(entry);
            }
            this._store().saveIntimacyData(friendCode, data);
            this._toast('日记已保存');
            ov.remove();
            this._refreshNotebook(parentPage, friendCode, name);
        });
        
        ov.querySelector('#diaryDelete')?.addEventListener('click', async () => {
            const ok = window.zpConfirm ? await window.zpConfirm('删除', '删除这篇日记？', '删除', '取消') : confirm('删除？');
            if (!ok) return;
            const ci = window.chatInterface;
            const data = this._store().getIntimacyData(friendCode);
            data.notebook.diary = (data.notebook.diary || []).filter(d => d.id !== existing.id);
            this._store().saveIntimacyData(friendCode, data);
            ov.remove();
            this._refreshNotebook(parentPage, friendCode, name);
        });
        
        // 工具栏：字体选择
        const fontPicker = ov.querySelector('#diaryFontPicker');
        const contentArea = ov.querySelector('#diaryContent');
        if (fontPicker) {
            // 加载已选字体
            if (existing?.fontId) this._loadFont(existing.fontId, contentArea);
            fontPicker.addEventListener('change', () => {
                const fid = fontPicker.value;
                if (fid) this._loadFont(fid, contentArea);
                else contentArea.style.fontFamily = 'inherit';
            });
        }
        
        // 工具栏：加粗
        ov.querySelector('#diaryBold')?.addEventListener('click', () => {
            this._insertAtCursor(contentArea, '**', '**', '加粗文字');
        });
        
        // 工具栏：斜体
        ov.querySelector('#diaryItalic')?.addEventListener('click', () => {
            this._insertAtCursor(contentArea, '*', '*', '斜体文字');
        });
        
        // 工具栏：插入图片
        ov.querySelector('#diaryInsertImg')?.addEventListener('click', () => {
            this._openImagePicker((imgName) => {
                this._insertAtCursor(contentArea, '![', ']', imgName);
            });
        });
    }

    // 日记内容渲染（手账风格：markdown + 图片 + emoji）
    _renderDiaryContent(text, fontId) {
        let s = this._esc(text);
        // markdown
        s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
        s = s.replace(/__(.+?)__/g, '<u>$1</u>');
        s = s.replace(/~~(.+?)~~/g, '<del>$1</del>');
        // 标题
        s = s.replace(/^### (.+)$/gm, '<div style="font-size:15px;font-weight:700;margin:6px 0 3px;color:rgba(255,220,170,0.6);">$1</div>');
        s = s.replace(/^## (.+)$/gm, '<div style="font-size:17px;font-weight:700;margin:8px 0 4px;color:rgba(255,220,170,0.7);">$1</div>');
        s = s.replace(/^# (.+)$/gm, '<div style="font-size:19px;font-weight:700;margin:10px 0 5px;color:rgba(255,220,170,0.8);">$1</div>');
        // 分割线
        s = s.replace(/^---$/gm, '<div style="border-top:1px dashed rgba(255,220,150,0.1);margin:12px 0;"></div>');
        // 图片 ![name] — 手账风格
        s = s.replace(/!\[([^\]]+)\]/g, (match, rawName) => {
            // 尝试多种方式找图
            let img = this._findLibImage(rawName);
            // 如果没找到，试试冒号分割（AI可能写成 ![名字:描述]）
            if (!img && rawName.includes(':')) {
                const parts = rawName.split(':');
                img = this._findLibImage(parts[0].trim()) || this._findLibImage(parts[1].trim());
            }
            // 如果还没找到，试试去掉"一只""一个"等前缀
            if (!img) {
                const cleaned = rawName.replace(/^(一只|一个|一张|一幅|一片|一朵)/,'').trim();
                if (cleaned !== rawName) img = this._findLibImage(cleaned);
            }
            if (img) {
                const rotate = (Math.random() * 4 - 2).toFixed(1);
                return '<div style="display:inline-block;margin:8px 4px;padding:4px;background:rgba(255,255,255,0.06);border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.2);transform:rotate(' + rotate + 'deg);max-width:70%;vertical-align:middle;"><img src="' + (img.data || img.url) + '" style="width:100%;border-radius:6px;display:block;"><div style="text-align:center;font-size:9px;color:rgba(255,255,255,0.2);margin-top:3px;">' + this._esc(rawName) + '</div></div>';
            }
            return '<div style="display:inline-block;margin:6px 4px;padding:10px 16px;border:1px dashed rgba(255,220,150,0.15);border-radius:8px;background:rgba(255,220,150,0.03);"><span style="color:rgba(255,220,150,0.25);font-size:12px;">&#128247; ' + this._esc(rawName) + '</span><div style="font-size:9px;color:rgba(255,255,255,0.1);margin-top:2px;">图库中未找到此图片</div></div>';
        });
        return s;
    }

    // 全屏日记查看器（手账风格）
    _viewDiaryFull(diary, charName) {
        document.getElementById('diaryFullView')?.remove();
        const page = document.createElement('div');
        page.id = 'diaryFullView';
        page.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9500;background:#0a0806;display:flex;flex-direction:column;';
        
        page.innerHTML = '<div style="display:flex;align-items:center;padding:12px 16px;flex-shrink:0;border-bottom:1px solid rgba(255,220,150,0.06);">' +
            '<button id="dfvBack" style="background:none;border:none;color:rgba(255,220,170,0.5);font-size:20px;cursor:pointer;padding:4px 8px;">&#8592;</button>' +
            '<div style="flex:1;text-align:center;font-size:14px;color:rgba(255,220,170,0.4);">' + this._esc(charName) + ' 的日记</div>' +
        '</div>' +
        '<div id="dfvContent" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;min-height:0;"></div>';
        
        document.body.appendChild(page);
        
        // 渲染日记页面
        const contentEl = page.querySelector('#dfvContent');
        let html = '';
        
        // 纸张效果
        html += '<div style="max-width:420px;margin:16px auto;background:linear-gradient(180deg,rgba(255,248,235,0.05) 0%,rgba(255,240,220,0.03) 100%);border:1px solid rgba(255,230,180,0.08);border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.3);">';
        
        // 头部装饰条
        html += '<div style="padding:20px 20px 0;background:rgba(255,230,180,0.03);">';
        // 日期
        html += '<div style="font-size:20px;font-weight:700;color:rgba(255,220,170,0.7);letter-spacing:2px;">' + this._esc(diary.date || '') + '</div>';
        if (diary.time) html += '<div style="font-size:12px;color:rgba(255,255,255,0.2);margin-top:4px;">' + this._esc(diary.time) + '</div>';
        // 心情
        if (diary.mood) html += '<div style="margin-top:8px;display:inline-block;padding:4px 12px;background:rgba(255,180,120,0.08);border-radius:20px;font-size:12px;color:rgba(255,180,120,0.6);">&#9825; ' + this._esc(diary.mood) + '</div>';
        html += '</div>';
        
        // 分割线
        html += '<div style="margin:14px 20px;border-top:1px dashed rgba(255,220,150,0.08);"></div>';
        
        // 正文
        html += '<div style="padding:0 20px 20px;font-size:15px;color:rgba(255,255,255,0.65);line-height:2;white-space:pre-wrap;"' + (diary.fontId ? ' data-font="' + this._esc(diary.fontId) + '"' : '') + '>';
        html += this._renderDiaryContent(diary.content || '', diary.fontId);
        html += '</div>';
        
        // 署名
        if (diary.signature) {
            html += '<div style="padding:0 20px 20px;text-align:right;">';
            html += '<div style="display:inline-block;padding:6px 16px;border-top:1px solid rgba(255,220,150,0.08);font-size:13px;color:rgba(255,220,170,0.3);font-style:italic;letter-spacing:1px;">—— ' + this._esc(diary.signature) + '</div>';
            html += '</div>';
        }
        
        // 底部时间戳
        html += '<div style="padding:8px 20px 16px;text-align:center;font-size:9px;color:rgba(255,255,255,0.1);">' + (diary.createdAt ? new Date(diary.createdAt).toLocaleString('zh-CN') : '') + '</div>';
        
        html += '</div>'; // 纸张结束
        
        contentEl.innerHTML = html;
        
        // 加载自定义字体
        const fontEl = contentEl.querySelector('[data-font]');
        if (fontEl) this._loadFont(fontEl.dataset.font, fontEl);
        
        page.querySelector('#dfvBack')?.addEventListener('click', () => page.remove());
    }

    // ==================== 剧场归档 ====================
    _showTheaterArchive(friendCode, name) {
        const ci = window.chatInterface;
        if (!this._store()) return;
        const data = this._store().getIntimacyData(friendCode);
        const sessions = data.theaterSessions || [];

        document.getElementById('mlDetailPage')?.remove();
        const page = document.createElement('div');
        page.id = 'mlDetailPage';
        page.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9000;background:#111;display:flex;flex-direction:column;';
        
        page.innerHTML = `
            <div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;">
                <button id="mdBack" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:20px;cursor:pointer;">&#8592;</button>
                <div style="flex:1;font-size:16px;font-weight:600;color:#fff;text-align:center;">${this._esc(name)} 的剧场归档</div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:16px;min-height:0;">
                ${sessions.length === 0 ? '<div style="text-align:center;padding:40px 0;color:rgba(255,255,255,0.12);font-size:13px;">还没有剧场存档</div>' :
                    sessions.slice().reverse().map(s => {
                        const sc = s.script || {};
                        const msgCount = (s.messages || []).filter(m => m.type === 'char' || m.type === 'user').length;
                        const date = s.createdAt ? new Date(s.createdAt).toLocaleString('zh-CN') : '';
                        const summaryCount = (s.summaries || []).length;
                        return `<div class="ta-session" data-sid="${s.id}" style="margin-bottom:14px;padding:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;cursor:pointer;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                                <span style="font-size:16px;color:rgba(94,230,200,0.6);">&#9670;</span>
                                <div style="flex:1;">
                                    <div style="font-size:14px;font-weight:600;color:#fff;">${this._esc(sc.charName || '?')} & ${this._esc(sc.userName || '?')}</div>
                                    <div style="font-size:10px;color:rgba(255,255,255,0.2);margin-top:2px;">${date}</div>
                                </div>
                            </div>
                            <div style="font-size:12px;color:rgba(255,255,255,0.4);line-height:1.6;margin-bottom:6px;">${this._esc((sc.world || '').substring(0, 80))}${(sc.world || '').length > 80 ? '...' : ''}</div>
                            <div style="font-size:10px;color:rgba(255,255,255,0.2);">${msgCount} 楼 ${summaryCount > 0 ? '| ' + summaryCount + ' 篇总结' : ''}</div>
                        </div>`;
                    }).join('')}
            </div>`;
        
        document.body.appendChild(page);
        page.querySelector('#mdBack')?.addEventListener('click', () => page.remove());
        
        // 点击查看详情
        page.querySelectorAll('.ta-session').forEach(card => {
            card.addEventListener('click', () => {
                const sid = card.dataset.sid;
                const session = sessions.find(s => s.id === sid);
                if (session) this._showSessionDetail(session, friendCode, name);
            });
        });
    }

    _showSessionDetail(session, friendCode, name) {
        document.getElementById('mlSessionDetail')?.remove();
        const sc = session.script || {};
        const msgs = session.messages || [];
        const oocMsgs = session.backstageMessages || [];
        const summaries = session.summaries || [];
        
        // 合并皮上+皮下消息按时间排序
        const allMsgs = [];
        msgs.forEach(m => allMsgs.push({...m, _source: 'theater'}));
        oocMsgs.forEach(m => allMsgs.push({...m, _source: 'ooc'}));
        allMsgs.sort((a,b) => new Date(a.timestamp||0) - new Date(b.timestamp||0));
        
        const sec = (label, val) => val ? `<div style="margin-bottom:10px;"><div style="font-size:10px;color:rgba(255,255,255,0.2);margin-bottom:3px;">${label}</div><div style="font-size:12px;color:rgba(255,255,255,0.5);line-height:1.6;white-space:pre-wrap;">${this._esc(val)}</div></div>` : '';
        
        const page = document.createElement('div');
        page.id = 'mlSessionDetail';
        page.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9200;background:#0d0d0d;display:flex;flex-direction:column;';
        
        let floor = 0;
        let msgHtml = '';
        allMsgs.forEach(m => {
            if (m._source === 'ooc') {
                // OOC消息 — 灰色区分
                const who = m.type === 'user' ? '你(皮下)' : name + '(皮下)';
                msgHtml += `<div style="margin:6px 0;padding:8px 12px;background:rgba(100,100,255,0.04);border-left:2px solid rgba(100,100,255,0.2);border-radius:0 8px 8px 0;"><div style="font-size:9px;color:rgba(100,180,255,0.4);margin-bottom:2px;">OOC | ${who}</div><div style="font-size:12px;color:rgba(255,255,255,0.5);line-height:1.6;">${this._esc(m.text)}</div></div>`;
            } else if (m.type === 'system') {
                msgHtml += `<div style="text-align:center;padding:6px 0;font-size:10px;color:rgba(255,255,255,0.15);font-style:italic;">${this._esc(m.text)}</div>`;
            } else {
                floor++;
                const isChar = m.type === 'char';
                const mName = isChar ? sc.charName : sc.userName;
                // 题头
                let headerHtml = '';
                if (isChar && m.header && (m.header.date || m.header.time)) {
                    headerHtml = `<div style="font-size:10px;color:rgba(94,230,200,0.4);margin-bottom:4px;font-family:monospace;">${this._esc(m.header.date||'')} ${this._esc(m.header.time||'')} | ${this._esc(m.header.location||'')}</div>`;
                }
                msgHtml += `<div style="margin-bottom:14px;">${headerHtml}<div style="font-size:11px;color:${isChar ? 'rgba(240,147,43,0.6)' : 'rgba(100,180,255,0.6)'};margin-bottom:2px;">#${floor} ${this._esc(mName)}</div><div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.7;white-space:pre-wrap;">${this._esc(m.text)}</div></div>`;
            }
        });
        
        page.innerHTML = `
            <div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;">
                <button id="sdBack" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:20px;cursor:pointer;">&#8592;</button>
                <div style="flex:1;font-size:14px;font-weight:600;color:#fff;text-align:center;">${this._esc(sc.charName)} & ${this._esc(sc.userName)}</div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:12px 16px;min-height:0;">
                <!-- 设定 -->
                <div style="margin-bottom:16px;padding:12px;background:rgba(255,255,255,0.02);border-radius:10px;border:1px solid rgba(255,255,255,0.04);">
                    ${sec('世界观', sc.world)}
                    ${sec(this._esc(sc.charName) + ' 的人设', sc.charPersona)}
                    ${sec(this._esc(sc.userName) + ' 的人设', sc.userPersona)}
                    ${sec('开场情境', sc.opening)}
                </div>
                
                <!-- 总结 -->
                ${summaries.length > 0 ? `<div style="margin-bottom:16px;">
                    <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-bottom:8px;">&#9998; 记忆总结（${summaries.length}篇）</div>
                    ${summaries.map(sm => `<div style="margin-bottom:10px;padding:12px;background:rgba(255,255,255,0.03);border-radius:10px;border-left:3px solid rgba(240,147,43,0.3);">
                        <div style="font-size:10px;color:rgba(255,255,255,0.2);margin-bottom:4px;">第${sm.from}-${sm.to}楼 | ${sm.createdAt ? new Date(sm.createdAt).toLocaleString('zh-CN') : ''}</div>
                        <div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.7;white-space:pre-wrap;">${this._esc(sm.text)}</div>
                    </div>`).join('')}
                </div>` : ''}
                
                <!-- 对话+OOC混合记录 -->
                <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-bottom:8px;">完整记录（${floor}楼 + ${oocMsgs.length}条OOC）</div>
                ${msgHtml}
            </div>`;
        
        document.body.appendChild(page);
        page.querySelector('#sdBack')?.addEventListener('click', () => page.remove());
    }

    // ==================== 工具方法 ====================

    _findLibImage(name) {
        // 尝试从base64Library获取
        let ld = window.base64Library?._getData();
        // 兜底：直接从storage读
        if (!ld) {
            const store = this._store();
            if (store) {
                const s = store.getUserSettings() || {};
                ld = s.base64Library;
            }
        }
        if (!ld) return null;
        const all = [...(ld.avatars?.items||[]), ...(ld.webImages?.items||[]), ...(ld.stickers?.items||[]), ...(ld.transparent?.items||[])];
        return all.find(i => i.name === name) || all.find(i => (i.name||'').includes(name));
    }

    _getAvailableFonts() {
        return window.base64Library?._getData()?.fonts?.items || [];
    }

    _loadFont(fontId, el) {
        const font = this._getAvailableFonts().find(f => f.id === fontId);
        if (!font) return;
        try {
            const face = new FontFace(fontId, font.url ? 'url(' + font.url + ')' : font.data);
            face.load().then(loaded => { document.fonts.add(loaded); if (el) el.style.fontFamily = '"' + fontId + '", serif'; }).catch(() => {});
        } catch(e) {}
    }

    _insertAtCursor(textarea, before, after, placeholder) {
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = textarea.value.substring(start, end);
        const insert = before + (selected || placeholder) + after;
        textarea.value = textarea.value.substring(0, start) + insert + textarea.value.substring(end);
        textarea.focus();
        textarea.setSelectionRange(start + before.length, start + before.length + (selected || placeholder).length);
    }

    _openImagePicker(callback) {
        document.getElementById('mlImgPicker')?.remove();
        const ld = window.base64Library?._getData();
        if (!ld) { this._toast('图库不可用'); return; }
        const allImgs = [...(ld.avatars?.items||[]), ...(ld.webImages?.items||[]), ...(ld.transparent?.items||[]), ...(ld.stickers?.items||[])];
        if (allImgs.length === 0) { this._toast('图库里没有图片'); return; }
        const p = document.createElement('div');
        p.id = 'mlImgPicker';
        p.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9800;display:flex;align-items:flex-end;background:rgba(0,0,0,0.5);';
        let gridHtml = '';
        allImgs.forEach(img => {
            gridHtml += '<div class="ip-item" data-name="' + this._esc(img.name||'') + '" style="border-radius:8px;overflow:hidden;cursor:pointer;background:rgba(255,255,255,0.03);"><img src="' + (img.data||img.url||'') + '" style="width:100%;aspect-ratio:1;object-fit:cover;display:block;"><div style="padding:2px 4px;font-size:8px;color:rgba(255,255,255,0.25);text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + this._esc(img.name||'') + '</div></div>';
        });
        p.innerHTML = '<div style="width:100%;background:#1a1a1a;border-radius:16px 16px 0 0;padding:16px;max-height:60vh;display:flex;flex-direction:column;animation:profileSlideUp 0.25s ease-out;"><div style="display:flex;align-items:center;margin-bottom:10px;"><div style="flex:1;font-size:15px;font-weight:600;color:#fff;">选择图片</div><button id="imgPickerClose" style="background:none;border:none;color:rgba(255,255,255,0.3);font-size:18px;cursor:pointer;">&#10005;</button></div><div style="flex:1;overflow-y:auto;min-height:0;"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">' + gridHtml + '</div></div></div>';
        document.body.appendChild(p);
        p.querySelector('#imgPickerClose')?.addEventListener('click', () => p.remove());
        p.querySelectorAll('.ip-item').forEach(item => {
            item.addEventListener('click', () => { callback(item.dataset.name); p.remove(); });
        });
    }

    _esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    _toast(msg) { if (window.chatInterface?.showCssToast) window.chatInterface.showCssToast(msg); else alert(msg); }
}

window.memoryLibrary = new MemoryLibrary();
