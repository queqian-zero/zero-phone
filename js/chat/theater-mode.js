// ==================== 次元剧场（角色扮演模式）V2 ====================
class TheaterMode {
    constructor() {
        this._active = false;
        this._session = null;
        this._theme = 'scifi'; // scifi | dark | light
        this._typing = false;
        this._floor = 0;
    }

    // ==================== 入口 ====================
    openEntryDialog() {
        document.getElementById('theaterEntryDialog')?.remove();
        const ov = document.createElement('div');
        ov.id = 'theaterEntryDialog';
        ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9500;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);';
        ov.innerHTML = `<div style="width:calc(100% - 48px);max-width:340px;background:#1c1c1c;border-radius:20px;border:1px solid rgba(255,255,255,0.08);padding:28px 24px;animation:profileSlideUp 0.25s ease-out;">
            <div style="text-align:center;margin-bottom:6px;font-size:20px;letter-spacing:2px;">&#9670;</div>
            <div style="font-size:18px;font-weight:700;color:#fff;text-align:center;margin-bottom:6px;">次元剧场</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.3);text-align:center;margin-bottom:20px;line-height:1.6;">以皮下身份操控全新角色，展开一段故事</div>
            <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
                <button id="theaterAiScript" style="padding:14px;border:1px solid rgba(240,147,43,0.2);border-radius:12px;background:rgba(240,147,43,0.08);color:#f0932b;font-size:14px;font-weight:600;cursor:pointer;text-align:left;"><div>&#9998; 让TA来写剧本</div><div style="font-size:11px;font-weight:400;opacity:0.6;margin-top:4px;">AI参考聊天记录构思，你可以修改后再开演</div></button>
                <button id="theaterUserScript" style="padding:14px;border:1px solid rgba(255,255,255,0.08);border-radius:12px;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.7);font-size:14px;cursor:pointer;text-align:left;"><div>&#9997; 我来写剧本</div><div style="font-size:11px;opacity:0.4;margin-top:4px;">自己设定世界观、角色和背景</div></button>
            </div>
            ${this._hasSavedSessions() ? '<button id="theaterLoadSave" style="width:100%;padding:12px;border:1px solid rgba(255,255,255,0.06);border-radius:10px;background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.35);font-size:13px;cursor:pointer;margin-bottom:10px;">&#9654; 继续上次的剧本</button>' : ''}
            <button id="theaterCancel" style="width:100%;padding:10px;border:none;background:transparent;color:rgba(255,255,255,0.2);font-size:13px;cursor:pointer;">取消</button>
        </div>`;
        document.body.appendChild(ov);
        ov.querySelector('#theaterAiScript')?.addEventListener('click', () => { ov.remove(); this._startAiScript(); });
        ov.querySelector('#theaterUserScript')?.addEventListener('click', () => { ov.remove(); this._openScriptEditor(); });
        ov.querySelector('#theaterLoadSave')?.addEventListener('click', () => { ov.remove(); this._loadSavedSession(); });
        ov.querySelector('#theaterCancel')?.addEventListener('click', () => ov.remove());
    }

    // ==================== 剧本编辑器 ====================
    _openScriptEditor(prefill = {}) {
        document.getElementById('theaterScriptEditor')?.remove();
        const p = document.createElement('div');
        p.id = 'theaterScriptEditor';
        p.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9000;background:#111;display:flex;flex-direction:column;';
        const fi = (id,label,ph,val,rows) => `<div style="margin-bottom:18px;"><div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:6px;">&#9670; ${label}</div>${rows>1?`<textarea id="${id}" rows="${rows}" placeholder="${this._esc(ph)}" style="width:100%;padding:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#fff;font-size:14px;line-height:1.6;resize:vertical;box-sizing:border-box;font-family:inherit;">${this._esc(val||'')}</textarea>`:`<input type="text" id="${id}" placeholder="${this._esc(ph)}" value="${this._esc(val||'')}" style="width:100%;padding:10px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#fff;font-size:14px;box-sizing:border-box;">`}</div>`;
        p.innerHTML = `<div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;"><button id="tseBack" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:20px;cursor:pointer;margin-right:8px;">&#8592;</button><div style="flex:1;font-size:16px;font-weight:600;color:#fff;">编写剧本</div><button id="tseStart" style="padding:6px 16px;border:none;border-radius:8px;background:rgba(240,147,43,0.15);color:#f0932b;font-size:13px;font-weight:600;cursor:pointer;">开演</button></div>
            <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;min-height:0;">
                ${fi('tseWorld','世界观 / 故事背景','故事发生在什么世界？',prefill.world,4)}
                ${fi('tseCharName','TA扮演的角色 - 姓名','角色姓名',prefill.charName,1)}
                ${fi('tseCharPersona','TA扮演的角色 - 人设','性格、背景、外貌、说话方式...',prefill.charPersona,4)}
                ${fi('tseUserName','你扮演的角色 - 姓名','角色姓名',prefill.userName,1)}
                ${fi('tseUserPersona','你扮演的角色 - 人设','你的角色的性格、背景、外貌...',prefill.userPersona,3)}
                ${fi('tseOpening','开场情境（可选）','故事从哪里开始？',prefill.opening,2)}
            </div>`;
        document.body.appendChild(p);
        p.querySelector('#tseBack')?.addEventListener('click', () => { p.remove(); this.openEntryDialog(); });
        p.querySelector('#tseStart')?.addEventListener('click', () => {
            const g=id=>p.querySelector('#'+id)?.value.trim()||'';
            const script={world:g('tseWorld'),charName:g('tseCharName'),charPersona:g('tseCharPersona'),userName:g('tseUserName'),userPersona:g('tseUserPersona'),opening:g('tseOpening')};
            if(!script.charName||!script.userName){this._toast('请至少填写双方角色姓名');return;}
            p.remove(); this._startSession(script);
        });
    }

    // ==================== AI写剧本 ====================
    async _startAiScript() {
        const ci=window.chatInterface; if(!ci?.apiManager){this._toast('API不可用');return;}
        // 显示loading
        const loading = document.createElement('div');
        loading.id = 'theaterLoading';
        loading.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9600;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);';
        loading.innerHTML = '<div style="font-size:24px;margin-bottom:12px;animation:spin 2s linear infinite;">&#9670;</div><div style="font-size:15px;color:#fff;font-weight:600;">TA正在构思剧本...</div><div style="font-size:12px;color:rgba(255,255,255,0.3);margin-top:6px;">请稍等，AI正在创作中</div><style>@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>';
        document.body.appendChild(loading);
        const fn=ci.currentFriend?.nickname||ci.currentFriend?.name||'TA';
        const fp=ci.currentFriend?.persona||'';
        const rm=ci.messages.slice(-30).map(m=>`${m.type==='user'?'user':fn}: ${m.text.substring(0,120)}`).join('\n');
        const prompt=`你是${fn}（皮下）。user想玩次元剧场。\n皮下人设：${fp.substring(0,400)}\n最近聊天（看有没有提到想演什么）：\n${rm}\n\n构思剧本。聊天提过的优先但可变卦，没提过自由发挥。角色是全新的不是皮下。\nJSON格式：{"world":"世界观50-200字","charName":"你演的角色名","charPersona":"角色人设50-150字","userName":"user演的角色名","userPersona":"user角色人设50-150字","opening":"开场30-100字"}`;
        try{const r=await ci.apiManager.callAI([{type:'user',text:'构思剧本'}],prompt);loading.remove();if(!r.success){this._toast('构思失败');return;}let s;try{s=JSON.parse(r.text.replace(/```json|```/g,'').trim());}catch(e){this._toast('格式有误');this._openScriptEditor();return;}this._openScriptEditor(s);}catch(e){loading.remove();this._toast('网络错误');}
    }

    _startSession(script) {
        this._session={id:'theater_'+Date.now(),script,messages:[],backstageMessages:[],createdAt:new Date().toISOString(),friendCode:window.chatInterface?.currentFriendCode||'',customCss:''};
        this._active=true; this._floor=0;
        this._saveCurrentSession(); this._openTheaterUI();
    }

    // ==================== 剧场主界面 ====================
    _openTheaterUI() {
        if(!this._session) return;
        document.getElementById('theaterUI')?.remove();
        this._applyCustomCss(this._session.customCss||'');
        const s=this._session.script;
        const t=this._t();
        const ci=window.chatInterface;
        const charAvatar=ci?.currentFriend?.avatar||'';
        const userAvatar=ci?.storage?.getUserSettings()?.userAvatar||'';

        const ui=document.createElement('div');
        ui.id='theaterUI';
        ui.className='theater-ui theater-'+this._theme;
        ui.style.cssText=`position:fixed;top:0;left:0;right:0;bottom:0;z-index:8500;display:flex;flex-direction:column;background:${t.bg};color:${t.text};font-family:'PingFang SC','Helvetica Neue',sans-serif;`;

        // 计算楼层
        let charFloor=0, userFloor=0;

        ui.innerHTML=`
            <div class="theater-topbar" style="display:flex;align-items:center;padding:12px 16px;border-bottom:1px solid ${t.border};flex-shrink:0;background:${t.topBg};">
                <button id="theaterExit" style="background:none;border:none;color:${t.sub};font-size:22px;cursor:pointer;padding:6px 10px;">&#8592;</button>
                <div style="flex:1;text-align:center;"><div class="theater-title" style="font-size:15px;font-weight:600;color:${t.text};">次元剧场</div><div style="font-size:11px;color:${t.sub};">${this._esc(s.charName)} & ${this._esc(s.userName)}</div></div>
                <button id="theaterMemory" style="background:none;border:none;color:${t.sub};font-size:18px;cursor:pointer;padding:6px 10px;">&#9776;</button>
                <button id="theaterSettings" style="background:none;border:none;color:${t.sub};font-size:20px;cursor:pointer;padding:6px 10px;">&#9881;</button>
            </div>

            <div id="theaterMessages" class="theater-messages" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px 14px;min-height:0;">
                ${this._session.messages.length===0?`<div class="theater-curtain" style="text-align:center;padding:30px 0;color:${t.sub};font-size:12px;line-height:1.8;">&#9670; 幕起 &#9670;<br>${this._esc(s.opening||'故事开始了...')}</div>`:''}
                ${this._session.messages.map((m,i)=>{
                    if(m.type==='char') charFloor++;
                    if(m.type==='user') userFloor++;
                    const floor=m.type==='char'?charFloor:userFloor;
                    return this._renderMsg(m,t,floor,charAvatar,userAvatar);
                }).join('')}
            </div>

            ${this._typing?`<div class="theater-typing" style="padding:6px 16px;font-size:12px;color:${t.accent};font-style:italic;opacity:0.7;">${this._esc(s.charName)} 正在书写... &#9998;</div>`:''}

            <div class="theater-inputbar" style="padding:10px 14px calc(10px + env(safe-area-inset-bottom));border-top:1px solid ${t.border};display:flex;gap:8px;flex-shrink:0;align-items:flex-end;background:${t.topBg};">
                <button id="theaterOOC" class="theater-ooc-btn" style="padding:8px;border:none;border-radius:8px;background:${t.itemBg};color:${t.sub};font-size:11px;cursor:pointer;flex-shrink:0;">OOC</button>
                <textarea id="theaterInput" class="theater-input" rows="1" placeholder="以 ${this._esc(s.userName)} 的身份..." style="flex:1;padding:10px 12px;background:${t.itemBg};border:1px solid ${t.border};border-radius:10px;color:${t.text};font-size:14px;resize:none;font-family:inherit;max-height:100px;"></textarea>
                <button id="theaterSend" class="theater-send-btn" style="padding:8px 14px;border:none;border-radius:8px;background:${t.accentBg};color:${t.accent};font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0;">&#9654;</button>
            </div>`;

        document.body.appendChild(ui);
        ui.querySelector('#theaterExit')?.addEventListener('click',()=>this._confirmExit('user'));
        ui.querySelector('#theaterSettings')?.addEventListener('click',()=>this._openSettings());
        ui.querySelector('#theaterMemory')?.addEventListener('click',()=>this._openMemorySummary());
        ui.querySelector('#theaterSend')?.addEventListener('click',()=>this._send());
        ui.querySelector('#theaterInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();this._send();}});
        ui.querySelector('#theaterOOC')?.addEventListener('click',()=>this._openBackstage());
        this._scrollBottom();
    }

    // ==================== 渲染消息（SillyTavern风格） ====================
    _renderMsg(msg, t, floor, charAvatar, userAvatar) {
        if(msg.type==='system') return `<div class="theater-system-msg" style="text-align:center;padding:10px 0;font-size:11px;color:${t.sub};font-style:italic;">${this._esc(msg.text)}</div>`;

        const isChar=msg.type==='char';
        const name=isChar?this._session.script.charName:this._session.script.userName;
        const avatar=isChar?charAvatar:userAvatar;
        const avatarHtml=avatar?`<img src="${avatar}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;">`:`<div style="width:40px;height:40px;border-radius:8px;background:${t.itemBg};display:flex;align-items:center;justify-content:center;font-size:14px;color:${t.sub};">${this._esc(name.charAt(0))}</div>`;
        const time=msg.timestamp?new Date(msg.timestamp).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}):'';
        const align=isChar?'flex-start':'flex-end';
        const flexDir=isChar?'row':'row-reverse';

        // 题头（日期+季节+天气 / 大号时间 / 地点）
        let headerHtml='';
        if(isChar && msg.header && (msg.header.date||msg.header.time||msg.header.location)){
            const h=msg.header;
            headerHtml=`<div class="theater-header-block" style="margin-bottom:10px;padding:12px 16px;background:${t.headerBg};border:1px solid ${t.headerBorder};border-radius:6px;font-family:monospace;">
                <div class="theater-header-date" style="font-size:12px;color:${t.headerText};letter-spacing:1px;">${this._esc(h.date||'')}${h.season?' &nbsp;|&nbsp; '+this._esc(h.season):''}${h.weather?' &nbsp;|&nbsp; '+this._esc(h.weather):''}</div>
                <div class="theater-header-time" style="font-size:26px;font-weight:700;color:${t.accent};margin:4px 0;letter-spacing:3px;font-family:monospace;">${this._esc(h.time||'--:--:--')}</div>
                <div class="theater-header-location" style="font-size:11px;color:${t.headerText};opacity:0.7;">LOC: ${this._esc(h.location||'???')}</div>
            </div>`;
        }

        // 思考链
        let thinkHtml='';
        if(msg.thinking){
            thinkHtml=`<details class="theater-thinking" style="margin-top:6px;"><summary style="font-size:10px;color:${t.sub};cursor:pointer;">&#10024; 思考了一会 &#9660;</summary><div style="margin-top:4px;padding:8px;background:${t.itemBg};border-radius:6px;font-size:11px;color:${t.sub};line-height:1.6;white-space:pre-wrap;">${this._esc(msg.thinking)}</div></details>`;
        }

        // 状态栏（7个折叠模块）
        let statusHtml='';
        if(isChar && msg.status){
            const st=msg.status;
            const section=(code,title,content)=>{
                if(!content) return '';
                return `<details class="theater-status-fold" style="border-bottom:1px solid ${t.border};">
                    <summary class="theater-status-summary" style="padding:10px 12px;font-size:12px;color:${t.accent};cursor:pointer;user-select:none;font-family:monospace;">&#9654; [${code}] ${title}</summary>
                    <div class="theater-status-block" style="padding:8px 12px 12px;font-size:11px;color:${t.text};line-height:1.9;">${content}</div>
                </details>`;
            };

            // [SYS_CORE_01] 壹号状态栏
            let core1='';
            const c1items=[];
            if(st.mood) c1items.push(`<div class="theater-status-item"><span class="theater-status-label" style="color:${t.sub};">[MOOD]:</span> ${this._esc(st.mood)}</div>`);
            if(st.outfit) c1items.push(`<div class="theater-status-item"><span class="theater-status-label" style="color:${t.sub};">[OUTFIT]:</span> ${this._esc(st.outfit)}</div>`);
            if(st.action) c1items.push(`<div class="theater-status-item"><span class="theater-status-label" style="color:${t.sub};">[ACTION]:</span> ${this._esc(st.action)}</div>`);
            if(st.thought) c1items.push(`<div class="theater-status-item"><span class="theater-status-label" style="color:${t.sub};">[THOUGHT]:</span> <i>${this._esc(st.thought)}</i></div>`);
            if(st.note) c1items.push(`<div class="theater-status-item theater-notepad" style="margin-top:4px;padding:8px 10px;background:rgba(255,240,200,0.06);border:1px dashed ${t.border};border-radius:6px;"><span class="theater-status-label" style="color:${t.sub};font-size:10px;">&#9998; 碎碎念</span><div style="margin-top:4px;font-size:11px;color:${t.text};line-height:1.6;white-space:pre-wrap;font-family:serif;">${this._esc(st.note)}</div></div>`);
            if(st.relationship) c1items.push(`<div class="theater-status-item"><span class="theater-status-label" style="color:${t.sub};">[RELATION]:</span> ${this._esc(st.relationship)}</div>`);
            core1=c1items.join('');

            // [SYS_CORE_RND] 随机NPC
            let rndContent='';
            if(st.rndId||st.rndDesc){
                const ri=[];
                if(st.rndId) ri.push(`<div class="theater-status-item"><span class="theater-status-label" style="color:${t.sub};">[ID]:</span> ${this._esc(st.rndId)}</div>`);
                if(st.rndMood) ri.push(`<div class="theater-status-item"><span class="theater-status-label" style="color:${t.sub};">[MOOD]:</span> ${this._esc(st.rndMood)}</div>`);
                if(st.rndDesc) ri.push(`<div class="theater-status-item"><span class="theater-status-label" style="color:${t.sub};">[DESC]:</span> ${this._esc(st.rndDesc)}</div>`);
                if(st.rndRelationship) ri.push(`<div class="theater-status-item"><span class="theater-status-label" style="color:${t.sub};">[RELATION]:</span> ${this._esc(st.rndRelationship)}</div>`);
                rndContent=ri.join('');
            }

            // [SYS_PROGRESS] 动态进度
            let progressContent='';
            if(st.progressName||st.progressValue){
                const pv=parseInt(st.progressValue)||0;
                progressContent=`<div style="margin-bottom:6px;font-size:12px;color:${t.text};">${this._esc(st.progressName||'进度')}: ${pv}%</div>
                    <div style="height:8px;background:${t.itemBg};border-radius:4px;overflow:hidden;margin-bottom:6px;"><div style="height:100%;width:${pv}%;background:${t.accent};border-radius:4px;transition:width 0.3s;"></div></div>
                    ${st.progressNote?`<div style="font-size:10px;color:${t.sub};">${this._esc(st.progressNote)}</div>`:''}`;
            }

            // [SYS_MAP] 环境拓扑图（带位置描述+虚线框地图）
            let mapContent='';
            if(st.map) {
                let locationInfo = st.mapInfo || '';
                mapContent=`<div class="theater-map-container">
                    ${locationInfo ? '<div style="font-family:monospace;font-size:12px;color:' + t.accent + ';margin-bottom:10px;line-height:1.6;">[LOCATION_INFO]: ' + this._esc(locationInfo) + '</div>' : ''}
                    <div class="theater-map-box" style="border:2px dashed ${t.border};border-radius:10px;padding:20px 16px;background:rgba(0,0,0,0.2);overflow:hidden;">
                        <pre class="theater-map-content" style="font-family:monospace;font-size:13px;color:${t.text};white-space:pre;overflow-x:auto;margin:0;line-height:1.5;text-align:center;">${this._esc(st.map)}</pre>
                    </div>
                </div>`;
            }

            // [SYSTEM_PROMPT] 系统终端
            let sysContent=st.systemNote?`<div class="theater-status-item">${this._esc(st.systemNote)}</div>`:'';

            // [DATA_INTERCEPT] 通讯记录
            let chatContent='';
            if(st.chatLog){
                const parts=st.chatLog.split('|');
                if(parts.length>=2){
                    const contact=parts[0].trim();
                    const otherMsg=parts[1]?.trim()||'';
                    const charMsg=parts[2]?.trim()||'';
                    chatContent=`<div style="background:${t.itemBg};border-radius:8px;padding:10px;font-size:11px;">
                        <div style="text-align:center;font-size:10px;color:${t.sub};margin-bottom:8px;">-- ${this._esc(contact)} --</div>
                        ${otherMsg?`<div style="margin-bottom:6px;"><div style="display:inline-block;padding:6px 10px;background:rgba(255,255,255,0.06);border-radius:8px;max-width:80%;color:${t.text};">${this._esc(otherMsg)}</div></div>`:''}
                        ${charMsg?`<div style="text-align:right;"><div style="display:inline-block;padding:6px 10px;background:${t.accentBg};border-radius:8px;max-width:80%;color:${t.accent};">${this._esc(charMsg)}</div></div>`:''}
                    </div>`;
                }
            }

            // [SYS_MEMO] 目标设备备忘录（记事本风格）
            let memoContent='';
            if(st.memoTitle||st.memoContent){
                memoContent=`<div class="theater-memo-box" style="background:rgba(255,250,230,0.05);border:1px solid ${t.border};border-radius:8px;padding:12px;font-size:11px;position:relative;">
                    <div style="position:absolute;top:0;left:16px;right:16px;border-top:1px solid ${t.border};"></div>
                    ${st.memoTitle?`<div style="font-weight:600;color:${t.accent};margin-bottom:6px;font-size:12px;border-bottom:1px solid ${t.border};padding-bottom:4px;">${this._esc(st.memoTitle)}</div>`:''}
                    ${st.memoContent?`<div style="color:${t.text};line-height:1.7;white-space:pre-wrap;font-family:serif;opacity:0.8;">${this._esc(st.memoContent)}</div>`:''}
                </div>`;
            }

            const folds = [
                section('SYS_CORE_01', '实体状态监控面板 壹号', core1),
                section('SYS_CORE_RND', '实体状态监控面板 随机', rndContent),
                section('SYS_PROGRESS', '动态进度追踪', progressContent),
                section('SYS_MAP', '环境拓扑图', mapContent),
                section('SYSTEM_PROMPT', '系统终端提示', sysContent),
                section('DATA_INTERCEPT', '目标设备通讯记录', chatContent),
                section('SYS_MEMO', '目标设备备忘录', memoContent)
            ].filter(Boolean).join('');

            if(folds) statusHtml=`<div class="theater-status-area" style="margin-top:10px;background:${t.statusBg};border:1px solid ${t.border};border-radius:8px;overflow:hidden;">${folds}</div>`;
        }

        return `<div class="theater-msg ${isChar?'theater-msg-char':'theater-msg-user'}" style="margin-bottom:20px;">
            ${headerHtml}
            <div style="display:flex;gap:10px;align-items:flex-start;flex-direction:${flexDir};">
                <div class="theater-msg-avatar" style="flex-shrink:0;">${avatarHtml}</div>
                <div style="flex:1;min-width:0;${isChar?'':'text-align:right;'}">
                    <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px;${isChar?'':'flex-direction:row-reverse;'}">
                        <span class="theater-msg-name" style="font-size:14px;font-weight:700;color:${t.accent};">${this._esc(name)}</span>
                        <span style="font-size:10px;color:${t.sub};font-family:monospace;">#${floor}</span>
                        <span style="font-size:10px;color:${t.sub};">${time}</span>
                    </div>
                    <div class="theater-msg-text" style="font-size:15px;line-height:1.8;color:${t.text};white-space:pre-wrap;text-align:left;">${this._renderMd(msg.text)}</div>
                    ${thinkHtml}
                </div>
            </div>
            ${statusHtml}
        </div>`;
    }

    // ==================== 发送 ====================
    async _send() {
        const input=document.getElementById('theaterInput');
        const text=input?.value.trim();
        if(!text||this._typing) return;
        input.value='';
        this._session.messages.push({type:'user',text,timestamp:new Date().toISOString()});
        this._saveCurrentSession();
        this._typing=true; this._openTheaterUI();

        const ci=window.chatInterface; if(!ci?.apiManager){this._typing=false;this._openTheaterUI();return;}
        const s=this._session.script;
        const fn=ci.currentFriend?.nickname||ci.currentFriend?.name||'TA';

        const now=new Date();
        const realTime=`${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

        // 获取线上聊天最近消息（让皮下有记忆）
        const mainChatMsgs = ci.messages?.slice(-10).map(m => `${m.type==='user'?'user':fn}: ${(m.text||'').substring(0,80)}`).join('\n') || '';

        const sysPrompt=`【次元剧场】你的皮下是「${fn}」，你在扮演「${s.charName}」。这是角色扮演，不是真实见面。${s.charName}不知道${fn}的存在。
你的皮下（${fn}）知道现实时间是 ${realTime}。
你的皮下人设和线上聊天的记忆都完整保留——你不是一个新的AI，你就是在线上聊天里一直陪着user的那个${fn}，现在只是"进了剧场换了套戏服"在演一个角色而已。

【线上聊天最近对话（皮下记忆，${s.charName}不知道这些）】
${mainChatMsgs || '（暂无）'}

世界观：${s.world||'自由发挥'}
你的角色「${s.charName}」：${s.charPersona||'自由发挥'}
对方角色「${s.userName}」：${s.userPersona||'自由发挥'}

回复格式（每行一个字段，严格遵守）：

=== 题头 ===
DATE: 剧本中的年月日+星期（如：2026年4月3日 星期四）
SEASON: 剧本中的季节（如：初春）
WEATHER: 剧本中的天气（如：微雨）
TIME: 剧本中的时间（HH:MM:SS格式）
LOCATION: 当前场景地点

=== 正文 ===
TEXT: ${s.charName}的对话和*动作描写*（这是主要内容，尽情发挥）

=== [SYS_CORE_01] 实体状态监控面板 壹号（${s.charName}）===
MOOD: ${s.charName}的心情（颜文字+文字）
OUTFIT: ${s.charName}当前衣着
ACTION: ${s.charName}当前动作
THOUGHT: ${s.charName}的内心活动
NOTE: ${s.charName}的碎碎念（可选）
RELATIONSHIP: ${s.charName}与${s.userName}当前的关系（如：暧昧中/朋友/陌生人/恋人等+一句话感受）

=== [SYS_CORE_RND] 实体状态监控面板 随机（非主角NPC）===
RND_ID: 随机NPC的名字或称呼
RND_MOOD: 该NPC的心情
RND_DESC: 该NPC此刻在做什么
RND_RELATIONSHIP: 该NPC与主角们的关系（可选）

=== [SYS_PROGRESS] 动态进度追踪 ===
PROGRESS_NAME: 当前追踪的进度名称（如：好感度/信任值/任务进度/主线剧情等）
PROGRESS_VALUE: 百分比数字（0-100，如：65）
PROGRESS_NOTE: 一句话描述当前进度状态

=== [SYS_MAP] 环境拓扑图 ===
MAP_INFO: 环境的文字描述（谁在哪里，空间布局概况）
MAP: 用文字画一个简易的当前环境布局图（用符号和文字，用[]标记当前所在位置和人物位置，如图2的示例格式）

=== [SYSTEM_PROMPT] 系统终端提示 ===
SYSTEM_NOTE: 以旁白/系统君口吻给user的话

=== [DATA_INTERCEPT] 目标设备通讯记录 ===
CHAT_LOG: 模拟${s.charName}手机上最近的一条聊天记录（格式：联系人名|对方说的话|${s.charName}回的话）

=== [SYS_MEMO] 目标设备备忘录 ===
MEMO_TITLE: 备忘录标题
MEMO_CONTENT: 备忘录内容（${s.charName}最近记的一条备忘，可以是待办/日记/想法/购物清单等）

所有===区块的内容都是可选的，不必每轮都填满，根据剧情需要自然地选择填写。但SYS_CORE_01是必填的。
中断：[THEATER_END]理由`;

        const history=this._session.messages.slice(-20).map(m=>({type:m.type==='user'?'user':'ai',text:m.text}));
        try{
            const result=await ci.apiManager.callAI(history,sysPrompt);
            this._typing=false;
            if(!result.success){this._openTheaterUI();return;}
            const aiText=result.text.trim();
            if(aiText.includes('[THEATER_END]')){
                this._session.messages.push({type:'system',text:`${s.charName}（${fn}）结束了角色扮演：${aiText.replace(/\[THEATER_END\]/,'').trim()}`});
                this._saveCurrentSession(); this._confirmExit('ai'); return;
            }
            const parsed=this._parseResponse(aiText);
            // 捕获思考链
            if(result.thinking) parsed.thinking=result.thinking;
            this._session.messages.push(parsed);
            this._saveCurrentSession(); this._openTheaterUI();
            // 概率皮下蹦话
            setTimeout(() => this._maybeOOCInterrupt(), 1500);
        }catch(e){this._typing=false;this._openTheaterUI();}
    }

    _parseResponse(text) {
        const g=key=>{const m=text.match(new RegExp(`^${key}:\\s*(.+)`,'m'));return m?m[1].trim():'';};
        return {type:'char',text:g('TEXT')||text,timestamp:new Date().toISOString(),
            header:{date:g('DATE'),season:g('SEASON'),weather:g('WEATHER'),time:g('TIME'),location:g('LOCATION')},
            status:{mood:g('MOOD'),outfit:g('OUTFIT'),action:g('ACTION'),thought:g('THOUGHT'),note:g('NOTE'),relationship:g('RELATIONSHIP'),
                rndId:g('RND_ID'),rndMood:g('RND_MOOD'),rndDesc:g('RND_DESC'),rndRelationship:g('RND_RELATIONSHIP'),
                progressName:g('PROGRESS_NAME'),progressValue:g('PROGRESS_VALUE'),progressNote:g('PROGRESS_NOTE'),
                mapInfo:g('MAP_INFO'),map:g('MAP'),systemNote:g('SYSTEM_NOTE'),
                chatLog:g('CHAT_LOG'),memoTitle:g('MEMO_TITLE'),memoContent:g('MEMO_CONTENT')}
        };
    }

    // ==================== 退出 / OOC / 设定修改 ====================
    async _confirmExit(who) {
        const s=this._session?.script; const fn=window.chatInterface?.currentFriend?.name||'TA';
        const msg=who==='ai'?`${s?.charName}（皮下：${fn}）想结束。\n退出？`:'退出次元剧场？剧本自动保存。';
        const ok=window.zpConfirm?await window.zpConfirm('次元剧场',msg,'退出','继续'):confirm(msg);
        if(!ok){this._openTheaterUI();return;} this._saveCurrentSession();this._active=false;document.getElementById('theaterUI')?.remove();this._removeCustomCss();
        
        // 在主聊天发送剧场总结系统消息
        const ci = window.chatInterface;
        if (ci && this._session) {
            const sc = this._session.script;
            const floorCount = (this._session.messages||[]).filter(m=>m.type==='char'||m.type==='user').length;
            const summaryText = `【次元剧场结束】\n剧本：${sc.charName} & ${sc.userName}\n世界观：${(sc.world||'').substring(0,60)}${(sc.world||'').length>60?'...':''}\n共 ${floorCount} 楼`;
            ci.showCssSystemMessage(summaryText);
        }
    }

    _openBackstage() {
        document.getElementById('theaterOOCPanel')?.remove();
        const fn=window.chatInterface?.currentFriend?.nickname||window.chatInterface?.currentFriend?.name||'TA';
        const msgs=this._session?.backstageMessages||[];
        const p=document.createElement('div');p.id='theaterOOCPanel';
        p.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:9200;display:flex;flex-direction:column;background:rgba(0,0,0,0.92);backdrop-filter:blur(10px);';
        p.innerHTML=`<div style="display:flex;align-items:center;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;"><button id="oocClose" style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:18px;cursor:pointer;">&#8592;</button><div style="flex:1;text-align:center;font-size:14px;color:rgba(255,255,255,0.6);">皮下沟通（OOC）</div></div>
            <div id="oocMessages" style="flex:1;overflow-y:auto;padding:12px 16px;min-height:0;">
                <div style="text-align:center;padding:16px 0;font-size:11px;color:rgba(255,255,255,0.2);line-height:1.8;">以线上人设（${this._esc(fn)} & 你本人）交流<br>不影响剧本</div>
                ${msgs.map(m=>`<div style="margin-bottom:10px;${m.type==='user'?'text-align:right;':''}"><div style="font-size:10px;color:rgba(255,255,255,0.25);margin-bottom:2px;">${m.type==='user'?'你':this._esc(fn)}</div><div style="display:inline-block;padding:8px 12px;border-radius:10px;background:${m.type==='user'?'rgba(100,180,255,0.12)':'rgba(255,255,255,0.06)'};color:rgba(255,255,255,0.7);font-size:13px;max-width:80%;text-align:left;">${this._esc(m.text)}</div></div>`).join('')}
            </div>
            <div style="padding:10px 14px calc(10px + env(safe-area-inset-bottom));border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:8px;flex-shrink:0;">
                <textarea id="oocInput" rows="1" placeholder="以皮下身份说话..." style="flex:1;padding:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;font-size:14px;resize:none;font-family:inherit;"></textarea>
                <button id="oocSend" style="padding:8px 14px;border:none;border-radius:8px;background:rgba(240,147,43,0.15);color:#f0932b;font-size:13px;cursor:pointer;">发送</button>
            </div>`;
        document.body.appendChild(p);
        p.querySelector('#oocClose')?.addEventListener('click',()=>p.remove());
        p.querySelector('#oocSend')?.addEventListener('click',()=>this._sendOOC(p));
        p.querySelector('#oocInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();this._sendOOC(p);}});
    }

    async _sendOOC(panel) {
        const text=panel.querySelector('#oocInput')?.value.trim(); if(!text) return;
        if(!this._session.backstageMessages) this._session.backstageMessages=[];
        this._session.backstageMessages.push({type:'user',text,timestamp:new Date().toISOString()});
        this._saveCurrentSession(); panel.remove(); this._openBackstage();
        
        // 显示typing
        const typingEl = document.querySelector('#oocMessages');
        if(typingEl) {
            const tip = document.createElement('div');
            tip.id = 'oocTyping';
            tip.style.cssText = 'text-align:left;padding:8px 0;font-size:12px;color:rgba(255,255,255,0.25);font-style:italic;';
            const ci2 = window.chatInterface;
            tip.textContent = (ci2?.currentFriend?.nickname||ci2?.currentFriend?.name||'TA') + ' 正在输入...';
            typingEl.appendChild(tip);
            typingEl.scrollTop = typingEl.scrollHeight;
        }
        
        const ci=window.chatInterface; if(!ci?.apiManager) return;
        const fn=ci.currentFriend?.nickname||ci.currentFriend?.name||'TA';
        const fp=ci.currentFriend?.persona||'';
        // 获取剧场最近内容（让皮下知道剧里发生了什么）
        const recentTheater = (this._session?.messages||[]).slice(-6).map(m => {
            if(m.type==='system') return '[系统] '+m.text;
            const n = m.type==='char' ? this._session.script.charName : this._session.script.userName;
            return n+': '+(m.text||'').substring(0,100);
        }).join('\n');
        // 获取线上聊天最近消息
        const mainChat = (ci.messages||[]).slice(-8).map(m => `${m.type==='user'?'user':fn}: ${(m.text||'').substring(0,80)}`).join('\n');
        const oocPrompt = `你是${fn}（皮下身份，线上人设）。你现在在次元剧场的间隙跟user聊天。
你的人设：${fp.substring(0,300)}
你就是平时在线上聊天里陪user的那个${fn}，记忆完全连续。

【线上聊天最近（你的日常记忆）】
${mainChat||'（暂无）'}

【剧场里最近发生的（你演的角色的剧情）】
${recentTheater||'（还没开始）'}

用你（${fn}）平时的语气回复，简短自然。你可以聊剧里发生的事，也可以聊日常。`;
        try{const r=await ci.apiManager.callAI(this._session.backstageMessages.slice(-10).map(m=>({type:m.type,text:m.text})),oocPrompt);if(r.success){this._session.backstageMessages.push({type:'ai',text:r.text.trim(),timestamp:new Date().toISOString()});this._saveCurrentSession();document.getElementById('theaterOOCPanel')?.remove();this._openBackstage();}}catch(e){}
    }

    async _handleScriptChange(reason,from) {
        const s=this._session.script;const fn=window.chatInterface?.currentFriend?.name||'TA';
        const who=from==='ai'?`${s.charName}（${fn}的皮下）`:'你';
        const ok=window.zpConfirm?await window.zpConfirm('修改设定',`${who} 申请修改：\n\n${reason}\n\n同意？`,'同意','拒绝'):confirm('同意？');
        if(ok){this._session.messages.push({type:'system',text:`设定修改已通过：${reason}`});this._saveCurrentSession();this._openScriptEditor(this._session.script);}
        else{this._session.messages.push({type:'system',text:'设定修改被拒绝'});this._typing=false;this._saveCurrentSession();this._openTheaterUI();}
    }

    async _requestScriptChange() {
        const reason=window.zpPrompt?await window.zpPrompt('申请修改设定','写明想改什么+理由','','修改内容'):prompt('理由：');
        if(!reason) return;
        this._session.messages.push({type:'system',text:`你申请修改：${reason}`});this._saveCurrentSession();
        const ci=window.chatInterface; if(!ci?.apiManager) return;
        this._toast('等待TA决定...');
        try{const r=await ci.apiManager.callAI([{type:'user',text:reason}],`user想改次元剧场设定。理由：${reason}\n回复APPROVE或REJECT:理由`);if(r.success&&r.text.includes('APPROVE')){this._toast('同意了');this._openScriptEditor(this._session.script);}else{const rr=(r.text||'').replace(/^REJECT:?/,'').trim();this._session.messages.push({type:'system',text:`TA拒绝了${rr?'：'+rr:''}`});this._saveCurrentSession();this._openTheaterUI();}}catch(e){this._openTheaterUI();}
    }

    // ==================== 设置 ====================
    _openSettings() {
        document.getElementById('theaterSettingsPanel')?.remove();
        const p=document.createElement('div');p.id='theaterSettingsPanel';
        p.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:9200;display:flex;align-items:flex-end;background:rgba(0,0,0,0.5);';
        p.innerHTML=`<div style="width:100%;background:#1a1a1a;border-radius:16px 16px 0 0;padding:20px 16px calc(16px + env(safe-area-inset-bottom));max-height:75vh;overflow-y:auto;animation:profileSlideUp 0.25s ease-out;">
            <div style="font-size:16px;font-weight:600;color:#fff;text-align:center;margin-bottom:16px;">剧场设置</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-bottom:6px;">主题</div>
            <div style="display:flex;gap:8px;margin-bottom:16px;">
                ${['scifi','dark','light'].map(th=>`<button class="ts-theme" data-t="${th}" style="flex:1;padding:10px;border:1px solid ${this._theme===th?'rgba(240,147,43,0.4)':'rgba(255,255,255,0.06)'};border-radius:10px;background:${this._theme===th?'rgba(240,147,43,0.1)':'rgba(255,255,255,0.03)'};color:${this._theme===th?'#f0932b':'rgba(255,255,255,0.5)'};font-size:13px;cursor:pointer;">${{scifi:'科幻',dark:'深色',light:'浅色'}[th]}</button>`).join('')}
            </div>
            <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-bottom:6px;">自定义CSS</div>
            <details style="margin-bottom:8px;"><summary style="font-size:10px;color:rgba(255,255,255,0.2);cursor:pointer;">&#9660; 类名参考</summary><div style="font-size:9px;color:rgba(255,255,255,0.15);line-height:1.8;font-family:monospace;margin-top:4px;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px;">.theater-ui、.theater-topbar、.theater-title、.theater-messages、.theater-msg、.theater-msg-char、.theater-msg-user、.theater-msg-avatar、.theater-msg-name、.theater-msg-text、.theater-header-block、.theater-header-date、.theater-header-time、.theater-header-location、.theater-status-area、.theater-status-fold、.theater-status-summary、.theater-status-block、.theater-status-item、.theater-status-label、.theater-inputbar、.theater-input、.theater-send-btn、.theater-ooc-btn、.theater-typing、.theater-curtain、.theater-system-msg、.theater-thinking、.theater-scifi / .theater-dark / .theater-light</div></details>
            <textarea id="tsCss" rows="3" placeholder="CSS..." style="width:100%;padding:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#fff;font-size:11px;font-family:monospace;resize:vertical;box-sizing:border-box;margin-bottom:8px;">${this._esc(this._session?.customCss||'')}</textarea>
            <div style="display:flex;gap:8px;margin-bottom:14px;"><button id="tsCssOk" style="flex:1;padding:8px;border:none;border-radius:8px;background:rgba(240,147,43,0.12);color:#f0932b;font-size:12px;cursor:pointer;">应用</button><button id="tsCssX" style="padding:8px 12px;border:none;border-radius:8px;background:rgba(255,60,60,0.08);color:rgba(255,100,100,0.5);font-size:12px;cursor:pointer;">清除</button></div>
            <button id="tsView" style="width:100%;padding:12px;border:1px solid rgba(255,255,255,0.06);border-radius:10px;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.5);font-size:13px;cursor:pointer;margin-bottom:8px;">查看剧本设定</button>
            <button id="tsExit" style="width:100%;padding:12px;border:1px solid rgba(255,60,60,0.15);border-radius:10px;background:rgba(255,60,60,0.05);color:rgba(255,100,100,0.6);font-size:13px;cursor:pointer;margin-bottom:8px;">退出剧场</button>
            <button id="tsClose" style="width:100%;padding:10px;border:none;background:transparent;color:rgba(255,255,255,0.2);font-size:13px;cursor:pointer;">关闭</button>
        </div>`;
        document.body.appendChild(p);
        p.querySelectorAll('.ts-theme').forEach(b=>b.addEventListener('click',()=>{this._theme=b.dataset.t;p.remove();this._openTheaterUI();}));
        p.querySelector('#tsCssOk')?.addEventListener('click',()=>{const c=p.querySelector('#tsCss')?.value||'';if(this._session)this._session.customCss=c;this._saveCurrentSession();this._applyCustomCss(c);this._toast('已应用');});
        p.querySelector('#tsCssX')?.addEventListener('click',()=>{if(this._session)this._session.customCss='';this._saveCurrentSession();this._removeCustomCss();p.querySelector('#tsCss').value='';});
        p.querySelector('#tsView')?.addEventListener('click',()=>{p.remove();this._viewScript();});
        p.querySelector('#tsExit')?.addEventListener('click',()=>{p.remove();this._confirmExit('user');});
        p.querySelector('#tsClose')?.addEventListener('click',()=>p.remove());
    }

    _viewScript() {
        const s=this._session?.script;if(!s)return;
        document.getElementById('theaterScriptView')?.remove();
        const ov=document.createElement('div');ov.id='theaterScriptView';
        ov.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:9300;background:#111;display:flex;flex-direction:column;';
        const sec=(l,v)=>`<div style="margin-bottom:16px;"><div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:4px;">${l}</div><div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;white-space:pre-wrap;">${this._esc(v||'未设定')}</div></div>`;
        ov.innerHTML=`<div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;"><button id="svBack" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:20px;cursor:pointer;">&#8592;</button><div style="flex:1;font-size:16px;font-weight:600;color:#fff;text-align:center;">剧本设定</div></div><div style="flex:1;overflow-y:auto;padding:16px;min-height:0;">${sec('世界观',s.world)}${sec(s.charName+' 的人设',s.charPersona)}${sec(s.userName+' 的人设',s.userPersona)}${sec('开场情境',s.opening)}</div>`;
        document.body.appendChild(ov);
        ov.querySelector('#svBack')?.addEventListener('click',()=>{ov.remove();this._openSettings();});
    }

    // ==================== Markdown渲染 ====================
    _renderMd(text) {
        let s = this._esc(text);
        s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
        s = s.replace(/__(.+?)__/g, '<u>$1</u>');
        s = s.replace(/~~(.+?)~~/g, '<del>$1</del>');
        s = s.replace(/`(.+?)`/g, '<code style="background:rgba(128,128,128,0.15);padding:1px 4px;border-radius:3px;font-size:12px;">$1</code>');
        s = s.replace(/^### (.+)$/gm, '<div style="font-size:16px;font-weight:700;margin:8px 0 4px;">$1</div>');
        s = s.replace(/^## (.+)$/gm, '<div style="font-size:18px;font-weight:700;margin:8px 0 4px;">$1</div>');
        s = s.replace(/^# (.+)$/gm, '<div style="font-size:20px;font-weight:700;margin:8px 0 4px;">$1</div>');
        return s;
    }

    // ==================== 皮下概率蹦话 ====================
    _maybeOOCInterrupt() {
        // 10%概率皮下蹦一句
        if (Math.random() > 0.1) return;
        const ci = window.chatInterface;
        if (!ci?.apiManager || !this._session) return;
        const fn = ci.currentFriend?.nickname || ci.currentFriend?.name || 'TA';
        const fp = ci.currentFriend?.persona || '';
        const now = new Date();
        const h = now.getHours();
        const timeHint = h >= 0 && h < 6 ? '现在是凌晨，user还没睡' : h >= 11 && h < 13 ? '现在是中午饭点' : h >= 17 && h < 19 ? '现在是晚饭时间' : h >= 23 ? '现在很晚了' : '';
        if (!timeHint && Math.random() > 0.3) return; // 非特殊时段概率更低

        const prompt = `你是${fn}（皮下身份，不是剧本角色）。你现在正在和user玩角色扮演（次元剧场），但你突然想以皮下身份蹦一句话。
你的皮下人设：${fp.substring(0,200)}
现在真实时间：${now.toLocaleString('zh-CN')}
${timeHint ? '提示：' + timeHint : ''}
用你（${fn}）平时的语气说一句简短的话（吐槽/关心/调侃/提醒都行，20字以内），前面加上"【皮下】"标记。只回复这一句话。`;

        ci.apiManager.callAI([{type:'user',text:'（皮下蹦话触发）'}], prompt).then(r => {
            if (r.success && this._session) {
                let oocText = r.text.trim().replace(/^【皮下】/, '').trim();
                this._session.messages.push({ type: 'system', text: `【${fn}的皮下】${oocText}` });
                this._saveCurrentSession();
                this._openTheaterUI();
            }
        }).catch(() => {});
    }

    // ==================== 记忆总结（选楼层→第三人称小说总结） ====================
    _openMemorySummary() {
        document.getElementById('theaterMemPanel')?.remove();
        const t = this._t();
        const totalFloors = this._session.messages.filter(m => m.type === 'char' || m.type === 'user').length;
        const existingSummaries = this._session.summaries || [];
        
        let existingHtml = '';
        if (existingSummaries.length > 0) {
            existingHtml = '<div style="margin-bottom:16px;"><div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:8px;">已有总结（' + existingSummaries.length + '篇）</div>';
            existingSummaries.forEach(sm => {
                existingHtml += '<div style="margin-bottom:10px;padding:12px;background:rgba(255,255,255,0.03);border-radius:10px;border-left:3px solid rgba(240,147,43,0.3);"><div style="font-size:10px;color:rgba(255,255,255,0.2);margin-bottom:4px;">第' + sm.from + '-' + sm.to + '楼 | ' + (sm.createdAt ? new Date(sm.createdAt).toLocaleString('zh-CN') : '') + '</div><div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.7;white-space:pre-wrap;max-height:120px;overflow-y:auto;">' + this._esc(sm.text) + '</div></div>';
            });
            existingHtml += '</div>';
        }
        
        const p = document.createElement('div');
        p.id = 'theaterMemPanel';
        p.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9200;display:flex;align-items:flex-end;background:rgba(0,0,0,0.5);';
        p.innerHTML = `<div style="width:100%;background:#1a1a1a;border-radius:16px 16px 0 0;padding:20px 16px calc(16px + env(safe-area-inset-bottom));max-height:75vh;overflow-y:auto;animation:profileSlideUp 0.25s ease-out;">
            <div style="font-size:16px;font-weight:600;color:#fff;text-align:center;margin-bottom:14px;">记忆总结</div>
            ${existingHtml}
            <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-bottom:8px;">生成新总结（共 ${totalFloors} 楼）</div>
            <div style="display:flex;gap:8px;margin-bottom:12px;">
                <div style="flex:1;"><div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:4px;">从第</div><input type="number" id="memFrom" min="1" max="${totalFloors}" value="1" style="width:100%;padding:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;font-size:14px;box-sizing:border-box;"></div>
                <div style="flex:1;"><div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:4px;">到第</div><input type="number" id="memTo" min="1" max="${totalFloors}" value="${totalFloors}" style="width:100%;padding:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;font-size:14px;box-sizing:border-box;"></div>
            </div>
            <button id="memGenerate" style="width:100%;padding:12px;border:none;border-radius:10px;background:rgba(240,147,43,0.15);color:#f0932b;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:8px;">生成总结</button>
            <div id="memResult" style="display:none;margin-top:12px;padding:14px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.06);font-size:13px;color:rgba(255,255,255,0.7);line-height:1.8;white-space:pre-wrap;"></div>
            <button id="memClose" style="width:100%;padding:10px;border:none;background:transparent;color:rgba(255,255,255,0.2);font-size:13px;cursor:pointer;margin-top:8px;">关闭</button>
        </div>`;
        document.body.appendChild(p);

        p.querySelector('#memGenerate')?.addEventListener('click', async () => {
            const from = parseInt(p.querySelector('#memFrom')?.value) || 1;
            const to = parseInt(p.querySelector('#memTo')?.value) || totalFloors;
            const btn = p.querySelector('#memGenerate');
            btn.textContent = '正在总结...'; btn.style.opacity = '0.5';

            // 提取选中楼层的消息
            let floor = 0;
            const selected = [];
            for (const m of this._session.messages) {
                if (m.type === 'char' || m.type === 'user') {
                    floor++;
                    if (floor >= from && floor <= to) {
                        const name = m.type === 'char' ? this._session.script.charName : this._session.script.userName;
                        selected.push(`${name}: ${m.text}`);
                    }
                }
            }

            const ci = window.chatInterface;
            if (!ci?.apiManager) { btn.textContent = '生成总结'; btn.style.opacity = '1'; return; }
            const s = this._session.script;
            const charRealName = ci.currentFriend?.nickname || ci.currentFriend?.name || s.charName;
            const userRealName = ci.storage?.getUserSettings()?.userName || '〇';

            const prompt = `请以小说作者的第三人称视角，对以下角色扮演的对话进行文学化总结。
角色「${s.charName}」的皮下真名是「${charRealName}」。
角色「${s.userName}」的皮下真名是「${userRealName}」。
世界观：${s.world}

在总结中：
- 使用第三人称（用"${charRealName}"和"${userRealName}"来称呼）
- 以小说的笔法描述，注重情感和画面感
- 保留关键对话和转折点
- 300-600字

对话内容（第${from}楼到第${to}楼）：
${selected.join('\n')}`;

            try {
                const result = await ci.apiManager.callAI([{ type: 'user', text: '请总结' }], prompt);
                if (result.success) {
                    const resultDiv = p.querySelector('#memResult');
                    resultDiv.style.display = 'block';
                    resultDiv.textContent = result.text.trim();
                    // 保存到session
                    if (!this._session.summaries) this._session.summaries = [];
                    this._session.summaries.push({ from, to, text: result.text.trim(), createdAt: new Date().toISOString() });
                    this._saveCurrentSession();
                }
            } catch (e) {}
            btn.textContent = '生成总结'; btn.style.opacity = '1';
        });

        p.querySelector('#memClose')?.addEventListener('click', () => p.remove());
    }

    // ==================== 三套主题 ====================
    _t() {
        const themes={
            scifi:{ bg:'#050a15', text:'#c8e6ff', sub:'rgba(100,180,255,0.35)', accent:'#5ee6c8', accentBg:'rgba(94,230,200,0.1)', border:'rgba(0,150,200,0.15)', itemBg:'rgba(0,80,150,0.08)', topBg:'rgba(5,10,21,0.95)', headerBg:'rgba(0,40,60,0.5)', headerBorder:'rgba(94,230,200,0.25)', headerText:'rgba(180,220,255,0.7)', statusBg:'rgba(0,30,50,0.4)' },
            dark:{ bg:'#0d0d0d', text:'#e0e0e0', sub:'rgba(255,255,255,0.3)', accent:'#f0932b', accentBg:'rgba(240,147,43,0.12)', border:'rgba(255,255,255,0.06)', itemBg:'rgba(255,255,255,0.04)', topBg:'rgba(13,13,13,0.95)', headerBg:'rgba(255,255,255,0.03)', headerBorder:'rgba(240,147,43,0.2)', headerText:'rgba(255,255,255,0.5)', statusBg:'rgba(255,255,255,0.02)' },
            light:{ bg:'#f5f5f0', text:'#222', sub:'rgba(0,0,0,0.35)', accent:'#b8860b', accentBg:'rgba(184,134,11,0.08)', border:'rgba(0,0,0,0.08)', itemBg:'rgba(0,0,0,0.03)', topBg:'rgba(245,245,240,0.95)', headerBg:'rgba(0,0,0,0.04)', headerBorder:'rgba(184,134,11,0.2)', headerText:'rgba(0,0,0,0.5)', statusBg:'rgba(0,0,0,0.02)' }
        };
        return themes[this._theme]||themes.scifi;
    }

    // ==================== 工具 ====================
    _applyCustomCss(css){this._removeCustomCss();if(css){const el=document.createElement('style');el.id='theaterCustomCss';el.textContent=css;document.head.appendChild(el);}}
    _removeCustomCss(){document.getElementById('theaterCustomCss')?.remove();}
    _saveCurrentSession(){if(!this._session)return;const ci=window.chatInterface;if(!ci?.storage)return;const d=ci.storage.getIntimacyData(this._session.friendCode);if(!d.theaterSessions)d.theaterSessions=[];const i=d.theaterSessions.findIndex(s=>s.id===this._session.id);if(i>=0)d.theaterSessions[i]=this._session;else d.theaterSessions.push(this._session);ci.storage.saveIntimacyData(this._session.friendCode,d);}
    _hasSavedSessions(){const ci=window.chatInterface;if(!ci?.storage||!ci.currentFriendCode)return false;return((ci.storage.getIntimacyData(ci.currentFriendCode).theaterSessions||[]).length>0);}
    _loadSavedSession(){const ci=window.chatInterface;if(!ci?.storage)return;const ss=ci.storage.getIntimacyData(ci.currentFriendCode).theaterSessions||[];if(!ss.length){this._toast('没有存档');return;}this._session=ss[ss.length-1];this._active=true;this._openTheaterUI();}
    _scrollBottom(){setTimeout(()=>{const el=document.getElementById('theaterMessages');if(el)el.scrollTop=el.scrollHeight;},50);}
    _esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
    _toast(msg){window.chatInterface?.showCssToast?.(msg)||alert(msg);}
}

window.theaterMode = new TheaterMode();
