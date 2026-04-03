// ==================== Base64 图库模块 ====================
class Base64Library {
    constructor() {
        this._activeTab = 'avatars'; // avatars | webImages | stickers
        this._activeCategory = {};
        this._searchKeyword = '';
        this._selectMode = false;
        this._selected = new Set();
    }

    _storage() {
        // 优先用chatInterface的storage，没有就直接找全局Storage实例
        if (window.chatInterface?.storage) return window.chatInterface.storage;
        if (window.chatApp?.storage) return window.chatApp.storage;
        return null;
    }

    _getData() {
        const store = this._storage();
        const defaultData = { avatars: { categories: [{ id: 'default', name: '默认' }], items: [] }, webImages: { categories: [{ id: 'default', name: '默认' }], items: [] }, stickers: { categories: [{ id: 'default', name: '默认' }], items: [] }, transparent: { categories: [{ id: 'default', name: '默认' }], items: [] }, fonts: { items: [] } };
        if (!store) { return defaultData; }
        const s = store.getUserSettings() || {};
        if (!s.base64Library) {
            s.base64Library = defaultData;
            store.saveData('zero_phone_user_settings', s);
        }
        ['avatars', 'webImages', 'stickers', 'transparent'].forEach(k => {
            if (!s.base64Library[k]) s.base64Library[k] = { categories: [{ id: 'default', name: '默认' }], items: [] };
        });
        if (!s.base64Library.fonts) s.base64Library.fonts = { items: [] };
        return s.base64Library;
    }

    _saveData(data) {
        const store = this._storage();
        if (!store) { console.warn('⚠️ Base64Library: storage不可用，无法保存'); return; }
        const s = store.getUserSettings();
        s.base64Library = data;
        store.saveData('zero_phone_user_settings', s);
    }

    _esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    _toast(msg) { window.chatInterface?.showCssToast?.(msg) || alert(msg); }

