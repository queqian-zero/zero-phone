/* 字卡区 v5 - 完整重写：多库系统 + 菜单 + 状态 + 贴纸 */
(function() {
    'use strict';

    var S = {
        replies: 'wc_replies', pokes: 'wc_pokes', statuses: 'wc_statuses',
        stickers: 'wc_stickers', cardQuotes: 'p3_card_quotes', dividerQuotes: 'p3_divider_quotes',
        history: 'wc_chat_history', settings: 'wc_settings', wallpaper: 'wc_wallpaper',
        myAvatar: 'wc_my_avatar', partnerAvatar: 'wc_partner_avatar', favorites: 'wc_favorites'
    };

    var DEF_REPLIES = ['今天也是想你的一天','你的名字是我见过最短的情诗','想和你一起浪费时间','你是我所有的不知所措','遇见你 就像找到了我丢失的拼图','我想陪你走过所有的四季','你是例外 也是偏爱','所有的心事都只和你有关','晚安这个词 只有对你说的时候才有意义','我在等你 也在等自己','想见你 在每一个不经意的瞬间','你是我最温柔的心事'];
    var DEF_POKES = ['{me}拍了拍{partner}的肩膀','{me}戳了戳{partner}的脸','{me}向{partner}扔了一个枕头','{me}揉了揉{partner}的头','{me}捏了捏{partner}的脸蛋','{partner}被{me}拍了一下，假装很痛','{me}偷偷戳了{partner}的腰','{partner}被{me}吓了一跳'];
    var DEF_STATUSES = ['在线','忙碌中','正在发呆','想你了','摸鱼中','听歌中','刚睡醒','心情很好','偷偷看你','假装不在'];
    var DEF_CARD_QUOTES = ['跨越次元遇见你','请永远停留在我的掌心','你是我最想留住的幸运','月亮不会奔你而来 但我会','你是迟来的欢喜','所有的温柔都是刚刚好','世界很大 而我刚好遇见你'];
    var DEF_DIVIDER_QUOTES = ['今晚的月色真美','此间的少年 是你','你是我写过最好的故事','所念皆星河 所遇皆温柔','你是我藏在心底的光'];
    var DEF_SETTINGS = { myName: '我', partnerName: '字卡', delayMin: 800, delayMax: 2500, multiReply: true, soundEnabled: true };

    // 六大库定义
    var LIBS = [
        { key: S.replies, name: '回复库', icon: '💬', desc: '对方回复你时抽取', def: DEF_REPLIES, type: 'text' },
        { key: S.pokes, name: '拍一拍库', icon: '👋', desc: '拍一拍时随机动作', def: DEF_POKES, type: 'text' },
        { key: S.statuses, name: '状态库', icon: '🌙', desc: '对方随机在线状态', def: DEF_STATUSES, type: 'text' },
        { key: S.stickers, name: '表情包库', icon: '🎨', desc: '自定义图片表情包', def: [], type: 'image' },
        { key: S.cardQuotes, name: '卡片文案库', icon: '💌', desc: '与桌面第3页共享', def: DEF_CARD_QUOTES, type: 'text' },
        { key: S.dividerQuotes, name: '分割线文案库', icon: '✨', desc: '与桌面第3页共享', def: DEF_DIVIDER_QUOTES, type: 'text' }
    ];

    function load(k,d){try{var s=localStorage.getItem(k);if(s)return JSON.parse(s)}catch(e){}return typeof d==='object'?JSON.parse(JSON.stringify(d)):d}
    function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
    function rand(a){return a.length?a[Math.floor(Math.random()*a.length)]:''}
    function ts(){var d=new Date();return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0')}
    function ds(t){var d=new Date(t);return d.getFullYear()+'/'+(d.getMonth()+1)+'/'+d.getDate()}
    function gs(){return load(S.settings,DEF_SETTINGS)}
    function ss(v){save(S.settings,v)}
    function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

    var overlay=null, chatArea=null, isTyping=false, menuOpen=false;

    // 音效
    var actx=null;
    function snd(type){var s=gs();if(!s.soundEnabled)return;if(!actx)try{actx=new(window.AudioContext||window.webkitAudioContext)}catch(e){return}var o=actx.createOscillator(),g=actx.createGain();o.connect(g);g.connect(actx.destination);g.gain.value=0.08;if(type==='send'){o.type='sine';o.frequency.setValueAtTime(880,actx.currentTime);o.frequency.exponentialRampToValueAtTime(1200,actx.currentTime+0.08);g.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+0.12);o.start(actx.currentTime);o.stop(actx.currentTime+0.12)}else if(type==='receive'){o.type='sine';o.frequency.setValueAtTime(660,actx.currentTime);o.frequency.setValueAtTime(880,actx.currentTime+0.06);g.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+0.15);o.start(actx.currentTime);o.stop(actx.currentTime+0.15)}else if(type==='poke'){o.type='triangle';o.frequency.setValueAtTime(400,actx.currentTime);o.frequency.exponentialRampToValueAtTime(200,actx.currentTime+0.2);g.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+0.25);o.start(actx.currentTime);o.stop(actx.currentTime+0.25)}}

    // 历史
    function lh(){return load(S.history,[])}
    function sh(m){save(S.history,m.slice(-300))}
    function am(role,text,type){var m=lh();var msg={id:Date.now()+'_'+Math.random().toString(36).substr(2,4),role:role,text:text,time:ts(),ts:Date.now(),status:role==='user'?'sent':'',type:type||'text'};m.push(msg);sh(m);return msg}

    function avHTML(role){var k=role==='user'?S.myAvatar:S.partnerAvatar;var src=localStorage.getItem(k);return src?'<img src="'+src+'">':role==='user'?'🐱':'🃏'}

    // ==================== 页面 ====================
    function create(){
        if(document.querySelector('.wordcard-overlay'))return;
        var st=gs();
        var statuses=load(S.statuses,DEF_STATUSES);
        var randomStatus=rand(statuses)||'在线';

        overlay=document.createElement('div');
        overlay.className='wordcard-overlay';
        overlay.innerHTML=
            '<div class="wc-header">'+
                '<button class="wc-back" id="wcBack">‹</button>'+
                '<div class="wc-header-info">'+
                    '<div class="wc-header-name" id="wcHN">'+esc(st.partnerName)+'</div>'+
                    '<div class="wc-header-status" id="wcHS">'+esc(randomStatus)+'</div>'+
                '</div>'+
                '<div class="wc-header-btns">'+
                    '<button class="wc-header-btn" id="wcSettings" title="设置">⚙</button>'+
                '</div>'+
            '</div>'+
            '<div class="wc-chat-area" id="wcCA"></div>'+
            '<div class="wc-input-area">'+
                '<button class="wc-plus-btn" id="wcPlus" title="更多">+</button>'+
                '<textarea class="wc-input" id="wcI" placeholder="说点什么..." rows="1"></textarea>'+
                '<button class="wc-send-btn" id="wcS">↑</button>'+
            '</div>';

        document.body.appendChild(overlay);
        chatArea=overlay.querySelector('#wcCA');

        var wp=localStorage.getItem(S.wallpaper);
        if(wp){chatArea.style.backgroundImage='url('+wp+')';chatArea.classList.add('has-wallpaper')}

        overlay.querySelector('#wcBack').addEventListener('click',close);
        overlay.querySelector('#wcSettings').addEventListener('click',openSettings);
        overlay.querySelector('#wcS').addEventListener('click',sendMsg);
        overlay.querySelector('#wcPlus').addEventListener('click',toggleMenu);

        var inp=overlay.querySelector('#wcI');
        inp.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg()}});
        inp.addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,100)+'px'});
        inp.addEventListener('focus',function(){closeMenu()});

        chatArea.addEventListener('click',function(e){if(!e.target.closest('.wc-context-menu'))ccm()});

        renderHistory();
    }

    // ==================== +号菜单 ====================
    function toggleMenu(){
        if(menuOpen){closeMenu();return}
        var ia=overlay.querySelector('.wc-input-area');
        var m=document.createElement('div');m.className='wc-plus-menu';m.id='wcPM';
        var items=[
            {icon:'🃏',label:'抽卡',fn:function(){closeMenu();quickDraw()}},
            {icon:'👋',label:'拍一拍',fn:function(){closeMenu();doPoke()}},
            {icon:'🖼',label:'图片',fn:function(){closeMenu();pickImage()}},
            {icon:'🎨',label:'表情包',fn:function(){closeMenu();showStickerPicker()}},
            {icon:'📚',label:'管理库',fn:function(){closeMenu();showLibPicker()}},
            {icon:'🗑',label:'清空',fn:function(){closeMenu();clearH()}}
        ];
        items.forEach(function(it){
            var d=document.createElement('div');d.className='wc-plus-item';
            d.innerHTML='<div class="wc-plus-item-icon">'+it.icon+'</div><div class="wc-plus-item-label">'+it.label+'</div>';
            d.addEventListener('click',it.fn);
            m.appendChild(d);
        });
        ia.appendChild(m);
        overlay.querySelector('#wcPlus').classList.add('open');
        menuOpen=true;
    }
    function closeMenu(){var m=document.getElementById('wcPM');if(m)m.remove();menuOpen=false;var b=overlay?overlay.querySelector('#wcPlus'):null;if(b)b.classList.remove('open')}

    // ==================== 渲染 ====================
    function renderHistory(){
        if(!chatArea)return;var msgs=lh();var favs=load(S.favorites,[]);
        if(!msgs.length){chatArea.innerHTML='<div class="wc-empty-state"><div class="wc-empty-icon">🃏</div><div class="wc-empty-text">说点什么吧<br>我会从字卡库里挑一句回复你</div></div>';return}
        chatArea.innerHTML='';var ld='';
        msgs.forEach(function(msg){var d=ds(msg.ts);if(d!==ld){ld=d;var dv=document.createElement('div');dv.className='wc-time-divider';dv.textContent=d;chatArea.appendChild(dv)}
            if(msg.type==='poke'){apk(msg.text,false)}
            else{var iF=favs.indexOf(String(msg.id))>=0;ab(msg,false,iF)}});
        mar();scrollB();
    }

    function ab(msg,anim,isFav){
        var isU=msg.role==='user';var w=document.createElement('div');w.className='wc-msg '+(isU?'wc-msg-right':'wc-msg-left');w.dataset.id=msg.id;if(anim)w.style.animation='wcMsgIn 0.3s ease';
        var av=document.createElement('div');av.className='wc-msg-avatar';av.innerHTML=avHTML(msg.role);
        var col=document.createElement('div');

        if(msg.type==='image'||msg.type==='sticker'){
            var iw=document.createElement('div');iw.className=msg.type==='sticker'?'wc-msg-sticker':'wc-msg-image';
            iw.innerHTML='<img src="'+msg.text+'">';iw.addEventListener('click',function(){pvImg(msg.text)});col.appendChild(iw);
        }else{
            var bb=document.createElement('div');bb.className='wc-msg-bubble'+(isFav?' favorited':'');bb.textContent=msg.text;
            var pt;
            bb.addEventListener('touchstart',function(e){pt=setTimeout(function(){scm(e.touches[0].clientX,e.touches[0].clientY,msg)},500)},{passive:true});
            bb.addEventListener('touchend',function(){clearTimeout(pt)});bb.addEventListener('touchmove',function(){clearTimeout(pt)});
            bb.addEventListener('contextmenu',function(e){e.preventDefault();scm(e.clientX,e.clientY,msg)});
            col.appendChild(bb);
        }

        var meta=document.createElement('div');meta.className='wc-msg-meta';
        var tm='<span class="wc-msg-time">'+(msg.time||'')+'</span>';var se='';
        if(isU){var sc=msg.status==='read'?'read':'';var st2=msg.status==='read'?'已读':(msg.status==='delivered'?'已送达':'已发送');se='<span class="wc-msg-status '+sc+'">'+st2+'</span>'}
        meta.innerHTML=isU?se+tm:tm;col.appendChild(meta);
        w.appendChild(av);w.appendChild(col);chatArea.appendChild(w);
    }

    function scrollB(){if(chatArea)setTimeout(function(){chatArea.scrollTop=chatArea.scrollHeight},50)}
    function mar(){var m=lh();var c=false;m.forEach(function(x){if(x.role==='user'&&x.status!=='read'){x.status='read';c=true}});if(c)sh(m)}

    // ==================== 发消息 ====================
    function sendMsg(){
        if(isTyping)return;var inp=overlay.querySelector('#wcI');var text=inp.value.trim();if(!text)return;
        inp.value='';inp.style.height='auto';closeMenu();
        var empty=chatArea.querySelector('.wc-empty-state');if(empty)empty.remove();
        var msg=am('user',text);ab(msg,true,false);scrollB();snd('send');schedReply();
    }

    function schedReply(){
        var st=gs();var delay=st.delayMin+Math.random()*(st.delayMax-st.delayMin);
        var cnt=1;if(st.multiReply)cnt=Math.random()<0.75?1:(Math.random()<0.8?2:3);
        showTI();isTyping=true;
        setTimeout(function(){uus('delivered')},Math.min(delay*0.4,800));
        rseq(cnt,0,delay);
    }

    function rseq(tot,cur,delay){
        if(cur>=tot){hideTI();isTyping=false;uus('read');return}
        setTimeout(function(){
            hideTI();
            var replies=load(S.replies,DEF_REPLIES);
            if(!replies.length){var msg=am('card','回复库是空的，去管理库添加一些吧');ab(msg,true,false);isTyping=false;scrollB();return}
            var reply=rand(replies);var msg=am('card',reply);ab(msg,true,false);scrollB();snd('receive');
            if(cur+1<tot){setTimeout(function(){showTI()},200);var s=gs();rseq(tot,cur+1,s.delayMin*0.5+Math.random()*s.delayMin)}
            else{isTyping=false;uus('read')}
        },delay);
    }

    function uus(status){
        var m=lh();var c=false;m.forEach(function(x){if(x.role==='user'&&x.status!=='read'){x.status=status;c=true}});
        if(c){sh(m);if(chatArea)chatArea.querySelectorAll('.wc-msg-right .wc-msg-status').forEach(function(el){if(!el.classList.contains('read')){el.textContent=status==='read'?'已读':'已送达';if(status==='read')el.classList.add('read')}})}
    }

    function quickDraw(){
        if(isTyping)return;var empty=chatArea.querySelector('.wc-empty-state');if(empty)empty.remove();
        showTI();isTyping=true;var s=gs();
        setTimeout(function(){hideTI();var r=load(S.replies,DEF_REPLIES);var reply=r.length?rand(r):'回复库是空的';var msg=am('card',reply);ab(msg,true,false);scrollB();isTyping=false;snd('receive')},s.delayMin*0.5+Math.random()*s.delayMin);
    }

    // 输入指示器
    function showTI(){hideTI();var s=gs();var t=document.createElement('div');t.className='wc-typing';t.id='wcTI';t.innerHTML='<div class="wc-msg-avatar">'+avHTML('card')+'</div><div class="wc-typing-bubble"><div class="wc-typing-dot"></div><div class="wc-typing-dot"></div><div class="wc-typing-dot"></div></div>';chatArea.appendChild(t);scrollB();var h=overlay?overlay.querySelector('#wcHS'):null;if(h)h.textContent=s.partnerName+' 正在输入...'}
    function hideTI(){var t=document.getElementById('wcTI');if(t)t.remove();var h=overlay?overlay.querySelector('#wcHS'):null;if(h){var sts=load(S.statuses,DEF_STATUSES);h.textContent=rand(sts)||'在线'}}

    // ==================== 拍一拍 ====================
    function doPoke(){
        if(isTyping)return;var s=gs();var pokes=load(S.pokes,DEF_POKES);
        var tmpl=rand(pokes);if(!tmpl){toast('拍一拍库是空的');return}
        var text=tmpl.replace(/\{me\}/g,s.myName).replace(/\{partner\}/g,s.partnerName);
        var empty=chatArea.querySelector('.wc-empty-state');if(empty)empty.remove();
        am('system',text,'poke');apk(text,true);scrollB();snd('poke');
        if(overlay){overlay.classList.add('wc-shake');setTimeout(function(){overlay.classList.remove('wc-shake')},400)}
        if(Math.random()<0.4){setTimeout(function(){var t2=rand(pokes);if(!t2)return;var txt2=t2.replace(/\{me\}/g,s.partnerName).replace(/\{partner\}/g,s.myName);am('system',txt2,'poke');apk(txt2,true);scrollB();snd('poke');if(overlay){overlay.classList.add('wc-shake');setTimeout(function(){overlay.classList.remove('wc-shake')},400)}},1000+Math.random()*1500)}
    }
    function apk(text,anim){var el=document.createElement('div');el.className='wc-poke-msg';if(!anim)el.style.animation='none';el.innerHTML='<span class="wc-poke-text">'+esc(text)+'</span>';chatArea.appendChild(el)}

    // ==================== 图片 ====================
    function pickImage(){
        var inp=document.createElement('input');inp.type='file';inp.accept='image/*';
        inp.addEventListener('change',function(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){sendImage(ev.target.result)};r.readAsDataURL(f)});inp.click();
    }
    function sendImage(u){var empty=chatArea.querySelector('.wc-empty-state');if(empty)empty.remove();var msg=am('user',u,'image');ab(msg,true,false);scrollB();snd('send');schedReply()}
    function pvImg(src){var p=document.createElement('div');p.className='wc-image-preview';p.innerHTML='<img src="'+src+'">';p.addEventListener('click',function(){p.remove()});document.body.appendChild(p)}

    // ==================== 表情包选择器 ====================
    function showStickerPicker(){
        var stickers=load(S.stickers,[]);if(!stickers.length){toast('表情包库是空的，去管理库添加');return}
        var mo=document.createElement('div');mo.className='wc-manage-overlay';
        var html='<div class="wc-manage-panel"><div class="wc-manage-header"><span class="wc-manage-title">选择表情包</span><button class="wc-manage-close" id="wcSPClose">✕</button></div><div class="wc-manage-body"><div class="wc-sticker-grid" id="wcSPGrid">';
        stickers.forEach(function(s,i){html+='<div class="wc-sticker-item" data-idx="'+i+'"><img src="'+s+'"></div>'});
        html+='</div></div></div>';mo.innerHTML=html;
        document.body.appendChild(mo);requestAnimationFrame(function(){mo.classList.add('active')});
        var cls=function(){mo.classList.remove('active');setTimeout(function(){mo.remove()},200)};
        mo.querySelector('#wcSPClose').addEventListener('click',cls);
        mo.addEventListener('click',function(e){if(e.target===mo)cls()});
        mo.querySelectorAll('.wc-sticker-item').forEach(function(item){
            item.addEventListener('click',function(){var idx=parseInt(this.dataset.idx);var stk=stickers[idx];if(stk){cls();sendSticker(stk)}})});
    }
    function sendSticker(u){var empty=chatArea.querySelector('.wc-empty-state');if(empty)empty.remove();var msg=am('user',u,'sticker');ab(msg,true,false);scrollB();snd('send');schedReply()}

    // ==================== 库选择器 ====================
    function showLibPicker(){
        var mo=mkOverlay();
        var html='<div class="wc-manage-panel"><div class="wc-manage-header"><span class="wc-manage-title">管理库</span><button class="wc-manage-close" id="wcLPClose">✕</button></div><div class="wc-manage-body"><div class="wc-lib-picker">';
        LIBS.forEach(function(lib,i){
            var cnt=load(lib.key,lib.def).length;
            html+='<button class="wc-lib-item" data-idx="'+i+'"><span class="wc-lib-icon">'+lib.icon+'</span><div class="wc-lib-info"><div class="wc-lib-name">'+lib.name+'</div><div class="wc-lib-desc">'+lib.desc+' · '+cnt+'条</div></div><span class="wc-lib-arrow">›</span></button>';
        });
        html+='</div></div></div>';mo.innerHTML=html;
        document.body.appendChild(mo);requestAnimationFrame(function(){mo.classList.add('active')});
        var cls=function(){mo.classList.remove('active');setTimeout(function(){mo.remove()},200)};
        mo.querySelector('#wcLPClose').addEventListener('click',cls);
        mo.addEventListener('click',function(e){if(e.target===mo)cls()});
        mo.querySelectorAll('.wc-lib-item').forEach(function(btn){btn.addEventListener('click',function(){var idx=parseInt(this.dataset.idx);cls();openLibEditor(LIBS[idx])})});
    }

    function openLibEditor(lib){
        var mo=mkOverlay();
        if(lib.type==='image'){
            mo.innerHTML='<div class="wc-manage-panel"><div class="wc-manage-header"><span class="wc-manage-title">'+lib.icon+' '+lib.name+'</span><button class="wc-manage-close" id="wcLEClose">✕</button></div><div class="wc-manage-body"><div class="wc-manage-count" id="wcLECnt"></div><div class="wc-sticker-grid" id="wcLEGrid"></div></div></div>';
            document.body.appendChild(mo);requestAnimationFrame(function(){mo.classList.add('active')});
            var cls=function(){mo.classList.remove('active');setTimeout(function(){mo.remove()},200)};
            mo.querySelector('#wcLEClose').addEventListener('click',cls);mo.addEventListener('click',function(e){if(e.target===mo)cls()});
            renderStickerGrid(mo,lib);
        }else{
            mo.innerHTML='<div class="wc-manage-panel"><div class="wc-manage-header"><span class="wc-manage-title">'+lib.icon+' '+lib.name+'</span><button class="wc-manage-close" id="wcLEClose">✕</button></div><div class="wc-manage-body"><div class="wc-manage-count" id="wcLECnt"></div><div class="wc-manage-list" id="wcLEList"></div><div class="wc-manage-add-row"><input type="text" class="wc-manage-input" id="wcLEInp" placeholder="输入新内容"><button class="wc-manage-add-btn" id="wcLEAdd">添加</button></div></div></div>';
            document.body.appendChild(mo);requestAnimationFrame(function(){mo.classList.add('active')});
            var cls=function(){mo.classList.remove('active');setTimeout(function(){mo.remove()},200)};
            mo.querySelector('#wcLEClose').addEventListener('click',cls);mo.addEventListener('click',function(e){if(e.target===mo)cls()});
            renderTextList(mo,lib);
            mo.querySelector('#wcLEAdd').addEventListener('click',function(){var inp=mo.querySelector('#wcLEInp');if(inp.value.trim()){var a=load(lib.key,lib.def);a.push(inp.value.trim());save(lib.key,a);inp.value='';renderTextList(mo,lib);toast('已添加')}});
        }
    }

    function renderTextList(mo,lib){
        var a=load(lib.key,lib.def);mo.querySelector('#wcLECnt').textContent='共 '+a.length+' 条';
        var list=mo.querySelector('#wcLEList');list.innerHTML='';
        a.forEach(function(q,i){var it=document.createElement('div');it.className='wc-manage-item';it.innerHTML='<span class="wc-manage-item-text">'+esc(q)+'</span><button class="wc-manage-item-del">✕</button>';
            it.querySelector('.wc-manage-item-del').addEventListener('click',function(){a.splice(i,1);save(lib.key,a);renderTextList(mo,lib);toast('已删除')});list.appendChild(it)});
    }

    function renderStickerGrid(mo,lib){
        var a=load(lib.key,lib.def);mo.querySelector('#wcLECnt').textContent='共 '+a.length+' 张';
        var grid=mo.querySelector('#wcLEGrid');grid.innerHTML='';
        a.forEach(function(s,i){
            var it=document.createElement('div');it.className='wc-sticker-item';
            it.innerHTML='<img src="'+s+'"><button class="wc-sticker-item-del">✕</button>';
            it.querySelector('.wc-sticker-item-del').addEventListener('click',function(e){e.stopPropagation();a.splice(i,1);save(lib.key,a);renderStickerGrid(mo,lib);toast('已删除')});
            grid.appendChild(it);
        });
        var upBtn=document.createElement('div');upBtn.className='wc-sticker-upload';upBtn.textContent='+';
        upBtn.addEventListener('click',function(){upImg(function(u){a.push(u);save(lib.key,a);renderStickerGrid(mo,lib);toast('已添加')})});
        grid.appendChild(upBtn);
    }

    // ==================== 长按菜单 ====================
    function scm(x,y,msg){ccm();var favs=load(S.favorites,[]);var iF=favs.indexOf(String(msg.id))>=0;var m=document.createElement('div');m.className='wc-context-menu';
        [{icon:'📋',label:'复制',act:'copy'},{icon:iF?'💔':'❤️',label:iF?'取消收藏':'收藏',act:'fav'},{icon:'🗑',label:'删除',act:'del',d:true}].forEach(function(it){
            var b=document.createElement('button');b.className='wc-context-item'+(it.d?' danger':'');b.innerHTML='<span class="wc-context-item-icon">'+it.icon+'</span>'+it.label;
            b.addEventListener('click',function(){ccm();hca(it.act,msg)});m.appendChild(b)});
        m.style.left=Math.min(x,window.innerWidth-160)+'px';m.style.top=Math.min(y,window.innerHeight-160)+'px';
        document.body.appendChild(m);setTimeout(function(){document.addEventListener('click',ccmO)},10)}
    function ccmO(e){if(!e.target.closest('.wc-context-menu')){ccm();document.removeEventListener('click',ccmO)}}
    function ccm(){var m=document.querySelector('.wc-context-menu');if(m)m.remove()}
    function hca(act,msg){
        if(act==='copy'){navigator.clipboard.writeText(msg.text).catch(function(){var t=document.createElement('textarea');t.value=msg.text;t.style.cssText='position:fixed;opacity:0';document.body.appendChild(t);t.select();document.execCommand('copy');document.body.removeChild(t)});toast('已复制')}
        else if(act==='fav'){var f=load(S.favorites,[]);var i=f.indexOf(String(msg.id));if(i>=0){f.splice(i,1);toast('已取消收藏')}else{f.push(String(msg.id));toast('已收藏')}save(S.favorites,f);renderHistory()}
        else if(act==='del'){var m=lh();var i=m.findIndex(function(x){return String(x.id)===String(msg.id)});if(i>=0){m.splice(i,1);sh(m);renderHistory();toast('已删除')}}
    }

    // ==================== 设置 ====================
    function openSettings(){
        var existing=document.querySelector('.wc-manage-overlay');if(existing)existing.remove();
        var st=gs();var myAv=localStorage.getItem(S.myAvatar);var pAv=localStorage.getItem(S.partnerAvatar);
        var mo=mkOverlay();
        mo.innerHTML='<div class="wc-manage-panel"><div class="wc-manage-header"><span class="wc-manage-title">设置</span><button class="wc-manage-close" id="wcSC">✕</button></div><div class="wc-manage-body">'+
            '<div class="wc-settings-section"><div class="wc-settings-label">头像</div><div class="wc-avatar-edit"><div class="wc-avatar-edit-item" id="wcEMA"><div class="wc-avatar-edit-preview" id="wcMAP">'+(myAv?'<img src="'+myAv+'">':'🐱')+'</div><span class="wc-avatar-edit-label">我</span></div><div class="wc-avatar-edit-item" id="wcEPA"><div class="wc-avatar-edit-preview" id="wcPAP">'+(pAv?'<img src="'+pAv+'">':'🃏')+'</div><span class="wc-avatar-edit-label">字卡</span></div></div></div>'+
            '<div class="wc-settings-section"><div class="wc-settings-label">昵称</div><div class="wc-name-row"><input class="wc-name-input" id="wcMN" placeholder="我的昵称" value="'+esc(st.myName)+'"><input class="wc-name-input" id="wcPN" placeholder="字卡昵称" value="'+esc(st.partnerName)+'"></div></div>'+
            '<div class="wc-settings-section"><div class="wc-settings-label">回复延迟</div><div class="wc-settings-row"><span class="wc-settings-row-label">最短</span><span class="wc-settings-row-value" id="wcDMV">'+(st.delayMin/1000).toFixed(1)+'s</span></div><input type="range" class="wc-range" id="wcDM" min="200" max="5000" step="100" value="'+st.delayMin+'"><div class="wc-settings-row"><span class="wc-settings-row-label">最长</span><span class="wc-settings-row-value" id="wcDXV">'+(st.delayMax/1000).toFixed(1)+'s</span></div><input type="range" class="wc-range" id="wcDX" min="500" max="10000" step="100" value="'+st.delayMax+'"></div>'+
            '<div class="wc-settings-section"><div class="wc-settings-label">音效</div><div class="wc-sound-toggle"><span class="wc-settings-row-label">提示音</span><button class="wc-switch'+(st.soundEnabled?' on':'')+'" id="wcST"></button></div></div>'+
            '<div class="wc-settings-section"><div class="wc-settings-label">聊天壁纸</div><div class="wc-wallpaper-row"><button class="wc-wallpaper-btn" id="wcWU">上传壁纸</button><button class="wc-wallpaper-btn danger" id="wcWC">清除</button></div></div>'+
            '<button class="wc-manage-clear-btn" id="wcCH">清空聊天记录</button></div></div>';
        document.body.appendChild(mo);requestAnimationFrame(function(){mo.classList.add('active')});

        function cls(){var s=gs();s.myName=mo.querySelector('#wcMN').value.trim()||'我';s.partnerName=mo.querySelector('#wcPN').value.trim()||'字卡';s.delayMin=parseInt(mo.querySelector('#wcDM').value);s.delayMax=parseInt(mo.querySelector('#wcDX').value);if(s.delayMax<s.delayMin)s.delayMax=s.delayMin+500;ss(s);var h=overlay?overlay.querySelector('#wcHN'):null;if(h)h.textContent=s.partnerName;mo.classList.remove('active');setTimeout(function(){mo.remove()},200)}
        mo.querySelector('#wcSC').addEventListener('click',cls);mo.addEventListener('click',function(e){if(e.target===mo)cls()});
        mo.querySelector('#wcDM').addEventListener('input',function(){mo.querySelector('#wcDMV').textContent=(this.value/1000).toFixed(1)+'s'});
        mo.querySelector('#wcDX').addEventListener('input',function(){mo.querySelector('#wcDXV').textContent=(this.value/1000).toFixed(1)+'s'});
        mo.querySelector('#wcST').addEventListener('click',function(){this.classList.toggle('on');var s=gs();s.soundEnabled=this.classList.contains('on');ss(s)});
        mo.querySelector('#wcEMA').addEventListener('click',function(){upImg(function(u){localStorage.setItem(S.myAvatar,u);mo.querySelector('#wcMAP').innerHTML='<img src="'+u+'">';renderHistory();toast('头像已更新')})});
        mo.querySelector('#wcEPA').addEventListener('click',function(){upImg(function(u){localStorage.setItem(S.partnerAvatar,u);mo.querySelector('#wcPAP').innerHTML='<img src="'+u+'">';renderHistory();toast('头像已更新')})});
        mo.querySelector('#wcWU').addEventListener('click',function(){upImg(function(u){localStorage.setItem(S.wallpaper,u);if(chatArea){chatArea.style.backgroundImage='url('+u+')';chatArea.classList.add('has-wallpaper')}toast('壁纸已更新')})});
        mo.querySelector('#wcWC').addEventListener('click',function(){localStorage.removeItem(S.wallpaper);if(chatArea){chatArea.style.backgroundImage='';chatArea.classList.remove('has-wallpaper')}toast('壁纸已清除')});
        mo.querySelector('#wcCH').addEventListener('click',function(){if(confirm('确定清空所有聊天记录吗？')){localStorage.removeItem(S.history);renderHistory();cls();toast('已清空')}});
    }

    // ==================== 工具 ====================
    function mkOverlay(){var o=document.createElement('div');o.className='wc-manage-overlay';return o}
    function upImg(cb){var i=document.createElement('input');i.type='file';i.accept='image/*';i.addEventListener('change',function(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){cb(ev.target.result)};r.readAsDataURL(f)});i.click()}
    function clearH(){if(confirm('确定清空？')){localStorage.removeItem(S.history);renderHistory();toast('已清空')}}
    function toast(m){var t=document.createElement('div');t.style.cssText='position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:white;padding:8px 20px;border-radius:20px;font-size:12px;z-index:999999;transition:opacity 0.3s';t.textContent=m;document.body.appendChild(t);setTimeout(function(){t.style.opacity='0';setTimeout(function(){t.remove()},300)},1200)}

    function open(){create();requestAnimationFrame(function(){overlay.classList.add('active');scrollB()})}
    function close(){closeMenu();if(overlay){overlay.classList.remove('active');setTimeout(function(){if(overlay){overlay.remove();overlay=null;chatArea=null}},300)}}

    window.wordCardZone={open:open,close:close};
})();
