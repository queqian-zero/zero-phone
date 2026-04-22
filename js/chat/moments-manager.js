/* Moments Manager - 朋友圈模块 */
class MomentsManager {
    constructor() { this._page = null; }
    _store() { return (window.chatApp || window.chatInterface)?.storage; }
    _esc(s) { const d=document.createElement('div');d.textContent=s||'';return d.innerHTML; }
    _toast(t) { window.chatInterface?.showCssToast?.(t) || alert(t); }
    
    _getUserInfo() {
        const s = this._store()?.getUserSettings() || {};
        return { name: s.userNickname || s.userName || '我', avatar: s.userAvatar || '', signature: s.signature || '这个人很懒...', bgImage: s.momentsBgImage || '' };
    }
    
    _getAllMoments() {
        const store = this._store(); if (!store) return [];
        const friends = store.getAllFriends(); let all = [];
        friends.forEach(f => {
            const intim = store.getIntimacyData(f.code);
            (intim.moments||[]).forEach(m => { all.push({...m, friendCode:f.code, friendName:f.nickname||f.name, friendAvatar:f.avatar||''}); });
        });
        const user = this._getUserInfo();
        ((store.getUserSettings().myMoments)||[]).forEach(m => { all.push({...m, friendCode:'_self', friendName:user.name, friendAvatar:user.avatar, isSelf:true}); });
        all.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
        return all;
    }
    
    _ensureDemoData() {
        const store = this._store(); if (!store) return;
        const friends = store.getAllFriends(); if (!friends.length) return;
        let hasAny = false;
        friends.forEach(f => { if (store.getIntimacyData(f.code).moments?.length) hasAny = true; });
        if (hasAny) return;
        const f = friends[0]; const intim = store.getIntimacyData(f.code); const name = f.nickname || f.name;
        const userName = (store.getUserSettings().userNickname || store.getUserSettings().userName || '我');
        intim.moments = [
            { id:'demo_1', content:'今天天气真好，适合发呆 ☀️', images:[], createdAt:new Date(Date.now()-7200000).toISOString(), likes:[{name:userName,ts:new Date().toISOString()}], favorites:[], comments:[{id:'c1',name:userName,content:'确实！',ts:new Date(Date.now()-3600000).toISOString()},{id:'c2',name:name,content:'你也出来走走嘛',ts:new Date(Date.now()-1800000).toISOString(),replyTo:userName}] },
            { id:'demo_2', content:'刚才在整理房间，翻到了一些旧东西…突然有点感慨', images:[], createdAt:new Date(Date.now()-86400000).toISOString(), likes:[], favorites:[], comments:[] }
        ];
        store.saveIntimacyData(f.code, intim);
    }
    
    // ====== 头像HTML ======
    _avatarHtml(src, name, size) {
        if (src) return '<img src="'+this._esc(src)+'" style="width:'+size+'px;height:'+size+'px;border-radius:8px;object-fit:cover;">';
        return '<div style="width:'+size+'px;height:'+size+'px;border-radius:8px;background:rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;font-size:'+(size*0.4)+'px;color:rgba(0,0,0,0.3);">'+this._esc((name||'?').charAt(0))+'</div>';
    }
    
