// ==================== 次元剧场（角色扮演模式） ====================
class TheaterMode {
    constructor() {
        this._active = false;
        this._session = null;
        this._theme = 'dark';
        this._typing = false;
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
                <button id="theaterAiScript" style="padding:14px;border:1px solid rgba(240,147,43,0.2);border-radius:12px;background:rgba(240,147,43,0.08);color:#f0932b;font-size:14px;font-weight:600;cursor:pointer;text-align:left;">
                    <div>&#9998; 让TA来写剧本</div>
                    <div style="font-size:11px;font-weight:400;opacity:0.6;margin-top:4px;">AI参考聊天记录构思，你可以修改后再开演</div>
                </button>
                <button id="theaterUserScript" style="padding:14px;border:1px solid rgba(255,255,255,0.08);border-radius:12px;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.7);font-size:14px;cursor:pointer;text-align:left;">
                    <div>&#9997; 我来写剧本</div>
                    <div style="font-size:11px;opacity:0.4;margin-top:4px;">自己设定世界观、角色和背景</div>
                </button>
            </div>
            ${this._hasSavedSessions() ? '<button id="theaterLoadSave" style="width:100%;padding:12px;border:1px solid rgba(255,255,255,0.06);border-radius:10px;background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.35);font-size:13px;cursor:pointer;margin-bottom:10px;">&#9654; 继续上次的剧本</button>' : ''}
            <button id="theaterCancel" style="width:100%;padding:10px;border:none;border-radius:10px;background:transparent;color:rgba(255,255,255,0.2);font-size:13px;cursor:pointer;">取消</button>
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
        const fi = (id, label, ph, val, rows) => `<div style="margin-bottom:18px;">
            <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:6px;">&#9670; ${label}</div>
            ${rows > 1 ? `<textarea id="${id}" rows="${rows}" placeholder="${this._esc(ph)}" style="width:100%;padding:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#fff;font-size:14px;line-height:1.6;resize:vertical;box-sizing:border-box;font-family:inherit;">${this._esc(val||'')}</textarea>` :
            `<input type="text" id="${id}" placeholder="${this._esc(ph)}" value="${this._esc(val||'')}" style="width:100%;padding:10px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#fff;font-size:14px;box-sizing:border-box;">`}</div>`;
        p.innerHTML = `<div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;">
                <button id="tseBack" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:20px;cursor:pointer;margin-right:8px;">&#8592;</button>
                <div style="flex:1;font-size:16px;font-weight:600;color:#fff;">编写剧本</div>
                <button id="tseStart" style="padding:6px 16px;border:none;border-radius:8px;background:rgba(240,147,43,0.15);color:#f0932b;font-size:13px;font-weight:600;cursor:pointer;">开演</button>
            </div>
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
            const g = id => p.querySelector('#'+id)?.value.trim()||'';
            const script = { world:g('tseWorld'), charName:g('tseCharName'), charPersona:g('tseCharPersona'), userName:g('tseUserName'), userPersona:g('tseUserPersona'), opening:g('tseOpening') };
            if (!script.charName||!script.userName) { this._toast('请至少填写双方角色姓名'); return; }
            p.remove(); this._startSession(script);
        });
    }

    // ==================== AI写剧本（参考聊天记录） ====================
    async _startAiScript() {
        const ci = window.chatInterface;
        if (!ci?.apiManager) { this._toast('API不可用'); return; }
        this._toast('TA正在构思剧本...');
        const friendName = ci.currentFriend?.nickname || ci.currentFriend?.name || 'TA';
        const friendPersona = ci.currentFriend?.persona || '';
        const recentMsgs = ci.messages.slice(-30).map(m => `${m.type==='user'?'user':friendName}: ${m.text.substring(0,120)}`).join('\n');
        const prompt = `你是${friendName}（皮下身份）。user想和你玩"次元剧场"（角色扮演）。
你的皮下人设：${friendPersona.substring(0,400)}

最近聊天（重点看有没有提到想演什么类型/角色/剧情）：
${recentMsgs}

请构思剧本。规则：
1. 如果聊天里提到过想演某种剧情/角色，优先往那个方向构思（但你也可以临时变卦选别的，就像去剧本杀之前说好了Q剧本，到了之后变卦想玩E剧本也行）
2. 如果聊天里没提过，自由发挥，选个你觉得好玩的
3. 剧本角色是全新的，不是皮下身份

用JSON格式输出（不要其他内容）：
{"world":"世界观50-200字","charName":"你演的角色名","charPersona":"角色人设50-150字","userName":"user演的角色名","userPersona":"user角色人设50-150字","opening":"开场情境30-100字"}`;
        try {
            const result = await ci.apiManager.callAI([{type:'user',text:'请构思一个角色扮演剧本'}], prompt);
            if (!result.success) { this._toast('构思失败'); return; }
            let script;
            try { script = JSON.parse(result.text.replace(/```json|```/g,'').trim()); } catch(e) { this._toast('格式有误，手动编辑'); this._openScriptEditor(); return; }
            this._openScriptEditor(script);
        } catch(e) { this._toast('网络错误'); }
    }

    // ==================== 开始Session ====================
    _startSession(script) {
        this._session = { id:'theater_'+Date.now(), script, messages:[], backstageMessages:[], createdAt:new Date().toISOString(), friendCode:window.chatInterface?.currentFriendCode||'', customCss:'' };
        this._active = true;
        this._saveCurrentSession();
        this._openTheaterUI();
    }

    // ==================== 剧场主界面 ====================
    _openTheaterUI() {
        if (!this._session) return;
        document.getElementById('theaterUI')?.remove();
        this._applyCustomCss(this._session.customCss||'');
        const s = this._session.script;
        const t = this._t();
        const ui = document.createElement('div');
        ui.id = 'theaterUI';
        ui.className = 'theater-ui theater-'+this._theme;
        ui.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;z-index:8500;display:flex;flex-direction:column;background:${t.bg};color:${t.text};`;

        ui.innerHTML = `
            <div class="theater-topbar" style="display:flex;align-items:center;padding:10px 14px;border-bottom:1px solid ${t.border};flex-shrink:0;">
                <button id="theaterExit" style="background:none;border:none;color:${t.sub};font-size:18px;cursor:pointer;">&#8592;</button>
                <div style="flex:1;text-align:center;">
                    <div class="theater-title" style="font-size:14px;font-weight:600;color:${t.text};">次元剧场</div>
                    <div style="font-size:10px;color:${t.sub};">${this._esc(s.charName)} & ${this._esc(s.userName)}</div>
                </div>
                <button id="theaterSettings" style="background:none;border:none;color:${t.sub};font-size:16px;cursor:pointer;">&#9881;</button>
            </div>

            <div id="theaterMessages" class="theater-messages" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px 16px;min-height:0;">
                ${this._session.messages.length===0 ? `<div class="theater-curtain" style="text-align:center;padding:30px 0;color:${t.sub};font-size:12px;line-height:1.8;">&#9670; 幕起 &#9670;<br>${this._esc(s.opening||'故事开始了...')}</div>` : ''}
                ${this._session.messages.map(m=>this._renderMsg(m,t)).join('')}
            </div>

            ${this._typing ? `<div class="theater-typing" style="padding:6px 16px;font-size:12px;color:${t.sub};font-style:italic;opacity:0.7;">${this._esc(s.charName)} 正在书写... &#9998;</div>` : ''}

            <div class="theater-inputbar" style="padding:10px 14px calc(10px + env(safe-area-inset-bottom));border-top:1px solid ${t.border};display:flex;gap:8px;flex-shrink:0;align-items:flex-end;">
                <button id="theaterOOC" class="theater-ooc-btn" style="padding:8px;border:none;border-radius:8px;background:${t.itemBg};color:${t.sub};font-size:11px;cursor:pointer;flex-shrink:0;">OOC</button>
                <textarea id="theaterInput" class="theater-input" rows="1" placeholder="以 ${this._esc(s.userName)} 的身份..." style="flex:1;padding:10px 12px;background:${t.itemBg};border:1px solid ${t.border};border-radius:10px;color:${t.text};font-size:14px;resize:none;font-family:inherit;max-height:100px;"></textarea>
                <button id="theaterSend" class="theater-send-btn" style="padding:8px 14px;border:none;border-radius:8px;background:rgba(240,147,43,0.15);color:#f0932b;font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0;">&#9654;</button>
            </div>`;

        document.body.appendChild(ui);
        ui.querySelector('#theaterExit')?.addEventListener('click', () => this._confirmExit('user'));
        ui.querySelector('#theaterSettings')?.addEventListener('click', () => this._openSettings());
        ui.querySelector('#theaterSend')?.addEventListener('click', () => this._send());
        ui.querySelector('#theaterInput')?.addEventListener('keydown', e => { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();this._send();} });
        ui.querySelector('#theaterOOC')?.addEventListener('click', () => this._openBackstage());
        this._scrollBottom();
    }

    // ==================== 渲染消息 ====================
    _renderMsg(msg, t) {
        if (msg.type==='system') return `<div class="theater-system-msg" style="text-align:center;padding:8px 0;font-size:11px;color:${t.sub};font-style:italic;">${this._esc(msg.text)}</div>`;

        const isChar = msg.type==='char';
        const name = isChar ? this._session.script.charName : this._session.script.userName;
        const nc = isChar ? '#f0932b' : 'rgba(100,180,255,0.8)';

        // 题头板块（#1改进：日期、时间、地点各一行，明显板块）
        let headerHtml = '';
        if (isChar && msg.header) {
            const h = msg.header;
            headerHtml = `<div class="theater-header-block" style="margin-bottom:10px;padding:12px 14px;background:${t.itemBg};border-radius:10px;border-left:3px solid ${nc};">
                <div class="theater-header-date" style="font-size:14px;font-weight:700;color:${t.text};letter-spacing:1px;">${this._esc(h.date||'')}</div>
                <div class="theater-header-time" style="font-size:12px;color:${t.sub};margin-top:3px;">${this._esc(h.time||'')}</div>
                <div class="theater-header-location" style="font-size:12px;color:${nc};margin-top:3px;">&#9673; ${this._esc(h.location||'未知地点')}</div>
            </div>`;
        }

        // 状态栏（4个折叠栏）
        let statusHtml = '';
        if (isChar && msg.status) {
            const st = msg.status;
            const charSt = [
                st.mood && `<div class="theater-status-item"><span class="theater-status-label">&#9829; 心情</span> ${this._esc(st.mood)}</div>`,
                st.outfit && `<div class="theater-status-item"><span class="theater-status-label">&#9734; 衣着</span> ${this._esc(st.outfit)}</div>`,
                st.action && `<div class="theater-status-item"><span class="theater-status-label">&#9654; 动作</span> ${this._esc(st.action)}</div>`,
                st.thought && `<div class="theater-status-item"><span class="theater-status-label">&#9826; 内心</span> <i>${this._esc(st.thought)}</i></div>`,
                st.note && `<div class="theater-status-item"><span class="theater-status-label">&#9998; 碎碎念</span> ${this._esc(st.note)}</div>`,
                st.relationship && `<div class="theater-status-item"><span class="theater-status-label">&#9734; 关系</span> ${this._esc(st.relationship)}</div>`
            ].filter(Boolean).join('');
            const randomSt = st.random ? `<div class="theater-status-item">${this._esc(st.random)}</div>` : '';
            const userSt = st.userFeeling ? `<div class="theater-status-item">${this._esc(st.userFeeling)}</div>` : '';
            const sysSt = st.systemNote ? `<div class="theater-status-item">${this._esc(st.systemNote)}</div>` : '';
            const fold = (label, content) => content ? `<details class="theater-status-fold"><summary style="font-size:10px;color:${t.sub};cursor:pointer;user-select:none;padding:3px 0;">${label}</summary><div class="theater-status-block" style="padding:8px 10px;background:${t.itemBg};border-radius:8px;border:1px solid ${t.border};font-size:11px;line-height:1.9;margin:4px 0;">${content}</div></details>` : '';

