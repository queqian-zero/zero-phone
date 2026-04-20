/* Moments Manager - 朋友圈模块 */
class MomentsManager {
    constructor() { this._page = null; }
    
    _store() { return (window.chatApp || window.chatInterface)?.storage; }
    _esc(s) { const d=document.createElement('div');d.textContent=s||'';return d.innerHTML; }
    _toast(t) { window.chatInterface?.showCssToast?.(t) || alert(t); }
    
    // 获取用户信息
    _getUserInfo() {
        const s = this._store()?.getUserSettings() || {};
        return { name: s.userNickname || s.userName || '我', avatar: s.userAvatar || '', signature: s.signature || '这个人很懒...', bgImage: s.momentsBgImage || '' };
    }
    
    // 获取所有朋友圈数据
    _getAllMoments() {
        const store = this._store();
        if (!store) return [];
        const friends = store.getAllFriends();
        let all = [];
        
        friends.forEach(f => {
            const intim = store.getIntimacyData(f.code);
            const moments = intim.moments || [];
            moments.forEach(m => {
                all.push({
                    ...m,
                    friendCode: f.code,
                    friendName: f.nickname || f.name,
                    friendAvatar: f.avatar || ''
                });
            });
        });
        
        // 也加用户自己发的（存在userSettings里）
        const userSettings = store.getUserSettings();
        const myMoments = userSettings.myMoments || [];
        const user = this._getUserInfo();
        myMoments.forEach(m => {
            all.push({ ...m, friendCode: '_self', friendName: user.name, friendAvatar: user.avatar, isSelf: true });
        });
        
        // 按时间倒序
        all.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
        return all;
    }
    
    // 生成示例数据（首次打开时）
    _ensureDemoData() {
        const store = this._store();
        if (!store) return;
        const friends = store.getAllFriends();
        if (friends.length === 0) return;
        
        // 检查是否已有朋友圈数据
        let hasAny = false;
        friends.forEach(f => {
            const intim = store.getIntimacyData(f.code);
            if (intim.moments && intim.moments.length > 0) hasAny = true;
        });
        if (hasAny) return;
        
        // 给第一个好友生成示例
        const f = friends[0];
        const intim = store.getIntimacyData(f.code);
        const name = f.nickname || f.name;
        intim.moments = [
            {
                id: 'demo_1',
                content: '今天天气真好，适合发呆 ☀️',
                images: [],
                createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
                likes: [{ name: '我', ts: new Date().toISOString() }],
                favorites: [],
                comments: [
                    { id:'c1', name:'我', content:'确实！', ts: new Date(Date.now() - 3600000).toISOString() },
                    { id:'c2', name: name, content:'你也出来走走嘛', ts: new Date(Date.now() - 1800000).toISOString(), replyTo:'我' }
                ]
            },
            {
                id: 'demo_2',
                content: '刚才在整理房间，翻到了一些旧东西…突然有点感慨',
                images: [],
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                likes: [],
                favorites: [],
                comments: []
            }
        ];
        store.saveIntimacyData(f.code, intim);
    }
    
