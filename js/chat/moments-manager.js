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
        const friends = store.getAllFriends();
        let all = [];
        friends.forEach(f => {
            const intim = store.getIntimacyData(f.code);
            (intim.moments||[]).forEach(m => { all.push({...m, friendCode:f.code, friendName:f.nickname||f.name, friendAvatar:f.avatar||''}); });
        });
        const userSettings = store.getUserSettings();
        const user = this._getUserInfo();
        (userSettings.myMoments||[]).forEach(m => { all.push({...m, friendCode:'_self', friendName:user.name, friendAvatar:user.avatar, isSelf:true}); });
        all.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
        return all;
    }
    
    _ensureDemoData() {
        const store = this._store(); if (!store) return;
        const friends = store.getAllFriends(); if (friends.length === 0) return;
        let hasAny = false;
        friends.forEach(f => { const intim = store.getIntimacyData(f.code); if (intim.moments?.length > 0) hasAny = true; });
        if (hasAny) return;
        const f = friends[0]; const intim = store.getIntimacyData(f.code); const name = f.nickname || f.name;
        intim.moments = [
            { id:'demo_1', content:'今天天气真好，适合发呆 ☀️', images:[], createdAt:new Date(Date.now()-3600000*2).toISOString(), likes:[{name:'我',ts:new Date().toISOString()}], favorites:[], comments:[{id:'c1',name:'我',content:'确实！',ts:new Date(Date.now()-3600000).toISOString()},{id:'c2',name:name,content:'你也出来走走嘛',ts:new Date(Date.now()-1800000).toISOString(),replyTo:'我'}] },
            { id:'demo_2', content:'刚才在整理房间，翻到了一些旧东西…突然有点感慨', images:[], createdAt:new Date(Date.now()-86400000).toISOString(), likes:[], favorites:[], comments:[] }
        ];
        store.saveIntimacyData(f.code, intim);
    }
    
    open() {
        this._ensureDemoData();
        document.getElementById('momentsPage')?.remove();
        const user = this._getUserInfo();
        const moments = this._getAllMoments();
        const page = document.createElement('div');
        page.id = 'momentsPage';
        page.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:8000;background:#0a0a0a;display:flex;flex-direction:column;';
        
        let timelineHtml = '';
        if (moments.length === 0) {
            timelineHtml = '<div style="text-align:center;padding:60px 20px;color:rgba(255,255,255,0.12);font-size:14px;">暂无朋友圈动态</div>';
        } else {
            moments.forEach((m, i) => {
                const time = this._relTime(m.createdAt);
                const preview = (m.content||'').substring(0, 60);
                const likeCount = (m.likes||[]).length;
                const commentCount = (m.comments||[]).length;
                const favCount = (m.favorites||[]).length;
                const avatarHtml = m.friendAvatar
                    ? '<img src="'+this._esc(m.friendAvatar)+'" style="width:40px;height:40px;border-radius:8px;object-fit:cover;">'
                    : '<div style="width:40px;height:40px;border-radius:8px;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:16px;">'+this._esc((m.friendName||'?').charAt(0))+'</div>';
                
                timelineHtml += '<div class="moment-item" data-idx="'+i+'" style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.03);cursor:pointer;">';
                timelineHtml += '<div style="display:flex;gap:10px;align-items:flex-start;">';
                timelineHtml += '<div style="flex-shrink:0;">'+avatarHtml+'</div>';
                timelineHtml += '<div style="flex:1;min-width:0;">';
                timelineHtml += '<div style="font-size:15px;font-weight:600;color:rgba(240,147,43,0.7);">'+this._esc(m.friendName)+'</div>';
                timelineHtml += '<div style="font-size:14px;color:rgba(255,255,255,0.5);margin-top:4px;line-height:1.6;">'+this._esc(preview)+(m.content?.length>60?'...':'')+'</div>';
                if (m.images?.length > 0) {
                    timelineHtml += '<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap;">';
                    m.images.slice(0,3).forEach(img => { timelineHtml += '<div style="width:60px;height:60px;border-radius:6px;background:rgba(255,255,255,0.05);overflow:hidden;"><img src="'+this._esc(img)+'" style="width:100%;height:100%;object-fit:cover;"></div>'; });
                    if (m.images.length>3) timelineHtml += '<div style="width:60px;height:60px;border-radius:6px;background:rgba(255,255,255,0.03);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);font-size:12px;">+'+(m.images.length-3)+'</div>';
                    timelineHtml += '</div>';
                }
                timelineHtml += '<div style="display:flex;align-items:center;gap:12px;margin-top:8px;font-size:11px;color:rgba(255,255,255,0.2);">';
                timelineHtml += '<span>'+time+'</span>';
                if (likeCount>0) timelineHtml += '<span>&#9825; '+likeCount+'</span>';
                if (commentCount>0) timelineHtml += '<span>&#128172; '+commentCount+'</span>';
                if (favCount>0) timelineHtml += '<span>&#9733; '+favCount+'</span>';
                timelineHtml += '</div></div></div>';
                
                // 展开区域（带动画）
                timelineHtml += '<div class="moment-expand" data-idx="'+i+'" style="max-height:0;overflow:hidden;transition:max-height 0.3s ease;padding-left:50px;">';
                timelineHtml += '<div style="padding:8px 0 4px;">';
                timelineHtml += '<div style="display:flex;gap:16px;margin-bottom:10px;">';
                timelineHtml += '<button class="moment-fav-btn" data-idx="'+i+'" style="background:none;border:none;color:rgba(255,255,255,0.25);font-size:12px;cursor:pointer;padding:4px 0;">&#9733; 收藏</button>';
                timelineHtml += '<button class="moment-like-btn" data-idx="'+i+'" style="background:none;border:none;color:rgba(255,255,255,0.25);font-size:12px;cursor:pointer;padding:4px 0;">&#9825; 点赞</button>';
                timelineHtml += '<button class="moment-detail-btn" data-idx="'+i+'" style="background:none;border:none;color:rgba(240,147,43,0.5);font-size:12px;cursor:pointer;padding:4px 0;">查看此条目 &#8250;</button>';
                timelineHtml += '</div>';
                const comments = m.comments || [];
                if (comments.length > 0) {
                    timelineHtml += '<div style="max-height:120px;overflow-y:auto;background:rgba(255,255,255,0.02);border-radius:8px;padding:8px 10px;">';
                    comments.forEach(c => {
                        const rp = c.replyTo ? '<span style="color:rgba(255,255,255,0.2);">回复 '+this._esc(c.replyTo)+'</span> ' : '';
                        timelineHtml += '<div style="font-size:12px;color:rgba(255,255,255,0.4);padding:3px 0;line-height:1.5;"><span style="color:rgba(240,147,43,0.6);font-weight:600;">'+this._esc(c.name)+'</span> '+rp+this._esc(c.content)+'</div>';
                    });
                    timelineHtml += '</div>';
                } else { timelineHtml += '<div style="font-size:11px;color:rgba(255,255,255,0.1);padding:4px 0;">暂无评论</div>'; }
                timelineHtml += '</div></div>';
                timelineHtml += '</div>';
            });
        }
        
        page.innerHTML =
            '<div style="display:flex;align-items:center;padding:0 12px;height:48px;background:rgba(18,18,18,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;">' +
                '<button id="momentsBack" style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:18px;cursor:pointer;padding:6px 8px;">&#8592;</button>' +
                '<div style="flex:1;text-align:center;font-size:17px;font-weight:600;color:#fff;">朋友圈</div>' +
                '<div style="display:flex;gap:2px;">' +
                    '<button class="moments-header-btn" title="设置" style="background:none;border:none;color:rgba(255,255,255,0.2);font-size:14px;cursor:pointer;padding:6px;">&#9881;</button>' +
                    '<button class="moments-header-btn" title="刷新" style="background:none;border:none;color:rgba(255,255,255,0.2);font-size:14px;cursor:pointer;padding:6px;">&#8635;</button>' +
                    '<button class="moments-header-btn" title="发朋友圈" style="background:none;border:none;color:rgba(255,255,255,0.2);font-size:14px;cursor:pointer;padding:6px;">&#10010;</button>' +
                '</div>' +
            '</div>' +
            '<div id="momentsScroll" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;min-height:0;">' +
                // 16:9 banner
                '<div style="position:relative;width:100%;padding-top:56.25%;background:'+(user.bgImage?'url('+this._esc(user.bgImage)+') center/cover':'linear-gradient(135deg,rgba(25,25,35,1),rgba(12,12,18,1))')+';overflow:hidden;">' +
                    '<div style="position:absolute;bottom:0;left:0;right:0;padding:14px 16px;background:linear-gradient(transparent,rgba(0,0,0,0.6));display:flex;align-items:flex-end;gap:12px;">' +
                        '<div style="width:52px;height:52px;border-radius:12px;border:2px solid rgba(255,255,255,0.1);overflow:hidden;flex-shrink:0;background:rgba(255,255,255,0.05);">' +
                            (user.avatar?'<img src="'+this._esc(user.avatar)+'" style="width:100%;height:100%;object-fit:cover;">':'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:22px;color:rgba(255,255,255,0.3);">&#128100;</div>') +
                        '</div>' +
                        '<div style="flex:1;min-width:0;">' +
                            '<div style="font-size:16px;font-weight:700;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.5);">'+this._esc(user.name)+'</div>' +
                            '<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+this._esc(user.signature)+'</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div style="padding:12px 16px 6px;font-size:11px;color:rgba(255,255,255,0.12);letter-spacing:1px;">朋友圈动态</div>' +
                '<div id="momentsTimeline">'+timelineHtml+'</div>' +
            '</div>';
        
        document.body.appendChild(page);
        this._page = page; this._moments = moments;
        
        page.querySelector('#momentsBack')?.addEventListener('click', () => this.close());
        page.querySelectorAll('.moments-header-btn').forEach(btn => { btn.addEventListener('click', () => this._toast('功能开发中...')); });
        
        // 折叠/展开（带动画）
        page.querySelectorAll('.moment-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.moment-fav-btn') || e.target.closest('.moment-like-btn') || e.target.closest('.moment-detail-btn')) return;
                const idx = item.dataset.idx;
                const expand = page.querySelector('.moment-expand[data-idx="'+idx+'"]');
                if (!expand) return;
                const isOpen = expand.style.maxHeight !== '0px' && expand.style.maxHeight !== '';
                // 先收起所有
                page.querySelectorAll('.moment-expand').forEach(ex => { ex.style.maxHeight = '0px'; });
                // 如果之前是关的，现在打开
                if (!isOpen) {
                    expand.style.maxHeight = expand.scrollHeight + 'px';
                    // 展开后更新maxHeight以适应内容变化
                    setTimeout(() => { if (expand.style.maxHeight !== '0px') expand.style.maxHeight = expand.scrollHeight + 'px'; }, 350);
                }
            });
        });
        
        page.querySelectorAll('.moment-detail-btn').forEach(btn => {
            btn.addEventListener('click', () => { const idx = parseInt(btn.dataset.idx); if (this._moments[idx]) this._openDetail(this._moments[idx]); });
        });
        page.querySelectorAll('.moment-like-btn').forEach(btn => { btn.addEventListener('click', () => this._toast('点赞功能开发中...')); });
        page.querySelectorAll('.moment-fav-btn').forEach(btn => { btn.addEventListener('click', () => this._toast('收藏功能开发中...')); });
    }
    
    close() { this._page?.remove(); this._page = null; }
    
    _openDetail(moment) {
        document.getElementById('momentDetailPage')?.remove();
        const p = document.createElement('div');
        p.id = 'momentDetailPage';
        p.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:8500;background:#0a0a0a;display:flex;flex-direction:column;';
        
        const time = moment.createdAt ? new Date(moment.createdAt).toLocaleString('zh-CN') : '';
        const likeCount = (moment.likes||[]).length;
        const favCount = (moment.favorites||[]).length;
        const commentCount = (moment.comments||[]).length;
        const avatarHtml = moment.friendAvatar
            ? '<img src="'+this._esc(moment.friendAvatar)+'" style="width:44px;height:44px;border-radius:10px;object-fit:cover;">'
            : '<div style="width:44px;height:44px;border-radius:10px;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:18px;">'+this._esc((moment.friendName||'?').charAt(0))+'</div>';
        
        let imagesHtml = '';
        if (moment.images?.length > 0) {
            imagesHtml = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;">';
            moment.images.forEach(img => { imagesHtml += '<div style="width:calc(33.3% - 4px);aspect-ratio:1;border-radius:8px;overflow:hidden;background:rgba(255,255,255,0.03);"><img src="'+this._esc(img)+'" style="width:100%;height:100%;object-fit:cover;"></div>'; });
            imagesHtml += '</div>';
        }
        
        let commentsHtml = '';
        if (commentCount > 0) {
            (moment.comments||[]).forEach(c => {
                const rp = c.replyTo ? '<span style="color:rgba(255,255,255,0.15);">回复</span> <span style="color:rgba(240,147,43,0.5);">'+this._esc(c.replyTo)+'</span> ' : '';
                const cTime = c.ts ? new Date(c.ts).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
                commentsHtml += '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.02);"><div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:13px;font-weight:600;color:rgba(240,147,43,0.6);">'+this._esc(c.name)+'</span><span style="font-size:10px;color:rgba(255,255,255,0.12);">'+cTime+'</span></div><div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;line-height:1.6;">'+rp+this._esc(c.content)+'</div></div>';
            });
        } else { commentsHtml = '<div style="text-align:center;padding:20px 0;color:rgba(255,255,255,0.08);font-size:12px;">暂无评论</div>'; }
        
        let likesHtml = likeCount > 0 ? '<div style="padding:8px 0;"><span style="font-size:11px;color:rgba(255,255,255,0.2);">&#9825; '+(moment.likes||[]).map(l=>this._esc(l.name)).join('、')+'</span></div>' : '';
        
        p.innerHTML =
            '<div style="display:flex;align-items:center;padding:0 12px;height:48px;background:rgba(18,18,18,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;">' +
                '<button id="mdBack" style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:18px;cursor:pointer;padding:6px 8px;">&#8592;</button>' +
                '<div style="flex:1;text-align:center;font-size:16px;font-weight:600;color:#fff;">动态详情</div>' +
                '<div style="width:36px;"></div>' +
            '</div>' +
            '<div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;min-height:0;">' +
                '<div style="display:flex;gap:12px;align-items:center;margin-bottom:16px;">'+avatarHtml+'<div><div style="font-size:15px;font-weight:600;color:rgba(240,147,43,0.7);">'+this._esc(moment.friendName)+'</div><div style="font-size:11px;color:rgba(255,255,255,0.2);margin-top:2px;">'+time+'</div></div></div>' +
                '<div style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.8;white-space:pre-wrap;">'+this._esc(moment.content||'')+'</div>'+imagesHtml+
                '<div style="display:flex;gap:20px;margin-top:16px;padding:12px 0;border-top:1px solid rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.04);"><span style="font-size:12px;color:rgba(255,255,255,0.2);">&#9825; '+likeCount+' 点赞</span><span style="font-size:12px;color:rgba(255,255,255,0.2);">&#9733; '+favCount+' 收藏</span><span style="font-size:12px;color:rgba(255,255,255,0.2);">&#128172; '+commentCount+' 评论</span></div>'+
                likesHtml+'<div style="margin-top:8px;"><div style="font-size:12px;color:rgba(255,255,255,0.15);margin-bottom:8px;">评论</div>'+commentsHtml+'</div></div>';
        
        document.body.appendChild(p);
        p.querySelector('#mdBack')?.addEventListener('click', () => p.remove());
    }
    
    _relTime(ts) {
        if (!ts) return '';
        const diff = Date.now() - new Date(ts).getTime();
        const mins = Math.floor(diff/60000);
        if (mins<1) return '刚刚'; if (mins<60) return mins+'分钟前';
        const hrs = Math.floor(mins/60); if (hrs<24) return hrs+'小时前';
        const days = Math.floor(hrs/24); if (days<30) return days+'天前';
        return new Date(ts).toLocaleDateString('zh-CN');
    }
}
document.addEventListener('DOMContentLoaded', () => { setTimeout(() => { window.momentsManager = new MomentsManager(); console.log('✅ MomentsManager 已就绪'); }, 600); });