    // ====== 打开朋友圈 ======
    open() {
        this._ensureDemoData();
        document.getElementById('momentsPage')?.remove();
        const user = this._getUserInfo();
        const moments = this._getAllMoments();
        const page = document.createElement('div');
        page.id = 'momentsPage';
        page.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:8000;background:#1a1a1a;display:flex;flex-direction:column;';
        
        // 条目HTML
        let timelineHtml = '';
        if (!moments.length) {
            timelineHtml = '<div style="text-align:center;padding:60px 20px;color:rgba(255,255,255,0.12);font-size:15px;">暂无朋友圈动态</div>';
        } else {
            moments.forEach((m, i) => {
                const time = this._relTime(m.createdAt);
                const preview = (m.content||'').substring(0, 60);
                const lk = (m.likes||[]).length, cm = (m.comments||[]).length, fv = (m.favorites||[]).length;
                
                timelineHtml += '<div class="moment-item" data-idx="'+i+'" style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.03);cursor:pointer;">';
                timelineHtml += '<div style="display:flex;gap:10px;align-items:flex-start;">';
                timelineHtml += '<div style="flex-shrink:0;">'+this._avatarHtml(m.friendAvatar, m.friendName, 40)+'</div>';
                timelineHtml += '<div style="flex:1;min-width:0;">';
                timelineHtml += '<div style="font-size:15px;font-weight:600;color:rgba(240,147,43,0.7);">'+this._esc(m.friendName)+'</div>';
                timelineHtml += '<div style="font-size:14px;color:rgba(255,255,255,0.5);margin-top:4px;line-height:1.6;">'+this._esc(preview)+(m.content?.length>60?'...':'')+'</div>';
                if (m.images?.length) {
                    timelineHtml += '<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap;">';
                    m.images.slice(0,3).forEach(img => {
                    if (img.startsWith('fake:')) {
                        timelineHtml += '<div style="width:60px;height:60px;border-radius:6px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;"><div style="font-size:8px;color:rgba(255,255,255,0.2);text-align:center;padding:2px;">\ud83d\uddbc '+this._esc(img.substring(5).substring(0,12))+'</div></div>';
                    } else {
                        timelineHtml += '<div style="width:60px;height:60px;border-radius:6px;background:rgba(255,255,255,0.05);overflow:hidden;"><img src="'+this._esc(img)+'" style="width:100%;height:100%;object-fit:cover;"></div>';
                    }
                });
                    if (m.images.length>3) timelineHtml += '<div style="width:60px;height:60px;border-radius:6px;background:rgba(255,255,255,0.03);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);font-size:12px;">+'+(m.images.length-3)+'</div>';
                    timelineHtml += '</div>';
                }
                timelineHtml += '<div style="display:flex;align-items:center;gap:12px;margin-top:8px;font-size:12px;color:rgba(255,255,255,0.2);">';
                timelineHtml += '<span>'+time+'</span>';
                if (lk) timelineHtml += '<span>&#9825; '+lk+'</span>';
                if (cm) timelineHtml += '<span>&#128172; '+cm+'</span>';
                if (fv) timelineHtml += '<span>&#9733; '+fv+'</span>';
                timelineHtml += '</div></div></div>';
                
                // 展开区域
                timelineHtml += '<div class="moment-expand" data-idx="'+i+'" style="max-height:0;overflow:hidden;transition:max-height 0.3s ease;padding-left:50px;">';
                timelineHtml += '<div style="padding:8px 0 4px;">';
                timelineHtml += '<div style="display:flex;gap:16px;margin-bottom:10px;">';
                timelineHtml += '<button class="moment-fav-btn" data-idx="'+i+'" style="background:none;border:none;color:rgba(255,255,255,0.25);font-size:13px;cursor:pointer;padding:4px 0;">&#9733; 收藏</button>';
                timelineHtml += '<button class="moment-like-btn" data-idx="'+i+'" style="background:none;border:none;color:rgba(255,255,255,0.25);font-size:13px;cursor:pointer;padding:4px 0;">&#9825; 点赞</button>';
                timelineHtml += '<button class="moment-detail-btn" data-idx="'+i+'" style="background:none;border:none;color:rgba(240,147,43,0.5);font-size:13px;cursor:pointer;padding:4px 0;">查看此条目 &#8250;</button>';
                timelineHtml += '</div>';
                const comments = m.comments || [];
                if (comments.length) {
                    timelineHtml += '<div style="max-height:120px;overflow-y:auto;background:rgba(255,255,255,0.02);border-radius:8px;padding:8px 10px;">';
                    comments.forEach(c => {
                        const rp = c.replyTo ? '<span style="color:rgba(255,255,255,0.2);">回复 '+this._esc(c.replyTo)+'</span> ' : '';
                        timelineHtml += '<div style="font-size:13px;color:rgba(255,255,255,0.4);padding:3px 0;line-height:1.5;"><span style="color:rgba(240,147,43,0.6);font-weight:600;">'+this._esc(c.name)+'</span> '+rp+this._esc(c.content)+'</div>';
                    });
                    timelineHtml += '</div>';
                } else { timelineHtml += '<div style="font-size:12px;color:rgba(255,255,255,0.1);padding:4px 0;">暂无评论</div>'; }
                timelineHtml += '</div></div>';
                timelineHtml += '</div>';
            });
        }
        
        page.innerHTML =
            // ====== Header ======
            '<div style="height:60px;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,0,0,0.1);display:flex;align-items:center;padding:0 16px;padding-top:env(safe-area-inset-top);flex-shrink:0;box-shadow:0 2px 10px rgba(0,0,0,0.05);">' +
                '<button id="momentsBack" style="width:40px;height:40px;border:none;background:rgba(0,0,0,0.05);border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:rgba(0,0,0,0.6);">&#8592;</button>' +
                '<div style="flex:1;text-align:center;font-size:18px;font-weight:600;color:#000;">朋友圈</div>' +
                '<div style="position:relative;"><button id="momentsMenuBtn" style="width:40px;height:40px;border:none;background:rgba(0,0,0,0.05);border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;color:rgba(0,0,0,0.4);">&#8943;</button></div>' +
            '</div>' +
            // ====== 滚动内容 ======
            '<div id="momentsScroll" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;min-height:0;">' +
                // 16:9 背景图
                this._renderBanner(user.name, user.avatar, user.signature, user.bgImage, true) +
                '<div style="padding:12px 16px 6px;font-size:12px;color:rgba(255,255,255,0.12);letter-spacing:1px;">朋友圈动态</div>' +
                '<div id="momentsTimeline">'+timelineHtml+'</div>' +
            '</div>';
        
        document.body.appendChild(page);
        this._page = page; this._moments = moments;
        
        page.querySelector('#momentsBack')?.addEventListener('click', () => this.close());
        // 菜单按钮 → 抽屉
        page.querySelector('#momentsMenuBtn')?.addEventListener('click', () => {
            document.getElementById('_momentsDropdown')?.remove();
            const dd = document.createElement('div');
            dd.id = '_momentsDropdown';
            dd.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99998;';
            dd.innerHTML = '<div id="_mddPanel" style="position:absolute;top:60px;right:16px;background:rgba(255,255,255,0.96);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15);border:1px solid rgba(0,0,0,0.08);overflow:hidden;min-width:150px;transform:scale(0.8) translateY(-10px);opacity:0;transition:all 0.2s ease;transform-origin:top right;">' +
                '<div class="_mdd" data-action="refresh" style="padding:13px 18px;font-size:15px;color:#333;cursor:pointer;border-bottom:1px solid rgba(0,0,0,0.06);">刷新朋友圈</div>' +
                '<div class="_mdd" data-action="settings" style="padding:13px 18px;font-size:15px;color:#333;cursor:pointer;border-bottom:1px solid rgba(0,0,0,0.06);">朋友圈设置</div>' +
                '<div class="_mdd" data-action="post" style="padding:13px 18px;font-size:15px;color:#333;cursor:pointer;">发布朋友圈</div>' +
            '</div>';
            document.body.appendChild(dd);
            requestAnimationFrame(() => { const p = dd.querySelector('#_mddPanel'); if (p) { p.style.transform = 'scale(1) translateY(0)'; p.style.opacity = '1'; } });
            dd.addEventListener('click', (e) => {
                const panel = dd.querySelector('#_mddPanel');
                if (panel) { panel.style.transform = 'scale(0.8) translateY(-10px)'; panel.style.opacity = '0'; }
                setTimeout(() => dd.remove(), 200);
                const action = e.target.dataset?.action;
                if (action === 'post') setTimeout(() => this._openPostPage(), 250);
                else if (action === 'settings') setTimeout(() => this._openSettingsPage(), 250);
                else if (action === 'refresh') setTimeout(() => this._openRefreshPage(), 250);
            });
        });
        
        // 背景图更换
        page.querySelector('#momentsBanner')?.addEventListener('click', () => {
            document.getElementById('_momentsBgDialog')?.remove();
            const dlg = document.createElement('div');
            dlg.id = '_momentsBgDialog';
            dlg.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;';
            dlg.innerHTML = '<div style="width:calc(100% - 48px);max-width:320px;background:#1c1c1c;border-radius:16px;padding:20px;border:1px solid rgba(255,255,255,0.06);">' +
                '<div style="font-size:16px;font-weight:600;color:rgba(255,255,255,0.8);margin-bottom:14px;">更换背景图</div>' +
                '<input id="_bgUrlInput" type="text" placeholder="输入图片URL" style="width:100%;box-sizing:border-box;padding:10px 12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;font-size:14px;outline:none;margin-bottom:10px;">' +
                '<div style="display:flex;flex-direction:column;gap:8px;">' +
                    '<button id="_bgFromUrl" style="width:100%;padding:11px;border:1px solid rgba(255,255,255,0.08);border-radius:10px;background:transparent;color:rgba(255,255,255,0.6);font-size:14px;cursor:pointer;">使用URL</button>' +
                    '<button id="_bgFromAlbum" style="width:100%;padding:11px;border:1px solid rgba(240,147,43,0.2);border-radius:10px;background:rgba(240,147,43,0.06);color:rgba(240,147,43,0.7);font-size:14px;cursor:pointer;">从相册选图</button>' +
                    '<button id="_bgClear" style="width:100%;padding:11px;border:1px solid rgba(255,100,100,0.15);border-radius:10px;background:transparent;color:rgba(255,100,100,0.5);font-size:14px;cursor:pointer;">恢复默认</button>' +
                    '<button id="_bgCancel" style="width:100%;padding:10px;border:none;border-radius:10px;background:transparent;color:rgba(255,255,255,0.2);font-size:13px;cursor:pointer;">取消</button>' +
                '</div></div>';
            document.body.appendChild(dlg);
            dlg.addEventListener('click', e => { if (e.target === dlg) dlg.remove(); });
            dlg.querySelector('#_bgCancel')?.addEventListener('click', () => dlg.remove());
            dlg.querySelector('#_bgFromUrl')?.addEventListener('click', () => {
                const url = dlg.querySelector('#_bgUrlInput')?.value?.trim();
                if (!url) return;
                const s = this._store()?.getUserSettings(); if (s) { s.momentsBgImage = url; this._store().saveData('zero_phone_user_settings', s); }
                dlg.remove(); this.open();
            });
            dlg.querySelector('#_bgClear')?.addEventListener('click', () => {
                const s = this._store()?.getUserSettings(); if (s) { s.momentsBgImage = ''; this._store().saveData('zero_phone_user_settings', s); }
                dlg.remove(); this.open();
            });
            dlg.querySelector('#_bgFromAlbum')?.addEventListener('click', () => {
                const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
                inp.onchange = (e) => {
                    const file = e.target.files[0]; if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const maxW = 800; let w = img.width, h = img.height;
                            if (w > maxW) { h = h * maxW / w; w = maxW; }
                            canvas.width = w; canvas.height = h;
                            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                            const compressed = canvas.toDataURL('image/jpeg', 0.7);
                            const s = this._store()?.getUserSettings(); if (s) { s.momentsBgImage = compressed; this._store().saveData('zero_phone_user_settings', s); }
                            dlg.remove(); this.open();
                        };
                        img.src = ev.target.result;
                    };
                    reader.readAsDataURL(file);
                };
                inp.click();
            });
        });
        
        // 折叠/展开
        page.querySelectorAll('.moment-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.moment-fav-btn') || e.target.closest('.moment-like-btn') || e.target.closest('.moment-detail-btn')) return;
                const idx = item.dataset.idx;
                const expand = page.querySelector('.moment-expand[data-idx="'+idx+'"]');
                if (!expand) return;
                const isOpen = expand.style.maxHeight !== '0px' && expand.style.maxHeight !== '';
                page.querySelectorAll('.moment-expand').forEach(ex => { ex.style.maxHeight = '0px'; });
                if (!isOpen) {
                    expand.style.maxHeight = expand.scrollHeight + 'px';
                    setTimeout(() => { if (expand.style.maxHeight !== '0px') expand.style.maxHeight = expand.scrollHeight + 'px'; }, 350);
                }
            });
        });
        
        page.querySelectorAll('.moment-detail-btn').forEach(btn => { btn.addEventListener('click', () => { const idx = parseInt(btn.dataset.idx); if (this._moments[idx]) this._openDetail(this._moments[idx]); }); });
        page.querySelectorAll('.moment-like-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                const m = this._moments[idx]; if (!m) return;
                const user = this._getUserInfo();
                if (!m.likes) m.likes = [];
                const existing = m.likes.findIndex(l => l.name === user.name);
                if (existing >= 0) { m.likes.splice(existing, 1); this._toast('已取消点赞'); }
                else { m.likes.push({ name: user.name, ts: new Date().toISOString() }); this._toast('已点赞'); }
                this._saveMoment(m);
                this.open(); // 刷新
            });
        });
        page.querySelectorAll('.moment-fav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                const m = this._moments[idx]; if (!m) return;
                const user = this._getUserInfo();
                if (!m.favorites) m.favorites = [];
                const existing = m.favorites.findIndex(f => f.name === user.name);
                if (existing >= 0) { m.favorites.splice(existing, 1); this._toast('已取消收藏'); }
                else { m.favorites.push({ name: user.name, ts: new Date().toISOString() }); this._toast('已收藏'); }
                this._saveMoment(m);
                this.open();
            });
        });
    }
    
    close() { this._page?.remove(); this._page = null; }
    
    // ====== AI的朋友圈（只看某个AI的） ======
    openForFriend(friendCode) {
        const store = this._store(); if (!store) return;
        const friend = store.getAllFriends().find(f => f.code === friendCode);
        if (!friend) { this._toast('好友不存在'); return; }
        const intim = store.getIntimacyData(friendCode);
        const moments = (intim.moments || []).sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
        const name = friend.nickname || friend.name;
        const avatar = friend.avatar || '';
        
        document.getElementById('momentsPage')?.remove();
        const page = document.createElement('div');
        page.id = 'momentsPage';
        page.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:8000;background:#1a1a1a;display:flex;flex-direction:column;';
        
        let timelineHtml = '';
        if (!moments.length) {
            timelineHtml = '<div style="text-align:center;padding:60px 20px;color:rgba(255,255,255,0.12);font-size:14px;">TA还没发过朋友圈</div>';
        } else {
            moments.forEach((m, i) => {
                timelineHtml += this._renderMomentItem(m, i, { friendCode, friendName: name, friendAvatar: avatar });
            });
        }
        
        page.innerHTML =
            '<div style="height:60px;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,0,0,0.1);display:flex;align-items:center;padding:0 16px;padding-top:env(safe-area-inset-top);flex-shrink:0;box-shadow:0 2px 10px rgba(0,0,0,0.05);">' +
                '<button id="momentsBack" style="width:40px;height:40px;border:none;background:rgba(0,0,0,0.05);border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:rgba(0,0,0,0.6);">&#8592;</button>' +
                '<div style="flex:1;text-align:center;font-size:18px;font-weight:600;color:#000;">'+this._esc(name)+' 的朋友圈</div>' +
                '<div style="width:40px;"></div>' +
            '</div>' +
            '<div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;min-height:0;">' +
                this._renderBanner(name, avatar, '', '', false) +
                '<div style="padding:0 16px 6px;font-size:12px;color:rgba(255,255,255,0.12);">朋友圈动态</div>' +
                '<div id="momentsTimeline">'+timelineHtml+'</div>' +
            '</div>';
        
        document.body.appendChild(page);
        this._page = page;
        this._moments = moments.map(m => ({...m, friendCode, friendName:name, friendAvatar:avatar}));
        
        page.querySelector('#momentsBack')?.addEventListener('click', () => this.close());
        this._bindTimelineEvents(page);
    }
    
    // ====== 我的朋友圈（只看自己的，时间轴） ======
    openForSelf() {
        const store = this._store(); if (!store) return;
        const user = this._getUserInfo();
        const settings = store.getUserSettings();
        const moments = (settings.myMoments || []).sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
        
        document.getElementById('momentsPage')?.remove();
        const page = document.createElement('div');
        page.id = 'momentsPage';
        page.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:8000;background:#1a1a1a;display:flex;flex-direction:column;';
        
        // 按年/月分组（仿微信时间轴）
        let timelineHtml = '';
        if (!moments.length) {
            timelineHtml = '<div style="text-align:center;padding:60px 20px;color:rgba(255,255,255,0.12);font-size:14px;">你还没发过朋友圈</div>';
        } else {
            let lastYear = '', lastMonth = '';
            moments.forEach((m, i) => {
                const d = new Date(m.createdAt);
                const yr = d.getFullYear() + '年';
                const mo = (d.getMonth()+1) + '月';
                const day = d.getDate() + '日';
                if (yr !== lastYear) { timelineHtml += '<div style="padding:16px 16px 4px;font-size:16px;font-weight:700;color:rgba(255,255,255,0.6);">'+yr+'</div>'; lastYear = yr; lastMonth = ''; }
                
                const dateLabel = day;
                const preview = (m.content||'').substring(0,60);
                const hasImg = m.images?.length > 0;
                
                timelineHtml += '<div class="moment-item" data-idx="'+i+'" style="display:flex;gap:12px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.02);cursor:pointer;">';
                // 日期列
                timelineHtml += '<div style="min-width:50px;text-align:right;"><div style="font-size:22px;font-weight:700;color:rgba(255,255,255,0.5);">'+d.getDate()+'</div><div style="font-size:11px;color:rgba(255,255,255,0.2);">'+(d.getMonth()+1)+'月</div></div>';
                // 图片缩略图
                if (hasImg) {
                    const img = m.images[0];
                    if (img.startsWith('fake:')) {
                        timelineHtml += '<div style="width:70px;height:70px;border-radius:8px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><div style="font-size:9px;color:rgba(255,255,255,0.2);text-align:center;">&#128444; '+this._esc(img.substring(5).substring(0,10))+'</div></div>';
                    } else {
                        timelineHtml += '<div style="width:70px;height:70px;border-radius:8px;overflow:hidden;flex-shrink:0;"><img src="'+this._esc(img)+'" style="width:100%;height:100%;object-fit:cover;"></div>';
                    }
                }
                // 文字
                timelineHtml += '<div style="flex:1;min-width:0;"><div style="font-size:14px;color:rgba(255,255,255,0.5);line-height:1.6;">'+this._esc(preview)+(m.content?.length>60?'...':'')+'</div></div>';
                timelineHtml += '</div>';
            });
        }
        
        page.innerHTML =
            '<div style="height:60px;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,0,0,0.1);display:flex;align-items:center;padding:0 16px;padding-top:env(safe-area-inset-top);flex-shrink:0;box-shadow:0 2px 10px rgba(0,0,0,0.05);">' +
                '<button id="momentsBack" style="width:40px;height:40px;border:none;background:rgba(0,0,0,0.05);border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:rgba(0,0,0,0.6);">&#8592;</button>' +
                '<div style="flex:1;text-align:center;font-size:18px;font-weight:600;color:#000;">我的朋友圈</div>' +
                '<div style="width:40px;"></div>' +
            '</div>' +
            '<div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;min-height:0;">' +
                // 头部
                this._renderBanner(user.name, user.avatar, user.signature, user.bgImage, false) +
                '<div id="momentsTimeline">'+timelineHtml+'</div>' +
            '</div>';
        
        document.body.appendChild(page);
        this._page = page;
        this._moments = moments.map(m => ({...m, friendCode:'_self', friendName:user.name, friendAvatar:user.avatar, isSelf:true}));
        
        page.querySelector('#momentsBack')?.addEventListener('click', () => this.close());
        // 点击条目→详情
        page.querySelectorAll('.moment-item').forEach(item => {
            item.addEventListener('click', () => {
                const idx = parseInt(item.dataset.idx);
                if (this._moments[idx]) this._openDetail(this._moments[idx]);
            });
        });
    }
    
    // 通用Banner渲染（三个入口统一样式）
    _renderBanner(name, avatar, signature, bgImage, clickable) {
        return '<div'+(clickable?' id="momentsBanner"':'')+' style="position:relative;width:100%;padding-top:56.25%;background:'+(bgImage?'url('+this._esc(bgImage)+') center/cover':'linear-gradient(135deg,rgba(25,25,35,1),rgba(12,12,18,1))')+';overflow:hidden;'+(clickable?'cursor:pointer;':'')+'"'+(clickable?' title="点击更换背景图"':'')+'>' +
            (clickable?'<div style="position:absolute;top:8px;right:8px;font-size:10px;color:rgba(255,255,255,0.2);pointer-events:none;">点击更换</div>':'') +
            '<div style="position:absolute;bottom:0;left:0;right:0;padding:14px 16px;background:linear-gradient(transparent,rgba(0,0,0,0.6));display:flex;align-items:flex-end;gap:12px;">' +
                '<div style="width:68px;height:68px;border-radius:12px;border:2px solid rgba(255,255,255,0.1);overflow:hidden;flex-shrink:0;background:rgba(255,255,255,0.05);">' +
                    (avatar?'<img src="'+this._esc(avatar)+'" style="width:100%;height:100%;object-fit:cover;">':'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:26px;color:rgba(255,255,255,0.3);">&#128100;</div>') +
                '</div>' +
                '<div style="flex:1;min-width:0;">' +
                    '<div style="font-size:20px;font-weight:700;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.5);">'+this._esc(name)+'</div>' +
                    '<div style="font-size:14px;color:rgba(255,255,255,0.5);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+this._esc(signature||'')+'</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }
    
    // 通用条目渲染
    _renderMomentItem(m, i, defaults) {
        const merged = {...defaults, ...m};
        const time = this._relTime(merged.createdAt);
        const preview = (merged.content||'').substring(0, 60);
        const lk = (merged.likes||[]).length, cm = (merged.comments||[]).length;
        const avatarHtml = merged.friendAvatar
            ? '<img src="'+this._esc(merged.friendAvatar)+'" style="width:40px;height:40px;border-radius:8px;object-fit:cover;">'
            : '<div style="width:40px;height:40px;border-radius:8px;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:16px;">'+this._esc((merged.friendName||'?').charAt(0))+'</div>';
        
        let html = '<div class="moment-item" data-idx="'+i+'" style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.03);cursor:pointer;">';
        html += '<div style="display:flex;gap:10px;align-items:flex-start;"><div style="flex-shrink:0;">'+avatarHtml+'</div><div style="flex:1;min-width:0;">';
        html += '<div style="font-size:15px;font-weight:600;color:rgba(240,147,43,0.7);">'+this._esc(merged.friendName)+'</div>';
        html += '<div style="font-size:14px;color:rgba(255,255,255,0.5);margin-top:4px;line-height:1.6;">'+this._esc(preview)+(merged.content?.length>60?'...':'')+'</div>';
        html += '<div style="display:flex;align-items:center;gap:12px;margin-top:8px;font-size:12px;color:rgba(255,255,255,0.2);"><span>'+time+'</span>';
        if (lk) html += '<span>&#9825; '+lk+'</span>';
        if (cm) html += '<span>&#128172; '+cm+'</span>';
        html += '</div></div></div>';
        // 展开区域
        html += '<div class="moment-expand" data-idx="'+i+'" style="max-height:0;overflow:hidden;transition:max-height 0.3s ease;padding-left:50px;">';
        html += '<div style="padding:8px 0 4px;"><div style="display:flex;gap:16px;margin-bottom:10px;">';
        html += '<button class="moment-fav-btn" data-idx="'+i+'" style="background:none;border:none;color:rgba(255,255,255,0.25);font-size:13px;cursor:pointer;">&#9733; 收藏</button>';
        html += '<button class="moment-like-btn" data-idx="'+i+'" style="background:none;border:none;color:rgba(255,255,255,0.25);font-size:13px;cursor:pointer;">&#9825; 点赞</button>';
        html += '<button class="moment-detail-btn" data-idx="'+i+'" style="background:none;border:none;color:rgba(240,147,43,0.5);font-size:13px;cursor:pointer;">查看此条目 &#8250;</button>';
        html += '</div></div></div></div>';
        return html;
    }
    
    // 通用事件绑定
    _bindTimelineEvents(page) {
        page.querySelectorAll('.moment-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.moment-fav-btn') || e.target.closest('.moment-like-btn') || e.target.closest('.moment-detail-btn')) return;
                const idx = item.dataset.idx;
                const expand = page.querySelector('.moment-expand[data-idx="'+idx+'"]');
                if (!expand) return;
                const isOpen = expand.style.maxHeight !== '0px' && expand.style.maxHeight !== '';
                page.querySelectorAll('.moment-expand').forEach(ex => { ex.style.maxHeight = '0px'; });
                if (!isOpen) { expand.style.maxHeight = expand.scrollHeight + 'px'; setTimeout(() => { if (expand.style.maxHeight !== '0px') expand.style.maxHeight = expand.scrollHeight + 'px'; }, 350); }
            });
        });
        page.querySelectorAll('.moment-detail-btn').forEach(btn => { btn.addEventListener('click', () => { const idx = parseInt(btn.dataset.idx); if (this._moments[idx]) this._openDetail(this._moments[idx]); }); });
        page.querySelectorAll('.moment-like-btn').forEach(btn => {
            btn.addEventListener('click', () => { const m = this._moments[parseInt(btn.dataset.idx)]; if (!m) return; const u = this._getUserInfo(); if (!m.likes) m.likes = []; const ei = m.likes.findIndex(l=>l.name===u.name); if (ei>=0) m.likes.splice(ei,1); else m.likes.push({name:u.name,ts:new Date().toISOString()}); this._saveMoment(m); this._toast(ei>=0?'已取消点赞':'已点赞'); });
        });
        page.querySelectorAll('.moment-fav-btn').forEach(btn => {
            btn.addEventListener('click', () => { const m = this._moments[parseInt(btn.dataset.idx)]; if (!m) return; const u = this._getUserInfo(); if (!m.favorites) m.favorites = []; const ei = m.favorites.findIndex(f=>f.name===u.name); if (ei>=0) m.favorites.splice(ei,1); else m.favorites.push({name:u.name,ts:new Date().toISOString()}); this._saveMoment(m); this._toast(ei>=0?'已取消收藏':'已收藏'); });
        });
    }
    
    // 保存朋友圈数据（根据friendCode找到对应存储位置）
    _saveMoment(moment) {
        const store = this._store(); if (!store) return;
        if (moment.isSelf || moment.friendCode === '_self') {
            const s = store.getUserSettings();
            const idx = (s.myMoments||[]).findIndex(m => m.id === moment.id);
            if (idx >= 0) { s.myMoments[idx] = moment; store.saveData('zero_phone_user_settings', s); }
        } else {
            const d = store.getIntimacyData(moment.friendCode);
            const idx = (d.moments||[]).findIndex(m => m.id === moment.id);
            if (idx >= 0) { d.moments[idx] = moment; store.saveIntimacyData(moment.friendCode, d); }
        }
    }
    
    // 删除朋友圈
    _deleteMoment(moment) {
        const store = this._store(); if (!store) return;
        if (moment.isSelf || moment.friendCode === '_self') {
            const s = store.getUserSettings();
            s.myMoments = (s.myMoments||[]).filter(m => m.id !== moment.id);
            store.saveData('zero_phone_user_settings', s);
        } else {
            const d = store.getIntimacyData(moment.friendCode);
            d.moments = (d.moments||[]).filter(m => m.id !== moment.id);
            store.saveIntimacyData(moment.friendCode, d);
        }
    }
    
    // ====== 发布朋友圈页面 ======
    _openPostPage() {
        document.getElementById('momentPostPage')?.remove();
        const p = document.createElement('div');
        p.id = 'momentPostPage';
        p.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:8500;background:#111;display:flex;flex-direction:column;';
        
        const store = this._store();
        const friends = store?.getAllFriends() || [];
        let selectedImages = []; // {type:'file'|'url', data:'base64/url', desc:''}
        let visibility = 'public'; // 'public' | 'exclude'
        let excludeList = [];
        let notifyList = [];
        
        const renderImages = () => {
            const container = p.querySelector('#postImageGrid');
            if (!container) return;
            let html = '';
            selectedImages.forEach((img, i) => {
                html += '<div style="position:relative;width:calc(33.3% - 4px);aspect-ratio:1;border-radius:8px;overflow:hidden;background:rgba(255,255,255,0.05);">';
                html += '<img src="'+(img.data||'')+'" style="width:100%;height:100%;object-fit:cover;">';
                html += '<button data-idx="'+i+'" class="postImgDel" style="position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;border:none;background:rgba(0,0,0,0.5);color:#fff;font-size:12px;cursor:pointer;">&#10005;</button>';
                html += '</div>';
            });
            if (selectedImages.length < 9) {
                html += '<div id="postAddImg" style="width:calc(33.3% - 4px);aspect-ratio:1;border-radius:8px;background:rgba(255,255,255,0.05);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;border:1px dashed rgba(255,255,255,0.1);">';
                html += '<div style="font-size:24px;color:rgba(255,255,255,0.2);">+</div>';
                html += '<div style="font-size:10px;color:rgba(255,255,255,0.1);margin-top:4px;">'+selectedImages.length+'/9</div>';
                html += '</div>';
            }
            container.innerHTML = html;
            // 删除图片
            container.querySelectorAll('.postImgDel').forEach(btn => {
                btn.addEventListener('click', (e) => { e.stopPropagation(); selectedImages.splice(parseInt(btn.dataset.idx), 1); renderImages(); });
            });
            // 添加图片
            container.querySelector('#postAddImg')?.addEventListener('click', () => this._addPostImage(selectedImages, renderImages));
        };
        
        p.innerHTML =
            '<div style="height:60px;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,0,0,0.1);display:flex;align-items:center;padding:0 16px;padding-top:env(safe-area-inset-top);flex-shrink:0;">' +
                '<button id="postBack" style="width:40px;height:40px;border:none;background:rgba(0,0,0,0.05);border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:rgba(0,0,0,0.6);">&#8592;</button>' +
                '<div style="flex:1;"></div>' +
                '<button id="postSubmit" style="padding:8px 20px;border:none;border-radius:10px;background:rgba(240,147,43,0.15);color:rgba(240,147,43,0.8);font-size:14px;font-weight:600;cursor:pointer;">发表</button>' +
            '</div>' +
            '<div style="flex:1;overflow-y:auto;padding:16px;">' +
                '<textarea id="postContent" placeholder="这一刻的想法..." style="width:100%;box-sizing:border-box;min-height:120px;background:transparent;border:none;color:rgba(255,255,255,0.7);font-size:16px;line-height:1.8;outline:none;resize:none;"></textarea>' +
                '<div id="postImageGrid" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;"></div>' +
                '<div style="margin-top:24px;border-top:1px solid rgba(255,255,255,0.04);padding-top:12px;">' +
                    '<div id="postVisibility" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.03);cursor:pointer;">' +
                        '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:16px;">&#128100;</span><span style="font-size:15px;color:rgba(255,255,255,0.5);">谁可以看</span></div>' +
                        '<span id="postVisLabel" style="font-size:14px;color:rgba(255,255,255,0.25);">公开 &#8250;</span>' +
                    '</div>' +
                    '<div id="postNotify" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;cursor:pointer;">' +
                        '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:16px;">@</span><span style="font-size:15px;color:rgba(255,255,255,0.5);">提醒谁看</span></div>' +
                        '<span id="postNotifyLabel" style="font-size:14px;color:rgba(255,255,255,0.25);">无 &#8250;</span>' +
                    '</div>' +
                '</div>' +
            '</div>';
        
        document.body.appendChild(p);
        renderImages();
        
        p.querySelector('#postBack')?.addEventListener('click', () => p.remove());
        // 谁可以看
        p.querySelector('#postVisibility')?.addEventListener('click', async () => {
            const ml = window.memoryLibrary;
            if (!ml) return;
            const mode = await ml._zpMenu('谁可以看', '', [
                { label: '公开（所有好友可见）', value: 'public' },
                { label: '选择不给谁看', value: 'exclude' }
            ]);
            if (!mode) return;
            if (mode === 'public') {
                visibility = 'public'; excludeList = [];
                p.querySelector('#postVisLabel').textContent = '公开 ›';
            } else {
                // 多选好友
                const fList = friends.map(f => f.nickname || f.name);
                let tempExclude = [...excludeList];
                const pickNext = async () => {
                    const remaining = fList.filter(n => !tempExclude.includes(n));
                    if (remaining.length === 0) { this._toast('已全部屏蔽'); return; }
                    const btns = remaining.map(n => ({ label: n, value: n }));
                    btns.push({ label: '✓ 完成选择', value: '_done' });
                    const pick = await ml._zpMenu('选择不给谁看', '已屏蔽：' + (tempExclude.length ? tempExclude.join('、') : '无'), btns);
                    if (!pick || pick === '_done') return;
                    tempExclude.push(pick);
                    await pickNext();
                };
                await pickNext();
                excludeList = tempExclude;
                visibility = tempExclude.length > 0 ? 'exclude' : 'public';
                p.querySelector('#postVisLabel').textContent = excludeList.length > 0 ? '不给' + excludeList.join('、') + '看 ›' : '公开 ›';
            }
        });
        
        // 提醒谁看
        p.querySelector('#postNotify')?.addEventListener('click', async () => {
            const ml = window.memoryLibrary;
            if (!ml) return;
            const fList = friends.map(f => f.nickname || f.name);
            let tempNotify = [...notifyList];
            const pickNext = async () => {
                const remaining = fList.filter(n => !tempNotify.includes(n));
                if (remaining.length === 0) { this._toast('已全部提醒'); return; }
                const btns = remaining.map(n => ({ label: n, value: n }));
                btns.push({ label: '✓ 完成选择', value: '_done' });
                const pick = await ml._zpMenu('提醒谁看', '已选：' + (tempNotify.length ? tempNotify.join('、') : '无') + '\n\n被提醒的好友回应概率更高', btns);
                if (!pick || pick === '_done') return;
                tempNotify.push(pick);
                await pickNext();
            };
            await pickNext();
            notifyList = tempNotify;
            p.querySelector('#postNotifyLabel').textContent = notifyList.length > 0 ? notifyList.join('、') + ' ›' : '无 ›';
        });
        
        // 发表
        p.querySelector('#postSubmit')?.addEventListener('click', () => {
            const content = p.querySelector('#postContent')?.value?.trim();
            if (!content && selectedImages.length === 0) { this._toast('请输入内容或添加图片'); return; }
            const user = this._getUserInfo();
            const moment = {
                id: 'my_' + Date.now(),
                content: content || '',
                images: selectedImages.map(img => img.data),
                imageDescs: selectedImages.filter(img => img.desc).map(img => ({url: img.data, desc: img.desc})),
                createdAt: new Date().toISOString(),
                likes: [], favorites: [], comments: [],
                visibility, excludeList, notifyList
            };
            const settings = store.getUserSettings();
            if (!settings.myMoments) settings.myMoments = [];
            settings.myMoments.unshift(moment);
            store.saveData('zero_phone_user_settings', settings);
            p.remove();
            this._toast('朋友圈已发布');
            this.open(); // 刷新
        });
    }
    
    // 添加图片（选择相册或URL）
    async _addPostImage(selectedImages, renderCallback) {
        const ml = window.memoryLibrary;
        const action = ml ? await ml._zpMenu('添加图片', '', [
            {label: '从相册选图', value: 'album'},
            {label: '输入图片URL', value: 'url'}
        ]) : 'album';
        
        if (action === 'album') {
            const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
            inp.onchange = (e) => {
                const files = Array.from(e.target.files).slice(0, 9 - selectedImages.length);
                let processed = 0;
                files.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const maxW = 800; let w = img.width, h = img.height;
                            if (w > maxW) { h = h * maxW / w; w = maxW; }
                            canvas.width = w; canvas.height = h;
                            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                            selectedImages.push({ type: 'file', data: canvas.toDataURL('image/jpeg', 0.7), desc: '' });
                            processed++;
                            if (processed === files.length) renderCallback();
                        };
                        img.src = ev.target.result;
                    };
                    reader.readAsDataURL(file);
                });
            };
            inp.click();
        } else if (action === 'url') {
            const url = ml ? await ml._zpInput('图片URL', '输入图片地址') : prompt('图片URL：');
            if (!url?.trim()) return;
            const desc = ml ? await ml._zpInput('图片描述（必填）', '帮助AI理解这张图') : prompt('图片描述：');
            if (!desc?.trim()) { this._toast('URL图片必须添加描述'); return; }
            selectedImages.push({ type: 'url', data: url.trim(), desc: desc.trim() });
            renderCallback();
        }
    }
    
    // ====== 朋友圈设置页面 ======
    _openSettingsPage() {
        document.getElementById('momentSettingsPage')?.remove();
        const store = this._store();
        const settings = store?.getUserSettings() || {};
        const msCfg = settings.momentsConfig || { responseMode: 'B', customCss: '', visibilityMode: 'B' };
        
        const p = document.createElement('div');
        p.id = 'momentSettingsPage';
        p.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:8500;background:#111;display:flex;flex-direction:column;';
        
        p.innerHTML =
            '<div style="height:60px;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,0,0,0.1);display:flex;align-items:center;padding:0 16px;padding-top:env(safe-area-inset-top);flex-shrink:0;">' +
                '<button id="msBack" style="width:40px;height:40px;border:none;background:rgba(0,0,0,0.05);border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:rgba(0,0,0,0.6);">&#8592;</button>' +
                '<div style="flex:1;text-align:center;font-size:18px;font-weight:600;color:#000;">朋友圈设置</div>' +
                '<div style="width:40px;"></div>' +
            '</div>' +
            '<div style="flex:1;overflow-y:auto;padding:16px;">' +
                // AI回应模式
                '<div style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.6);margin-bottom:12px;">AI回应我的朋友圈的方式</div>' +
                '<label style="display:flex;align-items:flex-start;gap:10px;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;margin-bottom:8px;cursor:pointer;">' +
                    '<input type="radio" name="msResMode" value="A" '+(msCfg.responseMode==='A'?'checked':'')+' style="margin-top:3px;">' +
                    '<div><div style="font-size:14px;color:rgba(255,255,255,0.6);">A. 发完立刻回应</div><div style="font-size:12px;color:rgba(255,255,255,0.25);margin-top:3px;">每个AI立刻调API决定是否回应。<br>✅ 即时 ⚠️ 同时调多个API，较贵</div></div>' +
                '</label>' +
                '<label style="display:flex;align-items:flex-start;gap:10px;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;margin-bottom:8px;cursor:pointer;">' +
                    '<input type="radio" name="msResMode" value="B" '+(msCfg.responseMode==='B'?'checked':'')+' style="margin-top:3px;">' +
                    '<div><div style="font-size:14px;color:rgba(255,255,255,0.6);">B. 下次聊天时回应</div><div style="font-size:12px;color:rgba(255,255,255,0.25);margin-top:3px;">下次跟某AI聊天时告诉它有新朋友圈。<br>✅ 省token ⚠️ 不主动聊就不会回应</div></div>' +
                '</label>' +
                '<label style="display:flex;align-items:flex-start;gap:10px;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;margin-bottom:16px;cursor:pointer;">' +
                    '<input type="radio" name="msResMode" value="C" '+(msCfg.responseMode==='C'?'checked':'')+' style="margin-top:3px;">' +
                    '<div><div style="font-size:14px;color:rgba(255,255,255,0.6);">C. 刷新时回应</div><div style="font-size:12px;color:rgba(255,255,255,0.25);margin-top:3px;">点"刷新朋友圈"时统一处理。<br>✅ 可控 ⚠️ 需要手动触发</div></div>' +
                '</label>' +
                // 自定义CSS
                '<div style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.6);margin-bottom:8px;">AI看朋友圈的方式</div>' +
                '<label style="display:flex;align-items:flex-start;gap:10px;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;margin-bottom:8px;cursor:pointer;">' +
                    '<input type="radio" name="msVisMode" value="A" '+(msCfg.visibilityMode==='A'?'checked':'')+' style="margin-top:3px;">' +
                    '<div><div style="font-size:14px;color:rgba(255,255,255,0.6);">A. 每轮自动注入</div><div style="font-size:12px;color:rgba(255,255,255,0.25);margin-top:3px;">每次聊天都告诉AI最新朋友圈动态。<br>✅ AI随时知道 ⚠️ 每轮都占token</div></div>' +
                '</label>' +
                '<label style="display:flex;align-items:flex-start;gap:10px;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;margin-bottom:8px;cursor:pointer;">' +
                    '<input type="radio" name="msVisMode" value="B" '+(msCfg.visibilityMode==='B'||!msCfg.visibilityMode?'checked':'')+' style="margin-top:3px;">' +
                    '<div><div style="font-size:14px;color:rgba(255,255,255,0.6);">B. AI主动查看（默认）</div><div style="font-size:12px;color:rgba(255,255,255,0.25);margin-top:3px;">AI用[AI_CHECK_MOMENTS]指令查看，下一轮才看到。<br>✅ 省token ⚠️ AI不查就看不到</div></div>' +
                '</label>' +
                '<label style="display:flex;align-items:flex-start;gap:10px;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;margin-bottom:8px;cursor:pointer;">' +
                    '<input type="radio" name="msVisMode" value="C" '+(msCfg.visibilityMode==='C'?'checked':'')+' style="margin-top:3px;">' +
                    '<div><div style="font-size:14px;color:rgba(255,255,255,0.6);">C. 跟随记忆检索</div><div style="font-size:12px;color:rgba(255,255,255,0.25);margin-top:3px;">朋友圈数据加入记忆搜索池，检索记忆时可能搜到。<br>✅ 自然融入 ⚠️ 不一定每次都搜到</div></div>' +
                '</label>' +
                '<label style="display:flex;align-items:flex-start;gap:10px;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;margin-bottom:16px;cursor:pointer;">' +
                    '<input type="radio" name="msVisMode" value="D" '+(msCfg.visibilityMode==='D'?'checked':'')+' style="margin-top:3px;">' +
                    '<div><div style="font-size:14px;color:rgba(255,255,255,0.6);">D. 不注入</div><div style="font-size:12px;color:rgba(255,255,255,0.25);margin-top:3px;">AI完全看不到朋友圈，只能通过刷新时被通知。<br>✅ 最省token ⚠️ AI不知道朋友圈的存在</div></div>' +
                '</label>' +
                '<label style="display:flex;align-items:flex-start;gap:10px;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;margin-bottom:16px;cursor:pointer;">' +
                    '<input type="radio" name="msVisMode" value="E" '+(msCfg.visibilityMode==='E'?'checked':'')+' style="margin-top:3px;">' +
                    '<div><div style="font-size:14px;color:rgba(255,255,255,0.6);">E. 全量开放</div><div style="font-size:12px;color:rgba(255,255,255,0.25);margin-top:3px;">把所有朋友圈完整展开给AI看，包含所有评论和互动。<br>✅ 最完整 ⚠️ 朋友圈多时很占token</div></div>' +
                '</label>' +
                '<div style="font-size:14px;font-weight:600;color:rgba(255,255,255,0.6);margin-bottom:8px;">自定义CSS美化</div>' +
                '<div style="font-size:11px;color:rgba(255,255,255,0.15);margin-bottom:8px;">作用于 #momentsPage 容器，仅自己可见。<br>示例类名：.moment-item / .moment-expand / #momentsTimeline / #momentsBanner</div>' +
                '<textarea id="msCssInput" placeholder="输入自定义CSS..." style="width:100%;box-sizing:border-box;min-height:100px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:rgba(255,255,255,0.6);font-size:13px;font-family:monospace;padding:10px;outline:none;resize:vertical;">'+(this._esc(msCfg.customCss||''))+'</textarea>' +
                '<button id="msSave" style="width:100%;margin-top:16px;padding:12px;border:none;border-radius:10px;background:rgba(240,147,43,0.12);color:rgba(240,147,43,0.8);font-size:15px;font-weight:600;cursor:pointer;">保存设置</button>' +
            '</div>';
        
        document.body.appendChild(p);
        p.querySelector('#msBack')?.addEventListener('click', () => p.remove());
        p.querySelector('#msSave')?.addEventListener('click', () => {
            const mode = p.querySelector('input[name="msResMode"]:checked')?.value || 'B';
            const visMode = p.querySelector('input[name="msVisMode"]:checked')?.value || 'B';
            const css = p.querySelector('#msCssInput')?.value || '';
            const s = store.getUserSettings();
            s.momentsConfig = { responseMode: mode, visibilityMode: visMode, customCss: css };
            store.saveData('zero_phone_user_settings', s);
            this._toast('设置已保存');
            p.remove();
        });
    }
    
    // ====== 刷新朋友圈页面 ======
    _openRefreshPage() {
        const store = this._store();
        const friends = store?.getAllFriends() || [];
        const ml = window.memoryLibrary;
        if (!ml) { this._toast('系统未就绪'); return; }
        
        ml._zpMenu('刷新朋友圈', '选择刷新方式', [
            { label: '让AI评论/回复我的朋友圈', value: 'comment' },
            { label: '让AI发新的朋友圈', value: 'post' }
        ]).then(async action => {
            if (!action) return;
            
            // 选择哪些AI参与
            const checkFriends = friends.map(f => ({ label: f.nickname || f.name, value: f.code }));
            checkFriends.unshift({ label: '全部好友', value: '_all' });
            
            const selected = await ml._zpMenu('选择好友', action === 'comment' ? '谁来评论你的朋友圈？' : '谁来发朋友圈？', checkFriends);
            if (!selected) return;
            
            const targetCodes = selected === '_all' ? friends.map(f => f.code) : [selected];
            
            if (action === 'post') {
                this._toast('正在让AI发朋友圈...');
                for (const code of targetCodes) {
                    await this._generateAIMoment(code);
                }
                this._toast('刷新完成');
                this.open();
            } else {
                this._toast('正在让AI评论...');
                for (const code of targetCodes) {
                    await this._generateAIComment(code);
                }
                this._toast('刷新完成');
                this.open();
            }
        });
    }
    
    // 简单API调用（用于朋友圈功能）
    async _simpleAICall(systemPrompt, userMessage) {
        try {
            const config = new APIManager().getCurrentConfig();
            if (!config?.apiKey || !config?.endpoint) { console.warn('API未配置'); return null; }
            const url = config.endpoint.replace(/\/$/, '') + '/v1/chat/completions';
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + config.apiKey },
                body: JSON.stringify({ model: config.model || 'gpt-4', messages: [
                    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                    { role: 'user', content: userMessage }
                ], max_tokens: 500, temperature: 0.9 })
            });
            const data = await res.json();
            return data.choices?.[0]?.message?.content?.trim() || null;
        } catch(e) { console.error('API调用失败:', e); return null; }
    }
    
    // 让AI发朋友圈（调API）
    async _generateAIMoment(friendCode) {
        const store = this._store();
        if (!store) return;
        const friend = store.getAllFriends().find(f => f.code === friendCode);
        if (!friend) return;
        const name = friend.nickname || friend.name;
        const persona = friend.persona || '';
        
        try {
            const response = await this._simpleAICall(
                persona.substring(0, 500),
                '你现在可以发一条朋友圈动态。可以发，也可以不发。\n如果要发，请只输出朋友圈内容（纯文字，不需要任何标签或前缀）。\n如果不想发，请只回复"不发"二字。'
            );
            if (!response || response.includes('不发') || response.length < 3) return;
            
            const data = store.getIntimacyData(friendCode);
            if (!data.moments) data.moments = [];
            data.moments.unshift({
                id: 'ai_' + Date.now(), content: response.replace(/\[.*?\]/g, '').trim(),
                images: [], createdAt: new Date().toISOString(), likes: [], favorites: [], comments: []
            });
            store.saveIntimacyData(friendCode, data);
        } catch(e) { console.error('AI发朋友圈失败:', e); }
    }
    
    // 让AI评论我的朋友圈（调API）
    async _generateAIComment(friendCode) {
        const store = this._store();
        if (!store) return;
        const friend = store.getAllFriends().find(f => f.code === friendCode);
        if (!friend) return;
        const settings = store.getUserSettings();
        const myMoments = settings.myMoments || [];
        if (myMoments.length === 0) return;
        
        const latest = myMoments[0];
        const name = friend.nickname || friend.name;
        const persona = friend.persona || '';
        
        try {
            const response = await this._simpleAICall(
                persona.substring(0, 300),
                '你的朋友发了一条朋友圈：\n"' + latest.content + '"\n\n请决定：\n1. 点赞：只回复"点赞"\n2. 评论：回复你想写的评论内容（简短自然）\n3. 忽略：只回复"忽略"\n\n只回复操作内容，不要加解释。'
            );
            
            if (!response || response.includes('忽略')) return;
            
            if (response === '点赞' || response === '点赞。') {
                if (!latest.likes) latest.likes = [];
                if (!latest.likes.find(l => l.name === name)) {
                    latest.likes.push({ name, ts: new Date().toISOString() });
                }
            } else {
                if (!latest.comments) latest.comments = [];
                latest.comments.push({ id: 'c_' + Date.now(), name, content: response.replace(/^评论[：:]\s*/, '').trim(), ts: new Date().toISOString() });
            }
            
            store.saveData('zero_phone_user_settings', settings);
        } catch(e) { console.error('AI评论失败:', e); }
    }
    
    // ====== 详情页 ======
    _openDetail(moment) {
        document.getElementById('momentDetailPage')?.remove();
        const p = document.createElement('div');
        p.id = 'momentDetailPage';
        p.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:8500;background:#1a1a1a;display:flex;flex-direction:column;';
        
        const user = this._getUserInfo();
        const isMine = moment.isSelf || moment.friendCode === '_self';
        const time = moment.createdAt ? new Date(moment.createdAt).toLocaleString('zh-CN') : '';
        const lk = (moment.likes||[]).length, fv = (moment.favorites||[]).length, cm = (moment.comments||[]).length;
        const myLiked = (moment.likes||[]).some(l => l.name === user.name);
        const myFaved = (moment.favorites||[]).some(f => f.name === user.name);
        
        let imagesHtml = '';
        if (moment.images?.length) {
            imagesHtml = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;">';
            moment.images.forEach(img => {
                if (img.startsWith('fake:')) {
                    const desc = img.substring(5);
                    imagesHtml += '<div style="width:calc(33.3% - 4px);aspect-ratio:1;border-radius:8px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;padding:8px;"><div style="font-size:11px;color:rgba(255,255,255,0.3);text-align:center;line-height:1.4;">\ud83d\uddbc '+this._esc(desc)+'</div></div>';
                } else {
                    imagesHtml += '<div style="width:calc(33.3% - 4px);aspect-ratio:1;border-radius:8px;overflow:hidden;background:rgba(255,255,255,0.03);"><img src="'+this._esc(img)+'" style="width:100%;height:100%;object-fit:cover;"></div>';
                }
            });
            imagesHtml += '</div>';
        }
        
        let commentsHtml = '';
        if (cm) {
            (moment.comments||[]).forEach((c, ci) => {
                const rp = c.replyTo ? '<span style="color:rgba(255,255,255,0.15);">\u56de\u590d</span> <span style="color:rgba(240,147,43,0.5);">'+this._esc(c.replyTo)+'</span> ' : '';
                const cTime = c.ts ? new Date(c.ts).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
                const isMyComment = c.name === user.name;
                commentsHtml += '<div class="detail-comment" data-cidx="'+ci+'" style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.02);'+(isMyComment?'cursor:pointer;':'')+'">';
                commentsHtml += '<div style="display:flex;justify-content:space-between;"><span style="font-size:14px;font-weight:600;color:rgba(240,147,43,0.6);">'+this._esc(c.name)+'</span><span style="font-size:11px;color:rgba(255,255,255,0.12);">'+cTime+'</span></div>';
                commentsHtml += '<div style="font-size:14px;color:rgba(255,255,255,0.5);margin-top:4px;line-height:1.6;">'+rp+this._esc(c.content)+'</div>';
                if (isMyComment) commentsHtml += '<div style="font-size:10px;color:rgba(255,255,255,0.08);margin-top:2px;">\u70b9\u51fb\u53ef\u5220\u9664</div>';
                commentsHtml += '</div>';
            });
        } else { commentsHtml = '<div style="text-align:center;padding:20px 0;color:rgba(255,255,255,0.08);font-size:13px;">\u6682\u65e0\u8bc4\u8bba</div>'; }
        
        let likesHtml = lk ? '<div style="padding:8px 0;"><span style="font-size:12px;color:rgba(255,255,255,0.2);">&#9825; '+(moment.likes||[]).map(l=>this._esc(l.name)).join('\u3001')+'</span></div>' : '';
        
        p.innerHTML =
            '<div style="height:60px;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,0,0,0.1);display:flex;align-items:center;padding:0 16px;padding-top:env(safe-area-inset-top);flex-shrink:0;box-shadow:0 2px 10px rgba(0,0,0,0.05);">' +
                '<button id="mdBack" style="width:40px;height:40px;border:none;background:rgba(0,0,0,0.05);border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:rgba(0,0,0,0.6);">&#8592;</button>' +
                '<div style="flex:1;text-align:center;font-size:18px;font-weight:600;color:#000;">\u52a8\u6001\u8be6\u60c5</div>' +
                '<div style="width:40px;"></div>' +
            '</div>' +
            '<div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;min-height:0;">' +
                '<div style="display:flex;gap:12px;align-items:center;margin-bottom:16px;">'+this._avatarHtml(moment.friendAvatar,moment.friendName,44)+'<div><div style="font-size:16px;font-weight:600;color:rgba(240,147,43,0.7);">'+this._esc(moment.friendName)+'</div><div style="font-size:12px;color:rgba(255,255,255,0.2);margin-top:2px;">'+time+'</div></div></div>' +
                '<div style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.8;white-space:pre-wrap;">'+this._esc(moment.content||'')+'</div>'+imagesHtml+
                '<div style="display:flex;gap:16px;margin-top:16px;padding:12px 0;border-top:1px solid rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.04);">' +
                    '<button id="mdLike" style="background:none;border:none;font-size:13px;color:rgba(255,255,255,'+(myLiked?'0.6':'0.2')+');cursor:pointer;padding:4px 0;">'+(myLiked?'&#9829; \u5df2\u70b9\u8d5e':'&#9825; \u70b9\u8d5e')+' '+lk+'</button>' +
                    '<button id="mdFav" style="background:none;border:none;font-size:13px;color:rgba(255,255,255,'+(myFaved?'0.6':'0.2')+');cursor:pointer;padding:4px 0;">'+(myFaved?'&#9733; \u5df2\u6536\u85cf':'&#9734; \u6536\u85cf')+' '+fv+'</button>' +
                    '<span style="font-size:13px;color:rgba(255,255,255,0.2);padding:4px 0;">&#128172; '+cm+'</span>' +
                    (isMine ? '<button id="mdDelete" style="background:none;border:none;font-size:13px;color:rgba(255,100,100,0.4);cursor:pointer;padding:4px 0;margin-left:auto;">\u5220\u9664</button>' : '') +
                '</div>' +
                likesHtml+'<div style="margin-top:8px;"><div style="font-size:13px;color:rgba(255,255,255,0.15);margin-bottom:8px;">\u8bc4\u8bba</div>'+commentsHtml+'</div></div>' +
            '<div id="mdCommentBar" style="padding:10px 16px;border-top:1px solid rgba(255,255,255,0.04);display:flex;gap:8px;align-items:center;flex-shrink:0;flex-wrap:wrap;">' +
                '<div id="mdReplyHint" style="display:none;width:100%;font-size:11px;color:rgba(240,147,43,0.5);padding:2px 0;"></div>' +
                '<input id="mdCommentInput" type="text" placeholder="\u5199\u8bc4\u8bba..." style="flex:1;padding:10px 14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:20px;color:#fff;font-size:14px;outline:none;">' +
                '<button id="mdCommentSend" style="padding:8px 16px;border:none;border-radius:20px;background:rgba(240,147,43,0.15);color:rgba(240,147,43,0.8);font-size:14px;font-weight:600;cursor:pointer;flex-shrink:0;">\u53d1\u9001</button>' +
            '</div>';
        
        document.body.appendChild(p);
        p.querySelector('#mdBack')?.addEventListener('click', () => p.remove());
        p.querySelector('#mdLike')?.addEventListener('click', () => {
            if (!moment.likes) moment.likes = [];
            const idx = moment.likes.findIndex(l => l.name === user.name);
            if (idx >= 0) moment.likes.splice(idx, 1); else moment.likes.push({ name: user.name, ts: new Date().toISOString() });
            this._saveMoment(moment); p.remove(); this._openDetail(moment);
        });
        p.querySelector('#mdFav')?.addEventListener('click', () => {
            if (!moment.favorites) moment.favorites = [];
            const idx = moment.favorites.findIndex(f => f.name === user.name);
            if (idx >= 0) moment.favorites.splice(idx, 1); else moment.favorites.push({ name: user.name, ts: new Date().toISOString() });
            this._saveMoment(moment); p.remove(); this._openDetail(moment);
        });
        p.querySelector('#mdDelete')?.addEventListener('click', async () => {
            const ml = window.memoryLibrary;
            const ok = ml ? await ml._zpConfirm('\u5220\u9664\u670b\u53cb\u5708', '\u786e\u5b9a\u5220\u9664\u8fd9\u6761\u670b\u53cb\u5708\uff1f') : confirm('\u5220\u9664\uff1f');
            if (ok) { this._deleteMoment(moment); p.remove(); this.open(); }
        });
        // Comment reply: click non-own comment to reply
        let replyTo = null;
        p.querySelectorAll('.detail-comment').forEach(el => {
            el.addEventListener('click', async () => {
                const cidx = parseInt(el.dataset.cidx);
                const comment = (moment.comments||[])[cidx];
                if (!comment) return;
                
                // Own comment: delete
                if (comment.name === user.name) {
                    const ml = window.memoryLibrary;
                    const ok = ml ? await ml._zpConfirm('\u5220\u9664\u8bc4\u8bba', '\u5220\u9664\u4f60\u7684\u8bc4\u8bba\uff1f') : confirm('\u5220\u9664\uff1f');
                    if (ok) { moment.comments.splice(cidx, 1); this._saveMoment(moment); p.remove(); this._openDetail(moment); }
                    return;
                }
                
                // Others' comment: reply
                replyTo = comment.name;
                const hint = p.querySelector('#mdReplyHint');
                const inp2 = p.querySelector('#mdCommentInput');
                if (hint) { hint.style.display = 'block'; hint.textContent = '\u56de\u590d ' + comment.name + '\uff08\u70b9\u6b64\u53d6\u6d88\uff09'; hint.onclick = () => { replyTo = null; hint.style.display = 'none'; }; }
                if (inp2) { inp2.placeholder = '\u56de\u590d ' + comment.name + '...'; inp2.focus(); }
            });
        });
        
        // Send comment
        p.querySelector('#mdCommentSend')?.addEventListener('click', () => {
            const inp = p.querySelector('#mdCommentInput');
            const text = inp?.value?.trim();
            if (!text) return;
            if (!moment.comments) moment.comments = [];
            const newComment = { id: 'uc_' + Date.now(), name: user.name, content: text, ts: new Date().toISOString() };
            if (replyTo) newComment.replyTo = replyTo;
            moment.comments.push(newComment);
            this._saveMoment(moment);
            p.remove(); this._openDetail(moment);
        });
        p.querySelector('#mdCommentInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') p.querySelector('#mdCommentSend')?.click();
        });
    }
    
    _relTime(ts) {
        if (!ts) return '';
        const d = Date.now() - new Date(ts).getTime(), m = Math.floor(d/60000);
        if (m<1) return '刚刚'; if (m<60) return m+'分钟前';
        const h = Math.floor(m/60); if (h<24) return h+'小时前';
        const dy = Math.floor(h/24); if (dy<30) return dy+'天前';
        return new Date(ts).toLocaleDateString('zh-CN');
    }
}
document.addEventListener('DOMContentLoaded', () => { setTimeout(() => { window.momentsManager = new MomentsManager(); console.log('✅ MomentsManager 已就绪'); }, 600); });