    // ==================== 打开图库主页 ====================
    open() {
        document.getElementById('base64LibPage')?.remove();

        const page = document.createElement('div');
        page.id = 'base64LibPage';
        page.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:8000;background:#111;display:flex;flex-direction:column;';

        const data = this._getData();
        const section = data[this._activeTab];
        const catId = this._activeCategory[this._activeTab] || section.categories[0]?.id || 'default';
        let items = section.items.filter(i => i.categoryId === catId);

        // 搜索
        if (this._searchKeyword) {
            const kw = this._searchKeyword.toLowerCase();
            items = section.items.filter(i =>
                (i.name || '').toLowerCase().includes(kw) ||
                (i.desc || '').toLowerCase().includes(kw)
            );
        }

        const tabLabels = { avatars: '🖼 头像库', webImages: '🌐 网图库', stickers: '😊 表情包', transparent: '◇ 透明底图', fonts: '&#9734; 字体库' };

        // 字体库特殊处理
        const isFontTab = this._activeTab === 'fonts';
        
        // 构建中间内容区
        let midContent = '';
        if (isFontTab) {
            midContent = this._renderFontTab(data);
        } else {
            // 分类栏
            let catHtml = '<div style="display:flex;gap:4px;padding:0 14px 8px;overflow-x:auto;flex-shrink:0;align-items:center;">';
            section.categories.forEach(c => {
                const isActive = c.id === catId && !this._searchKeyword;
                catHtml += '<div class="b64-cat" data-cid="' + c.id + '" style="display:flex;align-items:center;gap:3px;padding:4px 10px;border-radius:12px;font-size:11px;white-space:nowrap;cursor:pointer;' + (isActive ? 'background:rgba(240,147,43,0.12);color:#f0932b;' : 'background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.3);') + '">' + this._esc(c.name) + (isActive && c.id !== 'default' ? '<span class="b64-cat-edit" data-cid="' + c.id + '" style="opacity:0.5;font-size:10px;cursor:pointer;">&#9998;</span>' : '') + '</div>';
            });
            catHtml += '<div id="b64AddCat" style="padding:4px 8px;border-radius:12px;font-size:11px;cursor:pointer;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.15);">+</div></div>';
            
            // 图片网格
            let gridHtml = '';
            if (items.length === 0) {
                gridHtml = '<div style="text-align:center;padding:40px 0;color:rgba(255,255,255,0.12);font-size:13px;">空空如也</div>';
            } else {
                gridHtml = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">';
                items.forEach(item => {
                    gridHtml += '<div class="b64-item" data-id="' + item.id + '" style="border-radius:10px;overflow:hidden;background:rgba(255,255,255,0.03);cursor:pointer;position:relative;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;">';
                    gridHtml += '<img src="' + (item.data || item.url || '') + '" style="width:100%;aspect-ratio:1;object-fit:cover;display:block;pointer-events:none;" onerror="this.style.display=\'none\'" draggable="false">';
                    if (this._selectMode) {
                        gridHtml += '<div style="position:absolute;top:6px;right:6px;width:20px;height:20px;border-radius:50%;border:2px solid rgba(255,255,255,0.3);background:' + (this._selected.has(item.id) ? '#f0932b' : 'rgba(0,0,0,0.4)') + ';display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;">' + (this._selected.has(item.id) ? '✓' : '') + '</div>';
                    }
                    gridHtml += '<div style="position:absolute;bottom:0;left:0;right:0;padding:3px 6px;background:linear-gradient(transparent,rgba(0,0,0,0.7));font-size:9px;color:rgba(255,255,255,0.6);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;">' + this._esc(item.name || '') + '</div>';
                    gridHtml += '</div>';
                });
                gridHtml += '</div>';
            }
            
            // 底栏
            let bottomHtml = '';
            if (this._selectMode) {
                bottomHtml = '<button id="b64BatchDelete" style="flex:1;padding:10px;border:none;border-radius:10px;background:rgba(255,60,60,0.1);color:rgba(255,100,100,0.7);font-size:13px;cursor:pointer;">删除选中 (' + this._selected.size + ')</button><button id="b64BatchMove" style="flex:1;padding:10px;border:none;border-radius:10px;background:rgba(100,180,255,0.1);color:rgba(100,180,255,0.7);font-size:13px;cursor:pointer;">移动分类</button>';
            } else {
                bottomHtml = '<button id="b64UploadBtn" style="flex:1;padding:10px;border:none;border-radius:10px;background:rgba(240,147,43,0.12);color:#f0932b;font-size:13px;font-weight:600;cursor:pointer;">+ 上传</button>';
            }
            
            midContent = catHtml + '<div id="b64Grid" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 10px 80px;min-height:0;" oncontextmenu="return false">' + gridHtml + '</div><div style="position:absolute;bottom:0;left:0;right:0;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:rgba(17,17,17,0.95);border-top:1px solid rgba(255,255,255,0.04);display:flex;gap:8px;">' + bottomHtml + '</div>';
        }

        page.innerHTML = `
            <div style="display:flex;align-items:center;padding:12px 14px;gap:8px;background:rgba(17,17,17,0.95);border-bottom:1px solid rgba(255,255,255,0.04);">
                <button id="b64Back" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:20px;cursor:pointer;">←</button>
                <div style="flex:1;font-size:16px;font-weight:600;color:#fff;">Base64 图库</div>
                ${!isFontTab ? `<button id="b64SelectBtn" style="padding:4px 10px;border:none;border-radius:6px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.4);font-size:11px;cursor:pointer;">${this._selectMode ? '取消' : '选择'}</button>` : ''}
            </div>

            <!-- 五个Tab（可横向滚动） -->
            <div style="display:flex;border-bottom:1px solid rgba(255,255,255,0.04);overflow-x:auto;flex-shrink:0;">
                ${Object.keys(tabLabels).map(k => `<div class="b64-tab" data-tab="${k}" style="flex-shrink:0;padding:10px 14px;font-size:12px;cursor:pointer;white-space:nowrap;${this._activeTab === k ? 'color:#f0932b;border-bottom:2px solid #f0932b;font-weight:600;' : 'color:rgba(255,255,255,0.4);'}">${tabLabels[k]}</div>`).join('')}
            </div>

            <!-- 搜索栏 -->
            <div style="padding:8px 14px;">
                <input type="text" id="b64Search" value="${this._esc(this._searchKeyword)}" placeholder="搜索名字/描述..." style="width:100%;padding:8px 12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#fff;font-size:13px;box-sizing:border-box;">
            </div>
            ${midContent}`;


        document.body.appendChild(page);
        this._bindEvents(page, data, catId);
    }