            const folds = [
                fold(`&#9660; ${this._esc(name)} 的状态`, charSt),
                fold('&#9660; 路人NPC', randomSt),
                fold(`&#9660; ${this._esc(this._session.script.userName)} 的感受`, userSt),
                fold('&#9660; 系统君', sysSt)
            ].filter(Boolean).join('');

            if (folds) statusHtml = `<div class="theater-status-area" style="margin-top:10px;">${folds}</div>`;
        }

        return `<div class="theater-msg ${isChar?'theater-msg-char':'theater-msg-user'}" style="margin-bottom:18px;">
            ${headerHtml}
            <div class="theater-msg-name" style="font-size:13px;font-weight:600;color:${nc};margin-bottom:4px;">${this._esc(name)}</div>
            <div class="theater-msg-text" style="font-size:14px;line-height:1.8;color:${t.text};white-space:pre-wrap;">${this._esc(msg.text)}</div>
            ${statusHtml}
        </div>`;
    }

    // ==================== 发送消息 ====================
    async _send() {
        const input = document.getElementById('theaterInput');
        const text = input?.value.trim();
        if (!text||this._typing) return;
        input.value = '';
        this._session.messages.push({ type:'user', text, timestamp:new Date().toISOString() });
        this._saveCurrentSession();
        this._typing = true;
        this._openTheaterUI(); // 显示typing提示

        const ci = window.chatInterface;
        if (!ci?.apiManager) { this._typing=false; this._openTheaterUI(); return; }
        const s = this._session.script;
        const now = new Date();
        const dateStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${'日一二三四五六'[now.getDay()]}`;
        const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        const friendName = ci.currentFriend?.nickname||ci.currentFriend?.name||'TA';

        // #5改进：皮下逻辑 — AI的皮下是friendName，演的是charName
        const sysPrompt = `【次元剧场 - 角色扮演】
你的皮下身份是「${friendName}」，但现在你在扮演一个全新角色「${s.charName}」。
这是角色扮演游戏，不是真实见面。你以${friendName}的身份"演"${s.charName}——${s.charName}是虚构的，不知道${friendName}的存在。
OOC（皮下沟通）时才用${friendName}的身份说话，正式剧本中只以${s.charName}的身份行动。

世界观：${s.world||'自由发挥'}
你的角色「${s.charName}」：${s.charPersona||'自由发挥'}
对方角色「${s.userName}」：${s.userPersona||'自由发挥'}
当前真实时间：${dateStr} ${timeStr}

回复格式（每行一个字段，严格遵守）：
DATE: 剧本中的年月日+星期（如：${dateStr}）
TIME: 剧本中的时间（如：${timeStr}）
LOCATION: 当前场景地点
TEXT: ${s.charName}的对话和动作描写（*星号*包裹动作）
MOOD: ${s.charName}的心情（颜文字+文字）
OUTFIT: ${s.charName}当前衣着
ACTION: ${s.charName}当前动作
THOUGHT: ${s.charName}的内心活动
NOTE: ${s.charName}的碎碎念（可选）
RELATIONSHIP: ${s.charName}对${s.userName}的关系感受
RANDOM_NPC: 场景中某个路人NPC的状态描写（可选）
USER_FEELING: 你觉得${s.userName}此刻的感受
SYSTEM_NOTE: 以系统君/旁白口吻给user说的一句话（可选）

特殊指令：
- 如果你（皮下的${friendName}）想结束角色扮演：[THEATER_END]理由
- 如果你想申请修改剧本设定：[SCRIPT_CHANGE_REQUEST]想改什么+理由`;

        const history = this._session.messages.slice(-20).map(m=>({type:m.type==='user'?'user':'ai',text:m.text}));
        try {
            const result = await ci.apiManager.callAI(history, sysPrompt);
            this._typing = false;
            if (!result.success) { this._openTheaterUI(); return; }
            const aiText = result.text.trim();
            // AI中断
            if (aiText.includes('[THEATER_END]')) {
                this._session.messages.push({type:'system',text:`${s.charName}（${friendName}的皮下）结束了角色扮演：${aiText.replace(/\[THEATER_END\]/,'').trim()}`});
                this._saveCurrentSession(); this._confirmExit('ai'); return;
            }
            // AI申请改设定
            if (aiText.includes('[SCRIPT_CHANGE_REQUEST]')) {
                const reason = aiText.replace(/\[SCRIPT_CHANGE_REQUEST\]/,'').trim();
                this._handleScriptChange(reason, 'ai'); return;
            }
            this._session.messages.push(this._parseResponse(aiText));
            this._saveCurrentSession();
            this._openTheaterUI();
        } catch(e) { this._typing=false; this._openTheaterUI(); }
    }

    // ==================== 解析AI回复 ====================
    _parseResponse(text) {
        const g = key => { const m=text.match(new RegExp(`^${key}:\\s*(.+)`,'m')); return m?m[1].trim():''; };
        return { type:'char', text:g('TEXT')||text, timestamp:new Date().toISOString(),
            header:{ date:g('DATE'), time:g('TIME'), location:g('LOCATION') },
            status:{ mood:g('MOOD'), outfit:g('OUTFIT'), action:g('ACTION'), thought:g('THOUGHT'), note:g('NOTE'), relationship:g('RELATIONSHIP'), random:g('RANDOM_NPC'), userFeeling:g('USER_FEELING'), systemNote:g('SYSTEM_NOTE') }
        };
    }

    // ==================== 退出确认 ====================
    async _confirmExit(who) {
        const s = this._session?.script;
        const friendName = window.chatInterface?.currentFriend?.name||'TA';
        const msg = who==='ai' ? `${s?.charName||'TA'}（皮下：${friendName}）想结束角色扮演。\n退出次元剧场？` : '退出次元剧场？剧本会自动保存。';
        const ok = window.zpConfirm ? await window.zpConfirm('次元剧场',msg,'退出','继续') : confirm(msg);
        if (!ok) { this._openTheaterUI(); return; }
        this._saveCurrentSession(); this._active=false;
        document.getElementById('theaterUI')?.remove();
        this._removeCustomCss();
    }

    // ==================== 皮下沟通OOC ====================
    _openBackstage() {
        document.getElementById('theaterOOCPanel')?.remove();
        const friendName = window.chatInterface?.currentFriend?.nickname||window.chatInterface?.currentFriend?.name||'TA';
        const msgs = this._session?.backstageMessages||[];
        const p = document.createElement('div');
        p.id = 'theaterOOCPanel';
        p.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9200;display:flex;flex-direction:column;background:rgba(0,0,0,0.92);backdrop-filter:blur(10px);';
        p.innerHTML = `
            <div style="display:flex;align-items:center;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;">
                <button id="oocClose" style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:18px;cursor:pointer;">&#8592;</button>
                <div style="flex:1;text-align:center;font-size:14px;color:rgba(255,255,255,0.6);">皮下沟通（OOC）</div>
            </div>
            <div id="oocMessages" style="flex:1;overflow-y:auto;padding:12px 16px;min-height:0;">
                <div style="text-align:center;padding:16px 0;font-size:11px;color:rgba(255,255,255,0.2);line-height:1.8;">以线上人设（${this._esc(friendName)} & 你本人）交流<br>不影响剧本进程</div>
                ${msgs.map(m=>`<div style="margin-bottom:10px;${m.type==='user'?'text-align:right;':''}">
                    <div style="font-size:10px;color:rgba(255,255,255,0.25);margin-bottom:2px;">${m.type==='user'?'你':this._esc(friendName)}</div>
                    <div style="display:inline-block;padding:8px 12px;border-radius:10px;background:${m.type==='user'?'rgba(100,180,255,0.12)':'rgba(255,255,255,0.06)'};color:rgba(255,255,255,0.7);font-size:13px;max-width:80%;text-align:left;">${this._esc(m.text)}</div>
                </div>`).join('')}
            </div>
            <div style="padding:10px 14px calc(10px + env(safe-area-inset-bottom));border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:8px;flex-shrink:0;">
                <textarea id="oocInput" rows="1" placeholder="以皮下身份说话..." style="flex:1;padding:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;font-size:14px;resize:none;font-family:inherit;"></textarea>
                <button id="oocSend" style="padding:8px 14px;border:none;border-radius:8px;background:rgba(240,147,43,0.15);color:#f0932b;font-size:13px;cursor:pointer;">发送</button>
            </div>`;
        document.body.appendChild(p);
        p.querySelector('#oocClose')?.addEventListener('click', ()=>p.remove());
        p.querySelector('#oocSend')?.addEventListener('click', ()=>this._sendOOC(p));
        p.querySelector('#oocInput')?.addEventListener('keydown', e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();this._sendOOC(p);}});
        setTimeout(()=>{const el=p.querySelector('#oocMessages');if(el)el.scrollTop=el.scrollHeight;},50);
    }

    async _sendOOC(panel) {
        const input = panel.querySelector('#oocInput');
        const text = input?.value.trim();
        if (!text) return;
        input.value = '';
        if (!this._session.backstageMessages) this._session.backstageMessages=[];
        this._session.backstageMessages.push({type:'user',text,timestamp:new Date().toISOString()});
        this._saveCurrentSession();
        panel.remove(); this._openBackstage();
        const ci = window.chatInterface;
        if (!ci?.apiManager) return;
        const friendName = ci.currentFriend?.nickname||ci.currentFriend?.name||'TA';
        const prompt = `你是${friendName}（皮下身份，线上人设）。user在次元剧场的间隙想跟你（真实的你，不是剧本角色）聊几句。用你平时的说话方式回复，简短自然。`;
        const history = this._session.backstageMessages.slice(-10).map(m=>({type:m.type,text:m.text}));
        try {
            const result = await ci.apiManager.callAI(history, prompt);
            if (result.success) { this._session.backstageMessages.push({type:'ai',text:result.text.trim(),timestamp:new Date().toISOString()}); this._saveCurrentSession(); document.getElementById('theaterOOCPanel')?.remove(); this._openBackstage(); }
        } catch(e){}
    }

    // ==================== #4改进：修改设定申请系统 ====================
    async _handleScriptChange(reason, from) {
        const s = this._session.script;
        const friendName = window.chatInterface?.currentFriend?.name||'TA';
        const fromName = from==='ai' ? `${s.charName}（${friendName}的皮下）` : '你';
        const msg = `${fromName} 申请修改剧本设定：\n\n${reason}\n\n同意修改吗？`;
        const ok = window.zpConfirm ? await window.zpConfirm('修改设定申请',msg,'同意','拒绝') : confirm(msg);
        if (ok) {
            this._session.messages.push({type:'system',text:`设定修改已通过：${reason}`});
            this._saveCurrentSession();
            this._openScriptEditor(this._session.script);
        } else {
            this._session.messages.push({type:'system',text:'设定修改申请被拒绝'});
            this._saveCurrentSession();
            this._typing = false;
            this._openTheaterUI();
        }
    }

    async _requestScriptChange() {
        const reason = window.zpPrompt ? await window.zpPrompt('申请修改设定','写明想改什么+理由\n需要TA（皮下）同意后才能改','','修改内容和理由') : prompt('修改理由：');
        if (!reason) return;
        this._session.messages.push({type:'system',text:`你申请修改设定：${reason}`});
        this._saveCurrentSession();
        const ci = window.chatInterface;
        if (!ci?.apiManager) return;
        this._toast('等待TA（皮下）决定...');
        const s = this._session.script;
        const prompt2 = `【皮下通信】user想修改次元剧场的设定。\n申请理由：${reason}\n当前世界观：${s.world}\n当前你的角色：${s.charName}(${s.charPersona})\nuser角色：${s.userName}(${s.userPersona})\n\n你觉得合理吗？只回复 APPROVE 或 REJECT:拒绝理由`;
        try {
            const result = await ci.apiManager.callAI([{type:'user',text:reason}], prompt2);
            if (result.success && result.text.trim().startsWith('APPROVE')) {
                this._toast('TA同意了修改');
                this._openScriptEditor(this._session.script);
            } else {
                const rr = (result.text||'').replace(/^REJECT:?/,'').trim();
                this._session.messages.push({type:'system',text:`TA拒绝了修改${rr?'：'+rr:''}`});
                this._saveCurrentSession(); this._openTheaterUI();
            }
        } catch(e){ this._openTheaterUI(); }
    }

    // ==================== 设置面板（#3改进：自定义CSS+类名参考） ====================
    _openSettings() {
        document.getElementById('theaterSettingsPanel')?.remove();
        const p = document.createElement('div');
        p.id = 'theaterSettingsPanel';
        p.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9200;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0.5);';
        p.innerHTML = `<div style="width:100%;background:#1a1a1a;border-radius:16px 16px 0 0;padding:20px 16px calc(16px + env(safe-area-inset-bottom));max-height:75vh;overflow-y:auto;animation:profileSlideUp 0.25s ease-out;">
            <div style="font-size:16px;font-weight:600;color:#fff;text-align:center;margin-bottom:16px;">剧场设置</div>

            <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-bottom:6px;">主题</div>
            <div style="display:flex;gap:8px;margin-bottom:16px;">
                ${['dark','light','scifi'].map(th=>`<button class="ts-theme" data-t="${th}" style="flex:1;padding:10px;border:1px solid ${this._theme===th?'rgba(240,147,43,0.4)':'rgba(255,255,255,0.06)'};border-radius:10px;background:${this._theme===th?'rgba(240,147,43,0.1)':'rgba(255,255,255,0.03)'};color:${this._theme===th?'#f0932b':'rgba(255,255,255,0.5)'};font-size:13px;cursor:pointer;">${{dark:'深色',light:'浅色',scifi:'科幻'}[th]}</button>`).join('')}
            </div>

            <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-bottom:6px;">自定义CSS美化</div>
            <details style="margin-bottom:8px;">
                <summary style="font-size:10px;color:rgba(255,255,255,0.2);cursor:pointer;">&#9660; 查看完整类名参考</summary>
                <div style="font-size:9px;color:rgba(255,255,255,0.15);line-height:1.8;font-family:monospace;margin-top:4px;padding:8px;background:rgba(255,255,255,0.02);border-radius:6px;">
.theater-ui（剧场整体）、.theater-topbar（顶栏）、.theater-title（标题）、.theater-messages（消息区）、.theater-msg（单条消息）、.theater-msg-char（AI角色消息）、.theater-msg-user（用户角色消息）、.theater-msg-name（角色名）、.theater-msg-text（正文）、.theater-header-block（题头板块）、.theater-header-date（题头日期）、.theater-header-time（题头时间）、.theater-header-location（题头地点）、.theater-status-fold（状态折叠栏）、.theater-status-block（状态内容）、.theater-status-item（单条状态）、.theater-status-label（状态标签）、.theater-inputbar（输入栏）、.theater-input（输入框）、.theater-send-btn（发送按钮）、.theater-ooc-btn（OOC按钮）、.theater-typing（正在输入提示）、.theater-curtain（幕起）、.theater-system-msg（系统消息）、.theater-dark / .theater-light / .theater-scifi（主题类）、.theater-status-area（状态栏区域）
                </div>
            </details>
            <textarea id="tsCssInput" rows="3" placeholder="自定义CSS..." style="width:100%;padding:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#fff;font-size:11px;font-family:monospace;resize:vertical;box-sizing:border-box;margin-bottom:8px;">${this._esc(this._session?.customCss||'')}</textarea>
            <div style="display:flex;gap:8px;margin-bottom:14px;">
                <button id="tsCssApply" style="flex:1;padding:8px;border:none;border-radius:8px;background:rgba(240,147,43,0.12);color:#f0932b;font-size:12px;cursor:pointer;">应用CSS</button>
                <button id="tsCssClear" style="padding:8px 12px;border:none;border-radius:8px;background:rgba(255,60,60,0.08);color:rgba(255,100,100,0.5);font-size:12px;cursor:pointer;">清除</button>
            </div>

            <button id="tsViewScript" style="width:100%;padding:12px;border:1px solid rgba(255,255,255,0.06);border-radius:10px;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.5);font-size:13px;cursor:pointer;margin-bottom:8px;">查看剧本设定</button>
            <button id="tsRequestChange" style="width:100%;padding:12px;border:1px solid rgba(100,180,255,0.15);border-radius:10px;background:rgba(100,180,255,0.05);color:rgba(100,180,255,0.6);font-size:13px;cursor:pointer;margin-bottom:8px;">申请修改设定</button>
            <button id="tsExit" style="width:100%;padding:12px;border:1px solid rgba(255,60,60,0.15);border-radius:10px;background:rgba(255,60,60,0.05);color:rgba(255,100,100,0.6);font-size:13px;cursor:pointer;margin-bottom:8px;">退出剧场</button>
            <button id="tsClose" style="width:100%;padding:10px;border:none;background:transparent;color:rgba(255,255,255,0.2);font-size:13px;cursor:pointer;">关闭</button>
        </div>`;
        document.body.appendChild(p);
        p.querySelectorAll('.ts-theme').forEach(b=>b.addEventListener('click',()=>{this._theme=b.dataset.t;p.remove();this._openTheaterUI();}));
        p.querySelector('#tsCssApply')?.addEventListener('click',()=>{const css=p.querySelector('#tsCssInput')?.value||'';if(this._session)this._session.customCss=css;this._saveCurrentSession();this._applyCustomCss(css);this._toast('CSS已应用');});
        p.querySelector('#tsCssClear')?.addEventListener('click',()=>{if(this._session)this._session.customCss='';this._saveCurrentSession();this._removeCustomCss();p.querySelector('#tsCssInput').value='';this._toast('CSS已清除');});
        p.querySelector('#tsViewScript')?.addEventListener('click',()=>{p.remove();this._viewScript();});
        p.querySelector('#tsRequestChange')?.addEventListener('click',()=>{p.remove();this._requestScriptChange();});
        p.querySelector('#tsExit')?.addEventListener('click',()=>{p.remove();this._confirmExit('user');});
        p.querySelector('#tsClose')?.addEventListener('click',()=>p.remove());
    }

    // ==================== 查看剧本 ====================
    _viewScript() {
        const s = this._session?.script; if(!s) return;
        document.getElementById('theaterScriptView')?.remove();
        const ov = document.createElement('div');
        ov.id = 'theaterScriptView';
        ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9300;background:#111;display:flex;flex-direction:column;';
        const sec = (l,v) => `<div style="margin-bottom:16px;"><div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:4px;">${l}</div><div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;white-space:pre-wrap;">${this._esc(v||'未设定')}</div></div>`;
        ov.innerHTML = `<div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;">
            <button id="svBack" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:20px;cursor:pointer;">&#8592;</button>
            <div style="flex:1;font-size:16px;font-weight:600;color:#fff;text-align:center;">剧本设定</div>
        </div><div style="flex:1;overflow-y:auto;padding:16px;min-height:0;">
            ${sec('世界观',s.world)}${sec(s.charName+' 的人设',s.charPersona)}${sec(s.userName+' 的人设',s.userPersona)}${sec('开场情境',s.opening)}
        </div>`;
        document.body.appendChild(ov);
        ov.querySelector('#svBack')?.addEventListener('click',()=>{ov.remove();this._openSettings();});
    }

    // ==================== 主题/CSS/存档/工具 ====================
    _t() { return {dark:{bg:'#0d0d0d',text:'#e0e0e0',sub:'rgba(255,255,255,0.3)',border:'rgba(255,255,255,0.05)',itemBg:'rgba(255,255,255,0.04)'},light:{bg:'#f5f5f0',text:'#222',sub:'rgba(0,0,0,0.35)',border:'rgba(0,0,0,0.08)',itemBg:'rgba(0,0,0,0.03)'},scifi:{bg:'#050a15',text:'#a0d4ff',sub:'rgba(100,180,255,0.3)',border:'rgba(0,150,255,0.1)',itemBg:'rgba(0,100,255,0.05)'}}[this._theme]||{bg:'#0d0d0d',text:'#e0e0e0',sub:'rgba(255,255,255,0.3)',border:'rgba(255,255,255,0.05)',itemBg:'rgba(255,255,255,0.04)'}; }
    _applyCustomCss(css) { this._removeCustomCss(); if(css){const el=document.createElement('style');el.id='theaterCustomCss';el.textContent=css;document.head.appendChild(el);} }
    _removeCustomCss() { document.getElementById('theaterCustomCss')?.remove(); }
    _saveCurrentSession() { if(!this._session)return; const ci=window.chatInterface; if(!ci?.storage)return; const data=ci.storage.getIntimacyData(this._session.friendCode); if(!data.theaterSessions)data.theaterSessions=[]; const idx=data.theaterSessions.findIndex(s=>s.id===this._session.id); if(idx>=0)data.theaterSessions[idx]=this._session; else data.theaterSessions.push(this._session); ci.storage.saveIntimacyData(this._session.friendCode,data); }
    _hasSavedSessions() { const ci=window.chatInterface; if(!ci?.storage||!ci.currentFriendCode) return false; return ((ci.storage.getIntimacyData(ci.currentFriendCode).theaterSessions||[]).length>0); }
    _loadSavedSession() { const ci=window.chatInterface; if(!ci?.storage)return; const ss=ci.storage.getIntimacyData(ci.currentFriendCode).theaterSessions||[]; if(!ss.length){this._toast('没有存档');return;} this._session=ss[ss.length-1]; this._active=true; this._openTheaterUI(); }
    _scrollBottom() { setTimeout(()=>{const el=document.getElementById('theaterMessages');if(el)el.scrollTop=el.scrollHeight;},50); }
    _esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    _toast(msg) { window.chatInterface?.showCssToast?.(msg)||alert(msg); }
}

window.theaterMode = new TheaterMode();