    // ==================== 打开朋友圈 ====================
    open() {
        this._ensureDemoData();
        document.getElementById('momentsPage')?.remove();
        
        const user = this._getUserInfo();
        const moments = this._getAllMoments();
        
        const page = document.createElement('div');
        page.id = 'momentsPage';
        page.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:8000;background:#0a0a0a;display:flex;flex-direction:column;';
        
        // 时间线HTML
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
                // 头像+名字+时间+预览
                timelineHtml += '<div style="display:flex;gap:10px;align-items:flex-start;">';
                timelineHtml += '<div style="flex-shrink:0;">'+avatarHtml+'</div>';
                timelineHtml += '<div style="flex:1;min-width:0;">';
                timelineHtml += '<div style="font-size:14px;font-weight:600;color:rgba(240,147,43,0.7);">'+this._esc(m.friendName)+'</div>';
                timelineHtml += '<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;line-height:1.6;">'+this._esc(preview)+(m.content?.length>60?'...':'')+'</div>';
                // 图片缩略图
                if (m.images && m.images.length > 0) {
                    timelineHtml += '<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap;">';
                    m.images.slice(0,3).forEach(img => {
                        timelineHtml += '<div style="width:60px;height:60px;border-radius:6px;background:rgba(255,255,255,0.05);overflow:hidden;"><img src="'+this._esc(img)+'" style="width:100%;height:100%;object-fit:cover;"></div>';
                    });
                    if (m.images.length > 3) timelineHtml += '<div style="width:60px;height:60px;border-radius:6px;background:rgba(255,255,255,0.03);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);font-size:12px;">+'+( m.images.length-3)+'</div>';
                    timelineHtml += '</div>';
                }
                // 底部：时间 + 互动数
                timelineHtml += '<div style="display:flex;align-items:center;gap:12px;margin-top:8px;font-size:11px;color:rgba(255,255,255,0.2);">';
                timelineHtml += '<span>'+time+'</span>';
                if (likeCount > 0) timelineHtml += '<span>&#9825; '+likeCount+'</span>';
                if (commentCount > 0) timelineHtml += '<span>&#128172; '+commentCount+'</span>';
                if (favCount > 0) timelineHtml += '<span>&#9733; '+favCount+'</span>';
                timelineHtml += '</div>';
                timelineHtml += '</div></div>';
                
                // 展开区域（默认隐藏）
                timelineHtml += '<div class="moment-expand" data-idx="'+i+'" style="display:none;padding:0 16px 12px 66px;">';
                // 操作按钮
                timelineHtml += '<div style="display:flex;gap:16px;margin-bottom:10px;">';
                timelineHtml += '<button class="moment-action-btn moment-fav-btn" data-idx="'+i+'" style="background:none;border:none;color:rgba(255,255,255,0.25);font-size:12px;cursor:pointer;padding:4px 0;">&#9733; 收藏</button>';
                timelineHtml += '<button class="moment-action-btn moment-like-btn" data-idx="'+i+'" style="background:none;border:none;color:rgba(255,255,255,0.25);font-size:12px;cursor:pointer;padding:4px 0;">&#9825; 点赞</button>';
                timelineHtml += '<button class="moment-detail-btn" data-idx="'+i+'" style="background:none;border:none;color:rgba(240,147,43,0.5);font-size:12px;cursor:pointer;padding:4px 0;">查看此条目 &#8250;</button>';
                timelineHtml += '</div>';
                // 评论预览（可滚动）
                const comments = m.comments || [];
                if (comments.length > 0) {
                    timelineHtml += '<div style="max-height:120px;overflow-y:auto;background:rgba(255,255,255,0.02);border-radius:8px;padding:8px 10px;">';
                    comments.forEach(c => {
                        const replyPrefix = c.replyTo ? '<span style="color:rgba(255,255,255,0.2);">回复 '+this._esc(c.replyTo)+'</span> ' : '';
                        timelineHtml += '<div style="font-size:12px;color:rgba(255,255,255,0.4);padding:3px 0;line-height:1.5;"><span style="color:rgba(240,147,43,0.6);font-weight:600;">'+this._esc(c.name)+'</span> '+replyPrefix+this._esc(c.content)+'</div>';
                    });
                    timelineHtml += '</div>';
                } else {
                    timelineHtml += '<div style="font-size:11px;color:rgba(255,255,255,0.1);padding:4px 0;">暂无评论</div>';
                }
                timelineHtml += '</div>';
                
                timelineHtml += '</div>';
            });
        }
        
        page.innerHTML = 
            // Header
            '<div style="display:flex;align-items:center;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;">' +
                '<button id="momentsBack" style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:20px;cursor:pointer;padding:4px 8px;">&#8592;</button>' +
                '<div style="flex:1;text-align:center;font-size:16px;font-weight:600;color:#fff;">朋友圈</div>' +
                '<div style="display:flex;gap:6px;">' +
                    '<button class="moments-header-btn" title="设置" style="background:none;border:none;color:rgba(255,255,255,0.2);font-size:16px;cursor:pointer;padding:4px;">&#9881;</button>' +
                    '<button class="moments-header-btn" title="刷新" style="background:none;border:none;color:rgba(255,255,255,0.2);font-size:16px;cursor:pointer;padding:4px;">&#8635;</button>' +
                    '<button class="moments-header-btn" title="发朋友圈" style="background:none;border:none;color:rgba(255,255,255,0.2);font-size:16px;cursor:pointer;padding:4px;">&#10010;</button>' +
                '</div>' +
            '</div>' +
            // Scrollable content
            '<div id="momentsScroll" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;min-height:0;">' +
                // Profile banner
                '<div style="position:relative;height:160px;background:'+(user.bgImage?'url('+this._esc(user.bgImage)+') center/cover':'linear-gradient(135deg,rgba(30,30,40,1),rgba(15,15,20,1))')+';overflow:hidden;">' +
                    '<div style="position:absolute;bottom:0;left:0;right:0;padding:16px;background:linear-gradient(transparent,rgba(0,0,0,0.6));display:flex;align-items:flex-end;gap:12px;">' +
                        '<div style="width:56px;height:56px;border-radius:12px;border:2px solid rgba(255,255,255,0.1);overflow:hidden;flex-shrink:0;background:rgba(255,255,255,0.05);">' +
                            (user.avatar ? '<img src="'+this._esc(user.avatar)+'" style="width:100%;height:100%;object-fit:cover;">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px;color:rgba(255,255,255,0.3);">&#128100;</div>') +
                        '</div>' +
                        '<div style="flex:1;min-width:0;">' +
                            '<div style="font-size:17px;font-weight:700;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.5);">'+this._esc(user.name)+'</div>' +
                            '<div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+this._esc(user.signature)+'</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                // 朋友圈条目组标签
                '<div style="padding:12px 16px 8px;font-size:11px;color:rgba(255,255,255,0.12);letter-spacing:1px;">朋友圈动态</div>' +
                // Timeline
                '<div id="momentsTimeline">' + timelineHtml + '</div>' +
            '</div>';
        
        document.body.appendChild(page);
        this._page = page;
        this._moments = moments;
        
        // 事件绑定
        page.querySelector('#momentsBack')?.addEventListener('click', () => this.close());
        
        // 右上角占位按钮
        page.querySelectorAll('.moments-header-btn').forEach(btn => {
            btn.addEventListener('click', () => this._toast('功能开发中...'));
        });
        
        // 条目折叠/展开
        page.querySelectorAll('.moment-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.moment-action-btn') || e.target.closest('.moment-detail-btn')) return;
                const idx = item.dataset.idx;
                const expand = page.querySelector(`.moment-expand[data-idx="${idx}"]`);
                if (expand) {
                    const isOpen = expand.style.display !== 'none';
                    // 先关闭所有
                    page.querySelectorAll('.moment-expand').forEach(ex => ex.style.display = 'none');
                    // 如果之前是关的，现在打开
                    if (!isOpen) expand.style.display = 'block';
                }
            });
        });
        
        // 查看详情
        page.querySelectorAll('.moment-detail-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                if (this._moments[idx]) this._openDetail(this._moments[idx]);
            });
        });
        
        // 点赞
        page.querySelectorAll('.moment-like-btn').forEach(btn => {
            btn.addEventListener('click', () => this._toast('点赞功能开发中...'));
        });
        // 收藏
        page.querySelectorAll('.moment-fav-btn').forEach(btn => {
            btn.addEventListener('click', () => this._toast('收藏功能开发中...'));
        });
    }
    
    close() {
        this._page?.remove();
        this._page = null;
    }
    
    // ==================== 详情页 ====================
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
        
        // 图片
        let imagesHtml = '';
        if (moment.images && moment.images.length > 0) {
            imagesHtml = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;">';
            moment.images.forEach(img => {
                imagesHtml += '<div style="width:calc(33.3% - 4px);aspect-ratio:1;border-radius:8px;overflow:hidden;background:rgba(255,255,255,0.03);"><img src="'+this._esc(img)+'" style="width:100%;height:100%;object-fit:cover;"></div>';
            });
            imagesHtml += '</div>';
        }
        
        // 评论列表
        let commentsHtml = '';
        if (commentCount > 0) {
            (moment.comments||[]).forEach(c => {
                const replyPrefix = c.replyTo ? '<span style="color:rgba(255,255,255,0.15);">回复</span> <span style="color:rgba(240,147,43,0.5);">'+this._esc(c.replyTo)+'</span> ' : '';
                const cTime = c.ts ? new Date(c.ts).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
                commentsHtml += '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.02);">';
                commentsHtml += '<div style="display:flex;justify-content:space-between;align-items:center;">';
                commentsHtml += '<span style="font-size:13px;font-weight:600;color:rgba(240,147,43,0.6);">'+this._esc(c.name)+'</span>';
                commentsHtml += '<span style="font-size:10px;color:rgba(255,255,255,0.12);">'+cTime+'</span>';
                commentsHtml += '</div>';
                commentsHtml += '<div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;line-height:1.6;">'+replyPrefix+this._esc(c.content)+'</div>';
                commentsHtml += '</div>';
            });
        } else {
            commentsHtml = '<div style="text-align:center;padding:20px 0;color:rgba(255,255,255,0.08);font-size:12px;">暂无评论</div>';
        }
        
        // 点赞列表
        let likesHtml = '';
        if (likeCount > 0) {
            likesHtml = '<span style="font-size:11px;color:rgba(255,255,255,0.2);">&#9825; '+(moment.likes||[]).map(l=>this._esc(l.name)).join('、')+'</span>';
        }
        
        p.innerHTML = 
            '<div style="display:flex;align-items:center;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;">' +
                '<button id="mdBack" style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:20px;cursor:pointer;padding:4px 8px;">&#8592;</button>' +
                '<div style="flex:1;text-align:center;font-size:15px;font-weight:600;color:#fff;">动态详情</div>' +
                '<div style="width:36px;"></div>' +
            '</div>' +
            '<div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;min-height:0;">' +
                // 发布者信息
                '<div style="display:flex;gap:12px;align-items:center;margin-bottom:16px;">' +
                    avatarHtml +
                    '<div><div style="font-size:15px;font-weight:600;color:rgba(240,147,43,0.7);">'+this._esc(moment.friendName)+'</div>' +
                    '<div style="font-size:11px;color:rgba(255,255,255,0.2);margin-top:2px;">'+time+'</div></div>' +
                '</div>' +
                // 正文
                '<div style="font-size:15px;color:rgba(255,255,255,0.7);line-height:1.8;white-space:pre-wrap;">'+this._esc(moment.content||'')+'</div>' +
                imagesHtml +
                // 互动统计
                '<div style="display:flex;gap:20px;margin-top:16px;padding:12px 0;border-top:1px solid rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.04);">' +
                    '<span style="font-size:12px;color:rgba(255,255,255,0.2);">&#9825; '+likeCount+' 点赞</span>' +
                    '<span style="font-size:12px;color:rgba(255,255,255,0.2);">&#9733; '+favCount+' 收藏</span>' +
                    '<span style="font-size:12px;color:rgba(255,255,255,0.2);">&#128172; '+commentCount+' 评论</span>' +
                '</div>' +
                (likesHtml ? '<div style="padding:8px 0;">'+likesHtml+'</div>' : '') +
                // 评论区
                '<div style="margin-top:8px;">' +
                    '<div style="font-size:12px;color:rgba(255,255,255,0.15);margin-bottom:8px;">评论</div>' +
                    commentsHtml +
                '</div>' +
            '</div>';
        
        document.body.appendChild(p);
        p.querySelector('#mdBack')?.addEventListener('click', () => p.remove());
    }
    
    // 相对时间
    _relTime(ts) {
        if (!ts) return '';
        const diff = Date.now() - new Date(ts).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return '刚刚';
        if (mins < 60) return mins + '分钟前';
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return hrs + '小时前';
        const days = Math.floor(hrs / 24);
        if (days < 30) return days + '天前';
        return new Date(ts).toLocaleDateString('zh-CN');
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.momentsManager = new MomentsManager();
        console.log('✅ MomentsManager 已就绪');
    }, 600);
});