    // ==================== 事件绑定 ====================
    _bindEvents(page, data, catId) {
        page.querySelector('#b64Back').addEventListener('click', () => page.remove());

        // Tab切换
        page.querySelectorAll('.b64-tab').forEach(t => {
            t.addEventListener('click', () => { this._activeTab = t.dataset.tab; this._searchKeyword = ''; this._selectMode = false; this._selected.clear(); this.open(); });
        });

        // 搜索
        let searchTimer;
        page.querySelector('#b64Search')?.addEventListener('input', (e) => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => { this._searchKeyword = e.target.value.trim(); this.open(); }, 300);
        });

        // 分类切换 + 编辑图标
        page.querySelectorAll('.b64-cat').forEach(c => {
            c.addEventListener('click', (e) => {
                // 如果点的是编辑图标，打开编辑面板
                if (e.target.classList.contains('b64-cat-edit')) {
                    e.stopPropagation();
                    this._editCategory(e.target.dataset.cid);
                    return;
                }
                this._activeCategory[this._activeTab] = c.dataset.cid;
                this._searchKeyword = '';
                this.open();
            });
        });

        // 新建分类
        page.querySelector('#b64AddCat')?.addEventListener('click', async () => {
            const name = window.zpPrompt ? await window.zpPrompt('新建分类', '', '', '分类名称') : prompt('分类名称：');
            if (!name) return;
            const d = this._getData();
            d[this._activeTab].categories.push({ id: 'cat_' + Date.now(), name });
            this._saveData(d);
            this.open();
        });

        // 选择模式
        page.querySelector('#b64SelectBtn')?.addEventListener('click', () => {
            this._selectMode = !this._selectMode;
            this._selected.clear();
            this.open();
        });

        // 图片点击
        page.querySelectorAll('.b64-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                if (this._selectMode) {
                    if (this._selected.has(id)) this._selected.delete(id);
                    else this._selected.add(id);
                    this.open();
                } else {
                    this._openItemDetail(id);
                }
            });
        });

        // 上传
        page.querySelector('#b64UploadBtn')?.addEventListener('click', () => this._openUploadPanel());

        // 批量删除
        page.querySelector('#b64BatchDelete')?.addEventListener('click', async () => {
            if (this._selected.size === 0) { this._toast('请先选择'); return; }
            const ok = window.zpConfirm ? await window.zpConfirm('批量删除', `确定删除选中的 ${this._selected.size} 张图片？`, '删除', '取消') : confirm('确定删除？');
            if (!ok) return;
            const d = this._getData();
            d[this._activeTab].items = d[this._activeTab].items.filter(i => !this._selected.has(i.id));
            this._saveData(d);
            this._selected.clear();
            this._selectMode = false;
            this.open();
            this._toast('已删除');
        });

        // 批量移动分类
        page.querySelector('#b64BatchMove')?.addEventListener('click', async () => {
            if (this._selected.size === 0) { this._toast('请先选择'); return; }
            this._openMoveCategoryPanel();
        });
        
        // 字体库事件
        if (this._activeTab === 'fonts') {
            this._bindFontEvents(page, data);
        }
    }

    // ==================== 图片详情（编辑/删除） ====================
    _openItemDetail(id) {
        const d = this._getData();
        const item = d[this._activeTab].items.find(i => i.id === id);
        if (!item) return;

        document.getElementById('b64DetailOverlay')?.remove();
        const ov = document.createElement('div');
        ov.id = 'b64DetailOverlay';
        ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9000;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0.5);';

        ov.innerHTML = `<div style="width:100%;background:#1a1a1a;border-radius:16px 16px 0 0;padding:20px 16px calc(16px + env(safe-area-inset-bottom));max-height:80vh;overflow-y:auto;animation:profileSlideUp 0.25s ease-out;">
            <div style="text-align:center;margin-bottom:14px;">
                <img src="${item.data || item.url || ''}" style="max-width:200px;max-height:200px;border-radius:12px;object-fit:contain;" onerror="this.style.display='none'">
            </div>
            <div style="margin-bottom:12px;">
                <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:4px;">名字</div>
                <input type="text" id="b64DetailName" value="${this._esc(item.name || '')}" style="width:100%;padding:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;font-size:14px;box-sizing:border-box;">
            </div>
            <div style="margin-bottom:14px;">
                <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:4px;">描述（AI搜图用）</div>
                <textarea id="b64DetailDesc" rows="2" style="width:100%;padding:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#fff;font-size:13px;resize:vertical;box-sizing:border-box;">${this._esc(item.desc || '')}</textarea>
            </div>
            <div style="display:flex;gap:8px;margin-bottom:8px;">
                <button id="b64DetailSave" style="flex:1;padding:10px;border:none;border-radius:10px;background:rgba(240,147,43,0.12);color:#f0932b;font-size:13px;font-weight:600;cursor:pointer;">保存</button>
                <button id="b64DetailDelete" style="padding:10px 16px;border:none;border-radius:10px;background:rgba(255,60,60,0.08);color:rgba(255,100,100,0.6);font-size:13px;cursor:pointer;">删除</button>
            </div>
            <button id="b64DetailClose" style="width:100%;padding:10px;border:none;border-radius:10px;background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.3);font-size:13px;cursor:pointer;">关闭</button>
        </div>`;

        document.body.appendChild(ov);

        ov.querySelector('#b64DetailSave').addEventListener('click', () => {
            item.name = ov.querySelector('#b64DetailName')?.value.trim() || item.name;
            item.desc = ov.querySelector('#b64DetailDesc')?.value.trim() || '';
            this._saveData(d);
            this._toast('已保存');
            ov.remove();
            this.open();
        });

        ov.querySelector('#b64DetailDelete').addEventListener('click', async () => {
            const ok = window.zpConfirm ? await window.zpConfirm('删除', '确定删除这张图片？', '删除', '取消') : confirm('删除？');
            if (!ok) return;
            d[this._activeTab].items = d[this._activeTab].items.filter(i => i.id !== id);
            this._saveData(d);
            ov.remove();
            this.open();
            this._toast('已删除');
        });

        ov.querySelector('#b64DetailClose').addEventListener('click', () => ov.remove());
    }

    // ==================== 上传面板 ====================
    _openUploadPanel() {
        document.getElementById('b64UploadOverlay')?.remove();
        const d = this._getData();
        const section = d[this._activeTab];
        const isSticker = this._activeTab === 'stickers';
        const catId = this._activeCategory[this._activeTab] || section.categories[0]?.id || 'default';

        const ov = document.createElement('div');
        ov.id = 'b64UploadOverlay';
        ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9000;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0.5);';

        const tabLabel = { avatars: '头像', webImages: '网图', stickers: '表情包' }[this._activeTab];

        ov.innerHTML = `<div style="width:100%;background:#1a1a1a;border-radius:16px 16px 0 0;padding:20px 16px calc(16px + env(safe-area-inset-bottom));max-height:80vh;overflow-y:auto;animation:profileSlideUp 0.25s ease-out;">
            <div style="font-size:16px;font-weight:600;color:#fff;text-align:center;margin-bottom:14px;">上传${tabLabel}</div>

            <div style="margin-bottom:12px;">
                <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:6px;">添加到分类</div>
                <select id="b64UpCat" style="width:100%;padding:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;font-size:13px;">
                    ${section.categories.map(c => `<option value="${c.id}" ${c.id === catId ? 'selected' : ''}>${this._esc(c.name)}</option>`).join('')}
                </select>
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:6px;">📷 从相册上传</div>
                <div style="display:flex;gap:8px;">
                    <button id="b64UpSingle" style="flex:1;padding:12px;border:1px dashed rgba(255,255,255,0.1);border-radius:10px;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.5);font-size:13px;cursor:pointer;">单张上传</button>
                    <button id="b64UpBatch" style="flex:1;padding:12px;border:1px dashed rgba(255,255,255,0.1);border-radius:10px;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.5);font-size:13px;cursor:pointer;">多选上传</button>
                </div>
                <input type="file" id="b64UpFileS" accept="image/*" style="display:none;">
                <input type="file" id="b64UpFileB" accept="image/*" multiple style="display:none;">
            </div>

            ${isSticker ? `<div style="margin-bottom:12px;">
                <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:6px;">🔗 URL批量导入（仅表情包）</div>
                <div style="font-size:9px;color:rgba(255,255,255,0.12);margin-bottom:4px;line-height:1.6;font-family:monospace;">格式：名字|URL（每行一个）<br>例：开心猫|https://ex.com/cat.png</div>
                <textarea id="b64UpUrlText" rows="3" placeholder="名字|URL" style="width:100%;padding:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#fff;font-size:11px;font-family:monospace;resize:vertical;box-sizing:border-box;"></textarea>
                <button id="b64UpUrlBtn" style="width:100%;margin-top:4px;padding:10px;border:none;border-radius:8px;background:rgba(240,147,43,0.12);color:#f0932b;font-size:13px;cursor:pointer;">导入</button>
            </div>` : ''}

            <button id="b64UpClose" style="width:100%;padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.4);font-size:14px;cursor:pointer;">返回</button>
        </div>`;

        document.body.appendChild(ov);

        // 单张上传
        ov.querySelector('#b64UpSingle').addEventListener('click', () => ov.querySelector('#b64UpFileS').click());
        ov.querySelector('#b64UpFileS').addEventListener('change', async (e) => {
            const file = e.target.files[0]; if (!file) return;
            const name = window.zpPrompt ? await window.zpPrompt('图片名字/描述', '给图片命名（AI搜图用，可留空）', '', '名字或描述关键词') : prompt('图片名字（可留空）：');
            const item = await this._addImageFromFile(file, name || file.name.split('.')[0], name || '', ov.querySelector('#b64UpCat')?.value);
            this._saveItem(item);
            this._toast('已添加');
            ov.remove(); this.open();
        });

        // 多选上传
        ov.querySelector('#b64UpBatch').addEventListener('click', () => ov.querySelector('#b64UpFileB').click());
        ov.querySelector('#b64UpFileB').addEventListener('change', async (e) => {
            const files = Array.from(e.target.files); if (!files.length) return;
            const cat = ov.querySelector('#b64UpCat')?.value;
            const d = this._getData();
            for (const f of files) {
                const item = await this._addImageFromFile(f, f.name.split('.')[0], '', cat);
                if (item) d[this._activeTab].items.push(item);
            }
            this._saveData(d);
            this._toast(`已添加 ${files.length} 张`);
            ov.remove(); this.open();
        });

        // URL导入
        ov.querySelector('#b64UpUrlBtn')?.addEventListener('click', () => {
            const text = ov.querySelector('#b64UpUrlText')?.value.trim();
            if (!text) { this._toast('请输入URL'); return; }
            const cat = ov.querySelector('#b64UpCat')?.value;
            const dd = this._getData();
            let count = 0;
            text.split('\n').forEach(line => {
                line = line.trim(); if (!line) return;
                const parts = line.split('|');
                if (parts.length < 2) return;
                const name = parts[0].trim();
                const url = parts.slice(1).join('|').trim();
                if (!name || !url) return;
                dd[this._activeTab].items.push({ id: 'img_' + Date.now() + '_' + count, name, desc: name, url, categoryId: cat || 'default', createdAt: new Date().toISOString() });
                count++;
            });
            this._saveData(dd);
            this._toast(`导入 ${count} 张`);
            ov.remove(); this.open();
        });

        ov.querySelector('#b64UpClose').addEventListener('click', () => { ov.remove(); });
    }

    // 从文件处理图片（返回Promise<{name,desc,data,categoryId}>）
    _addImageFromFile(file, name, desc, categoryId) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const maxSize = this._activeTab === 'stickers' ? 200 : 400;
                    const c = document.createElement('canvas');
                    const s = Math.min(1, maxSize / Math.max(img.width, img.height));
                    c.width = img.width * s; c.height = img.height * s;
                    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                    const dataUrl = c.toDataURL('image/jpeg', 0.8);
                    resolve({
                        id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                        name: name || '未命名',
                        desc: desc || '',
                        data: dataUrl,
                        categoryId: categoryId || 'default',
                        createdAt: new Date().toISOString()
                    });
                };
                img.onerror = () => resolve(null);
                img.src = ev.target.result;
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    }
    
    // 把处理好的图片项存入storage
    _saveItem(item) {
        if (!item) return;
        const d = this._getData();
        d[this._activeTab].items.push(item);
        this._saveData(d);
    }

    // ==================== 字体库Tab渲染 ====================
    _renderFontTab(data) {
        const fonts = data.fonts?.items || [];
        let kw = this._searchKeyword?.toLowerCase() || '';
        const filtered = kw ? fonts.filter(f => (f.name || '').toLowerCase().includes(kw)) : fonts;
        
        let listHtml = '';
        if (filtered.length === 0) {
            listHtml = '<div style="text-align:center;padding:40px 0;color:rgba(255,255,255,0.12);font-size:13px;">还没有字体</div>';
        } else {
            listHtml = filtered.map((f, i) => {
                const fontId = 'previewFont_' + i;
                return '<div class="b64-font-item" data-fid="' + f.id + '" style="margin-bottom:10px;padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;cursor:pointer;">' +
                    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><div style="flex:1;font-size:14px;font-weight:600;color:#fff;">' + this._esc(f.name) + '</div><div style="font-size:10px;color:rgba(255,255,255,0.2);">' + (f.url ? 'URL' : 'File') + '</div></div>' +
                    '<div id="' + fontId + '" style="font-size:18px;color:rgba(255,255,255,0.6);line-height:1.5;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px;">ABCDEFG abcdefg 你好世界 1234567890</div>' +
                '</div>';
            }).join('');
        }
        
        return '<div id="b64Grid" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 14px 80px;min-height:0;">' + listHtml + '</div>' +
            '<div style="position:absolute;bottom:0;left:0;right:0;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:rgba(17,17,17,0.95);border-top:1px solid rgba(255,255,255,0.04);display:flex;gap:8px;">' +
            '<button id="b64FontAddUrl" style="flex:1;padding:10px;border:none;border-radius:10px;background:rgba(240,147,43,0.12);color:#f0932b;font-size:13px;cursor:pointer;">+ URL添加</button>' +
            '<button id="b64FontAddFile" style="flex:1;padding:10px;border:none;border-radius:10px;background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.4);font-size:13px;cursor:pointer;">+ 文件上传</button>' +
            '<input type="file" id="b64FontFileInput" accept=".ttf,.otf,.woff,.woff2" style="display:none;">' +
            '</div>';
    }

    _bindFontEvents(page, data) {
        // 加载字体预览
        const fonts = data.fonts?.items || [];
        fonts.forEach((f, i) => {
            const el = page.querySelector('#previewFont_' + i);
            if (el && f.url) {
                const fontFace = new FontFace(f.id, 'url(' + f.url + ')');
                fontFace.load().then(loaded => {
                    document.fonts.add(loaded);
                    el.style.fontFamily = '"' + f.id + '", serif';
                }).catch(() => {
                    el.style.color = 'rgba(255,60,60,0.4)';
                    el.textContent = '字体加载失败';
                });
            } else if (el && f.data) {
                const fontFace = new FontFace(f.id, f.data);
                fontFace.load().then(loaded => {
                    document.fonts.add(loaded);
                    el.style.fontFamily = '"' + f.id + '", serif';
                }).catch(() => {});
            }
        });
        
        // 点击字体 → 编辑/删除
        page.querySelectorAll('.b64-font-item').forEach(item => {
            item.addEventListener('click', () => this._editFont(item.dataset.fid));
        });
        
        // URL添加
        page.querySelector('#b64FontAddUrl')?.addEventListener('click', async () => {
            const name = window.zpPrompt ? await window.zpPrompt('字体名称', '给这个字体命名', '', '字体名') : prompt('字体名：');
            if (!name) return;
            const url = window.zpPrompt ? await window.zpPrompt('字体URL', '输入字体文件的URL（.ttf/.otf/.woff/.woff2）', '', 'https://...') : prompt('URL：');
            if (!url) return;
            const d = this._getData();
            d.fonts.items.push({ id: 'font_' + Date.now(), name, url, createdAt: new Date().toISOString() });
            this._saveData(d);
            this.open();
        });
        
        // 文件上传
        page.querySelector('#b64FontAddFile')?.addEventListener('click', () => page.querySelector('#b64FontFileInput')?.click());
        page.querySelector('#b64FontFileInput')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const name = window.zpPrompt ? await window.zpPrompt('字体名称', '给这个字体命名', file.name.split('.')[0], '字体名') : (prompt('字体名：') || file.name.split('.')[0]);
            if (!name) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const d = this._getData();
                d.fonts.items.push({ id: 'font_' + Date.now(), name, data: ev.target.result, createdAt: new Date().toISOString() });
                this._saveData(d);
                this._toast('字体已添加');
                this.open();
            };
            reader.readAsDataURL(file);
        });
    }

    _editFont(fontId) {
        const d = this._getData();
        const font = d.fonts.items.find(f => f.id === fontId);
        if (!font) return;
        
        document.getElementById('b64FontEditOverlay')?.remove();
        const ov = document.createElement('div');
        ov.id = 'b64FontEditOverlay';
        ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9500;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);';
        ov.innerHTML = '<div style="width:calc(100% - 48px);max-width:300px;background:#1c1c1c;border-radius:16px;border:1px solid rgba(255,255,255,0.08);padding:20px;">' +
            '<div style="font-size:15px;font-weight:600;color:#fff;text-align:center;margin-bottom:12px;">编辑字体</div>' +
            '<input type="text" id="b64FontName" value="' + this._esc(font.name) + '" style="width:100%;padding:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;font-size:14px;box-sizing:border-box;margin-bottom:10px;">' +
            '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
            '<button id="b64FontSave" style="flex:1;padding:10px;border:none;border-radius:10px;background:rgba(240,147,43,0.15);color:#f0932b;font-size:13px;cursor:pointer;">保存</button>' +
            '<button id="b64FontDelete" style="padding:10px 16px;border:none;border-radius:10px;background:rgba(255,60,60,0.08);color:rgba(255,100,100,0.6);font-size:13px;cursor:pointer;">删除</button></div>' +
            '<button id="b64FontCancel" style="width:100%;padding:10px;border:none;border-radius:10px;background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.3);font-size:13px;cursor:pointer;">取消</button>' +
        '</div>';
        
        document.body.appendChild(ov);
        ov.querySelector('#b64FontSave')?.addEventListener('click', () => {
            font.name = ov.querySelector('#b64FontName')?.value.trim() || font.name;
            this._saveData(d); ov.remove(); this.open();
        });
        ov.querySelector('#b64FontDelete')?.addEventListener('click', async () => {
            const ok = window.zpConfirm ? await window.zpConfirm('删除', '删除字体「' + font.name + '」？', '删除', '取消') : confirm('删除？');
            if (!ok) return;
            d.fonts.items = d.fonts.items.filter(f => f.id !== fontId);
            this._saveData(d); ov.remove(); this.open();
        });
        ov.querySelector('#b64FontCancel')?.addEventListener('click', () => ov.remove());
    }

    // ==================== 编辑/删除分类 ====================
    async _editCategory(catId) {
        if (catId === 'default') { this._toast('默认分类不可操作'); return; }
        const d = this._getData();
        const section = d[this._activeTab];
        const cat = section.categories.find(c => c.id === catId);
        if (!cat) return;
        
        document.getElementById('b64CatEditOverlay')?.remove();
        const ov = document.createElement('div');
        ov.id = 'b64CatEditOverlay';
        ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9500;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);';
        ov.innerHTML = `<div style="width:calc(100% - 48px);max-width:300px;background:#1c1c1c;border-radius:16px;border:1px solid rgba(255,255,255,0.08);padding:20px;animation:profileSlideUp 0.2s ease-out;">
            <div style="font-size:15px;font-weight:600;color:#fff;text-align:center;margin-bottom:12px;">编辑分类</div>
            <input type="text" id="b64CatNameInput" value="${this._esc(cat.name)}" style="width:100%;padding:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;font-size:14px;box-sizing:border-box;margin-bottom:12px;">
            <div style="display:flex;gap:8px;">
                <button id="b64CatSave" style="flex:1;padding:10px;border:none;border-radius:10px;background:rgba(240,147,43,0.15);color:#f0932b;font-size:13px;cursor:pointer;">保存</button>
                <button id="b64CatDelete" style="padding:10px 16px;border:none;border-radius:10px;background:rgba(255,60,60,0.08);color:rgba(255,100,100,0.6);font-size:13px;cursor:pointer;">删除</button>
            </div>
            <button id="b64CatCancel" style="width:100%;margin-top:8px;padding:10px;border:none;border-radius:10px;background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.3);font-size:13px;cursor:pointer;">取消</button>
        </div>`;
        document.body.appendChild(ov);
        
        ov.querySelector('#b64CatSave').addEventListener('click', () => {
            const newName = ov.querySelector('#b64CatNameInput')?.value.trim();
            if (!newName) { this._toast('名字不能为空'); return; }
            cat.name = newName;
            this._saveData(d);
            ov.remove(); this.open();
        });
        ov.querySelector('#b64CatDelete').addEventListener('click', async () => {
            const itemCount = section.items.filter(i => i.categoryId === catId).length;
            const ok = window.zpConfirm ? await window.zpConfirm('删除分类', `删除分类「${cat.name}」？\n其中的${itemCount}张图片将移到默认分类`, '删除', '取消') : confirm('删除？');
            if (!ok) return;
            section.items.forEach(i => { if (i.categoryId === catId) i.categoryId = 'default'; });
            section.categories = section.categories.filter(c => c.id !== catId);
            this._saveData(d);
            this._activeCategory[this._activeTab] = 'default';
            ov.remove(); this.open();
        });
        ov.querySelector('#b64CatCancel').addEventListener('click', () => ov.remove());
    }

    // ==================== 移动分类面板 ====================
    _openMoveCategoryPanel() {
        const d = this._getData();
        const cats = d[this._activeTab].categories;

        document.getElementById('b64MoveOverlay')?.remove();
        const ov = document.createElement('div');
        ov.id = 'b64MoveOverlay';
        ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9500;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);';

        ov.innerHTML = `<div style="width:calc(100% - 48px);max-width:300px;background:#1c1c1c;border-radius:16px;border:1px solid rgba(255,255,255,0.08);padding:20px;animation:profileSlideUp 0.2s ease-out;">
            <div style="font-size:15px;font-weight:600;color:#fff;text-align:center;margin-bottom:12px;">移动到分类</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
                ${cats.map(c => `<button class="b64-move-cat" data-cid="${c.id}" style="padding:12px;border:1px solid rgba(255,255,255,0.06);border-radius:10px;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.6);font-size:14px;cursor:pointer;text-align:left;">${this._esc(c.name)}</button>`).join('')}
            </div>
            <button id="b64MoveCancel" style="width:100%;margin-top:10px;padding:10px;border:none;border-radius:10px;background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.3);font-size:13px;cursor:pointer;">取消</button>
        </div>`;

        document.body.appendChild(ov);

        ov.querySelectorAll('.b64-move-cat').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetCat = btn.dataset.cid;
                d[this._activeTab].items.forEach(item => {
                    if (this._selected.has(item.id)) item.categoryId = targetCat;
                });
                this._saveData(d);
                this._selected.clear();
                this._selectMode = false;
                ov.remove();
                this.open();
                this._toast('已移动');
            });
        });

        ov.querySelector('#b64MoveCancel').addEventListener('click', () => ov.remove());
    }
}

// 全局初始化
window.base64Library = new Base64Library();
